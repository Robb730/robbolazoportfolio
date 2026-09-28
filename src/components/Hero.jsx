"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import ScrambleText from "./ScrambleText";
import { SITE_YEAR } from "../lib/siteMeta";

const Lanyard = lazy(() => import("./Lanyard"));

export default function Hero({ className = "" }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setIsMobile(!e.matches);
    // Safari <14 fallback
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Safety net: hero is above the fold — guarantee its [data-reveal] nodes
  // become visible even if IntersectionObserver misses due to resize/rAF timing.
  // Without this, .reveal stays at opacity:0 and the huge "Robb Olazo" headline
  // appears to disappear on resize.
  useEffect(() => {
    const check = () => {
      const section = document.getElementById("top");
      if (!section) return;
      section.querySelectorAll("[data-reveal].reveal:not(.is-visible)").forEach((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.top < window.innerHeight * 0.92 && r.bottom > -40;
        if (inView) el.classList.add("is-visible");
      });
    };
    const id = requestAnimationFrame(check);
    const t = setTimeout(check, 400);
    window.addEventListener("resize", check, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
      window.removeEventListener("resize", check);
    };
  }, [isMobile]);

  

  // Watchdog: Chrome can drop the giant headline raster (e.g. after the
  // fullscreen nav-transition curtain unmounts) leaving the name blank
  // until refresh. Self-heal: re-assert hero reveal classes + force the h1
  // to re-raster when the tab regains visibility and on a slow interval.
  // Repair-only — never restarts entrance animations, single reflow each.
  useEffect(() => {
    const repair = (source) => {
      try {
        const section = document.getElementById("top");
        if (!section) return;
        let fixed = false;
        section.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
          el.classList.add("is-visible");
          fixed = true;
        });
        const h1 = section.querySelector("h1");
        if (h1) {
          h1.classList.add("hero-repaint");
          void h1.offsetHeight; // reflow → re-raster
          setTimeout(() => h1.classList.remove("hero-repaint"), 60);
        }
        if (fixed) {
          try { console.warn(`[hero-watchdog] repaired headline (${source})`); } catch {}
        }
      } catch {}
    };
    const onVis = () => { if (!document.hidden) repair("visible"); };
    const onFocus = () => repair("focus");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    const id = setInterval(() => repair("interval"), 30000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, []);


  return (
    <section
      id="top"
      className={`relative px-6 md:px-10 overflow-hidden flex flex-col justify-between min-h-[100dvh] pt-24 md:pt-36 pb-8 bg-paper ${className}`}
    >
      {/* Subtle dot-grid background — adapts to light/dark via CSS vars */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hero-dot-grid"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-ghost) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 20% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 20% 50%, black 30%, transparent 100%)",
          opacity: 0.9,
        }}
      />

      {/* Desktop 3D Physics Lanyard — desktop only, hidden via CSS on mobile */}
      {!isMobile && (
        <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 pointer-events-auto z-10">
          <Suspense fallback={null}>
            <Lanyard
              position={[0, 0, 22]}
              gravity={[0, -40, 0]}
              frontImage="/new-logo.svg"
              lanyardWidth={1.1}
            />
          </Suspense>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center relative pointer-events-none z-20 my-auto">
        {/* Availability Status Badge — scramble on hover for subtle interactability */}
        <div data-reveal className="reveal flex items-center gap-3 mb-4 sm:mb-6 md:mb-8 pointer-events-auto">
          <span className="w-8 h-px bg-ink" />
          <ScrambleText
            text="Available for work"
            className="font-mono text-xs tracking-[0.2em] text-muted uppercase cursor-default"
            aria-label="Available for work"
          />
          <span className="w-2 h-2 rounded-full bg-ink dot-pulse" />
        </div>

        {/* Display Headline — DM Serif Display, italic first name — mobile gwapo tap target (disabled on desktop) */}
        <h1
          data-reveal
          className={`reveal leading-[0.88] max-w-full text-ink pointer-events-auto select-none ${isMobile ? "cursor-pointer" : "cursor-default"}`}
          style={{
            fontSize: "clamp(3.75rem, 18vw, 10.5rem)",
            fontFamily: "'DM Serif Display', serif",
            letterSpacing: "-0.01em",
          }}
          title={isMobile ? "" : undefined}
        >
          <span className="block font-serif not-italic pointer-events-none">Robb</span>
          <span className="block font-serif italic pointer-events-none">Olazo</span>
        </h1>

        {/* Role / Discipline tagline */}
        <div
          data-reveal
          className="reveal flex items-center gap-3 mt-5 sm:mt-6 pointer-events-auto"
          style={{ transitionDelay: "60ms" }}
        >
          <span className="font-mono text-xs tracking-[0.18em] text-faint uppercase">Backend</span>
          <span className="w-1 h-1 rounded-full bg-faint" />
          <span className="font-mono text-xs tracking-[0.18em] text-faint uppercase">UX</span>
          <span className="w-1 h-1 rounded-full bg-faint" />
          <span className="font-mono text-xs tracking-[0.18em] text-faint uppercase">Full-Stack</span>
        </div>

        {/* Bio */}
        <p
          data-reveal
          className="reveal mt-8 sm:mt-10 md:mt-14 text-muted text-base sm:text-lg md:text-xl max-w-sm leading-relaxed pointer-events-auto"
          style={{ transitionDelay: "120ms" }}
        >
          Developer crafting thoughtful digital experiences and solutions.
        </p>
      </div>

      {/* Hero Bottom Bar */}
      <div className="max-w-6xl mx-auto w-full pt-4 md:pt-6 border-t md:border-t-0 border-line flex items-center justify-between text-xs font-mono text-faint relative z-20">
        <span>{SITE_YEAR}</span>

        {/* Scroll indicator — mobile only */}
        <div className="flex md:hidden items-center gap-2">
          <span className="tracking-[0.15em] uppercase">Scroll</span>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              animation: "hero-bounce 1.6s ease-in-out infinite",
            }}
          >
            ↓
          </span>
        </div>

        <span>PH</span>
      </div>

      <style>{`
        @keyframes hero-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </section>
  );
}