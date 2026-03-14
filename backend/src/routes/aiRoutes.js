const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  detectUserIntent,
  recommendRecipes,
  ingredientSearch,
  aiChat,
  weeklyPlan,
  trackInteraction,
  recommendedFeed,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/intent", verifyToken, detectUserIntent);
router.post("/recommend", verifyToken, recommendRecipes);
router.post("/ingredient-search", verifyToken, ingredientSearch);
router.post("/chat", verifyToken, aiChat);
router.post("/weekly-plan", verifyToken, weeklyPlan);
router.post("/interactions", verifyToken, trackInteraction);
router.get("/recommended-feed", verifyToken, recommendedFeed);

module.exports = router;
