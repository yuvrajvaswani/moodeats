const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const RecipeCatalog = require("../models/RecipeCatalog");
const { fetchMealDb, parseIngredients, toInstructionSteps, estimateCookingTime } = require("../services/themealdbService");
const { calculateMacros } = require("../services/macroCalculator");
const { buildSearchableText } = require("../services/recipeCatalogService");

dotenv.config();

const letters = "abcdefghijklmnopqrstuvwxyz".split("");
const DEFAULT_IMAGE = "/fresh-bowl.svg";

const splitTags = (value) =>
  String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const toCatalogRecord = (meal) => {
  const ingredients = parseIngredients(meal);
  const record = {
    externalId: String(meal.idMeal),
    title: String(meal.strMeal || "Untitled Recipe").trim(),
    image: String(meal.strMealThumb || ""),
    category: String(meal.strCategory || "Recipe"),
    area: String(meal.strArea || ""),
    tags: splitTags(meal.strTags),
    ingredients,
    instructions: toInstructionSteps(meal.strInstructions),
    sourceUrl: String(meal.strSource || ""),
    youtubeUrl: String(meal.strYoutube || ""),
    readyInMinutes: estimateCookingTime(meal),
    macros: calculateMacros(ingredients, 2),
  };

  return {
    ...record,
    searchableText: buildSearchableText(record),
    updatedAt: new Date(),
  };
};

const loadLocalFoods = () => {
  const filePath = path.join(__dirname, "..", "data", "foods.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const inferIngredientsFromTitle = (title, category = "") => {
  const text = `${String(title || "")} ${String(category || "")}`.toLowerCase();
  const inferred = [];

  if (/chicken/.test(text)) inferred.push({ name: "chicken", measure: "180 g" });
  if (/paneer/.test(text)) inferred.push({ name: "cheese", measure: "120 g" });
  if (/egg/.test(text)) inferred.push({ name: "egg", measure: "2 piece" });
  if (/rice|biryani|chawal/.test(text)) inferred.push({ name: "rice", measure: "180 g" });
  if (/pasta|mac/.test(text)) inferred.push({ name: "pasta", measure: "160 g" });
  if (/burger|sandwich|bread/.test(text)) inferred.push({ name: "flour", measure: "120 g" });
  if (/tikka|curry|masala/.test(text)) inferred.push({ name: "olive oil", measure: "1 tbsp" });
  if (/dessert|cake|sweet|chocolate|tiramisu/.test(text)) inferred.push({ name: "sugar", measure: "35 g" });

  // Always include at least one produce and one dairy/protein helper for usable details and macro estimates.
  inferred.push({ name: "tomato", measure: "100 g" });
  inferred.push({ name: "milk", measure: "120 ml" });

  const unique = new Map();
  inferred.forEach((item) => {
    const key = String(item.name || "").toLowerCase();
    if (key && !unique.has(key)) {
      unique.set(key, item);
    }
  });

  const list = Array.from(unique.values());
  return list.slice(0, 6);
};

const inferInstructionsFromTitle = (title) => {
  const cleanTitle = String(title || "Recipe").trim();
  return [
    `Prep ingredients for ${cleanTitle} and keep them ready.`,
    "Cook the base with oil/spices on medium heat for 6-8 minutes.",
    "Add main ingredients and simmer until cooked through.",
    "Adjust seasoning, plate, and serve hot.",
  ];
};

const toCatalogRecordFromLocalFood = (food) => {
  const title = String(food.name || "Local Recipe").trim();
  const category = String(food.category || "Recipe").trim();
  const area = String(food.cuisine || "Global").trim();
  const tags = [
    ...(Array.isArray(food.mood_tags) ? food.mood_tags : []),
    String(food.comfort_level || "").trim(),
    String(food.energy_level || "").trim(),
    String(food.sweet_savory || "").trim(),
  ].filter(Boolean);

  const ingredients = inferIngredientsFromTitle(title, category);
  const instructions = inferInstructionsFromTitle(title);
  const macros = calculateMacros(ingredients, 2);

  const record = {
    externalId: `local-food-${String(food.id)}`,
    title,
    image: DEFAULT_IMAGE,
    category,
    area,
    tags,
    ingredients,
    instructions,
    sourceUrl: "",
    youtubeUrl: "",
    readyInMinutes: 25,
    macros,
  };

  return {
    ...record,
    searchableText: buildSearchableText(record),
    updatedAt: new Date(),
  };
};

const run = async () => {
  await connectDB();

  let totalFetched = 0;
  let totalUpserted = 0;
  let externalFetchFailed = false;

  for (const letter of letters) {
    let meals = [];
    try {
      const payload = await fetchMealDb(`/search.php?f=${letter}`);
      meals = Array.isArray(payload.meals) ? payload.meals : [];
      totalFetched += meals.length;
    } catch (error) {
      externalFetchFailed = true;
      console.warn(`External fetch failed on letter ${letter.toUpperCase()}: ${error.message}`);
      break;
    }

    if (meals.length === 0) {
      continue;
    }

    const operations = meals.map((meal) => {
      const doc = toCatalogRecord(meal);
      return {
        updateOne: {
          filter: { externalId: doc.externalId },
          update: { $set: doc },
          upsert: true,
        },
      };
    });

    const result = await RecipeCatalog.bulkWrite(operations, { ordered: false });
    totalUpserted += (result.upsertedCount || 0) + (result.modifiedCount || 0);
    console.log(`Imported letter ${letter.toUpperCase()}: ${meals.length} recipes`);
  }

  if (externalFetchFailed || totalFetched === 0) {
    const localFoods = loadLocalFoods();
    if (localFoods.length > 0) {
      const localOps = localFoods.map((food) => {
        const doc = toCatalogRecordFromLocalFood(food);
        return {
          updateOne: {
            filter: { externalId: doc.externalId },
            update: { $set: doc },
            upsert: true,
          },
        };
      });

      const localResult = await RecipeCatalog.bulkWrite(localOps, { ordered: false });
      const localUpserted = (localResult.upsertedCount || 0) + (localResult.modifiedCount || 0);
      totalUpserted += localUpserted;
      console.log(`Imported local fallback dataset: ${localFoods.length} recipes`);
    }
  }

  const totalInCatalog = await RecipeCatalog.countDocuments();
  console.log(`Done. Fetched: ${totalFetched}, upserted/updated: ${totalUpserted}, in catalog: ${totalInCatalog}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Catalog import failed:", error.message);
  process.exit(1);
});
