import { useState } from "react";
import { ArrowUpRight, Award, BadgeCheck, ShieldCheck } from "lucide-react";

const CERTIFICATES = [
  {
    id: "goldgear-2425",
    title: "Gold Gear Award — A.Y. 2024–2025",
    issuer: "Bulacan State University — Bustos Campus",
    year: "2025",
    category: "tech",
    type: "award",
    image: "/awards-and-certs/goldgear-2024-2025.png",
    verifyUrl: "#",
  },
  {
    id: "goldgear-2526",
    title: "Gold Gear Award — A.Y. 2025–2026",
    issuer: "Bulacan State University — Bustos Campus",
    year: "2026",
    category: "tech",
    type: "award",
    image: "/awards-and-certs/goldgear-2025-2026.png",
    verifyUrl: "#",
  },
  {
    id: "cisco",
    title: "Cisco Packet Tracer — Networking Fundamentals",
    issuer: "Cisco Networking Academy",
    year: "2024",
    category: "tech",
    type: "certificate",
    image: "/awards-and-certs/cisco.png",
    verifyUrl: "https://www.netacad.com",
  },
  {
    id: "brewtiful",
    title: "Certificate of System Deployment — Brewtiful-U",
    issuer: "Brewtiful-U Salon & Café",
    year: "2026",
    category: "tech",
    type: "certificate",
    image: "/awards-and-certs/brewtiful-cet.png",
    verifyUrl: "#",
  },
  {
    id: "ja-finlit",
    title: "Financial Literacy",
    issuer: "Junior Achievement Philippines",
    year: "2022",
    category: "business",
    type: "certificate",
    image: "/awards-and-certs/money.png",
    verifyUrl: "#",
  },
  {
    id: "ja-pm",
    title: "Project Management",
    issuer: "Junior Achievement Philippines",
    year: "2022",
    category: "business",
    type: "certificate",
    image: "/awards-and-certs/projman.png",
    verifyUrl: "#",
  },
  {
    id: "ja-sales",
    title: "Sales & Strategy",
    issuer: "Junior Achievement Philippines",
    year: "2022",
    category: "business",
    type: "certificate",
    image: "/awards-and-certs/sales.png",
    verifyUrl: "#",
  },
];

function CertThumb({ cert, isHovered }) {
  const [errored, setErrored] = useState(false);
  const showImage = cert.image && !errored;
  const isAward = cert.type === "award";
  return (
    <div className="relative w-full h-full bg-panel overflow-hidden">
      {/* Uniform placeholder — fades out on hover to reveal clean original */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-panel transition-opacity duration-300 ease-out"
        style={{ opacity: isHovered && showImage ? 0 : 1 }}
        aria-hidden={isHovered && showImage}
      >
        <div className="pointer-events-none absolute inset-0 placeholder-pattern opacity-[0.4]" />
        <div
          className={`relative z-10 w-12 h-12 rounded-full border flex items-center justify-center mb-3 ${
            isAward ? "border-ink text-ink" : "border-line text-muted"
          }`}
        >
          {isAward ? <Award className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <p className="relative z-10 font-display text-ink text-sm leading-tight max-w-[16ch]">{cert.issuer}</p>
        <p className="relative z-10 font-mono text-[9px] tracking-[0.16em] uppercase text-faint mt-2">{cert.year}</p>
      </div>
      {/* Actual image — fades in on hover; clean original with no text overlay */}
      {showImage && (
        <img
          src={cert.image}
          alt={`${cert.title} — ${cert.issuer}`}
          className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: isHovered ? 1 : 0 }}
          onError={() => setErrored(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

export default function Certificates() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      <style>{`
        .cert-card {
          border: 1px solid var(--color-line);
          background: var(--color-paper);
          transition: border-color 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease;
        }
        .cert-card:hover {
          border-color: var(--color-ink);
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.08);
        }
        .theme-dark .cert-card:hover { box-shadow: 0 14px 36px rgba(0,0,0,0.4); }
        @media (max-width: 640px) { .cert-card:hover { transform: none; } .cert-card:active { border-color: var(--color-ink); } }
      `}</style>

      <section
        id="certificates"
        className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-10 border-t border-line bg-panel overflow-hidden"
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* header */}
          <div className="flex flex-col gap-5 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faint">Recognition</p>
                <span className="h-px w-6 sm:w-8 bg-line hidden sm:block" />
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-faint">
                  {String(CERTIFICATES.length).padStart(2, "0")} ITEMS
                </span>
              </div>
              <h2 className="font-display font-semibold text-[1.75rem] sm:text-[clamp(1.75rem,4vw,2.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
                Certificates &amp; <span className="italic font-normal">awards.</span>
              </h2>
              <p className="text-muted text-[13px] sm:text-sm leading-relaxed mt-2 sm:mt-3 max-w-xl">
                Uniform cards at rest — hover to reveal the actual certificate.
              </p>
            </div>

          </div>

          {/* grid — no filtering, all 7 visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {CERTIFICATES.map((cert, i) => {
              const isAward = cert.type === "award";
              const isHovered = hoveredId === cert.id;
              const isLink = cert.verifyUrl !== "#";
              const Card = isLink ? "a" : "div";
              return (
                <article
                  key={cert.id}
                  data-reveal
                  className="reveal group"
                  style={{ transitionDelay: `${i * 70}ms` }}
                  onMouseEnter={() => setHoveredId(cert.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(cert.id)}
                  onBlur={() => setHoveredId(null)}
                >
                  <Card
                    {...(isLink
                      ? { href: cert.verifyUrl, target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="cert-card block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                    aria-label={`${cert.title} — ${cert.issuer}`}
                  >
                    {/* screenshot — uniform placeholder, image fades in on hover */}
                    <div className="relative aspect-[4/3] border-b border-line overflow-hidden">
                      <div className={`absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isHovered ? "scale-[1.03]" : "scale-100"}`}>
                        <CertThumb cert={cert} isHovered={isHovered} />
                      </div>
                      <span
                        className={`absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] uppercase text-muted bg-paper/90 border border-line backdrop-blur px-2 py-1 transition-opacity duration-300 ${
                          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                      >
                        {isAward ? <Award className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                        {isAward ? "Award" : "Certificate"}
                      </span>
                      <span
                        className={`absolute top-2.5 right-2.5 z-10 font-mono text-[9px] tracking-[0.12em] uppercase text-faint bg-paper/90 border border-line backdrop-blur px-2 py-1 transition-opacity duration-300 ${
                          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                      >
                        {cert.category === "tech" ? "Tech" : "Business"}
                      </span>
                      {isLink && (
                        <span
                          aria-hidden="true"
                          className={`absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] uppercase bg-ink text-paper px-2 py-1 border border-ink transition-all duration-200 ${
                            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                          }`}
                        >
                          Verify <ArrowUpRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* meta */}
                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] sm:text-[11px] text-faint uppercase tracking-wider">
                          {cert.year} · {cert.issuer}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`shrink-0 w-7 h-7 inline-flex items-center justify-center border transition-all duration-200 ${
                            isHovered ? "bg-ink text-paper border-ink rotate-0" : "bg-panel text-muted border-line -rotate-45"
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-[15px] sm:text-base leading-snug tracking-[-0.01em] text-ink mt-1.5">
                        {cert.title}
                      </h3>
                    </div>
                  </Card>
                </article>
              );
            })}
          </div>

          {/* footer note */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-line pt-5 sm:pt-6">
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-faint text-center sm:text-left">
              Uniform look by design — hover any card to preview.
            </p>
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-faint">Issued 2024 — 2026</span>
          </div>
        </div>
      </section>
    </>
  );
}
