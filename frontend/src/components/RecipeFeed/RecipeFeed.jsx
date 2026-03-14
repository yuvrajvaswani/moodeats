import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import RecipeCard from "../RecipeCard/RecipeCard";
import AIRecipeCard from "../AIRecipeCard/AIRecipeCard";
import InfiniteScrollLoader from "../InfiniteScrollLoader/InfiniteScrollLoader";

const extractNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

function RecipeFeed({ intent, queryText, sortBy = "relevance", maxCookTime = null, minProtein = null, refreshKey = 0, seed = null, onClearFilters }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const sentinelRef = useRef(null);
  const navigate = useNavigate();

  const LAST_SUCCESS_CACHE_KEY = "discover:last-success-items";

  const openRecipe = (recipe) => {
    const recipeId = recipe?.id || recipe?.idMeal;
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`, { state: { recipePreview: recipe } });
  };

  const feedKey = useMemo(
    () => `${intent || "tasty_food"}|${queryText || ""}|${refreshKey}|${seed ?? "noseed"}`,
    [intent, queryText, refreshKey, seed]
  );

  const visibleItems = useMemo(() => {
    const filtered = items.filter((recipe) => {
      const cookTime = extractNumber(recipe.readyInMinutes || recipe.cookingTime || 0);
      const protein = extractNumber(recipe.estimatedProtein || recipe.macros?.protein || 0);
      const hasCookTimeFilter = maxCookTime !== null && maxCookTime !== undefined && maxCookTime !== "";
      const hasProteinFilter = minProtein !== null && minProtein !== undefined && minProtein !== "";
      const passCookTime = hasCookTimeFilter ? cookTime <= Number(maxCookTime) : true;
      const passProtein = hasProteinFilter ? protein >= Number(minProtein) : true;
      return passCookTime && passProtein;
    });

    if (sortBy === "quickest") {
      return [...filtered].sort(
        (a, b) => extractNumber(a.readyInMinutes || a.cookingTime || 0) - extractNumber(b.readyInMinutes || b.cookingTime || 0)
      );
    }

    if (sortBy === "protein") {
      return [...filtered].sort(
        (a, b) => extractNumber(b.estimatedProtein || b.macros?.protein || 0) - extractNumber(a.estimatedProtein || a.macros?.protein || 0)
      );
    }

    if (sortBy === "calories") {
      return [...filtered].sort(
        (a, b) => extractNumber(a.estimatedCalories || a.macros?.calories || 0) - extractNumber(b.estimatedCalories || b.macros?.calories || 0)
      );
    }

    return filtered;
  }, [items, sortBy, maxCookTime, minProtein]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setErrorMessage("");
    setStatusMessage("Preparing a fresh search...");
  }, [feedKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (loading) return;
      // Always allow page 1 to fetch for a fresh search.
      if (page > 1 && !hasMore) return;
      setLoading(true);
      setStatusMessage(page === 1 ? "Searching recipes..." : "Loading more recipes...");
      try {
        setErrorMessage("");
        const response = await api.get("/recipes/feed", {
          params: {
            page,
            limit: 12,
            intent: intent || "tasty_food",
            q: queryText || "",
            seed: seed ?? undefined,
          },
        });

        if (cancelled) return;

        const nextItems = response.data?.items || [];
        const mergedItems = (() => {
          const map = new Map();
          [...(page === 1 ? [] : items), ...nextItems].forEach((item) => {
            const key = String(item?.id || item?.idMeal || "");
            if (key) {
              map.set(key, item);
            }
          });
          return Array.from(map.values());
        })();

        setItems((prev) => {
          const map = new Map();
          [...prev, ...nextItems].forEach((item) => {
            const key = String(item?.id || item?.idMeal || "");
            if (key) {
              map.set(key, item);
            }
          });
          return Array.from(map.values());
        });
        setHasMore(Boolean(response.data?.hasMore));
        setStatusMessage(nextItems.length > 0 ? "Results updated" : "No new results from server for this page");

        if (page === 1) {
          try {
            sessionStorage.setItem(LAST_SUCCESS_CACHE_KEY, JSON.stringify(mergedItems));
          } catch {
            // ignore cache persistence failures
          }
        }
      } catch (error) {
        if (!cancelled) {
          const isFirstPage = page === 1;
          let restoredFromCache = false;

          if (isFirstPage) {
            try {
              const raw = sessionStorage.getItem(LAST_SUCCESS_CACHE_KEY);
              const parsed = raw ? JSON.parse(raw) : [];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setItems(parsed);
                restoredFromCache = true;
              }
            } catch {
              // ignore cache parsing issues
            }
          }

          setHasMore(false);
          if (error?.response?.status === 401) {
            setErrorMessage("Your session expired. Please log in again.");
            setStatusMessage("Session expired");
          } else if (restoredFromCache) {
            setErrorMessage("");
            setStatusMessage("Could not load fresh results. Showing your last successful results.");
          } else if (!isFirstPage && items.length > 0) {
            setErrorMessage("");
            setStatusMessage("Could not load more recipes right now. Showing current results.");
          } else {
            setErrorMessage("Could not load recipes right now. Please try again.");
            setStatusMessage("Search failed");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, feedKey, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [loading, hasMore]);

  return (
    <section>
      <div className="feed-status-banner" aria-live="polite">
        {statusMessage}
      </div>
      <div className="feed-summary" aria-live="polite">
        Showing {visibleItems.length} of {items.length} recipes with current filters.
      </div>
      <div className="recipe-grid-modern">
        {visibleItems.map((recipe) =>
          recipe.isAIGenerated ? (
            <AIRecipeCard key={recipe.id} recipe={recipe} onView={openRecipe} />
          ) : (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              moodLabel={recipe.intentMatch || intent || "personalized"}
              onView={async (item) => {
                const recipeId = item?.id || item?.idMeal;
                if (!recipeId) return;
                try {
                  await api.post("/user/interactions", {
                    type: "click_recipe",
                    recipeId,
                    intent: recipe.intentMatch || intent,
                    category: recipe.category,
                  });
                } catch {
                  // ignore tracking failure
                }
                openRecipe(item);
              }}
            />
          )
        )}
      </div>

      {!loading && visibleItems.length === 0 ? (
        <div className="empty-feed">
          <h3 className="food-title">{errorMessage ? "Recipe feed unavailable" : "No recipes match these filters"}</h3>
          <p className="food-meta">
            {errorMessage || "Try increasing cook time or lowering minimum protein, or clear ingredient text."}
          </p>
          {!errorMessage && items.length > 0 && typeof onClearFilters === "function" ? (
            <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
              Reset Filters
            </button>
          ) : null}
        </div>
      ) : null}

      <div ref={sentinelRef} style={{ height: 1 }} />
      <InfiniteScrollLoader loading={loading} hasMore={hasMore} />
    </section>
  );
}

export default RecipeFeed;
