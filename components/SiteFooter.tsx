'use client'

export default function SiteFooter() {
  return (
    <footer className="px-4 sm:px-6 py-8" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center"
              style={{ background: 'var(--text-primary)' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="var(--accent)" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="var(--accent)" />
              </svg>
            </div>
            <span
              className="font-mono text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Stance Machine
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
