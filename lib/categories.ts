export interface HotTake {
  id: string
  statement: string
  category: string
  slug: string
  tone: string[]
  originalQuestion: string
  agreeReasons?: string[]
  disagreeReasons?: string[]
  intensity?: number
  intensityMetadata?: {
    aiGenerated: number
    voteRefined?: number
    polarization?: number
    avgExplanationLength?: number
    lastUpdated: string
  }
  enrichmentMetadata?: {
    model: string
    validationPassed: boolean
    timestamp: string
  }
  totalVotes?: number
  agreePercentage?: number
  topReason?: string
}

export type Stance = 'agree' | 'disagree' | null

export interface StanceCategory {
  name: string
  label: string
  color: string
  icon: string
  archetype: string
  romanNumeral: string
  symbol: string
}

export const CATEGORIES: StanceCategory[] = [
  { name: 'philosophy', label: 'Philosophy', color: 'var(--cat-philosophy)', icon: 'brain', archetype: 'The Thinker', romanNumeral: 'I', symbol: '◈' },
  { name: 'relationships', label: 'Relationships', color: 'var(--cat-relationships)', icon: 'heart', archetype: 'The Heart', romanNumeral: 'II', symbol: '◎' },
  { name: 'work', label: 'Work', color: 'var(--cat-work)', icon: 'briefcase', archetype: 'The Builder', romanNumeral: 'III', symbol: '▲' },
  { name: 'money', label: 'Money', color: 'var(--cat-money)', icon: 'banknote', archetype: 'The Merchant', romanNumeral: 'IV', symbol: '☸' },
  { name: 'lifestyle', label: 'Lifestyle', color: 'var(--cat-lifestyle)', icon: 'sun', archetype: 'The Seeker', romanNumeral: 'V', symbol: '✦' },
  { name: 'society', label: 'Society', color: 'var(--cat-society)', icon: 'globe', archetype: 'The Citizen', romanNumeral: 'VI', symbol: '⚖' },
]

export function getCategories(): StanceCategory[] {
  return CATEGORIES
}

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

  // Always use btoa in browser — Buffer polyfill may not support base64url
  if (typeof window !== 'undefined') {
    return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  // Server-side: use Buffer
  return Buffer.from(payload).toString('base64url')
}
