import { useState, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#education", label: "Education" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#certificates", label: "Certificates and Awards" },
  { href: "#contact", label: "Contact" },
];

// Short display word for the fullscreen transition — keeps the huge type readable
const TRANSITION_LABEL = {
  "#about": "About",
  "#education": "Education",
  "#skills": "Skills",
  "#projects": "Projects",
  "#certificates": "Awards",
  "#contact": "Contact",
  "#top": "Home",
};

export default function Nav({ isDark, toggleTheme, isToggling, onTransition }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [isHacker, setIsHacker] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("theme-hacker"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setIsHacker(el.classList.contains("theme-hacker")),
    );
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const progressRef = useRef(null);
  const headerRef = useRef(null);
  const pillRef = useRef(null);
  // Map of href -> the actual <a> DOM node, so we can scroll the active
  // one into view inside the horizontally-scrollable pill on mobile.
  const linkRefs = useRef({});
  const highlightRef = useRef(null); // NEW

  const moveHighlight = (href) => {
    const container = pillRef.current;
    const el = linkRefs.current[href];
    const highlight = highlightRef.current;
    if (!container || !el || !highlight) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    highlight.style.opacity = "1";
    highlight.style.width = `${eRect.width}px`;
    highlight.style.transform = `translateX(${eRect.left - cRect.left}px)`;
  };
  const hideHighlight = () => {
    if (highlightRef.current) highlightRef.current.style.opacity = "0";
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    // PowerPoint-style fullscreen transition only for navbar clicks.
    // Delegates to App → shows overlay, then scrolls underneath at cover time.
    if (typeof onTransition === "function") {
      const label = TRANSITION_LABEL[href] ?? href.replace(/^#/, "") ?? "Home";
      onTransition(label, href);
      return;
    }
    const id = href.slice(1);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, "", href);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const headerH = headerRef.current?.offsetHeight ?? 64;
    // 8px extra gap so border of previous section is fully off-screen
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", href);
  };

  useEffect(() => {
    const targetRef = { v: 0 };
    const curRef = { v: 0 };
    let rafId = null;

    const render = () => {
      // ease current toward target for a silky, lag-free bar
      curRef.v += (targetRef.v - curRef.v) * 0.18;
      if (Math.abs(targetRef.v - curRef.v) < 0.05) curRef.v = targetRef.v;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${curRef.v / 100})`;
      }
      if (curRef.v !== targetRef.v) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    };

    const kick = () => {
      if (rafId == null) rafId = requestAnimationFrame(render);
    };

    const onScroll = () => {
      const y = window.scrollY;
      // Transparent over the hero: glass only once #top is out of view.
      const hero = document.getElementById("top");
      const headerH = headerRef.current?.offsetHeight ?? 120;
      const pastHero = hero
        ? hero.getBoundingClientRect().bottom <= headerH
        : y > 20;
      setScrolled(pastHero);

      const h = document.documentElement.scrollHeight - window.innerHeight;
      targetRef.v = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
      kick();

      const ids = LINKS.map((l) => l.href.slice(1));
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = `#${id}`;
      }
      if (y < 200) current = "";
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Global delegated handler — fixes leftover from previous section for ANY hash link
  // (Hero CTAs, About "Let's talk", etc.) by using live header height.
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el && id !== "top") return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      const headerH = headerRef.current?.offsetHeight ?? 64;
      const top =
        id === "top"
          ? 0
          : el.getBoundingClientRect().top + window.scrollY - headerH - 8;
      window.scrollTo({ top, behavior: "smooth" });
      history.pushState(null, "", href);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // On mobile the pill scrolls horizontally (overflow-x-auto) and can be
  // wider than the viewport, so the active link can end up off-screen when
  // it changes from page scroll rather than a tap. Bring it into view
  // horizontally, without touching the page's vertical scroll position.
  useEffect(() => {
    const container = pillRef.current;
    const activeEl = linkRefs.current[active];
    if (!container || !activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();

    // Center the active link within the pill's visible width.
    const offset =
      elRect.left -
      containerRect.left -
      containerRect.width / 2 +
      elRect.width / 2;

    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [active]);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "nav-glass-scrolled py-3" : "nav-naked py-3 sm:py-4"
      }`}
    >
      {/* Scroll progress — hidden over hero, GPU transform, driven via rAF */}
      <div
        aria-hidden="true"
        ref={progressRef}
        className="nav-progress"
        style={{ opacity: scrolled ? 0.9 : 0 }}
      />

      <nav className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 px-3 sm:px-6 md:px-10">
        {/* Left — logo */}
        <div className="justify-self-start flex items-center min-w-0">
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, "#top")}
            className="flex items-center shrink-0 group"
            aria-label="Robb Olazo — Home"
          >
            <img
              src={isDark || isHacker ? "/logo-light.svg" : "/logo-dark.svg"}
              alt="Robb Olazo"
              className={`h-6 sm:h-7 w-auto transition-all duration-300 group-hover:scale-110 group-hover:opacity-70 select-none ${isHacker ? "hacker-logo-glitch" : ""}`}
              style={{ WebkitUserDrag: "none", WebkitTouchCallout: "none" }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
          </a>
        </div>

        {/* Center — pill, geometrically centered via 1fr auto 1fr on desktop */}
        <div className="justify-self-center flex items-center justify-center min-w-0 max-w-full">
          <div
            ref={pillRef}
            onMouseLeave={hideHighlight}
            className={`nav-pill flex items-center gap-1 flex-nowrap overflow-x-auto scrollbar-none max-w-[52vw] sm:max-w-none ${scrolled ? "" : "nav-pill-naked"}`}
          >
            <div
              aria-hidden="true"
              ref={highlightRef}
              className="nav-pill-highlight"
            />
            {LINKS.map((link) => (
              <a
                key={link.href}
                ref={(el) => (linkRefs.current[link.href] = el)}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                onMouseEnter={() => moveHighlight(link.href)}
                onFocus={() => moveHighlight(link.href)}
                className={`nav-pill-link whitespace-nowrap shrink-0 text-[0.74rem] sm:text-[0.8125rem] px-2.5 sm:px-3.5 py-1.5 sm:py-[6px] ${active === link.href ? "is-active" : ""}`}
              >
                <span className="sm:hidden">
                  {link.label === "Certificates and Awards"
                    ? "Awards"
                    : link.label}
                </span>
                <span className="hidden sm:inline lg:hidden">
                  {link.label === "Certificates and Awards"
                    ? "Certificates"
                    : link.label}
                </span>
                <span className="hidden lg:inline">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right — theme toggle only */}
        <div className="justify-self-end flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              if (isToggling) return;
              toggleTheme?.(e);
            }}
            disabled={!!isToggling}
            aria-busy={isToggling ? "true" : "false"}
            className={`theme-toggle theme-toggle-redesigned !w-10 !h-10 sm:!w-11 sm:!h-11 shrink-0 ${scrolled ? "" : "theme-toggle-naked"} ${isDark ? "theme-dark-btn" : "theme-light-btn"} ${isToggling ? "pointer-events-none opacity-70" : ""}`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] theme-toggle-icon sun" />
            <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] theme-toggle-icon moon" />
          </button>
        </div>
      </nav>
    </header>
  );
}
