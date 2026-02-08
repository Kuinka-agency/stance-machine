/**
 * enrich-hot-takes-with-claude.ts
 *
 * Transform all hot takes into natural, tweet-worthy statements using Claude API,
 * and generate context-specific reason tags for both agree and disagree stances.
 *
 * Input: data/hot-takes.json (template-transformed statements)
 * Output: data/hot-takes.json (enriched with natural statements + reason tags)
 *
 * Quality gates:
 * - Grammar validation (no mechanical artifacts)
 * - Naturalness check (no "is better than" constructions)
 * - Length limit (< 280 chars for shareability)
 * - Category-appropriate tone
 * - 3-5 relevant reason tags per side
 *
 * Run:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts
 *   npx tsx scripts/enrich-hot-takes-with-claude.ts --dry-run  # Test without API calls
 *   npx tsx scripts/enrich-hot-takes-with-claude.ts --limit=10  # Process first 10
 */

import * as fs from 'fs'
import * as path from 'path'
import Anthropic from '@anthropic-ai/sdk'

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

async function enrichBatch(
  client: Anthropic,
  hotTakes: HotTake[],
  batchSize: number = 20
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = []

  for (let i = 0; i < hotTakes.length; i += batchSize) {
    const batch = hotTakes.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotTakes.length / batchSize)}...`)

    const batchPrompt = batch.map((ht, idx) => {
      return `[${idx}] Original: "${ht.originalQuestion}"
Current statement: "${ht.statement}"
Category: ${ht.category}
Tone: ${ht.tone.join(', ')}`
    }).join('\n\n')

    const userPrompt = `Transform these ${batch.length} hot takes into natural statements with reason tags and intensity scores.

${batchPrompt}

Return a JSON array with ${batch.length} objects, one for each hot take above (in order).
Each object must have: statement, agreeReasons (array of 3-5 strings), disagreeReasons (array of 3-5 strings), intensity (1-5), intensityRationale (brief explanation).

JSON array:`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      // Extract JSON array from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const enriched = JSON.parse(jsonMatch[0])

      if (enriched.length !== batch.length) {
        console.warn(`Expected ${batch.length} results, got ${enriched.length}`)
      }

      for (let j = 0; j < batch.length; j++) {
        const result: EnrichmentResult = {
          id: batch[j].id,
          statement: enriched[j]?.statement || batch[j].statement,
          agreeReasons: enriched[j]?.agreeReasons || [],
          disagreeReasons: enriched[j]?.disagreeReasons || [],
          intensity: enriched[j]?.intensity || 3,
          intensityRationale: enriched[j]?.intensityRationale || '',
          validationPassed: false,
        }

        const validation = validateEnrichment(result)
        result.validationPassed = validation.valid
        if (!validation.valid) {
          result.validationErrors = validation.errors
          console.warn(`Validation failed for ${result.id}:`, validation.errors)
        }

        results.push(result)
      }

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < hotTakes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`Batch failed:`, error)
      // Add failed results with original data
      for (const ht of batch) {
        results.push({
          id: ht.id,
          statement: ht.statement,
          agreeReasons: [],
          disagreeReasons: [],
          intensity: 3,
          intensityRationale: '',
          validationPassed: false,
          validationErrors: ['API call failed']
        })
      }
    }
  }

  return results
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey && !dryRun) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  const hotTakesPath = path.resolve(__dirname, '../data/hot-takes.json')
  if (!fs.existsSync(hotTakesPath)) {
    console.error(`Input file not found: ${hotTakesPath}`)
    process.exit(1)
  }

  const hotTakes: HotTake[] = JSON.parse(fs.readFileSync(hotTakesPath, 'utf-8'))
  console.log(`Loaded ${hotTakes.length} hot takes`)

  const toProcess = limit ? hotTakes.slice(0, limit) : hotTakes
  console.log(`Processing ${toProcess.length} hot takes...`)

  if (dryRun) {
    console.log('\nDRY RUN - No API calls will be made')
    console.log('Sample hot takes:')
    for (const ht of toProcess.slice(0, 3)) {
      console.log(`\nID: ${ht.id}`)
      console.log(`Original: ${ht.originalQuestion}`)
      console.log(`Current: ${ht.statement}`)
      console.log(`Category: ${ht.category}`)
    }
    return
  }

  const client = new Anthropic({ apiKey })

  console.log('\nEnriching hot takes with Claude API...')
  const startTime = Date.now()

  const results = await enrichBatch(client, toProcess, 20)

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\nEnrichment complete in ${duration}s`)

  // Merge results back into hot takes
  const enrichedHotTakes = hotTakes.map(ht => {
    const result = results.find(r => r.id === ht.id)
    if (!result) return ht

    return {
      ...ht,
      statement: result.statement,
      agreeReasons: result.agreeReasons,
      disagreeReasons: result.disagreeReasons,
      intensity: result.intensity,
      intensityMetadata: {
        aiGenerated: result.intensity,
        lastUpdated: new Date().toISOString(),
      },
      enrichmentMetadata: {
        model: 'claude-sonnet-4-5-20250929',
        validationPassed: result.validationPassed,
        timestamp: new Date().toISOString(),
      }
    }
  })

  // Stats
  const validated = results.filter(r => r.validationPassed).length
  const failed = results.filter(r => !r.validationPassed).length

  console.log(`\nResults:`)
  console.log(`  ✓ Validated: ${validated}`)
  console.log(`  ✗ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFailed validations:')
    results
      .filter(r => !r.validationPassed)
      .slice(0, 10)
      .forEach(r => {
        console.log(`  ${r.id}: ${r.validationErrors?.join(', ')}`)
      })
  }

  // Write output
  fs.writeFileSync(hotTakesPath, JSON.stringify(enrichedHotTakes, null, 2))
  console.log(`\nWrote ${enrichedHotTakes.length} enriched hot takes to ${hotTakesPath}`)

  // Cost estimate
  const inputTokens = toProcess.length * 150  // ~150 tokens per hot take
  const outputTokens = toProcess.length * 100  // ~100 tokens per enriched result
  const inputCost = (inputTokens / 1_000_000) * 3
  const outputCost = (outputTokens / 1_000_000) * 15
  const totalCost = inputCost + outputCost

  console.log(`\nEstimated cost: $${totalCost.toFixed(2)}`)
}

main().catch(console.error)
