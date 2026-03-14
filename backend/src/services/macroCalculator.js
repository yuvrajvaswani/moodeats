const nutritionDb = require("../data/nutritionDatabase.json");

const parseNumber = (value) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) return null;

  if (cleaned.includes("/")) {
    const [a, b] = cleaned.split("/").map(Number);
    if (a && b) return a / b;
  }

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const measureToGrams = (measure = "") => {
  const text = String(measure).toLowerCase();
  const fractionMatch = text.match(/(\d+\/\d+)/);
  const decimalMatch = text.match(/(\d+(?:\.\d+)?)/);
  const amount = parseNumber(fractionMatch?.[1] || decimalMatch?.[1]) || 1;

  if (text.includes("pinch") || text.includes("dash")) return 1;
  if (text.includes("clove")) return amount * 3;
  if (text.includes("slice")) return amount * 30;
  if (text.includes("piece")) return amount * 50;

  if (text.includes("tbsp")) return amount * 15;
  if (text.includes("tsp")) return amount * 5;
  if (text.includes("cup")) return amount * 240;
  if (text.includes("oz")) return amount * 28.35;
  if (text.includes("kg")) return amount * 1000;
  if (text.includes("g")) return amount;
  if (text.includes("ml")) return amount;
  // Unknown unit defaults lower to avoid unrealistic macro inflation.
  return amount * 35;
};

const findNutrition = (ingredientName = "") => {
  const normalized = String(ingredientName).trim().toLowerCase();
  if (!normalized) return null;

  if (nutritionDb[normalized]) return nutritionDb[normalized];

  const key = Object.keys(nutritionDb).find(
    (entry) => normalized.includes(entry) || entry.includes(normalized)
  );

  if (key) return nutritionDb[key];

  // Heuristic fallback for ingredients not explicitly in DB.
  if (/chicken|turkey/.test(normalized)) return nutritionDb.chicken;
  if (/beef|steak|minced/.test(normalized)) return nutritionDb.beef;
  if (/fish|salmon|tuna|squid|prawn|shrimp/.test(normalized)) return { calories: 170, protein: 24, carbs: 0, fat: 7 };
  if (/egg/.test(normalized)) return nutritionDb.egg;
  if (/milk|yogurt|cream|cheese/.test(normalized)) return nutritionDb.milk;
  if (/oil|butter|ghee/.test(normalized)) return nutritionDb["olive oil"] || nutritionDb.butter;
  if (/rice|pasta|bread|flour/.test(normalized)) return nutritionDb.rice;
  if (/sugar|honey|syrup/.test(normalized)) return nutritionDb.sugar;
  if (/potato|tomato|carrot|onion|pepper|vegetable/.test(normalized)) return nutritionDb.tomato;

  return null;
};

const calculateMacros = (ingredients = [], servings = 2) => {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  ingredients.forEach((ingredient) => {
    const item = typeof ingredient === "string" ? { name: ingredient, measure: "1" } : ingredient;
    const nutrition = findNutrition(item.name);
    if (!nutrition) return;

    const grams = Math.max(1, Math.min(1200, measureToGrams(item.measure || "1")));
    const factor = grams / 100;

    total.calories += nutrition.calories * factor;
    total.protein += nutrition.protein * factor;
    total.carbs += nutrition.carbs * factor;
    total.fat += nutrition.fat * factor;
  });

  const safeServings = Math.max(1, Number(servings) || 1);
  const perServing = {
    calories: total.calories / safeServings,
    protein: total.protein / safeServings,
    carbs: total.carbs / safeServings,
    fat: total.fat / safeServings,
  };

  return {
    calories: `${Math.round(perServing.calories)} kcal`,
    protein: `${Math.round(perServing.protein)} g`,
    carbohydrates: `${Math.round(perServing.carbs)} g`,
    fat: `${Math.round(perServing.fat)} g`,
  };
};

module.exports = {
  calculateMacros,
  findNutrition,
};
