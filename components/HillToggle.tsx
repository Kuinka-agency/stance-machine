'use client'

interface HillToggleProps {
  isLocked: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function HillToggle({ isLocked, onToggle, disabled }: HillToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="transition-all duration-200"
      style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        background: isLocked ? 'var(--accent)' : 'transparent',
        border: isLocked ? 'none' : '1px solid var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      title={isLocked ? 'Unlock — change your mind' : 'Lock — I will die on this hill'}
    >
      {isLocked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      )}
    </button>
  )
}
