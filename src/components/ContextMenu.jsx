import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, FileText, Mail } from "lucide-react";

const EMAIL = "robbolazo.dev@gmail.com";
const GITHUB = "https://github.com/Robb730";

export default function ContextMenu() {
  const [pos, setPos] = useState(null);
  const [toast, setToast] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const onContext = (e) => {
      // don't hijack on inputs/textareas/contenteditable or when selecting text
      const t = e.target;
      const sel = window.getSelection()?.toString();
      if (sel && sel.length > 2) return;
      if (t.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 180);
      setPos({ x, y });
    };
    const onClose = (e) => {
      if (pos) {
        // close on click outside, scroll, escape
        if (e.type === "keydown" && e.key !== "Escape") return;
        setPos(null);
      }
    };
    const onScroll = () => setPos(null);
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("click", onClose);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onClose);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("click", onClose);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onClose);
      window.removeEventListener("resize", onScroll);
    };
  }, [pos]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      flash("Email copied — " + EMAIL);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      flash("Email copied");
    }
    setPos(null);
  };

  const viewResume = () => {
    // No static resume file yet — scroll to about/contact as meaningful fallback
    const el = document.getElementById("about") || document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    flash("Résumé — scroll to About / Contact");
    setPos(null);
  };

  const openGithub = () => {
    window.open(GITHUB, "_blank", "noreferrer");
    setPos(null);
  };

  if (!pos) {
    return toast ? (
      <div className="ctx-toast-wrap">
        <div className="ctx-toast">{toast}</div>
        <style>{`
          .ctx-toast-wrap { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 70; pointer-events: none; }
          .ctx-toast { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-paper); background: var(--color-ink); border: 1px solid var(--color-ink); padding: 8px 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); animation: ctx-toast 0.3s cubic-bezier(0.16,1,0.3,1), ctx-toast-out 0.3s ease 1.5s forwards; }
          @keyframes ctx-toast { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:translateY(0);} }
          @keyframes ctx-toast-out { from {opacity:1;} to {opacity:0; transform: translateY(-6px);} }
        `}</style>
      </div>
    ) : null;
  }

  return (
    <>
      <div
        ref={menuRef}
        role="menu"
        aria-label="Quick actions"
        className="ctx-menu"
        style={{ left: pos.x, top: pos.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <button role="menuitem" className="ctx-item" onClick={copyEmail}>
          <Copy className="w-3.5 h-3.5" /> Copy email
        </button>
        <button role="menuitem" className="ctx-item" onClick={viewResume}>
          <FileText className="w-3.5 h-3.5" /> View résumé
        </button>
        <button role="menuitem" className="ctx-item" onClick={openGithub}>
          <ExternalLink className="w-3.5 h-3.5" /> GitHub
        </button>
        <div className="ctx-foot">
          <Mail className="w-3 h-3 text-faint" /> <span className="ctx-email">{EMAIL}</span>
        </div>
      </div>
      {toast && (
        <div className="ctx-toast-wrap">
          <div className="ctx-toast">{toast}</div>
        </div>
      )}
      <style>{`
        .ctx-menu {
          position: fixed;
          z-index: 70;
          min-width: 200px;
          max-width: 240px;
          padding: 6px;
          border: 1px solid rgba(255,255,255,0.62);
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          box-shadow: 0 14px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
          animation: ctx-in 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .theme-dark .ctx-menu {
          background: rgba(20,20,22,0.74);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 14px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        @keyframes ctx-in { from { opacity:0; transform: translateY(6px) scale(0.98);} to {opacity:1; transform: translateY(0) scale(1);} }
        .ctx-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 9px 10px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-ink);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease;
        }
        .ctx-item:hover { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .theme-dark .ctx-item { color: #fff; }
        .theme-dark .ctx-item:hover { background: #fff; color: #0d0d0d; border-color: #fff; }
        .ctx-foot {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          padding: 7px 10px 4px;
          border-top: 1px solid var(--color-line);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--color-faint);
          text-transform: lowercase;
        }
        .ctx-email { color: var(--color-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ctx-toast-wrap { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 70; pointer-events: none; }
        .ctx-toast { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-paper); background: var(--color-ink); border: 1px solid var(--color-ink); padding: 8px 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); animation: ctx-toast 0.3s cubic-bezier(0.16,1,0.3,1), ctx-toast-out 0.3s ease 1.5s forwards; }
        @keyframes ctx-toast { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:translateY(0);} }
        @keyframes ctx-toast-out { from {opacity:1;} to {opacity:0; transform: translateY(-6px);} }
        @media (prefers-reduced-motion: reduce) { .ctx-menu, .ctx-toast { animation:none !important; } }
      `}</style>
    </>
  );
}
