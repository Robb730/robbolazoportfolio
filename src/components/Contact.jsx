import { useState } from "react";
import { Copy, Check, ArrowUpRight, Code2, Briefcase, Mail, MapPin } from "lucide-react";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const emailAddress = "robbolazo.dev@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const channels = [
    { icon: Mail, label: "Email", value: emailAddress, href: `mailto:${emailAddress}` },
    { icon: Code2, label: "GitHub", value: "github.com/Robb730", href: "https://github.com/Robb730" },
    { icon: Briefcase, label: "LinkedIn", value: "linkedin.com/in/robb-jullian-haaiah-olazo", href: "https://www.linkedin.com/in/robb-jullian-haaiah-olazo-8b6a433bb/" },
  ];

  return (
    <section
      id="contact"
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-10 border-t border-line bg-paper overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* ── Header: headline + description ───── */}
        <div data-reveal className="reveal max-w-3xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <span className="w-8 h-px bg-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faint">Get in touch</p>
          </div>

          <h2 className="font-display font-semibold text-[2rem] sm:text-[3rem] lg:text-[3.5rem] leading-[0.95] tracking-[-0.02em] text-ink">
            Let&apos;s build something
            <span className="italic font-normal text-muted"> worth shipping.</span>
          </h2>

          <p className="text-muted text-[13px] sm:text-sm leading-relaxed mt-4 sm:mt-5 max-w-md">
            Whether it&apos;s a product, a system, or an idea — I&apos;m happy to talk through it. Drop a line and I&apos;ll get back as soon as possible.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2.5 border border-line bg-panel px-3.5 py-2">
              <span className="w-2 h-2 rounded-full bg-ink dot-pulse" />
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
                Available for freelance &amp; full-time
              </span>
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase text-faint">
              <MapPin className="w-3.5 h-3.5" />
              Philippines
            </span>
          </div>
        </div>

        {/* ── Channels (full-width, no empty panel) ─ */}
        <div data-reveal className="reveal mt-8 sm:mt-10" style={{ transitionDelay: "80ms" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 border border-line bg-panel/50 px-4 py-4 hover:border-ink hover:bg-paper transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 inline-flex items-center justify-center border border-line bg-paper text-muted group-hover:bg-ink group-hover:text-paper group-hover:border-ink transition-colors shrink-0">
                    <c.icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">{c.label}</p>
                    <p className="font-display text-sm text-ink truncate">{c.value}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-faint group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>
            ))}
          </div>

          {/* copy row — spans full width */}
          <button
            type="button"
            onClick={handleCopy}
            className="group mt-3 sm:mt-4 w-full flex items-center justify-between gap-4 border border-line bg-paper px-4 py-4 hover:border-ink transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 inline-flex items-center justify-center border border-line bg-panel text-muted group-hover:bg-ink group-hover:text-paper group-hover:border-ink transition-colors shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">Copy email</p>
                <p className="font-display text-sm text-ink truncate">{emailAddress}</p>
              </div>
            </div>
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-faint group-hover:text-ink transition-colors shrink-0 border border-line group-hover:border-ink px-3 py-1.5">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
