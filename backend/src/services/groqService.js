const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

const ALLOWED_MOODS = ["happy", "sad", "stressed", "tired", "energetic", "lazy"];

const moodKeywords = {
  happy: ["happy", "great", "good", "excited", "celebrate", "awesome", "joy"],
  sad: ["sad", "down", "upset", "lonely", "depressed", "cry", "hurt"],
  stressed: ["stressed", "anxious", "overwhelmed", "pressure", "deadline", "panic"],
  tired: ["tired", "sleepy", "exhausted", "drained", "fatigued", "worn out"],
  energetic: ["energetic", "pumped", "motivated", "active", "workout", "high energy"],
  lazy: ["lazy", "low effort", "cant cook", "simple", "quick", "no energy"],
};

const callGroq = async ({ messages, temperature = 0.2, tools, tool_choice }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      tools,
      tool_choice,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${body}`);
  }

  return response.json();
};

const safeJsonParse = (text, fallback = null) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
};

const extractJsonFromText = (text) => {
  const content = String(text || "").trim();
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  const objectMatch = content.match(/\{[\s\S]*\}/);
  return objectMatch ? objectMatch[0] : content;
};

const heuristicMoodDetection = (text) => {
  const normalized = String(text || "").toLowerCase();
  const scores = ALLOWED_MOODS.reduce((acc, mood) => ({ ...acc, [mood]: 0 }), {});

  Object.entries(moodKeywords).forEach(([mood, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(keyword)) {
        scores[mood] += 1;
      }
    });
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];

  if (!top || top[1] === 0) {
    return { mood: "happy", reason: "Defaulted to balanced positive mood." };
  }

  return { mood: top[0], reason: `Detected from keywords in user message (${top[0]}).` };
};

const detectMoodFromText = async (text) => {
  const heuristic = heuristicMoodDetection(text);
  if (!process.env.GROQ_API_KEY) {
    return heuristic;
  }

  const messages = [
    {
      role: "system",
      content:
        "Classify the user's mood into exactly one of: happy, sad, stressed, tired, energetic, lazy. Respond strictly as JSON: {\"mood\":\"...\",\"reason\":\"...\"}",
    },
    { role: "user", content: text },
  ];

  try {
    const data = await callGroq({ messages, temperature: 0 });
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(extractJsonFromText(content), {});
    const mood = ALLOWED_MOODS.includes(parsed.mood) ? parsed.mood : heuristic.mood;
    return { mood, reason: parsed.reason || heuristic.reason };
  } catch (error) {
    return heuristic;
  }
};

const generateHealthyIngredients = async ({ recipeTitle, ingredients }) => {
  const messages = [
    {
      role: "system",
      content:
        "You create healthier ingredient substitutions. Return strict JSON: {\"ingredients\":[{\"name\":\"...\",\"measure\":\"...\",\"isSubstituted\":true|false}]}. Keep ingredient count similar and practical.",
    },
    {
      role: "user",
      content: `Recipe: ${recipeTitle}\nIngredients: ${JSON.stringify(ingredients)}`,
    },
  ];

  const data = await callGroq({ messages, temperature: 0.3 });
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(content, {});

  if (Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
    return parsed.ingredients;
  }

  return null;
};

module.exports = {
  callGroq,
  detectMoodFromText,
  generateHealthyIngredients,
};
