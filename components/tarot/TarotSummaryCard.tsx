import { CATEGORIES, type StanceEntry } from '@/lib/categories'

interface TarotSummaryCardProps {
  entries: StanceEntry[]
}

export default function TarotSummaryCard({ entries }: TarotSummaryCardProps) {
  return (
    <div
      className="w-full max-w-md mx-auto aspect-[4/5] relative overflow-hidden"
      style={{
        background: '#0E0E0E',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Double-line frame */}
      <div
        className="absolute inset-[6px] pointer-events-none z-10"
        style={{ border: '1px solid rgba(247, 245, 240, 0.08)', borderRadius: 'var(--radius-sm)' }}
      />
      <div
        className="absolute inset-[10px] pointer-events-none z-10"
        style={{ border: '1px solid rgba(247, 245, 240, 0.04)', borderRadius: 'var(--radius-sm)' }}
      />

      {/* Corner ornaments */}
      <div className="absolute top-2 left-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
      <div className="absolute top-2 right-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
      <div className="absolute bottom-2 left-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
      <div className="absolute bottom-2 right-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>

      <div className="relative z-10 flex flex-col h-full px-6 py-6">
        {/* Heading */}
        <div className="text-center mb-4">
          <h2
            className="font-display text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: '#F7F5F0' }}
          >
            YOUR READING
          </h2>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.15em] mt-1"
            style={{ color: 'rgba(247, 245, 240, 0.4)' }}
          >
            &ldquo;6 hills I will die on&rdquo;
          </p>
        </div>

        {/* Mini category icons grid */}
        <div className="grid grid-cols-6 gap-2 mb-4 px-2">
          {CATEGORIES.map((cat, i) => {
            const entry = entries[i]
            return (
              <div
                key={cat.name}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base"
                  style={{
                    border: `1px solid ${cat.color}`,
                    borderRadius: 'var(--radius-sm)',
                    color: cat.color,
                    background: `color-mix(in srgb, ${cat.color} 8%, transparent)`,
                  }}
                >
                  {cat.symbol}
                </div>
                <span
                  className="font-mono text-[7px] uppercase tracking-wider"
                  style={{ color: 'rgba(247, 245, 240, 0.3)' }}
                >
                  {cat.romanNumeral}
                </span>
                {entry && (
                  <span
                    className="font-mono text-[7px] font-bold"
                    style={{
                      color: entry.stance === 'agree' ? 'var(--agree)' : 'var(--disagree)',
                    }}
                  >
                    {entry.stance === 'agree' ? 'YES' : 'NO'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div
          className="mx-4 mb-3"
          style={{ borderTop: '1px solid rgba(247, 245, 240, 0.08)' }}
        />

        {/* All 6 opinions */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {entries.map((entry, i) => (
            <div
              key={entry.take.id}
              className="flex items-start gap-2"
            >
              <span
                className="font-mono text-[9px] font-bold mt-0.5 px-1.5 py-0.5 shrink-0"
                style={{
                  borderRadius: '2px',
                  background: entry.stance === 'agree' ? 'var(--agree)' : 'var(--disagree)',
                  color: 'white',
                }}
              >
                {entry.stance === 'agree' ? 'YES' : 'NO'}
              </span>
              <p
                className="text-[11px] leading-snug line-clamp-2"
                style={{ color: 'rgba(247, 245, 240, 0.75)' }}
              >
                &ldquo;{entry.take.statement}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* Branding footer */}
        <div className="pt-3 mt-auto">
          <p
            className="font-mono text-[8px] uppercase tracking-[0.2em] text-center"
            style={{ color: 'rgba(247, 245, 240, 0.25)' }}
          >
            · · · stancemachine.com · · ·
          </p>
        </div>
      </div>
    </div>
  )
}
