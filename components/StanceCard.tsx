'use client'

import { useEffect, useRef } from 'react'
import { type StanceEntry } from '@/lib/categories'

interface StanceCardProps {
  entries: StanceEntry[]
  onClose: () => void
}

export default function StanceCard({ entries, onClose }: StanceCardProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your stance card results"
        tabIndex={-1}
        className="w-full max-w-lg relative outline-none"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--text-primary)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="p-7 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="font-display text-2xl font-semibold text-balance"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                My Stance Card
              </h2>
              <p
                className="font-mono text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                6 hills I will die on
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close stance card"
              className="w-8 h-8 flex items-center justify-center transition-colors duration-150"
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-strong)',
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
        <div className="px-7 pb-7 space-y-3" id="stance-card-content">
          {entries.map((entry) => (
            <div
              key={entry.take.id}
              className="flex items-start gap-3 p-4"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <span
                className="font-mono text-xs font-bold mt-0.5 px-2 py-1"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background:
                    entry.stance === 'agree'
                      ? 'var(--agree)'
                      : 'var(--disagree)',
                  color: 'white',
                  letterSpacing: '0.05em',
                }}
              >
                {entry.stance === 'agree' ? 'YES' : 'NO'}
              </span>
              <p
                className="text-sm font-medium flex-1 leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {entry.take.statement}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-7 py-4 flex items-center justify-between"
          style={{ borderTop: '1.5px solid var(--border)' }}
        >
          <span
            className="font-mono text-xs uppercase tracking-wider font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            stancemachine.com
          </span>
        </div>
      </div>
    </div>
  )
}
