const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { postInteractions, getPreferenceProfile } = require("../controllers/userController");

const router = express.Router();

router.post("/interactions", verifyToken, postInteractions);
router.get("/profile", verifyToken, getPreferenceProfile);

module.exports = router;
