'use client'

import { useState, useEffect, useCallback } from 'react'
import { type StanceEntry } from '@/lib/categories'
import TarotSpread from './TarotSpread'
import TarotSummaryCard from './TarotSummaryCard'
import TarotCardModal from './TarotCardModal'
import ShareButton from '../ShareButton'
import SaveToCollectionButton from '../SaveToCollectionButton'

interface TarotRevealProps {
  entries: StanceEntry[]
  shareUrl: string
  onStartOver: () => void
}

export default function TarotReveal({ entries, shareUrl, onStartOver }: TarotRevealProps) {
  const [flippedCards, setFlippedCards] = useState<boolean[]>(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return new Array(entries.length).fill(true)
    }
    return new Array(entries.length).fill(false)
  })
  const [showSummary, setShowSummary] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const startReveal = useCallback(() => {
    if (prefersReducedMotion) {
      setFlippedCards(new Array(entries.length).fill(true))
      setShowSummary(true)
      setShowActions(true)
      return
    }

    entries.forEach((_, i) => {
      setTimeout(() => {
        setFlippedCards(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, 600 + i * 250)
    })

    // Show summary after all cards flip
    setTimeout(() => {
      setShowSummary(true)
    }, 600 + entries.length * 250 + 400)

    // Show actions after summary
    setTimeout(() => {
      setShowActions(true)
    }, 600 + entries.length * 250 + 800)
  }, [entries, prefersReducedMotion])

  useEffect(() => {
    startReveal()
  }, [startReveal])

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Heading */}
      <div className="text-center reveal-up">
        <h2
          className="font-display text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Your Reading
        </h2>
        <p
          className="font-mono text-xs uppercase tracking-[0.15em] mt-2"
          style={{ color: 'var(--text-muted)' }}
        >
          6 hills you will die on
        </p>
      </div>

      {/* Card spread */}
      <TarotSpread
        entries={entries}
        flippedCards={flippedCards}
        onCardClick={(i) => setModalIndex(i)}
        animated={!prefersReducedMotion}
      />

      {/* Summary card */}
      {showSummary && (
        <div className={prefersReducedMotion ? '' : 'reveal-up'} style={{ animationDelay: '0.1s' }}>
          <TarotSummaryCard entries={entries} />
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className={`flex flex-col items-center gap-4 ${prefersReducedMotion ? '' : 'reveal-up'}`} style={{ animationDelay: '0.2s' }}>
          <SaveToCollectionButton stanceHash={shareUrl.split('/stance/')[1] || ''} />
          <ShareButton url={shareUrl} />

          <button
            onClick={onStartOver}
            className="text-sm transition-colors"
            style={{
              color: 'var(--text-tertiary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Start over with new hills
          </button>
        </div>
      )}

      {/* Modal */}
      {modalIndex !== null && (
        <TarotCardModal
          entry={entries[modalIndex]}
          index={modalIndex}
          totalCards={entries.length}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  )
}
