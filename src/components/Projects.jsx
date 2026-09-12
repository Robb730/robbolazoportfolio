import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, memo } from "react";
import {
  ArrowUpRight,
  X,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Image as ImageIcon,
} from "lucide-react";
import useReveal from "./../hooks/useReveal";
import useTilt from "../hooks/useTilt";

const PROJECTS = [
  {
   id: "optical",
   number: "01",
   title: "Optical Clinic Appointment and E-Commerce System",
   category: "Commerce",
   year: "2025",
   role: "Full-Stack",

   description:
     "An appointment scheduling and e-commerce system for Adlaon Optical, allowing customers to book appointments, browse and purchase eyeglass frames, and track their orders.",

   longDescription:
     "A web-based system developed for Adlaon Optical that combines appointment scheduling with an online storefront. Customers can book and manage appointments, browse available eyeglass frames, place orders, and track their order status. Administrators can manage appointments, products, customers, and orders while monitoring sales through an admin dashboard.",

   tags: ["HTML5", "CSS", "JavaScript", "PHP", "MySQL"],

   href: null, // private — not on public GitHub

   mock: "commerce",

   image: "/systems/adlaon-web.png",

   highlights: [
     "Appointment scheduling",
     "Eyeglass e-commerce",
     "Order tracking",
     "Admin sales dashboard",
   ],
 },

{
  id: "kubohub",
  number: "02",
  title: "KuboHub",
  category: "Platform",
  year: "2025",
  role: "Full-Stack",

  description:
    "A booking platform where guests can browse and book listings, leave ratings, and manage their stays, while hosts manage listings, bookings, earnings, and statistics.",

  longDescription:
    "A multi-role booking platform connecting guests, hosts, and administrators. Guests can browse available listings, make bookings, and rate their experiences after their stay. Hosts can create and manage listings, monitor bookings, view earnings and statistics, and track which listings receive the most bookings. Administrators have centralized access to oversee users, listings, bookings, and transactions, with PayPal integrated for payment processing and host checkout management.",

  tags: ["React", "Node.js", "Tailwind CSS", "JavaScript", "Firebase", "PayPal"],

   href: "https://github.com/Robb730/kubohub",
   liveUrl: "https://kubohub.web.app",

   mock: "marketplace",

   image: "/systems/kubohub.png",

  highlights: [
    "Guest and host management",
    "Listing and booking system",
    "Earnings and analytics",
    "PayPal integration",
  ],
},

{
  id: "brewtiful",
  number: "03",
  title: "Brewtiful-U Advanced POS System",
  category: "Systems",
  year: "2026",
  role: "Systems / Desktop / Full-Stack",

  description:
    "An advanced desktop POS system for Brewtiful-U's salon and café operations, featuring sales analytics, inventory, bookings, technician commissions, vouchers, and thermal receipt printing.",

  longDescription:
    "A desktop-based POS and business management system built for Brewtiful-U, combining salon services and café sales in one application. The system handles product sales, service transactions, inventory tracking, customer records, bookings, vouchers, and technician commissions. Staff can monitor sales, profit, cash collected, popular products, and other business statistics through the dashboard. It also supports thermal receipt printing and uses a local SQLite database for offline operation, with Supabase used for connected data and synchronization.",

  tags: [
    "React",
    "Vite",
    "Tailwind CSS",
    "Electron",
    "Supabase",
    "SQLite",
    "Node.js",
  ],

  href: null, // private — not on public GitHub

   mock: "pos",

   image: "/systems/brewtiful-u-pos.png",

  highlights: [
    "Offline-first POS",
    "Salon + café management",
    "Inventory and commissions",
    "Thermal receipt printing",
  ],
},

{
  id: "brewtiful-2",
  number: "04",
  title: "Brewtiful-U Web Booking System",
  category: "Booking",
  year: "2026",
  role: "Full-Stack",

  description:
    "A web-based booking system for Brewtiful-U that allows admins to create reservations, manage customers and services, and automatically sync bookings with the POS system.",

  longDescription:
    "A separate web application developed for Brewtiful-U to manage customer bookings and reservations. Admins can create reservations by entering new customer information or selecting existing customers, choosing requested services, and specifying reservation dates. Bookings are sent through Supabase and automatically synchronized with the Brewtiful-U desktop POS, allowing staff to view and manage reservations directly within the POS system.",

  tags: ["React", "Vite", "Tailwind CSS", "Supabase"],

  href: "https://github.com/Robb730/brewtiful-u-booking",

  mock: "analytics",

  image: "/systems/brewtiful-u-web.png",

  highlights: [
    "Reservation management",
    "Customer and service selection",
    "POS synchronization",
    "Supabase integration",
  ],
},
  {
    id: "abella",
    number: "05",
    title: "Dry Goods Sales, Inventory, and Order Management System",
    category: "Sales & Inventory",
    year: "2026",
    role: "Full-Stack",

    description:
      "A desktop-based sales and order management system for a dry goods business, featuring product and customer management, customer-specific pricing, sales and profit tracking, order and delivery management, and thermal receipt printing. It also connects with a web-based ordering system through Supabase for real-time order updates.",

    longDescription:
      "A desktop-based sales and order management system developed for a dry goods business. The system manages products with different sizes and prices, customer-specific price levels, sales transactions, orders, and deliveries. It includes a dashboard for monitoring sales, cash collected, and profit based on selected dates. The system also supports thermal receipt printing and a Quick Sale feature for faster transactions. A separate web-based ordering application is connected through Supabase, allowing orders and delivery status updates to be synchronized between the two systems.",

  tags: ["React", "Vite", "Tailwind CSS", "Electron", "SQLite", "Supabase"],

     href: null, // private — not on public GitHub

     mock: "analytics",

    image: null, // desktop screenshot coming soon — user will follow up

    highlights: [
      "Customer-specific pricing",
      "Sales and profit tracking",
      "Order and delivery management",
      "Thermal receipt printing",
      "Web-based order synchronization",
    ],
  },
  {
    id: "abella-web",
    number: "06",
    title: "Web-Based Order and Customer Management System",
    category: "Order Management",
    year: "2026",
    role: "Full-Stack",

    description:
      "A web-based ordering and customer management system that allows staff to create orders, manage deliveries, track customer balances, and record payments.",

    longDescription:
      "A web-based order and customer management system developed for a dry goods business and connected to its desktop sales system through Supabase. Staff can create and manage customer orders, update order statuses, and track deliveries. The system also provides customer account management, allowing staff to view balances, record payments, monitor remaining amounts, and review transaction history. Order and payment updates are synchronized with the desktop application for streamlined sales and delivery management.",

    tags: ["React", "Vite", "Tailwind CSS", "Supabase"],

    href: "https://github.com/Robb730/abella-web",

    mock: "analytics",

    image: "/systems/dry-goods-web.png",

    highlights: [
      "Order management",
      "Customer balance tracking",
      "Payment recording",
      "Transaction history",
      "Real-time synchronization",
    ],
  },
  {
    id: "onedata",
    number: "07",
    title: "OneData",
    category: "Data Management & Analytics",
    year: "2026",
    role: "Full-Stack",

    description:
      "A centralized Education Data Management and Analytics Platform for DepEd – Schools Division of City of Baliwag, unifying structured data, file management, role-based access, and real-time dashboards into one secure system.",

    longDescription:
      "OneData is a centralized web-based Education Data Management and Analytics Platform developed for the DepEd – Schools Division of City of Baliwag. It replaces fragmented spreadsheets and file-based workflows with a unified, audited system for managing educational and operational data. The platform supports four role-based user levels — administrator, division focal person, section focal person, and section personnel — with access automatically scoped according to divisions and sections. Users can upload and manage documents through a structured repository with search, filtering, pagination, bulk operations, verification, feedback, and multi-level access request workflows. Excel files can be uploaded through a validated ingestion pipeline that parses multiple structured data categories and synchronizes the information into Supabase database tables. This data powers an interactive analytics dashboard featuring enrollment trends, dropout and promotion rates, cohort analysis, teacher and classroom resources, textbook shortages, CESPES results, performance indicators, and school-year comparisons. The system also includes audit logging, security controls, real-time notifications, verified PDF generation, school-year lifecycle management, user administration, and responsive mobile navigation, providing the division with a centralized and accountable platform for education data management.",

    tags: ["React.js", "Tailwind CSS", "Supabase"],

    href: "https://github.com/Robb730/onedata",
    liveUrl: "https://onedata-baliwag.com",

    mock: "dashboard",

    image: "/systems/onedata.png",

    highlights: [
      "4-tier role-based access control",
      "Structured Excel data ingestion",
      "Interactive analytics dashboards",
      "Secure file repository & workflows",
      "Audit logs & security controls",
      "Real-time notifications",
      "Verified PDF generation",
      "School-year data management",
    ],
  },
  {
    id: "mind-over-matter",
    number: "08",
    title: "Mind Over Matter",
    category: "Game Development",
    year: "2026",
    role: "Game Developer",

    description:
      "A 2D fighting game where history's greatest scientists — Einstein, Tesla, Galileo, Charles Darwin and more — battle with abilities rooted in their real theories and discoveries.",

    longDescription:
      "What if history's greatest minds didn't just change the world with their ideas — but fought for it? That's the question that started Mind Over Matter. We built this game because we believed science shouldn't be locked away in textbooks, delivered in dry lectures, or reduced to a formula on a chalkboard. Einstein's theory of relativity, Tesla's electromagnetic mastery, Newton's command over gravity, Darwin's law of evolution — these aren't just academic concepts. They are forces of nature that literally reshaped how humanity understands existence itself. We wanted to tear those ideas off the page, hand them to players, and let them feel what it truly means to weaponize knowledge — to experience science as something visceral, electric, and alive. But here's where it gets interesting — this isn't just a game about who hits harder. Every scientist's abilities are directly rooted in their real discoveries, and those discoveries carry their own natural strengths, weaknesses, and counters. Darwin's Survival of the Fittest means he evolves mid-fight, growing deadlier the longer the battle drags on — punishing impatience and rewarding pressure. Tesla's electrical chains devastate at range but leave him dangerously exposed up close. Oppenheimer's nuclear output is catastrophic, yet its very power demands precision and timing. The arena becomes a living argument between theories — a place where history's greatest intellectual rivalries are finally resolved not by reputation or legacy, but by combat, strategy, and mastery of science itself.",

    tags: ["Unity", "C#", "Game Development"],

    href: null,

    liveUrl: "https://mind-over-matter-gd.vercel.app/?fbclid=IwY2xjawUSNz5wZG9mBWV4dG4DYWVtAjEwAGJyaWQRMXNhUnJJVjRLcDE5WEpYZUVzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEeRrAbsXVEK0RrzAkQ_FjZ51KbOxKTUm06qApZf_pIWckcyU51uuTVT2EVgyw_aem_Sfys4tktIXe6Tj6mOb1G1g",

    mock: "game",

    image: "/systems/mind-over-matter.png",

    highlights: [
      "2D science-based fighting",
      "Scientists as fighters (Einstein, Tesla, Darwin…)",
      "Abilities rooted in real theories",
      "Theory counters & matchups",
      "Built with Unity & C#",
    ],
  },
];

/* ── Sort comparator — module-level so it isn't recreated every render ── */
function compareProjects(a, b, sortOrder) {
  const yA = parseInt(a.year, 10) || 0;
  const yB = parseInt(b.year, 10) || 0;
  const nA = parseInt(a.number, 10) || 0;
  const nB = parseInt(b.number, 10) || 0;
  if (yA !== yB) return sortOrder === "latest" ? yB - yA : yA - yB;
  return sortOrder === "latest" ? nB - nA : nA - nB;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ── Preview media, memoized: only re-renders when its own project/isActive change ── */
const ProjectPreview = memo(function ProjectPreview({ project, isActive }) {
  const hasImage = !!project.image;
  return (
    <div className="relative aspect-[16/10] sm:aspect-[16/10] overflow-hidden border-b border-line bg-panel">
      {hasImage ? (
        <>
          <img
            src={project.image}
            alt={`${project.title} — screenshot`}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] select-none"
            style={{ WebkitUserDrag: "none", WebkitTouchCallout: "none" }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-60" />
          <span
            aria-hidden="true"
            className="absolute -right-2 -bottom-5 sm:-bottom-6 font-display font-bold leading-none select-none pointer-events-none transition-colors duration-300"
            style={{
              fontSize: "clamp(4.5rem, 18vw, 7.5rem)",
              color: "white",
              opacity: isActive ? 0.14 : 0.08,
              letterSpacing: "-0.06em",
            }}
          >
            {project.number}
          </span>
        </>
      ) : (
        <>
          <div className="absolute inset-0 placeholder-pattern opacity-[0.55]" />
          <span
            aria-hidden="true"
            className="absolute -right-2 -bottom-5 sm:-bottom-6 font-display font-bold leading-none select-none pointer-events-none transition-colors duration-300"
            style={{
              fontSize: "clamp(4.5rem, 18vw, 7.5rem)",
              color: isActive ? "var(--color-ink)" : "var(--color-ghost)",
              opacity: isActive ? 0.08 : 0.55,
              letterSpacing: "-0.06em",
            }}
          >
            {project.number}
          </span>
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pt-10">
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.04em] text-muted/80 text-center max-w-[20ch] sm:max-w-[22ch] leading-relaxed">
              {project.title}
            </p>
          </div>
        </>
      )}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-line/70 bg-paper/70 backdrop-blur-[6px]">
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-faint">
          {project.year} — {project.category}
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted hidden sm:inline">
          {project.role}
        </span>
      </div>
      {/* View pill — always visible on mobile, hover-only on desktop */}
      <div
        className={`absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 transition-all duration-300
          opacity-100 translate-y-0
          sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0
          ${isActive ? "sm:!opacity-100 sm:!translate-y-0" : ""}`}
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-[0.12em] uppercase bg-ink text-paper px-2.5 sm:px-3 py-1.5 border border-ink">
          View <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
});

/* ── Tilt wrapper — B&W minimalist, desktop only ───────────
   Subtle 3D tilt + monochrome glare that follows cursor.
   Disabled on mobile / reduced-motion / hover:none by the hook. */
function TiltCard({ children, onHoverChange }) {
  const { ref, glareRef, onMove, onEnter, onLeave } = useTilt({ max: 6, scale: 1.015 });
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        onMove(e);
        onHoverChange?.(true);
      }}
      onMouseEnter={() => {
        onEnter();
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        onLeave();
        onHoverChange?.(false);
      }}
      className="tilt-wrap relative will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        ref={glareRef}
        aria-hidden="true"
        className="tilt-glare pointer-events-none absolute inset-0 rounded-none opacity-0 transition-opacity duration-300"
        style={{ zIndex: 2, mixBlendMode: "overlay" }}
      />
      {children}
    </div>
  );
}

/* ─── Detail-view media ─────────────────────────────────────────
    Shows the real landscape screenshot (project.image) once it's
    attached, with a shimmer while it loads and a soft fade/scale-in
    when ready. Until then, shows a plain placeholder — no mock UI. */
const ProjectMedia = memo(function ProjectMedia({ project }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [project.image]);

  if (!project.image) {
    return (
      <div className="absolute inset-0 bg-panel flex flex-col items-center justify-center gap-2.5">
        <div className="w-11 h-11 rounded-full border border-line bg-paper flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-faint" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">
          Screenshot coming soon
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-panel">
      {!loaded && (
        <div className="absolute inset-0 media-shimmer" aria-hidden="true" />
      )}
      <img
        src={project.image}
        alt={`${project.title} — product screenshot`}
        loading="eager"
        decoding="async"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onLoad={() => setLoaded(true)}
        className="media-img w-full h-full object-cover select-none"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "scale(1)" : "scale(1.035)",
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
        }}
      />
    </div>
  );
});

export default function Projects() {
  const [view, setView] = useState("grid");
  const [hoveredId, setHoveredId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");

  useEffect(() => setHoveredId(null), [view]);
  const [closing, setClosing] = useState(false);

  const closeTimerRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // FLIP-animation bookkeeping for the latest/oldest sort toggle.
  // cardRefs: project id -> card DOM node (grid article or list row).
  // prevRectsRef: bounding rects captured right before the sort changes.
  const cardRefs = useRef(new Map());
  const prevRectsRef = useRef(new Map());

  // useReveal now watches the DOM for newly-added [data-reveal] nodes
  // (via MutationObserver), so cards added after a grid/list toggle,
  // filter, or pagination change get observed and fade in correctly.
  const revealScopeRef = useReveal();

  const sortedProjects = useMemo(() => {
    return [...PROJECTS].sort((a, b) => compareProjects(a, b, sortOrder));
  }, [sortOrder]);

  const selectedProject = useMemo(
    () => PROJECTS.find((p) => p.id === selected) || null,
    [selected],
  );
  const selectedIndex = useMemo(
    () => (selected ? sortedProjects.findIndex((p) => p.id === selected) : -1),
    [selected, sortedProjects],
  );

  const setCardRef = useCallback(
    (id) => (el) => {
      if (el) cardRefs.current.set(id, el);
      else cardRefs.current.delete(id);
    },
    [],
  );

  // Capture current card positions right before a re-sort, so the
  // layout effect below can FLIP-animate them into their new slots.
  const captureRects = useCallback(() => {
    const map = new Map();
    cardRefs.current.forEach((el, id) => {
      map.set(id, el.getBoundingClientRect());
    });
    prevRectsRef.current = map;
  }, []);

  const handleSortChange = useCallback(
    (order) => {
      if (order === sortOrder) return;
      captureRects();
      setSortOrder(order);
    },
    [sortOrder, captureRects],
  );

  const handleFlipTransitionEnd = useCallback((e) => {
    if (e.propertyName === "transform") {
      e.currentTarget.style.transition = "";
      e.currentTarget.style.zIndex = "";
      e.currentTarget.style.willChange = "";
    }
  }, []);

  // FLIP: after the DOM reflows into the new sort order, measure each
  // card's new position, diff it against the position captured just
  // before the sort, and animate from "old spot" to "new spot".
  useLayoutEffect(() => {
    const prev = prevRectsRef.current;
    if (prev.size === 0) return;

    if (prefersReducedMotion()) {
      prevRectsRef.current = new Map();
      return;
    }

    cardRefs.current.forEach((el, id) => {
      const prevRect = prev.get(id);
      if (!prevRect || !el) return;
      const newRect = el.getBoundingClientRect();
      const dx = prevRect.left - newRect.left;
      const dy = prevRect.top - newRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      el.style.willChange = "transform";
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.zIndex = "1";
      // Force a reflow so the browser registers the starting transform
      // before we animate to the resting position.
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
      });
    });

    prevRectsRef.current = new Map();
  }, [sortOrder]);

  const openProject = useCallback((id, triggerEl) => {
    lastTriggerRef.current = triggerEl || null;
    setClosing(false);
    setSelected(id);
  }, []);

  const requestClose = useCallback(() => {
    setClosing((prevClosing) => {
      if (prevClosing) return prevClosing;
      closeTimerRef.current = setTimeout(() => {
        setSelected(null);
        setClosing(false);
        lastTriggerRef.current?.focus?.();
      }, 220);
      return true;
    });
  }, []);

  const goPrev = useCallback(() => {
    setSelected((current) => {
      const idx = sortedProjects.findIndex((p) => p.id === current);
      return idx > 0 ? sortedProjects[idx - 1].id : current;
    });
  }, [sortedProjects]);

  const goNext = useCallback(() => {
    setSelected((current) => {
      const idx = sortedProjects.findIndex((p) => p.id === current);
      return idx >= 0 && idx < sortedProjects.length - 1
        ? sortedProjects[idx + 1].id
        : current;
    });
  }, [sortedProjects]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog for keyboard + screen-reader users.
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 50);
    const onKey = (e) => {
      if (closing) return;
      if (e.key === "Escape") requestClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
    };
  }, [selected, closing, requestClose, goPrev, goNext]);

  return (
    <>
      <style>{`
        .proj-tag {
          font-family: var(--font-mono);
          font-size: 10.5px;
          padding: 4px 8px;
          border: 1px solid var(--color-line);
          color: var(--color-muted);
          background: var(--color-panel);
          transition: all 0.2s ease;
          line-height: 1;
        }
        @media (min-width: 640px) { .proj-tag { font-size: 11px; } }
        .proj-card {
          border: 1px solid var(--color-line);
          background: var(--color-paper);
          transition: border-color 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease;
        }
        .proj-card:hover {
          border-color: var(--color-ink);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.06);
        }
        .theme-dark .proj-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
        @media (max-width: 640px) {
          .proj-card:hover { transform: none; box-shadow: none; }
          .proj-card:active { border-color: var(--color-ink); }
        }
        .proj-list-row {
          border: 1px solid var(--color-line);
          background: var(--color-paper);
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .proj-list-row:hover { border-color: var(--color-ink); background: var(--color-panel); }
        .proj-list-row:active { border-color: var(--color-ink); }
        .sort-single-btn,
        .view-single-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 14px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-muted);
          border: 1px solid var(--color-line);
          background: var(--color-panel);
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        }
        .sort-single-btn:hover,
        .view-single-btn:hover { border-color: var(--color-ink); color: var(--color-ink); }
        .sort-single-btn:active,
        .view-single-btn:active { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .sort-single-btn svg,
        .view-single-btn svg { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (prefers-reduced-motion: reduce) {
          .sort-single-btn svg,
          .view-single-btn svg { transition: none; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modal-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(10px) scale(0.98); }
        }
        @keyframes backdrop-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes backdrop-out {
          from { opacity: 1; } to { opacity: 0; }
        }
        @keyframes bar-grow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes content-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-content-in { animation: content-fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .media-img {
          transition: opacity 0.6s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .media-shimmer {
          background: linear-gradient(100deg, var(--color-panel) 30%, var(--color-ghost) 50%, var(--color-panel) 70%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          from { background-position: 140% 0; }
          to { background-position: -40% 0; }
        }
        .modal-nav-arrow {
          opacity: 0;
          transform: translateY(-50%) scale(0.92);
        }
        .group\\/hero:hover .modal-nav-arrow,
        .group\\/hero:focus-within .modal-nav-arrow {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        @media (max-width: 640px) {
          .modal-nav-arrow { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .proj-modal-scroll { scrollbar-width: thin; scrollbar-color: var(--color-line) transparent; }
        .proj-modal-scroll::-webkit-scrollbar { width: 8px; }
        .proj-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .proj-modal-scroll::-webkit-scrollbar-thumb { background: var(--color-line); border-radius: 8px; }
        .proj-modal-scroll::-webkit-scrollbar-thumb:hover { background: var(--color-muted); }
        @media (prefers-reduced-motion: reduce) {
          .modal-content-in, .media-img, .media-shimmer,
          [style*="modal-in"], [style*="modal-out"], [style*="backdrop-in"], [style*="backdrop-out"] {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <section
        id="projects"
        ref={revealScopeRef}
        className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-10 border-t border-line bg-paper overflow-hidden"
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* ── Header ───────────────────────────── */}
          <div className="flex flex-col gap-5 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faint">
                    Selected Work
                  </p>
                  <span className="h-px w-6 sm:w-8 bg-line hidden sm:block" />
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-faint">
                    {String(PROJECTS.length).padStart(2, "0")} SHIPPED
                  </span>
                </div>
                <h2 className="font-display font-semibold text-[1.75rem] sm:text-[clamp(1.75rem,4vw,2.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
                  Projects I&apos;ve{" "}
                  <span className="italic font-normal">built.</span>
                </h2>
                <p className="text-muted text-[13px] sm:text-sm leading-relaxed mt-2 sm:mt-3 max-w-xl">
                  A compact archive — each one built end-to-end. Tap a card to
                  explore the stack and context.
                </p>
              </div>

              {/* Controls — both toggles adjacent (Latest/Oldest + Grid/List) — same row on desktop + mobile */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint sm:hidden">
                  {PROJECTS.length} projects
                </span>

                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                  <button
                    onClick={() =>
                      handleSortChange(sortOrder === "latest" ? "oldest" : "latest")
                    }
                    className="sort-single-btn"
                    aria-label={
                      sortOrder === "latest"
                        ? "Sorted newest first — tap to show oldest first"
                        : "Sorted oldest first — tap to show newest first"
                    }
                    title={sortOrder === "latest" ? "Newest first" : "Oldest first"}
                  >
                    <span>{sortOrder === "latest" ? "Latest" : "Oldest"}</span>
                    <ArrowUp
                      className="w-3.5 h-3.5"
                      style={{
                        transform:
                          sortOrder === "oldest" ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  <button
                    onClick={() => setView(view === "grid" ? "list" : "grid")}
                    className="view-single-btn"
                    aria-label={
                      view === "grid"
                        ? "Grid view — tap to show list view"
                        : "List view — tap to show grid view"
                    }
                    title={view === "grid" ? "Grid view" : "List view"}
                  >
                    {view === "grid" ? (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5" /> Grid
                      </>
                    ) : (
                      <>
                        <List className="w-3.5 h-3.5" /> List
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-y border-line py-2.5">
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-faint">
                All projects
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-faint hidden sm:inline">
                Tap card for details — GitHub / Live where available
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-faint sm:hidden">
                Tap for details
              </span>
            </div>
          </div>

          {/* ── Grid / List ──────────────────────── */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {sortedProjects.map((project, i) => {
                const isHovered = hoveredId === project.id;
                return (
                  <article
                    key={`grid-${project.id}`}
                    ref={setCardRef(project.id)}
                    onTransitionEnd={handleFlipTransitionEnd}
                    data-reveal
                    className="reveal group"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <TiltCard onHoverChange={(v) => setHoveredId(v ? project.id : null)}>
                    <button
                      onClick={(e) => openProject(project.id, e.currentTarget)}
                      className="proj-card w-full text-left block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                      aria-label={`Open details for ${project.title}`}
                    >
                      <ProjectPreview project={project} isActive={isHovered} />
                      <div className="p-3.5 sm:p-4 md:p-5">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <h3 className="font-display font-semibold text-[15px] sm:text-[17px] leading-tight tracking-[-0.01em] text-ink group-hover:text-muted transition-colors line-clamp-2 sm:line-clamp-none">
                            {project.title}
                          </h3>
                          <span
                            aria-hidden="true"
                            className={`shrink-0 mt-0.5 w-7 h-7 hidden sm:inline-flex items-center justify-center border transition-all duration-200 ${
                              isHovered
                                ? "bg-ink text-paper border-ink"
                                : "bg-panel text-muted border-line"
                            }`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                          <span
                            aria-hidden="true"
                            className="shrink-0 sm:hidden text-muted mt-1"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-muted text-[13px] leading-relaxed mt-2 line-clamp-3 sm:line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-3 sm:mt-3.5">
                          {project.tags.map((tag) => (
                            <span key={tag} className="proj-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                    </TiltCard>
                    <div className="flex items-center justify-between px-1 pt-2">
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">
                        {project.number} — {project.category}
                      </span>
                      <div className="flex items-center gap-3">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-ink active:text-ink transition-colors py-1"
                          >
                            Live <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {project.href && (
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-ink active:text-ink transition-colors py-1"
                          >
                            GitHub <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!project.href && !project.liveUrl && (
                          <a
                            href="https://github.com/Robb730"
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-ink active:text-ink transition-colors py-1"
                          >
                            Go to repository <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {sortedProjects.map((project, i) => {
                const isHovered = hoveredId === project.id;
                return (
                  <article
                    key={`list-${project.id}`}
                    ref={setCardRef(project.id)}
                    onTransitionEnd={handleFlipTransitionEnd}
                    data-reveal
                    className="reveal"
                    style={{ transitionDelay: `${i * 50}ms` }}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <button
                      onClick={(e) => openProject(project.id, e.currentTarget)}
                      className="proj-list-row w-full text-left p-3.5 sm:p-0 sm:px-5 md:px-6 sm:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                    >
                      {/* Mobile: stacked layout */}
                      <div className="sm:hidden space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] tracking-widest text-faint tabular-nums">
                              {project.number}
                            </span>
                            <span className="w-px h-3 bg-line" />
                            <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-faint">
                              {project.category} · {project.year}
                            </span>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted shrink-0" />
                        </div>
                        <h3 className="font-display font-semibold text-[15px] leading-tight text-ink pr-2">
                          {project.title}
                        </h3>
                        <p className="text-muted text-[13px] leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {project.tags.map((t) => (
                            <span
                              key={t}
                              className="proj-tag !text-[10px] !px-2 !py-1"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Desktop: grid layout */}
                      <div className="hidden sm:grid sm:grid-cols-[52px_1.25fr_1.6fr_auto] gap-4 md:gap-6 items-center">
                        <span className="font-mono text-xs tracking-widest text-faint tabular-nums">
                          {project.number}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-sm md:text-[15px] leading-tight text-ink truncate pr-2">
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {project.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="proj-tag !text-[10px] !py-0.5"
                              >
                                {t}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="font-mono text-[10px] text-faint self-center">
                                +{project.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-muted text-[13px] leading-relaxed line-clamp-2">
                          {project.description}
                        </p>
                        <span
                          className={`w-8 h-8 inline-flex items-center justify-center border shrink-0 transition-all ${
                            isHovered
                              ? "bg-ink text-paper border-ink"
                              : "bg-panel text-muted border-line"
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-line pt-5 sm:pt-6">
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-faint text-center sm:text-left">
              Crafted with attention to spacing & type — minimal by intent.
            </p>
            <a
              href="https://github.com/Robb730"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-ink active:text-ink transition-colors border border-line px-4 py-2.5 sm:py-2 hover:border-ink"
            >
              Go to repository <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Detail Modal — wide landscape hero + two-column brief ── */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={selectedProject.title}
        >
          <div
            className="absolute inset-0 bg-[#0d0d0d]/45 backdrop-blur-[10px] dark:bg-black/65"
            style={{
              animation: closing
                ? "backdrop-out 0.2s ease forwards"
                : "backdrop-in 0.3s ease",
            }}
            onClick={requestClose}
          />
          <div
            className="relative w-full max-w-[1040px] md:max-w-[1160px] xl:max-w-[1280px] max-h-[94dvh] sm:max-h-[90vh] overflow-hidden bg-paper border-t sm:border border-line shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:shadow-[0_30px_90px_rgba(0,0,0,0.18)] flex flex-col rounded-t-[16px] sm:rounded-[12px]"
            style={{
              animation: closing
                ? "modal-out 0.2s cubic-bezier(0.4,0,1,1) forwards"
                : "modal-in 0.42s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* drag handle — mobile sheet affordance */}
            <div className="sm:hidden shrink-0 flex justify-center pt-2 pb-1 bg-paper">
              <span className="w-9 h-1 rounded-full bg-line" />
            </div>

            {/* header */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-line bg-panel/50 backdrop-blur gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.14em] sm:tracking-[0.16em] uppercase text-faint truncate">
                  {selectedProject.number} /{" "}
                  {String(PROJECTS.length).padStart(2, "0")} —{" "}
                  {selectedProject.category} · {selectedProject.year}
                </span>
                <span className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.12em] uppercase bg-ink text-paper px-2 py-1 shrink-0">
                  {selectedProject.role}
                </span>
              </div>
              <button
                ref={closeBtnRef}
                onClick={requestClose}
                className="w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center border border-line bg-paper text-muted hover:border-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* scroll shell — everything below the header scrolls as one, image included */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain proj-modal-scroll">
              <div key={selectedProject.id} className="modal-content-in">
                {/* HERO — full-bleed landscape screenshot */}
                <div className="group/hero relative w-full aspect-[16/9] sm:aspect-[21/10] xl:aspect-[21/9] overflow-hidden bg-panel border-b border-line">
                  <ProjectMedia project={selectedProject} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

                  {/* corner index tag */}
                  <span className="absolute top-3 left-3 z-10 font-mono text-[9px] tracking-[0.14em] uppercase text-faint bg-paper/85 border border-line backdrop-blur px-2 py-1">
                    Fig {selectedProject.number}
                  </span>
                  {/* Link chips — only show if available */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    {selectedProject.liveUrl && (
                      <a
                        href={selectedProject.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] uppercase text-paper bg-ink border border-ink backdrop-blur px-2.5 py-1.5 hover:opacity-90 transition-opacity"
                      >
                        Live <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedProject.href && (
                      <a
                        href={selectedProject.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] uppercase text-muted bg-paper/90 border border-line backdrop-blur px-2.5 py-1.5 hover:border-ink hover:text-ink transition-colors"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* overlay prev/next — lightbox-style, quick to find without hunting for the footer */}
                  <button
                    onClick={goPrev}
                    disabled={selectedIndex === 0}
                    aria-label="Previous project"
                    className="modal-nav-arrow absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center border border-line bg-paper/90 backdrop-blur text-ink disabled:opacity-0 disabled:pointer-events-none transition-all hover:bg-ink hover:text-paper"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={selectedIndex === PROJECTS.length - 1}
                    aria-label="Next project"
                    className="modal-nav-arrow absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center border border-line bg-paper/90 backdrop-blur text-ink disabled:opacity-0 disabled:pointer-events-none transition-all hover:bg-ink hover:text-paper"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* BODY — two columns on wide screens, made possible by the wider modal */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr]">
                  {/* LEFT — narrative */}
                  <div className="p-5 sm:p-7 lg:p-9 lg:pr-8 space-y-5 lg:space-y-6 lg:border-r border-line">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-faint mb-2">
                        Project
                      </p>
                      <h4 className="font-display font-semibold text-[22px] sm:text-[26px] lg:text-[28px] leading-[1.05] tracking-[-0.015em] text-ink">
                        {selectedProject.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted border border-line bg-panel px-2 py-1">
                          {selectedProject.category}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted border border-line bg-panel px-2 py-1">
                          {selectedProject.year}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted border border-line bg-panel px-2 py-1">
                          {selectedProject.role}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-line" />

                    <p className="text-muted text-[14px] sm:text-[14.5px] leading-[1.7]">
                      {selectedProject.longDescription}
                    </p>

                    <div className="border-l-2 border-line pl-3.5 py-1 bg-panel/40">
                      <p className="text-faint text-xs leading-relaxed">
                        {selectedProject.description}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT — highlights, stack, links */}
                  <div className="p-5 sm:p-7 lg:p-9 lg:pl-8 space-y-6 bg-panel/25">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-faint mb-3">
                        Highlights
                      </p>
                      <ul className="space-y-2.5">
                        {selectedProject.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2.5">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ink shrink-0" />
                            <span className="font-mono text-[11.5px] sm:text-xs text-muted leading-snug">
                              {h}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="h-px bg-line" />

                    <div>
                      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-faint mb-2.5">
                        Stack
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.tags.map((t) => (
                          <span key={t} className="proj-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-line" />

                    <div className="space-y-2">
                      {selectedProject.liveUrl && (
                        <a
                          href={selectedProject.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 bg-ink text-paper px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px]"
                        >
                          Visit live site <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {selectedProject.href && (
                        <a
                          href={selectedProject.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-colors min-h-[44px] ${selectedProject.liveUrl ? "bg-paper text-ink border border-line hover:border-ink" : "bg-ink text-paper hover:opacity-90 active:opacity-80"}`}
                        >
                          View repository <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {!selectedProject.href && !selectedProject.liveUrl && (
                        <a
                          href="https://github.com/Robb730"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-ink border border-dashed border-line px-4 py-3 bg-panel/40 hover:border-ink transition-colors"
                        >
                          Go to repository <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* footer — navigation + quick close, always in reach */}
            <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 border-t border-line bg-paper">
              <button
                onClick={goPrev}
                disabled={selectedIndex === 0}
                className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2.5 sm:py-2 border border-line bg-panel text-muted hover:border-ink hover:text-ink active:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[40px] flex-1 sm:flex-initial"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {sortedProjects.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    aria-label={`Go to ${p.title}`}
                    aria-current={i === selectedIndex}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === selectedIndex
                        ? "w-5 bg-ink"
                        : "w-1.5 bg-line hover:bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-faint shrink-0 sm:hidden">
                {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                {String(sortedProjects.length).padStart(2, "0")}
              </span>
              <button
                onClick={goNext}
                disabled={selectedIndex === sortedProjects.length - 1}
                className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2.5 sm:py-2 border border-line bg-panel text-muted hover:border-ink hover:text-ink active:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[40px] flex-1 sm:flex-initial"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}