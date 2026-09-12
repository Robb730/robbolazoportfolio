import { useEffect, useRef } from "react";

// Adds the .is-visible class to any [data-reveal] descendant once it
// scrolls into view, powering the .reveal fade/slide-up defined in index.css.
//
// Fix: the original version only ran `querySelectorAll("[data-reveal]")`
// once, in a mount-only effect. Any component that swaps its DOM nodes
// after mount — toggling grid/list views, switching tabs, filtering a
// list, paginating — mounts brand-new [data-reveal] elements that the
// one-time scan never sees. Those elements never get `.is-visible` added
// and stay stuck at opacity: 0 (invisible) forever.
//
// This version keeps the same IntersectionObserver alive for the whole
// component lifetime, but also runs a MutationObserver over the scope so
// any [data-reveal] node added later — no matter how or when — gets
// observed too. This fixes the bug everywhere useReveal is used, not
// just in one place.
export default function useReveal() {
  const scopeRef = useRef(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    const observeEl = (el) => {
      // Already revealed (e.g. re-scanned after a later mutation) —
      // don't re-observe it or it could flicker back to hidden.
      if (el.classList.contains("is-visible")) return;
      io.observe(el);
    };

    // Observe everything already in the DOM on mount.
    scope.querySelectorAll("[data-reveal]").forEach(observeEl);

    // Watch for nodes added later (view toggles, tab switches, filtered
    // lists, pagination, anything that re-renders new DOM nodes in).
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches?.("[data-reveal]")) observeEl(node);
          node.querySelectorAll?.("[data-reveal]").forEach(observeEl);
        });
      }
    });
    mo.observe(scope, { childList: true, subtree: true });

    // Resize safety net — if a [data-reveal] was missed (fast drag resize,
    // stale threshold, font clamp reflow), force it visible when it's
    // clearly in the viewport. Prevents above-fold hero headline staying
    // at opacity:0 and "disappearing" on resize.
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        scope.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
          const r = el.getBoundingClientRect();
          const inView = r.top < window.innerHeight * 0.92 && r.bottom > -40;
          if (inView) {
            // If it's hero or already intersecting, reveal immediately;
            // otherwise re-observe so IO can reveal on scroll as intended.
            if (el.closest("#top") || r.top < window.innerHeight * 0.85) {
              el.classList.add("is-visible");
              io.unobserve(el);
            } else {
              observeEl(el);
            }
          }
        });
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    // Fallback: if hero never got is-visible within 600ms (e.g. observer
    // missed the first frame), reveal it. Below-fold sections still wait
    // for scroll — timer only touches #top.
    const fallback = setTimeout(() => {
      scope.querySelectorAll('#top [data-reveal]:not(.is-visible)').forEach((el) => {
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, 600);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      clearTimeout(fallback);
    };
  }, []);

  return scopeRef;
}