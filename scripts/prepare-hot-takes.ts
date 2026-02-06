/**
 * prepare-hot-takes.ts
 *
 * Transforms questions into declarative hot take statements for the Stance Machine.
 *
 * Two modes:
 * 1. --candidates-only: Extract and filter candidate questions, output candidates.json (FREE)
 * 2. --transform: Use template-based rules to convert questions to statements (FREE)
 *
 * For Claude batch API enrichment (higher quality), use a separate enrichment script.
 * This keeps the core pipeline cost-free.
 *
 * Categories:
 *   philosophy — deep, controversial, self-reflection, hypothetical
 *   relationships — couples, dating, deep/spicy
 *   work — career, job, work, ambition keywords
 *   money — money, rich, salary, afford keywords
 *   lifestyle — funny, random, daily life
 *   society — controversial, challenging, social issues
 *
 * Run:
 *   npx tsx scripts/prepare-hot-takes.ts --candidates-only  # Step 1: extract
 *   npx tsx scripts/prepare-hot-takes.ts --transform        # Step 2: transform
 *   npx tsx scripts/prepare-hot-takes.ts                    # Both steps
 */

import * as fs from 'fs'
import * as path from 'path'

interface RawQuestion {
  id: string
  text: string
  slug: string
  option_a: string | null
  option_b: string | null
  format: string
  game_type: string | null
  category: string
  audiences: string[]
  tones: string[]
  occasions: string[]
  difficulty: string
}

interface HotTake {
  id: string
  statement: string
  category: string
  slug: string
  tone: string[]
  originalQuestion: string
}

type StanceCategory = 'philosophy' | 'relationships' | 'work' | 'money' | 'lifestyle' | 'society'

// Category keyword patterns
const CATEGORY_PATTERNS: Record<StanceCategory, { keywords: RegExp; tones: string[]; categories: string[]; audiences: string[] }> = {
  philosophy: {
    keywords: /\b(meaning|purpose|life|death|god|universe|consciousness|morality|ethics|exist|truth|reality|time|free will|soul|afterlife|simulation)\b/i,
    tones: ['deep', 'controversial'],
    categories: ['self_reflection', 'hypothetical'],
    audiences: [],
  },
  relationships: {
    keywords: /\b(love|partner|relationship|marriage|dating|breakup|cheat|trust|jealous|commitment|romance|soulmate|ex|family|parent)\b/i,
    tones: ['deep', 'spicy', 'flirty'],
    categories: ['dating', 'relationship'],
    audiences: ['couples', 'dating', 'married'],
  },
  work: {
    keywords: /\b(career|job|work|boss|office|profession|ambition|promotion|hustle|entrepreneur|retire|salary|colleague|hire|fire|quit)\b/i,
    tones: [],
    categories: [],
    audiences: [],
  },
  money: {
    keywords: /\b(money|rich|wealth|salary|afford|expensive|cheap|invest|debt|million|billion|poverty|financial|income|spend|save|budget)\b/i,
    tones: [],
    categories: [],
    audiences: [],
  },
  lifestyle: {
    keywords: /\b(food|travel|music|movie|book|hobby|fashion|social media|fitness|health|diet|sleep|routine|habit|weekend|vacation)\b/i,
    tones: ['funny', 'random', 'weird'],
    categories: [],
    audiences: [],
  },
  society: {
    keywords: /\b(politic|govern|law|rights|equal|justice|climate|technology|AI|internet|privacy|education|system|society|culture|generation)\b/i,
    tones: ['controversial', 'challenging'],
    categories: [],
    audiences: [],
  },
}

function classifyCategory(q: RawQuestion): StanceCategory | null {
  const tones = new Set(q.tones)
  const text = q.text

  // Check keyword matches first (most specific)
  for (const [cat, config] of Object.entries(CATEGORY_PATTERNS) as [StanceCategory, typeof CATEGORY_PATTERNS[StanceCategory]][]) {
    if (config.keywords.test(text)) {
      return cat
    }
  }

  // Fall back to tone/category matching
  for (const [cat, config] of Object.entries(CATEGORY_PATTERNS) as [StanceCategory, typeof CATEGORY_PATTERNS[StanceCategory]][]) {
    if (config.tones.some(t => tones.has(t))) return cat
    if (config.categories.includes(q.category)) return cat
    if (config.audiences.some(a => q.audiences.includes(a))) return cat
  }

  return null
}

/**
 * Template-based question-to-statement transformation.
 * Handles common question patterns without needing an API call.
 */
function questionToStatement(q: RawQuestion): string | null {
  const text = q.text.trim()

  // Binary (WYR): "Would you rather A or B?" → "A is better than B"
  if (q.format === 'binary' && q.option_a && q.option_b) {
    return `${q.option_a} is better than ${q.option_b}`
  }

  // "Do you think X?" → "X"
  const doYouThink = text.match(/^Do you (?:think|believe|feel) (?:that )?(.+)\?$/i)
  if (doYouThink) {
    let stmt = doYouThink[1]
    stmt = stmt.charAt(0).toUpperCase() + stmt.slice(1)
    return stmt
  }

  // "Is it better to X or Y?" → "It is better to X than Y"
  const isBetter = text.match(/^Is it (?:better|more important) to (.+?) (?:or|than) (.+)\?$/i)
  if (isBetter) {
    return `It is better to ${isBetter[1]} than ${isBetter[2]}`
  }

  // "Should X?" → "X should happen" / "People should X"
  const should = text.match(/^Should (?:you|we|people) (.+)\?$/i)
  if (should) {
    return `People should ${should[1]}`
  }

  // "Is X more important than Y?" → "X is more important than Y"
  const moreImportant = text.match(/^Is (.+?) more important than (.+)\?$/i)
  if (moreImportant) {
    return `${moreImportant[1].charAt(0).toUpperCase() + moreImportant[1].slice(1)} is more important than ${moreImportant[2]}`
  }

  // "What's more important: X or Y?" → "X is more important than Y"
  const whatsMore = text.match(/^What(?:'s| is) more important[,:] (.+?) or (.+)\?$/i)
  if (whatsMore) {
    return `${whatsMore[1].charAt(0).toUpperCase() + whatsMore[1].slice(1)} is more important than ${whatsMore[2]}`
  }

  // "Would you rather X?" (no options) → "People should X"
  const wyr = text.match(/^Would you rather (.+)\?$/i)
  if (wyr && !q.option_a) {
    return `People should ${wyr[1]}`
  }

  // "Can X?" → "X is possible"
  const can = text.match(/^Can (.+)\?$/i)
  if (can) {
    return `${can[1].charAt(0).toUpperCase() + can[1].slice(1)} is possible`
  }

  // Open-ended deep/controversial questions — harder to auto-transform
  // These are best left for Claude batch API enrichment
  return null
}

function makeSlug(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function isGoodCandidate(q: RawQuestion): boolean {
  // Must end with ?
  if (!q.text.trim().endsWith('?')) return false
  // Not too short
  if (q.text.length < 20) return false
  // Not trivia
  if (q.format === 'trivia') return false
  // Should have some opinion/debate potential
  const tones = new Set(q.tones)
  const hasOpinionTone = tones.has('deep') || tones.has('controversial') || tones.has('challenging') || tones.has('spicy')
  const hasDebatableFormat = q.format === 'binary' || q.format === 'opinion'
  const hasOpinionKeywords = /\b(better|worse|should|important|overrated|underrated|wrong|right|think|believe|opinion|rather)\b/i.test(q.text)

  return hasOpinionTone || hasDebatableFormat || hasOpinionKeywords
}

function main() {
  const args = process.argv.slice(2)
  const candidatesOnly = args.includes('--candidates-only')
  const transformOnly = args.includes('--transform')
  const limit = args.find(a => a.startsWith('--limit='))
  const maxItems = limit ? parseInt(limit.split('=')[1]) : undefined

  const sourcePath = path.resolve(
    __dirname,
    '../../QuestionMonopoly/data/competitors/unified/unified_questions.json'
  )

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`)
    process.exit(1)
  }

  const raw: RawQuestion[] = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))
  console.log(`Read ${raw.length} questions from corpus`)

  // Step 1: Extract candidates
  if (!transformOnly) {
    const candidates = raw.filter(isGoodCandidate)
    console.log(`Found ${candidates.length} hot take candidates`)

    const categorized: Record<string, RawQuestion[]> = {}
    let uncategorized = 0

    for (const q of candidates) {
      const cat = classifyCategory(q)
      if (cat) {
        if (!categorized[cat]) categorized[cat] = []
        categorized[cat].push(q)
      } else {
        uncategorized++
      }
    }

    console.log(`\nCandidate distribution:`)
    for (const [cat, qs] of Object.entries(categorized)) {
      console.log(`  ${cat}: ${qs.length}`)
    }
    console.log(`  uncategorized: ${uncategorized}`)

    const candidatesPath = path.resolve(__dirname, '../data/candidates.json')
    fs.writeFileSync(candidatesPath, JSON.stringify(categorized, null, 2))
    console.log(`\nWrote candidates to ${candidatesPath}`)

    if (candidatesOnly) return
  }

  // Step 2: Transform to statements
  console.log(`\nTransforming questions to statements...`)

  const candidatesPath = path.resolve(__dirname, '../data/candidates.json')
  const categorized: Record<string, RawQuestion[]> = JSON.parse(
    fs.readFileSync(candidatesPath, 'utf-8')
  )

  const hotTakes: HotTake[] = []
  const catCounts: Record<string, { total: number; transformed: number }> = {}

  // Deduplicate by normalized statement
  const seen = new Set<string>()

  for (const [category, questions] of Object.entries(categorized)) {
    catCounts[category] = { total: questions.length, transformed: 0 }

    const pool = maxItems
      ? questions.slice(0, Math.ceil(maxItems / 6))
      : questions

    for (const q of pool) {
      const statement = questionToStatement(q)
      if (!statement) continue

      const normalized = statement.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(normalized)) continue
      seen.add(normalized)

      hotTakes.push({
        id: q.id,
        statement,
        category,
        slug: makeSlug(statement),
        tone: q.tones,
        originalQuestion: q.text,
      })

      catCounts[category].transformed++
    }
  }

  console.log(`\nTransformation results:`)
  for (const [cat, counts] of Object.entries(catCounts)) {
    console.log(`  ${cat}: ${counts.transformed}/${counts.total} transformed`)
  }
  console.log(`  Total hot takes: ${hotTakes.length}`)

  const outPath = path.resolve(__dirname, '../data/hot-takes.json')
  fs.writeFileSync(outPath, JSON.stringify(hotTakes, null, 2))
  console.log(`\nWrote ${hotTakes.length} hot takes to ${outPath}`)

  // Summary for enrichment planning
  const untransformed = Object.values(catCounts).reduce(
    (sum, c) => sum + (c.total - c.transformed),
    0
  )
  console.log(`\n${untransformed} questions remain untransformed (need Claude batch API for these)`)
}

main()
