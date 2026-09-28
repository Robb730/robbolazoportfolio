import { useEffect, useRef } from "react";

/**
 * Scroll-reveal for every [data-reveal] element inside the returned scope ref.
 *
 *   const scopeRef = useReveal();      // <div ref={scopeRef}> … </div>
 *   <h2 className="reveal" data-reveal>…</h2>
 *
 * Variants:  data-reveal="fade | left | right | scale"   (default: slide up)
 * Optional:  data-reveal-delay="200"                     (ms, overrides the auto-stagger)
 *
 * What it does (and why):
 *  • ONE IntersectionObserver, elements are un-observed the moment they reveal.
 *  • Trigger is viewport-relative (rootMargin), not a % of the element, so tall
 *    and short elements reveal at the same scroll position and tall ones can
 *    never get "stuck" below a ratio threshold.
 *  • Elements that enter together are staggered top→bottom, left→right
 *    (cards in a grid cascade instead of popping in as one block).
 *  • Anything already scrolled past (page reload mid-scroll, hash jump, fast
 *    nav scroll) is shown instantly, so you never scroll up into blank space.
 *  • State lives in data-attributes (data-revealed / data-reveal-done), which
 *    React never touches — a className re-render can't re-hide an element.
 *  • When an element's reveal finishes, all reveal styling is dropped
 *    (`data-reveal-done`), so it stops fighting the element's own hover /
 *    tilt transforms and leaves no stacking context or GPU layer behind.
 *  • MutationObserver catches nodes mounted later (tabs, view toggles,
 *    filters, lazy sections). It is batched to one pass per frame and does
 *    almost nothing per mutation, so heavy DOM churn (chat, hacker theme)
 *    stays cheap.
 *  • Safety net: a debounced sweep on resize / end-of-page / 1.2 s after mount
 *    reveals anything visible that the observer somehow missed (e.g. content
 *    sitting inside the bottom margin band when the page can't scroll further).
 */

const SELECTOR = "[data-reveal]";
const ROOT_MARGIN = "0px 0px -10% 0px"; // reveal when an element's top crosses 90% of viewport height
const STAGGER_MS = 80;
const STAGGER_MAX = 6; // cap → a 12-card grid never takes more than ~0.5 s to cascade
const SETTLE_MS = 120;
const FALLBACK_DURATION_MS = 800;

const toMs = (v) => {
  const s = String(v || "").split(",")[0].trim();
  if (s.endsWith("ms")) return parseFloat(s) || 0;
  if (s.endsWith("s")) return (parseFloat(s) || 0) * 1000;
  return 0;
};

// keep JS timing in sync with --reveal-duration in CSS
const readDurationMs = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--reveal-duration");
  return toMs(v) || FALLBACK_DURATION_MS;
};

export default function useReveal() {
  const scopeRef = useRef(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = readDurationMs();

    const pending = new Set(); // observed, not yet revealed
    const settling = new Map(); // revealed, waiting to be marked done → timer id

    /* ── reveal one element ─────────────────────────────────────────────── */
    const reveal = (el, delay = 0, instant = false) => {
      pending.delete(el);
      io?.unobserve(el);
      if (el.hasAttribute("data-revealed")) return;

      const skip = instant || reduceMotion.matches;
      const own = toMs(el.style.transitionDelay); // a component's inline delay wins
      if (skip) el.setAttribute("data-reveal-instant", "");
      else if (delay > 0) el.style.setProperty("--reveal-delay", `${delay}ms`);

      el.setAttribute("data-revealed", "");
      el.classList.add("is-visible"); // kept for any code that still looks for it

      const total = skip ? 50 : (own || delay) + duration + SETTLE_MS;
      const t = setTimeout(() => {
        settling.delete(el);
        el.setAttribute("data-reveal-done", "");
        el.style.removeProperty("--reveal-delay");
      }, total);
      settling.set(el, t);
    };

    /* items that become visible in the same frame cascade in order */
    const revealBatch = (items) => {
      if (!items.length) return;
      items.sort((a, b) => a.top - b.top || a.left - b.left);
      items.forEach(({ el }, i) => {
        const attr = el.getAttribute("data-reveal-delay");
        const explicit = attr !== null && attr !== "" && !Number.isNaN(Number(attr));
        reveal(el, explicit ? Number(attr) : Math.min(i, STAGGER_MAX) * STAGGER_MS);
      });
    };

    /* ── observer ───────────────────────────────────────────────────────── */
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              const entering = [];
              for (const e of entries) {
                if (e.isIntersecting) {
                  entering.push({
                    el: e.target,
                    top: e.boundingClientRect.top,
                    left: e.boundingClientRect.left,
                  });
                } else if (e.rootBounds && e.boundingClientRect.bottom <= e.rootBounds.top) {
                  reveal(e.target, 0, true); // already scrolled past → no animation
                }
              }
              revealBatch(entering);
            },
            { rootMargin: ROOT_MARGIN, threshold: 0 }
          )
        : null;

    const observeEl = (el) => {
      if (pending.has(el) || el.hasAttribute("data-revealed") || el.classList.contains("is-visible")) return;
      pending.add(el);
      if (io) io.observe(el);
      else reveal(el, 0, true); // very old browser: just show everything
    };

    scope.querySelectorAll(SELECTOR).forEach(observeEl);

    /* ── nodes mounted later (batched: one pass per frame) ──────────────── */
    const queue = new Set();
    let flushRaf = 0;
    let pruneNeeded = false;

    const flush = () => {
      flushRaf = 0;
      for (const node of queue) {
        if (!node.isConnected) continue;
        if (node.hasAttribute("data-reveal")) observeEl(node);
        if (node.firstElementChild) node.querySelectorAll(SELECTOR).forEach(observeEl);
      }
      queue.clear();
      if (pruneNeeded) {
        pruneNeeded = false;
        for (const el of pending) {
          if (!el.isConnected) {
            pending.delete(el);
            io?.unobserve(el);
          }
        }
      }
    };

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.removedNodes.length) pruneNeeded = true;
        for (const n of m.addedNodes) if (n.nodeType === 1) queue.add(n);
      }
      if ((queue.size || pruneNeeded) && !flushRaf) flushRaf = requestAnimationFrame(flush);
    });
    mo.observe(scope, { childList: true, subtree: true });

    /* ── safety net ─────────────────────────────────────────────────────── */
    const sweep = (force) => {
      if (!pending.size) return;
      const vh = window.innerHeight;
      const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
      if (!force && !atBottom) return;

      const visible = [];
      for (const el of pending) {
        if (!el.isConnected) {
          pending.delete(el);
          io?.unobserve(el);
          continue;
        }
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) visible.push({ el, top: r.top, left: r.left });
      }
      revealBatch(visible);
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf || !pending.size) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        sweep(false);
      });
    };

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => sweep(true), 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const bootTimer = setTimeout(() => sweep(true), 1200);

    return () => {
      io?.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(flushRaf);
      cancelAnimationFrame(scrollRaf);
      clearTimeout(resizeTimer);
      clearTimeout(bootTimer);
      // finish anything mid-reveal so a remount (StrictMode) leaves no stale state
      for (const [el, t] of settling) {
        clearTimeout(t);
        el.setAttribute("data-reveal-done", "");
      }
      settling.clear();
      pending.clear();
    };
  }, []);

  return scopeRef;
}