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

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return scopeRef;
}