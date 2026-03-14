import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import RecipeCard from "../RecipeCard/RecipeCard";
import AIRecipeCard from "../AIRecipeCard/AIRecipeCard";

function RecommendationSection() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Recommended For You");
  const navigate = useNavigate();

  const openRecipe = (recipe) => {
    const recipeId = recipe?.id || recipe?.idMeal;
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`, { state: { recipePreview: recipe } });
  };

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      try {
        const response = await api.get("/ai/recommended-feed");
        setRecipes(response.data?.recipes || []);
        setTitle(response.data?.title || "Recommended For You");
      } catch {
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  if (loading) {
    return <div className="loading-pulse">Loading personalized picks...</div>;
  }

  if (recipes.length === 0) {
    return null;
  }

  return (
    <section className="ai-box">
      <h3 className="food-title">{title}</h3>
      <div className="recipe-grid-modern">
        {recipes.slice(0, 6).map((recipe) =>
          recipe.isAIGenerated ? (
            <AIRecipeCard key={recipe.id} recipe={recipe} onView={openRecipe} />
          ) : (
            <RecipeCard key={recipe.id} recipe={recipe} moodLabel="personalized" onView={openRecipe} />
          )
        )}
      </div>
    </section>
  );
}

export default RecommendationSection;
