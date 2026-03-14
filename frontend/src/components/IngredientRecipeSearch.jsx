import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function IngredientRecipeSearch() {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const runSearch = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        ingredients: ingredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const response = await api.post("/ai/recipes/by-ingredients", payload);
      setRecipes(response.data.recipes || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not search recipes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-box">
      <h3 className="food-title">Find Recipes by Ingredients</h3>
      <p className="food-meta">Type ingredients separated by commas (e.g. egg, tomato, pasta).</p>
      <input
        className="ai-text-input"
        type="text"
        value={ingredients}
        onChange={(event) => setIngredients(event.target.value)}
        placeholder="egg, tomato, rice"
      />
      <button type="button" className="btn" onClick={runSearch} disabled={loading}>
        {loading ? "Searching..." : "Search by Ingredients"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {recipes.length > 0 ? (
        <div className="mini-grid">
          {recipes.map((recipe) => (
            <article className="mini-card" key={recipe.id}>
              {recipe.image ? <img src={recipe.image} alt={recipe.title} className="mini-img" /> : null}
              <p className="food-meta">{recipe.title}</p>
              <button className="btn btn-secondary" type="button" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                View Recipe
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default IngredientRecipeSearch;
