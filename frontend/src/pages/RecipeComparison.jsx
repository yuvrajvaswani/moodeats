import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { estimateRecipeCostInr } from "../utils/pricing";

const fallbackRecipes = [
  {
    id: "c1",
    title: "Masala Oats Bowl",
    readyInMinutes: 15,
    estimatedCalories: "320 kcal",
    estimatedProtein: "14 g",
  },
  {
    id: "c2",
    title: "Chicken Rice Bowl",
    readyInMinutes: 35,
    estimatedCalories: "540 kcal",
    estimatedProtein: "35 g",
  },
  {
    id: "c3",
    title: "Paneer Wrap",
    readyInMinutes: 20,
    estimatedCalories: "460 kcal",
    estimatedProtein: "22 g",
  },
  {
    id: "c4",
    title: "Dal Chawal",
    readyInMinutes: 30,
    estimatedCalories: "430 kcal",
    estimatedProtein: "16 g",
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getRecipeMetrics = (recipe) => {
  const time = toNumber(recipe?.readyInMinutes || recipe?.cookingTime, 30);
  const calories = toNumber(recipe?.estimatedCalories, 420);
  const protein = toNumber(recipe?.estimatedProtein, 15);
  const cost = estimateRecipeCostInr(recipe, { mealType: "lunch" });
  return { time, calories, protein, cost };
};

const winnerLabel = (left, right, lowerIsBetter = true) => {
  if (left === right) return "Tie";
  if (lowerIsBetter) {
    return left < right ? "Recipe A" : "Recipe B";
  }
  return left > right ? "Recipe A" : "Recipe B";
};

function RecipeComparison() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [recipeAId, setRecipeAId] = useState("");
  const [recipeBId, setRecipeBId] = useState("");

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      setStatus("");
      try {
        const response = await api.get("/recipes/feed", {
          params: { page: 1, limit: 24, intent: "tasty_food" },
        });
        const items = response.data?.items || [];
        const source = items.length > 1 ? items : fallbackRecipes;
        setRecipes(source);
        setRecipeAId(String(source[0]?.id || ""));
        setRecipeBId(String(source[1]?.id || source[0]?.id || ""));
      } catch {
        setRecipes(fallbackRecipes);
        setRecipeAId(String(fallbackRecipes[0].id));
        setRecipeBId(String(fallbackRecipes[1].id));
        setStatus("Using fallback recipes for comparison.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const recipeA = useMemo(
    () => recipes.find((item) => String(item.id) === String(recipeAId)) || null,
    [recipes, recipeAId]
  );

  const recipeB = useMemo(
    () => recipes.find((item) => String(item.id) === String(recipeBId)) || null,
    [recipes, recipeBId]
  );

  const metricsA = useMemo(() => getRecipeMetrics(recipeA || {}), [recipeA]);
  const metricsB = useMemo(() => getRecipeMetrics(recipeB || {}), [recipeB]);

  return (
    <div className="workspace-stack">
      <section className="workspace-card workspace-card--hero">
        <h2 className="workspace-title">Recipe Comparison</h2>
        <p className="workspace-subtitle">Compare two recipes by cook time, macros, and estimated cost (INR).</p>
      </section>

      <section className="workspace-card">
        <div className="discover-controls">
          <label className="discover-controls__field">
            Recipe A
            <select value={recipeAId} onChange={(event) => setRecipeAId(event.target.value)}>
              {recipes.map((recipe) => (
                <option key={`a-${recipe.id}`} value={String(recipe.id)}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </label>

          <label className="discover-controls__field">
            Recipe B
            <select value={recipeBId} onChange={(event) => setRecipeBId(event.target.value)}>
              {recipes.map((recipe) => (
                <option key={`b-${recipe.id}`} value={String(recipe.id)}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? <p className="food-meta">Loading recipes for comparison...</p> : null}
        {status ? <p className="food-meta action-center__reply">{status}</p> : null}
      </section>

      {recipeA && recipeB ? (
        <section className="workspace-card">
          <div className="comparison-grid">
            <article className="mini-card">
              <p className="recipe-card-modern__badge">Recipe A</p>
              <h3 className="food-title">{recipeA.title}</h3>
              <p className="food-meta">Time: {metricsA.time} min</p>
              <p className="food-meta">Calories: {metricsA.calories} kcal</p>
              <p className="food-meta">Protein: {metricsA.protein} g</p>
              <p className="food-meta">Estimated Cost: INR {metricsA.cost}</p>
            </article>

            <article className="mini-card">
              <p className="recipe-card-modern__badge">Recipe B</p>
              <h3 className="food-title">{recipeB.title}</h3>
              <p className="food-meta">Time: {metricsB.time} min</p>
              <p className="food-meta">Calories: {metricsB.calories} kcal</p>
              <p className="food-meta">Protein: {metricsB.protein} g</p>
              <p className="food-meta">Estimated Cost: INR {metricsB.cost}</p>
            </article>
          </div>

          <div className="comparison-summary">
            <p className="food-meta"><strong>Fastest:</strong> {winnerLabel(metricsA.time, metricsB.time, true)}</p>
            <p className="food-meta"><strong>Higher Protein:</strong> {winnerLabel(metricsA.protein, metricsB.protein, false)}</p>
            <p className="food-meta"><strong>Lower Calories:</strong> {winnerLabel(metricsA.calories, metricsB.calories, true)}</p>
            <p className="food-meta"><strong>Cheaper (INR):</strong> {winnerLabel(metricsA.cost, metricsB.cost, true)}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default RecipeComparison;
