const profiles = new Map();

const createProfile = () => ({
  viewedRecipes: [],
  clickedRecipes: [],
  savedRecipes: [],
  categoriesSelected: {},
  searchedIngredients: {},
  intents: {},
  cuisines: {},
  updatedAt: Date.now(),
});

const inc = (obj, key, by = 1) => {
  const safe = String(key || "unknown").toLowerCase();
  obj[safe] = (obj[safe] || 0) + by;
};

const getProfile = (userId = "guest") => {
  const key = String(userId || "guest");
  if (!profiles.has(key)) {
    profiles.set(key, createProfile());
  }
  return profiles.get(key);
};

const recordUserInteraction = (userId, interaction = {}) => {
  const profile = getProfile(userId);

  if (interaction.type === "view_recipe" && interaction.recipeId) {
    profile.viewedRecipes.push(String(interaction.recipeId));
  }

  if (interaction.type === "click_recipe" && interaction.recipeId) {
    profile.clickedRecipes.push(String(interaction.recipeId));
  }

  if (interaction.type === "save_recipe" && interaction.recipeId) {
    profile.savedRecipes.push(String(interaction.recipeId));
  }

  if (interaction.intent) {
    inc(profile.intents, interaction.intent);
  }

  if (interaction.category) {
    inc(profile.categoriesSelected, interaction.category);
  }

  if (interaction.cuisine) {
    inc(profile.cuisines, interaction.cuisine);
  }

  if (Array.isArray(interaction.ingredients)) {
    interaction.ingredients.forEach((i) => inc(profile.searchedIngredients, i));
  }

  profile.updatedAt = Date.now();
  return profile;
};

const topN = (obj, n = 5) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);

const getPreferenceSummary = (userId) => {
  const profile = getProfile(userId);
  return {
    favoriteIngredients: topN(profile.searchedIngredients),
    favoriteCategories: topN(profile.categoriesSelected),
    favoriteCuisines: topN(profile.cuisines),
    favoriteIntents: topN(profile.intents),
  };
};

module.exports = {
  getProfile,
  recordUserInteraction,
  getPreferenceSummary,
};
