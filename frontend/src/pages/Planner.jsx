import MealPlanner from "../components/MealPlanner/MealPlanner";

function Planner() {
  return (
    <div className="workspace-stack">
      <section className="workspace-card">
        <h2 className="workspace-title">Weekly Planner</h2>
        <p className="workspace-subtitle">Generate a practical 7-day structure based on your current food goal.</p>
      </section>
      <MealPlanner />
    </div>
  );
}

export default Planner;
