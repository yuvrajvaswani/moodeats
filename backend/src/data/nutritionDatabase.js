// Nutrition Database: macros per 100g for common ingredients
// Used for macro estimation since TheMealDB does not provide nutrition data

const nutritionDatabase = {
  // Proteins
  chicken: {
    name: "Chicken (cooked)",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  "chicken breast": {
    name: "Chicken Breast (cooked)",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  egg: {
    name: "Egg (whole)",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
  },
  "egg white": {
    name: "Egg White",
    calories: 52,
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
  },
  "ground beef": {
    name: "Ground Beef (85/15)",
    calories: 217,
    protein: 23,
    carbs: 0,
    fat: 13,
  },
  beef: {
    name: "Beef (lean, cooked)",
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
  },
  fish: {
    name: "Fish (salmon)",
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
  },
  salmon: {
    name: "Salmon (cooked)",
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
  },
  tuna: {
    name: "Tuna (canned in water)",
    calories: 96,
    protein: 21,
    carbs: 0,
    fat: 0.8,
  },
  turkey: {
    name: "Turkey (cooked)",
    calories: 189,
    protein: 29,
    carbs: 0,
    fat: 7.4,
  },

  // Dairy
  milk: {
    name: "Milk (whole)",
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
  },
  "whole milk": {
    name: "Milk (whole)",
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
  },
  "skim milk": {
    name: "Milk (skim)",
    calories: 35,
    protein: 3.4,
    carbs: 4.9,
    fat: 0.1,
  },
  yogurt: {
    name: "Yogurt (plain, whole)",
    calories: 59,
    protein: 3.5,
    carbs: 4.7,
    fat: 0.4,
  },
  "greek yogurt": {
    name: "Greek Yogurt (plain, nonfat)",
    calories: 59,
    protein: 10,
    carbs: 3.3,
    fat: 0.4,
  },
  cheese: {
    name: "Cheese (cheddar)",
    calories: 403,
    protein: 23,
    carbs: 3.3,
    fat: 33,
  },
  butter: {
    name: "Butter",
    calories: 717,
    protein: 0.9,
    carbs: 0.1,
    fat: 81,
  },
  cream: {
    name: "Cream (heavy)",
    calories: 340,
    protein: 2.2,
    carbs: 2.8,
    fat: 35,
  },

  // Oils & Fats
  "olive oil": {
    name: "Olive Oil",
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
  },
  oil: {
    name: "Oil (vegetable)",
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
  },
  "coconut oil": {
    name: "Coconut Oil",
    calories: 892,
    protein: 0,
    carbs: 0,
    fat: 99,
  },

  // Grains
  pasta: {
    name: "Pasta (cooked, white)",
    calories: 131,
    protein: 5,
    carbs: 25,
    fat: 1.1,
  },
  "white pasta": {
    name: "Pasta (cooked, white)",
    calories: 131,
    protein: 5,
    carbs: 25,
    fat: 1.1,
  },
  "whole wheat pasta": {
    name: "Pasta (cooked, whole wheat)",
    calories: 124,
    protein: 5.3,
    carbs: 23,
    fat: 0.5,
  },
  rice: {
    name: "Rice (cooked, white)",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
  },
  "white rice": {
    name: "Rice (cooked, white)",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
  },
  "brown rice": {
    name: "Rice (cooked, brown)",
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
  },
  bread: {
    name: "Bread (white)",
    calories: 265,
    protein: 9,
    carbs: 49,
    fat: 3.3,
  },
  "whole wheat bread": {
    name: "Bread (whole wheat)",
    calories: 247,
    protein: 12,
    carbs: 41,
    fat: 3.6,
  },
  flour: {
    name: "Flour (all-purpose)",
    calories: 364,
    protein: 10,
    carbs: 76,
    fat: 1,
  },
  sugar: {
    name: "Sugar (white)",
    calories: 387,
    protein: 0,
    carbs: 100,
    fat: 0,
  },
  oats: {
    name: "Oats (dry)",
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 6.9,
  },

  // Vegetables
  tomato: {
    name: "Tomato (raw)",
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
  },
  potato: {
    name: "Potato (cooked, boiled)",
    calories: 77,
    protein: 1.7,
    carbs: 17,
    fat: 0.1,
  },
  onion: {
    name: "Onion (raw)",
    calories: 40,
    protein: 1.1,
    carbs: 9,
    fat: 0.1,
  },
  garlic: {
    name: "Garlic (raw)",
    calories: 149,
    protein: 6.4,
    carbs: 33,
    fat: 0.5,
  },
  pepper: {
    name: "Bell Pepper (red, raw)",
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0.3,
  },
  carrot: {
    name: "Carrot (raw)",
    calories: 41,
    protein: 0.9,
    carbs: 10,
    fat: 0.2,
  },
  broccoli: {
    name: "Broccoli (raw)",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
  },
  spinach: {
    name: "Spinach (raw)",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
  },
  lettuce: {
    name: "Lettuce (raw)",
    calories: 15,
    protein: 1.2,
    carbs: 3,
    fat: 0.2,
  },
  mushroom: {
    name: "Mushroom (raw)",
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
  },

  // Fruits
  banana: {
    name: "Banana (raw)",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
  },
  apple: {
    name: "Apple (raw)",
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
  },
  orange: {
    name: "Orange (raw)",
    calories: 47,
    protein: 0.9,
    carbs: 12,
    fat: 0.1,
  },
  lemon: {
    name: "Lemon (raw)",
    calories: 29,
    protein: 1.1,
    carbs: 9,
    fat: 0.3,
  },
  lime: {
    name: "Lime (raw)",
    calories: 30,
    protein: 0.7,
    carbs: 11,
    fat: 0.2,
  },
  avocado: {
    name: "Avocado (raw)",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
  },

  // Seasonings & Condiments
  salt: {
    name: "Salt",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  pepper: {
    name: "Black Pepper",
    calories: 251,
    protein: 10,
    carbs: 64,
    fat: 3.3,
  },
  honey: {
    name: "Honey",
    calories: 304,
    protein: 0.3,
    carbs: 82,
    fat: 0,
  },
  vinegar: {
    name: "Vinegar (white)",
    calories: 18,
    protein: 0.1,
    carbs: 0.4,
    fat: 0,
  },
  soy: {
    name: "Soy Sauce",
    calories: 60,
    protein: 8,
    carbs: 5.6,
    fat: 0,
  },
  ketchup: {
    name: "Ketchup",
    calories: 104,
    protein: 1.7,
    carbs: 25,
    fat: 0.1,
  },
  mayonnaise: {
    name: "Mayonnaise",
    calories: 680,
    protein: 0.2,
    carbs: 0.6,
    fat: 75,
  },
};

// Export both the database and a search function
const findNutrition = (ingredientName) => {
  if (!ingredientName) return null;

  const normalized = ingredientName
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .trim();

  // Direct match
  if (nutritionDatabase[normalized]) {
    return nutritionDatabase[normalized];
  }

  // Partial match (search for substring)
  const keys = Object.keys(nutritionDatabase);
  for (const key of keys) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return nutritionDatabase[key];
    }
  }

  // No match found
  return null;
};

module.exports = {
  nutritionDatabase,
  findNutrition,
};
