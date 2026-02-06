'use client'

import { useState, useEffect, useCallback } from 'react'
import { HotTake, StanceCategory, Stance } from '@/lib/hot-takes'
import { encodeStanceCard, type StanceEntry } from '@/lib/stance-card'
import StanceSlot from './StanceSlot'
import SpinButton from './SpinButton'
import StanceCard from './StanceCard'
import ShareButton from './ShareButton'

interface SpinResponse {
  hotTakes: Record<string, HotTake>
  categories: StanceCategory[]
}

export default function StanceMachine() {
  const [hotTakes, setHotTakes] = useState<Record<string, HotTake>>({})
  const [categories, setCategories] = useState<StanceCategory[]>([])
  const [locked, setLocked] = useState<Record<string, string>>({})
  const [stances, setStances] = useState<Record<string, Stance>>({})
  const [isSpinning, setIsSpinning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const [showCard, setShowCard] = useState(false)

  const spin = useCallback(async () => {
    setIsSpinning(true)

    const lockedParam = Object.entries(locked)
      .map(([cat, id]) => `${cat}:${id}`)
      .join(',')

    const url = lockedParam
      ? `/api/spin?locked=${encodeURIComponent(lockedParam)}`
      : '/api/spin'

    try {
      const res = await fetch(url)
      const data: SpinResponse = await res.json()

      setTimeout(() => {
        setHotTakes(data.hotTakes)
        setCategories(data.categories)
        setIsSpinning(false)
        setIsLoaded(true)
        setSpinCount((prev) => prev + 1)

        // Clear stances for unlocked slots
        setStances((prev) => {
          const next: Record<string, Stance> = {}
          for (const cat of data.categories) {
            if (locked[cat.name]) {
              next[cat.name] = prev[cat.name] || null
            } else {
              next[cat.name] = null
            }
          }
          return next
        })
      }, 400)
    } catch (error) {
      console.error('Spin failed:', error)
      setIsSpinning(false)
    }
  }, [locked])

  useEffect(() => {
    spin()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStance = (category: string, stance: Stance) => {
    setStances((prev) => ({ ...prev, [category]: stance }))
  }

  const toggleLock = (category: string) => {
    const take = hotTakes[category]
    const stance = stances[category]
    if (!take || !stance) return

    setLocked((prev) => {
      if (prev[category]) {
        const { [category]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [category]: take.id }
    })
  }

  const lockedCount = Object.keys(locked).length
  const allLocked = lockedCount === 6

  // Build stance card entries
  const stanceEntries: StanceEntry[] = allLocked
    ? categories.map((cat) => ({
        take: hotTakes[cat.name],
        stance: stances[cat.name]!,
      }))
    : []

  const shareHash = allLocked ? encodeStanceCard(stanceEntries) : ''
  const shareUrl = allLocked
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/stance/${shareHash}`
    : ''

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex items-center justify-between mb-4 reveal-up delay-3">
          <span
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Your Takes
          </span>
          {isLoaded && (
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {allLocked ? (
                <>All 6 hills claimed</>
              ) : lockedCount > 0 ? (
                <>{lockedCount}/6 hills claimed</>
              ) : (
                <>Spin #{spinCount}</>
              )}
            </span>
          )}
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8 reveal-scale delay-4">
          {categories.map((cat, index) => (
            <StanceSlot
              key={cat.name}
              category={cat}
              hotTake={hotTakes[cat.name] || null}
              stance={stances[cat.name] || null}
              isLocked={!!locked[cat.name]}
              isSpinning={isSpinning}
              animationDelay={index * 80}
              onStance={(stance) => handleStance(cat.name, stance)}
              onToggleLock={() => toggleLock(cat.name)}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 reveal-up delay-5">
          {allLocked ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setShowCard(true)}
                className="font-mono text-xs uppercase tracking-wider px-10 py-4 transition-all duration-200"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                View Stance Card
              </button>
              <ShareButton url={shareUrl} />
            </div>
          ) : (
            <SpinButton onClick={spin} isSpinning={isSpinning} />
          )}

          {isLoaded && lockedCount === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Pick agree or disagree, then lock your hills
            </p>
          )}

          {isLoaded && lockedCount > 0 && !allLocked && (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Lock all 6 to generate your Stance Card
            </p>
          )}
        </div>
      </div>

      {/* Stance Card overlay */}
      {showCard && allLocked && (
        <StanceCard entries={stanceEntries} onClose={() => setShowCard(false)} />
      )}
    </>
  )
}
