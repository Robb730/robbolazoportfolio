import { useEffect, useState, useRef } from "react";

const EASTER_IDS = ["gwapo", "konami", "headache"];
const TOTAL = EASTER_IDS.length;

// Fresh on refresh — in-memory only (no localStorage)
const unlockedSet = new Set();
function getUnlocked() {
  return [...unlockedSet];
}
function unlock(id) {
  if (!EASTER_IDS.includes(id)) return null;
  if (unlockedSet.has(id)) return null;
  unlockedSet.add(id);
  const unlocked = getUnlocked();
  const remaining = TOTAL - unlocked.length;
  return { id, unlockedCount: unlocked.length, remaining, total: TOTAL };
}

export default function EasterEggs() {
  const [toasts, setToasts] = useState([]);
  const konamiRef = useRef([]);
  const gwapoRef = useRef("");
  const toggleTimesRef = useRef([]);
  const audioRef = useRef(null);
  const mobileGwapoTapsRef = useRef([]);
  const mobileSwipeRef = useRef([]);
  const mobileSwipeStartRef = useRef(null);
  const mobileLogoTapsRef = useRef([]);
  const longPressTimerRef = useRef(null);
  const longPressTargetRef = useRef(null);
  useEffect(() => {
    try {
      const a = new Audio("/sound/achievement-unlocked.mp3");
      a.volume = 0.6;
      a.preload = "auto";
      audioRef.current = a;
    } catch {}
    // fallback to root if sound folder missing
    if (audioRef.current) {
      audioRef.current.addEventListener("error", () => {
        try { audioRef.current.src = "/achievement-unlocked.mp3"; } catch {}
      });
    }
  }, []);
  const playSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  };
  const pushToast = (label, sub, opts = {}) => {
    const id = Date.now().toString() + Math.random();
    const isRainbow = !!opts.rainbow;
    setToasts((t) => [...t, { id, label, sub, isRainbow }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500);
  };
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // gwaposirobb — anywhere, type the phrase (even while chat is open)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // keep it truly anywhere — don't ignore inputs, just ignore modifier combos
      gwapoRef.current = (gwapoRef.current + e.key.toLowerCase()).slice(-16);
      if (gwapoRef.current.includes("gwaposirobb")) {
        gwapoRef.current = "";
        const res = unlock("gwapo");
        if (res) {
          playSound();
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          const left = res.remaining;
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — you're a legend!` : `${res.unlockedCount}/${TOTAL} found — ${left} left`;
          pushToast("· gwapo si Robb — achievement unlocked ·", countText, { rainbow: isAll });
        } else {
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          pushToast("· gwapo si Robb — already found ·", "try the arrows or rapid toggle");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Konami — up up down down left right left right
  useEffect(() => {
    const SEQ = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];
    const onKey = (e) => {
      if (!e.key.startsWith("Arrow")) {
        // reset on non-arrow? keep buffer but push anyway
        // only track arrow keys
        if (konamiRef.current.length > 0 && !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          // do not reset fully — let sequence continue only on arrows
        }
        return;
      }
      konamiRef.current.push(e.key);
      if (konamiRef.current.length > SEQ.length) konamiRef.current.shift();
      if (konamiRef.current.length === SEQ.length && konamiRef.current.every((v, i) => v === SEQ[i])) {
        konamiRef.current = [];
        const res = unlock("konami");
        // activate hacker theme regardless of first time, but toast only first unlock counts toward total
        const isHacker = document.documentElement.classList.contains("theme-hacker");
        if (!isHacker) {
          document.documentElement.classList.add("theme-hacker");
          try { document.documentElement.style.colorScheme = "dark"; } catch {}
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", "#020806");
        } else {
          // already on — keep it (still counts as toggle but no re-add)
        }
        if (res) {
          playSound();
          const left = res.remaining;
          const isAll = left === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — welcome, hacker` : `${res.unlockedCount}/${TOTAL} found — ${left} left`;
          pushToast("· secret theme unlocked — hacker/matrix ·", countText, { rainbow: isAll });
        } else {
          pushToast("· hacker mode — already unlocked ·", "green is the new ink");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // fresh on refresh — do NOT restore hacker theme (achievements reset)

  // rapid theme toggling — 4x within 10s (forgiving), exaggerated wash
  useEffect(() => {
    const onToggle = () => {
      const now = performance.now();
      toggleTimesRef.current.push(now);
      toggleTimesRef.current = toggleTimesRef.current.filter((t) => now - t < 10000);
      if (toggleTimesRef.current.length >= 4) {
        toggleTimesRef.current = [];
        const res = unlock("headache");
        if (!res) return; // already unlocked — silent, no banner toast
        // exaggerated wash — big ink ripple from center (only on first unlock)
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const x = window.innerWidth / 2;
          const y = window.innerHeight / 2;
          const maxR = Math.hypot(window.innerWidth, window.innerHeight);
          const ripple = document.createElement("div");
          ripple.setAttribute("aria-hidden", "true");
          ripple.style.cssText = `position:fixed;left:${x - maxR}px;top:${y - maxR}px;width:${maxR * 2}px;height:${maxR * 2}px;border-radius:9999px;pointer-events:none;z-index:99999;box-sizing:border-box;border:1.5px solid rgba(13,13,13,0.18);opacity:0;will-change:transform,opacity;`;
          if (document.documentElement.classList.contains("theme-dark") || document.documentElement.classList.contains("theme-hacker")) {
            ripple.style.borderColor = "rgba(255,255,255,0.22)";
          }
          document.body.appendChild(ripple);
          if (ripple.animate) {
            const a = ripple.animate(
              [{ transform: "scale(0.15)", opacity: 0.5 }, { transform: "scale(1)", opacity: 0 }],
              { duration: 900, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
            );
            const cleanup = () => { if (document.body.contains(ripple)) ripple.remove(); };
            a.onfinish = cleanup;
            a.oncancel = cleanup;
            setTimeout(cleanup, 1000);
          } else {
            setTimeout(() => ripple.remove(), 900);
          }
        }
        playSound();
        const left = res.remaining;
        const isAll = left === 0;
        const countText = isAll ? `all ${TOTAL}/${TOTAL} found — headache mastered!` : `${res.unlockedCount}/${TOTAL} found — ${left} left`;
        pushToast("· trying to give me a headache? ·", countText, { rainbow: isAll });
      }
    };
    window.addEventListener("theme:toggle", onToggle);
    return () => window.removeEventListener("theme:toggle", onToggle);
  }, []);

  // ── Mobile: gwapo — tap the hero title "Robb Olazo" 4x quickly (no keyboard) — disabled on desktop
  useEffect(() => {
    const onTap = (e) => {
      // desktop: disabled — only mobile/touch devices
      if (window.matchMedia("(min-width: 768px)").matches) return;
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      // accept any tap on the hero section (#top) so it's forgiving; h1 is the main target
      const target = e.target.closest?.("#top h1") || e.target.closest?.("#top");
      if (!target) return;
      // only count if the tap was actually on/near the title, not on buttons inside hero
      // we check that the closest h1 exists OR the section itself, but ignore taps on links/buttons
      if (e.target.closest?.("a, button")) return;
      const now = performance.now();
      mobileGwapoTapsRef.current.push(now);
      mobileGwapoTapsRef.current = mobileGwapoTapsRef.current.filter((t) => now - t < 4000);
      if (mobileGwapoTapsRef.current.length >= 4) {
        mobileGwapoTapsRef.current = [];
        const res = unlock("gwapo");
        if (res) {
          playSound();
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — you're a legend!` : `${res.unlockedCount}/${TOTAL} found — ${res.remaining} left`;
          pushToast("· gwapo si Robb — achievement unlocked ·", countText, { rainbow: isAll });
        } else {
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          pushToast("· gwapo si Robb — already found ·", "try the swipe code or rapid toggle");
        }
      }
    };
    // use click only — touchend + click would double-count one tap on mobile
    document.addEventListener("click", onTap);
    return () => document.removeEventListener("click", onTap);
  }, []);

  // ── Mobile: hacker — swipe Konami (up up down down left right left right) anywhere — lenient
  useEffect(() => {
    const SEQ = ["up", "up", "down", "down", "left", "right", "left", "right"];
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      mobileSwipeStartRef.current = { x: t.clientX, y: t.clientY, time: performance.now() };
    };
    const onEnd = (e) => {
      const start = mobileSwipeStartRef.current;
      const t = e.changedTouches?.[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dt = performance.now() - start.time;
      mobileSwipeStartRef.current = null;
      if (dt > 1000) return;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      let dir;
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
      else dir = dy > 0 ? "down" : "up";
      mobileSwipeRef.current.push(dir);
      if (mobileSwipeRef.current.length > SEQ.length) mobileSwipeRef.current.shift();
      if (mobileSwipeRef.current.length === SEQ.length && mobileSwipeRef.current.every((v, i) => v === SEQ[i])) {
        mobileSwipeRef.current = [];
        const res = unlock("konami");
        const isHacker = document.documentElement.classList.contains("theme-hacker");
        if (!isHacker) {
          document.documentElement.classList.add("theme-hacker");
          try { document.documentElement.style.colorScheme = "dark"; } catch {}
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", "#020806");
        }
        if (res) {
          playSound();
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — welcome, hacker` : `${res.unlockedCount}/${TOTAL} found — ${res.remaining} left`;
          pushToast("· secret theme unlocked — hacker/matrix ·", countText, { rainbow: isAll });
        } else {
          pushToast("· hacker mode — already unlocked ·", "green is the new ink");
        }
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  // ── Mobile: hacker alternative — tap the nav logo 5x quickly — disabled on desktop ──
  useEffect(() => {
    const onLogoTap = (e) => {
      // desktop: disabled — only mobile/touch devices
      if (window.matchMedia("(min-width: 768px)").matches) return;
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const target = e.target.closest?.('header a[href="#top"], header a[aria-label*="Home"]');
      if (!target) return;
      const now = performance.now();
      mobileLogoTapsRef.current.push(now);
      mobileLogoTapsRef.current = mobileLogoTapsRef.current.filter((t) => now - t < 3500);
      if (mobileLogoTapsRef.current.length >= 5) {
        mobileLogoTapsRef.current = [];
        const res = unlock("konami");
        const isHacker = document.documentElement.classList.contains("theme-hacker");
        if (!isHacker) {
          document.documentElement.classList.add("theme-hacker");
          try { document.documentElement.style.colorScheme = "dark"; } catch {}
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", "#020806");
        }
        if (res) {
          playSound();
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — welcome, hacker` : `${res.unlockedCount}/${TOTAL} found — ${res.remaining} left`;
          pushToast("· secret theme unlocked — hacker/matrix ·", countText, { rainbow: isAll });
        } else {
          pushToast("· hacker mode — already unlocked ·", "green is the new ink");
        }
      }
    };
    document.addEventListener("click", onLogoTap);
    return () => document.removeEventListener("click", onLogoTap);
  }, []);

  // ── Mobile: gwapo — long-press the profile picture (About section) 1.5s ──
  useEffect(() => {
    const LONG_PRESS_MS = 1500;
    const onStart = (e) => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const target = e.target.closest?.(".about-photo-slot");
      if (!target) return;
      longPressTargetRef.current = "gwapo";
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
        const res = unlock("gwapo");
        if (res) {
          playSound();
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — you're a legend!` : `${res.unlockedCount}/${TOTAL} found — ${res.remaining} left`;
          pushToast("· gwapo si Robb — achievement unlocked ·", countText, { rainbow: isAll });
        } else {
          window.dispatchEvent(new CustomEvent("easter:wiggle", { detail: "gwapo" }));
          pushToast("· gwapo si Robb — already found ·", "try the long-press or rapid toggle");
        }
      }, LONG_PRESS_MS);
    };
    const onEnd = () => {
      if (longPressTargetRef.current === "gwapo") {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
      }
    };
    const onMove = (e) => {
      // cancel if finger moves too far (15px tolerance)
      if (!longPressTimerRef.current || longPressTargetRef.current !== "gwapo") return;
      const t = e.touches?.[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (!el?.closest?.(".about-photo-slot")) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  // ── Mobile: hacker — long-press the theme toggle 1.5s ──
  useEffect(() => {
    const LONG_PRESS_MS = 1500;
    const onStart = (e) => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const target = e.target.closest?.(".theme-toggle");
      if (!target) return;
      longPressTargetRef.current = "konami";
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
        const res = unlock("konami");
        const isHacker = document.documentElement.classList.contains("theme-hacker");
        if (!isHacker) {
          document.documentElement.classList.add("theme-hacker");
          try { document.documentElement.style.colorScheme = "dark"; } catch {}
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", "#020806");
        }
        if (res) {
          playSound();
          const isAll = res.remaining === 0;
          const countText = isAll ? `all ${TOTAL}/${TOTAL} found — welcome, hacker` : `${res.unlockedCount}/${TOTAL} found — ${res.remaining} left`;
          pushToast("· secret theme unlocked — hacker/matrix ·", countText, { rainbow: isAll });
        } else {
          pushToast("· hacker mode — already unlocked ·", "green is the new ink");
        }
      }, LONG_PRESS_MS);
    };
    const onEnd = () => {
      if (longPressTargetRef.current === "konami") {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
      }
    };
    const onMove = (e) => {
      if (!longPressTimerRef.current || longPressTargetRef.current !== "konami") return;
      const t = e.touches?.[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (!el?.closest?.(".theme-toggle")) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressTargetRef.current = null;
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="easter-toast-stack" aria-live="polite" aria-label="Easter eggs">
      {toasts.map((t) => (
        <div key={t.id} className={`easter-toast ${t.isRainbow ? "rainbow" : ""}`}>
          <span className="easter-toast-dot" aria-hidden="true" />
          <div className="easter-toast-text">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink block">{t.label}</span>
            <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{t.sub}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(t.id)}
            className="easter-toast-close"
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        .easter-toast-stack {
          position: fixed;
          top: 76px;
          right: 16px;
          z-index: 70;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
          align-items: flex-end;
        }
        @media (max-width: 640px) {
          .easter-toast-stack { top: calc(64px + env(safe-area-inset-top)); right: 12px; left: 12px; align-items: stretch; }
          .easter-toast { max-width: 100%; }
        }
        .easter-toast {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          max-width: 92vw;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.62);
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(18px) saturate(185%);
          -webkit-backdrop-filter: blur(18px) saturate(185%);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translate3d(0,0,0);
          animation: easter-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both, easter-out 0.5s cubic-bezier(0.6, 0, 0.84, 0.2) 4.85s forwards;
          pointer-events: auto;
          position: relative;
        }
        .easter-toast-close {
          margin-left: 6px;
          width: 20px; height: 20px;
          display: grid; place-items: center;
          border: 1px solid transparent;
          background: transparent;
          color: var(--color-faint);
          font-size: 14px; line-height: 1;
          cursor: pointer;
          border-radius: 9999px;
          transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
          flex-shrink: 0;
        }
        .easter-toast-close:hover { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .theme-dark .easter-toast-close { color: #a3a3a3; }
        .theme-dark .easter-toast-close:hover { background: #fff; color: #0d0d0d; border-color: #fff; }
        .easter-toast.rainbow {
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82));
          border: 1px solid transparent;
          background-clip: padding-box, border-box;
          border-image: linear-gradient(90deg, #ff00a0, #ff8a00, #ffe600, #00ff88, #00d4ff, #8a00ff) 1;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.14),
            0 0 0 1px rgba(255,255,255,0.6) inset,
            0 0 18px rgba(0,255,136,0.18),
            0 0 28px rgba(255,0,160,0.12);
          animation: easter-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both, rainbow-pulse 1.6s ease-in-out infinite, easter-out 0.5s cubic-bezier(0.6, 0, 0.84, 0.2) 4.85s forwards;
        }
        .theme-dark .easter-toast.rainbow {
          background: linear-gradient(135deg, rgba(30,30,34,0.92), rgba(20,20,22,0.88));
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,136,0.18), 0 0 28px rgba(255,0,160,0.14);
        }
        .theme-hacker .easter-toast.rainbow {
          background: linear-gradient(135deg, rgba(8,30,18,0.94), rgba(6,18,12,0.92));
          border-color: transparent;
          box-shadow: 0 8px 32px rgba(0,255,136,0.22), 0 0 22px rgba(0,255,136,0.18), 0 0 30px rgba(255,0,160,0.12);
        }
        @keyframes rainbow-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
        }
        .theme-dark .easter-toast {
          background: rgba(20,20,22,0.82);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .theme-hacker .easter-toast {
          background: rgba(5,18,10,0.86);
          border-color: rgba(0,255,136,0.28);
          box-shadow: 0 8px 32px rgba(0,255,136,0.18), inset 0 1px 0 rgba(0,255,136,0.18);
        }
        .theme-hacker .easter-toast span { color: #00ff88 !important; }
        .easter-toast-dot {
          width: 8px; height: 8px; border-radius: 9999px;
          background: var(--color-ink);
          box-shadow: 0 0 0 4px rgba(13,13,13,0.08);
          flex-shrink: 0;
        }
        .theme-dark .easter-toast-dot { box-shadow: 0 0 0 4px rgba(255,255,255,0.1); }
        .theme-hacker .easter-toast-dot { background: #00ff88; box-shadow: 0 0 8px rgba(0,255,136,0.6), 0 0 0 4px rgba(0,255,136,0.12); }
        @keyframes easter-in {
          from { opacity: 0; transform: translate3d(120%, 0, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes easter-out {
          from { opacity: 1; transform: translate3d(0, 0, 0); }
          to   { opacity: 0; transform: translate3d(120%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) { .easter-toast { animation:none !important; } }
      `}</style>
    </div>
  );
}
