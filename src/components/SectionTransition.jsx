import { useEffect, useState, useRef } from "react";
import { SITE_YEAR } from "../lib/siteMeta";

/**
 * Fullscreen PowerPoint-style section transition.
 * Shows centered word (e.g. "Projects"), covers whole page,
 * holds ~700ms, then fades/slides out to reveal target section.
 *
 * Usage: rendered when `label` is non-null. Calls `onCover` once
 * the overlay has fully covered the page (good moment to jump-scroll
 * underneath), and `onDone` after exit animation completes.
 */
export default function SectionTransition({ label, onCover, onDone }) {
  const [phase, setPhase] = useState("enter"); // enter | hold | exit
  const doneRef = useRef(false);

  // Lock body scroll while visible
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Prevent background scroll via wheel/touch
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener("wheel", prevent, { passive: false });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.removeEventListener("wheel", prevent);
      document.removeEventListener("touchmove", prevent);
    };
  }, []);

  useEffect(() => {
    // Cheap exit on Escape
    const onKey = (e) => {
      if (e.key === "Escape" && !doneRef.current) {
        doneRef.current = true;
        setPhase("exit");
        setTimeout(() => onDone?.(), 420);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  useEffect(() => {
    if (!label) return;
    // Timeline: enter 420ms → call onCover → hold 750ms → exit 420ms → done
    const COVER_MS = 420;
    const HOLD_MS = 750;
    const EXIT_MS = 420;

    const tCover = setTimeout(() => {
      onCover?.();
      setPhase("hold");
    }, COVER_MS);

    const tExit = setTimeout(() => {
      setPhase("exit");
    }, COVER_MS + HOLD_MS);

    const tDone = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }, COVER_MS + HOLD_MS + EXIT_MS);

    return () => {
      clearTimeout(tCover);
      clearTimeout(tExit);
      clearTimeout(tDone);
    };
  }, [label, onCover, onDone]);

  if (!label) return null;

  const letters = label.split("");

  const isExit = phase === "exit";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Navigating to ${label}`}
      className={`section-transition ${isExit ? "is-exiting" : ""}`}
      onClick={() => {
        if (!doneRef.current) {
          doneRef.current = true;
          setPhase("exit");
          setTimeout(() => onDone?.(), 380);
        }
      }}
    >
      {/* curtain — ink background */}
      <div className={`st-curtain ${isExit ? "st-curtain-exit" : "st-curtain-enter"}`} />

      {/* subtle top hairline that wipes */}
      <div className="st-topbar" aria-hidden="true" />

      {/* center word */}
      <div className={`st-word-wrap ${isExit ? "st-word-exit" : "st-word-enter"}`}>
        {/* small eyebrow */}
        <p className="st-eyebrow" aria-hidden="true">
          <span className="st-eyebrow-line" />
          <span>Navigating to</span>
          <span className="st-eyebrow-line" />
        </p>

        <h2 className="st-word" aria-label={label}>
          {letters.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className="st-char"
              style={{
                // stagger: 28ms per letter, max ~300ms
                animationDelay: `${i * 42}ms`,
                // keep space for actual spaces
                whiteSpace: ch === " " ? "pre" : undefined,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </h2>

        {/* powerpoint style underline wipe */}
        <div className="st-underline" aria-hidden="true">
          <div className="st-underline-fill" />
        </div>

        <p className="st-hint" aria-hidden="true">— epic transition —</p>
      </div>

      {/* bottom section indicator / progress */}
      <div className="st-bottom">
        <span className="st-bottom-label">{label.toLowerCase()}</span>
        <span className="st-bottom-dot" />
        <span className="st-bottom-year">{SITE_YEAR}</span>
      </div>
    </div>
  );
}
