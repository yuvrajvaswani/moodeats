import { useState } from "react";
import api from "../services/api";

function FoodFeedbackActions({ foodId, recipe, onSavedToggle }) {
  const [status, setStatus] = useState("");

  const sendFeedback = async (action, event) => {
    event?.stopPropagation();
    try {
      await api.post("/recipes/feedback", { recipeId: foodId, action });
      setStatus(action === "like" ? "Liked" : "Disliked");
    } catch {
      setStatus("Could not save feedback");
    }
  };

  const toggleSaved = async (event) => {
    event?.stopPropagation();
    try {
      const response = await api.post("/recipes/save", { recipeId: foodId, recipe });
      const isSaved = Boolean(response.data?.saved?.saved);
      setStatus(isSaved ? "Saved" : "Removed");
      if (onSavedToggle) {
        onSavedToggle({ foodId, saved: isSaved });
      }
    } catch {
      setStatus("Could not save item");
    }
  };

  return (
    <div className="feedback-actions">
      <button className="btn btn-secondary" type="button" onClick={(event) => sendFeedback("like", event)}>❤️ Like</button>
      <button className="btn btn-secondary" type="button" onClick={(event) => sendFeedback("dislike", event)}>❌ Dislike</button>
      <button className="btn btn-secondary" type="button" onClick={toggleSaved}>💾 Save</button>
      {status ? <p className="food-meta feedback-status">{status}</p> : null}
    </div>
  );
}

export default FoodFeedbackActions;
