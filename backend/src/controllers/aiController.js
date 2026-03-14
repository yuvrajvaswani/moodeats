const { callGroq } = require("../services/groqService");
const {
  detectIntent,
  INTENTS,
  extractIngredientCandidates,
} = require("../services/intentDetection");
const {
  getRecipesByIntent,
  getRecipesByIngredients,
  normalizeSeed,
  shuffleWithSeed,
} = require("../services/recipeRecommendationService");
const { calculateMacros } = require("../services/macroCalculator");
const { generateHealthyRecipe } = require("../services/assistantFunctions");
const { generateWeeklyPlan } = require("../services/mealPlanner");
const {
  recordUserInteraction,
  getPreferenceSummary,
  getProfile,
} = require("../services/userPreferenceService");

const fallbackOptions = [
  "muscle_gain",
  "weight_loss",
  "healthy_eating",
  "quick_meal",
  "comfort_food",
  "junk_food",
  "tasty_food",
  "ingredient_search",
];

const detectUserIntent = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    const result = await detectIntent(text);

    if (!result.intent) {
      return res.json({
        intent: null,
        source: "fallback",
        message: "I'm not sure what you're looking for.",
        options: fallbackOptions,
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Intent detection failed", detail: error.message });
  }
};

const recommendRecipes = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const explicitIntent = String(req.body?.intent || "").trim();

    const detected = explicitIntent
      ? { intent: explicitIntent, source: "manual" }
      : await detectIntent(text);

    if (!detected.intent) {
      return res.json({
        intent: null,
        source: detected.source,
        message: "I'm not sure what you're looking for.",
        options: fallbackOptions,
        recipes: [],
      });
    }

    let recommendation;

    if (detected.intent === "ingredient_search") {
      const ingredients = req.body?.ingredients || extractIngredientCandidates(text);
      recommendation = await getRecipesByIngredients(ingredients);

      recordUserInteraction(req.user?.id, {
        type: "ingredient_search",
        intent: detected.intent,
        ingredients: recommendation.ingredients,
      });
    } else {
      recommendation = await getRecipesByIntent({
        intent: detected.intent,
        queryText: text,
        profile: getProfile(req.user?.id),
        favorites: getPreferenceSummary(req.user?.id),
      });

      recordUserInteraction(req.user?.id, {
        type: "intent_search",
        intent: detected.intent,
      });
    }

    return res.json({
      intent: detected.intent,
      source: detected.source,
      recipes: recommendation.recipes || [],
      ingredients: recommendation.ingredients || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Recommendation failed", detail: error.message });
  }
};

const ingredientSearch = async (req, res) => {
  try {
    const raw = req.body?.ingredients || req.body?.text || "";
    const ingredients = Array.isArray(raw) ? raw : extractIngredientCandidates(String(raw));

    const recommendation = await getRecipesByIngredients(ingredients);

    recordUserInteraction(req.user?.id, {
      type: "ingredient_search",
      intent: "ingredient_search",
      ingredients,
    });

    return res.json(recommendation);
  } catch (error) {
    return res.status(500).json({ message: "Ingredient search failed", detail: error.message });
  }
};

const aiChat = async (req, res) => {
  try {
    const userMessage = String(req.body?.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ message: "message is required" });
    }

    const intentResult = await detectIntent(userMessage);

    const tools = [
      {
        type: "function",
        function: {
          name: "getRecipesByIntent",
          description: "Recommend recipes from a known intent",
          parameters: {
            type: "object",
            properties: { intent: { type: "string", enum: INTENTS } },
            required: ["intent"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getRecipesByIngredients",
          description: "Recommend recipes from ingredients",
          parameters: {
            type: "object",
            properties: {
              ingredients: { type: "array", items: { type: "string" } },
            },
            required: ["ingredients"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "calculateMacros",
          description: "Estimate macros from ingredients",
          parameters: {
            type: "object",
            properties: {
              ingredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, measure: { type: "string" } },
                },
              },
            },
            required: ["ingredients"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "generateHealthyRecipe",
          description: "Generate healthy substitutions from a recipe object",
          parameters: {
            type: "object",
            properties: {
              recipe: { type: "object" },
            },
            required: ["recipe"],
          },
        },
      },
    ];

    if (!process.env.GROQ_API_KEY) {
      const fallbackIntent = intentResult.intent || "tasty_food";
      const recipes = fallbackIntent === "ingredient_search"
        ? await getRecipesByIngredients(
            extractIngredientCandidates(userMessage),
            getProfile(req.user?.id),
            getPreferenceSummary(req.user?.id)
          )
        : await getRecipesByIntent({
            intent: fallbackIntent,
            queryText: userMessage,
            profile: getProfile(req.user?.id),
            favorites: getPreferenceSummary(req.user?.id),
          });

      return res.json({
        reply: `Intent detected: ${fallbackIntent}. Here are recommendations tailored to your request.`,
        intent: fallbackIntent,
        toolResults: [{ name: "recommend", result: recipes }],
      });
    }

    const system = "You are an AI food recommendation and nutrition assistant. Detect user intent and provide concise practical help. Use tool calls when needed.";

    const first = await callGroq({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const assistantMessage = first.choices?.[0]?.message || {};
    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls.length === 0) {
      return res.json({ reply: assistantMessage.content || "How can I help with food recommendations?", intent: intentResult.intent });
    }

    const toolResults = [];

    for (const toolCall of toolCalls) {
      const name = toolCall.function?.name;
      let args = {};
      try {
        args = JSON.parse(toolCall.function?.arguments || "{}");
      } catch (error) {
        args = {};
      }

      if (name === "getRecipesByIntent") {
        const result = await getRecipesByIntent({
          intent: args.intent,
          queryText: userMessage,
          profile: getProfile(req.user?.id),
          favorites: getPreferenceSummary(req.user?.id),
        });
        toolResults.push({ name, result });
      }

      if (name === "getRecipesByIngredients") {
        const result = await getRecipesByIngredients(
          args.ingredients || [],
          getProfile(req.user?.id),
          getPreferenceSummary(req.user?.id)
        );
        toolResults.push({ name, result });
      }

      if (name === "calculateMacros") {
        const result = calculateMacros(args.ingredients || []);
        toolResults.push({ name, result });
      }

      if (name === "generateHealthyRecipe") {
        const result = await generateHealthyRecipe(args.recipe || { ingredients: [] });
        toolResults.push({ name, result });
      }
    }

    const second = await callGroq({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: toolCalls,
        },
        ...toolResults.map((item, index) => ({
          role: "tool",
          tool_call_id: toolCalls[index]?.id,
          content: JSON.stringify(item.result),
        })),
      ],
      temperature: 0.2,
    });

    return res.json({
      reply: second.choices?.[0]?.message?.content || "Here are your results.",
      intent: intentResult.intent,
      toolResults,
    });
  } catch (error) {
    return res.status(500).json({ message: "Chat failed", detail: error.message });
  }
};

const weeklyPlan = async (req, res) => {
  try {
    const goal = String(req.body?.goal || "healthy_eating").trim();
    const plan = await generateWeeklyPlan(goal);

    recordUserInteraction(req.user?.id, {
      type: "meal_plan",
      intent: goal,
    });

    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ message: "Meal planning failed", detail: error.message });
  }
};

const trackInteraction = (req, res) => {
  try {
    const payload = req.body || {};
    const profile = recordUserInteraction(req.user?.id, payload);
    return res.json({ message: "Interaction stored", profile });
  } catch (error) {
    return res.status(400).json({ message: "Invalid interaction payload", detail: error.message });
  }
};

const recommendedFeed = async (req, res) => {
  try {
    const signals = getPreferenceSummary(req.user?.id);
    const seedIntent = signals.favoriteIntents[0] || "tasty_food";
    const seed = normalizeSeed(req.query.seed);
    const recommendations = await getRecipesByIntent({
      intent: seedIntent,
      queryText: "recommended for you",
      profile: getProfile(req.user?.id),
      favorites: signals,
    });

    const ordered = seed === null
      ? (recommendations.recipes || [])
      : shuffleWithSeed(recommendations.recipes || [], seed);

    return res.json({
      title: "Recommended For You",
      basedOn: signals,
      recipes: ordered,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load personalized feed", detail: error.message });
  }
};

module.exports = {
  detectUserIntent,
  recommendRecipes,
  ingredientSearch,
  aiChat,
  weeklyPlan,
  trackInteraction,
  recommendedFeed,
};
