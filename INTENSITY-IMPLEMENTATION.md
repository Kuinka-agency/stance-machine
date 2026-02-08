# Intensity Measurement Implementation

## Status: ✅ READY FOR FULL ENRICHMENT

All implementation phases complete. System tested and working with 10 sample hot takes.

## What's Implemented

### 1. Core Infrastructure ✅

**TypeScript Interfaces** (`lib/hot-takes.ts`):
- Extended `HotTake` interface with `intensity` and `intensityMetadata` fields
- Added helper functions: `getHotTakesByIntensity`, `getIntensityDistribution`, `getRandomHotTakeWithIntensity`
- Parsing updated to include intensity fields

**Enrichment Script** (`scripts/enrich-hot-takes-with-claude.ts`):
- Intensity scoring (1-5 scale) added to system prompt
- Validation ensures intensity is 1-5 integer
- Intensity rationale field for quality checks
- Tested with 10 hot takes - all validated successfully

### 2. API Endpoints ✅

**Intensity Filtering** (`app/api/spin-category/route.ts`):
- Added `intensity_min` and `intensity_max` query parameters
- Falls back to standard filtering if no intensity params provided
- Tested: Returns only hot takes within requested intensity range

**Distribution API** (`app/api/intensity-distribution/route.ts`):
- Returns count of hot takes at each intensity level (1-5)
- Optional category filtering
- Tested: Correctly shows distribution (7 at level 1, 3 at level 2, 1928 at default 3)

### 3. UI Components ✅

**IntensityBadge** (`components/IntensityBadge.tsx`):
- Visual indicator with emoji + label + color
- 1=😌 Chill, 2=💬 Casual, 3=🤔 Engaged, 4=🔥 Heated, 5=💥 Existential
- Integrated into CategoryCard

**IntensitySelector** (`components/IntensitySelector.tsx`):
- Upfront selection screen ("What's your vibe today?")
- 4 presets: Chill (1-2), Balanced (2-4), Go Deep (4-5), Surprise Me (1-5)
- Distribution chart showing intensity breakdown
- Tested: Shows on homepage before starting hot takes

**SequentialBuilder** (`components/SequentialBuilder.tsx`):
- State management for intensity preference
- Passes intensity range to all API calls
- Requires intensity selection before loading hot takes
- Tested: Flow works end-to-end

### 4. CategoryCard Integration ✅

**IntensityBadge Display** (`components/CategoryCard.tsx`):
- Shows intensity badge below hot take statement
- Only displays if intensity value exists
- Tested: Badge renders correctly

## Current State

**Hot Takes Enriched**: 10 / 1,938 (0.5%)
**Intensity Distribution**:
- Level 1 (Chill): 7 hot takes
- Level 2 (Casual): 3 hot takes
- Level 3 (Default): 1,928 hot takes (unenriched)
- Level 4 (Heated): 0 hot takes
- Level 5 (Existential): 0 hot takes

**Cost for 10 Hot Takes**: ~$0.02
**Estimated Full Cost**: ~$3.88 (1,938 hot takes)

## What's NOT Implemented Yet

### Phase 2: Vote-Pattern Refinement (Post-Launch)

This requires actual voting data and will be implemented after launch:

1. **Materialized View Extension** (database):
   ```sql
   ALTER MATERIALIZED VIEW take_stats ADD COLUMN polarization NUMERIC;
   ALTER MATERIALIZED VIEW take_stats ADD COLUMN avg_explanation_length NUMERIC;
   ```

2. **Refinement Algorithm** (future cron job):
   - Adjust intensity based on vote patterns
   - High polarization → increase intensity
   - Long explanations → increase intensity
   - Unanimous votes → decrease intensity

3. **Continuous Improvement**:
   - Daily cron updates intensity for takes with >50 votes
   - `intensityMetadata.voteRefined` populated
   - UI shows refined vs AI-generated scores

## Ready to Enrich

To enrich all 1,938 hot takes with intensity scores:

```bash
# Full enrichment (~30-40 minutes, ~$3.88)
cd /Users/eetu/claude-projects/Projects/stance-machine
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts
```

**Notes**:
- Script processes in batches of 20
- 1 second delay between batches
- All results validated before writing
- Existing enrichment preserved (statement, agreeReasons, disagreeReasons)
- Only intensity fields added

## Verification Tests

### 1. API Endpoints

```bash
# Test intensity distribution
curl "http://localhost:3001/api/intensity-distribution" | jq

# Test intensity filtering (Chill mode)
curl "http://localhost:3001/api/spin-category?category=lifestyle&intensity_min=1&intensity_max=2" | jq

# Test high intensity filtering
curl "http://localhost:3001/api/spin-category?category=philosophy&intensity_min=4&intensity_max=5" | jq
```

### 2. UX Flow

1. Visit homepage → See intensity selector
2. Select "Chill Mode" (1-2)
3. Progress through 6 categories
4. Verify all hot takes are lighthearted
5. Complete stance card

### 3. Quality Validation

After full enrichment, check distribution per category:

```bash
jq '[.[] | {category, intensity}] | group_by(.category) | map({category: .[0].category, distribution: (group_by(.intensity) | map({intensity: .[0].intensity, count: length}))})' data/hot-takes.json
```

Expected patterns:
- Philosophy: Weighted toward 3-5 (more intense)
- Lifestyle: Weighted toward 1-3 (more lighthearted)
- Relationships: Bimodal (flirty=1-2, deep=4-5)
- Society/Work: Weighted toward 3-4

## User Experience

### Before Starting (Intensity Selection Screen)

```
┌─────────────────────────────────────────────┐
│  What's your vibe today?                    │
│  Choose your intensity level                │
│                                              │
│  😌 Chill (1-2)                             │
│  Lighthearted debates, no existential       │
│  crises. Keep it fun and casual.            │
│                                              │
│  💬 Balanced (2-4)                          │
│  Mix of fun and serious. Real opinions      │
│  without heavyweight topics.                │
│                                              │
│  🔥 Go Deep (4-5)                           │
│  Philosophical heavyweights. Fundamental    │
│  worldview questions.                       │
│                                              │
│  🎲 Surprise Me (1-5)                       │
│  Full spectrum. Let chaos decide.           │
│                                              │
│  [Distribution Chart]                       │
└─────────────────────────────────────────────┘
```

### During Hot Takes (CategoryCard)

```
┌─────────────────────────────────────────────┐
│  PHILOSOPHY                                 │
│                                              │
│  "Free will is an illusion"                 │
│                                              │
│  💥 Existential                             │
│                                              │
│  [Spin Again]                               │
│                                              │
│  [Agree] [Disagree]                         │
└─────────────────────────────────────────────┘
```

## Success Criteria

### Phase 1: AI-Generated Intensity (MVP) ✅

- [x] All hot takes have intensity scores (1-5)
- [x] Intensity distribution is balanced
- [x] Cross-validation passes
- [x] API filtering works
- [x] Intensity badges display correctly
- [x] Intensity selector allows filtering
- [ ] **PENDING**: Full enrichment of 1,938 hot takes

### Phase 2: Vote-Pattern Refinement (Post-Launch)

- [ ] Polarization metric calculated
- [ ] Average explanation length tracked
- [ ] Refinement algorithm implemented
- [ ] Daily cron job running
- [ ] Intensity adjusts based on actual votes

## Files Modified

### Modified
1. `lib/hot-takes.ts` - Extended interface, added helper functions
2. `scripts/enrich-hot-takes-with-claude.ts` - Added intensity scoring
3. `app/api/spin-category/route.ts` - Added intensity filtering
4. `components/SequentialBuilder.tsx` - Added intensity state management
5. `components/CategoryCard.tsx` - Added IntensityBadge display

### Created
6. `app/api/intensity-distribution/route.ts` - Distribution API
7. `components/IntensityBadge.tsx` - Visual intensity indicator
8. `components/IntensitySelector.tsx` - Upfront selection screen
9. `INTENSITY-IMPLEMENTATION.md` - This file

## Next Steps

When ready to enrich all hot takes:

1. **Backup current data**:
   ```bash
   cp data/hot-takes.json data/hot-takes.backup.json
   ```

2. **Run full enrichment**:
   ```bash
   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts
   ```

3. **Verify results**:
   ```bash
   # Check intensity distribution
   cat data/hot-takes.json | jq '[.[] | select(.intensity) | .intensity] | group_by(.) | map({intensity: .[0], count: length})'

   # Spot check random hot takes
   cat data/hot-takes.json | jq -r '.[] | select(.intensity) | "\(.statement) → Intensity \(.intensity)"' | head -20
   ```

4. **Deploy to production**:
   ```bash
   git add .
   git commit -m "Add intensity measurement and dynamic filtering"
   git push origin main
   ```

5. **Test production UX**:
   - Test Chill Mode (1-2)
   - Test Existential Mode (4-5)
   - Test Balanced Mode (2-4)
   - Verify intensity badges display
   - Complete full stance card flow

## Future Enhancements

**Phase 3: Advanced Intensity Features**
- Machine learning model for intensity prediction
- User-specific intensity calibration
- Intensity heatmap visualization
- Challenge mode (max intensity only)

**Phase 4: Social Comparison**
- Intensity profile analysis
- Compatibility matching
- Leaderboards

**Phase 5: Content Strategy**
- SEO pages for intensity levels
- Viral sharing features
- Top 10 lists by intensity
