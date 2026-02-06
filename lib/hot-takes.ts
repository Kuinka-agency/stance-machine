import hotTakesData from '@/data/hot-takes.json'

export interface HotTake {
  id: string
  statement: string
  category: string
  slug: string
  tone: string[]
  originalQuestion: string
}

export interface StanceCategory {
  name: string
  label: string
  color: string
  icon: string
}

export type Stance = 'agree' | 'disagree' | null

const CATEGORIES: StanceCategory[] = [
  { name: 'philosophy', label: 'Philosophy', color: 'var(--cat-philosophy)', icon: 'brain' },
  { name: 'relationships', label: 'Relationships', color: 'var(--cat-relationships)', icon: 'heart' },
  { name: 'work', label: 'Work', color: 'var(--cat-work)', icon: 'briefcase' },
  { name: 'money', label: 'Money', color: 'var(--cat-money)', icon: 'banknote' },
  { name: 'lifestyle', label: 'Lifestyle', color: 'var(--cat-lifestyle)', icon: 'sun' },
  { name: 'society', label: 'Society', color: 'var(--cat-society)', icon: 'globe' },
]

// Parse all hot takes at module load
const allHotTakes: HotTake[] = (hotTakesData as any[]).map((h) => ({
  id: h.id,
  statement: h.statement,
  category: h.category,
  slug: h.slug,
  tone: h.tone,
  originalQuestion: h.originalQuestion,
}))

// Index by category
const takesByCategory: Record<string, HotTake[]> = {}
for (const take of allHotTakes) {
  if (!takesByCategory[take.category]) {
    takesByCategory[take.category] = []
  }
  takesByCategory[take.category].push(take)
}

const takesById: Record<string, HotTake> = {}
for (const take of allHotTakes) {
  takesById[take.id] = take
}

export function getCategories(): StanceCategory[] {
  return CATEGORIES
}

export function getAllHotTakes(): HotTake[] {
  return allHotTakes
}

export function getHotTakeById(id: string): HotTake | null {
  return takesById[id] || null
}

export function getHotTakesByCategory(category: string): HotTake[] {
  return takesByCategory[category] || []
}

export function getRandomHotTake(
  category: string,
  excludeIds: string[] = []
): HotTake | null {
  const pool = (takesByCategory[category] || []).filter(
    (t) => !excludeIds.includes(t.id)
  )
  if (pool.length === 0) return null

  // Equal-weight random
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export interface SpinResult {
  [category: string]: HotTake
}

export function spinHotTakes(locked: Record<string, string> = {}): SpinResult {
  const categories = getCategories()
  const result: SpinResult = {}

  for (const cat of categories) {
    if (locked[cat.name]) {
      const take = getHotTakeById(locked[cat.name])
      if (take) {
        result[cat.name] = take
        continue
      }
    }

    const take = getRandomHotTake(cat.name)
    if (take) {
      result[cat.name] = take
    }
  }

  return result
}

// For pSEO: filter by category and/or tone
export function getFilteredHotTakes(options: {
  category?: string
  tone?: string
  limit?: number
}): HotTake[] {
  let pool = allHotTakes

  if (options.category) {
    pool = pool.filter((t) => t.category === options.category)
  }

  if (options.tone) {
    pool = pool.filter((t) => t.tone.includes(options.tone!))
  }

  if (options.limit) {
    pool = pool.slice(0, options.limit)
  }

  return pool
}

export function getHotTakeBySlug(slug: string): HotTake | null {
  return allHotTakes.find((t) => t.slug === slug) || null
}
