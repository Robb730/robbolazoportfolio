const WORDS = ["Developer", "Builder", "Designer", "Problem Solver"];

export default function Marquee() {
  const track = [...WORDS, ...WORDS, ...WORDS, ...WORDS];

  return (
    <div className="relative bg-ink text-paper py-4 overflow-hidden border-y border-ink">
      <div className="relative z-10 marquee-track flex whitespace-nowrap font-mono text-sm tracking-[0.15em] uppercase">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {track.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                {word}
                <span className="mx-6 opacity-50">&middot;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}