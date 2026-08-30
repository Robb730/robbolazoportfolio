import { useEffect, useState, useCallback, useRef } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  // Tracks the theme that has ACTUALLY been applied to the DOM, updated
  // synchronously inside toggleTheme. Reading `theme` state directly inside
  // toggleTheme was the bug: when the view-transition path defers
  // setTheme(next) via setTimeout, a second click before that timeout fires
  // still sees the OLD `theme` value (stale closure), so it computes the
  // same `next` again instead of toggling back — the icon gets stuck out of
  // sync with the real DOM state. themeRef is always current the instant
  // toggleTheme runs, so rapid clicks never read stale data.
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Separate refs so the deferred setState timeout and the ripple cleanup
  // timeout don't clobber each other (previously both used one `timeoutRef`,
  // so only whichever was assigned last could ever be cleared on unmount).
  const themeTimeoutRef = useRef(null);
  const rippleTimeoutRef = useRef(null);

  // Apply class + persist + meta theme-color
  // Hacker mode is a full takeover; any explicit light/dark change should exit it and return to normal
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

  useEffect(() => {
    return () => {
      clearTimeout(themeTimeoutRef.current);
      clearTimeout(rippleTimeoutRef.current);
    };
  }, []);

  /* Butter-smooth toggle — iris ripple (clip-path) + outline ripple.
     Both run on compositor: clip-path on VT snapshot (GPU), border ring 0→1 scale.
     640ms ease-out. Zero layout thrash. */
  const toggleTheme = useCallback((event) => {
    const current = themeRef.current;
    const next = current === "dark" ? "light" : "dark";
    themeRef.current = next;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const applyDOM = () => {
      const root = document.documentElement;
      const wasHacker = root.classList.contains("theme-hacker");
      if (wasHacker) root.classList.remove("theme-hacker");
      root.classList.toggle("theme-dark", next === "dark");
      root.style.colorScheme = next === "dark" ? "dark" : "light";
      localStorage.setItem("theme", next);
      try { localStorage.removeItem("hackerTheme"); } catch {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#0d0d0d" : "#ffffff");
    };

    if (prefersReduced) {
      applyDOM();
      setTheme(next);
      try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
      return;
    }

    // Robust XY — works for mouse, touch, and React synthetic events on mobile
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
    const origin = `${x}px ${y}px`;
    const col = next === "dark" ? "255,255,255" : "13,13,13";
    const d = maxR * 2;

    const ripple = document.createElement("div");
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.cssText =
      `position:fixed;left:${x - maxR}px;top:${y - maxR}px;width:${d}px;height:${d}px;` +
      `border-radius:9999px;pointer-events:none;z-index:100000;box-sizing:border-box;` +
      `border:1px solid rgba(${col},0.24);opacity:0;will-change:transform,opacity;`;

    const spawnRipple = () => {
      if (typeof document.body.animate !== "function") return;
      // avoid double-append if already in DOM
      if (!document.body.contains(ripple)) document.body.appendChild(ripple);
      const a = ripple.animate(
        [{ transform: "scale(0)", opacity: 0.38 }, { transform: "scale(1)", opacity: 0 }],
        { duration: 640, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
      );
      const cleanup = () => { if (document.body.contains(ripple)) ripple.remove(); };
      a.onfinish = cleanup;
      a.oncancel = cleanup;
      clearTimeout(rippleTimeoutRef.current);
      rippleTimeoutRef.current = setTimeout(cleanup, 700);
    };

    // Manual iris fallback for browsers without View Transition (most mobile Safari <18)
    const spawnIrisFallback = () => {
      if (typeof document.body.animate !== "function") return;
      const bg = next === "dark" ? "#0d0d0d" : "#ffffff";
      const iris = document.createElement("div");
      iris.setAttribute("aria-hidden", "true");
      iris.style.cssText =
        `position:fixed;inset:0;pointer-events:none;z-index:99999;` +
        `background:${bg};clip-path:circle(0px at ${origin});will-change:clip-path;`;
      document.body.appendChild(iris);
      try {
        const a = iris.animate(
          { clipPath: [`circle(0px at ${origin})`, `circle(${maxR}px at ${origin})`] },
          { duration: 640, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
        );
        const cleanup = () => { if (document.body.contains(iris)) iris.remove(); };
        a.onfinish = cleanup;
        a.oncancel = cleanup;
        setTimeout(cleanup, 700);
      } catch {
        iris.remove();
      }
    };

    if (typeof document.startViewTransition === "function") {
      const vt = document.startViewTransition(applyDOM);
      themeTimeoutRef.current = setTimeout(() => setTheme(next), 0);
      vt.ready
        .then(() => {
          try {
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${origin})`, `circle(${maxR}px at ${origin})`] },
              { duration: 640, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "both", pseudoElement: "::view-transition-new(root)" }
            );
          } catch {}
          // border ripple is visible even with VT, especially on mobile where clip is subtle
          spawnRipple();
        })
        .catch(() => {
          spawnRipple();
          spawnIrisFallback();
        });
      try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
      return;
    }

    // Fallback path — no ViewTransition (mobile Safari / older) : do BOTH iris + ripple so it's unmistakable
    applyDOM();
    setTheme(next);
    spawnIrisFallback();
    // slight delay so iris is visible before border
    requestAnimationFrame(() => spawnRipple());
    try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
  }, []);

  return { theme, isDark, toggleTheme, setTheme };
}