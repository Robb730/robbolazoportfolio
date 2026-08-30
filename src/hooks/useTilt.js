import { useRef, useCallback, useEffect } from "react";

// Minimalist tilt: subtle rotateX/Y + ink-aware glare
// - Desktop only (hover: hover and pointer: fine)
// - Respects prefers-reduced-motion
// - B&W: glare is pure white/black radial, no color
export default function useTilt({ max = 7, scale = 1.02, glare = true } = {}) {
  const ref = useRef(null);
  const glareRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ x: 0, y: 0, gx: 50, gy: 50 });

  const isInteractive = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(hover: none)").matches) return false;
    if (window.innerWidth < 640) return false;
    return true;
  }, []);

  const update = useCallback(
    (rx, ry, gx, gy, immediate = false) => {
      const el = ref.current;
      if (!el) return;
      const apply = () => {
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${scale}, ${scale}, ${scale})`;
        if (glareRef.current) {
          glareRef.current.style.opacity = rx === 0 && ry === 0 ? "0" : "0.11";
          glareRef.current.style.background = `radial-gradient(300px circle at ${gx}% ${gy}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.22) 28%, transparent 62%)`;
        }
      };
      if (immediate) apply();
      else {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(apply);
      }
    },
    [scale]
  );

  const onMove = useCallback(
    (e) => {
      if (!isInteractive()) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const ry = (px - 0.5) * (max * 2);
      const rx = (0.5 - py) * (max * 2);
      stateRef.current = { x: rx, y: ry, gx: px * 100, gy: py * 100 };
      update(rx, ry, px * 100, py * 100);
    },
    [isInteractive, max, update]
  );

  const onLeave = useCallback(() => {
    update(0, 0, 50, 50);
    const el = ref.current;
    if (el) el.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    setTimeout(() => {
      if (ref.current) ref.current.style.transition = "";
    }, 600);
  }, [update]);

  const onEnter = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transition = "transform 0.12s ease-out";
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { ref, glareRef, onMove, onEnter, onLeave, glare };
}
