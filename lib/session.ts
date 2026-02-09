/**
 * Client-side session_id manager using localStorage.
 * Provides a stable anonymous identity across page refreshes.
 */

const SESSION_KEY = 'stance_session_id'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}
