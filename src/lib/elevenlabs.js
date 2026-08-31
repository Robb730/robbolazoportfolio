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

// ── iOS audio unlock ──────────────────────────────────────────────
// iOS Safari blocks any audio.play() with sound that isn't directly inside
// a user gesture. Our TTS play() happens after two async fetches
// (Gemini + ElevenLabs), so the gesture is lost. To fix it we:
//  1) Keep a single AudioContext + single HTMLAudio element alive and
//     unlock them SYNCHRONOUSLY on the first user tap (no await gap).
//  2) For later playback, prefer WebAudio decode + BufferSource (which
//     does NOT need a fresh gesture once the context is resumed).
//  3) Fallback to the pre-unlocked HTMLAudio element (reusing the same
//     element keeps it "blessed" on iOS).
let unlockedCtx = null;
let unlockedMediaEl = null;
let currentSource = null;
let currentAudioEl = null;

let activeUrl = null;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isAppleDevice || isIPadOS;
}

/**
 * MUST be called synchronously inside a click/touch handler (no await
 * before it). It resumes/creates the AudioContext and plays a silent
 * buffer + a muted HTMLAudio element so iOS marks the page as
 * "user has interacted with media".
 * Safe to call many times — idempotent.
 */
export function primeAudioForIOS() {
  // WebAudio unlock — keep one context forever (never close)
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      if (!unlockedCtx) {
        try {
          unlockedCtx = new AC();
        } catch {}
      }
      if (unlockedCtx) {
        if (unlockedCtx.state === "suspended") {
          // resume without await to stay in gesture tick
          const p = unlockedCtx.resume();
          if (p && p.catch) p.catch(() => {});
        }
        // play a 1-sample silent buffer immediately in gesture
        try {
          const buf = unlockedCtx.createBuffer(1, 1, 22050);
          const src = unlockedCtx.createBufferSource();
          src.buffer = buf;
          src.connect(unlockedCtx.destination);
          src.start(0);
        } catch {}
      }
    }
  } catch {}

  // MediaElement unlock — reuse one element
  try {
    if (!unlockedMediaEl) {
      unlockedMediaEl = new Audio();
      unlockedMediaEl.playsInline = true;
      unlockedMediaEl.setAttribute("playsinline", "");
      unlockedMediaEl.setAttribute("webkit-playsinline", "");
      unlockedMediaEl.preload = "auto";
      unlockedMediaEl.crossOrigin = "anonymous";
      // important for iOS: must have src before play
      unlockedMediaEl.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      unlockedMediaEl.muted = true;
      unlockedMediaEl.load();
    }
    // trigger play synchronously inside gesture
    unlockedMediaEl.muted = true;
    const pp = unlockedMediaEl.play();
    if (pp && pp.then) {
      pp.catch(() => {}).finally?.(() => {
        try {
          unlockedMediaEl.pause();
          unlockedMediaEl.muted = false;
          unlockedMediaEl.removeAttribute("muted");
        } catch {}
      });
    } else {
      try {
        unlockedMediaEl.pause();
        unlockedMediaEl.muted = false;
      } catch {}
    }
  } catch {}
}

function stopActiveAudio() {
  // stop WebAudio source
  if (currentSource) {
    try { currentSource.onended = null; } catch {}
    try { currentSource.stop(); } catch {}
    try { currentSource.disconnect(); } catch {}
    currentSource = null;
  }
  if (currentAudioEl) {
    try { currentAudioEl.pause(); } catch {}
    try { currentAudioEl.onended = null; } catch {}
    try { currentAudioEl.onerror = null; } catch {}
    // don't null-out unlockedMediaEl — keep it for reuse, just clear ref if it was the active one
    if (currentAudioEl !== unlockedMediaEl) {
      try { currentAudioEl.src = ""; } catch {}
      try { currentAudioEl.load(); } catch {}
    }
    currentAudioEl = null;
  }
  if (activeUrl) {
    try { URL.revokeObjectURL(activeUrl); } catch {}
    activeUrl = null;
  }
}

export function stopSpeaking() {
  stopActiveAudio();
}

async function playViaWebAudio(blob, { onEnd, onError, signal } = {}) {
  if (!unlockedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      try { unlockedCtx = new AC(); } catch {}
    }
  }
  if (!unlockedCtx) throw new Error("WebAudio not available");
  if (unlockedCtx.state === "suspended") {
    await unlockedCtx.resume().catch(() => {});
  }
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const arr = await blob.arrayBuffer();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  // decodeAudioData is callback-based on old webkit, promise on new
  let audioBuf;
  try {
    audioBuf = await unlockedCtx.decodeAudioData(arr.slice(0));
  } catch {
    // fallback: try with copy
    audioBuf = await new Promise((res, rej) => {
      unlockedCtx.decodeAudioData(arr.slice(0), res, rej);
    });
  }
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  stopActiveAudio();
  const src = unlockedCtx.createBufferSource();
  src.buffer = audioBuf;
  src.connect(unlockedCtx.destination);
  currentSource = src;
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      try { src.stop(); } catch {}
      try { src.disconnect(); } catch {}
      currentSource = null;
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    src.onended = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      if (currentSource === src) currentSource = null;
      onEnd?.();
      resolve(src);
    };
    try { src.start(0); } catch (e) { if (signal) signal.removeEventListener("abort", onAbort); reject(e); }
  });
}

async function playViaMediaElement(blob, { onEnd, onError, signal } = {}) {
  const url = URL.createObjectURL(blob);
  // stop previous *before* we publish the new url, so revoke doesn't kill it
  stopActiveAudio();
  activeUrl = url;
  // prefer the pre-unlocked element on iOS — it stays "blessed"
  const useUnlocked = isIOS() && unlockedMediaEl;
  const audio = useUnlocked ? unlockedMediaEl : new Audio();
  // ensure iOS attrs
  try {
    audio.playsInline = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    // iOS needs muted toggle trick if switching src — ensure not muted
    audio.muted = false;
    audio.removeAttribute("muted");
  } catch {}
  currentAudioEl = audio;
  audio.src = url;
  // load() is required on iOS when reusing the blessed element with a new src
  try { audio.load(); } catch {}
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      try { audio.pause(); } catch {}
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    audio.onended = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      if (currentAudioEl === audio) stopActiveAudio();
      onEnd?.();
      resolve(audio);
    };
    audio.onerror = (e) => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const err = e?.error || new Error("Audio playback failed");
      onError?.(e);
      reject(err);
    };
    const p = audio.play();
    if (p && p.then) {
      p.catch((e) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        onError?.(e);
        reject(e);
      });
    }
  });
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

  // Ensure WebAudio context is resumed right before play (if suspended, that resume
  // itself needs a gesture — but primeAudioForIOS already resumed it synchronously;
  // we do a best-effort resume here too before deciding path)
  if (unlockedCtx && unlockedCtx.state === "suspended") {
    try { await unlockedCtx.resume(); } catch {}
  }

  onStart?.();

  // Strategy: on iOS try WebAudio first (does not need a new gesture after unlock).
  // On desktop, MediaElement is fine and cheaper. Either path falls back to the other.
  const tryWebAudioFirst = isIOS();

  if (tryWebAudioFirst) {
    try {
      await playViaWebAudio(blob, { onEnd, onError, signal });
      return currentSource || true;
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      // fall through to MediaElement — maybe decode failed
      console.warn("[voice] WebAudio play failed, falling back to MediaElement", e);
    }
    try {
      await playViaMediaElement(blob, { onEnd, onError, signal });
      return currentAudioEl;
    } catch (e2) {
      const isAutoplayBlocked =
        e2?.name === "NotAllowedError" ||
        /not allowed/i.test(String(e2?.message || "")) ||
        /user agent/i.test(String(e2?.message || ""));
      if (isAutoplayBlocked) {
        e2.isAutoplayBlocked = true;
        e2.blob = blob;
        e2.url = activeUrl;
        // keep URL alive for pendingPlay tap
        onError?.(e2);
        throw e2;
      }
      stopActiveAudio();
      onError?.(e2);
      throw e2;
    }
  } else {
    try {
      await playViaMediaElement(blob, { onEnd, onError, signal });
      return currentAudioEl;
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      const isAutoplayBlocked =
        e?.name === "NotAllowedError" ||
        /not allowed/i.test(String(e?.message || "")) ||
        /user agent/i.test(String(e?.message || ""));
      if (isAutoplayBlocked) {
        // try WebAudio as fallback — on desktop autoplay block is rare but handle it
        try {
          await playViaWebAudio(blob, { onEnd, onError, signal });
          return currentSource || true;
        } catch (e2) {
          if (e2?.name === "AbortError") throw e2;
        }
        e.isAutoplayBlocked = true;
        e.blob = blob;
        e.url = activeUrl;
        onError?.(e);
        throw e;
      }
      stopActiveAudio();
      onError?.(e);
      throw e;
    }
  }
}
