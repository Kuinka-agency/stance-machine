/**
 * test-enrichment.ts
 *
 * Quick test script to verify enrichment quality on a few samples
 * without running the full enrichment process.
 *
 * Run:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/test-enrichment.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import Anthropic from '@anthropic-ai/sdk'

interface HotTake {
  id: string
  statement: string
  category: string
  originalQuestion: string
  tone: string[]
}

const SYSTEM_PROMPT = `You are a hot take transformation specialist. Transform this question into a natural, tweet-worthy statement (< 280 chars) and generate 3-5 context-specific reasons people would AGREE and DISAGREE.

Output JSON format:
{
  "statement": "Natural, tweet-worthy statement",
  "agreeReasons": ["Reason 1", "Reason 2", "Reason 3"],
  "disagreeReasons": ["Reason 1", "Reason 2", "Reason 3"]
}`

async function testSingle(client: Anthropic, hotTake: HotTake) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${hotTake.id}`)
  console.log(`Category: ${hotTake.category}`)
  console.log(`Original: ${hotTake.originalQuestion}`)
  console.log(`Current: ${hotTake.statement}`)
  console.log('-'.repeat(80))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Transform this hot take:

Original question: "${hotTake.originalQuestion}"
Current statement: "${hotTake.statement}"
Category: ${hotTake.category}
Tone: ${hotTake.tone.join(', ')}

Return JSON with: statement, agreeReasons (array), disagreeReasons (array)`
      }
    ]
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const result = JSON.parse(jsonMatch[0])

  console.log(`\n✨ ENRICHED:`)
  console.log(`Statement: ${result.statement}`)
  console.log(`\nAgree Reasons:`)
  result.agreeReasons.forEach((r: string, i: number) => console.log(`  ${i + 1}. ${r}`))
  console.log(`\nDisagree Reasons:`)
  result.disagreeReasons.forEach((r: string, i: number) => console.log(`  ${i + 1}. ${r}`))

  // Validation
  const errors: string[] = []
  if (result.statement.length > 280) errors.push('Statement too long')
  if (result.statement.match(/^(would you|is |do you|can you)/i)) errors.push('Still in question format')
  if (result.statement.match(/\b(is better than|is possible)\b/i)) errors.push('Mechanical template phrase')
  if (result.agreeReasons.length < 3) errors.push('Need at least 3 agree reasons')
  if (result.disagreeReasons.length < 3) errors.push('Need at least 3 disagree reasons')

  if (errors.length > 0) {
    console.log(`\n❌ VALIDATION ERRORS:`)
    errors.forEach(e => console.log(`  - ${e}`))
  } else {
    console.log(`\n✅ VALIDATION PASSED`)
  }

  return result
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable required')
    process.exit(1)
  }

  const hotTakesPath = path.resolve(__dirname, '../data/hot-takes.json')
  if (!fs.existsSync(hotTakesPath)) {
    console.error(`Input file not found: ${hotTakesPath}`)
    process.exit(1)
  }

  const hotTakes: HotTake[] = JSON.parse(fs.readFileSync(hotTakesPath, 'utf-8'))

  // Test 3 samples from different categories
  const samples = [
    hotTakes.find(h => h.category === 'philosophy'),
    hotTakes.find(h => h.category === 'work'),
    hotTakes.find(h => h.category === 'lifestyle'),
  ].filter(Boolean) as HotTake[]

  console.log(`Testing enrichment on ${samples.length} samples...`)

  const client = new Anthropic({ apiKey })

  for (const sample of samples) {
    await testSingle(client, sample)
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('✨ Test complete!')
  console.log('\nIf results look good, run full enrichment:')
  console.log('  npx tsx scripts/enrich-hot-takes-with-claude.ts')
}

main().catch(console.error)
