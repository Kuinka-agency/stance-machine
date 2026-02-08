'use client'

interface ExplanationInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export default function ExplanationInput({
  value,
  onChange,
  maxLength = 280,
}: ExplanationInputProps) {
  const remaining = maxLength - value.length

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Explain your reasoning... (optional)"
        maxLength={maxLength}
        className="w-full px-4 py-3 text-sm resize-none focus:outline-none transition-all duration-200"
        style={{
          background: 'var(--bg-inset)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          minHeight: '80px',
        }}
        rows={3}
      />
      <div className="flex justify-end">
        <span
          className="text-xs font-mono"
          style={{
            color: remaining < 20 ? 'var(--disagree)' : 'var(--text-muted)',
          }}
        >
          {remaining} characters left
        </span>
      </div>
    </div>
  )
}
