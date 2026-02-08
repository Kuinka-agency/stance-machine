'use client'

import { StanceCategory } from '@/lib/categories'

interface ProgressIndicatorProps {
  current: number
  total: number
  categories: StanceCategory[]
  completedCategories: string[]
  currentCategoryName?: string
}

export default function ProgressIndicator({
  categories,
  completedCategories,
  currentCategoryName,
}: ProgressIndicatorProps) {
  const categoryInitials: Record<string, string> = {
    philosophy: 'P',
    relationships: 'R',
    work: 'W',
    money: 'M',
    lifestyle: 'L',
    society: 'S',
  }

  return (
    <div className="flex items-center gap-2">
      {categories.map((cat) => {
        const isCompleted = completedCategories.includes(cat.name)
        const isCurrent = cat.name === currentCategoryName
        const initial = categoryInitials[cat.name] || cat.label.charAt(0)

        return (
          <div
            key={cat.name}
            className="flex-1 flex items-center justify-center font-mono text-xs font-medium uppercase transition-all duration-300"
            style={{
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: isCompleted ? cat.color : 'transparent',
              border: isCurrent
                ? `2px solid ${cat.color}`
                : isCompleted
                ? 'none'
                : '1.5px solid var(--border)',
              color: isCompleted
                ? 'white'
                : isCurrent
                ? cat.color
                : 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            {initial}
          </div>
        )
      })}
    </div>
  )
}
