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

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const comma = s.indexOf(",");
      res(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export async function transcribeAudioWithGemini(audioBlob) {
  const ai = getClient();
  const base64 = await blobToBase64(audioBlob);
  const mime = audioBlob.type || "audio/webm";
  // Try audio transcription with latest flash models that support audio
  const tModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
  let lastErr;
  for (const m of tModels) {
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mime, data: base64 } },
              { text: "Transcribe this audio verbatim. Return only the transcript, no extra formatting or commentary." },
            ],
          },
        ],
      });
      const t = resp.text?.trim();
      if (t && t.length > 1 && !/^ *(no speech|empty)/i.test(t)) return t;
      // fall through to next model if empty
    } catch (e) {
      lastErr = e;
      if (/429|quota|rate/i.test(String(e?.message))) continue;
      // don't immediately throw — try next model
    }
  }
  throw lastErr || new Error("Transcription failed — try typing instead.");
}