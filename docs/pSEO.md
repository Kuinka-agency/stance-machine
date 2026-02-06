# pSEO Implementation Guide — Stance Machine

## URL Architecture

### Layer 1: Category Pages (`/[category]`)
- `/philosophy` — Deep, existential hot takes
- `/relationships` — Love, dating, relationship opinions
- `/work` — Career and ambition hot takes
- `/money` — Financial opinions
- `/lifestyle` — Fun daily life hot takes
- `/society` — Cultural and political hot takes

### Layer 2: Tone Modifier Pages (`/[category]/[tone]`)
- `/philosophy/controversial`, `/philosophy/deep`
- `/lifestyle/funny`, `/lifestyle/random`
- Generated via `generateStaticParams()` at build time

### Layer 3: Individual Hot Takes (`/hot-takes/[slug]`) — Phase 2
- `/hot-takes/time-is-more-valuable-than-money`

### Layer 4: Shareable Stance Cards (`/stance/[hash]`)
- `/stance/a1b2c3d4` — User-generated, decoded from hash
- Not pre-rendered (dynamic)

## Target Keywords

From PRD-HOT-TAKES.md:
- "hot takes examples" (4,200/mo, KD 0)
- "controversial hot takes" (700/mo, KD 0)
- "funny hot takes" (1,200/mo, KD 1)
- "hot take questions" (600/mo, KD 0)
- Total addressable: 20K+ monthly

## Page Template Structure

Each pSEO page includes:
1. **H1** — Exact target keyword
2. **Interactive spinner** — StanceMachine component
3. **Hot takes list** — 20-30 curated statements with tone badges
4. **Internal links** — Related category/tone pages
5. **JSON-LD** — FAQPage schema

## Content Quality Rules

- Minimum 10 hot takes per tone page (threshold in `[tone]/page.tsx`)
- Each hot take shows tone badges
- No duplicate statements

## Technical SEO

- `generateMetadata()` for dynamic title/description
- `app/sitemap.ts` generates all routes
- `app/robots.ts` blocks `/api/`
- Stance card pages (`/stance/[hash]`) are dynamic (not pre-rendered)
- JSON data bundled in the build
