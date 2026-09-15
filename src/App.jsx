import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Certificates from "./components/Certificates";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingOrbs from "./components/FloatingOrbs";
import FloatingChat from "./components/FloatingChat";
import useReveal from "./hooks/useReveal";
import useTheme from "./hooks/useTheme";
import useHackerCorruption from "./hooks/useHackerCorruption";
import Marquee from "./components/Marquee";
import ContextMenu from "./components/ContextMenu";
import EasterEggs from "./components/EasterEggs";
import ImageGuard from "./components/ImageGuard";
import SectionTransition from "./components/SectionTransition";
import { useState, useCallback, useRef, useEffect } from "react";
import { playRandomClick, primeHoverAudio } from "./lib/clickSounds";

export default function App() {
  const scopeRef = useReveal();
  const { isDark, toggleTheme, isToggling } = useTheme();
  useHackerCorruption();

  // ── PowerPoint-style navbar section transition ──
  const [transition, setTransition] = useState(null); // { label, href, key }
  const lockRef = useRef(false);

  const scrollToHref = useCallback((href) => {
    const id = href.slice(1);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, "", href);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const headerH = document.querySelector("header")?.offsetHeight ?? 64;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", href);
  }, []);

  const handleNavTransition = useCallback((label, href) => {
    if (lockRef.current) return;
    // Reduced motion → skip overlay, just scroll instantly
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrollToHref(href);
      return;
    }
    lockRef.current = true;
    setTransition({ label, href, key: Date.now() });
  }, [scrollToHref]);

  const handleCover = useCallback(() => {
    if (transition?.href) scrollToHref(transition.href);
  }, [transition, scrollToHref]);

  const handleDone = useCallback(() => {
    setTransition(null);
    // small unlock delay so rapid clicks don't re-trigger before exit finishes
    setTimeout(() => { lockRef.current = false; }, 220);
  }, []);

  // ── Global hover click SFX (random of 9, autoplay after first gesture) ──
  useEffect(() => {
    // prime on first real interaction for autoplay
    const prime = () => primeHoverAudio();
    window.addEventListener("click", prime, { once: true, capture: true });
    window.addEventListener("keydown", prime, { once: true, capture: true });
    window.addEventListener("pointerdown", prime, { once: true, capture: true });

    // Also attempt to prime on first pointermove so hover can autoplay even before click
    // (muted AudioContext trick — hover itself isn't a gesture, but this warms the pool)
    let warmed = false;
    const warm = () => {
      if (warmed) return;
      warmed = true;
      try { primeHoverAudio(); } catch {}
    };
    window.addEventListener("pointermove", warm, { once: true, capture: true, passive: true });

    // Delegated hover: play random click on enter of any interactive/hoverable element
    const HOVER_SELECTOR =
      "a, button, [role=\"button\"], [data-hover-sound], " +
      ".nav-pill-link, .nav-cta, .theme-toggle, " +
      ".hero-btn-primary, .hero-btn-ghost, " +
      ".about-spec-card, .skill-card, .filter-pill, " +
      ".proj-card, .proj-list-row, .sort-single-btn, .view-single-btn, " +
      ".cert-card, .chat-fab, .chat-chip, .chat-send, .voice-mic, .voice-chip, .voice-secondary";

    let lastTarget = null;

    const onOver = (e) => {
      const el = e.target.closest(HOVER_SELECTOR);
      if (!el) return;
      // ignore disabled
      if (el.matches(":disabled, [aria-disabled=\"true\"]")) return;
      // ignore same target re-enter (moving inside same card)
      if (lastTarget === el) return;
      lastTarget = el;
      playRandomClick();
    };

    const onOut = (e) => {
      // clear lastTarget when leaving the element entirely
      if (!lastTarget) return;
      const related = e.relatedTarget;
      if (!related || !lastTarget.contains(related)) {
        // left the hovered element
        if (!related || !related.closest || !related.closest(HOVER_SELECTOR) || related.closest(HOVER_SELECTOR) !== lastTarget) {
          lastTarget = null;
        }
      }
    };

    // Use pointerover for better hover semantics; fallback to mouseover
    document.addEventListener("pointerover", onOver, { capture: true, passive: true });
    document.addEventListener("pointerout", onOut, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", prime, { capture: true });
      window.removeEventListener("keydown", prime, { capture: true });
      window.removeEventListener("pointerdown", prime, { capture: true });
      window.removeEventListener("pointermove", warm, { capture: true });
      document.removeEventListener("pointerover", onOver, { capture: true });
      document.removeEventListener("pointerout", onOut, { capture: true });
    };
  }, []);

  return (
    <div ref={scopeRef} className="min-h-screen bg-paper text-ink font-body">
      <FloatingOrbs />
      <Nav isDark={isDark} toggleTheme={toggleTheme} isToggling={isToggling} onTransition={handleNavTransition} />
      {transition && (
        <SectionTransition key={transition.key} label={transition.label} onCover={handleCover} onDone={handleDone} />
      )}
      <Hero />
      <main className="relative">
        <Marquee />
        <About isDark={isDark} />
        <Skills />
        <Projects />
        <Certificates />
        <Contact />
      </main>
      <Footer />
      <FloatingChat />
      <ContextMenu />
      <EasterEggs />
      <ImageGuard />
    </div>
  );
}
