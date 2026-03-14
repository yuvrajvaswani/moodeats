import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/assistant/chat", label: "Home Hub" },
  { to: "/assistant/discover", label: "Discover" },
  { to: "/assistant/planner", label: "Planner" },
  { to: "/assistant/compare", label: "Compare" },
  { to: "/assistant/tracker", label: "Nutrition" },
  { to: "/assistant/budget", label: "Budget INR" },
  { to: "/assistant/saved", label: "Saved" },
];

const foodFunFacts = [
  "Apples float because about 25% of their volume is air.",
  "Dark chocolate was once used as a military ration for quick energy.",
  "The heat in chilies comes from capsaicin, measured on the Scoville scale.",
  "Carrots were originally cultivated in purple and yellow varieties.",
  "Sourdough bread uses wild yeast and bacteria for fermentation.",
  "The smell of fresh-cut grass comes from plant defense compounds.",
  "Honey can last for years when stored properly because of its low moisture content.",
  "Bananas are berries, but strawberries are not botanically true berries.",
  "Vanilla comes from the seed pods of an orchid plant.",
  "Tomatoes were once called love apples in parts of Europe.",
  "Potatoes were the first vegetable grown in space experiments.",
  "Black pepper was once so valuable it was used as currency in trade.",
  "Mangoes belong to the same plant family as cashews and pistachios.",
  "Cheese can contain hundreds of flavor compounds formed during aging.",
  "Tea leaves from the same plant can become green, oolong, or black tea depending on processing.",
  "Pineapple contains bromelain, an enzyme that can tenderize meat.",
  "Cocoa beans are fermented before they are roasted into chocolate.",
  "Cucumbers are about 95 percent water.",
  "The world\'s saffron supply comes from hand-harvested flower stigmas.",
  "Coffee cherries are fruits, and each fruit usually contains two coffee beans.",
  "Peanuts are legumes, not true tree nuts.",
  "Wasabi served in many restaurants is often a blend with horseradish.",
  "Kimchi fermentation creates lactic acid, which gives its tangy flavor.",
  "Olive oil flavor can vary a lot based on olive type and harvest timing.",
  "Cinnamon sold globally comes from the inner bark of several tree species.",
  "Some sea salts get their color from trace minerals and natural algae.",
  "Fresh basil leaves darken quickly if bruised because of oxidation.",
  "Yogurt cultures can improve texture and tang while reducing lactose content.",
  "Rice has thousands of cultivars, each with distinct aroma and texture.",
  "Garlic develops a sweeter taste when roasted due to caramelization.",
];

const quickTips = [
  "Try combined intents like: healthy + quick.",
  "Use Discover to browse without chatting.",
  "Save recipes, then revisit them in one tap.",
  "Use Planner to generate a weekly structure.",
];

const getNextFactIndex = (current, total) => {
  if (total <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * total);
  }
  return next;
};

function AppLayout() {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * foodFunFacts.length));
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="app-layout page-enter">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <aside className="app-layout__nav" aria-label="Primary navigation">
        <div>
          <p className="app-layout__eyebrow">Meal AI</p>
          <h1 className="app-layout__brand">Kitchen Copilot</h1>
          <p className="app-layout__copy">A practical food assistant for daily choices, not a demo project.</p>
        </div>

        <nav className="app-layout__nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-nav-link ${isActive ? "app-nav-link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn-secondary app-layout__logout"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }}
        >
          Sign Out
        </button>
      </aside>

      <main id="main-content" className="app-layout__main" aria-live="polite">
        <Outlet />
      </main>

      <aside className="app-layout__aside" aria-label="Helpful context">
        <section className="info-card info-card--highlight">
          <h3 className="info-card__title">Today</h3>
          <p className="info-card__date">{dateLabel}</p>
          <p className="food-meta">Pick one intent, one ingredient set, and one practical meal to execute today.</p>
        </section>

        <section className="info-card">
          <h3 className="info-card__title">Food Fun Fact</h3>
          <p className="food-meta">Tap to reveal a random food fact.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFactIndex((current) => getNextFactIndex(current, foodFunFacts.length));
            }}
          >
            Random Fact
          </button>
          <p className="action-center__reply">{foodFunFacts[factIndex]}</p>
        </section>

        <section className="info-card">
          <h3 className="info-card__title">Suggested Workflow</h3>
          <ol className="info-card__list">
            <li>Ask in AI Chat</li>
            <li>Refine in Discover</li>
            <li>Lock routine in Planner</li>
          </ol>
        </section>

        <section className="info-card">
          <h3 className="info-card__title">Power Tips</h3>
          <ul className="info-card__list">
            {quickTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <img className="info-card__image" src="/fresh-bowl.svg" alt="Fresh bowl ingredients illustration" />
        </section>
      </aside>
    </div>
  );
}

export default AppLayout;
