'use client'

import { HotTake, Stance } from '@/lib/categories'
import AgreeDisagreeButtons from './AgreeDisagreeButtons'

interface HotTakeCardProps {
  hotTake: HotTake
  stance: Stance
  onStance: (stance: Stance) => void
  isLocked: boolean
}

export default function HotTakeCard({
  hotTake,
  stance,
  onStance,
  isLocked,
}: HotTakeCardProps) {
  return (
    <div className="p-3 sm:p-4 h-full flex flex-col justify-between">
      {/* Statement text */}
      <div className="flex-1 flex items-center mb-3">
        <p
          className="text-sm sm:text-base font-semibold leading-snug"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {hotTake.statement}
        </p>
      </div>

      {/* Agree/Disagree buttons */}
      <AgreeDisagreeButtons
        stance={stance}
        onStance={onStance}
        disabled={isLocked}
      />

      {/* Tone badge */}
      {hotTake.tone.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {hotTake.tone.slice(0, 2).map((t) => (
            <span
              key={t}
              className="font-mono px-1.5 py-0.5"
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-inset)',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
