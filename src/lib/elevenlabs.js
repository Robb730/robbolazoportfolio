// src/lib/elevenlabs.js — client-side ElevenLabs TTS via REST (free-tier friendly)
const ELEVEN_KEY =
  import.meta.env.VITE_ELEVENLABS_API_KEY ||
  (String(import.meta.env.VITE_GEMINI_API_KEY || "").startsWith("sk_")
    ? import.meta.env.VITE_GEMINI_API_KEY
    : "");

const VOICE_ID_ENV = (import.meta.env.VITE_ELEVENLABS_VOICE_ID || "").trim();

// Free premade voices — Rachel is the most natural free voice
const FREE_DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel
let cachedVoiceId = VOICE_ID_ENV || null;

export function hasElevenKey() {
  return Boolean(ELEVEN_KEY && ELEVEN_KEY.trim().length > 10);
}

export function getElevenKey() {
  return ELEVEN_KEY;
}

/** Resolve a usable voice id — env if set, otherwise Rachel (free) or first from API */
export async function resolveVoiceId() {
  if (cachedVoiceId) return cachedVoiceId;
  if (!hasElevenKey()) throw new Error("Missing ElevenLabs API key");
  // Try to fetch first available voice, fallback to Rachel if fetch fails
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVEN_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      const first = data?.voices?.[0]?.voice_id;
      if (first) {
        cachedVoiceId = first;
        return first;
      }
    }
  } catch {}
  cachedVoiceId = FREE_DEFAULT_VOICE;
  return FREE_DEFAULT_VOICE;
}

let activeAudio = null;
let activeUrl = null;

function stopActiveAudio() {
  if (activeAudio) {
    try { activeAudio.pause(); } catch {}
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio = null;
  }
  if (activeUrl) {
    try { URL.revokeObjectURL(activeUrl); } catch {}
    activeUrl = null;
  }
}

export function stopSpeaking() {
  stopActiveAudio();
}

/**
 * Speak text via ElevenLabs (old simple version) — uses free model only.
 * Free tier cannot use eleven_multilingual_v2, so we use eleven_flash_v2_5 / monolingual_v1.
 */
export async function speakWithElevenLabs(text, { onStart, onEnd, onError, signal } = {}) {
  if (!hasElevenKey()) throw new Error("Missing VITE_ELEVENLABS_API_KEY");
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Empty text for TTS");
  const sanitized = clean.replace(/\*\*/g, "").replace(/^[\s]*[-*]\s+/gm, "").slice(0, 2000);

  const voiceId = await resolveVoiceId();
  stopActiveAudio();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // Old version style: single fetch, free-friendly model
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: sanitized,
      model_id: "eleven_flash_v2_5",
      output_format: "mp3_44100_128",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      },
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS ${res.status}: ${body.slice(0, 400)}`);
  }

  const blob = await res.blob();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const url = URL.createObjectURL(blob);
  activeUrl = url;

  const audio = new Audio(url);
  activeAudio = audio;
  audio.preload = "auto";
  audio.onended = () => {
    if (activeAudio === audio) stopActiveAudio();
    onEnd?.();
  };
  audio.onerror = (e) => {
    stopActiveAudio();
    onError?.(e);
  };
  onStart?.();
  try {
    await audio.play();
  } catch (e) {
    stopActiveAudio();
    onError?.(e);
    throw e;
  }
  return audio;
}
