'use client'

import { useState, useEffect, useRef } from 'react'
import { HotTake, StanceCategory, Stance } from '@/lib/hot-takes'
import AgreeDisagreeButtons from './AgreeDisagreeButtons'
import ReasonTagPicker from './ReasonTagPicker'
import ExplanationInput from './ExplanationInput'
import IntensityBadge from './IntensityBadge'

interface CategoryCardProps {
  category: StanceCategory
  hotTake: HotTake
  stance: Stance
  reasonTags: string[]
  explanation: string
  onStanceChange: (stance: Stance) => void
  onReasonTagsChange: (tags: string[]) => void
  onExplanationChange: (text: string) => void
  onSpinAgain: () => void
  onSaveAndContinue: () => void
  onSkip: () => void
  isSpinning: boolean
}

type AnimPhase = 'idle' | 'exit' | 'loading' | 'enter'

export default function CategoryCard({
  category,
  hotTake,
  stance,
  reasonTags,
  explanation,
  onStanceChange,
  onReasonTagsChange,
  onExplanationChange,
  onSpinAgain,
  onSaveAndContinue,
  onSkip,
  isSpinning,
}: CategoryCardProps) {
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const prevHotTakeRef = useRef<string | null>(null)

  // Drive the multi-phase animation when isSpinning changes
  useEffect(() => {
    if (isSpinning) {
      setAnimPhase('exit')
      const exitTimer = setTimeout(() => setAnimPhase('loading'), 250)
      return () => clearTimeout(exitTimer)
    }
  }, [isSpinning])

  // When hotTake changes (new card arrived), trigger enter animation
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

  const availableReasons = stance === 'agree'
    ? (hotTake.agreeReasons || [])
    : stance === 'disagree'
    ? (hotTake.disagreeReasons || [])
    : []

  const handleToggleTag = (tag: string) => {
    if (reasonTags.includes(tag)) {
      onReasonTagsChange(reasonTags.filter(t => t !== tag))
    } else {
      onReasonTagsChange([...reasonTags, tag])
    }
  }

  const canSave = stance !== null

  const cardAnimClass =
    animPhase === 'exit' ? 'card-exit' :
    animPhase === 'enter' ? 'card-enter' :
    ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Category header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: category.color }}
          />
          <h2
            className="font-mono text-sm font-medium uppercase tracking-wider"
            style={{ color: category.color }}
          >
            {category.label}
          </h2>
        </div>
      </div>

      {/* Hot take card — dramatic animation phases */}
      <div aria-live="polite" role="status" className="sr-only">
        {animPhase === 'loading' ? 'Loading new hot take...' : ''}
      </div>
      {animPhase === 'loading' ? (
        /* Phase 2: Anticipation — pulsing bar in category color */
        <div
          className="flex items-center justify-center"
          style={{ minHeight: '160px' }}
        >
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
        /* Phase 1 & 3: Card visible (exit or enter animation) */
        <div
          className={`p-10 transition-shadow duration-300 ${cardAnimClass}`}
          style={{
            background: 'var(--bg-card)',
            borderLeft: `4px solid ${category.color}`,
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="space-y-3">
            <p
              className="text-xl md:text-2xl leading-snug text-center font-medium"
              style={{
                color: 'var(--text-primary)',
                lineHeight: '1.35',
              }}
            >
              {hotTake.statement}
            </p>
            {hotTake.intensity && (
              <div className="flex justify-center pt-1">
                <IntensityBadge intensity={hotTake.intensity} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spin again button */}
      <div className="flex justify-center">
        <button
          onClick={onSpinAgain}
          disabled={isSpinning}
          className={`spin-again-btn flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-wider font-mono transition-all duration-200`}
          style={{
            color: isSpinning ? 'var(--text-muted)' : 'var(--text-secondary)',
            border: `1.5px solid ${isSpinning ? 'var(--border)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: isSpinning ? 'not-allowed' : 'pointer',
            background: 'transparent',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSpinning ? 'animate-spin' : ''}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {isSpinning ? 'Spinning...' : 'Not this one? Spin again'}
        </button>
      </div>

      {/* Stance selection */}
      <div className="space-y-4">
        <AgreeDisagreeButtons
          stance={stance}
          onStance={onStanceChange}
          disabled={isSpinning}
        />

        {/* Explanation section - always visible when stance is selected */}
        {stance && (
          <div className="space-y-4 pt-4">
            {/* Reason tags - only if available */}
            {availableReasons.length > 0 && (
              <div className="space-y-2">
                <label
                  className="text-xs uppercase tracking-wider font-mono"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Quick reasons
                </label>
                <ReasonTagPicker
                  reasons={availableReasons}
                  selectedTags={reasonTags}
                  onToggle={handleToggleTag}
                />
              </div>
            )}

            {/* Explanation textarea - always visible */}
            <div className="space-y-2">
              <label
                htmlFor="explanation-input"
                className="text-xs uppercase tracking-wider font-mono"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Explain your reasoning (optional)
              </label>
              <ExplanationInput
                value={explanation}
                onChange={onExplanationChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="pt-4">
        <button
          onClick={onSaveAndContinue}
          disabled={!canSave}
          className="w-full px-6 py-4 text-sm uppercase tracking-wider font-mono font-medium transition-all duration-200"
          style={{
            background: canSave ? 'var(--accent)' : 'var(--bg-inset)',
            color: canSave ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: canSave ? 'pointer' : 'not-allowed',
            letterSpacing: '0.06em',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (canSave) e.currentTarget.style.transform = 'scale(1.01)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {(reasonTags.length > 0 || explanation.length > 0)
            ? 'Save & Continue'
            : 'Continue'}
        </button>
        {canSave && (
          <button
            onClick={onSkip}
            className="w-full mt-2 py-2 text-xs font-mono transition-all duration-200"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            skip
          </button>
        )}
      </div>
    </div>
  )
}
