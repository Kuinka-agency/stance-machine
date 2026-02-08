'use client'

import { HotTake, StanceCategory, Stance } from '@/lib/categories'
import HotTakeCard from './HotTakeCard'
import HillToggle from './HillToggle'

// SVG icon paths for each category
const CATEGORY_ICONS: Record<string, string> = {
  brain: 'M12 2C9.5 2 7.5 4 7.5 6.5c0 .28.05.54.12.8C5.4 7.94 4 9.64 4 11.5c0 2 1.5 3.5 3.5 3.5h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5H7.5c-1.1 0-2-.9-2-2 0-1.1.9-2 2-2h.5c.28 0 .5-.22.5-.5V8c0-1.65 1.35-3 3-3s3 1.35 3 3v.5c0 .28.22.5.5.5h.5c1.1 0 2 .9 2 2 0 1.1-.9 2-2 2h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c2 0 3.5-1.5 3.5-3.5 0-1.86-1.4-3.56-3.62-3.2.07-.26.12-.52.12-.8C16.5 4 14.5 2 12 2zM10 14v8h4v-8h-4z',
  heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  briefcase: 'M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H4V9h16v10zM9 3h6v2h2V3c0-1.1-.9-2-2-2H9C7.9 1 7 1.9 7 3v2h2V3z',
  banknote: 'M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM7 8H5v2h2V8zm10 8h2v-2h-2v2z',
  sun: 'M12 18a6 6 0 100-12 6 6 0 000 12zM12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
}

interface StanceSlotProps {
  category: StanceCategory
  hotTake: HotTake | null
  stance: Stance
  isLocked: boolean
  isSpinning: boolean
  animationDelay: number
  onStance: (stance: Stance) => void
  onToggleLock: () => void
}

export default function StanceSlot({
  category,
  hotTake,
  stance,
  isLocked,
  isSpinning,
  animationDelay,
  onStance,
  onToggleLock,
}: StanceSlotProps) {
  const iconPath = CATEGORY_ICONS[category.icon] || ''

  return (
    <div className="flex flex-col group">
      {/* Category header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {iconPath && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: category.color }}
            >
              <path d={iconPath} />
            </svg>
          )}
          <span
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}
          >
            {category.label}
          </span>
        </div>
        <HillToggle
          isLocked={isLocked}
          onToggle={onToggleLock}
          disabled={isSpinning || stance === null}
        />
      </div>

      {/* Hot take card container */}
      <div
        className="relative overflow-hidden transition-all duration-300 flex-1"
        style={{
          borderRadius: 'var(--radius-md)',
          border: isLocked
            ? `2px solid ${category.color}`
            : '1px solid var(--border)',
          background: 'var(--bg-card)',
          minHeight: '180px',
        }}
      >
        {/* Category color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: category.color }}
        />

        {hotTake ? (
          <div
            className={isSpinning && !isLocked ? 'animate-slot-spin' : ''}
            style={{ animationDelay: `${animationDelay}ms` }}
          >
            <HotTakeCard
              hotTake={hotTake}
              stance={stance}
              onStance={onStance}
              isLocked={isLocked}
            />
          </div>
        ) : (
          <div
            className="h-full min-h-[180px] flex items-center justify-center"
            style={{ background: 'var(--bg-inset)' }}
          >
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
