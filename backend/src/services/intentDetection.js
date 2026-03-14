const { callGroq } = require("./groqService");

const INTENTS = [
  "muscle_gain",
  "weight_loss",
  "healthy_eating",
  "quick_meal",
  "comfort_food",
  "junk_food",
  "tasty_food",
  "ingredient_search",
];

const keywordMap = {
  muscle_gain: ["gym", "workout", "protein", "bulk", "muscle", "post workout"],
  weight_loss: ["diet", "lose weight", "calorie deficit", "cut", "fat loss", "lean"],
  healthy_eating: ["healthy", "nutritious", "clean eating", "balanced", "wellness"],
  quick_meal: ["quick", "fast", "easy", "under 20", "in minutes", "hurry"],
  comfort_food: ["comfort", "craving", "hearty", "warm", "cozy"],
  junk_food: ["pizza", "burger", "fries", "greasy", "indulgent", "junk"],
  tasty_food: ["tasty", "delicious", "flavorful", "yummy", "something good"],
  ingredient_search: ["i have", "ingredients", "fridge", "at home", "leftover", "using"],
};

const normalize = (text) => String(text || "").toLowerCase().trim();

const scoreIntentsByKeywords = (text) => {
  const normalized = normalize(text);
  const scores = INTENTS.reduce((acc, intent) => ({ ...acc, [intent]: 0 }), {});

  Object.entries(keywordMap).forEach(([intent, words]) => {
    words.forEach((word) => {
      if (normalized.includes(word)) {
        scores[intent] += 1;
      }
    });
  });

  return scores;
};

const detectIntentByKeywords = (text) => {
  const scores = scoreIntentsByKeywords(text);

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted[0] || sorted[0][1] === 0) {
    return null;
  }

  return sorted[0][0];
};

const detectIntentsByKeywords = (text, max = 3) => {
  const scores = scoreIntentsByKeywords(text);
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([intent]) => intent);

  return sorted;
};

const detectIntentWithAi = async (text) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const prompt = [
    "Classify the user's request into ONE OR MORE categories from this list:",
    "muscle_gain",
    "weight_loss",
    "healthy_eating",
    "quick_meal",
    "comfort_food",
    "junk_food",
    "tasty_food",
    "ingredient_search",
    "Return a comma-separated list using only these category names.",
    "Examples: quick_meal,comfort_food or ingredient_search",
  ].join("\n");

  try {
    const response = await callGroq({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: String(text || "") },
      ],
      temperature: 0,
    });

    const content = String(response.choices?.[0]?.message?.content || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z_,\s]/g, "");

    const parsed = content
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => INTENTS.includes(item));

    return parsed.length > 0 ? Array.from(new Set(parsed)).slice(0, 3) : null;
  } catch (error) {
    return null;
  }
};

const detectIntent = async (text) => {
  const keywordIntents = detectIntentsByKeywords(text);
  if (keywordIntents.length > 0) {
    return { intent: keywordIntents[0], intents: keywordIntents, source: "keyword" };
  }

  const aiIntents = await detectIntentWithAi(text);
  if (aiIntents && aiIntents.length > 0) {
    return { intent: aiIntents[0], intents: aiIntents, source: "ai" };
  }

  return { intent: null, intents: [], source: "fallback" };
};

const extractIngredientCandidates = (text) => {
  const normalized = normalize(text)
    .replace(/i have|ingredients|in my fridge|at home|using|only/gi, "")
    .replace(/and/gi, ",");

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

module.exports = {
  INTENTS,
  detectIntent,
  detectIntentByKeywords,
  detectIntentsByKeywords,
  extractIngredientCandidates,
};
