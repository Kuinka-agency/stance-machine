import { getSQL } from './db'
import { getCategories } from './categories'
import type { HotTake } from './categories'

export type { HotTake, StanceCategory, Stance } from './categories'
export { getCategories } from './categories'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): HotTake {
  return {
    id: row.id,
    statement: row.statement,
    category: row.category,
    slug: row.slug,
    tone: row.tone || [],
    originalQuestion: row.original_question,
    agreeReasons: row.agree_reasons || undefined,
    disagreeReasons: row.disagree_reasons || undefined,
    intensity: row.intensity || undefined,
    intensityMetadata: row.intensity_ai_generated
      ? {
          aiGenerated: row.intensity_ai_generated,
          lastUpdated: row.intensity_last_updated?.toISOString?.() || row.intensity_last_updated || '',
        }
      : undefined,
    enrichmentMetadata: row.enrichment_model
      ? {
          model: row.enrichment_model,
          validationPassed: row.enrichment_validated || false,
          timestamp: row.enrichment_timestamp?.toISOString?.() || row.enrichment_timestamp || '',
        }
      : undefined,
  }
}

// ============================================
// IN-MEMORY CACHE — load once, serve forever
// ============================================

let _cache: HotTake[] | null = null
let _cachePromise: Promise<HotTake[]> | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let _cacheTimestamp = 0

async function getCachedHotTakes(): Promise<HotTake[]> {
  const now = Date.now()

  // Return cache if fresh
  if (_cache && (now - _cacheTimestamp) < CACHE_TTL) {
    return _cache
  }

  // Deduplicate concurrent loads
  if (_cachePromise) return _cachePromise

  _cachePromise = (async () => {
    try {
      const sql = getSQL()
      const rows = await sql`SELECT * FROM hot_takes WHERE agree_reasons IS NOT NULL`
      _cache = rows.map(mapRow)
      _cacheTimestamp = Date.now()
      console.log(`[hot-takes] Cached ${_cache.length} hot takes`)
      return _cache
    } finally {
      _cachePromise = null
    }
  })()

  return _cachePromise
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================
// PUBLIC API — all read from cache
// ============================================

export async function getAllHotTakes(): Promise<HotTake[]> {
  return getCachedHotTakes()
}

export async function getHotTakeById(id: string): Promise<HotTake | null> {
  const all = await getCachedHotTakes()
  return all.find(t => t.id === id) || null
}

export async function getHotTakesByCategory(category: string): Promise<HotTake[]> {
  const all = await getCachedHotTakes()
  return all.filter(t => t.category === category)
}

export async function getRandomHotTake(
  category: string,
  excludeIds: string[] = []
): Promise<HotTake | null> {
  const all = await getCachedHotTakes()
  const candidates = all.filter(
    t => t.category === category && !excludeIds.includes(t.id)
  )
  return pickRandom(candidates)
}

export interface SpinResult {
  [category: string]: HotTake
}

export async function spinHotTakes(locked: Record<string, string> = {}): Promise<SpinResult> {
  const categories = getCategories()
  const result: SpinResult = {}

  for (const cat of categories) {
    if (locked[cat.name]) {
      const take = await getHotTakeById(locked[cat.name])
      if (take) {
        result[cat.name] = take
        continue
      }
    }

    const take = await getRandomHotTake(cat.name)
    if (take) {
      result[cat.name] = take
    }
  }

  return result
}

export async function getFilteredHotTakes(options: {
  category?: string
  tone?: string
  limit?: number
}): Promise<HotTake[]> {
  const all = await getCachedHotTakes()
  let filtered = all

  if (options.category) {
    filtered = filtered.filter(t => t.category === options.category)
  }
  if (options.tone) {
    filtered = filtered.filter(t => t.tone.includes(options.tone!))
  }
  if (options.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return filtered
}

export async function getHotTakeBySlug(slug: string): Promise<HotTake | null> {
  const all = await getCachedHotTakes()
  return all.find(t => t.slug === slug) || null
}

export async function getHotTakesByIntensity(
  category: string,
  intensityMin: number,
  intensityMax: number
): Promise<HotTake[]> {
  const all = await getCachedHotTakes()
  return all.filter(
    t => t.category === category &&
    t.intensity !== undefined &&
    t.intensity >= intensityMin &&
    t.intensity <= intensityMax
  )
}

export async function getIntensityDistribution(category?: string): Promise<Record<number, number>> {
  const all = await getCachedHotTakes()
  const filtered = category ? all.filter(t => t.category === category) : all

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const t of filtered) {
    const intensity = t.intensity || 3
    distribution[intensity] = (distribution[intensity] || 0) + 1
  }
  return distribution
}

export async function getRandomHotTakeWithIntensity(
  category: string,
  intensityMin: number,
  intensityMax: number,
  excludeIds: string[] = []
): Promise<HotTake | null> {
  const all = await getCachedHotTakes()
  const candidates = all.filter(
    t => t.category === category &&
    !excludeIds.includes(t.id) &&
    t.intensity !== undefined &&
    t.intensity >= intensityMin &&
    t.intensity <= intensityMax
  )
  return pickRandom(candidates)
}
