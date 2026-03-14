const randomPopularity = () => Math.random() * 0.8 + 0.2;

const ingredientSimilarity = (recipe, favoriteIngredients = []) => {
  if (!Array.isArray(favoriteIngredients) || favoriteIngredients.length === 0) return 0;
  const recipeIngredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => String(item.name || item).toLowerCase())
    : [];

  const matchCount = favoriteIngredients.filter((fav) =>
    recipeIngredients.some((ri) => ri.includes(String(fav).toLowerCase()))
  ).length;

  return Math.min(1, matchCount / Math.max(1, favoriteIngredients.length));
};

const categoryMatchScore = (recipe, favoriteCategories = []) => {
  if (!favoriteCategories.length) return 0;
  const cat = String(recipe.category || "").toLowerCase();
  return favoriteCategories.some((fav) => cat.includes(String(fav).toLowerCase())) ? 1 : 0;
};

const recencyScore = (recipe, recentlyViewed = []) => {
  const id = String(recipe.id || "");
  if (!id || recentlyViewed.length === 0) return 0.5;
  const idx = recentlyViewed.lastIndexOf(id);
  if (idx === -1) return 1;
  const distance = recentlyViewed.length - idx;
  return Math.max(0, 1 - distance / 25);
};

const rankRecipes = ({ recipes = [], profile = {}, favorites = {} }) => {
  const favoriteIngredients = favorites.favoriteIngredients || [];
  const favoriteCategories = favorites.favoriteCategories || [];
  const recentlyViewed = profile.viewedRecipes || [];

  return recipes
    .map((recipe) => {
      const ingredientMatch = ingredientSimilarity(recipe, favoriteIngredients);
      const categoryMatch = categoryMatchScore(recipe, favoriteCategories);
      const popularityScore = randomPopularity();
      const recency = recencyScore(recipe, recentlyViewed);

      const score = ingredientMatch * 0.4 + categoryMatch * 0.3 + popularityScore * 0.2 + recency * 0.1;

      return {
        ...recipe,
        recommendationScore: Number(score.toFixed(3)),
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
};

module.exports = {
  rankRecipes,
};
