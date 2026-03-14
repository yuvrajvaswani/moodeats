const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    measure: { type: String, trim: true, default: "1" },
  },
  { _id: false }
);

const recipeCatalogSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    category: { type: String, default: "Recipe", index: true },
    area: { type: String, default: "", index: true },
    tags: { type: [String], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
    instructions: { type: [String], default: [] },
    sourceUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    readyInMinutes: { type: Number, default: 25 },
    searchableText: { type: String, default: "", index: true },
    macros: {
      calories: { type: String, default: "0 kcal" },
      protein: { type: String, default: "0 g" },
      carbohydrates: { type: String, default: "0 g" },
      fat: { type: String, default: "0 g" },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recipeCatalogSchema.index({ title: "text", category: "text", area: "text", tags: "text", searchableText: "text" });

module.exports = mongoose.model("RecipeCatalog", recipeCatalogSchema);
