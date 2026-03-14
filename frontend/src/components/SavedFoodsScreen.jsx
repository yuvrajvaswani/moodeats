import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import FoodFeedbackActions from "./FoodFeedbackActions";

const SAVED_PLANS_KEY = "savedMealPlans";

function SavedFoodsScreen({ embedded = false }) {
  const [savedFoods, setSavedFoods] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadSavedPlans = () => {
    try {
      const raw = localStorage.getItem(SAVED_PLANS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedPlans(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedPlans([]);
    }
  };

  const deleteSavedPlan = (id) => {
    try {
      const raw = localStorage.getItem(SAVED_PLANS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const safePlans = Array.isArray(parsed) ? parsed : [];
      const next = safePlans.filter((item) => String(item.id) !== String(id));
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(next));
      setSavedPlans(next);
    } catch {
      // ignore persistence errors
    }
  };

  const fetchSavedFoods = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/recipes/saved");
      setSavedFoods(response.data.savedFoods || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || "Could not load saved foods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedFoods();
    loadSavedPlans();
  }, []);

  const content = (
    <div className={embedded ? "workspace-card suggestions-screen" : "panel suggestions-screen"}>
        <h1 className="page-title">Saved Items</h1>
        <p className="page-subtitle">Your saved recipes and named meal plans in one place.</p>

        {!loading && !error && savedPlans.length > 0 ? (
          <section className="ai-box">
            <h3 className="food-title">Saved Meal Plans</h3>
            <div className="stack">
              {savedPlans.map((planItem) => (
                <article className="food-card" key={planItem.id}>
                  <h4 className="food-title">{planItem.name || "Unnamed Plan"}</h4>
                  <p className="food-meta">Goal: {planItem.goal || "healthy_eating"}</p>
                  <p className="food-meta">Saved: {planItem.savedAt || "recent"}</p>
                  <p className="food-meta">Days: {Array.isArray(planItem.plan) ? planItem.plan.length : 0}</p>

                  {Array.isArray(planItem.plan) && planItem.plan.length > 0 ? (
                    <details>
                      <summary className="food-meta">View meals</summary>
                      <ul className="detail-list">
                        {planItem.plan.slice(0, 7).map((day) => (
                          <li key={`${planItem.id}-${day.day}`}>
                            {day.day}: B-{day.meals?.Breakfast?.title || "-"}, L-{day.meals?.Lunch?.title || "-"}, D-{day.meals?.Dinner?.title || "-"}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}

                  <div className="row-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => navigate(`/assistant/planner?plan=${planItem.id}`)}>
                      Open in Planner
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => deleteSavedPlan(planItem.id)}>
                      Delete Plan
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {loading ? <p className="status-text">Loading saved foods...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && !error && savedFoods.length === 0 ? (
          <p className="status-text">No saved foods yet.</p>
        ) : null}

        {!loading && !error && savedPlans.length === 0 ? (
          <p className="status-text">No saved meal plans yet. Name a plan in Planner and save it.</p>
        ) : null}

        {!loading && !error && savedFoods.length > 0 ? (
          <div className="stack">
            {savedFoods.map((item) => (
              <article className="food-card" key={item.id}>
                {item.image ? <img className="food-image" src={item.image} alt={item.title || "Recipe"} /> : null}
                <h3 className="food-title">{item.title || item.name}</h3>
                <p className="food-meta">{item.category || "Recipe"}</p>
                <p className="food-meta">Cooking time: {item.cookingTime || 0} min</p>
                <FoodFeedbackActions foodId={item.id} recipe={item} onSavedToggle={fetchSavedFoods} />
              </article>
            ))}
          </div>
        ) : null}

        <div className="row-actions">
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/assistant/chat")}>Back to Assistant</button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              fetchSavedFoods();
              loadSavedPlans();
            }}
          >
            Refresh Saved
          </button>
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return <div className="app-shell">{content}</div>;
}

export default SavedFoodsScreen;
