import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Maximize,
  Minimize,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
 * Résumé viewer
 *
 * • Renders the PDF with pdf.js onto HiDPI canvases (same result on desktop,
 *   iOS and Android — the browser's built-in PDF frame is unreliable on mobile).
 * • pdf.js is code-split: it's only downloaded when the viewer is first needed
 *   (or when the context menu opens and dispatches `resume:prefetch`).
 * • The parsed document is cached for the whole session → reopening is instant.
 * • Pages render lazily (IntersectionObserver), off-screen first, then swapped
 *   in so zooming never flashes blank.
 * • Selectable text + clickable links from the PDF are preserved.
 * • Zoom (buttons, + / − / 0 keys, Ctrl/⌘ + wheel), page indicator, prev/next,
 *   fullscreen (F), focus trap, focus restore, animated open/close.
 * • If pdf.js fails to load, falls back to the native <iframe> preview.
 *
 * Open from anywhere:   window.dispatchEvent(new CustomEvent("resume:open"))
 * Warm the cache:       window.dispatchEvent(new Event("resume:prefetch"))
 * ──────────────────────────────────────────────────────────────────────────── */

const RESUME_URL = "/resume.pdf";
const DOWNLOAD_NAME = "Robb-Olazo-Resume.pdf";
const RESUME_OPEN_EVENT = "resume:open";
const RESUME_PREFETCH_EVENT = "resume:prefetch";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const ZOOM_MIN = ZOOM_STEPS[0];
const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1];
const MAX_DPR = 2.5; // crisp on retina without blowing up canvas memory
const CLOSE_MS = 180;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ── document loader (module-level so it survives close/open) ────────────── */

let docPromise = null;
const progressListeners = new Set();

function loadResume() {
  if (docPromise) return docPromise;
  docPromise = (async () => {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      import("pdfjs-dist/web/pdf_viewer.css"), // text-layer styles
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ url: RESUME_URL });
    task.onProgress = ({ loaded, total }) => {
      if (total) progressListeners.forEach((fn) => fn(loaded / total));
    };
    const pdf = await task.promise;
    return { pdf, pdfjs };
  })();
  // allow a retry after a failure
  docPromise.catch(() => {
    docPromise = null;
  });
  return docPromise;
}

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ── single page ─────────────────────────────────────────────────────────── */

function PdfPage({ pdf, pdfjs, num, width, defaultRatio, scrollRoot }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textRef = useRef(null);

  const [near, setNear] = useState(num <= 2);
  const [pageProxy, setPageProxy] = useState(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [links, setLinks] = useState([]);
  const [painted, setPainted] = useState(false);

  // canvas is re-rendered only after the width settles; until then it is
  // simply stretched by CSS, which feels instant while zooming.
  const renderWidth = useDebounced(width, 140);

  // start loading a page shortly before it scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { root: scrollRoot.current, rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, scrollRoot]);

  // fetch page + link annotations
  useEffect(() => {
    if (!near) return;
    let alive = true;
    (async () => {
      const p = await pdf.getPage(num);
      if (!alive) return;
      const vp = p.getViewport({ scale: 1 });
      setRatio(vp.width / vp.height);
      setPageProxy(p);
      try {
        const annots = await p.getAnnotations({ intent: "display" });
        if (!alive) return;
        const out = [];
        for (const a of annots) {
          const url = a.url || a.unsafeUrl;
          if (a.subtype !== "Link" || !url) continue;
          if (!/^(https?:|mailto:|tel:)/i.test(url)) continue;
          const [x1, y1, x2, y2] = vp.convertToViewportRectangle(a.rect);
          out.push({
            url,
            x: (Math.min(x1, x2) / vp.width) * 100,
            y: (Math.min(y1, y2) / vp.height) * 100,
            w: (Math.abs(x2 - x1) / vp.width) * 100,
            h: (Math.abs(y2 - y1) / vp.height) * 100,
          });
        }
        setLinks(out);
      } catch {
        /* links are a nice-to-have */
      }
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [near, pdf, num]);

  // paint (offscreen → swap) + text layer
  useEffect(() => {
    if (!pageProxy || !renderWidth) return;
    let cancelled = false;
    let task = null;
    let textLayer = null;

    (async () => {
      const base = pageProxy.getViewport({ scale: 1 });
      const scale = renderWidth / base.width;
      const viewport = pageProxy.getViewport({ scale });
      const out = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      const off = document.createElement("canvas");
      off.width = Math.floor(viewport.width * out);
      off.height = Math.floor(viewport.height * out);
      const ctx = off.getContext("2d", { alpha: false });

      task = pageProxy.render({
        canvasContext: ctx,
        canvas: off,
        viewport,
        transform: out !== 1 ? [out, 0, 0, out, 0, 0] : undefined,
      });
      await task.promise;
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = off.width;
      canvas.height = off.height;
      canvas.getContext("2d", { alpha: false }).drawImage(off, 0, 0);
      setPainted(true);

      const host = textRef.current;
      if (!host) return;
      host.replaceChildren();
      host.style.setProperty("--scale-factor", String(scale));
      textLayer = new pdfjs.TextLayer({
        textContentSource: pageProxy.streamTextContent(),
        container: host,
        viewport,
      });
      await textLayer.render();
    })().catch((err) => {
      if (err?.name === "RenderingCancelledException") return;
      if (!cancelled) console.warn("[ResumeViewer] page render failed", err);
    });

    return () => {
      cancelled = true;
      try {
        task?.cancel();
        textLayer?.cancel();
      } catch {
        /* already finished */
      }
    };
  }, [pageProxy, renderWidth, pdfjs]);

  return (
    <div
      ref={wrapRef}
      data-page={num}
      className={`resume-page${painted ? "" : " is-loading"}`}
      style={{ width, aspectRatio: String(ratio) }}
    >
      <canvas ref={canvasRef} className="resume-canvas" aria-hidden="true" />
      <div ref={textRef} className="textLayer resume-text" />
      {links.map((l, i) => (
        <a
          key={i}
          className="resume-link"
          href={l.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={l.url}
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: `${l.w}%`,
            height: `${l.h}%`,
          }}
        />
      ))}
    </div>
  );
}

/* ── viewer ──────────────────────────────────────────────────────────────── */

export default function ResumeViewer() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [doc, setDoc] = useState(null); // { pdf, pdfjs }
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [defaultRatio, setDefaultRatio] = useState(8.5 / 11);

  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const [boxWidth, setBoxWidth] = useState(0);

  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const closeRef = useRef(null);
  const closeTimer = useRef(0);
  const closingRef = useRef(false);
  const anchorRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const lastWidthRef = useRef(0);

  const numPages = doc?.pdf.numPages ?? 0;

  /* open / prefetch events */
  useEffect(() => {
    const onOpen = () => {
      clearTimeout(closeTimer.current);
      closingRef.current = false;
      setClosing(false);
      setFullscreen(false);
      setZoom(1);
      setCurrent(1);
      lastWidthRef.current = 0;
      setOpen(true);
    };
    const onPrefetch = () => {
      loadResume().catch(() => {});
    };
    window.addEventListener(RESUME_OPEN_EVENT, onOpen);
    window.addEventListener(RESUME_PREFETCH_EVENT, onPrefetch);
    return () => {
      window.removeEventListener(RESUME_OPEN_EVENT, onOpen);
      window.removeEventListener(RESUME_PREFETCH_EVENT, onPrefetch);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closingRef.current = false;
    }, CLOSE_MS);
  }, []);

  /* load the document when opened */
  useEffect(() => {
    if (!open || doc) return;
    let alive = true;
    setStatus("loading");
    setProgress(0);
    const onProgress = (p) => alive && setProgress(p);
    progressListeners.add(onProgress);

    loadResume()
      .then(async (d) => {
        const first = await d.pdf.getPage(1);
        if (!alive) return;
        const vp = first.getViewport({ scale: 1 });
        setDefaultRatio(vp.width / vp.height);
        setDoc(d);
        setStatus("idle");
      })
      .catch((err) => {
        console.warn("[ResumeViewer] pdf.js failed, using native preview", err);
        if (alive) setStatus("error");
      });

    return () => {
      alive = false;
      progressListeners.delete(onProgress);
    };
  }, [open, doc, attempt]);

  /* body scroll lock + focus management */
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus?.({ preventScroll: true }), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  /* measure the scroll area */
  useLayoutEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    setBoxWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const stepZoom = useCallback((dir) => {
    setZoom((z) => {
      if (dir > 0) return ZOOM_STEPS.find((s) => s > z + 0.01) ?? z;
      return [...ZOOM_STEPS].reverse().find((s) => s < z - 0.01) ?? z;
    });
  }, []);

  const goToPage = useCallback((n) => {
    const root = scrollRef.current;
    const el = root?.querySelector(`[data-page="${n}"]`);
    if (!root || !el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({ top: el.offsetTop - 12, behavior: reduce ? "auto" : "smooth" });
  }, []);

  /* keyboard: Esc, zoom, fullscreen, focus trap */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const nodes = panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (!panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        stepZoom(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        stepZoom(-1);
      } else if (e.key === "0") {
        setZoom(1);
      } else if (e.key === "f" || e.key === "F") {
        setFullscreen((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, stepZoom]);

  /* Ctrl/⌘ + wheel (and trackpad pinch) to zoom */
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp(z * Math.exp(-e.deltaY * 0.0025), ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  /* layout maths */
  const pad = boxWidth < 640 ? 16 : 32;
  const maxFit = fullscreen ? 1100 : 880;
  const fitWidth = Math.max(0, Math.min(maxFit, boxWidth - pad));
  const pageWidth = Math.round(fitWidth * zoom);

  /* keep the viewport centred on the same spot when the zoom changes */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !pageWidth) return;
    if (lastWidthRef.current && lastWidthRef.current !== pageWidth) {
      const { x, y } = anchorRef.current;
      el.scrollTop = y * el.scrollHeight - el.clientHeight / 2;
      el.scrollLeft = x * el.scrollWidth - el.clientWidth / 2;
    }
    lastWidthRef.current = pageWidth;
  }, [pageWidth]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    anchorRef.current = {
      x: el.scrollWidth ? (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth : 0,
      y: el.scrollHeight ? (el.scrollTop + el.clientHeight / 2) / el.scrollHeight : 0,
    };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const root = scrollRef.current;
      if (!root) return;
      const mid = root.scrollTop + root.clientHeight * 0.4;
      let cur = 1;
      root.querySelectorAll("[data-page]").forEach((p) => {
        if (p.offsetTop <= mid) cur = Number(p.dataset.page);
      });
      setCurrent(cur);
    });
  };

  if (!open) return null;

  const ready = !!doc && pageWidth > 0;
  const pct = Math.round(zoom * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Résumé — Robb Olazo"
      className={`resume-overlay${fullscreen ? " is-fullscreen" : ""}${closing ? " is-closing" : ""}`}
      onClick={close}
    >
      <div
        ref={panelRef}
        className={`resume-panel${fullscreen ? " is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="resume-head">
          <div className="resume-title">
            <span className="resume-icon">
              <FileText className="w-4 h-4" />
            </span>
            <div className="min-w-0 hidden sm:block">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-faint">Résumé</p>
              <p className="font-display text-sm text-ink truncate">Robb Olazo — IT Intern</p>
            </div>
          </div>

          <div className="resume-actions">
            {numPages > 1 && (
              <div className="resume-group" role="group" aria-label="Pages">
                <button
                  type="button"
                  className="resume-btn resume-btn-flat"
                  onClick={() => goToPage(Math.max(1, current - 1))}
                  disabled={current <= 1}
                  aria-label="Previous page"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <span className="resume-readout" aria-live="polite">
                  {current} / {numPages}
                </span>
                <button
                  type="button"
                  className="resume-btn resume-btn-flat"
                  onClick={() => goToPage(Math.min(numPages, current + 1))}
                  disabled={current >= numPages}
                  aria-label="Next page"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="resume-group" role="group" aria-label="Zoom">
              <button
                type="button"
                className="resume-btn resume-btn-flat"
                onClick={() => stepZoom(-1)}
                disabled={zoom <= ZOOM_MIN + 0.01}
                aria-label="Zoom out"
                title="Zoom out (−)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="resume-readout resume-readout-btn"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                title="Reset zoom (0)"
              >
                {pct}%
              </button>
              <button
                type="button"
                className="resume-btn resume-btn-flat"
                onClick={() => stepZoom(1)}
                disabled={zoom >= ZOOM_MAX - 0.01}
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={RESUME_URL}
              download={DOWNLOAD_NAME}
              className="resume-btn"
              aria-label="Download résumé"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Download</span>
            </a>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noreferrer"
              className="resume-btn resume-hide-sm"
              aria-label="Open résumé in new tab"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="resume-btn resume-hide-sm"
              aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
              title={fullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {fullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="resume-btn resume-close"
              aria-label="Close résumé viewer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* document */}
        <div className="resume-body">
          {status === "loading" && (
            <div
              className={`resume-progress${progress > 0 ? "" : " is-indeterminate"}`}
              role="progressbar"
              aria-label="Loading résumé"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress > 0 ? Math.round(progress * 100) : undefined}
            >
              <span style={progress > 0 ? { width: `${Math.round(progress * 100)}%` } : undefined} />
            </div>
          )}

          <div
            ref={scrollRef}
            className="resume-scroll"
            onScroll={onScroll}
            tabIndex={0}
            aria-label="Résumé pages"
          >
            <div className="resume-stack">
              {ready ? (
                Array.from({ length: numPages }, (_, i) => (
                  <PdfPage
                    key={i + 1}
                    pdf={doc.pdf}
                    pdfjs={doc.pdfjs}
                    num={i + 1}
                    width={pageWidth}
                    defaultRatio={defaultRatio}
                    scrollRoot={scrollRef}
                  />
                ))
              ) : (
                <div
                  className="resume-page is-loading"
                  style={{
                    width: fitWidth || undefined,
                    aspectRatio: String(defaultRatio),
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          {status === "error" && (
            <iframe src={RESUME_URL} title="Robb Olazo résumé" className="resume-frame" />
          )}
        </div>

        {/* footer */}
        <p className="resume-foot">
          {status === "error" ? (
            <>
              <span>Showing your browser’s preview.</span>
              <span className="resume-foot-links">
                <button type="button" onClick={() => { setStatus("idle"); setAttempt((n) => n + 1); }}>
                  Try again
                </button>
                <a href={RESUME_URL} download={DOWNLOAD_NAME}>Download the PDF</a>
              </span>
            </>
          ) : (
            <>
              <span className="resume-hint">Ctrl + scroll to zoom · F for fullscreen · Esc to close</span>
              <span className="resume-foot-links">
                <a href={RESUME_URL} download={DOWNLOAD_NAME}>Not loading? Download the PDF</a>
              </span>
            </>
          )}
        </p>
      </div>

      <style>{`
        .resume-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
          background: rgba(13, 13, 13, 0.55);
          backdrop-filter: blur(18px) saturate(150%);
          -webkit-backdrop-filter: blur(18px) saturate(150%);
          animation: resume-in 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .resume-overlay.is-fullscreen {
          padding: max(6px, env(safe-area-inset-top)) 6px max(6px, env(safe-area-inset-bottom));
        }
        .resume-overlay.is-closing { animation: resume-out ${CLOSE_MS}ms ease forwards; }
        .resume-overlay.is-closing .resume-panel { animation: resume-panel-out ${CLOSE_MS}ms ease forwards; }

        .resume-panel {
          display: flex;
          flex-direction: column;
          width: min(960px, 100%);
          height: min(88dvh, 880px);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(26px) saturate(185%);
          -webkit-backdrop-filter: blur(26px) saturate(185%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          box-shadow:
            0 32px 88px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          animation: resume-panel-in 0.38s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .resume-panel.is-fullscreen { width: 100%; height: 100%; }

        @keyframes resume-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes resume-out { to { opacity: 0; } }
        @keyframes resume-panel-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes resume-panel-out {
          to { opacity: 0; transform: translateY(8px) scale(0.99); }
        }

        /* header */
        .resume-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-line);
          background: rgba(255, 255, 255, 0.5);
        }
        .resume-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .resume-icon {
          width: 34px; height: 34px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--color-ink);
          background: var(--color-ink);
          color: var(--color-paper);
          flex-shrink: 0;
        }
        .resume-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
        .resume-group {
          display: inline-flex; align-items: stretch;
          border: 1px solid var(--color-line);
          background: rgba(255, 255, 255, 0.6);
        }
        .resume-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          font-family: var(--font-mono);
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--color-muted);
          border: 1px solid var(--color-line);
          background: rgba(255, 255, 255, 0.6);
          padding: 8px 10px;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }
        .resume-btn-flat { border: 0; background: transparent; padding: 8px 8px; }
        .resume-btn:hover:not(:disabled) { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .resume-btn:disabled { opacity: 0.35; cursor: default; }
        .resume-btn:focus-visible,
        .resume-readout-btn:focus-visible,
        .resume-scroll:focus-visible,
        .resume-link:focus-visible,
        .resume-foot a:focus-visible,
        .resume-foot button:focus-visible {
          outline: 2px solid var(--color-ink);
          outline-offset: 2px;
        }
        .resume-readout {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 46px;
          padding: 0 6px;
          font-family: var(--font-mono);
          font-size: 10px; letter-spacing: 0.08em;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
          border: 0; background: transparent;
          border-left: 1px solid var(--color-line);
          border-right: 1px solid var(--color-line);
        }
        .resume-readout-btn { cursor: pointer; }
        .resume-readout-btn:hover { background: rgba(0, 0, 0, 0.05); }

        /* body */
        .resume-body {
          flex: 1;
          min-height: 0;
          position: relative;
          background: #525659;
        }
        .resume-scroll {
          position: absolute;
          inset: 0;
          overflow: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-x pan-y pinch-zoom;
        }
        .resume-stack {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: max-content;
          min-width: 100%;
          padding: 16px;
        }
        .resume-frame {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          border: 0;
          background: #ffffff;
        }

        .resume-page {
          position: relative;
          flex: none;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), 0 12px 32px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .resume-canvas {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          display: block;
        }
        .resume-text { z-index: 1; }
        .resume-link {
          position: absolute;
          z-index: 2;
          display: block;
          border-radius: 2px;
          transition: background 0.15s ease;
        }
        .resume-link:hover { background: rgba(60, 120, 255, 0.14); }

        .resume-page.is-loading::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent 30%, rgba(0, 0, 0, 0.06) 50%, transparent 70%);
          background-size: 250% 100%;
          animation: resume-shimmer 1.4s linear infinite;
          pointer-events: none;
        }
        @keyframes resume-shimmer {
          from { background-position: 150% 0; }
          to { background-position: -100% 0; }
        }

        .resume-progress {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px; z-index: 5;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }
        .resume-progress > span {
          display: block; height: 100%;
          background: #ffffff;
          transition: width 0.2s ease;
        }
        .resume-progress.is-indeterminate > span {
          width: 35%;
          animation: resume-indeterminate 1.1s ease-in-out infinite;
        }
        @keyframes resume-indeterminate {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }

        /* footer */
        .resume-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 8px 14px;
          border-top: 1px solid var(--color-line);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-faint);
          background: rgba(255, 255, 255, 0.5);
        }
        .resume-foot-links { display: inline-flex; gap: 14px; margin-left: auto; }
        .resume-foot a,
        .resume-foot button {
          color: var(--color-ink);
          background: none; border: 0; padding: 0;
          font: inherit; letter-spacing: inherit; text-transform: inherit;
          cursor: pointer;
        }
        .resume-foot a:hover,
        .resume-foot button:hover { text-decoration: underline; }

        /* themes */
        .theme-dark .resume-panel {
          background: rgba(20, 20, 22, 0.82);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 32px 88px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .theme-dark .resume-head, .theme-dark .resume-foot { background: rgba(255,255,255,0.04); }
        .theme-dark .resume-btn, .theme-dark .resume-group { background: rgba(255,255,255,0.06); }
        .theme-dark .resume-btn-flat { background: transparent; }
        .theme-dark .resume-btn:hover:not(:disabled) { background: #ffffff; color: #0d0d0d; border-color: #ffffff; }
        .theme-dark .resume-readout-btn:hover { background: rgba(255,255,255,0.08); }
        .theme-dark .resume-body { background: #1b1c1e; }
        .theme-dark .resume-btn:focus-visible,
        .theme-dark .resume-readout-btn:focus-visible,
        .theme-dark .resume-scroll:focus-visible { outline-color: #ffffff; }

        .theme-hacker .resume-panel {
          background: rgba(6, 20, 12, 0.86);
          border-color: rgba(0, 255, 136, 0.28);
          box-shadow: 0 32px 88px rgba(0, 0, 0, 0.5), 0 0 32px rgba(0,255,136,0.16);
        }
        .theme-hacker .resume-head, .theme-hacker .resume-foot { background: rgba(0,255,136,0.05); }
        .theme-hacker .resume-group { background: rgba(0,255,136,0.04); }
        .theme-hacker .resume-btn-flat { background: transparent; }
        .theme-hacker .resume-icon { background: #00ff88; border-color: #00ff88; color: #010a05; }
        .theme-hacker .resume-btn:hover:not(:disabled) { background: #00ff88; color: #010a05; border-color: #00ff88; }
        .theme-hacker .resume-body { background: #04110a; }
        .theme-hacker .resume-progress > span { background: #00ff88; }
        .theme-hacker .resume-btn:focus-visible,
        .theme-hacker .resume-readout-btn:focus-visible,
        .theme-hacker .resume-scroll:focus-visible { outline-color: #00ff88; }

        /* small screens */
        @media (max-width: 640px) {
          .resume-overlay { padding: 8px 8px max(8px, env(safe-area-inset-bottom)); }
          .resume-panel { height: 94dvh; }
          .resume-panel.is-fullscreen { height: 100%; }
          .resume-head { padding: 8px 10px; }
          .resume-title { display: none; }
          .resume-actions { gap: 6px; width: 100%; margin-left: 0; justify-content: space-between; }
          .resume-hide-sm, .resume-hint { display: none; }
          .resume-stack { padding: 8px; }
          .resume-readout { min-width: 40px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .resume-overlay, .resume-panel { animation: none !important; transition: none !important; }
          .resume-page.is-loading::after,
          .resume-progress.is-indeterminate > span { animation: none !important; }
        }
      `}</style>
    </div>
  );
}