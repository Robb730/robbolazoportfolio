import { useState, useEffect, useRef, useCallback } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { ArrowUpRight, Activity, Flame, Trophy, Star, Zap } from "lucide-react";

const USERNAME = "Robb730";

// B&W minimalist scales — ghost (empty) → ink (max), high contrast
const LIGHT_THEME = ["#ececec", "#9a9a9a", "#555555", "#1a1a1a", "#000000"];
const DARK_THEME = ["#2a2a2a", "#5c5c5c", "#8f8f8f", "#d6d6d6", "#ffffff"];
// Hacker/matrix greens — ghost → neon
const HACKER_THEME = ["#0a2e1a", "#0f5a2e", "#1ed760", "#00cc6a", "#00ff88"];

// Dot radius per activity level — quiet days whisper, big days pop.
// Cell pitch is blockSize(12) + blockMargin(4) = 16px, so r=7 max grazes neighbors.
const DOT_R = [1.5, 3, 4.5, 6, 7];

function ContributionDot({ block, level, k }) {
  const p = block?.props || {};
  const w = Number(p.width) || 12;
  const h = Number(p.height) || 12;
  const cx = Number(p.x || 0) + w / 2;
  const cy = Number(p.y || 0) + h / 2;
  return (
    <circle
      key={k}
      cx={cx}
      cy={cy}
      r={DOT_R[level] ?? 2}
      fill={p.fill}
      data-level={level}
      stroke="var(--color-ink)"
      strokeWidth={0.5}
      strokeOpacity={0.3}
    />
  );
}

const pad2 = (n) => String(n).padStart(2, "0");
const fmtLocal = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
function nextDayStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return fmtLocal(new Date(y, m - 1, d + 1));
}
function shortDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function computeStats(data) {
  const days = [...data].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let total = 0;
  let activeDays = 0;
  let best = { count: 0, date: null };
  let longest = 0;
  let run = 0;
  days.forEach((d, i) => {
    const c = d.count || 0;
    total += c;
    if (c > 0) {
      activeDays += 1;
      if (c > best.count) best = { count: c, date: d.date };
      run = i > 0 && (days[i - 1].count || 0) > 0 && nextDayStr(days[i - 1].date) === d.date ? run + 1 : 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  });
  // Current streak: walk back from today (today may simply not be active yet).
  const activeSet = new Set(days.filter((d) => (d.count || 0) > 0).map((d) => d.date));
  const cursor = new Date();
  if (!activeSet.has(fmtLocal(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (activeSet.has(fmtLocal(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { total, activeDays, best, longest, current };
}

function readTheme() {
  if (typeof document === "undefined") return { isDark: false, isHacker: false };
  const cls = document.documentElement.classList;
  return { isDark: cls.contains("theme-dark"), isHacker: cls.contains("theme-hacker") };
}

export default function GitHubContributions() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const { isDark, isHacker } = theme;
  const darkColors = isHacker ? HACKER_THEME : DARK_THEME;

  // Capture the fetched year for the stats strip. Guarded by signature so
  // the setState can't loop (transformData re-runs on every render).
  const [stats, setStats] = useState(null);
  const statsSig = useRef("");
  const transformData = useCallback((data) => {
    try {
      const total = data.reduce((s, d) => s + (d.count || 0), 0);
      const sig = `${data.length}:${total}`;
      if (statsSig.current !== sig) {
        statsSig.current = sig;
        setStats(computeStats(data));
      }
    } catch {}
    return data;
  }, []);

  const renderDot = useCallback(
    (block, activity) => (
      <ContributionDot block={block} level={activity?.level ?? 0} k={activity?.date} />
    ),
    [],
  );
  const renderLegendDot = useCallback(
    (block, level) => <ContributionDot block={block} level={level} k={`legend-${level}`} />,
    [],
  );

  const STATS = [
    { Icon: Zap, label: "Total", value: stats ? String(stats.total) : "—" },
    { Icon: Flame, label: "Day streak", value: stats ? String(stats.current) : "—" },
    { Icon: Trophy, label: "Longest", value: stats ? String(stats.longest) : "—" },
    {
      Icon: Star,
      label: "Best day",
      value: stats ? `${stats.best.count} · ${shortDate(stats.best.date)}` : "—",
    },
  ];

  // Always land on the latest contributions: the calendar paints
  // asynchronously (oldest → latest, left → right), so pin scroll to the
  // right as its nodes arrive. Stops touching scroll once the user takes
  // over or the content settles — never fights manual swipes.
  const wrapRef = useRef(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let userScrolled = false;
    let settled = false;
    const toRight = () => {
      if (userScrolled || settled) return;
      try { el.scrollLeft = el.scrollWidth; } catch {}
    };
    const onScroll = () => {
      // A scroll event we didn't cause (scrollLeft far from max) = user.
      try {
        if (el.scrollLeft < el.scrollWidth - el.clientWidth - 4) userScrolled = true;
      } catch {}
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(toRight);
    const obs = new MutationObserver(toRight);
    obs.observe(el, { childList: true, subtree: true });
    const t = setTimeout(() => {
      try { if (!userScrolled) el.scrollLeft = el.scrollWidth; } catch {}
      settled = true;
    }, 2500);
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      obs.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="group w-full border border-line bg-panel/50 px-4 py-4 hover:border-ink transition-colors">
      {/* header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 inline-flex items-center justify-center border border-line bg-paper text-muted group-hover:bg-ink group-hover:text-paper group-hover:border-ink transition-colors shrink-0">
            <Activity className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">
              Recent activity
            </p>
            <p className="font-display text-sm text-ink truncate">
              github.com/{USERNAME} — last year
            </p>
          </div>
        </div>
        <a
          href={`https://github.com/${USERNAME}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-faint group-hover:text-ink transition-colors shrink-0 border border-line group-hover:border-ink px-3 py-1.5"
          aria-label={`View ${USERNAME} on GitHub`}
        >
          GitHub <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* stats strip */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
        {STATS.map(({ Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 border border-line bg-paper px-3 py-2.5"
          >
            <span className="w-7 h-7 inline-flex items-center justify-center border border-line bg-panel text-muted shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm text-ink leading-none truncate tabular-nums">{value}</p>
              <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-faint mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* calendar — horizontal scroll on small screens, opens on latest */}
      <div
        ref={wrapRef}
        className="gh-cal-wrap mt-4 overflow-x-auto pb-1"
        aria-label={`GitHub contributions for ${USERNAME}`}
      >
        <GitHubCalendar
          username={USERNAME}
          year="last"
          colorScheme={isDark || isHacker ? "dark" : "light"}
          theme={{ light: LIGHT_THEME, dark: darkColors }}
          blockSize={12}
          blockMargin={4}
          fontSize={12}
          showColorLegend
          showMonthLabels
          transformData={transformData}
          renderBlock={renderDot}
          renderColorLegend={renderLegendDot}
          labels={{
            legend: { less: "Less", more: "More" },
          }}
          errorMessage={`Could not load contributions — view on github.com/${USERNAME} →`}
        />
      </div>

      <style>{`
        .gh-cal-wrap { display: flex; justify-content: center; }
        .gh-cal-wrap article { width: max-content; max-width: 100%; margin: 0 auto; }
        .gh-cal-wrap svg { display: block; width: auto; max-width: none; height: auto; }
        .gh-cal-wrap text {
          fill: var(--color-faint) !important;
          font-family: var(--font-mono), monospace !important;
        }
        .gh-cal-wrap [data-testid="total-count"],
        .gh-cal-wrap footer,
        .gh-cal-wrap div:last-child {
          color: var(--color-faint) !important;
          font-family: var(--font-mono), monospace !important;
        }
        @media (max-width: 900px) {
          .gh-cal-wrap { justify-content: flex-start; }
          .gh-cal-wrap article { margin: 0; }
        }
        @media (max-width: 640px) {
          .gh-cal-wrap article { min-width: 620px; }
        }
        .theme-hacker .gh-cal-wrap svg circle {
          filter: drop-shadow(0 0 3px rgba(0,255,136,0.35));
        }
        .theme-hacker .gh-cal-wrap text {
          fill: rgba(0,255,136,0.55) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .gh-cal-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
