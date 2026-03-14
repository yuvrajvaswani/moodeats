import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import RecommendationSection from "../components/RecommendationSection/RecommendationSection";
import RecipeFeed from "../components/RecipeFeed/RecipeFeed";

const discoverIntents = [
  { label: "Tasty", value: "tasty_food" },
  { label: "Healthy", value: "healthy_eating" },
  { label: "Quick", value: "quick_meal" },
  { label: "Comfort", value: "comfort_food" },
  { label: "Muscle", value: "muscle_gain" },
  { label: "Weight Loss", value: "weight_loss" },
];

function Discover() {
  const [searchParams] = useSearchParams();
  const initialIntent = searchParams.get("intent") || "tasty_food";
  const initialQuery = searchParams.get("q") || "";

  const [intent, setIntent] = useState(initialIntent);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [ingredientInput, setIngredientInput] = useState("");
  const [maxCookTimeInput, setMaxCookTimeInput] = useState("");
  const [minProteinInput, setMinProteinInput] = useState("");
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeIntent, setActiveIntent] = useState(initialIntent);
  const [sortBy, setSortBy] = useState("relevance");
  const [maxCookTime, setMaxCookTime] = useState(null);
  const [minProtein, setMinProtein] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [searchSeed, setSearchSeed] = useState(() => Date.now());

  const usesIngredients = selectedFilter === "ingredients" || selectedFilter === "all";
  const usesCookTime = selectedFilter === "cooking_time" || selectedFilter === "all";
  const usesMinProtein = selectedFilter === "min_protein" || selectedFilter === "all";
  const hasAnyFilter = usesIngredients || usesCookTime || usesMinProtein;

  const markSearchRefresh = () => {
    setSearchVersion((prev) => prev + 1);
    setSearchSeed(Date.now());
  };

  const applySearch = () => {
    const textParts = [queryInput.trim()];
    if (usesIngredients && ingredientInput.trim()) {
      textParts.push(`ingredients: ${ingredientInput.trim()}`);
    }

    setActiveIntent(intent);
    setActiveQuery(textParts.filter(Boolean).join(" | "));
    setMaxCookTime(usesCookTime && maxCookTimeInput !== "" ? Number(maxCookTimeInput) : null);
    setMinProtein(usesMinProtein && minProteinInput !== "" ? Number(minProteinInput) : null);
    markSearchRefresh();
  };

  const clearFilters = () => {
    setSelectedFilter("none");
    setIngredientInput("");
    setMaxCookTimeInput("");
    setMinProteinInput("");
    setMaxCookTime(null);
    setMinProtein(null);
    markSearchRefresh();
  };

  return (
    <div className="workspace-stack">
      <section className="workspace-card">
        <h2 className="workspace-title">Discover Recipes</h2>
        <p className="workspace-subtitle">Explore recommendations by intent, then fine-tune by ingredients, cook time, and protein.</p>

        <div className="command-chip-row" role="list" aria-label="Discover intent filters">
          {discoverIntents.map((item) => (
            <button
              key={item.value}
              type="button"
              role="listitem"
              className={`command-chip ${intent === item.value ? "command-chip--active" : ""}`}
              onClick={() => setIntent(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chat-input-wrap">
          <input
            type="text"
            value={queryInput}
            placeholder="Describe what you want: spicy dinner, healthy lunch, quick meals"
            onChange={(event) => setQueryInput(event.target.value)}
          />
          <button type="button" className="btn" onClick={applySearch}>
            Apply Search
          </button>
        </div>

        <div className="discover-filter-panel" aria-label="Advanced discover controls">
          <div className="discover-filter-panel__top">
            <label className="discover-controls__field">
              Filter
              <select value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)}>
                <option value="none">No filter</option>
                <option value="ingredients">Ingredients</option>
                <option value="cooking_time">Cooking time</option>
                <option value="min_protein">Min protein</option>
                <option value="all">All filters</option>
              </select>
            </label>

            <label className="discover-controls__field">
              Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="quickest">Quickest first</option>
                <option value="protein">Highest protein</option>
                <option value="calories">Lowest calories</option>
              </select>
            </label>
          </div>

          {hasAnyFilter ? (
            <div className="discover-filter-panel__grid">
              {usesIngredients ? (
                <label className="discover-controls__field">
                  Ingredients (optional)
                  <input
                    type="text"
                    className="input"
                    value={ingredientInput}
                    placeholder="chicken, rice, spinach"
                    aria-label="Optional ingredients filter"
                    onChange={(event) => setIngredientInput(event.target.value)}
                  />
                </label>
              ) : null}

              {usesCookTime ? (
                <label className="discover-controls__field">
                  Max cooking time (min)
                  <input
                    type="number"
                    className="input"
                    min="10"
                    max="180"
                    step="5"
                    value={maxCookTimeInput}
                    placeholder="e.g. 45"
                    onChange={(event) => setMaxCookTimeInput(event.target.value)}
                  />
                </label>
              ) : null}

              {usesMinProtein ? (
                <label className="discover-controls__field">
                  Minimum protein (g)
                  <input
                    type="number"
                    className="input"
                    min="0"
                    max="120"
                    step="1"
                    value={minProteinInput}
                    placeholder="e.g. 20"
                    onChange={(event) => setMinProteinInput(event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          <div className="discover-filter-panel__actions">
            <button type="button" className="btn" onClick={applySearch}>
              Search With Current Setup
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <RecommendationSection />

      <RecipeFeed
        intent={activeIntent}
        queryText={activeQuery}
        sortBy={sortBy}
        maxCookTime={maxCookTime}
        minProtein={minProtein}
        refreshKey={searchVersion}
        seed={searchSeed}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

export default Discover;
