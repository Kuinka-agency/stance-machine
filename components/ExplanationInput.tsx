'use client'

interface ExplanationInputProps {
  value: string
  onChange: (value: string) => void
}

export default function ExplanationInput({
  value,
  onChange,
}: ExplanationInputProps) {
  return (
    <div>
      <textarea
        id="explanation-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Say more... (optional)"
        className="w-full px-4 py-3.5 text-sm resize-none transition-all duration-200"
        style={{
          background: 'rgba(0, 0, 0, 0.04)',
          color: '#1a1a1a',
          border: '1.5px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 'var(--radius-md)',
          minHeight: '80px',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
        }}
        rows={3}
      />
    </div>
  )
}
