const { recordUserInteraction, getProfile, getPreferenceSummary } = require("../services/userPreferenceService");

const postInteractions = (req, res) => {
  try {
    const profile = recordUserInteraction(req.user?.id, req.body || {});
    return res.json({ message: "Interaction stored", profile });
  } catch (error) {
    return res.status(400).json({ message: "Invalid interaction payload", detail: error.message });
  }
};

const getPreferenceProfile = (req, res) => {
  try {
    return res.json({
      profile: getProfile(req.user?.id),
      summary: getPreferenceSummary(req.user?.id),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load profile", detail: error.message });
  }
};

module.exports = {
  postInteractions,
  getPreferenceProfile,
};
