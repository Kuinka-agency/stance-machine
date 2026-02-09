/**
 * generate-hot-takes.ts
 *
 * Generate ORIGINAL hot takes to fill category×intensity gaps.
 * Uses Anthropic Batch API (50% cheaper) to generate takes targeting
 * specific cells in the category×intensity matrix that are below 50.
 *
 * CLI modes:
 *   --dry-run         Show gap matrix and what needs to be generated
 *   --prepare-batch   Generate generation-batch-request.jsonl
 *   --submit-batch    Submit to Anthropic Batch API
 *   --check-batch     Poll status, download results when done
 *   --merge-results   Parse results, validate, append to hot-takes.json
 *
 * Usage:
 *   npx tsx scripts/generate-hot-takes.ts --dry-run
 *   npx tsx scripts/generate-hot-takes.ts --prepare-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --submit-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --check-batch
 *   npx tsx scripts/generate-hot-takes.ts --merge-results
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
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

interface GapCell {
  category: string
  intensity: number
  current: number
  needed: number
}

interface BatchStatus {
  batchId: string
  submittedAt: string
  inputFile: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const HOT_TAKES_PATH = path.resolve(__dirname, '../data/hot-takes.json')
const BATCH_REQUEST_PATH = path.resolve(__dirname, '../data/generation-batch-request.jsonl')
const BATCH_STATUS_PATH = path.resolve(__dirname, '../data/generation-batch-status.json')
const BATCH_RESULTS_PATH = path.resolve(__dirname, '../data/generation-batch-results.jsonl')
const GAP_ORDER_PATH = path.resolve(__dirname, '../data/generation-gap-order.json')

const MIN_PER_CELL = 50
const TAKES_PER_REQUEST = 25 // Keep batches small for quality
const VALID_CATEGORIES = ['philosophy', 'relationships', 'work', 'money', 'lifestyle', 'society']
const INTENSITY_LABELS: Record<number, string> = {
  1: 'Chill',
  2: 'Casual',
  3: 'Engaged',
  4: 'Heated',
  5: 'Existential',
}

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(category: string, intensity: number): string {
  return `You are generating ORIGINAL hot takes for a debate app called Stance Machine. Users see a statement and pick agree or disagree. These must feel like real opinions someone would post on social media — NOT reformulated survey questions or hypotheticals.

**Category:** ${category}
**Target intensity:** ${intensity} (${INTENSITY_LABELS[intensity]})

**Intensity scale:**
1 - Chill: Lighthearted preference, no real stakes. Playful, no identity investment.
2 - Casual: Personal preference with practical reasoning. Lifestyle choices.
3 - Engaged: Values-based opinion, some identity investment. Polarizing but not extreme.
4 - Heated: Touches identity, morality, worldview. Strong convictions, emotional investment.
5 - Existential: Fundamental belief about reality/meaning/ethics. Worldview-defining.

**Quality examples by intensity:**
i1 (Chill): "Breakfast for dinner is superior to dinner for dinner"
i2 (Casual): "Working from home has made us worse at our jobs"
i3 (Engaged): "You should never lend money to family"
i4 (Heated): "Having kids is selfish in today's world"
i5 (Existential): "Consciousness is just an elaborate illusion"

**Category voice for ${category}:**
${getCategoryVoice(category)}

**Anti-patterns to AVOID:**
- "X beats Y" comparisons (feels like a survey)
- Absurd hypotheticals nobody actually thinks about
- Statements that are just facts disguised as opinions
- Anything that reads like a "would you rather" answer
- Generic statements that could apply to any category
- Repetitive structures — vary sentence patterns

**Requirements for each hot take:**
- Statement must be < 280 chars, tweet-worthy
- Must be a genuine opinion someone holds
- Provocative enough to spark agree/disagree debate
- Relatable — about things most people have experience with
- Must match the target intensity level (${intensity} - ${INTENSITY_LABELS[intensity]})

For each hot take, output a JSON object:
{
  "statement": "< 280 chars, tweet-worthy",
  "category": "${category}",
  "tone": ["tag1", "tag2"],
  "agreeReasons": ["5-10 word reason", "..."],
  "disagreeReasons": ["5-10 word reason", "..."],
  "intensity": ${intensity},
  "intensityRationale": "Why this intensity level"
}

tone tags must be from: deep, provocative, challenging, funny, warm, practical, bold, random, spicy, flirty
agreeReasons: 3-5 reasons, each 5-10 words, specific to THIS statement
disagreeReasons: 3-5 reasons, each 5-10 words, specific to THIS statement`
}

function getCategoryVoice(category: string): string {
  const voices: Record<string, string> = {
    philosophy: 'Thoughtful, provocative. Questions about meaning, consciousness, ethics, free will, truth, knowledge.',
    relationships: 'Warm, relatable. Love, friendship, family dynamics, dating, loyalty, communication.',
    work: 'Practical, aspirational. Career, hustle culture, workplace dynamics, ambition, work-life balance, leadership.',
    money: 'Bold, direct. Wealth, spending habits, financial decisions, capitalism, generosity, materialism.',
    lifestyle: 'Fun, casual. Daily habits, food, health, hobbies, travel, social media, fashion, wellness.',
    society: 'Challenging, current. Culture, politics, technology, social norms, education, media, progress.',
  }
  return voices[category] || ''
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadHotTakes(): HotTake[] {
  if (!fs.existsSync(HOT_TAKES_PATH)) {
    console.error(`Input file not found: ${HOT_TAKES_PATH}`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(HOT_TAKES_PATH, 'utf-8'))
}

function computeGapMatrix(hotTakes: HotTake[]): { matrix: Record<string, Record<number, number>>; gaps: GapCell[] } {
  const matrix: Record<string, Record<number, number>> = {}

  for (const cat of VALID_CATEGORIES) {
    matrix[cat] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }

  for (const ht of hotTakes) {
    if (VALID_CATEGORIES.includes(ht.category)) {
      const intensity = ht.intensity || 3
      matrix[ht.category][intensity]++
    }
  }

  const gaps: GapCell[] = []
  for (const cat of VALID_CATEGORIES) {
    for (let i = 1; i <= 5; i++) {
      const current = matrix[cat][i]
      if (current < MIN_PER_CELL) {
        gaps.push({
          category: cat,
          intensity: i,
          current,
          needed: MIN_PER_CELL - current,
        })
      }
    }
  }

  return { matrix, gaps }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60)
}

function printMatrix(matrix: Record<string, Record<number, number>>) {
  const header = '                  i1    i2    i3    i4    i5   TOTAL'
  console.log(header)
  for (const cat of VALID_CATEGORIES) {
    const counts = matrix[cat]
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const row = Object.values(counts).map(c => String(c).padStart(5)).join(' ')
    console.log(`${cat.padEnd(16)}  ${row} ${String(total).padStart(7)}`)
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateTake(take: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!take.statement || typeof take.statement !== 'string') {
    errors.push('missing statement')
  } else if (take.statement.length > 280) {
    errors.push(`statement too long (${take.statement.length} chars)`)
  } else if (take.statement.match(/^(would you|is |do you|can you|should you)/i)) {
    errors.push('still in question format')
  }

  if (!VALID_CATEGORIES.includes(take.category)) {
    errors.push(`invalid category: ${take.category}`)
  }

  if (!take.intensity || typeof take.intensity !== 'number' || take.intensity < 1 || take.intensity > 5) {
    errors.push(`invalid intensity: ${take.intensity}`)
  }

  if (!Array.isArray(take.agreeReasons) || take.agreeReasons.length < 3) {
    errors.push('need at least 3 agree reasons')
  }

  if (!Array.isArray(take.disagreeReasons) || take.disagreeReasons.length < 3) {
    errors.push('need at least 3 disagree reasons')
  }

  // Reason length check
  const allReasons = [...(take.agreeReasons || []), ...(take.disagreeReasons || [])]
  for (const reason of allReasons) {
    if (typeof reason === 'string' && reason.length > 60) {
      errors.push(`reason too long: "${reason.slice(0, 30)}..."`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ─── CLI Commands ────────────────────────────────────────────────────────────

async function dryRun() {
  console.log('=== DRY RUN: Gap Analysis ===\n')

  const hotTakes = loadHotTakes()
  const { matrix, gaps } = computeGapMatrix(hotTakes)

  console.log(`Total hot takes: ${hotTakes.length}`)
  console.log(`Target: ${MIN_PER_CELL} per cell\n`)

  console.log('Current distribution:')
  printMatrix(matrix)

  if (gaps.length === 0) {
    console.log('\nAll cells have >= 50 takes. Nothing to generate!')
    return
  }

  console.log(`\nGaps to fill (${gaps.length} cells below ${MIN_PER_CELL}):`)
  console.log('─'.repeat(50))

  let totalNeeded = 0
  for (const gap of gaps) {
    console.log(`  ${gap.category} i${gap.intensity} (${INTENSITY_LABELS[gap.intensity]}): ${gap.current} → need +${gap.needed}`)
    totalNeeded += gap.needed
  }

  console.log(`\nTotal takes to generate: ${totalNeeded}`)

  // Batch estimate
  const batchRequests = gaps.reduce((acc, gap) => acc + Math.ceil(gap.needed / TAKES_PER_REQUEST), 0)
  console.log(`Batch requests needed: ${batchRequests} (${TAKES_PER_REQUEST} takes per request)`)

  // Cost estimate (generous: system prompt is larger for generation)
  const estimatedInputTokens = batchRequests * 800
  const estimatedOutputTokens = totalNeeded * 150
  const inputCost = (estimatedInputTokens / 1_000_000) * 3 * 0.5
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15 * 0.5
  const totalCost = inputCost + outputCost

  console.log(`\nCost estimate (Batch API with 50% discount):`)
  console.log(`  Input: ~${estimatedInputTokens.toLocaleString()} tokens → $${inputCost.toFixed(2)}`)
  console.log(`  Output: ~${estimatedOutputTokens.toLocaleString()} tokens → $${outputCost.toFixed(2)}`)
  console.log(`  Total: ~$${totalCost.toFixed(2)}`)
  console.log(`\nNext step: npx tsx scripts/generate-hot-takes.ts --prepare-batch`)
}

async function prepareBatch() {
  console.log('=== PREPARE BATCH ===\n')

  const hotTakes = loadHotTakes()
  const { gaps } = computeGapMatrix(hotTakes)

  if (gaps.length === 0) {
    console.log('All cells have >= 50 takes. Nothing to generate!')
    return
  }

  const lines: string[] = []
  const gapOrder: { category: string; intensity: number; count: number; requestIndices: number[] }[] = []
  let requestIdx = 0

  for (const gap of gaps) {
    const requestIndices: number[] = []
    let remaining = gap.needed

    while (remaining > 0) {
      const count = Math.min(remaining, TAKES_PER_REQUEST)

      const userPrompt = `Generate ${count} unique, original hot takes for the "${gap.category}" category at intensity level ${gap.intensity} (${INTENSITY_LABELS[gap.intensity]}).

Each take must be genuinely different — vary the specific topic, sentence structure, and angle. Don't cluster around one sub-topic.

Return a JSON array with exactly ${count} objects.

JSON array:`

      const request = {
        custom_id: `gen-${requestIdx}`,
        params: {
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8192,
          system: buildSystemPrompt(gap.category, gap.intensity),
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
      }

      lines.push(JSON.stringify(request))
      requestIndices.push(requestIdx)
      requestIdx++
      remaining -= count
    }

    gapOrder.push({
      category: gap.category,
      intensity: gap.intensity,
      count: gap.needed,
      requestIndices,
    })
  }

  fs.writeFileSync(BATCH_REQUEST_PATH, lines.join('\n') + '\n')
  console.log(`Wrote ${lines.length} requests to ${path.relative(process.cwd(), BATCH_REQUEST_PATH)}`)

  // Save gap ordering for merge step
  fs.writeFileSync(GAP_ORDER_PATH, JSON.stringify(gapOrder, null, 2))
  console.log(`Wrote gap ordering to ${path.relative(process.cwd(), GAP_ORDER_PATH)}`)

  // Summary
  let totalTakes = 0
  for (const gap of gaps) {
    totalTakes += gap.needed
  }
  console.log(`\nWill generate ~${totalTakes} takes across ${gaps.length} cells in ${lines.length} requests`)

  // Cost estimate
  const estimatedInputTokens = lines.length * 800
  const estimatedOutputTokens = totalTakes * 150
  const inputCost = (estimatedInputTokens / 1_000_000) * 3 * 0.5
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15 * 0.5
  const totalCost = inputCost + outputCost

  console.log(`\nCost estimate (Batch API with 50% discount):`)
  console.log(`  Input: ~${estimatedInputTokens.toLocaleString()} tokens → $${inputCost.toFixed(2)}`)
  console.log(`  Output: ~${estimatedOutputTokens.toLocaleString()} tokens → $${outputCost.toFixed(2)}`)
  console.log(`  Total: ~$${totalCost.toFixed(2)}`)
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --submit-batch`)
}

async function submitBatch() {
  console.log('=== SUBMIT BATCH ===\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  if (!fs.existsSync(BATCH_REQUEST_PATH)) {
    console.error('Run --prepare-batch first to generate generation-batch-request.jsonl')
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
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --check-batch`)
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
    console.log(`\nNext step: npx tsx scripts/generate-hot-takes.ts --merge-results`)
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

  if (!fs.existsSync(GAP_ORDER_PATH)) {
    console.error('Missing generation-gap-order.json. Run --prepare-batch first.')
    process.exit(1)
  }

  // Load source data
  const existingHotTakes = loadHotTakes()
  const gapOrder: { category: string; intensity: number; count: number; requestIndices: number[] }[] =
    JSON.parse(fs.readFileSync(GAP_ORDER_PATH, 'utf-8'))

  // Build request index → gap mapping
  const requestToGap = new Map<number, { category: string; intensity: number }>()
  for (const gap of gapOrder) {
    for (const idx of gap.requestIndices) {
      requestToGap.set(idx, { category: gap.category, intensity: gap.intensity })
    }
  }

  // Parse batch results
  const resultLines = fs
    .readFileSync(BATCH_RESULTS_PATH, 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  // Sort by custom_id
  resultLines.sort((a: any, b: any) => {
    const aIdx = parseInt(a.custom_id.replace('gen-', ''))
    const bIdx = parseInt(b.custom_id.replace('gen-', ''))
    return aIdx - bIdx
  })

  // Dedup: collect existing statements (normalized) to avoid duplicates
  const existingStatements = new Set<string>()
  for (const ht of existingHotTakes) {
    existingStatements.add(ht.statement.toLowerCase().trim())
  }

  const newHotTakes: HotTake[] = []
  let failed = 0
  let validationFailed = 0
  let duplicates = 0
  const categoryIntensityCount: Record<string, number> = {}

  for (const result of resultLines) {
    const requestIdx = parseInt(result.custom_id.replace('gen-', ''))
    const gapInfo = requestToGap.get(requestIdx)

    if (!gapInfo) {
      console.warn(`Unknown request index: ${requestIdx}`)
      failed++
      continue
    }

    if (result.result?.type !== 'succeeded') {
      console.warn(`Request gen-${requestIdx} failed: ${result.result?.type}`)
      failed++
      continue
    }

    // Extract JSON array from response
    const content = result.result.message.content[0]
    if (content.type !== 'text') {
      console.warn(`Request gen-${requestIdx}: unexpected content type`)
      failed++
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
      console.warn(`Request gen-${requestIdx}: failed to parse JSON`)
      failed++
      continue
    }

    for (const take of parsed) {
      if (!take || typeof take !== 'object') {
        validationFailed++
        continue
      }

      // Force correct category and intensity from the gap spec
      take.category = gapInfo.category
      take.intensity = gapInfo.intensity

      const validation = validateTake(take)
      if (!validation.valid) {
        validationFailed++
        if (validationFailed <= 10) {
          console.warn(`  Validation failed: "${(take.statement || '').slice(0, 50)}..." → ${validation.errors.join(', ')}`)
        }
        continue
      }

      // Check for duplicate statements
      const normalized = take.statement.toLowerCase().trim()
      if (existingStatements.has(normalized)) {
        duplicates++
        continue
      }
      existingStatements.add(normalized)

      const id = crypto.randomUUID().slice(0, 12)
      const now = new Date().toISOString()

      const hotTake: HotTake = {
        id,
        statement: take.statement,
        category: take.category,
        slug: slugify(take.statement),
        tone: Array.isArray(take.tone) ? take.tone : ['bold'],
        originalQuestion: `[generated] ${take.category} i${take.intensity}`,
        agreeReasons: take.agreeReasons,
        disagreeReasons: take.disagreeReasons,
        intensity: take.intensity,
        intensityMetadata: {
          aiGenerated: take.intensity,
          lastUpdated: now,
        },
        enrichmentMetadata: {
          model: 'claude-sonnet-4-5-20250929',
          validationPassed: true,
          timestamp: now,
        },
      }

      newHotTakes.push(hotTake)
      const key = `${take.category}-i${take.intensity}`
      categoryIntensityCount[key] = (categoryIntensityCount[key] || 0) + 1
    }
  }

  console.log(`\n=== Results ===\n`)
  console.log(`  New hot takes generated: ${newHotTakes.length}`)
  console.log(`  Failed (API errors): ${failed}`)
  console.log(`  Validation failed: ${validationFailed}`)
  console.log(`  Duplicates removed: ${duplicates}`)

  console.log(`\nNew takes by cell:`)
  for (const [key, count] of Object.entries(categoryIntensityCount).sort()) {
    console.log(`  ${key}: +${count}`)
  }

  // Append to existing hot takes
  const merged = [...existingHotTakes, ...newHotTakes]
  fs.writeFileSync(HOT_TAKES_PATH, JSON.stringify(merged, null, 2))
  console.log(`\nAppended ${newHotTakes.length} hot takes → ${merged.length} total in hot-takes.json`)

  // Show before/after gap matrix
  console.log(`\nBefore:`)
  const { matrix: beforeMatrix } = computeGapMatrix(existingHotTakes)
  printMatrix(beforeMatrix)

  console.log(`\nAfter:`)
  const { matrix: afterMatrix, gaps: remainingGaps } = computeGapMatrix(merged)
  printMatrix(afterMatrix)

  if (remainingGaps.length === 0) {
    console.log(`\nAll cells now have >= ${MIN_PER_CELL} takes!`)
  } else {
    console.log(`\nRemaining gaps (${remainingGaps.length} cells still below ${MIN_PER_CELL}):`)
    for (const gap of remainingGaps) {
      console.log(`  ${gap.category} i${gap.intensity}: ${gap.current} (need +${gap.needed})`)
    }
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
  npx tsx scripts/generate-hot-takes.ts --dry-run         # Show gap matrix
  npx tsx scripts/generate-hot-takes.ts --prepare-batch   # Generate batch JSONL
  ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --submit-batch   # Submit batch
  ANTHROPIC_API_KEY=xxx npx tsx scripts/generate-hot-takes.ts --check-batch    # Check status
  npx tsx scripts/generate-hot-takes.ts --merge-results   # Merge into hot-takes.json`)
  }
}

main().catch(console.error)
