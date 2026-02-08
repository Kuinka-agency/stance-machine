# Stance Machine - Project Context

Hot take generator with intensity-aware serving and sequential UX.

## Quick Context

**What it is**: Users get 6 hot takes (one per category), pick agree/disagree, share stance card
**Status**: Intensity system implemented, tested with 10 hot takes, ready for full enrichment
**Tech**: Next.js 15, Supabase, Claude API enrichment

## Current Sprint: Intensity Measurement ✅

All phases complete except full enrichment of 1,938 hot takes.

### Implemented Features
- **Intensity Scale (1-5)**: Chill → Casual → Engaged → Heated → Existential
- **Upfront Selection**: User chooses vibe before starting (4 presets)
- **Dynamic Filtering**: Hot takes served at selected intensity
- **Visual Indicators**: Intensity badges on cards
- **Distribution API**: Shows intensity breakdown per category

### Files Modified
1. `lib/hot-takes.ts` - Extended interface, helper functions
2. `scripts/enrich-hot-takes-with-claude.ts` - Intensity scoring
3. `app/api/spin-category/route.ts` - Intensity filtering
4. `components/SequentialBuilder.tsx` - State management
5. `components/CategoryCard.tsx` - IntensityBadge display

### Files Created
6. `app/api/intensity-distribution/route.ts` - Distribution API
7. `components/IntensityBadge.tsx` - Visual indicator
8. `components/IntensitySelector.tsx` - Selection screen
9. `scripts/verify-intensity.sh` - Verification tests
10. `INTENSITY-IMPLEMENTATION.md` - Full docs
11. `READY-TO-ENRICH.md` - Enrichment guide
12. `README.md` - Project overview

### Verification Results
```bash
✅ All API endpoints working
✅ Intensity filtering functional
✅ 10 hot takes enriched with intensity
✅ UI components render correctly
✅ End-to-end flow tested
```

## Data State

**Hot Takes**: 1,938 total
- 10 enriched with intensity (0.5%)
- 1,928 default to intensity 3
- Distribution: 7 at level 1, 3 at level 2

**Cost**: ~$0.02 for 10 hot takes, ~$3.88 estimated for full enrichment

## Architecture

### Intensity System Flow
```
User arrives → IntensitySelector
  ↓
Selects vibe (Chill/Balanced/Deep/Surprise)
  ↓
SequentialBuilder stores intensityRange: [min, max]
  ↓
Loads hot takes filtered by intensity
  ↓
CategoryCard shows IntensityBadge
  ↓
User completes 6 categories → Stance Card
```

### API Routes
- `GET /api/spin-category?category=X&intensity_min=1&intensity_max=2`
- `GET /api/intensity-distribution?category=X`
- `POST /api/vote`

### Database
```sql
-- Votes table (Supabase)
votes: take_id, stance, reason_tags, explanation, session_id

-- Materialized view
take_stats: take_id, total_votes, agree_percentage, etc.
```

## Quick Commands

```bash
# Test enrichment (10 hot takes)
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts --limit=10

# Full enrichment (1,938 hot takes, ~40 min)
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts

# Verify implementation
./scripts/verify-intensity.sh

# Dev server
npm run dev

# Deploy
git push origin main
```

## Next Steps

1. **Full enrichment** - Enrich all 1,938 hot takes (~$3.88, 40 min)
2. **Deploy to Vercel** - Test production UX
3. **Monitor usage** - Track which intensity modes users prefer
4. **Phase 2** - Implement vote-pattern refinement after launch

## UX Patterns

### Intensity Selection (Before Starting)
```
What's your vibe today?

😌 Chill (1-2) - Lighthearted, no existential crises
💬 Balanced (2-4) - Mix of fun and serious
🔥 Go Deep (4-5) - Philosophical heavyweights
🎲 Surprise Me (1-5) - Full spectrum
```

### Hot Take Card (During Flow)
```
PHILOSOPHY

"Free will is an illusion"

💥 Existential

[Spin Again]
[Agree] [Disagree]
```

### Intensity Badge
```
😌 Chill      (1)
💬 Casual     (2)
🤔 Engaged    (3)
🔥 Heated     (4)
💥 Existential (5)
```

## Design System

Rams-inspired minimalism with CSS variables:
- `--bg-primary`, `--bg-secondary`, `--bg-card`
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--accent`, `--agree`, `--disagree`
- `--cat-philosophy`, `--cat-relationships`, etc.

## Testing Checklist

Before deploying full enrichment:
- [ ] Test Chill Mode (1-2) - all hot takes lighthearted
- [ ] Test Go Deep Mode (4-5) - all hot takes philosophical
- [ ] Test Balanced Mode (2-4) - mix of intensities
- [ ] Test Surprise Me (1-5) - full spectrum
- [ ] Verify intensity badges display
- [ ] Complete full stance card flow
- [ ] Check distribution makes sense per category

## Known Issues / Future Work

**Phase 2 - Vote Refinement** (post-launch):
- Polarization calculation from vote patterns
- Intensity adjustment based on engagement
- Daily cron job for refinement

**Phase 3 - Advanced Features** (future):
- ML model for intensity prediction
- User-specific calibration
- Intensity heatmaps
- Challenge mode (max intensity only)

**Phase 4 - Social** (future):
- Intensity profile analysis
- Compatibility matching
- Leaderboards

## Working with This Project

### If you need to understand intensity system:
Read: `INTENSITY-IMPLEMENTATION.md`

### If you're ready to enrich:
Read: `READY-TO-ENRICH.md`

### If you're debugging:
Run: `./scripts/verify-intensity.sh`

### If you're adding features:
- Follow Rams design system
- Keep components simple and focused
- Use TypeScript interfaces
- Add verification tests

## Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx  # Only for enrichment
```

## Cost Estimates

**Enrichment**:
- 10 hot takes: ~$0.02
- 1,938 hot takes: ~$3.88
- Model: Claude Sonnet 4.5

**Deployment**: Free (Vercel hobby)

## Success Metrics

**Pre-launch**:
- ✅ All 1,938 hot takes enriched
- ✅ Intensity distribution balanced
- ✅ All 4 intensity modes tested

**Post-launch**:
- Track intensity mode selection %
- Monitor completion rates by intensity
- Collect vote data for refinement
- Measure sharing by intensity level

## Documentation Map

- **README.md** - Project overview, setup, deployment
- **CLAUDE.md** - This file (project context)
- **INTENSITY-IMPLEMENTATION.md** - Full technical details
- **READY-TO-ENRICH.md** - Enrichment guide
- **scripts/verify-intensity.sh** - Verification tests
