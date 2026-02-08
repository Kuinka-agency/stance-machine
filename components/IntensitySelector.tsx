'use client'

import { useState, useEffect } from 'react'

interface IntensitySelectorProps {
  value: [number, number] // [min, max] range
  onChange: (range: [number, number]) => void
  currentCategory?: string
}

export default function IntensitySelector({
  value,
  onChange,
  currentCategory
}: IntensitySelectorProps) {
  const [distribution, setDistribution] = useState<Record<number, number> | null>(null)

  useEffect(() => {
    // Fetch intensity distribution for current category
    const fetchDistribution = async () => {
      try {
        const url = currentCategory
          ? `/api/intensity-distribution?category=${currentCategory}`
          : '/api/intensity-distribution'
        const response = await fetch(url)
        const data = await response.json()
        setDistribution(data)
      } catch (error) {
        console.error('Failed to fetch intensity distribution:', error)
      }
    }

    fetchDistribution()
  }, [currentCategory])

  const presets = [
    {
      range: [1, 2] as [number, number],
      emoji: '😌',
      label: 'Chill',
      description: 'Lighthearted debates, no existential crises'
    },
    {
      range: [2, 4] as [number, number],
      emoji: '💬',
      label: 'Balanced',
      description: 'Mix of fun and serious. Real opinions without heavyweight topics'
    },
    {
      range: [4, 5] as [number, number],
      emoji: '🔥',
      label: 'Go Deep',
      description: 'Philosophical heavyweights. Fundamental worldview questions'
    },
    {
      range: [1, 5] as [number, number],
      emoji: '🎲',
      label: 'Surprise Me',
      description: 'Full spectrum. Let chaos decide'
    },
  ]

  const isSelected = (range: [number, number]) => {
    return value[0] === range[0] && value[1] === range[1]
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2
          className="text-xl md:text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          What's your vibe today?
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Choose your intensity level for all 6 categories
        </p>
      </div>

      <div className="grid gap-3 max-w-2xl mx-auto">
        {presets.map((preset) => {
          const selected = isSelected(preset.range)
          const count = distribution
            ? Object.entries(distribution)
                .filter(([level]) => {
                  const l = parseInt(level)
                  return l >= preset.range[0] && l <= preset.range[1]
                })
                .reduce((sum, [, count]) => sum + count, 0)
            : null

          return (
            <button
              key={`${preset.range[0]}-${preset.range[1]}`}
              onClick={() => onChange(preset.range)}
              className="text-left p-4 rounded transition-all duration-200"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: selected ? 'var(--accent)' : 'var(--border)',
                background: selected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{preset.emoji}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-sm uppercase tracking-wider font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {preset.label} (Intensity {preset.range[0]}-{preset.range[1]})
                    </span>
                    {count !== null && (
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {count} hot takes
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {preset.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {distribution && (
        <div className="max-w-2xl mx-auto">
          <div
            className="text-xs font-mono uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Distribution across all hot takes
          </div>
          <div className="flex gap-1 h-12">
            {[1, 2, 3, 4, 5].map((level) => {
              const count = distribution[level] || 0
              const total = Object.values(distribution).reduce((sum, c) => sum + c, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0

              return (
                <div
                  key={level}
                  className="flex-1 flex flex-col justify-end"
                  title={`Intensity ${level}: ${count} hot takes (${percentage.toFixed(1)}%)`}
                >
                  <div
                    className="rounded-t transition-all duration-300"
                    style={{
                      height: `${percentage}%`,
                      minHeight: percentage > 0 ? '8px' : '0',
                      background: level <= 2
                        ? 'var(--agree)'
                        : level <= 3
                        ? 'var(--accent)'
                        : 'var(--disagree)',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    className="text-center text-xs font-mono mt-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {level}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
