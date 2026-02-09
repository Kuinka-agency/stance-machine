'use client'

import { useState, useEffect, useRef } from 'react'
import { HotTake, StanceCategory, Stance } from '@/lib/categories'

type CelebrationPhase = 'none' | 'celebrating' | 'sheet'

interface HotTakeHeroProps {
  hotTake: HotTake
  category: StanceCategory
  categories: StanceCategory[]
  isSpinning: boolean
  phase: 'pre-vote' | 'post-vote'
  stance: Stance
  onSpinAgain: () => void
  onVote: (stance: 'agree' | 'disagree') => void
  step: number
  totalSteps: number
  completedCategories: string[]
  celebrationPhase: CelebrationPhase
}

type AnimPhase = 'idle' | 'exit' | 'loading' | 'enter'

export default function HotTakeHero({
  hotTake,
  category,
  categories,
  isSpinning,
  phase,
  stance,
  onSpinAgain,
  onVote,
  step,
  totalSteps,
  completedCategories,
  celebrationPhase,
}: HotTakeHeroProps) {
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const prevHotTakeRef = useRef<string | null>(null)

  // Drive multi-phase animation when isSpinning changes
  useEffect(() => {
    if (isSpinning) {
      setAnimPhase('exit')
      const exitTimer = setTimeout(() => setAnimPhase('loading'), 250)
      return () => clearTimeout(exitTimer)
    }
  }, [isSpinning])

  // When hotTake changes, trigger enter animation
  useEffect(() => {
    if (hotTake.id !== prevHotTakeRef.current && prevHotTakeRef.current !== null) {
      setAnimPhase('enter')
      const enterTimer = setTimeout(() => setAnimPhase('idle'), 400)
      return () => clearTimeout(enterTimer)
    }
    prevHotTakeRef.current = hotTake.id
  }, [hotTake.id])

  // On first mount, enter animation
  useEffect(() => {
    if (prevHotTakeRef.current === null) {
      prevHotTakeRef.current = hotTake.id
      setAnimPhase('enter')
      const enterTimer = setTimeout(() => setAnimPhase('idle'), 400)
      return () => clearTimeout(enterTimer)
    }
  }, [hotTake.id])

  const heroAnimClass =
    animPhase === 'exit' ? 'hero-exit' :
    animPhase === 'enter' ? 'hero-enter' :
    ''

  const isLocked = phase === 'post-vote'
  const isAnimating = celebrationPhase === 'celebrating' // Only the 1.5s burst
  const isPostVote = celebrationPhase === 'celebrating' || celebrationPhase === 'sheet' // Both phases

  // Button style helper — outline pre-vote, filled on selection
  const getButtonStyle = (type: 'agree' | 'disagree') => {
    const color = type === 'agree' ? 'var(--agree)' : 'var(--disagree)'
    const subtle = type === 'agree' ? 'var(--agree-subtle)' : 'var(--disagree-subtle)'
    const isChosen = stance === type

    // Post-vote: chosen button stays filled, unchosen hidden
    if (isPostVote) {
      if (isChosen) {
        return { background: color, color: 'white', border: `2px solid ${color}`, opacity: 1 }
      }
      return { background: 'transparent', color, border: `2px solid ${color}`, opacity: 0 }
    }

    // Pre-vote: outline style
    return { background: subtle, color, border: `2px solid ${color}`, opacity: isSpinning ? 0.5 : 1 }
  }

  const agreeStyle = getButtonStyle('agree')
  const disagreeStyle = getButtonStyle('disagree')

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar: mini logo + dot progress */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mini branding */}
        <div
          className="font-mono text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '14px', lineHeight: 1 }}>⬡</span>
          <span style={{ color: 'var(--text-secondary)' }}>Stance Machine</span>
        </div>

        {/* Dot progress — 6 dots */}
        <div className="flex items-center gap-2">
          {categories.map((cat, i) => {
            const isCompleted = completedCategories.includes(cat.name)
            const isCurrent = i === step - 1
            return (
              <div
                key={cat.name}
                className={isCurrent && !isCompleted ? 'dot-pulse' : ''}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isCompleted
                    ? cat.color
                    : isCurrent
                    ? category.color
                    : 'transparent',
                  border: isCompleted || isCurrent
                    ? 'none'
                    : '1.5px solid var(--text-muted)',
                  opacity: isCompleted ? 1 : isCurrent ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Main content area — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8">
        {/* Screen reader announcement */}
        <div aria-live="polite" role="status" className="sr-only">
          {animPhase === 'loading' ? 'Loading new hot take...' : ''}
        </div>

        {animPhase === 'loading' ? (
          <div className="flex items-center justify-center" style={{ minHeight: '120px' }}>
            <div
              className="card-loading rounded-full"
              style={{
                width: '64px',
                height: '4px',
                background: category.color,
              }}
            />
          </div>
        ) : (
          <div className={`w-full max-w-xl space-y-6 ${heroAnimClass}`}>
            {/* Category identity — tarot visual language */}
            <div className="text-center space-y-1">
              {/* Large muted symbol */}
              <div
                className="text-4xl leading-none"
                style={{ color: category.color, opacity: 0.15 }}
              >
                {category.symbol}
              </div>
              {/* Roman numeral + archetype */}
              <p
                className="font-mono text-xs uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {category.romanNumeral} · {category.archetype}
              </p>
              {/* Category name in color */}
              <p
                className="font-display text-sm font-bold uppercase"
                style={{ color: category.color }}
              >
                {category.label}
              </p>
            </div>

            {/* White card with the hot take */}
            <div
              className="surface-card p-8 sm:p-10 md:p-12 relative overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
                borderLeft: `4px solid ${category.color}`,
                opacity: isAnimating ? 0.7 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* The opinion — hero sized, generous whitespace */}
              <p
                className="font-quote text-2xl sm:text-3xl md:text-4xl font-semibold text-balance"
                style={{
                  color: 'var(--text-primary)',
                  lineHeight: '1.35',
                  letterSpacing: '-0.01em',
                }}
              >
                {hotTake.statement}
              </p>

              {/* Watermark symbol — bottom right */}
              <div
                className="absolute bottom-3 right-4 text-6xl leading-none pointer-events-none select-none"
                style={{ color: category.color, opacity: 0.04 }}
              >
                {category.symbol}
              </div>
            </div>

            {/* Spin again — subtle text link, only pre-vote */}
            {!isLocked && (
              <div className="flex justify-center">
                <button
                  onClick={onSpinAgain}
                  disabled={isSpinning}
                  className="font-mono text-xs transition-all duration-200"
                  style={{
                    color: isSpinning ? 'var(--text-muted)' : 'var(--text-tertiary)',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSpinning) e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSpinning) e.currentTarget.style.color = 'var(--text-tertiary)'
                  }}
                >
                  {isSpinning ? '↻ spinning...' : '↻ deal another'}
                </button>
              </div>
            )}

            {/* Celebration text — appears after voting */}
            {isPostVote && (
              <div className="flex justify-center celebration-enter">
                <p
                  className="font-mono text-xs uppercase tracking-[0.12em]"
                  style={{ color: category.color }}
                >
                  {category.archetype} has spoken.
                </p>
              </div>
            )}

            {/* Agree / Disagree buttons — outline pre-vote, filled on selection */}
            <div className="flex gap-3">
              <button
                onClick={() => !isLocked && onVote('agree')}
                disabled={isSpinning || isLocked}
                className={`stance-btn flex-1 flex items-center justify-center gap-3 font-mono text-base uppercase tracking-wider font-semibold transition-all duration-200 ${
                  isAnimating && stance === 'agree' ? 'vote-glow-agree btn-celebrate' : ''
                } ${isAnimating && stance !== 'agree' ? 'btn-fade-out' : ''}`}
                style={{
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-md)',
                  ...agreeStyle,
                  cursor: isSpinning || isLocked ? 'default' : 'pointer',
                  pointerEvents: isLocked && stance !== 'agree' ? 'none' : 'auto',
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Agree
              </button>
              <button
                onClick={() => !isLocked && onVote('disagree')}
                disabled={isSpinning || isLocked}
                className={`stance-btn flex-1 flex items-center justify-center gap-3 font-mono text-base uppercase tracking-wider font-semibold transition-all duration-200 ${
                  isAnimating && stance === 'disagree' ? 'vote-glow-disagree btn-celebrate' : ''
                } ${isAnimating && stance !== 'disagree' ? 'btn-fade-out' : ''}`}
                style={{
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-md)',
                  ...disagreeStyle,
                  cursor: isSpinning || isLocked ? 'default' : 'pointer',
                  pointerEvents: isLocked && stance !== 'disagree' ? 'none' : 'auto',
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Disagree
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
