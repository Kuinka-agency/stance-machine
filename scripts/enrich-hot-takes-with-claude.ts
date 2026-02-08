/**
 * enrich-hot-takes-with-claude.ts
 *
 * Enrich unenriched hot takes using the Anthropic Batch API (50% cheaper).
 * Transforms broken template statements into natural, tweet-worthy statements,
 * generates agree/disagree reasons, and assigns intensity scores.
 *
 * Input: data/hot-takes.json
 * Output: data/hot-takes.json (enriched in place)
 *
 * CLI modes:
 *   --dry-run         Show stats on unenriched takes
 *   --prepare-batch   Generate enrichment-batch-request.jsonl
 *   --submit-batch    Submit to Anthropic Batch API
 *   --check-batch     Poll status, download results when done
 *   --merge-results   Parse results, validate, update hot-takes.json
 *
 * Usage:
 *   npx tsx scripts/enrich-hot-takes-with-claude.ts --dry-run
 *   npx tsx scripts/enrich-hot-takes-with-claude.ts --prepare-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --submit-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --check-batch
 *   npx tsx scripts/enrich-hot-takes-with-claude.ts --merge-results
 */

import * as fs from 'fs'
import * as path from 'path'
import Anthropic from '@anthropic-ai/sdk'

// ─── Types ───────────────────────────────────────────────────────────────────

interface HotTake {
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

interface EnrichmentResult {
  id: string
  statement: string
  agreeReasons: string[]
  disagreeReasons: string[]
  intensity: number
  intensityRationale: string
  validationPassed: boolean
  validationErrors?: string[]
}

interface BatchStatus {
  batchId: string
  submittedAt: string
  inputFile: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const HOT_TAKES_PATH = path.resolve(__dirname, '../data/hot-takes.json')
const BATCH_REQUEST_PATH = path.resolve(__dirname, '../data/enrichment-batch-request.jsonl')
const BATCH_STATUS_PATH = path.resolve(__dirname, '../data/enrichment-batch-status.json')
const BATCH_RESULTS_PATH = path.resolve(__dirname, '../data/enrichment-batch-results.jsonl')

const BATCH_SIZE = 20

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a hot take transformation specialist. Your job is to:

1. Transform questions into natural, tweet-worthy statements (< 280 chars)
2. Generate 3-5 context-specific reasons people AGREE with the statement
3. Generate 3-5 context-specific reasons people DISAGREE with the statement

**Transformation rules:**

BINARY (Would you rather A or B?):
- Transform to: "A beats B every time"
- Examples:
  - "Would you rather be rich or famous?" → "Being rich beats being famous"
  - "Would you rather have more time or more money?" → "More time beats more money every day"

OPINION (Do you think X?):
- Transform to declarative: "X"
- Examples:
  - "Do you think money can buy happiness?" → "Money can buy happiness"
  - "Do you think remote work is better?" → "Remote work beats office life"

COMPLEX QUESTIONS:
- Extract core tension and make provocative
- Examples:
  - "Is a bowl of lettuce actually a salad?" → "A bowl of lettuce is basically a salad"
  - "Can you do any great impressions?" → "Anyone can learn to do great impressions"

**Quality requirements:**
- Natural, conversational tone
- No mechanical phrases like "is better than" unless it flows naturally
- Tweet-worthy (shareable, debate-worthy)
- Category-appropriate voice:
  - philosophy: thoughtful, provocative
  - relationships: warm, relatable
  - work: practical, aspirational
  - money: bold, direct
  - lifestyle: fun, casual
  - society: challenging, current

**Reason tags:**
- Must be specific to THIS hot take (not generic)
- 5-10 words max per reason
- Common reasons real people would have
- Mix emotional and logical reasons
- Examples:
  - For "Remote work beats office life":
    - Agree: ["No commute saves hours", "Better work-life balance", "More productive at home", "Flexibility with schedule", "Comfortable environment"]
    - Disagree: ["Miss team collaboration", "Harder to focus at home", "Feel isolated", "Blurred work-life boundaries", "Career growth limited"]

**Intensity scoring (1-5 scale):**

For each hot take, assign an INTENSITY score based on how much is at stake:

1 - Chill: Lighthearted preference, no real stakes
   Example: "Pineapple belongs on pizza"
   Characteristics: Playful, no identity investment

2 - Casual: Personal preference with practical reasoning
   Example: "Remote work beats office life"
   Characteristics: Practical disagreement, lifestyle choices

3 - Engaged: Values-based opinion, some identity investment
   Example: "Money can buy happiness"
   Characteristics: Polarizing but not extreme, thoughtful debate

4 - Heated: Touches identity, morality, worldview
   Example: "Monogamy is outdated"
   Characteristics: Strong convictions, emotional investment

5 - Existential: Fundamental belief about reality/meaning/ethics
   Example: "Free will is an illusion"
   Characteristics: Philosophical stakes, worldview-defining

Consider:
- Stakes involved (practical vs existential)
- Identity/values alignment
- Potential for emotional investment
- Controversy across cultures/demographics

Output JSON format for each hot take:
{
  "statement": "Natural, tweet-worthy statement",
  "agreeReasons": ["Reason 1", "Reason 2", "Reason 3", "Reason 4", "Reason 5"],
  "disagreeReasons": ["Reason 1", "Reason 2", "Reason 3", "Reason 4", "Reason 5"],
  "intensity": 3,
  "intensityRationale": "Brief explanation of why this intensity level"
}`

// ─── Validation ──────────────────────────────────────────────────────────────

function validateEnrichment(result: EnrichmentResult): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Length check
  if (result.statement.length > 280) {
    errors.push(`Statement too long (${result.statement.length} chars)`)
  }

  // Grammar check (no broken constructions)
  if (result.statement.match(/^(would you|is |do you|can you)/i)) {
    errors.push('Statement still in question format')
  }

  // Mechanical artifacts check
  if (result.statement.match(/\b(is better than|is possible)\b/i)) {
    errors.push('Contains mechanical template phrases')
  }

  // Reason tags validation
  if (!result.agreeReasons || result.agreeReasons.length < 3) {
    errors.push('Need at least 3 agree reasons')
  }
  if (!result.disagreeReasons || result.disagreeReasons.length < 3) {
    errors.push('Need at least 3 disagree reasons')
  }

  // Reason length check
  const allReasons = [...(result.agreeReasons || []), ...(result.disagreeReasons || [])]
  for (const reason of allReasons) {
    if (reason.length > 60) {
      errors.push(`Reason too long: "${reason}"`)
    }
  }

  // Intensity validation
  if (!result.intensity || result.intensity < 1 || result.intensity > 5) {
    errors.push('Intensity must be 1-5')
  }
  if (!result.intensityRationale || result.intensityRationale.length === 0) {
    errors.push('Intensity rationale required')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadHotTakes(): HotTake[] {
  if (!fs.existsSync(HOT_TAKES_PATH)) {
    console.error(`Input file not found: ${HOT_TAKES_PATH}`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(HOT_TAKES_PATH, 'utf-8'))
}

function getUnenriched(hotTakes: HotTake[]): HotTake[] {
  return hotTakes.filter(ht => !ht.enrichmentMetadata)
}

// ─── CLI Commands ────────────────────────────────────────────────────────────

async function dryRun() {
  console.log('=== DRY RUN: Enrichment Stats ===\n')

  const hotTakes = loadHotTakes()
  const unenriched = getUnenriched(hotTakes)
  const enriched = hotTakes.filter(ht => ht.enrichmentMetadata)

  console.log(`Total hot takes: ${hotTakes.length}`)
  console.log(`Already enriched: ${enriched.length}`)
  console.log(`Unenriched (to process): ${unenriched.length}`)
  console.log(`Batch requests needed: ${Math.ceil(unenriched.length / BATCH_SIZE)} (${BATCH_SIZE} per batch)`)

  // Category breakdown of unenriched
  const catCount: Record<string, number> = {}
  for (const ht of unenriched) {
    catCount[ht.category] = (catCount[ht.category] || 0) + 1
  }
  console.log(`\nUnenriched by category:`)
  for (const [cat, count] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  // Sample unenriched takes
  console.log(`\nSample unenriched hot takes:`)
  for (const ht of unenriched.slice(0, 5)) {
    console.log(`\n  ID: ${ht.id}`)
    console.log(`  Original: ${ht.originalQuestion}`)
    console.log(`  Current: ${ht.statement}`)
    console.log(`  Category: ${ht.category}`)
  }

  // Cost estimate
  const estimatedInputTokens = unenriched.length * 200
  const estimatedOutputTokens = unenriched.length * 120
  const inputCost = (estimatedInputTokens / 1_000_000) * 3 * 0.5
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15 * 0.5
  const totalCost = inputCost + outputCost

  console.log(`\nEstimated cost (Batch API with 50% discount):`)
  console.log(`  Input: ~${estimatedInputTokens.toLocaleString()} tokens → $${inputCost.toFixed(2)}`)
  console.log(`  Output: ~${estimatedOutputTokens.toLocaleString()} tokens → $${outputCost.toFixed(2)}`)
  console.log(`  Total: ~$${totalCost.toFixed(2)}`)
  console.log(`\nNext step: npx tsx scripts/enrich-hot-takes-with-claude.ts --prepare-batch`)
}

async function prepareBatch() {
  console.log('=== PREPARE BATCH ===\n')

  const hotTakes = loadHotTakes()
  const unenriched = getUnenriched(hotTakes)

  if (unenriched.length === 0) {
    console.log('All hot takes are already enriched. Nothing to do.')
    return
  }

  console.log(`Found ${unenriched.length} unenriched hot takes\n`)

  // Split into batches
  const batches: HotTake[][] = []
  for (let i = 0; i < unenriched.length; i += BATCH_SIZE) {
    batches.push(unenriched.slice(i, i + BATCH_SIZE))
  }

  console.log(`Creating ${batches.length} batch requests (${BATCH_SIZE} per batch)\n`)

  const lines: string[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    const batchPrompt = batch.map((ht, idx) => {
      return `[${idx}] ID: "${ht.id}"
Original: "${ht.originalQuestion}"
Current statement: "${ht.statement}"
Category: ${ht.category}
Tone: ${ht.tone.join(', ')}`
    }).join('\n\n')

    const userPrompt = `Transform these ${batch.length} hot takes into natural statements with reason tags and intensity scores.

${batchPrompt}

Return a JSON array with ${batch.length} objects, one for each hot take above (in order).
Each object must have: statement, agreeReasons (array of 3-5 strings), disagreeReasons (array of 3-5 strings), intensity (1-5), intensityRationale (brief explanation).

JSON array:`

    const request = {
      custom_id: `enrich-${i}`,
      params: {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
    }

    lines.push(JSON.stringify(request))
  }

  fs.writeFileSync(BATCH_REQUEST_PATH, lines.join('\n') + '\n')
  console.log(`Wrote ${lines.length} requests to ${path.relative(process.cwd(), BATCH_REQUEST_PATH)}`)

  // Also save the ID ordering for merge step
  const idOrder = unenriched.map(ht => ht.id)
  const orderPath = path.resolve(__dirname, '../data/enrichment-id-order.json')
  fs.writeFileSync(orderPath, JSON.stringify(idOrder, null, 2))
  console.log(`Wrote ID ordering (${idOrder.length} IDs) to ${path.relative(process.cwd(), orderPath)}`)

  // Cost estimate
  const estimatedInputTokens = unenriched.length * 200
  const estimatedOutputTokens = unenriched.length * 120
  const inputCost = (estimatedInputTokens / 1_000_000) * 3 * 0.5
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15 * 0.5
  const totalCost = inputCost + outputCost

  console.log(`\nCost estimate (Batch API with 50% discount):`)
  console.log(`  Input: ~${estimatedInputTokens.toLocaleString()} tokens → $${inputCost.toFixed(2)}`)
  console.log(`  Output: ~${estimatedOutputTokens.toLocaleString()} tokens → $${outputCost.toFixed(2)}`)
  console.log(`  Total: ~$${totalCost.toFixed(2)}`)
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --submit-batch`)
}

async function submitBatch() {
  console.log('=== SUBMIT BATCH ===\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  if (!fs.existsSync(BATCH_REQUEST_PATH)) {
    console.error('Run --prepare-batch first to generate enrichment-batch-request.jsonl')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  const fileContent = fs.readFileSync(BATCH_REQUEST_PATH, 'utf-8')
  const requests = fileContent
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  console.log(`Submitting ${requests.length} requests to Anthropic Batch API...\n`)

  const batch = await client.messages.batches.create({
    requests,
  })

  console.log(`Batch submitted successfully!`)
  console.log(`  Batch ID: ${batch.id}`)
  console.log(`  Status: ${batch.processing_status}`)
  console.log(`  Created: ${batch.created_at}`)

  const status: BatchStatus = {
    batchId: batch.id,
    submittedAt: new Date().toISOString(),
    inputFile: BATCH_REQUEST_PATH,
  }
  fs.writeFileSync(BATCH_STATUS_PATH, JSON.stringify(status, null, 2))
  console.log(`\nBatch ID saved to ${path.relative(process.cwd(), BATCH_STATUS_PATH)}`)
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --check-batch`)
}

async function checkBatch() {
  console.log('=== CHECK BATCH ===\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  if (!fs.existsSync(BATCH_STATUS_PATH)) {
    console.error('No batch status found. Run --submit-batch first.')
    process.exit(1)
  }

  const status: BatchStatus = JSON.parse(fs.readFileSync(BATCH_STATUS_PATH, 'utf-8'))
  const client = new Anthropic({ apiKey })

  console.log(`Checking batch: ${status.batchId}\n`)

  const batch = await client.messages.batches.retrieve(status.batchId)

  console.log(`Status: ${batch.processing_status}`)
  console.log(`Request counts:`)
  console.log(`  Processing: ${batch.request_counts.processing}`)
  console.log(`  Succeeded: ${batch.request_counts.succeeded}`)
  console.log(`  Errored: ${batch.request_counts.errored}`)
  console.log(`  Canceled: ${batch.request_counts.canceled}`)
  console.log(`  Expired: ${batch.request_counts.expired}`)

  if (batch.processing_status === 'ended') {
    console.log(`\nBatch complete! Downloading results...\n`)

    const results: string[] = []
    const resultsIterable = await client.messages.batches.results(status.batchId)
    for await (const result of resultsIterable) {
      results.push(JSON.stringify(result))
    }

    fs.writeFileSync(BATCH_RESULTS_PATH, results.join('\n') + '\n')
    console.log(`Wrote ${results.length} results to ${path.relative(process.cwd(), BATCH_RESULTS_PATH)}`)
    console.log(`\nNext step: npx tsx scripts/enrich-hot-takes-with-claude.ts --merge-results`)
  } else {
    console.log(`\nBatch still processing. Check again later.`)
  }
}

async function mergeResults() {
  console.log('=== MERGE RESULTS ===\n')

  if (!fs.existsSync(BATCH_RESULTS_PATH)) {
    console.error('No batch results found. Run --check-batch first (after batch completes).')
    process.exit(1)
  }

  const idOrderPath = path.resolve(__dirname, '../data/enrichment-id-order.json')
  if (!fs.existsSync(idOrderPath)) {
    console.error('Missing enrichment-id-order.json. Run --prepare-batch first.')
    process.exit(1)
  }

  // Load source data
  const hotTakes = loadHotTakes()
  const idOrder: string[] = JSON.parse(fs.readFileSync(idOrderPath, 'utf-8'))

  // Build lookup: id → hot take index in the full array
  const idToIndex = new Map<string, number>()
  for (let i = 0; i < hotTakes.length; i++) {
    idToIndex.set(hotTakes[i].id, i)
  }

  // Parse batch results
  const resultLines = fs
    .readFileSync(BATCH_RESULTS_PATH, 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  // Sort by custom_id to ensure order
  resultLines.sort((a: any, b: any) => {
    const aIdx = parseInt(a.custom_id.replace('enrich-', ''))
    const bIdx = parseInt(b.custom_id.replace('enrich-', ''))
    return aIdx - bIdx
  })

  let enrichedCount = 0
  let failedCount = 0
  let validationFailedCount = 0
  const intensityCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (const result of resultLines) {
    const batchIdx = parseInt(result.custom_id.replace('enrich-', ''))
    const batchIds = idOrder.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE)

    if (result.result?.type !== 'succeeded') {
      console.warn(`Batch ${batchIdx} failed: ${result.result?.type}`)
      failedCount += batchIds.length
      continue
    }

    // Extract JSON array from response
    const content = result.result.message.content[0]
    if (content.type !== 'text') {
      console.warn(`Batch ${batchIdx}: unexpected content type`)
      failedCount += batchIds.length
      continue
    }

    let parsed: any[]
    try {
      let text = content.text
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      text = text.replace(/,\s*([}\]])/g, '$1')
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found')
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.warn(`Batch ${batchIdx}: failed to parse JSON`)
      failedCount += batchIds.length
      continue
    }

    for (let i = 0; i < batchIds.length; i++) {
      const takeId = batchIds[i]
      const enriched = parsed[i]
      const htIndex = idToIndex.get(takeId)

      if (htIndex === undefined) {
        console.warn(`ID ${takeId} not found in hot-takes.json`)
        failedCount++
        continue
      }

      if (!enriched || typeof enriched !== 'object') {
        failedCount++
        continue
      }

      // Build enrichment result for validation
      const enrichmentResult: EnrichmentResult = {
        id: takeId,
        statement: enriched.statement || hotTakes[htIndex].statement,
        agreeReasons: enriched.agreeReasons || [],
        disagreeReasons: enriched.disagreeReasons || [],
        intensity: enriched.intensity || 3,
        intensityRationale: enriched.intensityRationale || '',
        validationPassed: false,
      }

      const validation = validateEnrichment(enrichmentResult)
      enrichmentResult.validationPassed = validation.valid

      if (!validation.valid) {
        validationFailedCount++
        if (validationFailedCount <= 10) {
          console.warn(`  Validation failed for ${takeId}: ${validation.errors.join(', ')}`)
        }
      }

      const now = new Date().toISOString()

      // Update hot take in place
      hotTakes[htIndex] = {
        ...hotTakes[htIndex],
        statement: enrichmentResult.statement,
        agreeReasons: enrichmentResult.agreeReasons,
        disagreeReasons: enrichmentResult.disagreeReasons,
        intensity: enrichmentResult.intensity,
        intensityMetadata: {
          aiGenerated: enrichmentResult.intensity,
          lastUpdated: now,
        },
        enrichmentMetadata: {
          model: 'claude-sonnet-4-5-20250929',
          validationPassed: enrichmentResult.validationPassed,
          timestamp: now,
        },
      }

      intensityCount[enrichmentResult.intensity]++
      enrichedCount++
    }
  }

  console.log(`\n=== Results ===\n`)
  console.log(`  Total unenriched: ${idOrder.length}`)
  console.log(`  Successfully enriched: ${enrichedCount}`)
  console.log(`  Failed (API errors): ${failedCount}`)
  console.log(`  Validation warnings: ${validationFailedCount}`)

  console.log(`\nBy intensity:`)
  for (let i = 1; i <= 5; i++) {
    const label = ['', 'Chill', 'Casual', 'Engaged', 'Heated', 'Existential'][i]
    console.log(`  ${i} (${label}): ${intensityCount[i]}`)
  }

  // Write updated hot takes
  fs.writeFileSync(HOT_TAKES_PATH, JSON.stringify(hotTakes, null, 2))

  const totalEnriched = hotTakes.filter(ht => ht.enrichmentMetadata).length
  console.log(`\nUpdated hot-takes.json: ${totalEnriched}/${hotTakes.length} now enriched`)

  // Show intensity distribution of all enriched
  console.log(`\nFull intensity distribution:`)
  const fullDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const ht of hotTakes) {
    if (ht.enrichmentMetadata) {
      fullDist[ht.intensity || 3]++
    }
  }
  for (let i = 1; i <= 5; i++) {
    const label = ['', 'Chill', 'Casual', 'Engaged', 'Heated', 'Existential'][i]
    console.log(`  ${i} (${label}): ${fullDist[i]}`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--dry-run')) {
    await dryRun()
  } else if (args.includes('--prepare-batch')) {
    await prepareBatch()
  } else if (args.includes('--submit-batch')) {
    await submitBatch()
  } else if (args.includes('--check-batch')) {
    await checkBatch()
  } else if (args.includes('--merge-results')) {
    await mergeResults()
  } else {
    console.log(`Usage:
  npx tsx scripts/enrich-hot-takes-with-claude.ts --dry-run         # Stats on unenriched takes
  npx tsx scripts/enrich-hot-takes-with-claude.ts --prepare-batch   # Generate batch JSONL
  ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --submit-batch   # Submit batch
  ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --check-batch    # Check status
  npx tsx scripts/enrich-hot-takes-with-claude.ts --merge-results   # Merge into hot-takes.json`)
  }
}

main().catch(console.error)
