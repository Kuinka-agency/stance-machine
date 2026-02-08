'use client'

interface ProgressIndicatorProps {
  current: number
  total: number
}

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percentage = (current / total) * 100

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className="font-mono text-xs"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {current}/{total}
      </span>
    </div>
  )
}
