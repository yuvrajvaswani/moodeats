const {
  searchRecipes,
  filterByCategory,
  lookupById,
  parseIngredients,
  mapRecipeCard,
  toInstructionSteps,
  estimateCookingTime,
  fetchMealDb,
} = require("./themealdbService");
const { calculateMacros } = require("./macroCalculator");
const { generateAiRecipe, getAiRecipeById } = require("./aiRecipeGenerator");
const { rankRecipes } = require("./recommendationEngine");
const {
  getCatalogRecipesByIntent,
  getCatalogRecipesByIngredients,
  getCatalogRecipesByCuisine,
  getCatalogRecipeById,
} = require("./recipeCatalogService");

const FEED_CACHE_TTL_MS = 1000 * 60 * 5;
const feedCache = new Map();

const normalizeSeed = (seed) => {
  const parsed = Number(seed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const seededRandomFactory = (seed) => {
  let t = (seed >>> 0) + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = (items = [], seed) => {
  const list = Array.isArray(items) ? [...items] : [];
  const normalizedSeed = normalizeSeed(seed);
  if (normalizedSeed === null || list.length < 2) {
    return list;
  }

  const random = seededRandomFactory(normalizedSeed);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
};

const intentStrategy = {
  muscle_gain: { categories: ["Beef", "Chicken", "Seafood"], query: "chicken" },
  weight_loss: { categories: ["Vegetarian", "Seafood"], query: "salad" },
  healthy_eating: { categories: ["Vegetarian", "Seafood", "Chicken"], query: "healthy" },
  quick_meal: { categories: ["Breakfast", "Pasta", "Side"], query: "quick" },
  comfort_food: { categories: ["Beef", "Pork", "Pasta"], query: "stew" },
  junk_food: { categories: ["Pork", "Beef", "Pasta"], query: "burger" },
  tasty_food: { categories: ["Seafood", "Chicken", "Dessert"], query: "spicy" },
  ingredient_search: { categories: ["Chicken", "Vegetarian", "Breakfast"], query: "egg" },
};

const dedupeById = (recipes) => {
  const map = new Map();
  recipes.forEach((recipe) => map.set(String(recipe.idMeal || recipe.id), recipe));
  return Array.from(map.values());
};

const macroToCard = (macros) => ({
  estimatedCalories: macros.calories,
  estimatedProtein: macros.protein,
});

const enrichCardFromMeal = (meal, intent) => {
  const ingredients = parseIngredients(meal);
  const macros = calculateMacros(ingredients, 2);

  return {
    ...mapRecipeCard(meal),
    intentMatch: intent,
    ingredients,
    estimatedCalories: macroToCard(macros).estimatedCalories,
    estimatedProtein: macroToCard(macros).estimatedProtein,
    isAIGenerated: false,
  };
};

const enrichCardFromCatalog = (recipe, intent) => {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const macros = recipe.macros || calculateMacros(ingredients, 2);

  return {
    id: String(recipe.externalId || recipe.id || ""),
    name: recipe.title,
    title: recipe.title,
    image: recipe.image || "",
    category: recipe.category || "Recipe",
    readyInMinutes: Number(recipe.readyInMinutes || 25),
    cookingTime: Number(recipe.readyInMinutes || 25),
    intentMatch: intent,
    ingredients,
    estimatedCalories: macros.calories,
    estimatedProtein: macros.protein,
    isAIGenerated: false,
    area: recipe.area || "",
  };
};

const dedupeCardsById = (recipes = []) => {
  const map = new Map();
  (recipes || []).forEach((recipe) => {
    const key = String(recipe.id || recipe.idMeal || "");
    if (key) {
      map.set(key, recipe);
    }
  });
  return Array.from(map.values());
};

const getCached = (key) => {
  const item = feedCache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > FEED_CACHE_TTL_MS) {
    feedCache.delete(key);
    return null;
  }
  return item.value;
};

const setCached = (key, value) => {
  feedCache.set(key, { ts: Date.now(), value });
};

const fallbackToAiRecipes = async ({ intent, queryText, ingredients, countNeeded }) => {
  const generated = [];
  const loops = Math.max(1, countNeeded);

  for (let i = 0; i < loops; i += 1) {
    const aiRecipe = await generateAiRecipe({
      intent,
      query: queryText,
      ingredients: ingredients || [],
    });
    generated.push(aiRecipe);
  }

  return generated;
};

const getRecipesByIntent = async ({ intent, queryText, profile, favorites }) => {
  const strategy = intentStrategy[intent] || intentStrategy.tasty_food;
  const normalizedQuery = String(queryText || "").trim();
  const searchTerm = normalizedQuery || strategy.query || "chicken";

  const catalogMatches = await getCatalogRecipesByIntent({
    intent,
    queryText: searchTerm,
    limit: 140,
  });

  let cards = (catalogMatches || []).map((recipe) => enrichCardFromCatalog(recipe, intent));

  try {
    const byCategoryArrays = await Promise.all(
      strategy.categories.map(async (category) => {
        const meals = await filterByCategory(category);
        return meals.slice(0, 8);
      })
    );

    const byQuery = await searchRecipes(searchTerm);
    const merged = dedupeById([...byQuery.slice(0, 12), ...byCategoryArrays.flat()]).slice(0, 40);

    const fullMeals = await Promise.all(
      merged.map(async (meal) => {
        const full = await lookupById(meal.idMeal || meal.id);
        return full || meal;
      })
    );

    const externalCards = fullMeals.map((meal) => enrichCardFromMeal(meal, intent));
    cards = dedupeCardsById([...cards, ...externalCards]);
  } catch (error) {
    // External provider unavailable; keep catalog-only results.
  }

  if (cards.length < 3) {
    const aiRecipes = await fallbackToAiRecipes({
      intent,
      queryText,
      countNeeded: 3 - cards.length,
    });
    cards = [...cards, ...aiRecipes];
  }

  const ranked = rankRecipes({ recipes: cards, profile, favorites });

  return {
    intent,
    recipes: ranked,
  };
};

const getRecipesByIntents = async ({ intents = [], queryText = "", profile, favorites }) => {
  const normalized = Array.from(new Set((intents || []).filter(Boolean)));
  const effectiveIntents = normalized.length > 0 ? normalized : ["tasty_food"];

  const results = await Promise.all(
    effectiveIntents.map((intent) => getRecipesByIntent({ intent, queryText, profile, favorites }))
  );

  const mergedMap = new Map();
  results.forEach((result) => {
    (result.recipes || []).forEach((recipe) => {
      const key = String(recipe.id);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          ...recipe,
          intentMatches: [result.intent],
        });
      } else {
        const current = mergedMap.get(key);
        current.intentMatches = Array.from(new Set([...(current.intentMatches || []), result.intent]));
        mergedMap.set(key, current);
      }
    });
  });

  const merged = Array.from(mergedMap.values()).map((recipe) => ({
    ...recipe,
    intentMatch: (recipe.intentMatches || []).join("+") || recipe.intentMatch,
  }));

  const ranked = rankRecipes({ recipes: merged, profile, favorites });
  return {
    intents: effectiveIntents,
    recipes: ranked,
  };
};

const getRecipesByIngredients = async (ingredients = [], profile, favorites) => {
  const list = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (list.length === 0) {
    return { ingredients: [], recipes: [] };
  }

  let scored = [];

  const catalogMatches = await getCatalogRecipesByIngredients(list, 180);
  if ((catalogMatches || []).length > 0) {
    scored = catalogMatches
      .map((recipe) => {
        const ingredientsInMeal = (recipe.ingredients || []).map((item) => String(item.name || "").toLowerCase());
        const matched = list.filter((ing) => ingredientsInMeal.some((i) => i.includes(ing.toLowerCase()))).length;
        return {
          recipe,
          matched,
        };
      })
      .filter((x) => x.matched > 0)
      .sort((a, b) => b.matched - a.matched)
      .slice(0, 80)
      .map((entry) => ({
        ...enrichCardFromCatalog(entry.recipe, "ingredient_search"),
        ingredientMatchCount: entry.matched,
      }));
  }

  try {
    const seed = list[0];
    const byIngredient = await fetchMealDb(`/filter.php?i=${encodeURIComponent(seed)}`);
    const candidates = Array.isArray(byIngredient.meals) ? byIngredient.meals.slice(0, 30) : [];

    const fullMeals = await Promise.all(
      candidates.map(async (meal) => {
        const full = await lookupById(meal.idMeal);
        return full || meal;
      })
    );

    const externalScored = fullMeals
      .map((meal) => {
        const ingredientsInMeal = parseIngredients(meal).map((item) => item.name.toLowerCase());
        const matched = list.filter((ing) => ingredientsInMeal.some((i) => i.includes(ing.toLowerCase()))).length;
        return { meal, matched };
      })
      .filter((x) => x.matched > 0)
      .sort((a, b) => b.matched - a.matched)
      .slice(0, 20)
      .map((entry) => ({
        ...enrichCardFromMeal(entry.meal, "ingredient_search"),
        ingredientMatchCount: entry.matched,
      }));

    scored = dedupeCardsById([...scored, ...externalScored]);
  } catch (error) {
    // External provider unavailable; keep catalog-only matches.
  }

  if (scored.length < 3) {
    const aiRecipes = await fallbackToAiRecipes({
      intent: "ingredient_search",
      ingredients: list,
      queryText: `Use these ingredients: ${list.join(", ")}`,
      countNeeded: 3 - scored.length,
    });
    scored = [...scored, ...aiRecipes];
  }

  const ranked = rankRecipes({ recipes: scored, profile, favorites });
  return { ingredients: list, recipes: ranked };
};

const cuisineAreaMap = {
  italian: "Italian",
  mexican: "Mexican",
  indian: "Indian",
  japanese: "Japanese",
  thai: "Thai",
  mediterranean: "Greek",
};

const getRecipesByCuisine = async ({ cuisine = "Italian", profile, favorites }) => {
  const key = String(cuisine || "Italian").trim().toLowerCase();
  const area = cuisineAreaMap[key] || String(cuisine || "Italian");

  const catalogMatches = await getCatalogRecipesByCuisine({ cuisine: area, limit: 140 });
  let cards = (catalogMatches || []).map((recipe) => ({
    ...enrichCardFromCatalog(recipe, `cuisine:${area}`),
    cuisineArea: area,
  }));

  try {
    const byArea = await fetchMealDb(`/filter.php?a=${encodeURIComponent(area)}`);
    const candidates = Array.isArray(byArea.meals) ? byArea.meals.slice(0, 40) : [];

    const fullMeals = await Promise.all(
      candidates.map(async (meal) => {
        const full = await lookupById(meal.idMeal);
        return full || meal;
      })
    );

    const externalCards = fullMeals.map((meal) => ({
      ...enrichCardFromMeal(meal, `cuisine:${area}`),
      cuisineArea: area,
    }));

    cards = dedupeCardsById([...cards, ...externalCards]);
  } catch (error) {
    // External provider unavailable; keep catalog-only cuisine matches.
  }

  if (cards.length < 6) {
    const fallback = await getRecipesByIntent({
      intent: "tasty_food",
      queryText: `${area} cuisine`,
      profile,
      favorites,
    });
    cards = [...cards, ...(fallback.recipes || [])];
  }

  const ranked = rankRecipes({ recipes: cards, profile, favorites });
  return {
    cuisine: area,
    recipes: ranked,
  };
};

const getRecipeDetailsById = async (id) => {
  if (String(id).startsWith("ai-")) {
    const aiRecipe = getAiRecipeById(id);
    if (!aiRecipe) return null;
    return {
      id: aiRecipe.id,
      title: aiRecipe.title,
      image: aiRecipe.image,
      category: aiRecipe.category,
      area: "AI",
      cookingTime: aiRecipe.readyInMinutes || 25,
      servings: 2,
      ingredients: aiRecipe.ingredients || [],
      instructions: aiRecipe.instructions || [],
      sourceUrl: "",
      macros: aiRecipe.macros || calculateMacros(aiRecipe.ingredients || [], 2),
      isAIGenerated: true,
    };
  }

  const catalogRecipe = await getCatalogRecipeById(id);
  if (catalogRecipe) {
    const ingredients = Array.isArray(catalogRecipe.ingredients) ? catalogRecipe.ingredients : [];
    return {
      id: String(catalogRecipe.externalId),
      title: catalogRecipe.title,
      image: catalogRecipe.image,
      category: catalogRecipe.category,
      area: catalogRecipe.area,
      cookingTime: Number(catalogRecipe.readyInMinutes || 25),
      servings: 2,
      ingredients,
      instructions: Array.isArray(catalogRecipe.instructions) ? catalogRecipe.instructions : [],
      sourceUrl: catalogRecipe.sourceUrl || "",
      macros: catalogRecipe.macros || calculateMacros(ingredients, 2),
    };
  }

  let meal = null;
  try {
    meal = await lookupById(id);
  } catch (error) {
    meal = null;
  }
  if (!meal) return null;

  const ingredients = parseIngredients(meal);
  const instructions = toInstructionSteps(meal.strInstructions);

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory,
    area: meal.strArea,
    cookingTime: estimateCookingTime(meal),
    servings: 2,
    ingredients,
    instructions,
    sourceUrl: meal.strSource || "",
    macros: calculateMacros(ingredients, 2),
  };
};

const buildDiscoveryFeed = async ({ page = 1, limit = 12, intent = "tasty_food", intents = [], queryText = "", profile, favorites, seed = null }) => {
  const effectiveIntents = Array.from(new Set((intents || []).filter(Boolean)));
  const cacheIntentKey = effectiveIntents.length > 0 ? effectiveIntents.join(",") : intent;
  const normalizedSeed = normalizeSeed(seed);
  const cacheKey = `${page}|${limit}|${cacheIntentKey}|${queryText}|${normalizedSeed ?? "noseed"}`.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const recommendation = effectiveIntents.length > 1
    ? await getRecipesByIntents({ intents: effectiveIntents, queryText, profile, favorites })
    : ((effectiveIntents[0] || intent) === "ingredient_search"
      ? await getRecipesByIngredients(queryText.split(","), profile, favorites)
      : await getRecipesByIntent({ intent: effectiveIntents[0] || intent, queryText, profile, favorites }));

  const start = (page - 1) * limit;
  const end = start + limit;
  const orderedRecipes = normalizedSeed === null
    ? recommendation.recipes
    : shuffleWithSeed(recommendation.recipes, normalizedSeed);

  let items = orderedRecipes.slice(start, end);

  if (items.length < Math.max(3, Math.ceil(limit / 3))) {
    const aiExtra = await fallbackToAiRecipes({
      intent: effectiveIntents[0] || intent,
      queryText,
      countNeeded: Math.max(3, Math.ceil(limit / 3)) - items.length,
    });
    items = [...items, ...aiExtra];
  }

  const response = {
    page,
    limit,
    hasMore: orderedRecipes.length > end,
    items,
    sourceCounts: {
      api: items.filter((x) => !x.isAIGenerated).length,
      ai: items.filter((x) => x.isAIGenerated).length,
    },
  };

  setCached(cacheKey, response);
  return response;
};

module.exports = {
  getRecipesByIntent,
  getRecipesByIntents,
  getRecipesByIngredients,
  getRecipesByCuisine,
  getRecipeDetailsById,
  buildDiscoveryFeed,
  fallbackToAiRecipes,
  normalizeSeed,
  shuffleWithSeed,
  intentStrategy,
};
