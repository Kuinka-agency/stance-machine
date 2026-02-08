/**
 * convert-qm-questions.ts
 *
 * Convert QuestionMonopoly deep questions into high-intensity hot takes
 * for Stance Machine. Two-phase process using Anthropic Batch API (50% cheaper).
 *
 * Phase A (now):
 *   --dry-run         Extract, dedup, show stats
 *   --prepare-batch   Generate batch-request.jsonl for Anthropic Batch API
 *
 * Phase B (later):
 *   --submit-batch    Submit batch to Anthropic API
 *   --check-batch     Check batch status
 *   --merge-results   Parse results and append to hot-takes.json
 *
 * Usage:
 *   npx tsx scripts/convert-qm-questions.ts --dry-run
 *   npx tsx scripts/convert-qm-questions.ts --prepare-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --submit-batch
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --check-batch
 *   npx tsx scripts/convert-qm-questions.ts --merge-results
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QMFile {
  url: string
  slug: string
  title: string
  question_count: number
  sections: { section_title: string; questions: string[] }[]
}

interface ExtractedQuestion {
  question: string
  sourceFile: string
  sourceSlug: string
}

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

interface BatchStatus {
  batchId: string
  submittedAt: string
  inputFile: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const QM_DATA_DIR = path.resolve(
  __dirname,
  '../../QuestionMonopoly/data/competitors/questionsabouteverything/extracted'
)

const SOURCE_FILES = [
  'ethical-questions.json',
  'philosophical-questions.json',
  'deep-conversation-starters.json',
  'deep-questions-to-ask.json',
  'deep-questions-for-couples.json',
  'deep-questions-to-ask-a-girl.json',
  'controversial-relationship-questions.json',
  'hypothetical-questions.json',
  'hardest-would-you-rather-questions.json',
]

const HOT_TAKES_PATH = path.resolve(__dirname, '../data/hot-takes.json')
const QUESTIONS_PATH = path.resolve(__dirname, '../data/qm-questions-to-convert.json')
const BATCH_REQUEST_PATH = path.resolve(__dirname, '../data/batch-request.jsonl')
const BATCH_STATUS_PATH = path.resolve(__dirname, '../data/batch-status.json')
const BATCH_RESULTS_PATH = path.resolve(__dirname, '../data/batch-results.jsonl')

const VALID_CATEGORIES = ['philosophy', 'relationships', 'work', 'money', 'lifestyle', 'society']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGarbage(question: string): boolean {
  const garbage = [
    'looking for more questions',
    'table of contents',
    'related posts',
    'share this',
    'leave a comment',
    'subscribe',
  ]
  const lower = question.toLowerCase().trim()

  // Too short
  if (lower.length < 15) return true

  // Template strings with blanks
  if (question.includes('___') || question.includes('...')) return true

  // Navigation/meta text
  if (garbage.some((g) => lower.includes(g))) return true

  // Just a number or list marker
  if (/^\d+\.?\s*$/.test(lower)) return true

  return false
}

// ─── Extract ─────────────────────────────────────────────────────────────────

function extractQuestions(): { questions: ExtractedQuestion[]; stats: Record<string, number> } {
  const questions: ExtractedQuestion[] = []
  const stats: Record<string, number> = {}

  for (const filename of SOURCE_FILES) {
    const filepath = path.join(QM_DATA_DIR, filename)
    if (!fs.existsSync(filepath)) {
      console.warn(`  Skipping missing file: ${filename}`)
      stats[filename] = 0
      continue
    }

    const data: QMFile = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
    let count = 0

    for (const section of data.sections) {
      for (const q of section.questions) {
        if (isGarbage(q)) continue
        questions.push({
          question: q.trim(),
          sourceFile: filename,
          sourceSlug: data.slug,
        })
        count++
      }
    }

    stats[filename] = count
  }

  return { questions, stats }
}

// ─── Dedup ───────────────────────────────────────────────────────────────────

function dedup(
  questions: ExtractedQuestion[],
  existingHotTakes: HotTake[]
): { unique: ExtractedQuestion[]; dupsInternal: number; dupsExisting: number } {
  // Build set of existing originalQuestion values (normalized)
  const existingSet = new Set<string>()
  for (const ht of existingHotTakes) {
    if (ht.originalQuestion) {
      existingSet.add(normalize(ht.originalQuestion))
    }
  }

  // Dedup internally and against existing
  const seen = new Set<string>()
  const unique: ExtractedQuestion[] = []
  let dupsInternal = 0
  let dupsExisting = 0

  for (const q of questions) {
    const norm = normalize(q.question)

    // Skip dupes against existing hot takes
    if (existingSet.has(norm)) {
      dupsExisting++
      continue
    }

    // Skip internal dupes
    if (seen.has(norm)) {
      dupsInternal++
      continue
    }

    seen.add(norm)
    unique.push(q)
  }

  return { unique, dupsInternal, dupsExisting }
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const CONVERSION_SYSTEM_PROMPT = `You are a hot take conversion specialist for Stance Machine, a web app where users agree/disagree with provocative statements.

Your job: Convert deep questions into opinionated, stance-worthy statements.

**Conversion rules:**

1. DECIDE if the question works as a stance. Return null for questions that:
   - Are too personal/specific ("What's your favorite...?")
   - Don't have two clear sides
   - Are factual, not opinion-based
   - Would be uncomfortable as public stances

2. CONVERT question → opinionated statement:
   - Must be < 280 chars (tweet-worthy)
   - Must be declarative, NOT a question
   - Must be provocative enough to split opinions
   - Natural, conversational tone
   - No mechanical phrases

3. ASSIGN category (one of: philosophy, relationships, work, money, lifestyle, society)

4. ASSIGN intensity (1-5):
   1 - Chill: Lighthearted, no real stakes
   2 - Casual: Personal preference, practical reasoning
   3 - Engaged: Values-based, some identity investment
   4 - Heated: Touches identity, morality, worldview
   5 - Existential: Fundamental beliefs about reality/meaning/ethics

5. GENERATE reasons:
   - 3-5 agreeReasons (5-10 words each, specific to THIS statement)
   - 3-5 disagreeReasons (5-10 words each, specific to THIS statement)

6. ASSIGN tone tags (1-3 from: deep, provocative, funny, warm, practical, bold, challenging)

**Category-appropriate voice:**
- philosophy: thoughtful, provocative
- relationships: warm, relatable
- work: practical, aspirational
- money: bold, direct
- lifestyle: fun, casual
- society: challenging, current

**Examples:**

Question: "Is there such a thing as free will?"
→ {
  "statement": "Free will is an illusion we tell ourselves",
  "category": "philosophy",
  "intensity": 5,
  "tone": ["deep", "provocative"],
  "agreeReasons": ["Brain scans show decisions form before awareness", "Genetics and environment shape everything", "Every choice has a prior cause", "Feeling of choice could be post-hoc"],
  "disagreeReasons": ["We clearly make deliberate choices daily", "Moral responsibility requires free will", "Consciousness gives us genuine agency", "Determinism can't explain creativity"]
}

Question: "Should you stay friends with your ex?"
→ {
  "statement": "Staying friends with your ex is almost always a mistake",
  "category": "relationships",
  "intensity": 3,
  "tone": ["warm", "provocative"],
  "agreeReasons": ["Old feelings always linger", "New partners feel threatened", "Healing requires distance first", "Keeps you stuck in the past"],
  "disagreeReasons": ["Mature adults can handle it", "Shared friend groups need it", "Good memories shouldn't be wasted", "Shows emotional growth"]
}

Question: "If you could only eat one food forever?"
→ null (too personal, no debatable stance)

Return JSON array. For skipped questions, include null in the array position.`

// ─── CLI Commands ────────────────────────────────────────────────────────────

async function dryRun() {
  console.log('=== DRY RUN: Extract & Dedup ===\n')

  // Check source directory
  if (!fs.existsSync(QM_DATA_DIR)) {
    console.error(`Source directory not found: ${QM_DATA_DIR}`)
    process.exit(1)
  }

  // Extract
  console.log('Extracting questions from QuestionMonopoly...\n')
  const { questions, stats } = extractQuestions()

  console.log('Source file breakdown:')
  for (const [file, count] of Object.entries(stats)) {
    console.log(`  ${file}: ${count} questions`)
  }
  console.log(`\n  Total extracted: ${questions.length}`)

  // Dedup against existing hot takes
  const existingHotTakes: HotTake[] = fs.existsSync(HOT_TAKES_PATH)
    ? JSON.parse(fs.readFileSync(HOT_TAKES_PATH, 'utf-8'))
    : []

  console.log(`\nExisting hot takes: ${existingHotTakes.length}`)

  const { unique, dupsInternal, dupsExisting } = dedup(questions, existingHotTakes)

  console.log(`\nDedup results:`)
  console.log(`  Internal duplicates removed: ${dupsInternal}`)
  console.log(`  Already in hot-takes.json: ${dupsExisting}`)
  console.log(`  Unique questions to convert: ${unique.length}`)

  // Sample per source
  console.log(`\n--- Sample questions per source ---\n`)
  for (const file of SOURCE_FILES) {
    const samples = unique.filter((q) => q.sourceFile === file).slice(0, 3)
    if (samples.length === 0) continue
    console.log(`${file}:`)
    for (const s of samples) {
      console.log(`  • ${s.question}`)
    }
    console.log()
  }

  // Write intermediate file
  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(unique, null, 2))
  console.log(`Wrote ${unique.length} questions to ${path.relative(process.cwd(), QUESTIONS_PATH)}`)
  console.log('\nNext step: npx tsx scripts/convert-qm-questions.ts --prepare-batch')
}

async function prepareBatch() {
  console.log('=== PREPARE BATCH ===\n')

  if (!fs.existsSync(QUESTIONS_PATH)) {
    console.error('Run --dry-run first to generate qm-questions-to-convert.json')
    process.exit(1)
  }

  const questions: ExtractedQuestion[] = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'))
  console.log(`Loaded ${questions.length} questions to convert\n`)

  const BATCH_SIZE = 20
  const batches: ExtractedQuestion[][] = []
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE))
  }

  console.log(`Creating ${batches.length} batch requests (${BATCH_SIZE} questions each)\n`)

  // Write JSONL file for Anthropic Batch API
  const lines: string[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    const batchPrompt = batch
      .map((q, idx) => `[${idx}] "${q.question}" (source: ${q.sourceFile})`)
      .join('\n')

    const userPrompt = `Convert these ${batch.length} questions into hot take statements.

${batchPrompt}

Return a JSON array with exactly ${batch.length} elements (one per question, in order).
Each element is either a conversion object or null (if the question should be skipped).

Conversion object format:
{
  "statement": "Provocative, tweet-worthy statement (< 280 chars)",
  "category": "philosophy|relationships|work|money|lifestyle|society",
  "intensity": 4,
  "tone": ["deep", "provocative"],
  "agreeReasons": ["Reason 1", "Reason 2", "Reason 3"],
  "disagreeReasons": ["Reason 1", "Reason 2", "Reason 3"]
}

JSON array:`

    const request = {
      custom_id: `batch-${i}`,
      params: {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: CONVERSION_SYSTEM_PROMPT,
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

  // Cost estimate
  const estimatedInputTokens = questions.length * 200 // ~200 tokens per question (with system prompt amortized)
  const estimatedOutputTokens = questions.length * 120 // ~120 tokens per result
  const inputCost = (estimatedInputTokens / 1_000_000) * 3 * 0.5 // Batch API 50% discount
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15 * 0.5
  const totalCost = inputCost + outputCost

  console.log(`\nCost estimate (Batch API with 50% discount):`)
  console.log(`  Input: ~${estimatedInputTokens.toLocaleString()} tokens → $${inputCost.toFixed(2)}`)
  console.log(`  Output: ~${estimatedOutputTokens.toLocaleString()} tokens → $${outputCost.toFixed(2)}`)
  console.log(`  Total: ~$${totalCost.toFixed(2)}`)
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --submit-batch`)
}

async function submitBatch() {
  console.log('=== SUBMIT BATCH ===\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  if (!fs.existsSync(BATCH_REQUEST_PATH)) {
    console.error('Run --prepare-batch first to generate batch-request.jsonl')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  // Read the JSONL and submit via Batch API
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

  // Save batch status
  const status: BatchStatus = {
    batchId: batch.id,
    submittedAt: new Date().toISOString(),
    inputFile: BATCH_REQUEST_PATH,
  }
  fs.writeFileSync(BATCH_STATUS_PATH, JSON.stringify(status, null, 2))
  console.log(`\nBatch ID saved to ${path.relative(process.cwd(), BATCH_STATUS_PATH)}`)
  console.log(`\nNext step: ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --check-batch`)
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

    // Stream results to file
    const results: string[] = []
    const resultsIterable = await client.messages.batches.results(status.batchId)
    for await (const result of resultsIterable) {
      results.push(JSON.stringify(result))
    }

    fs.writeFileSync(BATCH_RESULTS_PATH, results.join('\n') + '\n')
    console.log(`Wrote ${results.length} results to ${path.relative(process.cwd(), BATCH_RESULTS_PATH)}`)
    console.log(`\nNext step: npx tsx scripts/convert-qm-questions.ts --merge-results`)
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

  if (!fs.existsSync(QUESTIONS_PATH)) {
    console.error('Missing qm-questions-to-convert.json. Run --dry-run first.')
    process.exit(1)
  }

  // Load source data
  const questions: ExtractedQuestion[] = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'))
  const existingHotTakes: HotTake[] = JSON.parse(fs.readFileSync(HOT_TAKES_PATH, 'utf-8'))

  // Parse batch results
  const resultLines = fs
    .readFileSync(BATCH_RESULTS_PATH, 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  // Sort by custom_id to ensure order
  resultLines.sort((a: any, b: any) => {
    const aIdx = parseInt(a.custom_id.replace('batch-', ''))
    const bIdx = parseInt(b.custom_id.replace('batch-', ''))
    return aIdx - bIdx
  })

  const BATCH_SIZE = 20
  const newHotTakes: HotTake[] = []
  let skipped = 0
  let failed = 0
  let validationFailed = 0
  const categoryCount: Record<string, number> = {}
  const intensityCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (const result of resultLines) {
    const batchIdx = parseInt(result.custom_id.replace('batch-', ''))
    const batchQuestions = questions.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE)

    if (result.result?.type !== 'succeeded') {
      console.warn(`Batch ${batchIdx} failed: ${result.result?.type}`)
      failed += batchQuestions.length
      continue
    }

    // Extract JSON array from response
    const content = result.result.message.content[0]
    if (content.type !== 'text') {
      console.warn(`Batch ${batchIdx}: unexpected content type`)
      failed += batchQuestions.length
      continue
    }

    let parsed: any[]
    try {
      // Strip markdown code blocks if present
      let text = content.text
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      // Fix trailing commas before ] or } (common LLM output issue)
      text = text.replace(/,\s*([}\]])/g, '$1')
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found')
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.warn(`Batch ${batchIdx}: failed to parse JSON`)
      failed += batchQuestions.length
      continue
    }

    for (let i = 0; i < batchQuestions.length; i++) {
      const conversion = parsed[i]
      const question = batchQuestions[i]

      // Null = skipped by Claude
      if (conversion === null || conversion === undefined) {
        skipped++
        continue
      }

      // Validate
      const errors: string[] = []
      if (!conversion.statement || typeof conversion.statement !== 'string') {
        errors.push('missing statement')
      } else if (conversion.statement.length > 280) {
        errors.push(`statement too long (${conversion.statement.length} chars)`)
      } else if (conversion.statement.match(/^(would you|is |do you|can you|should you)/i)) {
        errors.push('still in question format')
      }

      if (!VALID_CATEGORIES.includes(conversion.category)) {
        errors.push(`invalid category: ${conversion.category}`)
      }

      if (
        !conversion.intensity ||
        typeof conversion.intensity !== 'number' ||
        conversion.intensity < 1 ||
        conversion.intensity > 5
      ) {
        errors.push(`invalid intensity: ${conversion.intensity}`)
      }

      if (!Array.isArray(conversion.agreeReasons) || conversion.agreeReasons.length < 3) {
        errors.push('need at least 3 agree reasons')
      }

      if (!Array.isArray(conversion.disagreeReasons) || conversion.disagreeReasons.length < 3) {
        errors.push('need at least 3 disagree reasons')
      }

      if (errors.length > 0) {
        validationFailed++
        if (validationFailed <= 10) {
          console.warn(`  Validation failed: "${question.question.slice(0, 50)}..." → ${errors.join(', ')}`)
        }
        continue
      }

      const id = crypto.randomUUID().slice(0, 12)
      const now = new Date().toISOString()

      const hotTake: HotTake = {
        id,
        statement: conversion.statement,
        category: conversion.category,
        slug: slugify(conversion.statement),
        tone: Array.isArray(conversion.tone) ? conversion.tone : ['deep'],
        originalQuestion: question.question,
        agreeReasons: conversion.agreeReasons,
        disagreeReasons: conversion.disagreeReasons,
        intensity: conversion.intensity,
        intensityMetadata: {
          aiGenerated: conversion.intensity,
          lastUpdated: now,
        },
        enrichmentMetadata: {
          model: 'claude-sonnet-4-5-20250929',
          validationPassed: true,
          timestamp: now,
        },
      }

      newHotTakes.push(hotTake)
      categoryCount[conversion.category] = (categoryCount[conversion.category] || 0) + 1
      intensityCount[conversion.intensity]++
    }
  }

  console.log(`\n=== Results ===\n`)
  console.log(`  Total questions: ${questions.length}`)
  console.log(`  New hot takes: ${newHotTakes.length}`)
  console.log(`  Skipped (not stance-worthy): ${skipped}`)
  console.log(`  Failed (API errors): ${failed}`)
  console.log(`  Validation failed: ${validationFailed}`)

  console.log(`\nBy category:`)
  for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  console.log(`\nBy intensity:`)
  for (let i = 1; i <= 5; i++) {
    const label = ['', 'Chill', 'Casual', 'Engaged', 'Heated', 'Existential'][i]
    console.log(`  ${i} (${label}): ${intensityCount[i]}`)
  }

  // Append to existing hot takes
  const merged = [...existingHotTakes, ...newHotTakes]
  fs.writeFileSync(HOT_TAKES_PATH, JSON.stringify(merged, null, 2))
  console.log(`\nAppended ${newHotTakes.length} hot takes → ${merged.length} total in hot-takes.json`)

  // Show before/after intensity distribution
  console.log(`\nIntensity distribution (before → after):`)
  const beforeDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const ht of existingHotTakes) {
    beforeDist[ht.intensity || 3]++
  }
  const afterDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const ht of merged) {
    afterDist[ht.intensity || 3]++
  }
  for (let i = 1; i <= 5; i++) {
    console.log(`  ${i}: ${beforeDist[i]} → ${afterDist[i]}`)
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
  Phase A (now):
    npx tsx scripts/convert-qm-questions.ts --dry-run
    npx tsx scripts/convert-qm-questions.ts --prepare-batch

  Phase B (later):
    ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --submit-batch
    ANTHROPIC_API_KEY=xxx npx tsx scripts/convert-qm-questions.ts --check-batch
    npx tsx scripts/convert-qm-questions.ts --merge-results`)
  }
}

main().catch(console.error)
