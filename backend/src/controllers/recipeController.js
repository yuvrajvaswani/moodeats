const {
  getRecipeDetailsById,
  buildDiscoveryFeed,
  fallbackToAiRecipes,
  getRecipesByCuisine,
  normalizeSeed,
  shuffleWithSeed,
} = require("../services/recipeRecommendationService");
const { generateHealthyRecipe } = require("../services/assistantFunctions");
const { getPreferenceSummary, getProfile, recordUserInteraction } = require("../services/userPreferenceService");

const feedbackStore = new Map();
const savedStore = new Map();

const getRecipeDetails = async (req, res) => {
  try {
    const recipe = await getRecipeDetailsById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const healthy = await generateHealthyRecipe(recipe);
    recordUserInteraction(req.user?.id, {
      type: "view_recipe",
      recipeId: recipe.id,
      category: recipe.category,
      cuisine: recipe.area,
      ingredients: recipe.ingredients.map((x) => x.name),
    });
    return res.json({ regular: recipe, healthy });
  } catch (error) {
    return res.status(502).json({ message: "Could not load recipe details", detail: error.message });
  }
};

const getRecipeFeed = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Math.max(6, Number(req.query.limit) || 12));
    const intent = String(req.query.intent || "tasty_food");
    const q = String(req.query.q || "");
    const seed = normalizeSeed(req.query.seed);

    const feed = await buildDiscoveryFeed({
      page,
      limit,
      intent,
      queryText: q,
      profile: getProfile(req.user?.id),
      favorites: getPreferenceSummary(req.user?.id),
      seed,
    });

    return res.json(feed);
  } catch (error) {
    return res.status(500).json({ message: "Could not load recipe feed", detail: error.message });
  }
};

const getCuisineFeed = async (req, res) => {
  try {
    const cuisine = String(req.query.cuisine || "Italian");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Math.max(6, Number(req.query.limit) || 12));
    const seed = normalizeSeed(req.query.seed);

    const result = await getRecipesByCuisine({
      cuisine,
      profile: getProfile(req.user?.id),
      favorites: getPreferenceSummary(req.user?.id),
    });

    const orderedRecipes = seed === null ? (result.recipes || []) : shuffleWithSeed(result.recipes || [], seed);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = orderedRecipes.slice(start, end);

    return res.json({
      cuisine: result.cuisine,
      page,
      limit,
      hasMore: orderedRecipes.length > end,
      items,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load cuisine feed", detail: error.message });
  }
};

const generateRecipe = async (req, res) => {
  try {
    const ingredients = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
    const intent = String(req.body?.intent || "tasty_food");
    const query = String(req.body?.query || "");

    const aiRecipes = await fallbackToAiRecipes({
      intent,
      queryText: query,
      ingredients,
      countNeeded: 1,
    });

    return res.json({ recipe: aiRecipes[0] || null });
  } catch (error) {
    return res.status(500).json({ message: "Could not generate AI recipe", detail: error.message });
  }
};

const postRecipeFeedback = (req, res) => {
  try {
    const userId = String(req.user?.id || "guest");
    const recipeId = String(req.body?.recipeId || req.body?.foodId || "");
    const action = String(req.body?.action || "").trim().toLowerCase();

    if (!recipeId || !["like", "dislike"].includes(action)) {
      return res.status(400).json({ message: "Invalid feedback payload" });
    }

    if (!feedbackStore.has(userId)) {
      feedbackStore.set(userId, new Map());
    }

    feedbackStore.get(userId).set(recipeId, action);
    return res.json({ message: "Feedback recorded", feedback: { recipeId, action } });
  } catch (error) {
    return res.status(400).json({ message: "Could not save feedback", detail: error.message });
  }
};

const toggleSavedRecipe = (req, res) => {
  try {
    const userId = String(req.user?.id || "guest");
    const recipeId = String(req.body?.recipeId || req.body?.foodId || "");
    const recipe = req.body?.recipe || {};

    if (!recipeId) {
      return res.status(400).json({ message: "Invalid recipeId" });
    }

    if (!savedStore.has(userId)) {
      savedStore.set(userId, new Map());
    }

    const userSaved = savedStore.get(userId);

    if (userSaved.has(recipeId)) {
      userSaved.delete(recipeId);
      return res.json({ message: "Recipe removed", saved: { recipeId, saved: false } });
    }

    userSaved.set(recipeId, {
      id: recipeId,
      title: recipe.title || recipe.name || `Recipe #${recipeId}`,
      image: recipe.image || "",
      cookingTime: Number(recipe.readyInMinutes || recipe.cookingTime || 25),
      category: recipe.category || "recipe",
      estimatedCalories: recipe.estimatedCalories || "--",
      estimatedProtein: recipe.estimatedProtein || "--",
    });

    recordUserInteraction(req.user?.id, {
      type: "save_recipe",
      recipeId,
      category: recipe.category,
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map((x) => (x.name ? x.name : String(x)))
        : [],
    });

    return res.json({ message: "Recipe saved", saved: { recipeId, saved: true } });
  } catch (error) {
    return res.status(400).json({ message: "Could not toggle save", detail: error.message });
  }
};

const getSavedRecipes = (req, res) => {
  const userId = String(req.user?.id || "guest");
  const saved = savedStore.has(userId) ? Array.from(savedStore.get(userId).values()) : [];
  return res.json({ savedFoods: saved });
};

module.exports = {
  getRecipeDetails,
  getRecipeFeed,
  getCuisineFeed,
  generateRecipe,
  postRecipeFeedback,
  toggleSavedRecipe,
  getSavedRecipes,
};
