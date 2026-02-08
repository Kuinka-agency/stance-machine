# Stance Machine

Hot take generator with intensity-aware serving. Pick your hills, die on them.

## Features

### Core Mechanics
- **1,938 Hot Takes** across 6 categories (Philosophy, Relationships, Work, Money, Lifestyle, Society)
- **Sequential Flow**: One category at a time, 6 total
- **Stance Selection**: Agree/Disagree with reason tags and optional explanation
- **Vote Persistence**: All votes saved to Supabase with session tracking
- **Shareable Stance Cards**: Generate shareable cards after completing all 6 categories

### Intensity Measurement (NEW)
- **1-5 Intensity Scale**: Chill (1) to Existential (5)
- **Upfront Selection**: Choose your vibe before starting (Chill / Balanced / Go Deep / Surprise Me)
- **Dynamic Filtering**: All hot takes served at selected intensity level
- **Visual Indicators**: Intensity badges on each hot take card
- **Distribution Charts**: See breakdown of intensity levels per category

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Variables (Rams-inspired design system)
- **Deployment**: Vercel
- **Enrichment**: Claude API (Sonnet 4.5)

## Project Structure

```
stance-machine/
├── app/
│   ├── api/
│   │   ├── spin-category/          # Hot take serving with intensity filtering
│   │   ├── intensity-distribution/ # Intensity breakdown API
│   │   └── vote/                   # Vote persistence
│   ├── stance/[hash]/              # Shareable stance cards
│   └── page.tsx                    # Landing page
├── components/
│   ├── SequentialBuilder.tsx       # Main flow orchestration
│   ├── CategoryCard.tsx            # Individual hot take display
│   ├── IntensitySelector.tsx       # Upfront intensity selection
│   ├── IntensityBadge.tsx          # Visual intensity indicator
│   ├── AgreeDisagreeButtons.tsx    # Stance selection
│   ├── ReasonTagPicker.tsx         # Reason selection
│   └── StanceCard.tsx              # Shareable card generation
├── lib/
│   ├── hot-takes.ts                # Hot take data + intensity helpers
│   └── stance-card.ts              # Encoding/decoding logic
├── scripts/
│   ├── enrich-hot-takes-with-claude.ts  # Enrichment with intensity scoring
│   └── verify-intensity.sh              # Verification tests
├── data/
│   └── hot-takes.json              # 1,938 enriched hot takes
└── docs/
    ├── INTENSITY-IMPLEMENTATION.md # Full implementation details
    └── READY-TO-ENRICH.md         # Enrichment guide
```

## Database Schema

```sql
-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  take_id TEXT NOT NULL,
  stance TEXT NOT NULL CHECK (stance IN ('agree', 'disagree')),
  reason_tags TEXT[],
  explanation TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for stats
CREATE MATERIALIZED VIEW take_stats AS
SELECT
  take_id,
  COUNT(*) AS total_votes,
  COUNT(*) FILTER (WHERE stance = 'agree') AS agree_votes,
  COUNT(*) FILTER (WHERE stance = 'disagree') AS disagree_votes,
  ROUND(COUNT(*) FILTER (WHERE stance = 'agree')::NUMERIC / COUNT(*) * 100, 1) AS agree_percentage
FROM votes
GROUP BY take_id;
```

## Intensity System

### Scale Definition
- **1 - Chill**: Lighthearted, playful, no real stakes
- **2 - Casual**: Personal preferences with practical reasoning
- **3 - Engaged**: Values-based opinions, some identity investment
- **4 - Heated**: Touches identity, morality, worldview
- **5 - Existential**: Fundamental beliefs about reality/meaning/ethics

### AI-Generated (Phase 1) ✅
- Claude assigns intensity during enrichment
- Based on stakes, controversy, emotional weight
- Validated during processing
- 10 / 1,938 enriched so far

### Vote-Refined (Phase 2) 🔜
- Adjust based on actual voting patterns
- High polarization → increase intensity
- Long explanations → increase intensity
- Continuous learning after launch

## Development

### Setup

```bash
# Clone repo
git clone <repo-url>
cd stance-machine

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add SUPABASE_URL and SUPABASE_ANON_KEY

# Run dev server
npm run dev
```

### Enrichment

```bash
# Test with 10 hot takes
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --limit=10

# Full enrichment (1,938 hot takes, ~$3.88, ~40 min)
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts

# Verify results
./scripts/verify-intensity.sh
```

### Testing

```bash
# Start dev server
npm run dev

# Test intensity distribution
curl "http://localhost:3001/api/intensity-distribution" | jq

# Test intensity filtering (Chill mode)
curl "http://localhost:3001/api/spin-category?category=lifestyle&intensity_min=1&intensity_max=2" | jq

# Test full UX flow
open http://localhost:3001
```

## Deployment

Deployed to Vercel with automatic deployments from main branch.

```bash
# Deploy to production
git push origin main
```

Environment variables required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Current Status

**Enrichment**: 10 / 1,938 (0.5%)
- Intensity scoring implemented and tested
- All UI components ready
- API endpoints functional
- Ready for full enrichment

**Next Steps**:
1. Full enrichment of 1,938 hot takes
2. Deploy to production
3. Monitor user intensity preferences
4. Implement vote-pattern refinement (Phase 2)

## Documentation

- **INTENSITY-IMPLEMENTATION.md** - Full implementation details
- **READY-TO-ENRICH.md** - Enrichment guide and verification
- **scripts/verify-intensity.sh** - Automated verification tests

## License

MIT
