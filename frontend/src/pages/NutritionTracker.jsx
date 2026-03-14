import { useMemo, useState } from "react";

const defaultNutritionTargets = {
  calories: 2200,
  protein: 130,
  carbs: 260,
  fat: 70,
};

const everydayCalorieRefs = [
  { label: "1 whole egg", calories: "~72 kcal" },
  { label: "1 medium roti", calories: "~100 kcal" },
  { label: "Spices (typical use)", calories: "Negligible" },
  { label: "1 garlic clove", calories: "~4 kcal" },
  { label: "1 tsp oil", calories: "~45 kcal" },
];

// Approx values per 100g (raw or standard cooked edible portion).
const nutritionPer100g = {
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  egg: { calories: 143, protein: 13, carbs: 0.7, fat: 10 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  paneer: { calories: 265, protein: 18, carbs: 3, fat: 20 },
  dal: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  oats: { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  yogurt: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  milk: { calories: 64, protein: 3.4, carbs: 5, fat: 3.6 },
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  roti: { calories: 297, protein: 9.6, carbs: 57, fat: 3.7 },
  potato: { calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  onion: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  garlic: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  spices: { calories: 20, protein: 1, carbs: 3, fat: 0.5 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  chickpea: { calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
  fish: { calories: 170, protein: 22, carbs: 0, fat: 8 },
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100 },
  butter: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
};

const unitToGrams = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  piece: 50,
  pc: 50,
};

const ingredientOptions = Object.keys(nutritionPer100g);

const ingredientAliases = {
  eggs: "egg",
  chapati: "roti",
  chapattis: "roti",
  roti: "roti",
};

const createIngredientRow = () => ({ ingredient: "", quantity: 100, unit: "g" });

const createMealState = (dish) => ({
  dish,
  ingredients: [createIngredientRow(), createIngredientRow()],
});

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const round1 = (value) => Math.round(value * 10) / 10;

const normalizeIngredient = (ingredient) => String(ingredient || "").trim().toLowerCase();

const toCanonicalIngredient = (ingredient) => ingredientAliases[ingredient] || ingredient;

const getPersonalizedTargets = () => {
  try {
    const raw = localStorage.getItem("userProfile");
    const parsed = raw ? JSON.parse(raw) : null;
    const weightKg = Number(parsed?.weightKg);
    const heightCm = Number(parsed?.heightCm);

    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(heightCm) || heightCm <= 0) {
      return { ...defaultNutritionTargets, source: "default" };
    }

    // Practical heuristic without age/sex/activity fields.
    const calories = Math.round(Math.max(1500, Math.min(3600, 10 * weightKg + 6.25 * heightCm + 250)));
    const protein = Math.round(Math.max(60, Math.min(220, weightKg * 1.6)));
    const fat = Math.round(Math.max(45, Math.min(120, weightKg * 0.8)));
    const carbs = Math.round(Math.max(120, (calories - protein * 4 - fat * 9) / 4));

    return {
      calories,
      protein,
      carbs,
      fat,
      source: "personalized",
      weightKg,
      heightCm,
    };
  } catch {
    return { ...defaultNutritionTargets, source: "default" };
  }
};

const calculateMealNutrition = (meal) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const unknownIngredients = [];

  meal.ingredients.forEach((row) => {
    const ingredient = toCanonicalIngredient(normalizeIngredient(row.ingredient));
    if (!ingredient) return;

    const macro = nutritionPer100g[ingredient];
    const gramsPerUnit = unitToGrams[String(row.unit || "g").toLowerCase()] || 1;
    const quantity = Math.max(0, toNumber(row.quantity, 0));
    const grams = quantity * gramsPerUnit;

    if (!macro) {
      unknownIngredients.push(ingredient);
      return;
    }

    const factor = grams / 100;
    totals.calories += macro.calories * factor;
    totals.protein += macro.protein * factor;
    totals.carbs += macro.carbs * factor;
    totals.fat += macro.fat * factor;
  });

  return {
    totals: {
      calories: Math.round(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fat: round1(totals.fat),
    },
    unknownIngredients,
  };
};

function NutritionTracker() {
  const nutritionTargets = useMemo(() => getPersonalizedTargets(), []);
  const [meals, setMeals] = useState({
    breakfast: createMealState("Breakfast"),
    lunch: createMealState("Lunch"),
    dinner: createMealState("Dinner"),
  });

  const updateIngredient = (mealKey, index, field, value) => {
    setMeals((prev) => {
      const nextRows = [...prev[mealKey].ingredients];
      nextRows[index] = { ...nextRows[index], [field]: value };
      return {
        ...prev,
        [mealKey]: {
          ...prev[mealKey],
          ingredients: nextRows,
        },
      };
    });
  };

  const addIngredientRow = (mealKey) => {
    setMeals((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        ingredients: [...prev[mealKey].ingredients, createIngredientRow()],
      },
    }));
  };

  const removeIngredientRow = (mealKey, index) => {
    setMeals((prev) => {
      const rows = prev[mealKey].ingredients.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        [mealKey]: {
          ...prev[mealKey],
          ingredients: rows.length ? rows : [createIngredientRow()],
        },
      };
    });
  };

  const mealBreakdown = useMemo(() => {
    return Object.entries(meals).reduce((acc, [mealKey, meal]) => {
      acc[mealKey] = calculateMealNutrition(meal);
      return acc;
    }, {});
  }, [meals]);

  const totals = useMemo(() => {
    return Object.values(mealBreakdown).reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totals.calories,
        protein: round1(acc.protein + meal.totals.protein),
        carbs: round1(acc.carbs + meal.totals.carbs),
        fat: round1(acc.fat + meal.totals.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealBreakdown]);

  const allUnknowns = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(mealBreakdown)
          .flatMap((meal) => meal.unknownIngredients)
          .filter(Boolean)
      )
    );
  }, [mealBreakdown]);

  const progressPercent = (value, target) => Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="workspace-stack">
      <section className="workspace-card workspace-card--hero">
        <h2 className="workspace-title">Daily Nutrition Tracker</h2>
        <p className="workspace-subtitle">
          Add dish ingredients with quantities to estimate calories and macros as accurately as possible.
        </p>
        <p className="food-meta">
          {nutritionTargets.source === "personalized"
            ? `Targets personalized from profile (${nutritionTargets.heightCm} cm, ${nutritionTargets.weightKg} kg).`
            : "Using default targets. Add height and weight at signup for personalized targets."}
        </p>
      </section>

      <section className="workspace-card">
        <h3 className="food-title">Everyday Calorie Quick Reference</h3>
        <div className="nutrition-reference-grid">
          {everydayCalorieRefs.map((item) => (
            <article key={item.label} className="mini-card">
              <p className="food-meta">{item.label}</p>
              <p className="macro-value">{item.calories}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-card">
        <p className="food-meta">Units supported: g, kg, ml, l, tsp, tbsp, cup, piece.</p>
        <p className="food-meta">Tip: add oils/butter and sauces for better calorie accuracy.</p>
      </section>

      <section className="workspace-card">
        <div className="nutrition-meals-grid">
          {Object.entries(meals).map(([mealKey, meal]) => (
            <article key={mealKey} className="mini-card nutrition-meal-card">
              <h3 className="food-title">{meal.dish}</h3>

              <div className="nutrition-ingredient-list">
                {meal.ingredients.map((row, index) => (
                  <div key={`${mealKey}-${index}`} className="nutrition-ingredient-row">
                    <input
                      className="input"
                      list="ingredient-options"
                      value={row.ingredient}
                      placeholder="Ingredient (e.g. rice)"
                      onChange={(event) => updateIngredient(mealKey, index, "ingredient", event.target.value)}
                    />
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={row.quantity}
                      onChange={(event) => updateIngredient(mealKey, index, "quantity", event.target.value)}
                    />
                    <select
                      className="select"
                      value={row.unit}
                      onChange={(event) => updateIngredient(mealKey, index, "unit", event.target.value)}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="tsp">tsp</option>
                      <option value="tbsp">tbsp</option>
                      <option value="cup">cup</option>
                      <option value="piece">piece</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeIngredientRow(mealKey, index)}
                      aria-label={`Remove ingredient ${index + 1} from ${meal.dish}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-secondary" onClick={() => addIngredientRow(mealKey)}>
                + Add Ingredient
              </button>

              <p className="food-meta nutrition-inline-meta">Calories: {mealBreakdown[mealKey].totals.calories} kcal</p>
              <p className="food-meta nutrition-inline-meta">Protein: {mealBreakdown[mealKey].totals.protein} g</p>
              <p className="food-meta nutrition-inline-meta">Carbs: {mealBreakdown[mealKey].totals.carbs} g</p>
              <p className="food-meta nutrition-inline-meta">Fat: {mealBreakdown[mealKey].totals.fat} g</p>
            </article>
          ))}
        </div>

        <datalist id="ingredient-options">
          {ingredientOptions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </section>

      {allUnknowns.length > 0 ? (
        <section className="workspace-card">
          <p className="action-center__reply">
            Accuracy note: nutrition data not found for {allUnknowns.join(", ")}. Add a close matching ingredient name to improve accuracy.
          </p>
        </section>
      ) : null}

      <section className="workspace-card">
        <h3 className="food-title">Today Progress</h3>
        <div className="nutrition-stats-grid">
          <article className="mini-card">
            <p className="food-meta">Calories</p>
            <p className="macro-value">
              {totals.calories} / {nutritionTargets.calories}
            </p>
            <div className="progress-track">
              <span style={{ width: `${progressPercent(totals.calories, nutritionTargets.calories)}%` }} />
            </div>
          </article>
          <article className="mini-card">
            <p className="food-meta">Protein</p>
            <p className="macro-value">
              {totals.protein}g / {nutritionTargets.protein}g
            </p>
            <div className="progress-track">
              <span style={{ width: `${progressPercent(totals.protein, nutritionTargets.protein)}%` }} />
            </div>
          </article>
          <article className="mini-card">
            <p className="food-meta">Carbs</p>
            <p className="macro-value">
              {totals.carbs}g / {nutritionTargets.carbs}g
            </p>
            <div className="progress-track">
              <span style={{ width: `${progressPercent(totals.carbs, nutritionTargets.carbs)}%` }} />
            </div>
          </article>
          <article className="mini-card">
            <p className="food-meta">Fat</p>
            <p className="macro-value">
              {totals.fat}g / {nutritionTargets.fat}g
            </p>
            <div className="progress-track">
              <span style={{ width: `${progressPercent(totals.fat, nutritionTargets.fat)}%` }} />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export default NutritionTracker;
