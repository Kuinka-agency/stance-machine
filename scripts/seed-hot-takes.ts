/**
 * Seed hot_takes table from data/hot-takes.json
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed-hot-takes.ts
 *
 * Idempotent: uses ON CONFLICT (id) DO UPDATE so it can be re-run safely.
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

const BATCH_SIZE = 25 // rows per single INSERT statement

interface RawHotTake {
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
    lastUpdated: string
  }
  enrichmentMetadata?: {
    model: string
    validationPassed: boolean
    timestamp: string
  }
}

function esc(val: string): string {
  return val.replace(/'/g, "''")
}

function pgArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return 'NULL'
  const escaped = arr.map((s) => `"${esc(s)}"`).join(',')
  return `'{${escaped}}'`
}

function pgStr(val: string | undefined): string {
  if (!val) return 'NULL'
  return `'${esc(val)}'`
}

function buildValuesRow(take: RawHotTake): string {
  return `(
    '${esc(take.id)}', '${esc(take.statement)}', '${esc(take.category)}', '${esc(take.slug)}',
    '{${take.tone.map((t) => `"${esc(t)}"`).join(',')}}', '${esc(take.originalQuestion)}',
    ${pgArray(take.agreeReasons)}, ${pgArray(take.disagreeReasons)},
    ${take.intensity || 3},
    ${take.intensityMetadata?.aiGenerated ?? 'NULL'},
    ${pgStr(take.intensityMetadata?.lastUpdated)},
    ${pgStr(take.enrichmentMetadata?.model)},
    ${take.enrichmentMetadata?.validationPassed ?? false},
    ${pgStr(take.enrichmentMetadata?.timestamp)}
  )`
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  // Create table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS hot_takes (
      id VARCHAR(12) PRIMARY KEY,
      statement TEXT NOT NULL,
      category VARCHAR(20) NOT NULL,
      slug VARCHAR(80) NOT NULL,
      tone TEXT[] NOT NULL DEFAULT '{}',
      original_question TEXT NOT NULL,
      agree_reasons TEXT[],
      disagree_reasons TEXT[],
      intensity SMALLINT DEFAULT 3,
      intensity_ai_generated SMALLINT,
      intensity_last_updated TIMESTAMPTZ,
      enrichment_model VARCHAR(50),
      enrichment_validated BOOLEAN DEFAULT FALSE,
      enrichment_timestamp TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_hot_takes_category ON hot_takes(category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_hot_takes_intensity ON hot_takes(category, intensity)`
  await sql`CREATE INDEX IF NOT EXISTS idx_hot_takes_slug ON hot_takes(slug)`

  console.log('Table and indexes created/verified.')

  // Read JSON data
  const jsonPath = join(__dirname, '..', 'data', 'hot-takes.json')
  const rawData: RawHotTake[] = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  console.log(`Loaded ${rawData.length} hot takes from JSON.`)

  // Batch insert using multi-row INSERT ... VALUES
  let inserted = 0
  for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
    const batch = rawData.slice(i, i + BATCH_SIZE)

    const valueRows = batch.map(buildValuesRow).join(',\n')
    const query = `INSERT INTO hot_takes (
      id, statement, category, slug, tone, original_question,
      agree_reasons, disagree_reasons, intensity,
      intensity_ai_generated, intensity_last_updated,
      enrichment_model, enrichment_validated, enrichment_timestamp
    ) VALUES ${valueRows}
    ON CONFLICT (id) DO UPDATE SET
      statement = EXCLUDED.statement,
      category = EXCLUDED.category,
      slug = EXCLUDED.slug,
      tone = EXCLUDED.tone,
      original_question = EXCLUDED.original_question,
      agree_reasons = EXCLUDED.agree_reasons,
      disagree_reasons = EXCLUDED.disagree_reasons,
      intensity = EXCLUDED.intensity,
      intensity_ai_generated = EXCLUDED.intensity_ai_generated,
      intensity_last_updated = EXCLUDED.intensity_last_updated,
      enrichment_model = EXCLUDED.enrichment_model,
      enrichment_validated = EXCLUDED.enrichment_validated,
      enrichment_timestamp = EXCLUDED.enrichment_timestamp`

    // Retry up to 3 times per batch
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await sql.query(query)
        break
      } catch (err: any) {
        if (attempt < 2) {
          console.log(`  Retry batch at offset ${i} (attempt ${attempt + 2}/3)...`)
          await sleep(2000 * (attempt + 1))
        } else {
          throw err
        }
      }
    }

    inserted += batch.length
    console.log(`  Inserted ${inserted}/${rawData.length}`)
  }

  // Verify
  const countResult = await sql`SELECT COUNT(*) as count FROM hot_takes`
  console.log(`\nDone! ${countResult[0].count} hot takes in database.`)

  // Distribution check
  const dist = await sql`
    SELECT category, COUNT(*) as count
    FROM hot_takes
    GROUP BY category
    ORDER BY count DESC
  `
  console.log('\nCategory distribution:')
  for (const row of dist) {
    console.log(`  ${row.category}: ${row.count}`)
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
