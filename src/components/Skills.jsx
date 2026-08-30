import { ArrowUpRight } from "lucide-react";

const GROUPS = [
  {
    label: "Languages",
    items: ["Java", "JavaScript", "TypeScript", "HTML5", "CSS3 / Modern CSS", "Python", "SQL", "MySQL"],
  },
  {
    label: "Frameworks & UI",
    items: ["React", "Next.js", "Tailwind CSS", "Node.js", "Express"],
  },
  {
    label: "Backend & Data",
    items: ["Supabase", "Firebase", "PostgreSQL",],
  },
  {
    label: "Tools & Workflow",
    items: ["Git & CI/CD", "Figma", "Vercel"],
  },
];

export default function Skills() {
  return (
    <section
      id="skills"
      className="relative min-h-[100dvh] flex flex-col justify-center py-16 md:py-24 lg:py-32 px-6 md:px-10 border-t border-line bg-paper"
    >
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div data-reveal className="reveal mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-px bg-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faint">Skills</p>
          </div>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl text-ink">
            Tools I reach for.
          </h2>
        </div>

        {/* Groups */}
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10 md:gap-x-14 lg:gap-x-20">
          {GROUPS.map((group, i) => (
            <div
              key={group.label}
              data-reveal
              className="reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-baseline justify-between mb-1 pb-2 border-b border-line">
                <h3 className="font-mono text-xs tracking-[0.15em] uppercase text-faint">
                  {group.label}
                </h3>
                <span className="font-mono text-[10px] text-faint tabular-nums">
                  {String(group.items.length).padStart(2, "0")}
                </span>
              </div>
              <ul>
                {group.items.map((skill) => (
                  <li key={skill} className="skill-item" tabIndex={0}>
                    <span className="skill-fill" aria-hidden="true" />
                    <span className="skill-name">{skill}</span>
                    <ArrowUpRight className="skill-mark w-4 h-4" strokeWidth={2} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .skill-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 10px;
          border-top: 1px solid var(--color-line);
          border-radius: 8px;
          color: var(--color-ink);
          cursor: default;
          outline: none;
          isolation: isolate;
          contain: layout paint;
          transform: translateZ(0);
        }
        .skill-item:first-child { border-top: none; }

        /* background is a separate scaled layer -> GPU compositing only, no repaint of the row.
           will-change is permanent (not hover-toggled): with ~23 rows total, keeping these
           layers resident costs little GPU memory but avoids promoting/destroying a layer on
           every single mouseenter/mouseleave, which is what causes stutter on fast hovers. */
        .skill-fill {
          position: absolute;
          inset: 0;
          background: var(--color-ink);
          border-radius: inherit;
          transform: scaleX(0);
          transform-origin: left center;
          opacity: 0;
          z-index: 0;
          will-change: transform, opacity;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .skill-name,
        .skill-mark {
          position: relative;
          z-index: 1;
        }

        .skill-name {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: -0.01em;
          transform: translateX(0);
          will-change: transform, color;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skill-mark {
          opacity: 0;
          transform: translate(-4px, 4px);
          flex-shrink: 0;
          will-change: transform, opacity, color;
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skill-item:hover .skill-fill,
        .skill-item:focus-visible .skill-fill {
          transform: scaleX(1);
          opacity: 1;
        }
        .skill-item:hover .skill-name,
        .skill-item:focus-visible .skill-name {
          color: var(--color-paper);
          transform: translateX(6px);
        }
        .skill-item:hover .skill-mark,
        .skill-item:focus-visible .skill-mark {
          color: var(--color-paper);
          opacity: 1;
          transform: translate(0, 0);
        }

        @media (prefers-reduced-motion: reduce) {
          .skill-item, .skill-fill, .skill-name, .skill-mark { transition: none !important; }
        }
      `}</style>
    </section>
  );
}