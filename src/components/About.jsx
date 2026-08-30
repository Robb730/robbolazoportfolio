import { useState, useEffect } from "react";

/* ─── Data ───────────────────────────────────────────────────── */
const SPECIALIZATIONS = [
  { label: "Web Development", desc: "Building fast, responsive, and polished web experiences." },
  { label: "Full-Stack Development", desc: "End-to-end — from database design to pixel-perfect UI." },
  { label: "UI / UX", desc: "Clean interfaces that feel intuitive and look intentional." },
];

const TRAITS = [
  { num: "01", text: "Turning ideas into real, working products" },
  { num: "02", text: "Solving real-world problems through code" },
  { num: "03", text: "Always learning" },
  { num: "04", text: "Details matter" },
];

/* ─── Sub-components ─────────────────────────────────────────── */
function GlassCard({ children, className = "", style = {} }) {
  return (
    <div className={`about-glass ${className}`} style={style}>
      {children}
    </div>
  );
}

function SpecCard({ item, isActive, onEnter, onLeave }) {
  return (
    <button
      className={`about-spec-card text-left w-full transition-all duration-200 ${isActive ? "asc-active" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <span className="font-mono text-[10px] tracking-widest text-faint uppercase block mb-2">
        {item.label}
      </span>
      <p className={`text-sm leading-relaxed transition-colors duration-200 ${isActive ? "text-paper" : "text-muted"}`}>
        {item.desc}
      </p>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function About({ isDark }) {
  const [hoveredSpec, setHoveredSpec] = useState(null);
  const [isHacker, setIsHacker] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("theme-hacker")
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsHacker(root.classList.contains("theme-hacker"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    // EasterEggs toggles hacker via direct classList, also listen to toggle events
    window.addEventListener("theme:toggle", sync);
    // Konami adds hacker without theme:toggle, so also check on wiggle
    window.addEventListener("easter:wiggle", sync);
    return () => {
      obs.disconnect();
      window.removeEventListener("theme:toggle", sync);
      window.removeEventListener("easter:wiggle", sync);
    };
  }, []);
  const photoSrc = isHacker ? "/hacker-theme.png" : isDark ? "/normal.png" : "/lightmode.png";

  return (
    <>
      <style>{`
        .about-glass {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid rgba(224,224,224,0.7);
        }
        .theme-dark .about-glass {
          background: rgba(26,26,26,0.6);
          border-color: rgba(51,51,51,0.7);
        }
        /* Photo slot */
        .about-photo-slot {
          border: 1px solid var(--color-line);
          background-color: var(--color-panel);
        }
        .about-photo-slot img {
          position: relative;
          z-index: 1;
        }
        .about-photo-slot img[style*="display: none"] ~ .about-photo-placeholder {
          display: flex;
        }
        .about-photo-placeholder {
          background-image: repeating-linear-gradient(
            135deg,
            var(--color-ghost),
            var(--color-ghost) 1px,
            transparent 1px,
            transparent 10px
          );
        }
        .about-spec-card {
          padding: 20px;
          border: 1px solid var(--color-line);
          background: transparent;
          cursor: default;
        }
        .about-spec-card.asc-active {
          background: var(--color-ink);
          border-color: var(--color-ink);
        }
        .about-spec-card.asc-active span {
          color: rgba(255,255,255,0.45);
        }
        .trait-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--color-line);
        }
        .trait-row:first-child { border-top: 1px solid var(--color-line); }
      `}</style>

      <section
        id="about"
        className="relative py-16 md:py-24 lg:py-32 px-6 md:px-10 border-t border-line bg-paper"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full space-y-4">

          {/* ── Row 1: Identity card ──────────────────── */}
          <GlassCard className="p-7 md:p-10">
            <div data-reveal className="reveal">
              <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase mb-6">About</p>
              <div className="grid md:grid-cols-[auto_1fr_1fr] gap-8 md:gap-12 items-start">

                {/* Photo slot */}
                <div className="flex-shrink-0 flex justify-center md:block mx-auto">
                  <div className="about-photo-slot w-36 h-44 md:w-44 md:h-56 relative overflow-hidden">
                    <img
                      key={photoSrc}
                      src={photoSrc}
                      alt="Robb Olazo"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    {/* Placeholder shown when image is missing */}
                    <div className="about-photo-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <span className="font-mono text-[10px] tracking-widest text-faint uppercase text-center leading-relaxed">

                      </span>
                    </div>
                  </div>
                </div>

                {/* Name + bio */}
                <div className="space-y-4 text-center md:text-left">
                  <h2
                    className="leading-tight text-ink flex flex-col items-center md:block"
                    style={{
                      fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                      fontFamily: "'DM Serif Display', serif",
                    }}
                  >
                    <span className="not-italic block">Robb Olazo</span>
                    <span className="italic block text-muted" style={{ fontSize: "0.55em" }}>
                      Aspiring Web Developer
                    </span>
                  </h2>
                  <p className="text-muted text-sm md:text-base leading-relaxed">
                    I build web applications, systems, and interactive digital experiences that solve real problems —
                    from the backend logic to the front-facing interface.
                  </p>
                </div>

                {/* Traits */}
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase mb-4">How I work</p>
                  {TRAITS.map((t) => (
                    <div key={t.num} className="trait-row">
                      <span className="font-mono text-[10px] text-faint flex-shrink-0">{t.num}</span>
                      <span className="text-sm text-ink">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── Row 2: Specializations ────────────────── */}
          <div
            data-reveal
            className="reveal grid grid-cols-1 sm:grid-cols-3 gap-4"
            style={{ transitionDelay: "80ms" }}
          >
            {SPECIALIZATIONS.map((s, i) => (
              <SpecCard
                key={s.label}
                item={s}
                isActive={hoveredSpec === i}
                onEnter={() => setHoveredSpec(i)}
                onLeave={() => setHoveredSpec(null)}
              />
            ))}
          </div>

          {/* ── Row 3: Goal strip ─────────────────────── */}
          <GlassCard className="px-7 md:px-10 py-5">
            <div data-reveal className="reveal flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ transitionDelay: "140ms" }}>
              <div className="flex items-start sm:items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-ink dot-pulse flex-shrink-0 mt-1 sm:mt-0" />
                <p className="text-sm text-muted leading-relaxed max-w-lg">
                  I&apos;m currently looking for{" "}
                  <span className="text-ink font-medium">internship opportunities</span>{" "}
                  where I can grow as a developer, contribute to real projects, and build things that matter.
                </p>
              </div>
              <a
                href="#contact"
                className="flex-shrink-0 inline-flex items-center gap-2 border border-ink px-5 py-2.5 font-medium text-sm text-ink hover:bg-ink hover:text-paper transition-colors duration-200 group"
              >
                <span>Let&apos;s talk</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </a>
            </div>
          </GlassCard>

        </div>
      </section>
    </>
  );
}