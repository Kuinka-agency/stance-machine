'use client'

export default function SiteHeader() {
  return (
    <header className="px-4 sm:px-6 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 reveal-up delay-0">
          <div className="flex items-center gap-3">
            {/* Logomark — bold flame grid */}
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'var(--text-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="#D4400E" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="#F5F3EF" opacity="0.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="#F5F3EF" opacity="0.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#D4400E" />
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

        {/* Hero text */}
        <div className="max-w-3xl">
          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl mb-4 reveal-up delay-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Pick your hills. Die on&nbsp;them.
          </h1>
          <p
            className="text-base sm:text-lg max-w-lg reveal-up delay-2"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
          >
            Spin hot takes across 6 categories.
            Agree or disagree. Lock your position. Share your Stance Card.
          </p>
        </div>

        <hr className="rams-divider mt-8" />
      </div>
    </header>
  )
}
