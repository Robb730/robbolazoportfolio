// src/lib/clickSounds.js — random hover click SFX (8 variations, 2-9)
// Designed for autoplay on hover: preloads, unlocks on first user gesture, throttles.

const CLICK_SOUNDS = [
  "/sound/click-2.wav",
  "/sound/click-3.wav",
  "/sound/click-4.wav",
  "/sound/click-5.wav",
  "/sound/click-6.wav",
  "/sound/click-7.wav",
  "/sound/click-8.wav",
  "/sound/click-9.wav",
];

let pool = []; // Audio[]
let lastPlay = 0;
let lastIndex = -1;
let unlocked = false;
let audioCtx = null;

const VOLUME = 0.35;
const COOLDOWN_MS = 100;

function canUseHoverSound() {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // disabled on touch / no-hover devices
    if (window.matchMedia("(hover: none)").matches) return false;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return false;
  } catch {}
  // don't play hover SFX while TTS is speaking (avoid clash)
  try {
    // if any audio element is speaking via elevenlabs unlockedMediaEl, we still allow low-volume clicks but duck
    // check via document — if body has voice-speaking class, skip? Instead just allow but keep volume low.
  } catch {}
  return true;
}

function ensurePool() {
  if (pool.length) return pool;
  if (typeof window === "undefined") return pool;
  pool = CLICK_SOUNDS.map((src) => {
    try {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = VOLUME;
      // resilient: drop from pool if file 404/missing so future removes don't cause silent hovers
      a.addEventListener("error", () => {
        pool = pool.filter((x) => x !== a);
      }, { once: true });
      return a;
    } catch {
      return null;
    }
  }).filter(Boolean);
  return pool;
}

// Call synchronously inside a user gesture (click/keydown) to unlock autoplay
export function primeHoverAudio() {
  if (unlocked) return;
  // Mark unlocked so subsequent hover attempts are allowed by Chrome's sticky activation
  unlocked = true;
  // Try to resume/create AudioContext for WebAudio path (also helps)
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      if (!audioCtx) {
        try { audioCtx = new AC(); } catch {}
      }
      if (audioCtx && audioCtx.state === "suspended") {
        const p = audioCtx.resume();
        if (p && p.catch) p.catch(() => {});
      }
      if (audioCtx) {
        try {
          const buf = audioCtx.createBuffer(1, 1, 22050);
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          src.connect(audioCtx.destination);
          src.start(0);
        } catch {}
      }
    }
  } catch {}
  // Also warm up HTMLAudio elements with a muted play/pause to bless them on iOS
  try {
    ensurePool();
    for (const a of pool) {
      try {
        a.muted = true;
        const p = a.play();
        if (p && p.then) {
          p.then(() => {
            try { a.pause(); a.currentTime = 0; a.muted = false; } catch {}
          }).catch(() => {
            try { a.muted = false; } catch {}
          });
        } else {
          try { a.pause(); a.muted = false; } catch {}
        }
      } catch {}
    }
  } catch {}
}

// Ensure we prime on first real interaction, even if App doesn't call it
if (typeof window !== "undefined") {
  const autoPrime = () => {
    primeHoverAudio();
    window.removeEventListener("click", autoPrime);
    window.removeEventListener("keydown", autoPrime);
    window.removeEventListener("pointerdown", autoPrime);
    window.removeEventListener("touchstart", autoPrime);
  };
  window.addEventListener("click", autoPrime, { once: true, capture: true });
  window.addEventListener("keydown", autoPrime, { once: true, capture: true });
  window.addEventListener("pointerdown", autoPrime, { once: true, capture: true });
  window.addEventListener("touchstart", autoPrime, { once: true, capture: true, passive: true });
}

export function playRandomClick({ force = false } = {}) {
  if (!force && !canUseHoverSound()) return false;
  const now = performance.now();
  if (!force && now - lastPlay < COOLDOWN_MS) return false;

  ensurePool();
  // filter out errored audios that failed to load (future deletions)
  pool = pool.filter((a) => !a.error);
  if (!pool.length) return false;

  // pick random not same as last (avoid repeat)
  let idx;
  if (pool.length === 1) idx = 0;
  else {
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * pool.length);
      attempts++;
    } while (idx === lastIndex && attempts < 5);
  }
  lastIndex = idx;
  const base = pool[idx];
  const src = base?.src || CLICK_SOUNDS[idx];

  lastPlay = now;

  try {
    // Clone for polyphony so rapid hovers overlap instead of cutting
    let audio;
    try {
      audio = base.cloneNode(true);
    } catch {
      audio = new Audio(src);
    }
    audio.volume = VOLUME;
    audio.currentTime = 0;
    audio.preload = "auto";
    // Ensure not muted (in case pool was left muted)
    try { audio.muted = false; audio.removeAttribute("muted"); } catch {}
    const p = audio.play();
    if (p && p.then) {
      p.catch((e) => {
        // Autoplay blocked — try to prime and retry once on next gesture
        const msg = String(e?.message || e?.name || "");
        if (/NotAllowed|not allowed|user gesture|play\(\) failed/i.test(msg) || e?.name === "NotAllowedError") {
          // keep unlocked false so next real click will prime
          unlocked = false;
        }
        // cleanup clone to avoid leak
        try { audio.pause(); } catch {}
      });
    }
    // cleanup after playback to avoid DOM leak (clone nodes are not in DOM, just GC)
    audio.addEventListener("ended", () => {
      try { audio.pause(); audio.src = ""; audio.load(); } catch {}
    }, { once: true });
    return true;
  } catch {
    return false;
  }
}

export function isHoverSoundEnabled() {
  return canUseHoverSound();
}

export { CLICK_SOUNDS };
