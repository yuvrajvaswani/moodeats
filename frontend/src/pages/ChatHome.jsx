import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import RecipeCard from "../components/RecipeCard/RecipeCard";
import AIRecipeCard from "../components/AIRecipeCard/AIRecipeCard";

const heroPromptPresets = [
  "high protein dinner under 30 min",
  "comfort food that is still healthy",
  "quick indian lunch with chicken",
  "light mediterranean dinner",
];

const cuisineOptions = ["Italian", "Mexican", "Indian", "Japanese", "Mediterranean", "Thai"];

const cuisineQueryMap = {
  Italian: "italian pasta risotto",
  Mexican: "mexican tacos burrito",
  Indian: "indian curry masala",
  Japanese: "japanese ramen sushi",
  Mediterranean: "mediterranean greek salad",
  Thai: "thai curry noodles",
};

const randomFrom = (arr = []) => arr[Math.floor(Math.random() * arr.length)];
const randomPage = () => 1 + Math.floor(Math.random() * 3);
const SECTION_OFFSETS = {
  quick: 23,
  protein: 37,
  cuisine: 41,
  recommended: 53,
};

const recipeKey = (recipe) => String(recipe?.id || recipe?.idMeal || recipe?.title || "").trim().toLowerCase();

const shuffleRecipes = (items = []) => {
  const list = Array.isArray(items) ? [...items] : [];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const uniqueByRecipeKey = (items = []) => {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = recipeKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fallbackRecipes = {
  trending: [
    { id: "fb-1", title: "Garlic Herb Chicken Bowl", image: "https://www.themealdb.com/images/media/meals/1529444113.jpg", estimatedCalories: "520 kcal", estimatedProtein: "36 g", cookingTime: 35, intentMatch: "tasty_food" },
    { id: "fb-2", title: "Creamy Tomato Pasta", image: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg", estimatedCalories: "610 kcal", estimatedProtein: "18 g", cookingTime: 30, intentMatch: "tasty_food" },
    { id: "fb-3", title: "Spiced Salmon Plate", image: "https://www.themealdb.com/images/media/meals/1548772327.jpg", estimatedCalories: "480 kcal", estimatedProtein: "34 g", cookingTime: 28, intentMatch: "tasty_food" },
  ],
  quick: [
    { id: "fb-4", title: "15-Min Veggie Stir Fry", image: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg", estimatedCalories: "390 kcal", estimatedProtein: "15 g", cookingTime: 15, intentMatch: "quick_meal" },
    { id: "fb-5", title: "Fast Chicken Wrap", image: "https://www.themealdb.com/images/media/meals/sytssx1487349587.jpg", estimatedCalories: "430 kcal", estimatedProtein: "27 g", cookingTime: 20, intentMatch: "quick_meal" },
    { id: "fb-6", title: "Speedy Egg Fried Rice", image: "https://www.themealdb.com/images/media/meals/1525873040.jpg", estimatedCalories: "500 kcal", estimatedProtein: "19 g", cookingTime: 18, intentMatch: "quick_meal" },
  ],
  protein: [
    { id: "fb-7", title: "High-Protein Turkey Chili", image: "https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg", estimatedCalories: "560 kcal", estimatedProtein: "42 g", cookingTime: 45, intentMatch: "muscle_gain" },
    { id: "fb-8", title: "Steak and Bean Power Bowl", image: "https://www.themealdb.com/images/media/meals/ssyqwr1511451678.jpg", estimatedCalories: "620 kcal", estimatedProtein: "46 g", cookingTime: 40, intentMatch: "muscle_gain" },
    { id: "fb-9", title: "Greek Yogurt Chicken Salad", image: "https://www.themealdb.com/images/media/meals/1525872624.jpg", estimatedCalories: "410 kcal", estimatedProtein: "38 g", cookingTime: 22, intentMatch: "muscle_gain" },
  ],
};

const cuisineFallbackByName = {
  Italian: [fallbackRecipes.trending[1], fallbackRecipes.quick[1], fallbackRecipes.protein[2]],
  Mexican: [fallbackRecipes.protein[0], fallbackRecipes.quick[2], fallbackRecipes.trending[0]],
  Indian: [fallbackRecipes.trending[2], fallbackRecipes.quick[0], fallbackRecipes.protein[1]],
  Japanese: [fallbackRecipes.trending[2], fallbackRecipes.quick[2], fallbackRecipes.protein[2]],
  Mediterranean: [fallbackRecipes.protein[2], fallbackRecipes.trending[0], fallbackRecipes.quick[0]],
  Thai: [fallbackRecipes.quick[0], fallbackRecipes.trending[1], fallbackRecipes.protein[0]],
};

function ChatHome() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Friend";
  const refreshSeedBase = useMemo(() => Date.now() + Math.floor(Math.random() * 100000), []);
  const [heroQuery, setHeroQuery] = useState("");
  const [cuisine, setCuisine] = useState("Italian");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [aiPicks, setAiPicks] = useState([]);
  const [quickMeals, setQuickMeals] = useState([]);
  const [proteinMeals, setProteinMeals] = useState([]);
  const [cuisineMeals, setCuisineMeals] = useState([]);
  const [continueCooking, setContinueCooking] = useState([]);

  const openRecipe = (recipe) => {
    const recipeId = recipe?.id || recipe?.idMeal;
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`, { state: { recipePreview: recipe } });
  };

  const sectionSeed = (offset) => refreshSeedBase + offset;

  const fetchFeed = async (intent, queryText = "", seedOffset = 0) => {
    const response = await api.get("/recipes/feed", {
      params: {
        page: randomPage(),
        limit: 6,
        intent,
        q: queryText,
        seed: sectionSeed(seedOffset),
      },
    });
    return response.data?.items || [];
  };

  const fetchCuisineFeed = async (selectedCuisine, seedValue = sectionSeed(SECTION_OFFSETS.cuisine)) => {
    const response = await api.get("/recipes/cuisine", {
      params: {
        cuisine: selectedCuisine,
        page: randomPage(),
        limit: 6,
        seed: seedValue,
      },
    });
    return response.data?.items || [];
  };

  const withFallback = (list, fallback) => (Array.isArray(list) && list.length > 0 ? list : fallback);

  useEffect(() => {
    const loadHub = async () => {
      setLoading(true);
      try {
        const [quickResult, proteinResult, cuisineResult, recommendedResult, savedResult] = await Promise.allSettled([
          fetchFeed("quick_meal", randomFrom(["quick", "easy dinner", "under 30 min"]), SECTION_OFFSETS.quick),
          fetchFeed("muscle_gain", randomFrom(["high protein", "protein meals", "gym food"]), SECTION_OFFSETS.protein),
          fetchCuisineFeed(cuisine, sectionSeed(SECTION_OFFSETS.cuisine)),
          api.get("/ai/recommended-feed", { params: { seed: sectionSeed(SECTION_OFFSETS.recommended) } }),
          api.get("/recipes/saved"),
        ]);

        const quickList = quickResult.status === "fulfilled" ? quickResult.value : [];
        const proteinList = proteinResult.status === "fulfilled" ? proteinResult.value : [];
        const cuisineList = cuisineResult.status === "fulfilled" ? cuisineResult.value : [];
        const recommended = recommendedResult.status === "fulfilled" ? recommendedResult.value.data?.recipes?.slice(0, 6) : [];
        const saved = savedResult.status === "fulfilled" ? savedResult.value.data?.savedFoods?.slice(0, 6) : [];

        const aiPicksList = shuffleRecipes(withFallback(recommended, fallbackRecipes.trending)).slice(0, 6);
        const aiKeys = new Set(aiPicksList.map(recipeKey).filter(Boolean));

        const quickWithoutAIPicks = uniqueByRecipeKey(withFallback(quickList, fallbackRecipes.quick)).filter(
          (recipe) => !aiKeys.has(recipeKey(recipe))
        );
        const proteinWithoutAIPicks = uniqueByRecipeKey(withFallback(proteinList, fallbackRecipes.protein)).filter(
          (recipe) => !aiKeys.has(recipeKey(recipe))
        );
        const cuisineWithoutAIPicks = uniqueByRecipeKey(
          withFallback(cuisineList, cuisineFallbackByName[cuisine] || fallbackRecipes.trending)
        ).filter((recipe) => !aiKeys.has(recipeKey(recipe)));

        setQuickMeals(shuffleRecipes(quickWithoutAIPicks).slice(0, 6));
        setProteinMeals(shuffleRecipes(proteinWithoutAIPicks).slice(0, 6));
        setCuisineMeals(shuffleRecipes(cuisineWithoutAIPicks).slice(0, 6));
        setAiPicks(aiPicksList);
        setContinueCooking(shuffleRecipes(withFallback(saved, fallbackRecipes.quick)).slice(0, 6));

        if (quickResult.status !== "fulfilled" || proteinResult.status !== "fulfilled") {
          setStatusMessage("Showing curated recipes while live feed reconnects.");
        }
      } catch {
        setQuickMeals(shuffleRecipes(fallbackRecipes.quick));
        setProteinMeals(shuffleRecipes(fallbackRecipes.protein));
        setCuisineMeals(shuffleRecipes(cuisineFallbackByName[cuisine] || fallbackRecipes.trending));
        setAiPicks(shuffleRecipes(fallbackRecipes.trending));
        setContinueCooking(shuffleRecipes(fallbackRecipes.quick));
        setStatusMessage("Showing curated recipes while live feed reconnects.");
      } finally {
        setLoading(false);
      }
    };

    loadHub();
  }, []);

  useEffect(() => {
    const loadCuisine = async () => {
      try {
        const cuisineList = await fetchCuisineFeed(cuisine, Date.now());
        setCuisineMeals(shuffleRecipes(withFallback(cuisineList, cuisineFallbackByName[cuisine] || fallbackRecipes.trending)).slice(0, 6));
      } catch {
        setCuisineMeals(shuffleRecipes(cuisineFallbackByName[cuisine] || fallbackRecipes.trending));
      }
    };

    loadCuisine();
  }, [cuisine]);

  const runHeroSearch = async (textOverride = null) => {
    const text = String(textOverride ?? heroQuery).trim();
    if (!text) return;

    setSearchLoading(true);
    try {
      const response = await api.post("/ai/recommend", {
        text,
      });
      setAiPicks(shuffleRecipes(withFallback(response.data?.recipes?.slice(0, 6), fallbackRecipes.trending)).slice(0, 6));
      setStatusMessage("Updated AI picks based on your latest search.");
    } catch {
      setAiPicks(shuffleRecipes(fallbackRecipes.trending));
      setStatusMessage("Could not run hero search right now.");
    } finally {
      setSearchLoading(false);
    }
  };

  const runPresetSearch = (prompt) => {
    setHeroQuery(prompt);
    runHeroSearch(prompt);
  };

  const renderRecipeGrid = (items) => {
    if (items.length === 0) {
      return <p className="food-meta">No recipes yet in this section.</p>;
    }

    return (
      <div className="recipe-grid-modern">
        {items.map((recipe) =>
          recipe.isAIGenerated ? (
            <AIRecipeCard key={recipe.id} recipe={recipe} onView={openRecipe} />
          ) : (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              moodLabel={recipe.intentMatch || "personalized"}
              onView={openRecipe}
            />
          )
        )}
      </div>
    );
  };

  return (
    <div className="workspace-stack">
      <section className="workspace-card workspace-card--hero">
        <h2 className="workspace-title">Hi {userName}, let's cook smarter today</h2>
        <p className="workspace-subtitle">Search by goal + taste in one place, then jump into recipes instantly.</p>

        <div className="hero-command-bar">
          <input
            type="text"
            className="input"
            value={heroQuery}
            placeholder="What do you want to eat today?"
            onChange={(event) => setHeroQuery(event.target.value)}
          />
          <button type="button" className="btn" onClick={runHeroSearch} disabled={searchLoading}>
            {searchLoading ? "Thinking..." : "Search"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => runPresetSearch(randomFrom(heroPromptPresets))}
            disabled={searchLoading}
          >
            Surprise Me
          </button>
        </div>

        <div className="hero-preset-row" aria-label="Quick hero prompts">
          {heroPromptPresets.map((prompt) => (
            <button key={prompt} type="button" className="command-chip" onClick={() => runPresetSearch(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        {statusMessage ? <p className="food-meta action-center__reply">{statusMessage}</p> : null}
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Updated AI Picks</h3>
        {renderRecipeGrid(aiPicks)}
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Cook With Ingredients</h3>
        <p className="food-meta">Go to Discover for ingredient search, filters, and side-by-side results.</p>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/discover")}>Open Discover</button>
        </div>
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Quick Meals</h3>
        {renderRecipeGrid(quickMeals)}
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Cuisine Explorer</h3>
        <div className="command-chip-row">
          {cuisineOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`command-chip ${cuisine === item ? "command-chip--active" : ""}`}
              onClick={() => setCuisine(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {renderRecipeGrid(cuisineMeals)}
      </section>

      <section className="workspace-card">
        <h3 className="food-title">High Protein Recipes</h3>
        {renderRecipeGrid(proteinMeals)}
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Continue Cooking</h3>
        {continueCooking.length > 0 ? (
          <div className="recipe-grid-modern">
            {continueCooking.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                moodLabel="saved"
                onView={openRecipe}
              />
            ))}
          </div>
        ) : (
          <p className="food-meta">No saved recipes yet. Save recipes from Discover or the feed.</p>
        )}

        <div className="feature-shortcuts">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/discover")}>Ingredient Search + Filters</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/planner")}>Meal Planner + Grocery List</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/compare")}>Compare 2 Recipes</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/saved")}>Recipe Collections</button>
        </div>
      </section>

      {loading ? <div className="loading-pulse">Loading your food hub...</div> : null}
    </div>
  );
}

export default ChatHome;
