import { useState } from "react";
import api from "../../services/api";

function CookingAssistant({ recipeTitle }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about this recipe: swaps, steps, nutrition." },
  ]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const scopedQuestion = `Recipe context: ${recipeTitle}. User question: ${trimmed}`;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", { message: scopedQuestion });
      setMessages((prev) => [...prev, { role: "assistant", text: response.data.reply || "Try a lighter swap like olive oil." }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "I could not answer right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cooking-assistant">
      <h3 className="food-title">AI Cooking Assistant</h3>
      <div className="cooking-assistant__messages">
        {messages.map((message, index) => (
          <p key={`${message.role}-${index}`} className={`chatbot-msg chatbot-msg--${message.role}`}>
            {message.text}
          </p>
        ))}
      </div>
      <div className="chatbot-input-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Can I replace butter with olive oil?"
          onKeyDown={(event) => {
            if (event.key === "Enter") ask();
          }}
        />
        <button type="button" className="btn" onClick={ask} disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </section>
  );
}

export default CookingAssistant;
