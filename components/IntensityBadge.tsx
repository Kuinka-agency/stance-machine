interface IntensityBadgeProps {
  intensity?: number
}

export default function IntensityBadge({ intensity }: IntensityBadgeProps) {
  if (!intensity) return null

  const config: Record<number, { emoji: string; label: string; color: string }> = {
    1: { emoji: '😌', label: 'Chill', color: 'var(--agree)' },
    2: { emoji: '💬', label: 'Casual', color: 'var(--text-secondary)' },
    3: { emoji: '🤔', label: 'Engaged', color: 'var(--accent)' },
    4: { emoji: '🔥', label: 'Heated', color: 'var(--disagree)' },
    5: { emoji: '💥', label: 'Existential', color: 'var(--disagree)' },
  }

  const { emoji, label, color } = config[intensity] || config[3]

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono uppercase tracking-wider"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: color,
        color: color,
        opacity: 0.8,
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}
