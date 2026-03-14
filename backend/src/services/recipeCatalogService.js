const RecipeCatalog = require("../models/RecipeCatalog");

const catalogIntentStrategy = {
  muscle_gain: { categories: ["Beef", "Chicken", "Seafood"], keywords: ["protein", "muscle", "chicken", "beef"] },
  weight_loss: { categories: ["Vegetarian", "Seafood"], keywords: ["light", "salad", "lean", "healthy"] },
  healthy_eating: { categories: ["Vegetarian", "Seafood", "Chicken"], keywords: ["healthy", "balanced", "fresh"] },
  quick_meal: { categories: ["Breakfast", "Pasta", "Side"], keywords: ["quick", "easy", "simple", "fast"] },
  comfort_food: { categories: ["Beef", "Pork", "Pasta"], keywords: ["comfort", "hearty", "warm", "stew"] },
  junk_food: { categories: ["Pork", "Beef", "Pasta"], keywords: ["burger", "fries", "crispy", "indulgent"] },
  tasty_food: { categories: ["Seafood", "Chicken", "Dessert"], keywords: ["tasty", "flavor", "spicy", "delicious"] },
  ingredient_search: { categories: ["Chicken", "Vegetarian", "Breakfast"], keywords: ["ingredient", "home", "fridge"] },
};

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2)
    .slice(0, 10);

const buildSearchableText = (recipe) => {
  const ingredients = (recipe.ingredients || []).map((i) => i.name).join(" ");
  const tags = (recipe.tags || []).join(" ");
  return [recipe.title, recipe.category, recipe.area, tags, ingredients].filter(Boolean).join(" ").toLowerCase();
};

const isLocalFallbackRecipe = (recipe) => String(recipe?.externalId || "").startsWith("local-food-");

const preferExternalRecipes = (recipes = [], targetLimit = 120) => {
  const external = (recipes || []).filter((item) => !isLocalFallbackRecipe(item));
  const local = (recipes || []).filter((item) => isLocalFallbackRecipe(item));
  return [...external, ...local].slice(0, targetLimit);
};

const getCatalogRecipesByIntent = async ({ intent, queryText = "", limit = 120 }) => {
  const strategy = catalogIntentStrategy[intent] || catalogIntentStrategy.tasty_food;
  const queryTokens = tokenize(queryText);
  const keywords = Array.from(new Set([...(strategy.keywords || []), ...queryTokens]));

  const filters = [];
  if ((strategy.categories || []).length > 0) {
    filters.push({ category: { $in: strategy.categories } });
  }

  if (keywords.length > 0) {
    const regex = new RegExp(keywords.join("|"), "i");
    filters.push({ searchableText: regex });
  }

  const targetLimit = Math.max(20, limit);
  const mongoFilter = filters.length > 0 ? { $or: filters } : {};
  const primary = await RecipeCatalog.find(mongoFilter).limit(targetLimit).lean();

  if (primary.length >= Math.min(40, targetLimit)) {
    return preferExternalRecipes(primary, targetLimit);
  }

  const seen = new Set(primary.map((item) => String(item.externalId)));
  let extra = [];

  if (queryTokens.length > 0) {
    const tokenRegex = new RegExp(queryTokens.join("|"), "i");
    const queryMatches = await RecipeCatalog.find({ searchableText: tokenRegex }).limit(targetLimit).lean();
    extra = queryMatches.filter((item) => !seen.has(String(item.externalId)));
    extra.forEach((item) => seen.add(String(item.externalId)));
  }

  if (primary.length + extra.length < targetLimit) {
    const remaining = targetLimit - (primary.length + extra.length);
    const randomMatches = await RecipeCatalog.aggregate([{ $sample: { size: remaining } }]);
    const randomExtra = (randomMatches || []).filter((item) => !seen.has(String(item.externalId)));
    extra = [...extra, ...randomExtra];
  }

  return preferExternalRecipes([...primary, ...extra], targetLimit);
};

const getCatalogRecipesByIngredients = async (ingredients = [], limit = 120) => {
  const normalized = (ingredients || [])
    .map((x) => String(x || "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  if (normalized.length === 0) {
    return [];
  }

  const regex = new RegExp(normalized.join("|"), "i");
  const targetLimit = Math.max(20, limit);
  const list = await RecipeCatalog.find({ searchableText: regex }).limit(targetLimit).lean();
  return preferExternalRecipes(list, targetLimit);
};

const getCatalogRecipesByCuisine = async ({ cuisine, limit = 120 }) => {
  const normalized = String(cuisine || "").trim();
  if (!normalized) {
    return [];
  }

  const targetLimit = Math.max(20, limit);
  const list = await RecipeCatalog.find({ area: new RegExp(`^${normalized}$`, "i") }).limit(targetLimit).lean();
  return preferExternalRecipes(list, targetLimit);
};

const getCatalogRecipeById = async (id) => {
  const externalId = String(id || "").trim();
  if (!externalId) return null;
  return RecipeCatalog.findOne({ externalId }).lean();
};

module.exports = {
  buildSearchableText,
  getCatalogRecipesByIntent,
  getCatalogRecipesByIngredients,
  getCatalogRecipesByCuisine,
  getCatalogRecipeById,
};
