import { useEffect, useRef } from "react";

const COUNT = 22;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeParticle(W, H) {
  return {
    x: rand(0, W),
    y: rand(0, H),
    r: rand(1.2, 3.2),
    vx: rand(-0.18, 0.18),
    vy: rand(-0.15, 0.15),
    alpha: rand(0.14, 0.32),
  };
}

export default function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (REDUCED) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let rafId;
    let particles = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
      particles = Array.from({ length: COUNT }, () =>
        makeParticle(canvas.width, canvas.height)
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // wrap
        if (p.x < -p.r)  p.x = W + p.r;
        if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r)  p.y = H + p.r;
        if (p.y > H + p.r) p.y = -p.r;

        const isDark = document.documentElement.classList.contains("theme-dark");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${p.alpha})` : `rgba(13,13,13,${p.alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    // re-measure page height on resize / route changes
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  if (REDUCED) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
