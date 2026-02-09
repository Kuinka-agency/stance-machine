'use client'

import { useEffect } from 'react'
import { CATEGORIES, type StanceEntry } from '@/lib/categories'
import TarotCard from './TarotCard'

interface TarotCardModalProps {
  entry: StanceEntry
  index: number
  totalCards: number
  onClose: () => void
}

export default function TarotCardModal({ entry, index, totalCards, onClose }: TarotCardModalProps) {
  const category = CATEGORIES.find(c => c.name === entry.take.category) || CATEGORIES[index]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0, 0, 0, 0.88)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${category.label} stance card`}
    >
      <div className="relative">
        <TarotCard
          category={category}
          categoryIndex={index}
          totalCards={totalCards}
          opinions={[{
            statement: entry.take.statement,
            stance: entry.stance as 'agree' | 'disagree',
          }]}
          isFlipped={true}
          size="lg"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center transition-colors"
          style={{
            background: '#1A1917',
            border: '1px solid rgba(247, 245, 240, 0.15)',
            borderRadius: '50%',
            color: 'rgba(247, 245, 240, 0.6)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
