const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const keywordScore = (text, keywords) => {
  const normalized = String(text || "").toLowerCase();
  return keywords.reduce((acc, item) => (normalized.includes(item) ? acc + 1 : acc), 0);
};

export const estimateRecipeCostInr = (recipe = {}, options = {}) => {
  const mealType = options.mealType || "lunch";
  const title = String(recipe.title || "");
  const textBlob = [recipe.title, recipe.summary, recipe.instructions, recipe.ingredients]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const time = toNumber(recipe.readyInMinutes || recipe.cookingTime, 30);
  const protein = toNumber(recipe.estimatedProtein, 14);

  const mealBase = {
    breakfast: 55,
    lunch: 95,
    dinner: 110,
    snack: 45,
  };

  let cost = mealBase[mealType] || mealBase.lunch;

  // Longer prep and higher-protein dishes generally cost more in Indian home kitchens.
  cost += Math.min(time, 100) * 0.45;
  cost += Math.max(0, protein - 8) * 0.65;

  cost += keywordScore(textBlob, ["chicken", "tikka", "keema"]) * 22;
  cost += keywordScore(textBlob, ["fish", "salmon", "tuna", "prawn", "shrimp"]) * 34;
  cost += keywordScore(textBlob, ["mutton", "lamb", "goat"]) * 52;
  cost += keywordScore(textBlob, ["paneer"]) * 18;
  cost += keywordScore(textBlob, ["egg", "omelette"]) * 10;
  cost += keywordScore(textBlob, ["tofu"]) * 12;

  cost += keywordScore(textBlob, ["biryani", "kebab", "grill", "bake", "roast"]) * 14;
  cost += keywordScore(textBlob, ["dal", "rice", "roti", "chapati", "oats", "poha", "upma"]) * 5;
  cost -= keywordScore(textBlob, ["salad", "soup", "stir fry", "stir-fry"]) * 6;

  if (title.toLowerCase().includes("thali")) {
    cost += 20;
  }

  const bounded = Math.max(40, Math.min(380, cost));
  return Math.round(bounded);
};
