import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Database } from "lucide-react";
import {
  SiCss,
  SiDotnet,
  SiExpress,
  SiFigma,
  SiFirebase,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenjdk,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiUnity,
  SiVercel,
} from "react-icons/si";

const FILTERS = ["All", "Languages", "Frameworks & UI", "Backend & Data", "Tools & Workflow"];

// Brand vector logos (Simple Icons via react-icons, monochrome via CSS).
// Java → OpenJDK and C# → .NET: those brand marks were removed from
// Simple Icons upstream, so these are the sanctioned/ecosystem replacements.
// SQL has no brand mark — lucide Database fallback. `icon` monogram is kept
// as a last-resort fallback if an Icon is ever missing.
const SKILLS = [
  { name: "Java", sub: "Programming Language", level: 85, cat: "Languages", Icon: SiOpenjdk, icon: "Jv" },
  { name: "JavaScript", sub: "Programming Language", level: 78, cat: "Languages", Icon: SiJavascript, icon: "JS" },
  { name: "TypeScript", sub: "Typed JavaScript", level: 72, cat: "Languages", Icon: SiTypescript, icon: "TS" },
  { name: "HTML5", sub: "Markup & Structure", level: 82, cat: "Languages", Icon: SiHtml5, icon: "H" },
  { name: "CSS3 / Modern CSS", sub: "Styling & Layout", level: 80, cat: "Languages", Icon: SiCss, icon: "C" },
  { name: "Python", sub: "Scripting & Automation", level: 68, cat: "Languages", Icon: SiPython, icon: "Py" },
  { name: "SQL", sub: "Database Query", level: 52, cat: "Languages", Icon: Database, icon: "SQL" },
  { name: "MySQL", sub: "Relational Database", level: 55, cat: "Languages", Icon: SiMysql, icon: "My" },
  { name: "React", sub: "Frontend Development", level: 78, cat: "Frameworks & UI", Icon: SiReact, icon: "R" },
  { name: "Next.js", sub: "Fullstack Framework", level: 70, cat: "Frameworks & UI", Icon: SiNextdotjs, icon: "N" },
  { name: "Tailwind CSS", sub: "Utility Framework", level: 84, cat: "Frameworks & UI", Icon: SiTailwindcss, icon: "Tw" },
  { name: "Node.js", sub: "Backend Development", level: 74, cat: "Frameworks & UI", Icon: SiNodedotjs, icon: "Nd" },
  { name: "Express", sub: "Backend Framework", level: 70, cat: "Frameworks & UI", Icon: SiExpress, icon: "Ex" },
  { name: "Supabase", sub: "Backend & Database", level: 80, cat: "Backend & Data", Icon: SiSupabase, icon: "Sb" },
  { name: "Firebase", sub: "Backend & Database", level: 76, cat: "Backend & Data", Icon: SiFirebase, icon: "Fb" },
  { name: "PostgreSQL", sub: "Relational Database", level: 82, cat: "Backend & Data", Icon: SiPostgresql, icon: "Pg" },
  { name: "Git & CI/CD", sub: "Version Control", level: 74, cat: "Tools & Workflow", Icon: SiGit, icon: "Git" },
  { name: "Figma", sub: "UI/UX Design & Prototyping", level: 68, cat: "Tools & Workflow", Icon: SiFigma, icon: "F" },
  { name: "Vercel", sub: "Deployment Platform", level: 70, cat: "Tools & Workflow", Icon: SiVercel, icon: "Vc" },
  { name: "C#", sub: "Programming Language", level: 72, cat: "Languages", Icon: SiDotnet, icon: "C#" },
  { name: "Unity", sub: "Game Engine & Development", level: 70, cat: "Tools & Workflow", Icon: SiUnity, icon: "Un" },
];

// Caps the entrance stagger so a large filter (e.g. "All", 19 items) never
// drags the choreography past ~150ms of extra tail latency. Uncapped, 19
// items at 25ms each would push the last card's animation start to ~475ms.
const MAX_STAGGER = 0.15;
const staggerDelay = (i) => Math.min(i * 0.025, MAX_STAGGER);

export default function Skills() {
  const [active, setActive] = useState("All");
  const [openSkill, setOpenSkill] = useState(null);
  const shouldReduce = useReducedMotion();

  const filtered = useMemo(() => {
    if (active === "All") return SKILLS;
    return SKILLS.filter((s) => s.cat === active);
  }, [active]);

  // Scroll reveal — one IntersectionObserver-driven trigger (via whileInView)
  // for the whole section, with the header, filter row and card grid
  // staggered as its three children. Runs identically on touch and pointer
  // devices since it's viewport-based, not hover-based, and fires once.
  const sectionReveal = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.1 } },
  };
  const itemReveal = {
    hidden: shouldReduce ? { opacity: 1 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduce ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="skills"
      className="relative overflow-hidden border-t border-line bg-paper py-16 md:py-20 lg:py-24 px-6 md:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-ghost) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 70% 45% at 50% 0%, black 28%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 45% at 50% 0%, black 28%, transparent 78%)",
          opacity: 0.52,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(900px 420px at 18% 8%, rgba(0,0,0,0.04) 0%, transparent 62%), radial-gradient(700px 360px at 88% 92%, rgba(0,0,0,0.03) 0%, transparent 62%)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-6xl mx-auto w-full"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 md:gap-8 mb-8 md:mb-10">
          <motion.div variants={itemReveal} className="max-w-[360px] shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-ink" />
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-faint">My Skills</p>
            </div>
            <h2 className="font-display font-semibold text-[22px] sm:text-3xl lg:text-[32px] leading-[1.05] tracking-[-0.02em] text-ink">
              Tools & Technologies
              <span className="block font-normal italic">I Work With</span>
            </h2>
            <p className="text-muted text-[13px] sm:text-sm leading-relaxed mt-2 sm:mt-3 max-w-xl">
              A collection of tools, frameworks and technologies I use to build modern, high-quality digital experiences.
            </p>
          </motion.div>

          <motion.div
            variants={itemReveal}
            className="relative flex flex-wrap items-center gap-1.5 sm:gap-2 lg:justify-end lg:max-w-[420px] lg:pt-2"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`filter-pill relative font-mono text-[10px] sm:text-[11px] tracking-[0.06em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border transition-colors duration-200 ${
                  active === f ? "is-active" : ""
                }`}
                aria-pressed={active === f}
              >
                {active === f && (
                  <motion.span
                    layoutId="filter-pill-bg"
                    className="filter-pill-bg absolute inset-0 rounded-full"
                    style={{ zIndex: 0 }}
                    transition={
                      shouldReduce
                        ? { duration: 0.01 }
                        : { type: "spring", stiffness: 500, damping: 38, mass: 0.5 }
                    }
                  />
                )}
                <span className="relative z-10">{f}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          layout
          variants={itemReveal}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((skill, i) => (
              <motion.article
                key={skill.name}
                layout="position"
                initial={shouldReduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                transition={
                  shouldReduce
                    ? { duration: 0.01 }
                    : {
                        duration: 0.24,
                        ease: [0.16, 1, 0.3, 1],
                        delay: staggerDelay(i),
                        layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                      }
                }
                className={`skill-card group ${openSkill === skill.name ? "is-open" : ""}`}
                style={{ willChange: "transform, opacity", contain: "layout paint" }}
                tabIndex={0}
                onClick={() => {
                  // touch: tap toggles mastery persistently; desktop hover already works via CSS
                  setOpenSkill((prev) => (prev === skill.name ? null : skill.name));
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOpenSkill((prev) => (prev === skill.name ? null : prev));
                  }
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="skill-icon shrink-0" aria-hidden="true">
                    {skill.Icon ? (
                      <skill.Icon className="skill-brand" />
                    ) : (
                      <span className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-[-0.02em] text-ink">
                        {skill.icon}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] sm:text-[13px] font-medium tracking-[-0.01em] text-ink leading-none truncate">
                      {skill.name}
                    </h3>
                    <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.04em] text-muted leading-none mt-1 truncate">
                      {skill.sub}
                    </p>
                  </div>
                  <span className="skill-cat font-mono text-[9px] tracking-[0.08em] uppercase text-faint/60 hidden sm:inline-flex shrink-0 border border-line/70 rounded-full px-2 py-1 bg-panel/50">
                    {skill.cat === "Frameworks & UI" ? "FW/UI" : skill.cat === "Backend & Data" ? "Backend" : skill.cat === "Tools & Workflow" ? "Tools" : skill.cat}
                  </span>
                </div>

                <div className="skill-mastery-wrap">
                  <div className="skill-mastery">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-faint/70">Mastery</span>
                      <span className="skill-pct font-mono text-[11px] tabular-nums text-faint">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="skill-track" aria-hidden="true">
                      <span className="skill-track-fill" style={{ width: `${skill.level}%` }} />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="font-mono text-xs text-muted text-center py-10 border border-dashed border-line rounded-xl mt-4">
            No skills in this filter — try another.
          </p>
        )}
      </motion.div>

      <style>{`
        .filter-pill {
          background: rgba(255, 255, 255, 0.62);
          border-color: var(--color-line);
          color: var(--color-muted);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          contain: layout paint;
        }
        .filter-pill:hover {
          background: #ffffff;
          border-color: var(--color-line);
          color: var(--color-ink);
        }
        .filter-pill.is-active {
          border-color: var(--color-ink);
          color: var(--color-paper);
        }
        .filter-pill-bg {
          background: var(--color-ink);
          box-shadow: 0 4px 14px rgba(0,0,0,0.10);
          will-change: transform;
        }
        .theme-dark .filter-pill {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.08);
          color: #a3a3a3;
        }
        .theme-dark .filter-pill:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.14);
          color: #ffffff;
        }
        .theme-dark .filter-pill.is-active {
          border-color: #ffffff;
          color: #0d0d0d;
        }
        .theme-dark .filter-pill-bg { background: #ffffff; }
        .theme-hacker .filter-pill {
          background: rgba(0,255,136,0.06);
          border-color: rgba(0,255,136,0.14);
          color: #00cc6a;
        }
        .theme-hacker .filter-pill:hover,
        .theme-hacker .filter-pill.is-active {
          border-color: #00ff88;
          color: #010a05;
        }
        .theme-hacker .filter-pill-bg { background: #00ff88; }

        .skill-card {
          position: relative;
          padding: 12px 12px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          border: 1px solid var(--color-line);
          box-shadow: none;
          overflow: hidden;
          contain: layout paint;
          transform: translateZ(0);
          backface-visibility: hidden;
          transition: transform 0.18s cubic-bezier(0.16,1,0.3,1), background 0.18s ease, border-color 0.18s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        @media (min-width: 640px) {
          .skill-card { padding: 16px 16px 14px; }
        }
        .skill-card:hover,
        .skill-card.is-open {
          transform: translateY(-2px) translateZ(0);
          background: #ffffff;
          border-color: var(--color-line);
        }
        .theme-dark .skill-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          border-color: rgba(255,255,255,0.08);
          box-shadow: none;
        }
        .theme-dark .skill-card:hover,
        .theme-dark .skill-card.is-open {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255,255,255,0.14);
        }
        .theme-hacker .skill-card {
          background: rgba(6, 22, 13, 0.48);
          border-color: rgba(0,255,136,0.16);
          box-shadow: 0 8px 32px rgba(0,255,136,0.08), inset 0 1px 0 rgba(0,255,136,0.12);
        }
        .skill-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.74);
          border: 1px solid var(--color-line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
        }
        @media (min-width: 640px) {
          .skill-icon { width: 36px; height: 36px; border-radius: 10px; }
        }
        .theme-dark .skill-icon {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .theme-dark .skill-icon span { color: rgba(255,255,255,0.88) !important; }
        .theme-hacker .skill-icon { background: rgba(0,255,136,0.06); border-color: rgba(0,255,136,0.14); }
        .theme-hacker .skill-icon span { color: #00cc6a !important; }
        /* Brand vector logos — uniform monochrome, inherits theme ink */
        .skill-icon .skill-brand {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          color: var(--color-ink);
        }
        @media (min-width: 640px) {
          .skill-icon .skill-brand { width: 19px; height: 19px; }
        }
        .theme-dark .skill-icon .skill-brand { color: rgba(255,255,255,0.88); }
        .theme-hacker .skill-icon .skill-brand { color: #00cc6a; }

        /*
          ── Hover-only mastery reveal ──
          Deliberately NOT animating grid-template-rows here. Animating a
          grid track size forces the browser to re-run the grid sizing
          algorithm on every frame — a real layout recalculation, not a
          compositor-only op. Combined with backdrop-filter (which already
          forces its own expensive, content-dependent compositing layer),
          that combo is what was capping this at ~30fps.
          Instead: one fixed-height max-height transition (cheap block
          reflow, no grid algorithm) + opacity, on ONE element. Everything
          inside just rides along via that single parent's opacity — no
          separate transform/opacity transitions per child, so the browser
          isn't juggling five simultaneous animated properties per card.
        */
        .skill-mastery-wrap {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.16s ease;
        }
        .skill-mastery {
          padding-top: 12px;
        }
        .skill-card:hover .skill-mastery-wrap,
        .skill-card:focus-within .skill-mastery-wrap,
        .skill-card.is-open .skill-mastery-wrap {
          max-height: 44px;
          opacity: 1;
        }
        /* will-change scoped to the hover moment only — an idle card (there
           can be up to 19 on screen at once) no longer sits at rest with
           permanently GPU-promoted layers it isn't using. */
        .skill-card:hover .skill-mastery-wrap,
        .skill-card:focus-within .skill-mastery-wrap,
        .skill-card.is-open .skill-mastery-wrap,
        .skill-card:hover .skill-track-fill,
        .skill-card:focus-within .skill-track-fill,
        .skill-card.is-open .skill-track-fill {
          will-change: transform, opacity, max-height;
        }
        .skill-pct {
          font-variant-numeric: tabular-nums;
        }
        .skill-track {
          height: 3px;
          border-radius: 9999px;
          background: var(--color-ghost);
          overflow: hidden;
        }
        .theme-dark .skill-track { background: rgba(255,255,255,0.08); }
        .theme-hacker .skill-track { background: rgba(0,255,136,0.10); }
        .skill-track-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--color-ink);
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .theme-dark .skill-track-fill { background: #ffffff; }
        .theme-hacker .skill-track-fill { background: #00ff88; }
        .skill-card:hover .skill-track-fill,
        .skill-card:focus-within .skill-track-fill,
        .skill-card.is-open .skill-track-fill {
          transform: scaleX(1);
        }
        /* Mobile — tap toggles via .is-open, not hover */
        @media (hover: none) {
          .skill-mastery-wrap { max-height: 0; opacity: 0; }
          .skill-card.is-open .skill-mastery-wrap { max-height: 44px; opacity: 1; }
          .skill-track-fill { transform: scaleX(0); }
          .skill-card.is-open .skill-track-fill { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .skill-card, .skill-mastery-wrap, .skill-track-fill, .filter-pill { transition: none !important; }
          .skill-mastery-wrap { max-height: 44px !important; opacity: 1 !important; }
          .skill-track-fill { transform: scaleX(1) !important; }
        }
      `}</style>
    </section>
  );
}