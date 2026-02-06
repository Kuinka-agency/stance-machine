'use client'

import { type StanceEntry } from '@/lib/stance-card'

interface StanceCardProps {
  entries: StanceEntry[]
  onClose: () => void
}

export default function StanceCard({ entries, onClose }: StanceCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-lg relative"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--text-primary)',
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="font-display text-xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                My Stance Card
              </h2>
              <p
                className="font-mono text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                6 hills I will die on
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center"
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stances list */}
        <div className="px-6 pb-6 space-y-3" id="stance-card-content">
          {entries.map((entry) => (
            <div
              key={entry.take.id}
              className="flex items-start gap-3 p-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="font-mono text-xs font-bold mt-0.5 px-1.5 py-0.5"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background:
                    entry.stance === 'agree'
                      ? 'var(--agree-subtle)'
                      : 'var(--disagree-subtle)',
                  color:
                    entry.stance === 'agree'
                      ? 'var(--agree)'
                      : 'var(--disagree)',
                }}
              >
                {entry.stance === 'agree' ? 'YES' : 'NO'}
              </span>
              <p
                className="text-sm font-medium flex-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {entry.take.statement}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            stancemachine.com
          </span>
        </div>
      </div>
    </div>
  )
}
