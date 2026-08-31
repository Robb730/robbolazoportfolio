import { useEffect, useState, useCallback, useRef } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Minimum time between *animated* toggles (view-transition snapshot + ripple).
// document.startViewTransition() takes a full-page GPU snapshot synchronously
// the instant it's called — before any of our JS gets a chance to skip or
// cancel it. Spamming the button faster than the browser can allocate/free
// those snapshots is what was crashing the tab, no matter how well we
// cleaned up afterwards. Below this interval we skip the animation
// entirely and do a plain, instant DOM switch instead.
// 850ms = one full 640ms iris + safety margin; prevents overlapping snapshots.
const MIN_ANIM_INTERVAL = 850;

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

  // Holds the in-flight ViewTransition object. Lets a rapid re-click end
  // the previous transition cleanly instead of letting two transitions
  // (each snapshotting the blurred nav/drawer) animate on top of each
  // other.
  const vtRef = useRef(null);

  // Caps how many ripple divs can be animating at once so repeated clicks
  // can't accumulate an unbounded number of fixed, full-viewport elements.
  const activeRipplesRef = useRef([]);

  // Timestamp of the last time we actually STARTED an animated transition
  // (view transition or manual iris fallback) — used to rate-limit them.
  const lastAnimStartRef = useRef(0);

  // Hard lock while an animated transition is in-flight. Even if the
  // MIN_ANIM_INTERVAL has elapsed, we never start a second snapshot while
  // the previous one is still animating — that's what OOMs the GPU process.
  const animLockRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const [isToggling, setIsToggling] = useState(false);

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
      clearTimeout(unlockTimerRef.current);
      activeRipplesRef.current.forEach((e) => e.el?.cancel?.());
      activeRipplesRef.current = [];
      try { vtRef.current?.skipTransition?.(); } catch {}
      document.documentElement.classList.remove("vt-active");
    };
  }, []);

  /* Butter-smooth toggle — iris ripple (clip-path) + outline ripple.
     Both run on compositor: clip-path on VT snapshot (GPU), border ring 0→1 scale.
     640ms ease-out. Zero layout thrash. Animation itself is rate-limited
     (see MIN_ANIM_INTERVAL) — rapid-fire clicks fall back to an instant,
     zero-cost DOM switch instead of piling up GPU snapshots. */
  const toggleTheme = useCallback((event) => {
    const current = themeRef.current;
    const next = current === "dark" ? "light" : "dark";
    themeRef.current = next;

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

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const tooSoon = now - lastAnimStartRef.current < MIN_ANIM_INTERVAL;
    const locked = animLockRef.current;

    // Instant path: reduced motion, OR clicks arriving faster than we can
    // safely start another animation, OR previous animation still in-flight.
    // No snapshot, no ripple, no GPU work — this is what makes spamming
    // the button safe (prevents OOM "oh snap" from overlapping snapshots).
    // The icon still crossfades smoothly because that's driven by the
    // .theme-dark CSS class, independent of this animation.
    if (prefersReduced || tooSoon || locked || vtRef.current) {
      if (vtRef.current) {
        try { vtRef.current.skipTransition(); } catch {}
        vtRef.current = null;
      }
      document.documentElement.classList.remove("vt-active");
      applyDOM();
      setTheme(next);
      try { window.dispatchEvent(new CustomEvent("theme:toggle")); } catch {}
      return;
    }

    lastAnimStartRef.current = now;
    animLockRef.current = true;
    setIsToggling(true);
    clearTimeout(unlockTimerRef.current);
    // unlock after the 640ms iris + margin; finished handler will also unlock earlier if supported
    unlockTimerRef.current = setTimeout(() => {
      animLockRef.current = false;
      setIsToggling(false);
    }, 820);

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

    const spawnRipple = () => {
      if (typeof document.body.animate !== "function") return;

      // Hard cap: if too many ripples are already animating, kill the
      // oldest ones immediately instead of letting them stack.
      while (activeRipplesRef.current.length >= 3) {
        const old = activeRipplesRef.current.shift();
        old?.el?.cancel?.();
        if (old?.node && document.body.contains(old.node)) old.node.remove();
      }

      const ripple = document.createElement("div");
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.cssText =
        `position:fixed;left:${x - maxR}px;top:${y - maxR}px;width:${d}px;height:${d}px;` +
        `border-radius:9999px;pointer-events:none;z-index:100000;box-sizing:border-box;` +
        `border:1px solid rgba(${col},0.24);opacity:0;will-change:transform,opacity;`;
      document.body.appendChild(ripple);

      const anim = ripple.animate(
        [{ transform: "scale(0)", opacity: 0.38 }, { transform: "scale(1)", opacity: 0 }],
        { duration: 640, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
      );
      const entry = { node: ripple, el: anim };
      activeRipplesRef.current.push(entry);

      const cleanup = () => {
        activeRipplesRef.current = activeRipplesRef.current.filter((e) => e !== entry);
        if (document.body.contains(ripple)) ripple.remove();
      };
      anim.onfinish = cleanup;
      anim.oncancel = cleanup;
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
      // A previous click's transition may still be running — end it now
      // rather than letting a second transition snapshot the page on top
      // of it.
      if (vtRef.current) {
        try { vtRef.current.skipTransition(); } catch {}
        vtRef.current = null;
      }

      // Strip the heavy backdrop-filter blur off the glass nav/drawer while
      // the transition snapshot is taken (see .vt-active in globals.css).
      document.documentElement.classList.add("vt-active");

      const vt = document.startViewTransition(applyDOM);
      vtRef.current = vt;

      clearTimeout(themeTimeoutRef.current);
      themeTimeoutRef.current = setTimeout(() => setTheme(next), 0);

      const clearVtActive = () => {
        document.documentElement.classList.remove("vt-active");
        if (vtRef.current === vt) vtRef.current = null;
        animLockRef.current = false;
        setIsToggling(false);
        clearTimeout(unlockTimerRef.current);
      };
      vt.finished.then(clearVtActive).catch(clearVtActive);
      // safety: also clear animLock if ready rejects (browser without VT pseudo)
      vt.ready.catch(() => {
        animLockRef.current = false;
        setIsToggling(false);
      });

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

  return { theme, isDark, toggleTheme, setTheme, isToggling };
}