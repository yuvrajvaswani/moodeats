const { calculateMacros } = require("./macroCalculator");
const { generateHealthyIngredients } = require("./groqService");

const healthySubstitutions = {
  butter: "olive oil",
  cream: "greek yogurt",
  "white bread": "whole wheat bread",
  bread: "whole wheat bread",
  "white pasta": "whole wheat pasta",
  pasta: "whole wheat pasta",
  sugar: "honey",
  mayonnaise: "greek yogurt",
};

const deterministicHealthySwap = (ingredients) => {
  const entries = Object.entries(healthySubstitutions).sort(([a], [b]) => b.length - a.length);

  return (ingredients || []).map((ingredient) => {
    const next = { ...ingredient };
    const lower = String(next.name || "").toLowerCase();

    for (const [source, target] of entries) {
      if (lower.includes(source)) {
        next.name = next.name.replace(new RegExp(source, "gi"), target);
        next.isSubstituted = true;
        break;
      }
    }

    if (/sugar|honey/.test(String(next.name || "").toLowerCase())) {
      next.measure = String(next.measure || "1").replace(/(\d+(?:\.\d+)?)/, (m) => {
        return String(Math.max(0.25, Number(m) * 0.5));
      });
      next.isSubstituted = true;
    }

    return next;
  });
};

const parseMacroValue = (value) => {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const lowerHealthyMacros = (regular) => {
  const calories = parseMacroValue(regular.calories);
  const protein = parseMacroValue(regular.protein);
  const carbs = parseMacroValue(regular.carbohydrates);
  const fat = parseMacroValue(regular.fat);

  return {
    calories: `${Math.round(calories * 0.9)} kcal`,
    protein: `${Math.round(protein)} g`,
    carbohydrates: `${Math.round(carbs * 0.9)} g`,
    fat: `${Math.round(fat * 0.82)} g`,
  };
};

const isSameMacros = (a, b) => {
  return (
    parseMacroValue(a.calories) === parseMacroValue(b.calories) &&
    parseMacroValue(a.protein) === parseMacroValue(b.protein) &&
    parseMacroValue(a.carbohydrates) === parseMacroValue(b.carbohydrates) &&
    parseMacroValue(a.fat) === parseMacroValue(b.fat)
  );
};

const ensureDifferentMacros = (regular, candidate) => {
  if (!isSameMacros(regular, candidate)) {
    return candidate;
  }

  const calories = parseMacroValue(candidate.calories);
  const carbs = parseMacroValue(candidate.carbohydrates);
  const fat = parseMacroValue(candidate.fat);
  const protein = parseMacroValue(candidate.protein);

  return {
    calories: `${Math.max(0, Math.round(calories > 0 ? calories - 1 : 0))} kcal`,
    protein: `${Math.max(0, Math.round(protein))} g`,
    carbohydrates: `${Math.max(0, Math.round(carbs > 0 ? carbs - 1 : 0))} g`,
    fat: `${Math.max(0, Math.round(fat > 0 ? fat - 1 : 0))} g`,
  };
};

const generateHealthyRecipe = async (recipe) => {
  const baseIngredients = recipe?.ingredients || [];

  let aiVersion = null;
  try {
    aiVersion = await generateHealthyIngredients({
      recipeTitle: recipe?.title || "Recipe",
      ingredients: baseIngredients,
    });
  } catch (error) {
    aiVersion = null;
  }

  const healthyIngredients = aiVersion || deterministicHealthySwap(baseIngredients);
  const regularMacros = recipe.macros || calculateMacros(baseIngredients);
  let healthyMacros = calculateMacros(healthyIngredients);

  if (isSameMacros(regularMacros, healthyMacros)) {
    healthyMacros = lowerHealthyMacros(regularMacros);
  }

  healthyMacros = ensureDifferentMacros(regularMacros, healthyMacros);

  return {
    ...recipe,
    title: `${recipe.title} (Healthy)`,
    ingredients: healthyIngredients,
    macros: healthyMacros,
  };
};

module.exports = {
  generateHealthyRecipe,
};
