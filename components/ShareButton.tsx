'use client'

import { useState } from 'react'

interface ShareButtonProps {
  url: string
}

export default function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-xs uppercase tracking-wider px-6 py-2.5 transition-all duration-200"
      style={{
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-sm)',
        color: copied ? 'var(--bg-primary)' : 'var(--accent)',
        background: copied ? 'var(--accent)' : 'transparent',
      }}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  )
}
