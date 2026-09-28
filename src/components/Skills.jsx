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
  { name: "Java", sub: "Programming Language", cat: "Languages", Icon: SiOpenjdk, icon: "Jv" },
  { name: "JavaScript", sub: "Programming Language", cat: "Languages", Icon: SiJavascript, icon: "JS" },
  { name: "TypeScript", sub: "Typed JavaScript", cat: "Languages", Icon: SiTypescript, icon: "TS" },
  { name: "HTML5", sub: "Markup & Structure", cat: "Languages", Icon: SiHtml5, icon: "H" },
  { name: "CSS3 / Modern CSS", sub: "Styling & Layout", cat: "Languages", Icon: SiCss, icon: "C" },
  { name: "Python", sub: "Scripting & Automation", cat: "Languages", Icon: SiPython, icon: "Py" },
  { name: "SQL", sub: "Database Query", cat: "Languages", Icon: Database, icon: "SQL" },
  { name: "MySQL", sub: "Relational Database", cat: "Languages", Icon: SiMysql, icon: "My" },
  { name: "React", sub: "Frontend Development", cat: "Frameworks & UI", Icon: SiReact, icon: "R" },
  { name: "Next.js", sub: "Fullstack Framework", cat: "Frameworks & UI", Icon: SiNextdotjs, icon: "N" },
  { name: "Tailwind CSS", sub: "Utility Framework", cat: "Frameworks & UI", Icon: SiTailwindcss, icon: "Tw" },
  { name: "Node.js", sub: "Backend Development", cat: "Frameworks & UI", Icon: SiNodedotjs, icon: "Nd" },
  { name: "Express", sub: "Backend Framework", cat: "Frameworks & UI", Icon: SiExpress, icon: "Ex" },
  { name: "Supabase", sub: "Backend & Database", cat: "Backend & Data", Icon: SiSupabase, icon: "Sb" },
  { name: "Firebase", sub: "Backend & Database", cat: "Backend & Data", Icon: SiFirebase, icon: "Fb" },
  { name: "PostgreSQL", sub: "Relational Database", cat: "Backend & Data", Icon: SiPostgresql, icon: "Pg" },
  { name: "Git & CI/CD", sub: "Version Control", cat: "Tools & Workflow", Icon: SiGit, icon: "Git" },
  { name: "Figma", sub: "UI/UX Design & Prototyping", cat: "Tools & Workflow", Icon: SiFigma, icon: "F" },
  { name: "Vercel", sub: "Deployment Platform", cat: "Tools & Workflow", Icon: SiVercel, icon: "Vc" },
  { name: "C#", sub: "Programming Language", cat: "Languages", Icon: SiDotnet, icon: "C#" },
  { name: "Unity", sub: "Game Engine & Development", cat: "Tools & Workflow", Icon: SiUnity, icon: "Un" },
];

// Caps the entrance stagger so a large filter (e.g. "All", 19 items) never
// drags the choreography past ~150ms of extra tail latency. Uncapped, 19
// items at 25ms each would push the last card's animation start to ~475ms.
const MAX_STAGGER = 0.15;
const staggerDelay = (i) => Math.min(i * 0.025, MAX_STAGGER);

export default function Skills() {
  const [active, setActive] = useState("All");
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
                className="skill-card group"
                style={{ willChange: "transform, opacity", contain: "layout paint" }}
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
          transition: transform 0.18s cubic-bezier(0.16,1,0.3,1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.25s ease;
          cursor: default;
          -webkit-tap-highlight-color: transparent;
        }
        @media (min-width: 640px) {
          .skill-card { padding: 16px 16px 14px; }
        }
        .skill-card:hover {
          transform: translateY(-3px) translateZ(0);
          background: #ffffff;
          border-color: var(--color-ink);
          box-shadow: 0 12px 28px rgba(0,0,0,0.08);
        }
        /* Sheen sweep — diagonal light pass on hover */
        .skill-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(13,13,13,0.06) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .skill-card:hover::after {
          transform: translateX(120%);
        }
        /* Icon tile inverts to ink, glyph pops */
        .skill-card:hover .skill-icon {
          background: var(--color-ink);
          border-color: var(--color-ink);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .skill-card:hover .skill-icon .skill-brand {
          color: var(--color-paper);
          transform: scale(1.08) rotate(-4deg);
        }
        .theme-dark .skill-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          border-color: rgba(255,255,255,0.08);
          box-shadow: none;
        }
        .theme-dark .skill-card:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 12px 28px rgba(0,0,0,0.45);
        }
        .theme-dark .skill-card::after {
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
        }
        .theme-dark .skill-card:hover .skill-icon {
          background: #ffffff;
          border-color: #ffffff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .theme-dark .skill-card:hover .skill-icon .skill-brand { color: #0d0d0d; }
        .theme-hacker .skill-card:hover {
          border-color: #00ff88;
          box-shadow: 0 12px 28px rgba(0,255,136,0.14);
        }
        .theme-hacker .skill-card::after {
          background: linear-gradient(105deg, transparent 30%, rgba(0,255,136,0.08) 50%, transparent 70%);
        }
        .theme-hacker .skill-card:hover .skill-icon {
          background: #00ff88;
          border-color: #00ff88;
        }
        .theme-hacker .skill-card:hover .skill-icon .skill-brand { color: #010a05; }
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

        /* Icon + glyph transition for the hover invert/pop */
        .skill-icon {
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .skill-icon .skill-brand {
          transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), color 0.2s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .skill-card, .skill-card::after, .skill-icon, .skill-icon .skill-brand, .filter-pill { transition: none !important; }
          .skill-card:hover { transform: none; }
          .skill-card::after { display: none; }
        }
      `}</style>
    </section>
  );
}