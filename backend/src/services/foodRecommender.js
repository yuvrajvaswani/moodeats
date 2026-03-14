const foods = require("../data/foods.json");

const RECENT_HISTORY_LIMIT = 120;
const RECOMMENDATION_COUNT = 25;

const userStore = new Map();

const moodProfiles = {
  sad: { comfort: "high", energy: "low", sweet: "sweet" },
  overstimulated: { comfort: "medium", energy: "low", sweet: "savory" },
  sleep_deprived: { comfort: "medium", energy: "high", sweet: "savory" },
  overworked: { comfort: "high", energy: "high", sweet: "savory" },
  irritated: { comfort: "medium", energy: "medium", sweet: "savory" },
  excited: { comfort: "medium", energy: "high", sweet: "sweet" },
};

const moodVibe = {
  sad: "comfort mode",
  overstimulated: "calm reset",
  sleep_deprived: "quick recharge",
  overworked: "focus fuel",
  irritated: "stress crunch",
  excited: "celebration mode",
};

const restaurantsByCuisine = {
  Indian: ["Biryani Blues", "Haldiram's", "Mainland Spice"],
  Italian: ["Little Italy", "Toscano", "La Pino'z"],
  Chinese: ["Mainland China", "Wow China", "Yum Yum Wok"],
  American: ["Burger Factory", "Smash House", "Diner 54"],
  Global: ["Fusion Bowl", "Urban Kitchen", "World Street Eats"],
};

const restaurantTypeByCategory = {
  Main: "restaurant",
  Snack: "quick bites",
  Dessert: "dessert place",
  Drink: "cafe",
};

const timeProfiles = {
  morning: {
    boostedCategories: ["Drink", "Main"],
    energyBoost: "high",
  },
  afternoon: {
    boostedCategories: ["Main", "Snack"],
    energyBoost: "medium",
  },
  night: {
    boostedCategories: ["Main", "Dessert"],
    comfortBoost: "high",
  },
};

const levelScore = {
  low: 1,
  medium: 2,
  high: 3,
};

const normalizeMood = (mood) => {
  const key = String(mood || "").trim().toLowerCase().replace(/-/g, "_");

  if (moodProfiles[key]) {
    return key;
  }

  if (["happy", "celebrating", "bored", "stressed", "tired"].includes(key)) {
    return "excited";
  }

  return "excited";
};

const normalizeTimeOfDay = (timeOfDay) => {
  const key = String(timeOfDay || "").trim().toLowerCase();
  if (timeProfiles[key]) {
    return key;
  }

  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
};

const createUserState = () => ({
  recentShown: [],
  liked: new Set(),
  disliked: new Set(),
  saved: new Set(),
});

const getUserState = (userId) => {
  const key = String(userId || "guest");
  if (!userStore.has(key)) {
    userStore.set(key, createUserState());
  }

  return userStore.get(key);
};

const toNumericId = (value) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
};

const applyInlineFeedback = (state, userFeedback) => {
  if (!userFeedback || typeof userFeedback !== "object") {
    return;
  }

  const likedIds = Array.isArray(userFeedback.liked) ? userFeedback.liked : [];
  const dislikedIds = Array.isArray(userFeedback.disliked) ? userFeedback.disliked : [];

  likedIds.forEach((foodId) => {
    const id = toNumericId(foodId);
    if (!id) return;
    state.liked.add(id);
    state.disliked.delete(id);
  });

  dislikedIds.forEach((foodId) => {
    const id = toNumericId(foodId);
    if (!id) return;
    state.disliked.add(id);
    state.liked.delete(id);
  });
};

const scoreFood = (food, mood, timeOfDay, state) => {
  const moodProfile = moodProfiles[mood] || moodProfiles.excited;
  const timeProfile = timeProfiles[timeOfDay] || timeProfiles.afternoon;

  let score = 0;

  if (food.mood_tags.includes(mood)) {
    score += 3;
  }

  if (food.comfort_level === moodProfile.comfort) {
    score += 2;
  }

  if (food.energy_level === moodProfile.energy) {
    score += 2;
  }

  if (food.sweet_savory === moodProfile.sweet) {
    score += 1;
  }

  if (timeProfile.boostedCategories.includes(food.category)) {
    score += 1.5;
  }

  if (timeProfile.energyBoost && food.energy_level === timeProfile.energyBoost) {
    score += 1.5;
  }

  if (timeProfile.comfortBoost && food.comfort_level === timeProfile.comfortBoost) {
    score += 1.5;
  }

  if (state.liked.has(food.id)) {
    score += 2;
  }

  if (state.disliked.has(food.id)) {
    score -= 3;
  }

  score += Math.random() * 0.8;

  return score;
};

const buildExplanation = (food, mood, timeOfDay) => {
  const moodLabel = mood.replace(/_/g, " ");
  const parts = [
    `Picked for ${moodLabel} mood`,
    `${food.comfort_level} comfort`,
    `${food.energy_level} energy`,
    `${food.sweet_savory} leaning`,
    `works well in the ${timeOfDay}`,
  ];

  return `${parts[0]}: ${parts[1]}, ${parts[2]}, ${parts[3]} and ${parts[4]}.`;
};

const shuffle = (list) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const getRecommendations = ({ userId, mood, timeOfDay, userFeedback }) => {
  const normalizedMood = normalizeMood(mood);
  const normalizedTime = normalizeTimeOfDay(timeOfDay);
  const state = getUserState(userId);

  applyInlineFeedback(state, userFeedback);

  const recentSet = new Set(state.recentShown);

  let candidates = foods.filter((food) => !recentSet.has(food.id));
  if (candidates.length < RECOMMENDATION_COUNT) {
    candidates = foods.filter((food) => !state.disliked.has(food.id));
  }

  const scored = candidates
    .map((food) => ({
      food,
      score: scoreFood(food, normalizedMood, normalizedTime, state),
    }))
    .sort((first, second) => second.score - first.score);

  const topPool = scored.slice(0, Math.max(100, RECOMMENDATION_COUNT));
  const selected = shuffle(topPool)
    .slice(0, RECOMMENDATION_COUNT)
    .map((entry, index) => {
      const restaurants = restaurantsByCuisine[entry.food.cuisine] || restaurantsByCuisine.Global;

      return {
        ...entry.food,
        vibe: moodVibe[normalizedMood] || moodVibe.excited,
        restaurantName: restaurants[index % restaurants.length],
        restaurantType: restaurantTypeByCategory[entry.food.category] || "restaurant",
        explanation: buildExplanation(entry.food, normalizedMood, normalizedTime),
      };
    });

  const selectedIds = selected.map((item) => item.id);
  state.recentShown = [...state.recentShown, ...selectedIds].slice(-RECENT_HISTORY_LIMIT);

  return {
    mood: normalizedMood,
    timeOfDay: normalizedTime,
    suggestions: selected,
  };
};

const submitFeedback = ({ userId, foodId, action }) => {
  const id = toNumericId(foodId);
  if (!id) {
    throw new Error("Invalid foodId");
  }

  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!["like", "dislike"].includes(normalizedAction)) {
    throw new Error("Invalid action");
  }

  const state = getUserState(userId);

  if (normalizedAction === "like") {
    state.liked.add(id);
    state.disliked.delete(id);
  } else {
    state.disliked.add(id);
    state.liked.delete(id);
  }

  return {
    foodId: id,
    action: normalizedAction,
  };
};

const toggleSavedFood = ({ userId, foodId }) => {
  const id = toNumericId(foodId);
  if (!id) {
    throw new Error("Invalid foodId");
  }

  const state = getUserState(userId);

  if (state.saved.has(id)) {
    state.saved.delete(id);
    return { foodId: id, saved: false };
  }

  state.saved.add(id);
  return { foodId: id, saved: true };
};

const listSavedFoods = ({ userId }) => {
  const state = getUserState(userId);
  const savedIds = new Set(state.saved);
  return foods.filter((food) => savedIds.has(food.id));
};

module.exports = {
  getRecommendations,
  submitFeedback,
  toggleSavedFood,
  listSavedFoods,
};
