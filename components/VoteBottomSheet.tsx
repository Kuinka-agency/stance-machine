'use client'

import { StanceCategory } from '@/lib/categories'
import ReasonTagPicker from './ReasonTagPicker'
import ExplanationInput from './ExplanationInput'

interface VoteBottomSheetProps {
  stance: 'agree' | 'disagree'
  hotTakeStatement: string
  reasonTags: string[]
  explanation: string
  availableReasons: string[]
  onReasonTagsChange: (tags: string[]) => void
  onExplanationChange: (text: string) => void
  onNext: () => void
  isOpen: boolean
  nextCategory?: StanceCategory
  isLast: boolean
}

export default function VoteBottomSheet({
  stance,
  hotTakeStatement,
  reasonTags,
  explanation,
  availableReasons,
  onReasonTagsChange,
  onExplanationChange,
  onNext,
  isOpen,
  nextCategory,
  isLast,
}: VoteBottomSheetProps) {
  if (!isOpen) return null

  const stanceColor = stance === 'agree' ? 'var(--agree)' : 'var(--disagree)'
  const stanceIcon = stance === 'agree' ? '✓' : '✗'
  const stanceLabel = stance === 'agree' ? 'AGREE' : 'DISAGREE'

  const handleToggleTag = (tag: string) => {
    if (reasonTags.includes(tag)) {
      onReasonTagsChange(reasonTags.filter(t => t !== tag))
    } else {
      onReasonTagsChange([...reasonTags, tag])
    }
  }

  // Truncate hot take for context
  const truncatedStatement = hotTakeStatement.length > 80
    ? hotTakeStatement.slice(0, 80) + '...'
    : hotTakeStatement

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bottom-sheet-backdrop"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onNext}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] surface-card bottom-sheet-enter"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <div className="p-6 space-y-5 max-w-2xl mx-auto">
          {/* Handle bar */}
          <div className="flex justify-center">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--border-strong)' }}
            />
          </div>

          {/* Stance badge + hot take context */}
          <div className="space-y-2">
            <p className="font-mono text-sm font-bold uppercase tracking-wider">
              <span style={{ color: stanceColor }}>{stanceIcon} You {stanceLabel}</span>
            </p>
            <p
              className="font-quote text-sm italic"
              style={{ color: 'var(--text-on-surface-muted)', lineHeight: 1.5 }}
            >
              &ldquo;{truncatedStatement}&rdquo;
            </p>
          </div>

          {/* Context section */}
          <div className="space-y-3">
            <div>
              <p
                className="text-sm font-mono font-medium"
                style={{ color: 'var(--text-on-surface)' }}
              >
                Why?
              </p>
              <p
                className="text-xs font-mono mt-0.5"
                style={{ color: 'var(--text-on-surface-muted)' }}
              >
                pick any that resonate
              </p>
            </div>

            {/* Reason tags */}
            {availableReasons.length > 0 && (
              <ReasonTagPicker
                reasons={availableReasons}
                selectedTags={reasonTags}
                onToggle={handleToggleTag}
              />
            )}

            {/* Explanation */}
            <ExplanationInput
              value={explanation}
              onChange={onExplanationChange}
            />
          </div>

          {/* Next button — shows what's coming */}
          <button
            onClick={onNext}
            className="w-full px-6 py-4 text-sm uppercase tracking-wider font-mono font-medium transition-all duration-200"
            style={{
              background: isLast ? 'var(--accent)' : 'var(--accent)',
              color: '#0e0e0e',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)'
            }}
          >
            {isLast
              ? 'Reveal Your Reading →'
              : nextCategory
              ? `Next: ${nextCategory.label} →`
              : 'Next Category →'
            }
          </button>
        </div>
      </div>
    </>
  )
}
