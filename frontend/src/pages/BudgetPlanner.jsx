import { useState } from "react";
import api from "../services/api";
import { estimateRecipeCostInr } from "../utils/pricing";

const fallbackBudgetMeals = [
  { id: "b1", title: "Masala Oats Bowl", estimatedCostInr: 60 },
  { id: "b2", title: "Paneer Bhurji Wrap", estimatedCostInr: 90 },
  { id: "b3", title: "Chicken Rice Meal Prep", estimatedCostInr: 140 },
  { id: "b4", title: "Dal Chawal Plate", estimatedCostInr: 70 },
  { id: "b5", title: "Egg Curry + Roti", estimatedCostInr: 80 },
  { id: "b6", title: "Veg Pulao + Raita", estimatedCostInr: 85 },
];

function BudgetPlanner() {
  const [budgetInr, setBudgetInr] = useState(2000);
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const generateBudgetPlan = async () => {
    setLoading(true);
    setStatus("");

    const mealBudget = Math.max(30, Math.floor(Number(budgetInr || 0) / Math.max(1, Number(days || 1) * 3)));

    try {
      const response = await api.get("/recipes/feed", {
        params: {
          page: 1,
          limit: 24,
          intent: "quick_meal",
          q: "budget friendly",
        },
      });

      let items = (response.data?.items || []).map((item) => ({
        ...item,
        estimatedCostInr: estimateRecipeCostInr(item, { mealType: "lunch" }),
      }));

      items = items.filter((item) => item.estimatedCostInr <= mealBudget);

      if (items.length === 0) {
        items = fallbackBudgetMeals.filter((item) => item.estimatedCostInr <= mealBudget);
      }

      const daysPlan = [];
      for (let i = 0; i < Number(days); i += 1) {
        const b = items[i % items.length] || fallbackBudgetMeals[i % fallbackBudgetMeals.length];
        const l = items[(i + 2) % items.length] || fallbackBudgetMeals[(i + 2) % fallbackBudgetMeals.length];
        const d = items[(i + 4) % items.length] || fallbackBudgetMeals[(i + 4) % fallbackBudgetMeals.length];
        daysPlan.push({
          day: `Day ${i + 1}`,
          breakfast: { ...b, estimatedCostInr: estimateRecipeCostInr(b, { mealType: "breakfast" }) },
          lunch: { ...l, estimatedCostInr: estimateRecipeCostInr(l, { mealType: "lunch" }) },
          dinner: { ...d, estimatedCostInr: estimateRecipeCostInr(d, { mealType: "dinner" }) },
        });
      }

      const totalSpend = daysPlan.reduce(
        (acc, day) => acc + day.breakfast.estimatedCostInr + day.lunch.estimatedCostInr + day.dinner.estimatedCostInr,
        0
      );

      setPlan(daysPlan);
      setStatus(`Estimated spend: INR ${totalSpend} / INR ${budgetInr}`);
    } catch {
      const daysPlan = [];
      for (let i = 0; i < Number(days); i += 1) {
        daysPlan.push({
          day: `Day ${i + 1}`,
          breakfast: fallbackBudgetMeals[i % fallbackBudgetMeals.length],
          lunch: fallbackBudgetMeals[(i + 2) % fallbackBudgetMeals.length],
          dinner: fallbackBudgetMeals[(i + 4) % fallbackBudgetMeals.length],
        });
      }
      const totalSpend = daysPlan.reduce(
        (acc, day) => acc + day.breakfast.estimatedCostInr + day.lunch.estimatedCostInr + day.dinner.estimatedCostInr,
        0
      );
      setPlan(daysPlan);
      setStatus(`Using fallback budget plan. Estimated spend: INR ${totalSpend} / INR ${budgetInr}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-stack">
      <section className="workspace-card workspace-card--hero">
        <h2 className="workspace-title">Budget Meal Planner (INR)</h2>
        <p className="workspace-subtitle">Plan meals based on rupee budget with daily breakfast/lunch/dinner structure.</p>
      </section>

      <section className="workspace-card">
        <div className="discover-controls">
          <label className="discover-controls__field">
            Total Budget (INR)
            <input className="input" type="number" min="300" value={budgetInr} onChange={(event) => setBudgetInr(Number(event.target.value || 0))} />
          </label>
          <label className="discover-controls__field">
            Number of Days
            <input className="input" type="number" min="1" max="14" value={days} onChange={(event) => setDays(Number(event.target.value || 1))} />
          </label>
          <button type="button" className="btn" onClick={generateBudgetPlan} disabled={loading}>
            {loading ? "Generating..." : "Generate Budget Plan"}
          </button>
        </div>
        {status ? <p className="food-meta action-center__reply">{status}</p> : null}
      </section>

      {plan.length > 0 ? (
        <section className="workspace-card">
          <div className="meal-plan-grid">
            {plan.map((day) => (
              <article key={day.day} className="mini-card">
                <p className="recipe-card-modern__badge">{day.day}</p>
                <p className="food-meta">Breakfast: {day.breakfast.title} (INR {day.breakfast.estimatedCostInr})</p>
                <p className="food-meta">Lunch: {day.lunch.title} (INR {day.lunch.estimatedCostInr})</p>
                <p className="food-meta">Dinner: {day.dinner.title} (INR {day.dinner.estimatedCostInr})</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default BudgetPlanner;
