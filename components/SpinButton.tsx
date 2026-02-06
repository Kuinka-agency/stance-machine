'use client'

import { useRef, useCallback } from 'react'

interface SpinButtonProps {
  onClick: () => void
  isSpinning: boolean
}

export default function SpinButton({ onClick, isSpinning }: SpinButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!btnRef.current || isSpinning) return
    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    btnRef.current.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`
  }, [isSpinning])

  const handleMouseLeave = useCallback(() => {
    if (!btnRef.current) return
    btnRef.current.style.transform = 'translate(0px, 0px)'
  }, [])

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={isSpinning}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative"
      style={{
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        className="relative z-10 inline-flex items-center gap-3 px-10 py-4 text-base font-medium tracking-wide transition-all duration-300"
        style={{
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          fontSize: '0.8125rem',
          background: isSpinning ? 'var(--bg-inset)' : 'var(--text-primary)',
          color: isSpinning ? 'var(--text-tertiary)' : 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
        }}
      >
        {isSpinning ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Spinning
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:rotate-180">
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Spin Takes
          </>
        )}
      </span>
    </button>
  )
}
