import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const options = {
  goal: ["Healthy", "Quick", "Comfort", "High Protein", "Budget", "No Preference"],
  time: ["< 20 min", "20-40 min", "40-60 min", "No limit"],
  style: ["Home-style", "Spicy", "Fresh", "Indulgent", "Surprise me"],
};

const mapGoalToIntent = {
  Healthy: "healthy_eating",
  Quick: "quick_meal",
  Comfort: "comfort_food",
  "High Protein": "muscle_gain",
  Budget: "quick_meal",
  "No Preference": "tasty_food",
};

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({ goal: "", time: "", style: "" });
  const navigate = useNavigate();

  const currentStep = useMemo(() => {
    if (!answers.goal) return "goal";
    if (!answers.time) return "time";
    if (!answers.style) return "style";
    return "done";
  }, [answers]);

  const summary = useMemo(() => {
    if (currentStep !== "done") return "";
    return `Got it: ${answers.goal}, ${answers.time}, ${answers.style}. I will route you to best matches.`;
  }, [answers, currentStep]);

  const continueToDiscover = () => {
    const intent = mapGoalToIntent[answers.goal] || "tasty_food";
    const q = `${answers.goal} ${answers.style} ${answers.time}`;
    navigate(`/assistant/discover?intent=${encodeURIComponent(intent)}&q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const resetFlow = () => {
    setAnswers({ goal: "", time: "", style: "" });
  };

  return (
    <div className="chatbot-wrap">
      <button type="button" className="chatbot-toggle" onClick={() => setOpen((prev) => !prev)}>
        {open ? "Close" : "Help me choose"}
      </button>
      {open ? (
        <div className="chatbot-panel">
          <div className="chatbot-messages">
            <p className="chatbot-msg chatbot-msg--assistant">
              I will ask a few quick questions so you can decide what to eat.
            </p>
            {!answers.goal ? <p className="chatbot-msg chatbot-msg--assistant">What is your top goal right now?</p> : null}
            {answers.goal && !answers.time ? <p className="chatbot-msg chatbot-msg--assistant">How much time do you have?</p> : null}
            {answers.goal && answers.time && !answers.style ? <p className="chatbot-msg chatbot-msg--assistant">What flavor/style are you in the mood for?</p> : null}
            {summary ? <p className="chatbot-msg chatbot-msg--assistant">{summary}</p> : null}
          </div>

          <div className="chatbot-quick-prompts" aria-label="Quick prompt suggestions">
            {currentStep !== "done"
              ? options[currentStep].map((option) => (
              <button
                key={option}
                type="button"
                className="command-chip"
                onClick={() => setAnswers((prev) => ({ ...prev, [currentStep]: option }))}
              >
                {option}
              </button>
              ))
              : null}
          </div>

          <div className="chatbot-input-row">
            <button type="button" className="btn btn-secondary" onClick={resetFlow}>Restart</button>
            <button type="button" className="btn" onClick={continueToDiscover} disabled={currentStep !== "done"}>
              Show Recipes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ChatbotWidget;
