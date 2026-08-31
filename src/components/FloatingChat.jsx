import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minus, Sparkles } from "lucide-react";
import { sendMessageToGemini, hasGeminiKey } from "../lib/gemini";

const QUICK_REPLIES = [
  "What are your skills?",
  "Tell me about your projects",
  "How can I contact you?",
];

const PROFILE_SRC = "/profpic.png";

// Real wall-clock time for each message bubble (e.g. "10:32 AM")
const formatTime = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ── Lightweight markdown for chat bubbles ───────────────────────
   Gemini responses come back with **bold** and "- " bullet syntax.
   We don't need a full markdown library for a chat bubble — just
   handle the two things the model actually uses, and render real
   JSX instead of showing literal asterisks/dashes to the user. */
function renderInline(text) {
  // Split on **bold** while keeping the delimited chunks so we can
  // tell which parts were wrapped in ** and which weren't.
  const segments = text.split(/(\*\*[^*]+?\*\*)/g);
  return segments.map((seg, i) => {
    const match = /^\*\*([^*]+?)\*\*$/.exec(seg);
    return match ? (
      <strong key={i} className="font-semibold">
        {match[1]}
      </strong>
    ) : (
      seg
    );
  });
}

function renderMessageText(text) {
  const lines = text.split("\n");
  const nodes = [];
  lines.forEach((line, i) => {
    if (i > 0) nodes.push(<br key={`br-${i}`} />);
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      nodes.push(
        <span key={i}>
          {"• "}
          {renderInline(bulletMatch[1])}
        </span>,
      );
    } else {
      nodes.push(<span key={i}>{renderInline(line)}</span>);
    }
  });
  return nodes;
}

/* Avatar with graceful fallback to initials if the image is missing */
function ProfileAvatar({ size = 36, className = "" }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div
        className={`chat-avatar-img ${className}`}
        style={{ width: size, height: size, display: "grid", placeItems: "center", background: "var(--color-ink)", color: "var(--color-paper)", fontWeight: 700, fontSize: size * 0.32 }}
      >
        RO
      </div>
    );
  }
  return (
    <img
      src={PROFILE_SRC}
      alt="Robb Olazo"
      onError={() => setErr(true)}
      className={`chat-avatar-img select-none ${className}`}
      style={{ width: size, height: size, WebkitUserDrag: "none", WebkitTouchCallout: "none" }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "0",
      role: "bot",
      text: "Hey, I'm Robb Olazo — ask me about my projects, skills, or how to get in touch!",
      time: formatTime(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHacker, setIsHacker] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("theme-hacker")
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsHacker(root.classList.contains("theme-hacker"));
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // idle nudge — "hey try and send a question" after 30s idle on top of FAB
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimerRef = useRef(null);
  const hideNudgeTimerRef = useRef(null);
  const nudgeDismissedRef = useRef(false);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const hasKey = hasGeminiKey();

  // Focus input when opened + Esc to close
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock background scroll while the sheet is open on mobile
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // hide nudge when chat opens
  useEffect(() => {
    if (open) {
      setShowNudge(false);
      clearTimeout(nudgeTimerRef.current);
      clearTimeout(hideNudgeTimerRef.current);
    }
  }, [open]);

  // idle 30s → show nudge above FAB (only when closed, once per idle cycle)
  useEffect(() => {
    if (open || nudgeDismissedRef.current) return;
    const schedule = () => {
      clearTimeout(nudgeTimerRef.current);
      clearTimeout(hideNudgeTimerRef.current);
      nudgeTimerRef.current = setTimeout(() => {
        if (nudgeDismissedRef.current || document.querySelector(".chat-panel.is-open")) return;
        setShowNudge(true);
        hideNudgeTimerRef.current = setTimeout(() => setShowNudge(false), 10000);
      }, 30000);
    };
    const reset = () => {
      setShowNudge(false);
      clearTimeout(hideNudgeTimerRef.current);
      schedule();
    };
    schedule();
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      clearTimeout(nudgeTimerRef.current);
      clearTimeout(hideNudgeTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [open]);

  const handleSend = async (textOverride) => {
    const raw = (textOverride ?? input).trim();
    if (!raw || loading) return;
    if (!hasKey) {
      setError("Missing API key. Add VITE_GEMINI_API_KEY to .env.local and restart dev server.");
      return;
    }
    setError(null);
    const userMsg = { id: Date.now().toString(), role: "user", text: raw, time: formatTime() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "0")
        .map((m) => ({ role: m.role, text: m.text }));
      const reply = await sendMessageToGemini({ message: raw, history });
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "bot", text: reply, time: formatTime() },
      ]);
    } catch (e) {
      console.error(e);
      const raw = String(e?.message ?? e ?? "");
      const isQuotaError =
        /429|quota|RESOURCE_EXHAUSTED|GenerateRequestsPerDay|rate limit|exceeded/i.test(raw) ||
        e?.status === 429 ||
        e?.status === "RESOURCE_EXHAUSTED" ||
        String(e?.code ?? "").includes("429");
      const isGeminiError = /generate_content|generativelanguage|Gemini|fetch|Failed to fetch|network|503|500/i.test(raw);
      const friendlyFallback =
        "Hi! I’m sorry if I’m unable to respond to your query right now—I’m a little busy at the moment. I’ll get back to you as soon as I can and try again later. Thanks for understanding!";
      const msg = e?.message?.includes("VITE_GEMINI_API_KEY")
        ? e.message
        : e?.message?.includes("API_KEY_INVALID") || e?.message?.includes("API key")
        ? "Invalid API key. Get a valid key from aistudio.google.com/app/apikey (starts with AIza...) and put it in .env.local as VITE_GEMINI_API_KEY=..."
        : isQuotaError || isGeminiError
        ? friendlyFallback
        : friendlyFallback;
      // Don't surface raw quota/API errors in the red error bar — friendly fallback is already shown as bot message
      setError(isQuotaError || isGeminiError ? null : msg);
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "bot", text: msg, time: formatTime() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating launcher — shows profile pic, swaps to X when open */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat with Robb"}
        aria-expanded={open}
        className="chat-fab"
      >
        <span className={`chat-fab-icon ${open ? "is-open" : ""}`}>
          <MessageCircle className="w-5 h-5" />
        </span>
        {!open && <span className="chat-fab-pulse" aria-hidden="true" />}
        {!open && <span className="chat-fab-badge" aria-hidden="true" />}
      </button>

      {/* Idle nudge — 30s idle, aesthetic */}
      <div
        className={`chat-nudge ${showNudge && !open ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-hidden={!showNudge || open}
      >
        <button type="button" className="chat-nudge-main" onClick={() => setOpen(true)}>
          <span className="chat-nudge-dot" aria-hidden="true" />
          <span className="chat-nudge-text">Have a question? I'm listening</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="chat-nudge-close"
          onClick={() => {
            setShowNudge(false);
            nudgeDismissedRef.current = true;
            clearTimeout(nudgeTimerRef.current);
            clearTimeout(hideNudgeTimerRef.current);
          }}
        >
          ×
        </button>
      </div>

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Chat with Robb"
        aria-hidden={!open}
        className={`chat-panel ${open ? "is-open" : ""}`}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="flex items-center gap-3 min-w-0">
            <div className="chat-avatar-wrap">
              <ProfileAvatar size={42} />
              <span className="chat-avatar-dot" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight text-ink leading-none">Robb Olazo</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink text-paper px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> AI
                </span>
              </div>
              <p className="text-xs text-muted font-mono tracking-wide truncate mt-0.5">
                {isHacker ? "⬢ matrix link · encrypted · root access" : hasKey ? "Online · replies instantly" : "Missing API key"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setOpen(false)} className="chat-icon-btn" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile drag handle */}
        <div className="chat-sheet-handle" aria-hidden="true" />

        {/* Body */}
        <div ref={bodyRef} className="chat-body">
          {!hasKey && (
            <div className="chat-row bot">
              <ProfileAvatar size={28} className="chat-msg-avatar" />
              <div className="chat-col">
                <div className="chat-bubble bot" style={{ borderColor: "#f59e0b", background: "rgba(254,243,199,0.85)" }}>
                  <p className="text-xs leading-relaxed text-ink">
                    No API key found. Create <span className="font-mono font-semibold">.env.local</span> with:
                    <br />
                    <code className="font-mono text-[11px] bg-paper border border-line px-1 py-0.5">VITE_GEMINI_API_KEY=AIza...</code>
                    <br />
                    <span className="text-muted">Then restart </span>
                    <code className="font-mono text-[11px]">npm run dev</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showAvatar = m.role === "bot" && (!prev || prev.role !== "bot");
            return (
              <div key={m.id} className={`chat-row ${m.role === "user" ? "user" : "bot"}`}>
                {m.role === "bot" && (
                  <ProfileAvatar size={28} className={`chat-msg-avatar ${showAvatar ? "" : "chat-msg-avatar-hidden"}`} />
                )}
                <div className="chat-col">
                  <div className={`chat-bubble ${m.role === "user" ? "user" : "bot"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {renderMessageText(m.text)}
                    </p>
                  </div>
                  <span className={`chat-time ${m.role === "user" ? "user" : ""}`}>{m.time}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="chat-row bot">
              <ProfileAvatar size={28} className="chat-msg-avatar" />
              <div className="chat-col">
                <div className="chat-bubble bot">
                  <span className="chat-typing" aria-label="typing">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick replies — show only at start */}
          {messages.length <= 1 && !loading && (
            <div className="chat-quick">
              {QUICK_REPLIES.map((q) => (
                <button key={q} type="button" className="chat-chip" onClick={() => handleSend(q)} disabled={loading}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {error && hasKey && <p className="text-[11px] font-mono text-red-500 px-1 pt-1">{error}</p>}
        </div>

        {/* Composer */}
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isHacker ? "root@robb:~$ ask anything..." : hasKey ? "Ask about Robb's projects…" : "Add API key to enable chat"}
              className="chat-input"
              aria-label="Message"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send"
              aria-label="Send message"
              disabled={loading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="chat-footnote">{isHacker ? "▓ matrix channel · gemini uplink encrypted" : "powered by Gemini"}</p>
        </form>
      </div>

      <style>{`
        .chat-fab {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 50;
          width: 58px;
          height: 58px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          color: var(--color-ink);
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 8px 28px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.6);
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
        }
        .chat-fab:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 14px 36px rgba(0,0,0,0.2); }
        .chat-fab:active { transform: scale(0.96); }
        .chat-fab-icon { display: grid; place-items: center; color: var(--color-ink); transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1); }
        .chat-fab-icon.is-open { transform: rotate(90deg) scale(0.92); }
        .chat-fab-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          border: 1px solid var(--color-ink);
          opacity: 0.14;
          animation: chat-pulse 2.2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes chat-pulse {
          0% { transform: scale(0.86); opacity: 0.22; }
          100% { transform: scale(1.18); opacity: 0; }
        }
        .chat-fab-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #10b981;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
        .theme-dark .chat-fab {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 8px 28px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .theme-dark .chat-fab-badge { border-color: #1a1a1a; }

        .chat-nudge {
          position: fixed;
          right: 16px;
          bottom: 90px;
          z-index: 49;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          max-width: 320px;
          padding: 13px 14px 13px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.62);
          background: linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.76) 100%);
          backdrop-filter: blur(22px) saturate(185%);
          -webkit-backdrop-filter: blur(22px) saturate(185%);
          box-shadow: 0 16px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          transform: translateY(10px) scale(0.97);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease;
        }
        .chat-nudge::after {
          content: "";
          position: absolute;
          bottom: -6px;
          right: 22px;
          width: 12px;
          height: 12px;
          background: rgba(255,255,255,0.88);
          border-right: 1px solid rgba(255,255,255,0.62);
          border-bottom: 1px solid rgba(255,255,255,0.62);
          transform: rotate(45deg);
          box-shadow: 4px 4px 12px rgba(0,0,0,0.06);
          backdrop-filter: blur(22px);
        }
        .chat-nudge.is-visible {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }
        .chat-nudge-main {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          font: inherit;
          color: var(--color-ink);
          text-align: left;
          transition: opacity 0.2s ease;
        }
        .chat-nudge-main:hover { opacity: 0.78; }
        .chat-nudge-dot {
          width: 7px; height: 7px; border-radius: 9999px; background: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.16), 0 0 12px rgba(16,185,129,0.3); flex-shrink: 0;
          animation: nudge-dot-pulse 2.2s ease-in-out infinite;
        }
        @keyframes nudge-dot-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.85; } }
        .chat-nudge-text {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--color-ink);
          line-height: 1.35;
          white-space: nowrap;
        }
        .chat-nudge-close {
          width: 24px; height: 24px; border-radius: 9999px; display: grid; place-items: center; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.04); color: var(--color-faint); cursor: pointer; flex-shrink: 0; font-size: 13px; line-height: 1; transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
        }
        .chat-nudge-close:hover { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); transform: scale(1.05); }
        .theme-dark .chat-nudge { background: linear-gradient(180deg, rgba(26,26,28,0.88) 0%, rgba(20,20,22,0.82) 100%); border-color: rgba(255,255,255,0.12); box-shadow: 0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08); }
        .theme-dark .chat-nudge::after { background: rgba(26,26,28,0.88); border-color: rgba(255,255,255,0.12); }
        .theme-dark .chat-nudge-close { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); color: #a3a3a3; }
        .theme-dark .chat-nudge-close:hover { background: #fff; color: #0d0d0d; border-color: #fff; }
        .theme-dark .chat-nudge-text { color: #ffffff; }

        .theme-hacker .chat-nudge { background: linear-gradient(180deg, rgba(10,32,18,0.92) 0%, rgba(6,20,12,0.9) 100%); border-color: rgba(0,255,136,0.22); box-shadow: 0 16px 40px rgba(0,255,136,0.16), inset 0 1px 0 rgba(0,255,136,0.14); }
        .theme-hacker .chat-nudge::after { background: rgba(10,32,18,0.92); border-color: rgba(0,255,136,0.22); }

        .theme-hacker .chat-nudge-text { color: #dcffe8; letter-spacing: 0.04em; text-shadow: 0 0 8px rgba(0,255,136,0.3); }
        .theme-hacker .chat-nudge-dot { background: #00ff88; box-shadow: 0 0 0 4px rgba(0,255,136,0.16), 0 0 14px rgba(0,255,136,0.5); }

        @media (max-width: 640px) {
          .chat-nudge {
            right: 14px;
            left: 14px;
            max-width: none;
            justify-content: space-between;
            bottom: calc(14px + 58px + 14px + env(safe-area-inset-bottom));
            padding: 14px 16px;
            border-radius: 16px;
          }
          .chat-nudge::after { right: 28px; }
          .chat-nudge-text { white-space: normal; gap: 5px; }
          .chat-nudge-ask { font-size: 14px; }
          .chat-nudge-psst { font-size: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .chat-nudge, .chat-nudge-dot { transition: none !important; animation: none !important; }
        }

        .chat-panel {
          position: fixed;
          right: 16px;
          bottom: 84px;
          z-index: 50;
          width: min(390px, calc(100vw - 24px));
          height: min(560px, calc(100dvh - 100px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(26px) saturate(180%);
          -webkit-backdrop-filter: blur(26px) saturate(180%);
          box-shadow: 0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
          opacity: 0;
          transform: translateY(14px) scale(0.98);
          transform-origin: bottom right;
          pointer-events: none;
          transition: opacity 0.28s ease, transform 0.34s cubic-bezier(0.16,1,0.3,1);
        }
        .theme-dark .chat-panel {
          background: rgba(20,20,22,0.7);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .chat-panel.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        /* ── Mobile: full-height bottom sheet with safe areas ── */
        @media (max-width: 640px) {
          .chat-fab { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); }
          .chat-panel {
            right: 0;
            left: 0;
            bottom: 0;
            top: env(safe-area-inset-top);
            width: auto;
            height: auto;
            border-radius: 22px 22px 0 0;
            border: none;
            border-top: 1px solid rgba(255,255,255,0.4);
            transform: translateY(100%);
            transform-origin: bottom center;
          }
          .theme-dark .chat-panel { border-top-color: rgba(255,255,255,0.12); }
          .chat-panel.is-open { transform: translateY(0); }
        }

        .chat-sheet-handle { display: none; }
        @media (max-width: 640px) {
          .chat-sheet-handle {
            display: block;
            width: 40px;
            height: 4px;
            border-radius: 999px;
            background: rgba(0,0,0,0.18);
            margin: 8px auto 0;
            flex-shrink: 0;
          }
          .theme-dark .chat-sheet-handle { background: rgba(255,255,255,0.25); }
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.46);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          flex-shrink: 0;
        }
        .theme-dark .chat-header { background: rgba(255,255,255,0.06); border-bottom-color: rgba(255,255,255,0.08); }
        .chat-avatar-wrap {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 9999px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .chat-avatar-wrap .chat-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .chat-avatar-dot {
          position: absolute;
          right: -1px;
          bottom: -1px;
          width: 11px;
          height: 11px;
          border-radius: 9999px;
          background: #10b981;
          border: 2px solid var(--color-paper);
        }
        .theme-dark .chat-avatar-dot { border-color: #141416; }
        .chat-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          border: 1px solid transparent;
          color: var(--color-muted);
          background: transparent;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .chat-icon-btn:hover { background: var(--color-panel); color: var(--color-ink); border-color: var(--color-line); }

        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: var(--color-line) transparent;
          background: rgba(255,255,255,0.1);
          -webkit-overflow-scrolling: touch;
        }
        .theme-dark .chat-body { background: rgba(255,255,255,0.03); }
        .chat-body::-webkit-scrollbar { width: 6px; }
        .chat-body::-webkit-scrollbar-thumb { background: var(--color-line); border-radius: 9999px; }

        .chat-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: chat-msg-in 0.34s cubic-bezier(0.16,1,0.3,1) both;
        }
        .chat-row.bot { justify-content: flex-start; }
        .chat-row.user { justify-content: flex-end; }
        .chat-col { display: flex; flex-direction: column; gap: 3px; max-width: 80%; min-width: 0; }
        .chat-row.user .chat-col { align-items: flex-end; }
        .chat-msg-avatar {
          width: 28px; height: 28px;
          border-radius: 9999px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.5);
        }
        .chat-msg-avatar-hidden { visibility: hidden; }

        .chat-bubble {
          padding: 10px 13px;
          border-radius: 16px;
          line-height: 1.45;
          backdrop-filter: blur(14px) saturate(150%);
          -webkit-backdrop-filter: blur(14px) saturate(150%);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          overflow-wrap: anywhere;
        }
        .chat-bubble.bot {
          background: rgba(255,255,255,0.72);
          color: var(--color-ink);
          border: 1px solid rgba(255,255,255,0.6);
          border-bottom-left-radius: 5px;
        }
        .theme-dark .chat-bubble.bot {
          background: rgba(255,255,255,0.09);
          color: #ffffff;
          border-color: rgba(255,255,255,0.14);
        }
        .chat-bubble.user {
          background: var(--color-ink);
          color: var(--color-paper);
          border: 1px solid var(--color-ink);
          border-bottom-right-radius: 5px;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        /* In dark mode the "ink" accent flips to white, so the user bubble becomes
           a solid white pill with dark text — keep it explicitly readable. */
        .theme-dark .chat-bubble.user {
          background: #ffffff;
          color: #0d0d0d;
          border-color: #ffffff;
        }

        .chat-time {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-faint);
          padding: 0 2px;
        }
        .chat-time.user { color: var(--color-muted); }

        .chat-typing { display: inline-flex; gap: 4px; align-items: center; padding: 2px 0; }
        .chat-typing span {
          width: 7px; height: 7px;
          border-radius: 999px;
          background: var(--color-muted);
          animation: chat-typing 1.2s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.18s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.36s; }
        @keyframes chat-typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }

        @keyframes chat-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding-left: 36px;
        }
        .chat-chip {
          font-size: 12px;
          font-weight: 500;
          padding: 7px 11px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
          color: var(--color-muted);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .theme-dark .chat-chip { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.12); }
        .chat-chip:hover { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); transform: translateY(-1px); backdrop-filter: none; }

        .chat-composer {
          padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.46);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          flex-shrink: 0;
        }
        .theme-dark .chat-composer { background: rgba(255,255,255,0.06); border-top-color: rgba(255,255,255,0.08); }
        .chat-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 5px 5px 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px) saturate(150%);
          -webkit-backdrop-filter: blur(12px) saturate(150%);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .theme-dark .chat-input-wrap { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.12); }
        .chat-input-wrap:focus-within { border-color: var(--color-ink); box-shadow: 0 2px 14px rgba(0,0,0,0.1); }
        .chat-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--color-ink);
        }
        .chat-input::placeholder { color: var(--color-faint); }
        .chat-send {
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          background: var(--color-ink);
          color: var(--color-paper);
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
        }
        .chat-send:hover:not(:disabled) { transform: scale(1.06); }
        .chat-send:active:not(:disabled) { transform: scale(0.94); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-footnote {
          margin-top: 8px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-faint);
        }

        @media (prefers-reduced-motion: reduce) {
          .chat-panel, .chat-fab { transition: none !important; }
          .chat-fab-pulse { animation: none !important; }
          .chat-row { animation: none !important; }
        }
      `}</style>
    </>
  );
}