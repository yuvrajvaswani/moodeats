import { useState } from "react";
import api from "../../services/api";

const FALLBACK_RECIPE_IMAGE = "/fresh-bowl.svg";

function RecipeCard({ recipe, moodLabel, onView }) {
  const cookTime = recipe.readyInMinutes || recipe.cookingTime || "--";
  const recipeId = recipe.id || recipe.idMeal;
  const [saveState, setSaveState] = useState("");
  const [imgSrc, setImgSrc] = useState(recipe.image || FALLBACK_RECIPE_IMAGE);

  const saveRecipe = async () => {
    try {
      if (!recipeId) {
        setSaveState("Save failed");
        return;
      }

      const response = await api.post("/recipes/save", { recipeId, recipe });
      const isSaved = Boolean(response.data?.saved?.saved);
      setSaveState(isSaved ? "Saved" : "Removed");
    } catch {
      setSaveState("Save failed");
    }
  };

  return (
    <article className="recipe-card-modern">
      <img
        className="recipe-card-modern__image"
        src={imgSrc}
        alt={recipe.title}
        onError={() => setImgSrc(FALLBACK_RECIPE_IMAGE)}
      />
      <div className="recipe-card-modern__body">
        <p className="recipe-card-modern__badge">Match: {moodLabel || "balanced"}</p>
        <h3 className="recipe-card-modern__title">{recipe.title}</h3>
        <div className="recipe-card-modern__chips" aria-label="Recipe nutrition and time highlights">
          <span className="meta-chip">{cookTime} min</span>
          <span className="meta-chip">{recipe.estimatedProtein || "--"} protein</span>
          <span className="meta-chip">{recipe.estimatedCalories || "--"} kcal</span>
        </div>
        <button type="button" className="btn recipe-card-modern__cta" onClick={() => onView(recipe)} aria-label={`View ${recipe.title}`}>
          View Recipe
        </button>
        <button type="button" className="btn btn-secondary recipe-card-modern__cta" onClick={saveRecipe}>
          Save
        </button>
        {saveState ? <p className="food-meta">{saveState}</p> : null}
      </div>
    </article>
  );
}

export default RecipeCard;
