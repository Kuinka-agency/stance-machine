'use client'

import { useState, useEffect, useCallback } from 'react'
import { HotTake, StanceCategory, Stance, getCategories } from '@/lib/hot-takes'
import CategoryCard from './CategoryCard'
import ProgressIndicator from './ProgressIndicator'
import StanceCard from './StanceCard'
import ShareButton from './ShareButton'
import IntensitySelector from './IntensitySelector'
import { encodeStanceCard, type StanceEntry } from '@/lib/stance-card'

interface StanceData {
  take: HotTake
  stance: Stance
  reasonTags: string[]
  explanation: string
}

interface BuilderState {
  currentCategoryIndex: number
  completedCategories: string[]
  stances: Record<string, StanceData>
  sessionId: string
  isComplete: boolean
  intensityRange: [number, number] // [min, max]
  intensitySelected: boolean
}

export default function SequentialBuilder() {
  const categories = getCategories()
  const [state, setState] = useState<BuilderState>({
    currentCategoryIndex: 0,
    completedCategories: [],
    stances: {},
    sessionId: typeof window !== 'undefined'
      ? window.crypto.randomUUID()
      : '',
    isComplete: false,
    intensityRange: [1, 5], // Default to all intensities
    intensitySelected: false,
  })
  const [currentHotTake, setCurrentHotTake] = useState<HotTake | null>(null)
  const [currentStance, setCurrentStance] = useState<Stance>(null)
  const [currentReasonTags, setCurrentReasonTags] = useState<string[]>([])
  const [currentExplanation, setCurrentExplanation] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [showCard, setShowCard] = useState(false)

  const currentCategory = categories[state.currentCategoryIndex]

  // Load hot take for current category
  const loadHotTake = useCallback(async () => {
    if (!currentCategory) return

    setIsSpinning(true)

    try {
      const [min, max] = state.intensityRange
      const response = await fetch(
        `/api/spin-category?category=${currentCategory.name}&intensity_min=${min}&intensity_max=${max}`
      )
      const hotTake = await response.json()

      setTimeout(() => {
        setCurrentHotTake(hotTake)
        setIsSpinning(false)
      }, 400)
    } catch (error) {
      console.error('Failed to load hot take:', error)
      setIsSpinning(false)
    }
  }, [currentCategory, state.intensityRange])

  useEffect(() => {
    // Only load hot take after intensity is selected
    if (state.intensitySelected) {
      loadHotTake()
    }
  }, [loadHotTake, state.intensitySelected])

  const handleSpinAgain = () => {
    // Reset all state when spinning for a new hot take
    setCurrentStance(null)
    setCurrentReasonTags([])
    setCurrentExplanation('')
    loadHotTake()
  }

  const handleSaveAndContinue = async () => {
    if (!currentHotTake || !currentStance || !currentCategory) return

    // Save vote to database
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          take_id: currentHotTake.id,
          stance: currentStance,
          reason_tags: currentReasonTags.length > 0 ? currentReasonTags : undefined,
          explanation: currentExplanation || undefined,
          session_id: state.sessionId,
        }),
      })
    } catch (error) {
      console.error('Failed to save vote:', error)
    }

    // Save to local state
    setState((prev) => ({
      ...prev,
      stances: {
        ...prev.stances,
        [currentCategory.name]: {
          take: currentHotTake,
          stance: currentStance,
          reasonTags: currentReasonTags,
          explanation: currentExplanation,
        },
      },
      completedCategories: [...prev.completedCategories, currentCategory.name],
      currentCategoryIndex: prev.currentCategoryIndex + 1,
      isComplete: prev.currentCategoryIndex + 1 >= categories.length,
    }))

    // Reset current state
    setCurrentStance(null)
    setCurrentReasonTags([])
    setCurrentExplanation('')
  }

  const handleSkip = () => {
    handleSaveAndContinue()
  }

  const handleIntensitySelect = (range: [number, number]) => {
    setState((prev) => ({
      ...prev,
      intensityRange: range,
      intensitySelected: true,
    }))
  }

  if (state.isComplete) {
    const stanceEntries: StanceEntry[] = categories.map((cat) => ({
      take: state.stances[cat.name].take,
      stance: state.stances[cat.name].stance as 'agree' | 'disagree',
    }))

    const shareHash = encodeStanceCard(stanceEntries)
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/stance/${shareHash}`
      : ''

    return (
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Stance Card Complete! 🎉
          </h2>
          <p
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            You've claimed all 6 hills. Here's your stance card:
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowCard(true)}
            className="font-mono text-xs uppercase tracking-wider px-10 py-4 transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.05em',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            View Stance Card
          </button>
          <ShareButton url={shareUrl} />

          <button
            onClick={() => {
              setState({
                currentCategoryIndex: 0,
                completedCategories: [],
                stances: {},
                sessionId: typeof window !== 'undefined'
                  ? window.crypto.randomUUID()
                  : '',
                isComplete: false,
                intensityRange: [1, 5],
                intensitySelected: false,
              })
              setShowCard(false)
            }}
            className="mt-4 text-sm"
            style={{
              color: 'var(--text-tertiary)',
              textDecoration: 'underline',
            }}
          >
            Start over with new hills
          </button>
        </div>

        {showCard && (
          <StanceCard entries={stanceEntries} onClose={() => setShowCard(false)} />
        )}
      </div>
    )
  }

  // Show intensity selector if not yet selected
  if (!state.intensitySelected) {
    return (
      <div className="max-w-4xl mx-auto">
        <IntensitySelector
          value={state.intensityRange}
          onChange={handleIntensitySelect}
        />
      </div>
    )
  }

  if (!currentCategory || !currentHotTake) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg
          className="w-8 h-8 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="max-w-2xl mx-auto">
        <ProgressIndicator
          current={state.completedCategories.length}
          total={categories.length}
        />
      </div>

      {/* Category card */}
      <CategoryCard
        category={currentCategory}
        hotTake={currentHotTake}
        stance={currentStance}
        reasonTags={currentReasonTags}
        explanation={currentExplanation}
        onStanceChange={setCurrentStance}
        onReasonTagsChange={setCurrentReasonTags}
        onExplanationChange={setCurrentExplanation}
        onSpinAgain={handleSpinAgain}
        onSaveAndContinue={handleSaveAndContinue}
        onSkip={handleSkip}
        isSpinning={isSpinning}
      />

      {/* Edit previous categories */}
      {state.completedCategories.length > 0 && (
        <div className="max-w-2xl mx-auto pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => {
              // Go back to first category to edit
              setState((prev) => ({
                ...prev,
                currentCategoryIndex: 0,
                completedCategories: [],
                isComplete: false,
              }))
            }}
            className="text-sm"
            style={{
              color: 'var(--text-tertiary)',
              textDecoration: 'underline',
            }}
          >
            ← Edit previous hills
          </button>
        </div>
      )}
    </div>
  )
}
