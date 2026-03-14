import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const fallbackOptions = [
  { label: "Build Muscle", value: "muscle_gain" },
  { label: "Lose Weight", value: "weight_loss" },
  { label: "Eat Healthy", value: "healthy_eating" },
  { label: "Quick Meal", value: "quick_meal" },
  { label: "Comfort Food", value: "comfort_food" },
  { label: "Junk Food", value: "junk_food" },
  { label: "Tasty Food", value: "tasty_food" },
  { label: "Search by Ingredients", value: "ingredient_search" },
];

const suggestedCommands = [
  "Healthy and tasty dinner under 30 minutes",
  "Comfort food that is still quick",
  "High protein lunch with chicken",
  "Cheap vegetarian meals for this week",
  "Suggest easy meals from eggs, rice, and spinach",
];

function ChatInterface() {
  const userName = localStorage.getItem("userName") || "Friend";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Tell me what you want to eat in natural language, and I will understand your intent.",
    },
  ]);
  const [detectedIntent, setDetectedIntent] = useState("");
  const [detectedIntents, setDetectedIntents] = useState([]);
  const [showFallback, setShowFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const trackInteraction = async (payload) => {
    try {
      await api.post("/user/interactions", payload);
    } catch {
      // best-effort tracking
    }
  };

  const runRecommendation = async ({ text, intent }) => {
    const response = await api.post("/ai/recommend", { text, intent });
    setDetectedIntent(response.data?.intent || "");
    setDetectedIntents(response.data?.intents || []);

    if (response.data?.intent) {
      setShowFallback(false);
      await trackInteraction({
        type: "intent_search",
        intent: response.data.intent,
      });
    } else {
      setShowFallback(true);
    }

    return response.data;
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const intentResponse = await api.post("/ai/intent", { text });

      if (!intentResponse.data?.intent) {
        setShowFallback(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: intentResponse.data?.message || "I'm not sure what you're looking for." },
        ]);
        return;
      }

      const recommendation = await runRecommendation({ text });
      const chatResponse = await api.post("/ai/chat", { message: text });
      const intentSummary = recommendation.intents?.length
        ? recommendation.intents.join(", ")
        : recommendation.intent;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `${chatResponse.data?.reply || "Here are some ideas."}\nDetected intent: ${intentSummary}.`,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I could not process that request right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackClick = async (intent) => {
    setLoading(true);
    try {
      const recommendation = await runRecommendation({ text: "", intent });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Great choice. I will recommend recipes for ${recommendation.intent}.` },
      ]);
      setShowFallback(false);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Could not load those recommendations." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-home page-enter">
      <header className="chat-home__header">
        <h1 className="chat-home__title">Hi {userName}, how can I help you?</h1>
        <p className="chat-home__subtitle">Ask naturally, then jump to Discover for filtered browsing.</p>
      </header>

      <section className="chat-window" aria-label="Conversation history">
        {messages.map((message, index) => (
          <p key={`${message.role}-${index}`} className={`chatbot-msg chatbot-msg--${message.role}`}>
            {message.text}
          </p>
        ))}
      </section>

      <div className="suggested-commands" aria-label="Suggested commands">
        <p className="suggested-commands__label">Suggested commands</p>
        <div className="command-chip-row" role="list">
          {suggestedCommands.map((command) => (
            <button
              key={command}
              type="button"
              role="listitem"
              className="command-chip"
              onClick={() => setInput(command)}
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-input-wrap">
        <input
          type="text"
          value={input}
          placeholder="Try: healthy and tasty dinner with chicken"
          aria-label="Describe what food you want"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
        />
        <button className="btn" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {showFallback ? (
        <section className="ai-box">
          <p className="food-meta">I am not sure what you are looking for. Pick an intent:</p>
          <div className="intent-options-grid">
            {fallbackOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="btn btn-secondary"
                onClick={() => handleFallbackClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {detectedIntent || detectedIntents.length ? (
        <section className="ai-box">
          <p className="food-meta">
            Latest detected intent:
            {" "}
            <strong>{detectedIntents.length ? detectedIntents.join(", ") : detectedIntent}</strong>
          </p>
          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/discover")}>Open Discover</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/assistant/planner")}>Open Planner</button>
          </div>
        </section>
      ) : null}

      {loading ? <div className="loading-pulse">Loading recommendations...</div> : null}
    </div>
  );
}

export default ChatInterface;
