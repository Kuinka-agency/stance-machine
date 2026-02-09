'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { HotTake, Stance, getCategories } from '@/lib/categories'
import IntensitySelector from './IntensitySelector'
import IntroCard from './IntroCard'
import HotTakeHero from './HotTakeHero'
import VoteBottomSheet from './VoteBottomSheet'
import TarotReveal from './tarot/TarotReveal'
import { encodeStanceCard, type StanceEntry } from '@/lib/categories'

interface StanceData {
  take: HotTake
  stance: Stance
  reasonTags: string[]
  explanation: string
}

type CelebrationPhase = 'none' | 'celebrating' | 'sheet'

interface BuilderState {
  currentCategoryIndex: number
  completedCategories: string[]
  stances: Record<string, StanceData>
  sessionId: string
  isComplete: boolean
  intensityRange: [number, number]
  intensitySelected: boolean
  introSeen: boolean
  phase: 'pre-vote' | 'post-vote'
  currentVoteId: number | null
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
    intensityRange: [1, 5],
    intensitySelected: false,
    introSeen: false,
    phase: 'pre-vote',
    currentVoteId: null,
  })
  const [currentHotTake, setCurrentHotTake] = useState<HotTake | null>(null)
  const [currentStance, setCurrentStance] = useState<Stance>(null)
  const [currentReasonTags, setCurrentReasonTags] = useState<string[]>([])
  const [currentExplanation, setCurrentExplanation] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [celebrationPhase, setCelebrationPhase] = useState<CelebrationPhase>('none')
  const celebrationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentCategory = categories[state.currentCategoryIndex]
  const nextCategory = categories[state.currentCategoryIndex + 1]
  const isLastCategory = state.currentCategoryIndex + 1 >= categories.length

  // Cleanup celebration timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    }
  }, [])

  // Demo hot takes — used when DB is unreachable
  const demoHotTakes: Record<string, HotTake> = {
    philosophy: { id: 'demo-ph', statement: 'Free will is just a comfortable lie we tell ourselves', category: 'philosophy', slug: 'free-will-lie', tone: ['controversial'], originalQuestion: 'Is free will real?', agreeReasons: ['It\'s deterministic', 'Neuroscience proves it', 'We\'re just atoms'], disagreeReasons: ['I choose freely', 'Consciousness matters', 'Moral responsibility'], intensity: 4 },
    relationships: { id: 'demo-re', statement: 'You should never stay friends with an ex', category: 'relationships', slug: 'friends-with-ex', tone: ['spicy'], originalQuestion: 'Can exes be friends?', agreeReasons: ['Too messy', 'Blocks moving on', 'Someone always wants more'], disagreeReasons: ['Mature people can', 'Shared history matters', 'It depends'], intensity: 3 },
    work: { id: 'demo-wo', statement: 'Hustle culture is a scam invented by people who already made it', category: 'work', slug: 'hustle-culture-scam', tone: ['controversial'], originalQuestion: 'Is hustle culture toxic?', agreeReasons: ['Survivorship bias', 'Burns people out', 'Ignores privilege'], disagreeReasons: ['Hard work pays off', 'Discipline matters', 'Winners grind'], intensity: 4 },
    money: { id: 'demo-mo', statement: 'Renting is smarter than buying a house in most cities', category: 'money', slug: 'renting-smarter', tone: ['contrarian'], originalQuestion: 'Is renting better than buying?', agreeReasons: ['Flexibility', 'No maintenance', 'Better ROI investing'], disagreeReasons: ['Building equity', 'Stability', 'It\'s your home'], intensity: 3 },
    lifestyle: { id: 'demo-li', statement: 'Social media has made us lonelier than any generation before', category: 'lifestyle', slug: 'social-media-lonely', tone: ['deep'], originalQuestion: 'Has social media made us lonely?', agreeReasons: ['Shallow connections', 'Comparison trap', 'Less face time'], disagreeReasons: ['More connected', 'Found my people online', 'It\'s what you make it'], intensity: 4 },
    society: { id: 'demo-so', statement: 'Democracy is the worst form of government except for all the others', category: 'society', slug: 'democracy-worst', tone: ['philosophical'], originalQuestion: 'Is democracy the best system?', agreeReasons: ['Slow but fair', 'Protects minorities', 'Self-correcting'], disagreeReasons: ['Mob rule', 'Populism wins', 'Too slow for crises'], intensity: 3 },
  }

  // Fetch with timeout helper
  const fetchWithTimeout = (url: string, timeoutMs = 8000): Promise<Response> => {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ])
  }

  // Load hot take for current category
  const loadHotTake = useCallback(async () => {
    if (!currentCategory) return

    setIsSpinning(true)

    try {
      const [min, max] = state.intensityRange
      const response = await fetchWithTimeout(
        `/api/spin-category?category=${currentCategory.name}&intensity_min=${min}&intensity_max=${max}`
      )

      if (!response.ok) {
        const fallbackResponse = await fetchWithTimeout(
          `/api/spin-category?category=${currentCategory.name}`
        )

        if (!fallbackResponse.ok) {
          throw new Error('API unavailable')
        }

        const hotTake = await fallbackResponse.json()
        setTimeout(() => {
          setCurrentHotTake(hotTake)
          setIsSpinning(false)
        }, 900)
        return
      }

      const hotTake = await response.json()

      setTimeout(() => {
        setCurrentHotTake(hotTake)
        setIsSpinning(false)
      }, 900)
    } catch (error) {
      console.warn('API unavailable, using demo data for', currentCategory.name)
      // Use demo hot take so the game flow still works
      const demo = demoHotTakes[currentCategory.name]
      if (demo) {
        setTimeout(() => {
          setCurrentHotTake(demo)
          setIsSpinning(false)
        }, 900)
      } else {
        setIsSpinning(false)
      }
    }
  }, [currentCategory, state.intensityRange, categories.length])

  useEffect(() => {
    if (state.intensitySelected && state.introSeen) {
      loadHotTake()
    }
  }, [loadHotTake, state.intensitySelected, state.introSeen])

  const handleSpinAgain = () => {
    setCurrentStance(null)
    setCurrentReasonTags([])
    setCurrentExplanation('')
    loadHotTake()
  }

  // Vote immediately on agree/disagree
  const handleVote = (stance: 'agree' | 'disagree') => {
    if (!currentHotTake || !currentCategory) return

    setCurrentStance(stance)
    setCelebrationPhase('celebrating')
    setState((prev) => ({
      ...prev,
      phase: 'post-vote',
    }))

    // After 1.5s celebration, show bottom sheet
    celebrationTimerRef.current = setTimeout(() => {
      setCelebrationPhase('sheet')
    }, 1500)

    // POST vote in background — don't block UX
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        take_id: currentHotTake.id,
        stance,
        session_id: state.sessionId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setState((prev) => ({
          ...prev,
          currentVoteId: data.vote_id || null,
        }))
      })
      .catch((error) => {
        console.error('Failed to save vote:', error)
      })
  }

  // "Next Category" from bottom sheet
  const handleNextCategory = async () => {
    if (!currentHotTake || !currentStance || !currentCategory) return

    // PATCH vote with context if any was added
    if (state.currentVoteId && (currentReasonTags.length > 0 || currentExplanation)) {
      try {
        await fetch('/api/vote', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vote_id: state.currentVoteId,
            reason_tags: currentReasonTags.length > 0 ? currentReasonTags : undefined,
            explanation: currentExplanation || undefined,
          }),
        })
      } catch (error) {
        console.error('Failed to update vote context:', error)
      }
    }

    // Save to local state for tarot reveal
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
      phase: 'pre-vote',
      currentVoteId: null,
    }))

    // Reset current state
    setCurrentStance(null)
    setCurrentReasonTags([])
    setCurrentExplanation('')
    setCelebrationPhase('none')
  }

  const handleIntensitySelect = (range: [number, number]) => {
    setState((prev) => ({
      ...prev,
      intensityRange: range,
      intensitySelected: true,
    }))
  }

  const handleIntroContinue = () => {
    setState((prev) => ({
      ...prev,
      introSeen: true,
    }))
  }

  // === RENDER ===

  // Tarot reveal on completion
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
      <TarotReveal
        entries={stanceEntries}
        shareUrl={shareUrl}
        onStartOver={() => {
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
            introSeen: false,
            phase: 'pre-vote',
            currentVoteId: null,
          })
          setCelebrationPhase('none')
        }}
      />
    )
  }

  // Intensity selector
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

  // Intro card
  if (!state.introSeen) {
    return <IntroCard onContinue={handleIntroContinue} />
  }

  // Loading state
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

  // Compute available reasons for bottom sheet
  const availableReasons = currentStance === 'agree'
    ? (currentHotTake.agreeReasons || [])
    : currentStance === 'disagree'
    ? (currentHotTake.disagreeReasons || [])
    : []

  // Play mode: HotTakeHero (full-screen overlay) + VoteBottomSheet
  return (
    <div>
      <HotTakeHero
        hotTake={currentHotTake}
        category={currentCategory}
        categories={categories}
        isSpinning={isSpinning}
        phase={state.phase}
        stance={currentStance}
        onSpinAgain={handleSpinAgain}
        onVote={handleVote}
        step={state.completedCategories.length + 1}
        totalSteps={categories.length}
        completedCategories={state.completedCategories}
        celebrationPhase={celebrationPhase}
      />

      {/* Bottom sheet: slides up after celebration phase */}
      {celebrationPhase === 'sheet' && currentStance && (
        <VoteBottomSheet
          stance={currentStance as 'agree' | 'disagree'}
          hotTakeStatement={currentHotTake.statement}
          reasonTags={currentReasonTags}
          explanation={currentExplanation}
          availableReasons={availableReasons}
          onReasonTagsChange={setCurrentReasonTags}
          onExplanationChange={setCurrentExplanation}
          onNext={handleNextCategory}
          isOpen={true}
          nextCategory={nextCategory}
          isLast={isLastCategory}
        />
      )}
    </div>
  )
}
