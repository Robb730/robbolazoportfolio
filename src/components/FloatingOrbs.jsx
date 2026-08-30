export default function FloatingOrbs() {
  return (
    <>
      <div
        aria-hidden="true"
        className="floating-orbs"
      >
        <span className="floating-orb orb-1" />
        <span className="floating-orb orb-2" />
        <span className="floating-orb orb-3" />
      </div>

      <style>{`
        .floating-orbs {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .floating-orb {
          position: absolute;
          border-radius: 9999px;
          /* Light: visible but still soft on white */
          background: #0d0d0d;
          border: none;
          filter: blur(32px);
          -webkit-filter: blur(32px);
          will-change: transform;
          opacity: 0.14;
          transition: background 0.45s ease, opacity 0.45s ease;
        }

        html.theme-dark .floating-orb {
          /* Dark: pure white — subtle on ink */
          background: #ffffff;
          opacity: 0.11;
        }

        /* 3 medium — spaced so they don't stack into rings, medium pace */
        .orb-1 {
          width: 300px;
          height: 300px;
          left: 8%;
          top: 12%;
          animation: drift-1 14s ease-in-out infinite;
        }

        .orb-2 {
          width: 260px;
          height: 260px;
          right: 10%;
          top: 55%;
          animation: drift-2 16s ease-in-out infinite;
        }

        .orb-3 {
          width: 200px;
          height: 200px;
          left: 32%;
          bottom: 14%;
          animation: drift-3 18s ease-in-out infinite;
        }

        @keyframes drift-1 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(48px, -32px) scale(1.03); }
          50%  { transform: translate(-28px, -46px) scale(0.98); }
          75%  { transform: translate(26px, 28px) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes drift-2 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(-42px, 30px) scale(1.02); }
          50%  { transform: translate(34px, -26px) scale(0.99); }
          75%  { transform: translate(-22px, -38px) scale(1.03); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes drift-3 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(32px, -26px) scale(1.04); }
          50%  { transform: translate(-30px, 34px) scale(0.97); }
          75%  { transform: translate(22px, -30px) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* Scale down on small screens */
        @media (max-width: 768px) {
          .floating-orb { filter: blur(24px); -webkit-filter: blur(24px); }
          .orb-1 { width: 220px; height: 220px; left: -6%; top: 8%; }
          .orb-2 { width: 180px; height: 180px; right: -6%; top: 52%; }
          .orb-3 { width: 140px; height: 140px; left: 24%; bottom: 10%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-orb {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
