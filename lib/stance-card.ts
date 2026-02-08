import { getHotTakeById } from './hot-takes'
import type { StanceEntry } from './categories'

export type { StanceEntry } from './categories'
export { encodeStanceCard } from './categories'

/**
 * Decode a stance card hash back into entries.
 * Server-only: requires DB access via getHotTakeById.
 */
export async function decodeStanceCard(hash: string): Promise<StanceEntry[] | null> {
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
      const take = await getHotTakeById(id)
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
