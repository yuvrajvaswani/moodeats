import { useState } from "react";

const FALLBACK_RECIPE_IMAGE = "/fresh-bowl.svg";

function AIRecipeCard({ recipe, onView }) {
  const cookTime = recipe.readyInMinutes || recipe.cookingTime || 25;
  const [imgSrc, setImgSrc] = useState(recipe.image || FALLBACK_RECIPE_IMAGE);

  return (
    <article className="recipe-card-modern recipe-card-modern--ai">
      <img
        className="recipe-card-modern__image"
        src={imgSrc}
        alt={recipe.title}
        onError={() => setImgSrc(FALLBACK_RECIPE_IMAGE)}
      />
      <div className="recipe-card-modern__body">
        <p className="recipe-card-modern__badge">AI Generated Recipe</p>
        <h3 className="recipe-card-modern__title">{recipe.title}</h3>
        <div className="recipe-card-modern__chips" aria-label="Recipe nutrition and time highlights">
          <span className="meta-chip">{cookTime} min</span>
          <span className="meta-chip">{recipe.estimatedProtein || recipe.macros?.protein || "--"} protein</span>
          <span className="meta-chip">{recipe.estimatedCalories || recipe.macros?.calories || "--"} kcal</span>
        </div>
        <button type="button" className="btn recipe-card-modern__cta" onClick={() => onView(recipe)} aria-label={`View ${recipe.title}`}>
          View Recipe
        </button>
      </div>
    </article>
  );
}

export default AIRecipeCard;
