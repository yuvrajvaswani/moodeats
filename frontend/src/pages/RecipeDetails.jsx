import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import FoodFeedbackActions from "../components/FoodFeedbackActions";
import MacroChart from "../components/MacroChart/MacroChart";
import CookingAssistant from "../components/CookingAssistant/CookingAssistant";

const healthyIngredientSwaps = {
  butter: "olive oil",
  cream: "greek yogurt",
  sugar: "honey",
  mayonnaise: "greek yogurt",
  pasta: "whole wheat pasta",
  bread: "whole wheat bread",
};

const parseMacroNumber = (value) => {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const toMacroString = (value, unit) => `${Math.max(0, Math.round(value))} ${unit}`;

const hasFullDetails = (recipe) => {
  if (!recipe) return false;
  const hasIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0;
  const hasInstructions = Array.isArray(recipe.instructions) && recipe.instructions.length > 0;
  return hasIngredients && hasInstructions;
};

const normalizeGeneratedRecipe = (recipe, fallbackTitle = "Recipe") => {
  if (!recipe) return null;

  const recipeId = recipe.id || recipe.idMeal || `ai-preview-${Date.now()}`;
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => {
        if (typeof item === "string") return { name: item, measure: "1" };
        return {
          name: item?.name || "ingredient",
          measure: item?.measure || "1",
        };
      })
    : [];
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : [];

  return {
    id: recipeId,
    title: recipe.title || recipe.name || fallbackTitle,
    image: recipe.image || "",
    category: recipe.category || "AI Generated",
    area: recipe.area || "AI",
    cookingTime: Number(recipe.cookingTime || recipe.readyInMinutes || 25),
    servings: Number(recipe.servings || 2),
    ingredients,
    instructions,
    sourceUrl: recipe.sourceUrl || "",
    macros: recipe.macros || {
      calories: recipe.estimatedCalories || "--",
      protein: recipe.estimatedProtein || "--",
      carbohydrates: "--",
      fat: "--",
    },
    isAIGenerated: true,
  };
};

const buildHealthyFallback = (regularRecipe) => {
  if (!regularRecipe) return null;

  const updatedIngredients = Array.isArray(regularRecipe.ingredients)
    ? regularRecipe.ingredients.map((item) => {
        if (!item || typeof item === "string") return item;

        const next = { ...item };
        const originalName = String(next.name || "");
        const lowered = originalName.toLowerCase();

        Object.entries(healthyIngredientSwaps).forEach(([source, target]) => {
          if (lowered.includes(source)) {
            next.name = originalName.replace(new RegExp(source, "gi"), target);
            next.isSubstituted = true;
          }
        });

        return next;
      })
    : [];

  const regularMacros = regularRecipe.macros || {};
  const baseCalories = parseMacroNumber(regularMacros.calories);
  const baseProtein = parseMacroNumber(regularMacros.protein);
  const baseCarbs = parseMacroNumber(regularMacros.carbohydrates);
  const baseFat = parseMacroNumber(regularMacros.fat);

  const lowerByRatio = (value, ratio) => {
    const lowered = value * ratio;
    if (value > 0 && Math.round(lowered) === Math.round(value)) {
      return value - 1;
    }
    return lowered;
  };

  const healthyMacros = {
    calories: toMacroString(lowerByRatio(baseCalories, 0.88), "kcal"),
    protein: toMacroString(baseProtein > 0 ? Math.max(baseProtein, baseProtein * 0.98) : 0, "g"),
    carbohydrates: toMacroString(lowerByRatio(baseCarbs, 0.9), "g"),
    fat: toMacroString(lowerByRatio(baseFat, 0.82), "g"),
  };

  const sameAsRegular =
    parseMacroNumber(healthyMacros.calories) === baseCalories &&
    parseMacroNumber(healthyMacros.protein) === baseProtein &&
    parseMacroNumber(healthyMacros.carbohydrates) === baseCarbs &&
    parseMacroNumber(healthyMacros.fat) === baseFat;

  if (sameAsRegular) {
    healthyMacros.calories = toMacroString(baseCalories > 0 ? baseCalories - 1 : 1, "kcal");
  }

  return {
    ...regularRecipe,
    title: `${regularRecipe.title} (Healthy)`,
    ingredients: updatedIngredients,
    macros: healthyMacros,
  };
};

const normalizeRecipePreview = (recipe) => {
  if (!recipe) return null;

  const recipeId = recipe.id || recipe.idMeal;
  if (!recipeId) return null;

  return {
    id: recipeId,
    title: recipe.title || recipe.name || "Recipe",
    image: recipe.image || "",
    category: recipe.category || "Recipe",
    area: recipe.area || "",
    cookingTime: Number(recipe.cookingTime || recipe.readyInMinutes || 25),
    servings: Number(recipe.servings || 2),
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) && recipe.instructions.length > 0
      ? recipe.instructions
      : ["Detailed instructions are unavailable for this preview item."],
    sourceUrl: recipe.sourceUrl || "",
    macros: recipe.macros || {
      calories: recipe.estimatedCalories || "--",
      protein: recipe.estimatedProtein || "--",
      carbohydrates: "--",
      fat: "--",
    },
    isAIGenerated: Boolean(recipe.isAIGenerated),
  };
};

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const previewRecipe = useMemo(
    () => normalizeRecipePreview(location.state?.recipePreview || null),
    [location.state?.recipePreview]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("regular");
  const [recipeData, setRecipeData] = useState({ regular: null, healthy: null });
  const [aiTip, setAiTip] = useState("");
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [hydratingDetails, setHydratingDetails] = useState(false);
  const attemptedHydrationRef = useRef(new Set());

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/recipes/${id}`);
        setRecipeData({
          regular: response.data?.regular || null,
          healthy: response.data?.healthy || null,
        });
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        if (requestError.response?.status === 404 && previewRecipe && String(previewRecipe.id) === String(id)) {
          setRecipeData({ regular: previewRecipe, healthy: null });
          return;
        }

        setError(requestError.response?.data?.message || "Could not load recipe details");
      } finally {
        setLoading(false);
      }
    };

    if (String(id || "").startsWith("fb-") && previewRecipe && String(previewRecipe.id) === String(id)) {
      setRecipeData({ regular: previewRecipe, healthy: null });
      setLoading(false);
      return;
    }

    if (id) {
      fetchRecipeDetails();
    }
  }, [id, navigate, previewRecipe]);

  useEffect(() => {
    const regular = recipeData.regular;
    if (!regular || hasFullDetails(regular)) return;

    const hydrationKey = String(regular.id || id || "");
    if (!hydrationKey || attemptedHydrationRef.current.has(hydrationKey)) return;
    attemptedHydrationRef.current.add(hydrationKey);

    let cancelled = false;

    const hydrateMissingDetails = async () => {
      setHydratingDetails(true);

      try {
        const ingredientNames = Array.isArray(regular.ingredients)
          ? regular.ingredients.map((item) => {
              if (typeof item === "string") return item;
              return String(item?.name || "").trim();
            }).filter(Boolean)
          : [];

        const response = await api.post("/recipes/generate", {
          intent: String(regular.intentMatch || "tasty_food").split("+")[0],
          query: `${regular.title || "Recipe"} ${regular.category || ""}`.trim(),
          ingredients: ingredientNames,
        });

        if (cancelled) return;

        const generated = normalizeGeneratedRecipe(response.data?.recipe, regular.title || "Recipe");
        if (!generated || !hasFullDetails(generated)) return;

        setRecipeData((prev) => ({
          ...prev,
          regular: hasFullDetails(prev.regular) ? prev.regular : generated,
        }));
      } catch {
        // Keep placeholder text when AI generation fails.
      } finally {
        if (!cancelled) {
          setHydratingDetails(false);
        }
      }
    };

    hydrateMissingDetails();

    return () => {
      cancelled = true;
    };
  }, [id, recipeData.regular]);

  const healthyRecipe = useMemo(() => recipeData.healthy || buildHealthyFallback(recipeData.regular), [recipeData]);
  const selectedRecipe = activeTab === "healthy" ? healthyRecipe : recipeData.regular;
  const baseRecipe = recipeData.regular;
  const ingredientItems = Array.isArray(selectedRecipe?.ingredients) && selectedRecipe.ingredients.length > 0
    ? selectedRecipe.ingredients
    : [{ name: "Ingredients are unavailable for this recipe source.", measure: "" }];
  const instructionItems = Array.isArray(selectedRecipe?.instructions) && selectedRecipe.instructions.length > 0
    ? selectedRecipe.instructions
    : ["Instructions are unavailable for this recipe source."];

  const formatIngredient = (ingredient, showSwapLabel = false) => {
    if (!ingredient) return "";
    if (typeof ingredient === "string") return ingredient;
    if (typeof ingredient === "object") {
      const name = ingredient.name || "";
      const measure = ingredient.measure || "";
      const base = measure ? `${measure} ${name}`.trim() : name;
      if (showSwapLabel && ingredient.isSubstituted) {
        return `${base} (healthy swap)`;
      }
      return base;
    }
    return String(ingredient);
  };

  const askSubstitutionTips = async () => {
    if (!selectedRecipe?.ingredients?.length) return;
    setAiTipLoading(true);
    try {
      const ingredientText = selectedRecipe.ingredients.map((item) => formatIngredient(item)).join(", ");
      const response = await api.post("/ai/chat", {
        message: `Give practical ingredient substitutions for this recipe: ${selectedRecipe.title}. Ingredients: ${ingredientText}.`,
      });
      setAiTip(response.data?.reply || "No substitution tips available right now.");
    } catch {
      setAiTip("Could not generate substitutions right now.");
    } finally {
      setAiTipLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="panel suggestions-screen">
        <h1 className="page-title">Recipe Details</h1>
        <p className="page-subtitle">Choose regular or healthier variation</p>

        {loading ? <p className="status-text">Loading recipe details...</p> : null}
        {!loading && hydratingDetails ? <p className="status-text">Generating full recipe details with AI...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && !error && baseRecipe ? (
          <>
            {baseRecipe.image ? <img className="recipe-hero-image" src={baseRecipe.image} alt={baseRecipe.title} /> : null}
            <h2 className="food-title recipe-hero-title">{baseRecipe.title}</h2>

            <div className="tab-toggle" role="tablist" aria-label="Recipe mode">
              <button
                type="button"
                className={`tab-btn ${activeTab === "regular" ? "tab-btn--active" : ""}`}
                onClick={() => setActiveTab("regular")}
              >
                Regular
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "healthy" ? "tab-btn--active" : ""}`}
                onClick={() => setActiveTab("healthy")}
              >
                Healthy
              </button>
            </div>

            {selectedRecipe ? (
              <section className="food-card recipe-detail-card">
                {activeTab === "healthy" ? <p className="food-meta">Healthy variation: {selectedRecipe.title}</p> : null}

                <MacroChart macros={selectedRecipe.macros} />

                <p className="food-meta">Cooking time: {selectedRecipe.cookingTime || 0} min</p>

                <h3 className="food-title">Ingredients</h3>
                <ul className="detail-list">
                  {ingredientItems.map((ingredient, index) => (
                    <li key={`${formatIngredient(ingredient, activeTab === "healthy")}-${index}`}>
                      {formatIngredient(ingredient, activeTab === "healthy")}
                    </li>
                  ))}
                </ul>

                <h3 className="food-title">Instructions</h3>
                <ol className="detail-list">
                  {instructionItems.map((step, index) => (
                    <li key={`${step}-${index}`}>{step}</li>
                  ))}
                </ol>

                <FoodFeedbackActions foodId={selectedRecipe.id || Number(id)} recipe={selectedRecipe} />

                <section className="ai-box">
                  <h3 className="food-title">AI Recipe Tools</h3>
                  <div className="row-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("healthy")}>Show Healthier Version</button>
                    <button type="button" className="btn btn-secondary" onClick={askSubstitutionTips} disabled={aiTipLoading}>
                      {aiTipLoading ? "Generating..." : "Ingredient Substitutions"}
                    </button>
                  </div>
                  {aiTip ? <p className="food-meta action-center__reply">{aiTip}</p> : null}
                </section>
              </section>
            ) : null}

            <CookingAssistant recipeTitle={baseRecipe.title} />
          </>
        ) : null}

        <div className="row-actions">
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            Back
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/saved-foods")}>Saved Foods</button>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetails;
