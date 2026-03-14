const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
	getRecipeFeed,
	getCuisineFeed,
	generateRecipe,
	getRecipeDetails,
	postRecipeFeedback,
	toggleSavedRecipe,
	getSavedRecipes,
} = require("../controllers/recipeController");

const router = express.Router();

router.get("/feed", verifyToken, getRecipeFeed);
router.get("/cuisine", verifyToken, getCuisineFeed);
router.post("/generate", verifyToken, generateRecipe);
router.post("/feedback", verifyToken, postRecipeFeedback);
router.post("/save", verifyToken, toggleSavedRecipe);
router.get("/saved", verifyToken, getSavedRecipes);
router.get("/:id", verifyToken, getRecipeDetails);

module.exports = router;
