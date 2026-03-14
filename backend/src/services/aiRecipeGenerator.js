const { callGroq } = require("./groqService");

const aiRecipeCache = new Map();
const aiRecipeById = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10;

const getCache = (key) => {
  const item = aiRecipeCache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL_MS) {
    aiRecipeCache.delete(key);
    return null;
  }
  return item.value;
};

const setCache = (key, value) => {
  aiRecipeCache.set(key, { ts: Date.now(), value });
  if (value?.id) {
    aiRecipeById.set(String(value.id), value);
  }
};

const getAiRecipeById = (id) => {
  return aiRecipeById.get(String(id)) || null;
};

const normalizeAiRecipe = (raw, seed = "") => {
  const title = raw.recipe_name || raw.title || `AI ${seed || "Recipe"}`;
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((item) => {
        if (typeof item === "string") {
          return { name: item, measure: "1" };
        }
        return {
          name: item.name || "ingredient",
          measure: item.measure || "1",
        };
      })
    : [];

  const instructions = Array.isArray(raw.instructions)
    ? raw.instructions
    : String(raw.instructions || "Prepare and cook using standard method.")
        .split(/\n|\./)
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => `${x}.`);

  const time = Number(raw.cook_time || raw.cooking_time || 25);

  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    name: title,
    image: "",
    category: "AI Generated",
    readyInMinutes: Number.isFinite(time) ? time : 25,
    estimatedCalories: `${Math.round(Number(raw.calories || 420))} kcal`,
    estimatedProtein: `${Math.round(Number(raw.protein || 18))} g`,
    macros: {
      calories: `${Math.round(Number(raw.calories || 420))} kcal`,
      protein: `${Math.round(Number(raw.protein || 18))} g`,
      carbohydrates: `${Math.round(Number(raw.carbs || 40))} g`,
      fat: `${Math.round(Number(raw.fat || 18))} g`,
    },
    ingredients,
    instructions,
    isAIGenerated: true,
    aiBadge: "AI Generated Recipe",
  };
};

const parseJson = (text) => {
  const content = String(text || "").trim();
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || content.match(/\{[\s\S]*\}/)?.[0] || content;
  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
};

const generateAiRecipe = async ({ ingredients = [], intent = "tasty_food", query = "" }) => {
  const key = `${intent}|${query}|${ingredients.join(",")}`.toLowerCase();
  const cached = getCache(key);
  if (cached) return cached;

  const ingredientText = ingredients.length > 0 ? ingredients.join(", ") : "any available ingredients";

  if (!process.env.GROQ_API_KEY) {
    const fallback = normalizeAiRecipe(
      {
        recipe_name: `AI Quick ${intent.replace(/_/g, " ")}`,
        ingredients: ["2 eggs", "1 tbsp olive oil", "1 slice bread"],
        instructions: [
          "Whisk eggs and season lightly.",
          "Heat olive oil in a pan and cook eggs.",
          "Toast bread and serve with cooked eggs.",
        ],
        cook_time: 12,
        calories: 320,
        protein: 16,
        carbs: 24,
        fat: 14,
      },
      intent
    );

    setCache(key, fallback);
    return fallback;
  }

  const prompt = `Generate a simple recipe using the following ingredients: ${ingredientText}.\nIntent: ${intent}.\nUser request: ${query}.\nReturn JSON with fields: recipe_name, ingredients, instructions, cook_time, calories, protein, carbs, fat`;

  const response = await callGroq({
    messages: [
      {
        role: "system",
        content:
          "You are a recipe generator. Return strictly valid JSON with practical ingredients and concise steps.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  const parsed = parseJson(response.choices?.[0]?.message?.content || "");
  const normalized = normalizeAiRecipe(parsed || {}, intent);
  setCache(key, normalized);
  return normalized;
};

module.exports = {
  generateAiRecipe,
  getAiRecipeById,
};
