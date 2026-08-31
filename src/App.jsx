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
import { useState, useCallback, useRef } from "react";

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
