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
            className="px-3.5 py-2 text-xs rounded-full transition-all duration-200"
            style={{
              background: isSelected ? 'var(--accent)' : 'var(--bg-inset)',
              color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              cursor: 'pointer',
              transform: isSelected ? 'scale(1.03)' : 'scale(1)',
              fontWeight: isSelected ? 500 : 400,
            }}
          >
            {reason}
          </button>
        )
      })}
    </div>
  )
}
