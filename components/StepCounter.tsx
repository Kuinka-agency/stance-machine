interface StepCounterProps {
  current: number
  total: number
  categoryName: string
  categoryColor: string
}

export default function StepCounter({
  current,
  total,
  categoryName,
  categoryColor,
}: StepCounterProps) {
  return (
    <div
      className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span style={{ color: 'var(--text-tertiary)' }}>
        {current}/{total}
      </span>
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: categoryColor }}
      />
      <span style={{ color: categoryColor, fontWeight: 500 }}>
        {categoryName}
      </span>
    </div>
  )
}
