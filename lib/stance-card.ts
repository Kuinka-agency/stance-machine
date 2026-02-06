import { type HotTake, type Stance, getHotTakeById } from './hot-takes'

export interface StanceEntry {
  take: HotTake
  stance: Stance
}

/**
 * Encode 6 stance selections into a shareable hash.
 * Format: id1.s|id2.s|id3.s|id4.s|id5.s|id6.s
 * where s = 'a' (agree) or 'd' (disagree)
 *
 * Then base64url encode for URL safety.
 */
export function encodeStanceCard(entries: StanceEntry[]): string {
  const payload = entries
    .map((e) => `${e.take.id}.${e.stance === 'agree' ? 'a' : 'd'}`)
    .join('|')

  // Simple base64url encoding
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(payload).toString('base64url')
  }
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a stance card hash back into entries.
 */
export function decodeStanceCard(hash: string): StanceEntry[] | null {
  try {
    let payload: string
    if (typeof Buffer !== 'undefined') {
      payload = Buffer.from(hash, 'base64url').toString()
    } else {
      const padded = hash.replace(/-/g, '+').replace(/_/g, '/')
      payload = atob(padded)
    }

    const pairs = payload.split('|')
    const entries: StanceEntry[] = []

    for (const pair of pairs) {
      const [id, stanceChar] = pair.split('.')
      const take = getHotTakeById(id)
      if (!take) return null

      entries.push({
        take,
        stance: stanceChar === 'a' ? 'agree' : 'disagree',
      })
    }

    return entries
  } catch {
    return null
  }
}
