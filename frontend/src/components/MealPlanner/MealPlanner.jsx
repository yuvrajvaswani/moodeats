import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const SAVED_PLAN_KEY = "savedWeeklyPlan";
const SAVED_PLANS_KEY = "savedMealPlans";

function MealPlanner() {
  const [goal, setGoal] = useState("healthy_eating");
  const [plan, setPlan] = useState([]);
  const [planName, setPlanName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [groceryItems, setGroceryItems] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const toIngredientName = (item) => {
    if (!item) return "";
    if (typeof item === "string") {
      return item
        .replace(/^\d+[\w\s/.]*\s+/i, "")
        .replace(/\([^)]*\)/g, "")
        .trim()
        .toLowerCase();
    }
    return String(item.name || "").trim().toLowerCase();
  };

  useEffect(() => {
    const selectedPlanId = searchParams.get("plan");

    try {
      const plansRaw = localStorage.getItem(SAVED_PLANS_KEY);
      const plans = plansRaw ? JSON.parse(plansRaw) : [];

      if (Array.isArray(plans) && plans.length > 0) {
        const target = selectedPlanId
          ? plans.find((item) => String(item.id) === String(selectedPlanId)) || plans[0]
          : plans[0];

        if (Array.isArray(target?.plan) && target.plan.length > 0) {
          setPlan(target.plan);
          setGoal(target.goal || "healthy_eating");
          setPlanName(target.name || "");
          setSaveStatus(`Loaded saved plan: ${target.name || "Unnamed Plan"}.`);
          return;
        }
      }

      const raw = localStorage.getItem(SAVED_PLAN_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.plan) && parsed.plan.length > 0) {
        setPlan(parsed.plan);
        setGoal(parsed.goal || "healthy_eating");
        setPlanName(parsed.name || "");
        setSaveStatus(`Loaded saved plan (${parsed.savedAt || "recent"}).`);
      }
    } catch {
      // ignore invalid persisted data
    }
  }, [searchParams]);

  const generate = async () => {
    setLoading(true);
    setError("");
    setSaveStatus("");

    try {
      const response = await api.post("/ai/weekly-plan", { goal });
      setPlan(response.data?.plan || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not generate weekly plan");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = () => {
    if (plan.length === 0) return;

    const normalizedName = planName.trim();
    if (!normalizedName) {
      setSaveStatus("Please enter a plan name before saving.");
      return;
    }

    const payload = {
      id: Date.now(),
      name: normalizedName,
      goal,
      savedAt: new Date().toLocaleString(),
      plan,
    };

    localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(payload));

    try {
      const existingRaw = localStorage.getItem(SAVED_PLANS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const safeExisting = Array.isArray(existing) ? existing : [];

      const next = [payload, ...safeExisting.filter((item) => item?.name !== normalizedName)].slice(0, 30);
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(next));
      setSaveStatus(`Plan \"${normalizedName}\" saved.`);
    } catch {
      setSaveStatus("Plan saved, but history list could not be updated.");
    }
  };

  const generateGroceryList = () => {
    if (plan.length === 0) return;

    const counts = new Map();
    plan.forEach((day) => {
      [day.meals?.Breakfast, day.meals?.Lunch, day.meals?.Dinner].forEach((meal) => {
        (meal?.ingredients || []).forEach((ingredient) => {
          const name = toIngredientName(ingredient);
          if (!name) return;
          counts.set(name, (counts.get(name) || 0) + 1);
        });
      });
    });

    const items = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name, count]) => ({
        name,
        count,
      }));

    setGroceryItems(items);
  };

  const clearCurrentPlan = () => {
    setPlan([]);
    setGroceryItems([]);
    setSaveStatus("Cleared current generated plan.");
  };

  return (
    <section className="ai-box">
      <h3 className="food-title">Weekly AI Meal Planner</h3>
      <div className="chat-input-wrap">
        <select className="ai-text-input" value={goal} onChange={(event) => setGoal(event.target.value)}>
          <option value="muscle_gain">Build Muscle</option>
          <option value="weight_loss">Weight Loss</option>
          <option value="healthy_eating">Healthy Eating</option>
          <option value="quick_easy">Quick & Easy</option>
          <option value="budget_friendly">Budget Friendly</option>
          <option value="comfort_classics">Comfort Classics</option>
          <option value="vegetarian_focus">Vegetarian Focus</option>
        </select>
        <button type="button" className="btn" onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate 7-Day Plan"}
        </button>
      </div>

      <label className="discover-controls__field">
        Plan Name
        <input
          className="input"
          value={planName}
          placeholder="Ex: Lean Bulk Week 1"
          onChange={(event) => setPlanName(event.target.value)}
        />
      </label>

      <div className="planner-actions-menu">
        <button
          type="button"
          className="btn btn-secondary planner-actions-menu__trigger"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Planner Actions
        </button>

        {menuOpen ? (
          <div className="planner-actions-menu__dropdown" role="menu" aria-label="Planner actions">
            <button
              type="button"
              className="planner-actions-menu__item"
              onClick={() => {
                savePlan();
                setMenuOpen(false);
              }}
              disabled={plan.length === 0}
            >
              Save Plan
            </button>
            <button
              type="button"
              className="planner-actions-menu__item"
              onClick={() => {
                generateGroceryList();
                setMenuOpen(false);
              }}
              disabled={plan.length === 0}
            >
              Generate Grocery List
            </button>
            <button
              type="button"
              className="planner-actions-menu__item"
              onClick={() => {
                generate();
                setMenuOpen(false);
              }}
              disabled={loading}
            >
              Regenerate Plan
            </button>
            <button
              type="button"
              className="planner-actions-menu__item"
              onClick={() => {
                clearCurrentPlan();
                setMenuOpen(false);
              }}
              disabled={plan.length === 0}
            >
              Clear Current Plan
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {saveStatus ? <p className="status-text">{saveStatus}</p> : null}

      {groceryItems.length > 0 ? (
        <section className="ai-box">
          <h4 className="food-title">Grocery List</h4>
          <ul className="detail-list">
            {groceryItems.map((item) => (
              <li key={item.name}>{item.name} ({item.count} meals)</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.length > 0 ? (
        <div className="meal-plan-grid">
          {plan.map((day) => (
            <article key={day.day} className="mini-card">
              <p className="recipe-card-modern__badge">{day.day}</p>
              <div className="planner-meal-row">
                <p className="food-meta">Breakfast: {day.meals.Breakfast?.title || "-"}</p>
                {day.meals.Breakfast?.id ? (
                  <button type="button" className="meal-link" onClick={() => navigate(`/recipe/${day.meals.Breakfast.id}`)}>
                    View
                  </button>
                ) : null}
              </div>
              <div className="planner-meal-row">
                <p className="food-meta">Lunch: {day.meals.Lunch?.title || "-"}</p>
                {day.meals.Lunch?.id ? (
                  <button type="button" className="meal-link" onClick={() => navigate(`/recipe/${day.meals.Lunch.id}`)}>
                    View
                  </button>
                ) : null}
              </div>
              <div className="planner-meal-row">
                <p className="food-meta">Dinner: {day.meals.Dinner?.title || "-"}</p>
                {day.meals.Dinner?.id ? (
                  <button type="button" className="meal-link" onClick={() => navigate(`/recipe/${day.meals.Dinner.id}`)}>
                    View
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default MealPlanner;
