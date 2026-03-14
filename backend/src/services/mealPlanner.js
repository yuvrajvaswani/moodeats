const { getRecipesByIntent, getRecipesByIntents } = require("./recipeRecommendationService");

const mealSlots = ["Breakfast", "Lunch", "Dinner"];

const plannerProfiles = {
  muscle_gain: {
    intents: ["muscle_gain", "tasty_food"],
    queries: ["high protein weekly plan", "strength meal prep", "protein rich meals"],
  },
  weight_loss: {
    intents: ["weight_loss", "healthy_eating", "quick_meal"],
    queries: ["light calorie meals", "fat loss weekly plan", "lean healthy meals"],
  },
  healthy_eating: {
    intents: ["healthy_eating", "tasty_food"],
    queries: ["balanced weekly meals", "fresh whole foods", "healthy home cooking"],
  },
  quick_easy: {
    intents: ["quick_meal", "tasty_food"],
    queries: ["quick weeknight meals", "easy prep meals", "under 30 minute meals"],
  },
  budget_friendly: {
    intents: ["quick_meal", "comfort_food"],
    queries: ["cheap family meals", "budget pantry meals", "affordable meal prep"],
  },
  comfort_classics: {
    intents: ["comfort_food", "tasty_food"],
    queries: ["comfort classics", "cozy dinner ideas", "hearty homestyle meals"],
  },
  vegetarian_focus: {
    intents: ["healthy_eating", "weight_loss", "tasty_food"],
    queries: ["vegetarian weekly plan", "plant based dinners", "veggie meal prep"],
  },
};

const pickRandom = (arr = []) => arr[Math.floor(Math.random() * arr.length)];

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const generateWeeklyPlan = async (goal) => {
  const selectedGoal = String(goal || "healthy_eating");
  const profile = plannerProfiles[selectedGoal] || plannerProfiles.healthy_eating;
  const randomQuery = `${pickRandom(profile.queries)} ${Math.floor(Math.random() * 1000)}`;

  const combined = await getRecipesByIntents({
    intents: profile.intents,
    queryText: randomQuery,
  });

  let recipePool = shuffle(combined.recipes || []).slice(0, 28);

  // If pool is too small, backfill with single-intent pulls for extra variation.
  if (recipePool.length < 21) {
    const topUpLists = await Promise.all(
      profile.intents.map((intent) => getRecipesByIntent({ intent, queryText: randomQuery }))
    );
    recipePool = shuffle([
      ...recipePool,
      ...topUpLists.flatMap((x) => x.recipes || []),
    ]).slice(0, 28);
  }

  const week = [];
  let index = 0;

  for (let day = 1; day <= 7; day += 1) {
    const meals = {};
    mealSlots.forEach((slot) => {
      meals[slot] = recipePool.length > 0 ? recipePool[index % recipePool.length] : null;
      index += 1;
    });

    week.push({ day: `Day ${day}`, meals });
  }

  return {
    goal: selectedGoal,
    plan: week,
  };
};

module.exports = {
  generateWeeklyPlan,
};
