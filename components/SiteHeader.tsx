'use client'

export default function SiteHeader() {
  return (
    <header className="px-4 sm:px-6 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 reveal-up delay-0">
          <div className="flex items-center gap-3">
            {/* Logomark — bold flame grid */}
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'var(--text-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="#E03E00" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="#F7F5F0" opacity="0.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="#F7F5F0" opacity="0.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#E03E00" />
              </svg>
            </div>
            <span
              className="font-mono text-sm font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              Stance Machine
            </span>
          </div>

          <span
            className="font-mono text-xs hidden sm:block"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Hot Take Generator
          </span>
        </div>

        {/* Editorial divider — top */}
        <hr className="rams-divider mb-8 reveal-up delay-0" />

        {/* Hero text */}
        <div className="max-w-3xl">
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold mb-5 reveal-up delay-1 text-balance"
            style={{
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: '1.05',
            }}
          >
            Pick your hills.{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(to right, var(--accent), var(--accent))',
                backgroundPosition: '0 88%',
                backgroundSize: '100% 0.12em',
                backgroundRepeat: 'no-repeat',
              }}
            >
              Die on&nbsp;them.
            </span>
          </h1>
          <p
            className="text-lg sm:text-xl max-w-lg reveal-up delay-2 text-pretty"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.65' }}
          >
            Spin hot takes across 6 categories.
            Agree or disagree. Lock your position. Share your Stance Card.
          </p>
        </div>

        {/* Editorial divider — bottom */}
        <hr className="rams-divider-thick mt-10" />
      </div>
    </header>
  )
}
