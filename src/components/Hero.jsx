"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import ScrambleText from "./ScrambleText";

const Lanyard = lazy(() => import("./Lanyard"));

export default function Hero({ className = "" }) {
  const [isMobile, setIsMobile] = useState(
    () => typeof document !== "undefined" && document.documentElement.clientWidth < 768
  );

  useEffect(() => {
    let frame;
    const handleResize = () => {
      // rAF debounce — avoids reacting to noisy intermediate resize events
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIsMobile(document.documentElement.clientWidth < 768);
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
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
          title={isMobile ? "Tap 5× quickly — mobile easter egg" : undefined}
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

        {/* CTAs */}
        <div
          data-reveal
          className="reveal mt-6 md:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto pointer-events-auto"
          style={{ transitionDelay: "180ms" }}
        >
          <a
            href="#projects"
            className="hero-btn-primary group inline-flex items-center justify-center gap-2.5 border border-ink bg-ink text-paper px-7 py-3.5 font-medium text-sm transition-all duration-200 hover:bg-paper hover:text-ink"
          >
            <span>View Projects</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
          <a
            href="#contact"
            className="hero-btn-ghost group inline-flex items-center justify-center gap-2 border border-line bg-paper px-7 py-3.5 font-medium text-sm text-muted transition-all duration-200 hover:border-ink hover:text-ink"
          >
            <span>Get in touch</span>
          </a>
        </div>
      </div>

      {/* Hero Bottom Bar */}
      <div className="max-w-6xl mx-auto w-full pt-4 md:pt-6 border-t md:border-t-0 border-line flex items-center justify-between text-xs font-mono text-faint relative z-20">
        <span>2026</span>

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