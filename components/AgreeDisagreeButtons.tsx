'use client'

import { useState } from 'react'
import { type Stance } from '@/lib/categories'

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
  const [lockAnim, setLockAnim] = useState<'agree' | 'disagree' | null>(null)

  const handleStance = (value: 'agree' | 'disagree') => {
    const newStance = stance === value ? null : value
    onStance(newStance)
    if (newStance) {
      setLockAnim(value)
      setTimeout(() => setLockAnim(null), 250)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleStance('agree')}
        disabled={disabled}
        className={`stance-btn flex-1 flex items-center justify-center gap-2 px-4 py-3.5 font-mono text-sm uppercase tracking-wider transition-all duration-200 ${
          stance === 'agree' ? 'agree-active' : ''
        } ${lockAnim === 'agree' ? 'stance-lock' : ''}`}
        style={{
          borderRadius: 'var(--radius-sm)',
          border:
            stance === 'agree'
              ? '2px solid var(--agree)'
              : '1.5px solid var(--border-strong)',
          background:
            stance === 'agree' ? 'var(--agree)' : 'transparent',
          color:
            stance === 'agree' ? 'white' : 'var(--text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transform: stance === 'agree' ? 'scale(1.02)' : 'scale(1)',
          fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Agree
      </button>
      <button
        onClick={() => handleStance('disagree')}
        disabled={disabled}
        className={`stance-btn flex-1 flex items-center justify-center gap-2 px-4 py-3.5 font-mono text-sm uppercase tracking-wider transition-all duration-200 ${
          stance === 'disagree' ? 'disagree-active' : ''
        } ${lockAnim === 'disagree' ? 'stance-lock' : ''}`}
        style={{
          borderRadius: 'var(--radius-sm)',
          border:
            stance === 'disagree'
              ? '2px solid var(--disagree)'
              : '1.5px solid var(--border-strong)',
          background:
            stance === 'disagree' ? 'var(--disagree)' : 'transparent',
          color:
            stance === 'disagree' ? 'white' : 'var(--text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transform: stance === 'disagree' ? 'scale(1.02)' : 'scale(1)',
          fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Disagree
      </button>
    </div>
  )
}
