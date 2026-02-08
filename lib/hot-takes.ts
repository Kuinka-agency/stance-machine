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

export async function getAllHotTakes(): Promise<HotTake[]> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM hot_takes`
  return rows.map(mapRow)
}

export async function getHotTakeById(id: string): Promise<HotTake | null> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM hot_takes WHERE id = ${id}`
  if (rows.length === 0) return null
  return mapRow(rows[0])
}

export async function getHotTakesByCategory(category: string): Promise<HotTake[]> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM hot_takes WHERE category = ${category}`
  return rows.map(mapRow)
}

export async function getRandomHotTake(
  category: string,
  excludeIds: string[] = []
): Promise<HotTake | null> {
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM hot_takes
    WHERE category = ${category}
      AND id != ALL(${excludeIds})
      AND agree_reasons IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
  `
  if (rows.length === 0) return null
  return mapRow(rows[0])
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
  const sql = getSQL()

  if (options.category && options.tone) {
    const rows = await sql`
      SELECT * FROM hot_takes
      WHERE category = ${options.category}
        AND ${options.tone} = ANY(tone)
        AND agree_reasons IS NOT NULL
      LIMIT ${options.limit || 1000}
    `
    return rows.map(mapRow)
  }

  if (options.category) {
    const rows = await sql`
      SELECT * FROM hot_takes
      WHERE category = ${options.category}
        AND agree_reasons IS NOT NULL
      LIMIT ${options.limit || 1000}
    `
    return rows.map(mapRow)
  }

  if (options.tone) {
    const rows = await sql`
      SELECT * FROM hot_takes
      WHERE ${options.tone} = ANY(tone)
        AND agree_reasons IS NOT NULL
      LIMIT ${options.limit || 1000}
    `
    return rows.map(mapRow)
  }

  const rows = await sql`
    SELECT * FROM hot_takes
    WHERE agree_reasons IS NOT NULL
    LIMIT ${options.limit || 1000}
  `
  return rows.map(mapRow)
}

export async function getHotTakeBySlug(slug: string): Promise<HotTake | null> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM hot_takes WHERE slug = ${slug}`
  if (rows.length === 0) return null
  return mapRow(rows[0])
}

export async function getHotTakesByIntensity(
  category: string,
  intensityMin: number,
  intensityMax: number
): Promise<HotTake[]> {
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM hot_takes
    WHERE category = ${category}
      AND intensity BETWEEN ${intensityMin} AND ${intensityMax}
  `
  return rows.map(mapRow)
}

export async function getIntensityDistribution(category?: string): Promise<Record<number, number>> {
  const sql = getSQL()

  const rows = category
    ? await sql`
        SELECT intensity, COUNT(*) as count
        FROM hot_takes
        WHERE category = ${category} AND agree_reasons IS NOT NULL
        GROUP BY intensity
        ORDER BY intensity
      `
    : await sql`
        SELECT intensity, COUNT(*) as count
        FROM hot_takes
        WHERE agree_reasons IS NOT NULL
        GROUP BY intensity
        ORDER BY intensity
      `

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of rows) {
    distribution[Number(row.intensity)] = Number(row.count)
  }
  return distribution
}

export async function getRandomHotTakeWithIntensity(
  category: string,
  intensityMin: number,
  intensityMax: number,
  excludeIds: string[] = []
): Promise<HotTake | null> {
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM hot_takes
    WHERE category = ${category}
      AND id != ALL(${excludeIds})
      AND intensity BETWEEN ${intensityMin} AND ${intensityMax}
      AND agree_reasons IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
  `
  if (rows.length === 0) return null
  return mapRow(rows[0])
}
