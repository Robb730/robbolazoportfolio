import { useEffect, useRef } from "react";

const CORRUPT_CHARS = "█▓▒░#$%&/\\01<>|§¤*+?=!;:·•_".split("");
const REVERT_DELAY = 85;

function pickCorruptChar(orig) {
  let c;
  do { c = CORRUPT_CHARS[Math.floor(Math.random() * CORRUPT_CHARS.length)]; } while (c === orig);
  return c;
}

export default function useHackerCorruption() {
  const intervalRef = useRef(null);
  const timeoutsRef = useRef(new Set());

  useEffect(() => {
    const isReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Capture pristine nav markup before any corruption destroys responsive spans
    const navOrigHTML = new Map();
    document.querySelectorAll(".nav-pill-link").forEach((a) => navOrigHTML.set(a, a.innerHTML));
    const SELECTOR = [
      ".theme-hacker h1 span",
      ".theme-hacker h2",
      ".theme-hacker .font-display",
      ".theme-hacker .nav-pill-link span",
      ".theme-hacker .skill-name",
      ".theme-hacker .proj-tag",
      ".theme-hacker .marquee-track span",
      ".theme-hacker #about h2",
      ".theme-hacker #skills h2",
      ".theme-hacker #projects h2",
      ".theme-hacker #projects .proj-card h3",
      ".theme-hacker #certificates h3",
      ".theme-hacker #contact h2",
      ".theme-hacker #contact p",
      ".theme-hacker #about p",
      ".theme-hacker #skills p",
      ".theme-hacker .cert-card p",
      ".theme-hacker .proj-card p",
    ].join(", ");

    const getTargets = () =>
      Array.from(document.querySelectorAll(SELECTOR)).filter((el) => {
        const t = el.textContent?.trim();
        if (!t || t.length < 2) return false;
        // Skip parents that contain element children — we only want leaf text nodes
        // (prevents destroying responsive <span> structure inside .nav-pill-link)
        if (el.children.length > 0) return false;
        // skip hidden-by-tailwind spans (display:none) — corrupting them would still affect textContent when they become visible
        // keep them but they will be caught when visible; no harm to skip hidden? we corrupt only visible:
        // consider offsetParent check but keep simple
        return true;
      });

    const ensureDataText = (el) => {
      if (!el.dataset.text) el.dataset.text = el.textContent;
      if (!el.dataset.origHackerText) el.dataset.origHackerText = el.textContent;
    };

    const revert = (el) => {
      if (el.dataset.origHackerText != null) {
        el.textContent = el.dataset.origHackerText;
        el.classList.remove("hacker-char-corrupted");
        delete el.dataset.hackerCorrupting;
      }
    };

    const corruptOne = (el) => {
      if (el.dataset.hackerCorrupting === "1") return;
      const orig = el.dataset.origHackerText ?? el.textContent;
      if (!orig || orig.length < 2) return;
      ensureDataText(el);
      // pick 1-2 indices that are not spaces
      const idxs = [];
      const attempts = 10;
      for (let i = 0; i < attempts && idxs.length < (Math.random() < 0.32 ? 2 : 1); i++) {
        const idx = Math.floor(Math.random() * orig.length);
        if (orig[idx] === " " || orig[idx] === "\n" || idxs.includes(idx)) continue;
        idxs.push(idx);
      }
      if (!idxs.length) return;
      const chars = orig.split("");
      idxs.forEach((idx) => { chars[idx] = pickCorruptChar(chars[idx]); });
      // occasionally also duplicate fragment: insert extra symbol at end
      if (Math.random() < 0.08) chars.push(CORRUPT_CHARS[Math.floor(Math.random() * 4)]);
      el.dataset.hackerCorrupting = "1";
      el.textContent = chars.join("");
      el.classList.add("hacker-char-corrupted");
      const t = setTimeout(() => {
        revert(el);
        timeoutsRef.current.delete(t);
      }, REVERT_DELAY + Math.random() * 40);
      timeoutsRef.current.add(t);
    };

    const tick = () => {
      if (isReduced()) return;
      if (!document.documentElement.classList.contains("theme-hacker")) return;
      const targets = getTargets();
      targets.forEach((el) => {
        ensureDataText(el);
        // 7-9% per element per tick → ~1-2 elements corrupt per frame on typical page
        if (Math.random() < 0.082) corruptOne(el);
      });
    };

    const ensurePseudoLayers = () => {
      // h1/h2/.font-display use ::before/::after with attr(data-text) for sliced duplicates
      document.querySelectorAll(".theme-hacker h1, .theme-hacker h2, .theme-hacker .font-display").forEach((el) => {
        if (!el.dataset.text) el.dataset.text = (el.textContent || "").trim().slice(0, 120);
      });
    };

    const start = () => {
      if (intervalRef.current) return;
      // init data-text for pseudo layers + corruption targets
      getTargets().forEach(ensureDataText);
      ensurePseudoLayers();
      intervalRef.current = setInterval(() => { ensurePseudoLayers(); tick(); }, 78);
    };
    const stop = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
      document.querySelectorAll("[data-orig-hacker-text]").forEach((el) => {
        el.textContent = el.dataset.origHackerText;
        el.classList.remove("hacker-char-corrupted");
        delete el.dataset.hackerCorrupting;
      });
      // Repair any nav-pill-link that was flattened by the old selector (pre-fix) — it lost its 3 responsive spans
      const NAV_LABELS = {
        "#about": "About",
        "#skills": "Skills",
        "#projects": "Projects",
        "#certificates": "Certificates and Awards",
        "#contact": "Contact",
      };
      document.querySelectorAll(".nav-pill-link").forEach((a) => {
        if (a.children.length === 0 && a.textContent.trim().length > 0) {
          const orig = navOrigHTML.get(a);
          if (orig && orig.includes("<span")) {
            a.innerHTML = orig;
          } else {
            const href = a.getAttribute("href");
            const label = NAV_LABELS[href] || a.textContent.trim();
            const short = label === "Certificates and Awards" ? "Awards" : label;
            const mid = label === "Certificates and Awards" ? "Certificates" : label;
            a.innerHTML = `<span class="sm:hidden">${short}</span><span class="hidden sm:inline lg:hidden">${mid}</span><span class="hidden lg:inline">${label}</span>`;
          }
        }
        // clean up data attrs on the parent itself if it was incorrectly used
        delete a.dataset.origHackerText;
        delete a.dataset.text;
        delete a.dataset.hackerCorrupting;
        a.classList.remove("hacker-char-corrupted");
      });
      // also clear data-text on h1/h2 pseudo so slices disappear immediately
      document.querySelectorAll(".theme-hacker h1, .theme-hacker h2, .theme-hacker .font-display").forEach((el) => {
        // keep dataset.text for next hacker, but ensure pseudo opacity 0 by not animating (CSS handles via .theme-hacker selector)
      });
    };

    const sync = () => {
      if (document.documentElement.classList.contains("theme-hacker")) start();
      else stop();
    };

    // initial sync
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      obs.disconnect();
      stop();
    };
  }, []);
}
