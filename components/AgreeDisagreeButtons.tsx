'use client'

import { type Stance } from '@/lib/hot-takes'

interface AgreeDisagreeButtonsProps {
  stance: Stance
  onStance: (stance: Stance) => void
  disabled?: boolean
}

export default function AgreeDisagreeButtons({
  stance,
  onStance,
  disabled,
}: AgreeDisagreeButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onStance(stance === 'agree' ? null : 'agree')}
        disabled={disabled}
        className={`stance-btn flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
          stance === 'agree' ? 'agree-active' : ''
        }`}
        style={{
          borderRadius: 'var(--radius-sm)',
          border:
            stance === 'agree'
              ? '1px solid var(--agree)'
              : '1px solid var(--border)',
          background:
            stance === 'agree' ? 'var(--agree)' : 'transparent',
          color:
            stance === 'agree' ? 'white' : 'var(--text-tertiary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Agree
      </button>
      <button
        onClick={() => onStance(stance === 'disagree' ? null : 'disagree')}
        disabled={disabled}
        className={`stance-btn flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
          stance === 'disagree' ? 'disagree-active' : ''
        }`}
        style={{
          borderRadius: 'var(--radius-sm)',
          border:
            stance === 'disagree'
              ? '1px solid var(--disagree)'
              : '1px solid var(--border)',
          background:
            stance === 'disagree' ? 'var(--disagree)' : 'transparent',
          color:
            stance === 'disagree' ? 'white' : 'var(--text-tertiary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Disagree
      </button>
    </div>
  )
}
