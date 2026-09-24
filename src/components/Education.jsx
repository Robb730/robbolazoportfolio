import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  MotionConfig,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, BookOpen, GraduationCap, MapPin, School } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data — chronological top → bottom. `to: null` means still ongoing.  */
/* Years, numbering and durations are derived, so nothing goes stale.  */
/* ------------------------------------------------------------------ */
const EDUCATION = [
  {
    id: "smcb",
    level: "Elementary",
    school: "St. Mary's College of Baliuag",
    location: "Baliuag, Bulacan",
    from: 2011,
    to: 2017,
    icon: BookOpen,
  },
  {
    id: "icsb",
    level: "High School",
    school: "Immaculate Conception School of Baliuag",
    location: "Baliuag, Bulacan",
    from: 2017,
    to: 2023,
    icon: School,
  },
  {
    id: "bsu",
    level: "College",
    school: "Bulacan State University — Bustos Campus",
    location: "Bustos, Bulacan",
    from: 2023,
    to: null,
    icon: GraduationCap,
  },
].map((e, i) => ({
  ...e,
  num: String(i + 1).padStart(2, "0"),
  ongoing: e.to === null,
  years: `${e.from} — ${e.to ?? "Present"}`,
  duration: e.to === null ? "Ongoing" : `${e.to - e.from} yrs`,
}));

const FIRST_ID = EDUCATION[0].id;
const LAST_ID = EDUCATION[EDUCATION.length - 1].id;
const TOTAL_YEARS = new Date().getFullYear() - EDUCATION[0].from;
const RAIL_X = 21; // rail centre = 22px = medallion centre (44px wide)

/* ------------------------------------------------------------------ */
/* Motion variants — module scope so identities are stable            */
/* ------------------------------------------------------------------ */
const EASE = [0.16, 1, 0.3, 1];

const headerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};
const maskV = {
  hidden: { y: "105%" },
  visible: { y: 0, transition: { duration: 0.75, ease: EASE } },
};
const rowV = { hidden: {}, visible: { transition: { staggerChildren: 0.11 } } };
const medalV = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 22 },
  },
};
const cardV = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/* Row — memoised so a scroll-spy change only re-renders 2 of 3 rows  */
/* ------------------------------------------------------------------ */
const EduRow = memo(function EduRow({ edu, state, showPing }) {
  const Icon = edu.icon;
  const raf = useRef(0);

  // Cursor spotlight: writes CSS vars straight to the DOM, no React state.
  const onPointerMove = useCallback((e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const isActive = state === "active";

  return (
    <motion.li
      variants={rowV}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative flex items-stretch gap-3.5 sm:gap-4"
      aria-current={edu.ongoing ? "step" : undefined}
    >
      {/* medallion sits on the rail */}
      <motion.div
        variants={medalV}
        className={`edu-medallion relative z-[2] mt-1 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border is-${state}`}
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {isActive && showPing && <span className="edu-ping absolute inset-0 rounded-full" />}
      </motion.div>

      {/* card */}
      <motion.div variants={cardV} className="min-w-0 flex-1">
        <div className={`edu-lift is-${state}`}>
          <article
            data-edu-id={edu.id}
            onPointerMove={onPointerMove}
            className="edu-card relative overflow-hidden border p-4 text-left sm:p-5"
          >
            <span aria-hidden="true" className="edu-spot" />
            {edu.ongoing && <span aria-hidden="true" className="edu-accent" />}

            <div className="relative z-[1]">
              <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 border border-line bg-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:text-[10px]">
                  <span className="font-semibold text-muted">{edu.num}</span>
                  <span className="h-2.5 w-px bg-line" />
                  {edu.level}
                </span>
                <time className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted sm:text-[10px]">
                  {edu.years}
                </time>
                {edu.ongoing ? (
                  <span className="edu-pill inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]">
                    <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-current" />
                    {edu.duration}
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                    {edu.duration}
                  </span>
                )}
              </div>

              <h3 className="text-balance pr-14 font-display text-[16px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink sm:pr-16 sm:text-[19px]">
                {edu.school}
              </h3>
              <p className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint sm:text-[10px]">
                <MapPin className="h-3 w-3 shrink-0" />
                {edu.location}
              </p>
            </div>

            <span aria-hidden="true" className="edu-ghost">
              {edu.from}
            </span>
            <span aria-hidden="true" className="edu-wipe" />
          </article>
        </div>
      </motion.div>
    </motion.li>
  );
});

/* ------------------------------------------------------------------ */
/* Section                                                            */
/* ------------------------------------------------------------------ */
export default function Education() {
  const railRef = useRef(null);
  const shouldReduce = useReducedMotion();
  const [activeId, setActiveId] = useState(FIRST_ID);

  // Progress is measured against the rail itself so the fill lines up with the cards.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.7", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
    restDelta: 0.0005,
  });
  // The traveller shares the spring with the fill, so the two never drift apart.
  // Percent-based `y` on a full-height wrapper = pure transform, no layout work.
  const travelY = useTransform(progress, [0, 1], ["0%", "100%"]);

  // Snap to the first/last card at the extremes, where the observer band can miss them.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.985) setActiveId(LAST_ID);
    else if (v <= 0.01) setActiveId(FIRST_ID);
  });

  // Scroll-spy: one observer, one thin band across the middle of the viewport.
  useEffect(() => {
    const root = railRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.getAttribute("data-edu-id"));
        }
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );
    root.querySelectorAll("[data-edu-id]").forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const activeIndex = useMemo(
    () => EDUCATION.findIndex((e) => e.id === activeId),
    [activeId],
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="education"
        className="edu-root relative isolate overflow-hidden border-t border-line bg-panel px-5 py-14 sm:px-6 md:px-10 md:py-20"
        aria-labelledby="education-title"
      >
        <style>{CSS}</style>

        {/* dot-grid wash */}
        <div aria-hidden="true" className="edu-grid pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto w-full max-w-3xl">
          {/* header */}
          <motion.header
            variants={headerV}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            className="flex items-end justify-between gap-4"
          >
            <div className="min-w-0">
              <motion.div variants={fadeV} className="mb-2.5 flex items-center gap-3">
                <span className="h-px w-8 bg-ink" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  Education
                </p>
              </motion.div>
              <h2
                id="education-title"
                className="font-display text-[1.7rem] font-semibold leading-[0.95] tracking-[-0.02em] text-ink sm:text-[clamp(1.7rem,4vw,2.4rem)]"
              >
                <span className="block overflow-hidden pb-1">
                  <motion.span variants={maskV} className="block">
                    Where I <span className="font-normal italic">learned.</span>
                  </motion.span>
                </span>
              </h2>
            </div>
            <motion.span
              variants={fadeV}
              className="hidden shrink-0 items-center gap-1.5 border border-line bg-paper px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              {EDUCATION[0].from} — Present
            </motion.span>
          </motion.header>

          {/* timeline */}
          <div ref={railRef} className="relative mt-8 md:mt-10">
            <div
              aria-hidden="true"
              className="edu-rail pointer-events-none absolute bottom-2 top-2 w-[2px]"
              style={{ left: RAIL_X }}
            >
              <div className="edu-track absolute inset-0" />
              <motion.div
                className="edu-fill absolute inset-0 origin-top"
                style={shouldReduce ? undefined : { scaleY: progress }}
              />
            </div>

            {!shouldReduce && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 top-2 w-0"
                style={{ left: RAIL_X + 1 }}
              >
                <motion.div className="h-full" style={{ y: travelY }}>
                  <span className="edu-traveller absolute left-0 top-0 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                </motion.div>
              </div>
            )}

            <ol className="space-y-4 md:space-y-5">
              {EDUCATION.map((edu, i) => (
                <EduRow
                  key={edu.id}
                  edu={edu}
                  state={i === activeIndex ? "active" : i < activeIndex ? "passed" : "upcoming"}
                  showPing={!shouldReduce}
                />
              ))}
            </ol>

            <div className="ml-[58px] mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 sm:ml-[60px]">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint sm:text-[10px]">
                {EDUCATION.length} schools · {TOTAL_YEARS} yrs
              </p>
              <a
                href="#certificates"
                className="edu-link group inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted transition-colors hover:text-ink focus-visible:text-ink sm:text-[11px]"
              >
                View awards
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */
/* Styles — all theming flows through custom properties on .edu-root. */
/* Only transform / opacity / colour are ever transitioned.           */
/* ------------------------------------------------------------------ */
const CSS = `
.edu-root {
  --edu-card: var(--color-paper);
  --edu-border: var(--color-line);
  --edu-accent: var(--color-ink);
  --edu-on-accent: var(--color-paper);
  --edu-muted: var(--color-muted);
  --edu-halo: var(--color-panel);
  --edu-spot: rgba(0,0,0,0.05);
  --edu-glow: rgba(0,0,0,0.35);
  --edu-shadow: 0 18px 40px -14px rgba(0,0,0,0.22);
  --edu-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
.theme-dark .edu-root {
  --edu-spot: rgba(255,255,255,0.06);
  --edu-glow: rgba(255,255,255,0.5);
  --edu-shadow: 0 18px 40px -14px rgba(0,0,0,0.65);
}
.theme-hacker .edu-root {
  --edu-card: #06130e;
  --edu-border: rgba(0,255,136,0.16);
  --edu-accent: #00ff88;
  --edu-on-accent: #010a05;
  --edu-muted: #00cc6a;
  --edu-halo: #010a05;
  --edu-spot: rgba(0,255,136,0.09);
  --edu-glow: rgba(0,255,136,0.7);
  --edu-shadow: 0 18px 40px -14px rgba(0,255,136,0.25);
}

.edu-grid {
  background-image: radial-gradient(circle, var(--color-ghost) 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, #000 30%, transparent 76%);
  mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, #000 30%, transparent 76%);
  opacity: 0.35;
}

/* rail */
.edu-rail {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 36px, #000 calc(100% - 36px), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 36px, #000 calc(100% - 36px), transparent);
}
.edu-track { background: var(--edu-border); }
.edu-fill { background: var(--edu-accent); will-change: transform; }
.edu-traveller {
  background: var(--edu-accent);
  box-shadow: 0 0 0 3px var(--edu-halo), 0 0 12px var(--edu-glow);
}

/* medallion: upcoming → active → passed */
.edu-medallion {
  background: var(--edu-card);
  border-color: var(--edu-border);
  color: var(--edu-muted);
  box-shadow: 0 0 0 4px var(--edu-halo);
  transition: background-color .35s ease, color .35s ease, border-color .35s ease, box-shadow .35s ease;
}
.edu-medallion.is-passed { border-color: var(--edu-accent); color: var(--edu-accent); }
.edu-medallion.is-active {
  background: var(--edu-accent);
  border-color: var(--edu-accent);
  color: var(--edu-on-accent);
  box-shadow: 0 0 0 4px var(--edu-halo), 0 0 18px -2px var(--edu-glow);
}
.edu-ping {
  border: 1px solid var(--edu-accent);
  animation: edu-ping 2.4s var(--edu-ease) infinite;
  pointer-events: none;
}
@keyframes edu-ping {
  0% { transform: scale(1); opacity: .55; }
  70%, 100% { transform: scale(1.55); opacity: 0; }
}

/* card */
.edu-lift { position: relative; transition: transform .4s var(--edu-ease); }
.edu-lift::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  box-shadow: var(--edu-shadow); opacity: 0;
  transition: opacity .4s var(--edu-ease);
}
.edu-lift.is-active::before { opacity: 1; }
.edu-card {
  background: var(--edu-card);
  border-color: var(--edu-border);
  opacity: .7;
  transition: opacity .3s ease, border-color .3s ease;
}
.edu-lift.is-active .edu-card { opacity: 1; border-color: var(--edu-accent); }

@media (hover: hover) and (pointer: fine) {
  .edu-lift:hover { transform: translateY(-2px); }
  .edu-lift:hover::before { opacity: 1; }
  .edu-lift:hover .edu-card { opacity: 1; border-color: var(--edu-accent); }
  .edu-card:hover .edu-spot { opacity: 1; }
}
@media (hover: none) {
  .edu-card:active { opacity: 1; border-color: var(--edu-accent); }
}

/* cursor spotlight (position set from JS via --mx / --my) */
.edu-spot {
  position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), var(--edu-spot), transparent 70%);
  transition: opacity .3s ease;
}

/* status pill for the current stage */
.edu-pill { background: var(--edu-accent); color: var(--edu-on-accent); }
.edu-accent {
  position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--edu-accent);
  transform: scaleY(0); transform-origin: top;
  transition: transform .6s var(--edu-ease);
}
.edu-lift.is-active .edu-accent { transform: scaleY(1); }

/* ghost year drifts into place when its card becomes active */
.edu-ghost {
  position: absolute; right: 6px; top: 50%;
  transform: translate3d(14px, -50%, 0);
  font-family: var(--font-display);
  font-weight: 700; line-height: 1;
  font-size: clamp(2.6rem, 12vw, 3.6rem);
  letter-spacing: -0.05em;
  color: var(--color-ghost);
  opacity: .3;
  pointer-events: none; user-select: none;
  transition: transform .7s var(--edu-ease), opacity .4s ease;
}
.edu-lift.is-active .edu-ghost { transform: translate3d(0, -50%, 0); opacity: .6; }

/* underline wipe */
.edu-wipe {
  position: absolute; bottom: 0; left: 0; height: 1px; width: 100%;
  background: var(--edu-accent);
  transform: scaleX(0); transform-origin: left center;
  transition: transform .5s var(--edu-ease);
}
.edu-lift.is-active .edu-wipe { transform: scaleX(1); }
@media (hover: hover) and (pointer: fine) {
  .edu-card:hover .edu-wipe { transform: scaleX(1); }
}

.edu-link:focus-visible { outline: 1px solid var(--edu-accent); outline-offset: 4px; }

@media (prefers-reduced-motion: reduce) {
  .edu-lift, .edu-lift::before, .edu-card, .edu-medallion, .edu-wipe,
  .edu-ghost, .edu-accent, .edu-spot { transition: none !important; }
  .edu-ping { display: none; }
  .edu-card { opacity: 1 !important; }
  .edu-ghost { transform: translate3d(0, -50%, 0); opacity: .5; }
  .edu-accent { transform: scaleY(1); }
  .edu-fill { transform: none; }
}
`;