'use client'

interface IntroCardProps {
  onContinue: () => void
}

export default function IntroCard({ onContinue }: IntroCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 reveal-up">
      <h2
        className="font-display text-3xl md:text-4xl font-bold mb-4"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
      >
        Your Stance{' '}
        <span style={{ color: 'var(--accent)' }}>Awaits</span>
      </h2>
      <p
        className="text-base md:text-lg mb-10 max-w-md"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
      >
        6 hot takes, one per category. Vote on each to build your Stance Card.
      </p>
      <button
        onClick={onContinue}
        className="px-8 py-4 text-sm uppercase tracking-wider font-mono font-medium transition-all duration-200"
        style={{
          background: 'var(--accent)',
          color: '#0e0e0e',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)'
        }}
      >
        Let's Go
      </button>
    </div>
  )
}
