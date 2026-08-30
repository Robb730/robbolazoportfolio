// src/lib/gemini.js
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../data/portfolioContext";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let client = null;
function getClient() {
  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Put it in .env.local as VITE_GEMINI_API_KEY=AIza... and restart `npm run dev`."
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

// Flash-Lite models have much higher free-tier daily limits (500 RPD)
// than the standard Flash models (20 RPD), so try those first and fall
// back down the chain only on a rate-limit/quota error.
const MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash"];

function isRateLimitError(err) {
  return /429|quota|rate/i.test(String(err?.message ?? err));
}

export async function sendMessageToGemini({ message, history = [] }) {
  const ai = getClient();

  const chatHistory = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  let lastError;
  for (const modelId of MODEL_CHAIN) {
    try {
      const chat = ai.chats.create({
        model: modelId,
        history: chatHistory,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          // Note: temperature/top_p/top_k are deprecated on the 3.x
          // Gemini line — omitted rather than silently ignored.
          maxOutputTokens: 800,
        },
      });

      const result = await chat.sendMessage({ message });
      const text = result.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (err) {
      lastError = err;
      // Only fall through to the next model on a rate-limit/quota error —
      // any other failure (bad request, auth, etc.) should surface immediately.
      if (!isRateLimitError(err)) throw err;
    }
  }

  throw lastError;
}

export function hasGeminiKey() {
  return Boolean(apiKey && apiKey.trim().length > 10);
}