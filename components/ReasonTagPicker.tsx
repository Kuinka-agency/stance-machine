'use client'

interface ReasonTagPickerProps {
  reasons: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
}

export default function ReasonTagPicker({
  reasons,
  selectedTags,
  onToggle,
}: ReasonTagPickerProps) {
  if (!reasons || reasons.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {reasons.map((reason) => {
        const isSelected = selectedTags.includes(reason)
        return (
          <button
            key={reason}
            onClick={() => onToggle(reason)}
            className="px-3 py-1.5 text-xs rounded-full transition-all duration-200"
            style={{
              background: isSelected ? 'var(--accent)' : 'var(--bg-inset)',
              color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {reason}
          </button>
        )
      })}
    </div>
  )
}
