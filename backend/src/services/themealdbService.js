const THEMEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const fetchMealDb = async (path) => {
  const response = await fetch(`${THEMEALDB_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`TheMealDB request failed: ${response.status}`);
  }
  return response.json();
};

const parseIngredients = (meal) => {
  const items = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && String(name).trim()) {
      items.push({
        name: String(name).trim(),
        measure: String(measure || "1").trim() || "1",
      });
    }
  }
  return items;
};

const toInstructionSteps = (instructionText) => {
  return String(instructionText || "")
    .split(/\r?\n|\./)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => `${step}.`);
};

const estimateCookingTime = (meal) => {
  const steps = toInstructionSteps(meal.strInstructions);
  const ingredients = parseIngredients(meal);
  const base = 12;
  const bySteps = steps.length * 2;
  const byIngredients = ingredients.length * 1.5;
  return Math.max(10, Math.round(base + bySteps + byIngredients));
};

const mapRecipeCard = (meal) => ({
  id: meal.idMeal,
  name: meal.strMeal,
  title: meal.strMeal,
  image: meal.strMealThumb,
  category: meal.strCategory || "Recipe",
  readyInMinutes: estimateCookingTime(meal),
});

const searchRecipes = async (query) => {
  const data = await fetchMealDb(`/search.php?s=${encodeURIComponent(query || "")}`);
  return Array.isArray(data.meals) ? data.meals : [];
};

const filterByCategory = async (category) => {
  const data = await fetchMealDb(`/filter.php?c=${encodeURIComponent(category)}`);
  return Array.isArray(data.meals) ? data.meals : [];
};

const lookupById = async (id) => {
  const data = await fetchMealDb(`/lookup.php?i=${encodeURIComponent(id)}`);
  return Array.isArray(data.meals) && data.meals[0] ? data.meals[0] : null;
};

module.exports = {
  fetchMealDb,
  parseIngredients,
  toInstructionSteps,
  estimateCookingTime,
  mapRecipeCard,
  searchRecipes,
  filterByCategory,
  lookupById,
};
