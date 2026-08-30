import { useRef, useCallback } from "react";

// B&W scramble: mono charset, ink/faint toggle, respects reduced-motion
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—·•+—";
const DURATION = 420;
const STAGGER = 22;

export default function useScramble(text) {
  const rafRef = useRef(0);
  const elRef = useRef(null);

  const setRef = useCallback((el) => {
    elRef.current = el;
    if (el) el.textContent = text;
  }, [text]);

  const trigger = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!elRef.current) return;
    const el = elRef.current;
    cancelAnimationFrame(rafRef.current);
    const len = text.length;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      // how many chars have settled
      const settled = Math.floor(progress * len);

      let out = "";
      for (let i = 0; i < len; i++) {
        const char = text[i];
        if (char === " ") {
          out += " ";
          continue;
        }
        if (i < settled) out += char;
        else {
          // stagger: early chars settle first
          const staggerDelay = i * STAGGER;
          if (elapsed < staggerDelay) out += char;
          else out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = out;

      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [text]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (elRef.current) elRef.current.textContent = text;
  }, [text]);

  return { ref: setRef, onEnter: trigger, onLeave: reset };
}
