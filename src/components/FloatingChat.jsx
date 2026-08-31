import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, PhoneOff } from "lucide-react";
import { sendMessageToGemini, hasGeminiKey } from "../lib/gemini";
import { hasElevenKey, speakWithElevenLabs, stopSpeaking } from "../lib/elevenlabs";

const QUICK_REPLIES = [
  "What are your skills?",
  "Tell me about your projects",
  "How can I contact you?",
];

const PROFILE_SRC = "/profpic.png";
const MEMOJI_IDLE = "/memoji/idle.mp4";
const MEMOJI_TALKING = "/memoji/talking.mp4";

const formatTime = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function renderInline(text) {
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
  const [mode, setMode] = useState("text"); // "text" | "voice"
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

  // voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceError, setVoiceError] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const idleVideoRef = useRef(null);
  const talkingVideoRef = useRef(null);

  const hasKey = hasGeminiKey();
  const hasVoiceKey = hasElevenKey();

  useEffect(() => {
    const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    setVoiceSupported(Boolean(SR && hasVoiceKey));
  }, [hasVoiceKey]);

  // keep videos in sync with speaking — switch instantly for snappy response
  useEffect(() => {
    const idle = idleVideoRef.current;
    const talking = talkingVideoRef.current;
    if (!idle || !talking) return;
    // ensure both are ready and autoplay allowed
    const ensurePlay = (v) => { try { v.muted = true; v.play().catch(() => {}); } catch {} };
    if (isSpeaking || loading) {
      // show talking right away when thinking/speaking — feels immediate
      try { talking.currentTime = idle.currentTime % (talking.duration || 999); } catch {}
      ensurePlay(talking);
      idle.pause();
    } else {
      try { idle.currentTime = talking.currentTime % (idle.duration || 999); } catch {}
      ensurePlay(idle);
      talking.pause();
    }
  }, [isSpeaking, loading]);

  // stop voice when closing or switching modes
  useEffect(() => {
    if (!open) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      stopSpeaking();
      setIsSpeaking(false);
      if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    }
  }, [open]);
  useEffect(() => {
    if (mode !== "voice") {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      setInterim("");
    }
    stopSpeaking();
    setIsSpeaking(false);
  }, [mode]);

  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimerRef = useRef(null);
  const hideNudgeTimerRef = useRef(null);
  const nudgeDismissedRef = useRef(false);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && mode === "text") setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, mode]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (bodyRef.current && mode === "text") {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading, mode]);

  useEffect(() => {
    if (open) {
      setShowNudge(false);
      clearTimeout(nudgeTimerRef.current);
      clearTimeout(hideNudgeTimerRef.current);
    }
  }, [open]);

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

  // Keep latest values in refs so SpeechRecognition callbacks (which live outside React) never see stale closures
  const messagesRef = useRef(messages);
  const modeRef = useRef(mode);
  const loadingRef = useRef(loading);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const handleSend = useCallback(async (textOverride, opts = {}) => {
    const curLoading = loadingRef.current;
    const raw = (textOverride ?? input).trim();
    if (!raw || curLoading) {
      console.log("[chat] handleSend blocked", { raw, curLoading });
      return;
    }
    if (!hasKey) {
      setError("Missing API key. Add VITE_GEMINI_API_KEY to .env.local and restart dev server.");
      return;
    }
    console.log("[chat] handleSend →", raw, "mode:", modeRef.current);
    setError(null);
    setVoiceError(null);
    const userMsg = { id: Date.now().toString(), role: "user", text: raw, time: formatTime() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setInterim("");
    setLoading(true);
    // stop any ongoing speech when user sends new message
    stopSpeaking();
    setIsSpeaking(false);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }

    try {
      const history = messagesRef.current
        .filter((m) => m.id !== "0")
        .map((m) => ({ role: m.role, text: m.text }));
      const reply = await sendMessageToGemini({ message: raw, history });
      console.log("[chat] Gemini reply:", reply.slice(0, 80));
      const botMsg = { id: (Date.now() + 1).toString(), role: "bot", text: reply, time: formatTime() };
      setMessages((m) => [...m, botMsg]);

      // auto speak in voice mode — flip to talking immediately (before network) for instant feedback
      if (modeRef.current === "voice" && hasVoiceKey && !opts.silent) {
        const ac = new AbortController();
        abortRef.current = ac;
        setIsSpeaking(true);
        try {
          await speakWithElevenLabs(reply, {
            signal: ac.signal,
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        } catch (e) {
          if (e?.name !== "AbortError") {
            console.error("TTS failed", e);
            setVoiceError(e.message?.slice(0,120) || "Voice playback failed");
          }
          setIsSpeaking(false);
        }
      }
    } catch (e) {
      console.error(e);
      const rawErr = String(e?.message ?? e ?? "");
      const isQuotaError =
        /429|quota|RESOURCE_EXHAUSTED|GenerateRequestsPerDay|rate limit|exceeded/i.test(rawErr) ||
        e?.status === 429;
      const isGeminiError = /generate_content|generativelanguage|Gemini|fetch|Failed to fetch|network|503|500/i.test(rawErr);
      const friendlyFallback =
        "Hi! I’m sorry if I’m unable to respond to your query right now—I’m a little busy at the moment. I’ll get back to you as soon as I can and try again later. Thanks for understanding!";
      const msg = e?.message?.includes("VITE_GEMINI_API_KEY")
        ? e.message
        : e?.message?.includes("API_KEY_INVALID") || e?.message?.includes("API key")
        ? "Invalid API key. Get a valid key from aistudio.google.com/app/apikey (starts with AIza...) and put it in .env.local as VITE_GEMINI_API_KEY=..."
        : isQuotaError || isGeminiError
        ? friendlyFallback
        : friendlyFallback;
      setError(isQuotaError || isGeminiError ? null : msg);
      const botFallback = { id: (Date.now() + 1).toString(), role: "bot", text: msg, time: formatTime() };
      setMessages((m) => [...m, botFallback]);
      if (modeRef.current === "voice" && hasVoiceKey) {
        setIsSpeaking(true);
        try {
          await speakWithElevenLabs(msg, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
          });
        } catch { setIsSpeaking(false); }
      }
    } finally {
      setLoading(false);
      if (modeRef.current === "text") setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, hasKey, hasVoiceKey]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice input not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (!hasElevenKey()) {
      setVoiceError("Missing ElevenLabs key — add VITE_ELEVENLABS_API_KEY");
      return;
    }
    if (loadingRef.current) {
      setVoiceError("Already thinking — wait a moment");
      return;
    }
    if (isListening) return;
    setVoiceError(null);
    stopSpeaking();
    setIsSpeaking(false);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => {
      console.log("[voice] listening start");
      setIsListening(true);
      setInterim("");
    };
    rec.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interimTranscript += res[0].transcript;
      }
      console.log("[voice] result", { finalTranscript, interimTranscript, results: event.results.length });
      if (interimTranscript) setInterim(interimTranscript);
      if (finalTranscript) {
        setInterim("");
        setIsListening(false);
        try { rec.stop(); } catch {}
        // use ref-based handleSend so we never hit stale closure
        handleSend(finalTranscript.trim(), { fromVoice: true });
      }
    };
    rec.onerror = (e) => {
      console.warn("speech error", e);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setVoiceError("Microphone permission denied — allow mic access and try again.");
      } else if (e.error === "no-speech") {
        setVoiceError("Didn't catch that — tap mic and try again.");
      } else if (e.error !== "aborted") {
        setVoiceError(e.error || "Speech recognition error");
      }
      setIsListening(false);
    };
    rec.onend = () => {
      console.log("[voice] onend, interim:", interim);
      setIsListening(false);
      // Fallback: if we have an interim transcript but never got a final (e.g. user paused), send it
      // This fixes "it reads what I'm saying but never answers" when final never fires
      setInterim((prev) => {
        if (prev && prev.trim().length > 1 && !loadingRef.current) {
          const t = prev.trim();
          console.log("[voice] fallback send from interim:", t);
          // defer so we don't call setState during render
          setTimeout(() => handleSend(t, { fromVoice: true }), 0);
          return "";
        }
        return prev;
      });
    };
    try {
      rec.start();
    } catch (err) {
      setVoiceError(err?.message || "Failed to start mic");
      setIsListening(false);
    }
  }, [isListening, handleSend]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
    // don't clear interim here — onend will handle fallback send
  }, []);

  const toggleListening = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
      return;
    }
    if (isListening) stopListening();
    else startListening();
  };

  const stopVoicePlayback = () => {
    stopSpeaking();
    setIsSpeaking(false);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
  };

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  return (
    <>
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

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Chat with Robb"
        aria-hidden={!open}
        className={`chat-panel ${open ? "is-open" : ""} ${mode === "voice" ? "is-voice" : ""}`}
      >
        <div className="chat-header">
          <div className="flex items-center gap-3 min-w-0">
            <div className="chat-avatar-wrap">
              <ProfileAvatar size={42} />
              <span className={`chat-avatar-dot ${isSpeaking || isListening ? "is-live" : ""}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight text-ink leading-none">Robb Olazo</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink text-paper px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> AI
                </span>
              </div>
              <p className="text-xs text-muted font-mono tracking-wide truncate mt-0.5">
                {isHacker ? "⬢ matrix link · encrypted" : mode === "voice" ? (isSpeaking ? "Speaking…" : isListening ? "Listening…" : hasVoiceKey ? "Voice ready" : "Voice unavailable") : hasKey ? "Online · replies instantly" : "Missing API key"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setOpen(false)} className="chat-icon-btn" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* mode toggle */}
        <div className="chat-modebar" role="tablist" aria-label="Chat mode">
          <button
            role="tab"
            aria-selected={mode === "text"}
            className={`chat-mode-btn ${mode === "text" ? "is-active" : ""}`}
            onClick={() => setMode("text")}
          >
            <span className="chat-mode-dot" />
            Text
          </button>
          <button
            role="tab"
            aria-selected={mode === "voice"}
            className={`chat-mode-btn ${mode === "voice" ? "is-active" : ""}`}
            onClick={() => setMode("voice")}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice
            {!hasVoiceKey && <span className="chat-mode-badge">setup</span>}
          </button>
        </div>

        <div className="chat-sheet-handle" aria-hidden="true" />

        {/* ——— TEXT MODE BODY ——— */}
        {mode === "text" && (
          <>
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
          </>
        )}

        {/* ——— VOICE MODE BODY ——— */}
        {mode === "voice" && (
          <>
            <div className="voice-body">
              {/* memoji stage */}
              <div className={`voice-stage ${isSpeaking ? "is-speaking" : isListening ? "is-listening" : ""}`}>
                <div className="voice-memoji-wrap" aria-hidden="true">
                  <video
                    ref={idleVideoRef}
                    src={MEMOJI_IDLE}
                    loop
                    muted
                    playsInline
                    autoPlay
                    preload="auto"
                    className={`voice-video ${isSpeaking ? "is-hidden" : ""}`}
                  />
                  <video
                    ref={talkingVideoRef}
                    src={MEMOJI_TALKING}
                    loop
                    muted
                    playsInline
                    autoPlay
                    preload="auto"
                    className={`voice-video ${isSpeaking ? "" : "is-hidden"}`}
                  />
                  <div className="voice-memoji-glow" />
                  {/* status ring */}
                  <div className={`voice-ring ${isListening ? "is-listening" : ""} ${isSpeaking ? "is-speaking" : ""}`} />
                </div>

                <div className="voice-status">
                  <span className={`voice-status-dot ${isListening ? "listening" : isSpeaking ? "speaking" : ""}`} />
                  <span className="voice-status-text">
                    {isSpeaking ? "Robb is speaking…" : isListening ? (interim ? `“${interim}”` : "Listening — speak now") : loading ? "Thinking…" : "Tap mic to talk"}
                  </span>
                </div>

                {/* waveform when listening / speaking */}
                {(isListening || isSpeaking || loading) && (
                  <div className="voice-wave" aria-hidden="true">
                    <span /><span /><span /><span /><span />
                  </div>
                )}
              </div>

              {/* transcript / captions */}
              <div className="voice-transcript">
                {!hasVoiceKey && (
                  <div className="voice-alert">
                    <p className="text-xs leading-relaxed">
                      Add <code className="font-mono bg-panel border border-line px-1 py-0.5 rounded">VITE_ELEVENLABS_API_KEY=sk_…</code> to <span className="font-mono">.env.local</span> and restart. Text chat still works.
                    </p>
                  </div>
                )}
                {!voiceSupported && hasVoiceKey && (
                  <div className="voice-alert">
                    Voice input needs Chrome/Edge + microphone permission. TTS will still work for replies.
                  </div>
                )}
                {voiceError && <p className="voice-error">{voiceError}</p>}

                {/* mini conversation */}
                <div className="voice-history">
                  {lastUser && (
                    <div className="voice-history-row user">
                      <span className="voice-history-label">You</span>
                      <p className="voice-history-text">{lastUser.text}</p>
                    </div>
                  )}
                  {lastBot && (
                    <div className="voice-history-row bot">
                      <span className="voice-history-label">Robb</span>
                      <p className="voice-history-text">{lastBot.text}</p>
                    </div>
                  )}
                  {!lastUser && !lastBot && (
                    <p className="voice-empty">Ask about my projects, skills, or how to work together — just tap the mic.</p>
                  )}
                </div>

                {loading && <p className="voice-loading">Generating reply…</p>}
              </div>

              {/* quick voice prompts */}
              {!loading && !isListening && !isSpeaking && (
                <div className="voice-quick">
                  {QUICK_REPLIES.slice(0, 3).map((q) => (
                    <button key={q} type="button" className="voice-chip" onClick={() => handleSend(q)} disabled={loading}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="voice-composer">
              <div className="voice-controls">
                <button
                  type="button"
                  aria-label={isListening ? "Stop listening" : isSpeaking ? "Stop speaking" : "Start voice chat"}
                  onClick={toggleListening}
                  disabled={loading && !isSpeaking && !isListening}
                  className={`voice-mic ${isListening ? "is-listening" : ""} ${isSpeaking ? "is-speaking" : ""} ${loading ? "is-loading" : ""}`}
                >
                  {isSpeaking ? <VolumeX className="w-6 h-6" /> : isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <div className="voice-controls-side">
                  <button
                    type="button"
                    className="voice-secondary"
                    onClick={stopVoicePlayback}
                    disabled={!isSpeaking && !loading}
                    aria-label="Stop playback"
                  >
                    <PhoneOff className="w-4 h-4" /> Stop
                  </button>
                  <span className="voice-hint font-mono">
                    {isListening ? "Tap to stop" : isSpeaking ? "Tap mic to interrupt" : "Hold near mic · speaks as Robb"}
                  </span>
                </div>
              </div>

              {/* text fallback while in voice */}
              <form
                className="voice-text-fallback"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or type here…"
                  className="voice-fallback-input"
                  aria-label="Type message"
                  disabled={loading}
                />
                <button type="submit" className="voice-fallback-send" disabled={loading || !input.trim()} aria-label="Send">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <p className="chat-footnote">{hasVoiceKey ? "ready" : "add key to enable"}</p>
            </div>
          </>
        )}
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
        .chat-panel.is-voice {
          height: min(580px, calc(100dvh - 88px));
          width: min(380px, calc(100vw - 20px));
        }
        @media (max-width: 640px) {
          .chat-panel.is-voice { height: auto; max-height: calc(100dvh - env(safe-area-inset-top)); }
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
        @media (max-width: 640px) {
          .chat-fab { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); }
          .chat-panel, .chat-panel.is-voice {
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
          padding: 12px 14px 10px;
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
        .chat-avatar-dot.is-live {
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.18), 0 0 14px rgba(239,68,68,0.45);
          animation: live-pulse 1.2s ease-in-out infinite;
        }
        @keyframes live-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
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

        .chat-modebar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.38);
          border-bottom: 1px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }
        .theme-dark .chat-modebar { background: rgba(255,255,255,0.05); border-bottom-color: rgba(255,255,255,0.08); }
        .chat-mode-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 9999px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--color-muted);
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
        }
        .chat-mode-btn.is-active {
          background: var(--color-ink);
          color: var(--color-paper);
          border-color: var(--color-ink);
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
        }
        .theme-dark .chat-mode-btn.is-active { background: #fff; color: #0d0d0d; border-color: #fff; }
        .chat-mode-dot {
          width: 7px; height: 7px; border-radius: 9999px; background: currentColor; opacity: 0.9;
        }
        .chat-mode-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 5px;
          border-radius: 9999px;
          background: rgba(239,68,68,0.14);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.18);
        }

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

        /* ── VOICE MODE ── */
        .voice-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 12px 10px;
          background: radial-gradient(110% 60% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 60%), rgba(255,255,255,0.08);
          scrollbar-width: thin;
          scrollbar-color: var(--color-line) transparent;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 640px) {
          .voice-body {
            gap: 10px;
            padding: 10px 12px 8px;
          }
        }
        .theme-dark .voice-body {
          background: radial-gradient(110% 60% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%), rgba(255,255,255,0.03);
        }
        .voice-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 12px 10px 10px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.42);
          background: linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.38) 100%);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.07);
          transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
        }
        @media (max-width: 640px) {
          .voice-stage { padding: 10px 8px 10px; gap: 8px; border-radius: 16px; }
        }
        .voice-stage.is-listening {
          border-color: rgba(239,68,68,0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 8px 28px rgba(239,68,68,0.16);
        }
        .voice-stage.is-speaking {
          border-color: rgba(16,185,129,0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 8px 28px rgba(16,185,129,0.18);
        }
        .theme-dark .voice-stage {
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
          border-color: rgba(255,255,255,0.12);
        }
        .theme-dark .voice-stage.is-listening { border-color: rgba(239,68,68,0.35); }
        .theme-dark .voice-stage.is-speaking { border-color: rgba(16,185,129,0.35); }

        .voice-memoji-wrap {
          position: relative;
          width: 132px;
          height: 132px;
          border-radius: 9999px;
          overflow: hidden;
          background: var(--color-panel);
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
          flex-shrink: 0;
        }
        @media (min-width: 640px) {
          .voice-memoji-wrap { width: 148px; height: 148px; }
        }
        @media (max-width: 640px) {
          .voice-memoji-wrap { width: 108px; height: 108px; }
        }
        .voice-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.18s ease;
          background: var(--color-panel);
          will-change: opacity;
        }
        .voice-video.is-hidden {
          opacity: 0;
          pointer-events: none;
        }
        .voice-memoji-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(60% 60% at 50% 38%, rgba(16,185,129,0.18) 0%, transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .voice-stage.is-speaking .voice-memoji-glow { opacity: 1; }
        .voice-ring {
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 2px solid transparent;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s, border-color 0.3s;
        }
        .voice-ring.is-listening {
          opacity: 1;
          border-color: rgba(239,68,68,0.42);
          animation: voice-ring-pulse 1.6s ease-in-out infinite;
        }
        .voice-ring.is-speaking {
          opacity: 1;
          border-color: rgba(16,185,129,0.42);
          animation: voice-ring-pulse 1.8s ease-in-out infinite;
        }
        @keyframes voice-ring-pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 0.55; }
          100% { transform: scale(1); opacity: 0.9; }
        }

        .voice-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          padding: 6px 12px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.5);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          color: var(--color-ink);
          text-align: center;
          line-height: 1.3;
        }
        .theme-dark .voice-status { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.14); color: #fff; }
        .voice-status-dot {
          width: 8px; height: 8px; border-radius: 9999px; background: var(--color-faint); flex-shrink: 0;
        }
        .voice-status-dot.listening { background: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.16); animation: live-pulse 1s infinite; }
        .voice-status-dot.speaking { background: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.18); animation: live-pulse 1s infinite; }
        .voice-status-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
        @media (max-width: 360px) { .voice-status-text { max-width: 170px; } }

        .voice-wave {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 22px;
        }
        .voice-wave span {
          width: 4px;
          border-radius: 9999px;
          background: var(--color-ink);
          opacity: 0.9;
          animation: voice-bar 0.9s ease-in-out infinite;
        }
        .voice-wave span:nth-child(1) { height: 10px; animation-delay: 0s; }
        .voice-wave span:nth-child(2) { height: 16px; animation-delay: 0.12s; }
        .voice-wave span:nth-child(3) { height: 22px; animation-delay: 0.22s; }
        .voice-wave span:nth-child(4) { height: 14px; animation-delay: 0.1s; }
        .voice-wave span:nth-child(5) { height: 9px; animation-delay: 0.18s; }
        .theme-dark .voice-wave span { background: #fff; }
        @keyframes voice-bar {
          0%, 100% { transform: scaleY(0.55); opacity: 0.7; }
          50% { transform: scaleY(1); opacity: 1; }
        }

        .voice-transcript {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .voice-alert {
          padding: 9px 11px;
          border-radius: 12px;
          border: 1px solid rgba(245,158,11,0.32);
          background: rgba(254,243,199,0.72);
          color: #92400e;
          font-size: 11px;
          font-family: var(--font-mono);
          line-height: 1.45;
        }
        .theme-dark .voice-alert { background: rgba(245,158,11,0.14); border-color: rgba(245,158,11,0.28); color: #fde68a; }
        .voice-error {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          color: #b91c1c;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.4;
        }
        .theme-dark .voice-error { color: #fecaca; background: rgba(239,68,68,0.12); }
        .voice-history {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.42);
          background: rgba(255,255,255,0.48);
          backdrop-filter: blur(10px);
          min-height: 64px;
        }
        .theme-dark .voice-history { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
        .voice-history-row { display: flex; flex-direction: column; gap: 2px; }
        .voice-history-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-faint);
        }
        .voice-history-row.user .voice-history-label { color: var(--color-muted); }
        .voice-history-text {
          font-size: 13px;
          line-height: 1.45;
          color: var(--color-ink);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .theme-dark .voice-history-text { color: #fff; }
        .voice-empty {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--color-muted);
          margin: 2px 0;
        }
        .voice-loading {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-muted);
          animation: chat-typing 1.2s ease-in-out infinite;
        }
        .voice-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .voice-chip {
          font-size: 11.5px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.5);
          color: var(--color-muted);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .theme-dark .voice-chip { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
        .voice-chip:hover { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .voice-chip:disabled { opacity: 0.5; cursor: not-allowed; }

        .voice-composer {
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.46);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .voice-composer { padding: 10px 12px calc(12px + env(safe-area-inset-bottom)); gap: 8px; }
        }
        .theme-dark .voice-composer { background: rgba(255,255,255,0.06); border-top-color: rgba(255,255,255,0.08); }
        .voice-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @media (max-width: 640px) {
          .voice-controls { gap: 10px; }
        }
        .voice-mic {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.5);
          background: var(--color-ink);
          color: var(--color-paper);
          box-shadow: 0 6px 20px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.18);
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1), background 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .theme-dark .voice-mic { background: #fff; color: #0d0d0d; border-color: #fff; }
        .voice-mic:hover:not(:disabled) { transform: scale(1.05); }
        .voice-mic:active:not(:disabled) { transform: scale(0.96); }
        .voice-mic:disabled { opacity: 0.45; cursor: not-allowed; }
        @media (max-width: 640px) {
          .voice-mic { width: 52px; height: 52px; }
        }
        .voice-mic.is-listening {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
          box-shadow: 0 8px 28px rgba(239,68,68,0.36), inset 0 1px 0 rgba(255,255,255,0.18);
          animation: voice-mic-pulse 1.4s ease-in-out infinite;
        }
        .voice-mic.is-speaking {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 8px 28px rgba(16,185,129,0.36);
        }
        @keyframes voice-mic-pulse {
          0%,100% { box-shadow: 0 8px 28px rgba(239,68,68,0.36), 0 0 0 0 rgba(239,68,68,0.22); }
          50% { box-shadow: 0 12px 32px rgba(239,68,68,0.42), 0 0 0 10px rgba(239,68,68,0); }
        }
        .voice-controls-side {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }
        .voice-secondary {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9999px;
          border: 1px solid var(--color-line);
          background: rgba(255,255,255,0.62);
          color: var(--color-ink);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .theme-dark .voice-secondary { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); color: #fff; }
        .voice-secondary:hover:not(:disabled) { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .voice-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
        .voice-hint {
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-faint);
          line-height: 1.3;
        }
        .voice-text-fallback {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 4px 4px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .theme-dark .voice-text-fallback { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
        .voice-fallback-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          color: var(--color-ink);
        }
        .theme-dark .voice-fallback-input { color: #fff; }
        .voice-fallback-input::placeholder { color: var(--color-faint); }
        .voice-fallback-send {
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          background: var(--color-ink);
          color: var(--color-paper);
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .theme-dark .voice-fallback-send { background: #fff; color: #0d0d0d; }
        .voice-fallback-send:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (prefers-reduced-motion: reduce) {
          .chat-panel, .chat-fab, .voice-video, .voice-ring { transition: none !important; animation: none !important; }
          .chat-fab-pulse, .voice-wave span { animation: none !important; }
        }
      `}</style>
    </>
  );
}
