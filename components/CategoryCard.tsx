'use client'

import { useState } from 'react'
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
  const [showReasons, setShowReasons] = useState(false)

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
            className="font-mono text-sm uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {category.label}
          </h2>
        </div>
      </div>

      {/* Hot take card with spinner animation */}
      <div
        className={`p-8 transition-all duration-300 ${isSpinning ? 'animate-slot-spin' : ''}`}
        style={{
          background: 'var(--bg-card)',
          border: `2px solid ${category.color}`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="space-y-3">
          <p
            className="text-lg md:text-xl leading-relaxed text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {hotTake.statement}
          </p>
          {hotTake.intensity && (
            <div className="flex justify-center">
              <IntensityBadge intensity={hotTake.intensity} />
            </div>
          )}
        </div>
      </div>

      {/* Spin again button */}
      <div className="flex justify-center">
        <button
          onClick={onSpinAgain}
          disabled={isSpinning}
          className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-mono transition-all duration-200"
          style={{
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            opacity: isSpinning ? 0.5 : 1,
            cursor: isSpinning ? 'not-allowed' : 'pointer',
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

        {/* Optional reasons section */}
        {stance && availableReasons.length > 0 && (
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Why do you think that? (Optional)</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${showReasons ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showReasons && (
              <div className="space-y-4 px-2">
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

                <div className="space-y-2">
                  <label
                    className="text-xs uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Explain more (280 chars)
                  </label>
                  <ExplanationInput
                    value={explanation}
                    onChange={onExplanationChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          disabled={!canSave}
          className="flex-1 px-6 py-3 text-sm uppercase tracking-wider font-mono transition-all duration-200"
          style={{
            background: 'transparent',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            opacity: canSave ? 1 : 0.5,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          Skip explanation
        </button>
        <button
          onClick={onSaveAndContinue}
          disabled={!canSave}
          className="flex-1 px-6 py-3 text-sm uppercase tracking-wider font-mono transition-all duration-200"
          style={{
            background: canSave ? 'var(--accent)' : 'var(--bg-inset)',
            color: canSave ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {showReasons && (reasonTags.length > 0 || explanation.length > 0)
            ? 'Save & Continue'
            : 'Continue'}
        </button>
      </div>
    </div>
  )
}
