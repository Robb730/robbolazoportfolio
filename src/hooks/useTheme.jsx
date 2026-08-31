import { useEffect, useState, useCallback, useRef } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// The animation is now a cheap fixed-position div (clip-path wipe + a
// border ripple) — NOT a full-page GPU snapshot via
// document.startViewTransition(). This interval just stops the iris
// restarting mid-animation on a double-click; it's no longer protecting
// against a crash, because there's no bitmap snapshot left to pile up.
const MIN_ANIM_INTERVAL = 500;
const ANIM_DURATION = 560;

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  // Always-current theme, read synchronously inside toggleTheme so rapid
  // clicks never see a stale value.
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const rippleTimeoutRef = useRef(null);
  const irisTimeoutRef = useRef(null);
  const activeRipplesRef = useRef([]);
  const activeIrisRef = useRef(null); // { node, anim }

  const lastAnimStartRef = useRef(0);
  const animLockRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const [isToggling, setIsToggling] = useState(false);

  // Apply class + persist + meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("theme-hacker")) {
      root.classList.remove("theme-hacker");
    }
    root.classList.toggle("theme-dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0d0d0d" : "#ffffff");
  }, [theme, isDark]);

  // Listen to system changes if no explicit user choice
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const stored = localStorage.getItem("theme");
      if (!stored) setTheme(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const killIris = useCallback(() => {
    const active = activeIrisRef.current;
    if (active) {
      try { active.anim?.cancel?.(); } catch {}
      if (active.node && document.body.contains(active.node)) active.node.remove();
      activeIrisRef.current = null;
    }
    clearTimeout(irisTimeoutRef.current);
  }, []);

  const killRipples = useCallback(() => {
    activeRipplesRef.current.forEach((e) => {
      try { e.el?.cancel?.(); } catch {}
      if (e.node && document.body.contains(e.node)) e.node.remove();
    });
    activeRipplesRef.current = [];
    clearTimeout(rippleTimeoutRef.current);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(unlockTimerRef.current);
      killIris();
      killRipples();
    };
  }, [killIris, killRipples]);

  const toggleTheme = useCallback((event) => {
    const current = themeRef.current;
    const next = current === "dark" ? "light" : "dark";
    themeRef.current = next;

    const applyDOM = () => {
      const root = document.documentElement;
      if (root.classList.contains("theme-hacker")) root.classList.remove("theme-hacker");
      root.classList.toggle("theme-dark", next === "dark");
      root.style.colorScheme = next === "dark" ? "dark" : "light";
      localStorage.setItem("theme", next);
      try { localStorage.removeItem("hackerTheme"); } catch {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#0d0d0d" : "#ffffff");
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const tooSoon = now - lastAnimStartRef.current < MIN_ANIM_INTERVAL;
    const supportsVT = typeof document.startViewTransition === "function";

    // Instant path: reduced motion, rapid re-click, or no View Transitions support.
    if (prefersReduced || tooSoon || animLockRef.current || !supportsVT) {
      applyDOM();
      setTheme(next);
      try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
      return;
    }

    lastAnimStartRef.current = now;
    animLockRef.current = true;
    setIsToggling(true);
    clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => {
      animLockRef.current = false;
      setIsToggling(false);
    }, ANIM_DURATION + 120);

    const getXY = (e) => {
      if (!e) return [window.innerWidth / 2, window.innerHeight / 2];
      if (typeof e.clientX === "number" && typeof e.clientY === "number") return [e.clientX, e.clientY];
      if (e.nativeEvent && typeof e.nativeEvent.clientX === "number") return [e.nativeEvent.clientX, e.nativeEvent.clientY];
      if (e.touches && e.touches[0]) return [e.touches[0].clientX, e.touches[0].clientY];
      if (e.changedTouches && e.changedTouches[0]) return [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
      return [window.innerWidth / 2, window.innerHeight / 2];
    };
    const [x, y] = getXY(event);
    const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 32;

    const transition = document.startViewTransition(() => {
      applyDOM();
      setTheme(next);
    });

    transition.ready
      .then(() => {
        const clip = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxR}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          { clipPath: clip },
          {
            duration: ANIM_DURATION,
            easing: "cubic-bezier(0.16,1,0.3,1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {});

    transition.finished.finally(() => {
      animLockRef.current = false;
      setIsToggling(false);
    });

    try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
  }, []);

  return { theme, isDark, toggleTheme, setTheme, isToggling };
}