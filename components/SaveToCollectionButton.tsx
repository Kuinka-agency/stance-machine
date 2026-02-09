'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { getSessionId } from '@/lib/session'
import { track } from '@/lib/analytics'

interface SaveToCollectionButtonProps {
  stanceHash: string
}

export default function SaveToCollectionButton({ stanceHash }: SaveToCollectionButtonProps) {
  const { data: session, status } = useSession()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  const handleSave = async () => {
    if (status === 'unauthenticated') {
      track('save_collection_auth_prompt')
      // Set session_id as cookie so server can stitch votes on sign-in
      document.cookie = `stance_session_id=${getSessionId()}; path=/; max-age=86400; SameSite=Lax`
      signIn('resend')
      return
    }

    if (!session?.user?.id || saved || saving) return

    setSaving(true)
    setError(false)

    try {
      const res = await fetch('/api/save-stance-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stance_hash: stanceHash,
          session_id: getSessionId(),
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      track('stance_card_saved')
      setSaved(true)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return null

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="font-mono text-xs uppercase tracking-wider px-6 py-2.5 transition-all duration-200"
      style={{
        border: `1px solid ${saved ? 'var(--agree)' : error ? 'var(--disagree)' : 'var(--accent)'}`,
        borderRadius: 'var(--radius-sm)',
        color: saved ? 'var(--bg-primary)' : error ? 'var(--disagree)' : 'var(--accent)',
        background: saved ? 'var(--agree)' : 'transparent',
        opacity: saving ? 0.6 : 1,
        cursor: saved ? 'default' : 'pointer',
      }}
    >
      {saved ? 'Saved!' : saving ? 'Saving...' : error ? 'Failed — try again' : 'Save to Collection'}
    </button>
  )
}
