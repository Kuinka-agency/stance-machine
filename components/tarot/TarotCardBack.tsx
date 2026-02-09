export default function TarotCardBack() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: '#0E0E0E',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Double-line frame */}
      <div
        className="absolute inset-2 pointer-events-none"
        style={{ border: '1px solid rgba(201, 160, 51, 0.2)', borderRadius: 'var(--radius-sm)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '12px',
          border: '1px solid rgba(201, 160, 51, 0.1)',
          borderRadius: 'var(--radius-sm)',
        }}
      />

      {/* Corner ornaments */}
      <div className="tarot-corner-ornament absolute top-3 left-3" style={{ color: 'var(--accent)' }}>◆</div>
      <div className="tarot-corner-ornament absolute top-3 right-3" style={{ color: 'var(--accent)' }}>◆</div>
      <div className="tarot-corner-ornament absolute bottom-3 left-3" style={{ color: 'var(--accent)' }}>◆</div>
      <div className="tarot-corner-ornament absolute bottom-3 right-3" style={{ color: 'var(--accent)' }}>◆</div>

      {/* Geometric crosshatch pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
      >
        {/* Diagonal lines */}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`d1-${i}`}
            x1={i * 10 - 50}
            y1="0"
            x2={i * 10 + 100}
            y2="150"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`d2-${i}`}
            x1={i * 10 + 50}
            y1="0"
            x2={i * 10 - 100}
            y2="150"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Central branding */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center"
          style={{ border: '1px solid rgba(201, 160, 51, 0.3)', borderRadius: '50%' }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>⬡</span>
        </div>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'rgba(201, 160, 51, 0.5)' }}
        >
          Stance Machine
        </span>
      </div>
    </div>
  )
}
