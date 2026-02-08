# Enrichment TODO

## Current State (Temporary Fix Applied)

**Problem**: Only 10 / 1,938 hot takes are enriched with reason tags
**Symptom**: "Why do you think that?" section was invisible for unenriched hot takes
**Fix Applied**: Filter to only serve enriched hot takes

### What's Limited Right Now

- **Only "Lifestyle" category works** (all 10 enriched hot takes are lifestyle)
- **Only intensity 1-2 available** (all enriched takes are chill/casual)
- **Other 5 categories return no hot takes** (philosophy, relationships, work, money, society)

### Current Distribution

```
Enriched hot takes by category:
- lifestyle: 10
- philosophy: 0
- relationships: 0
- work: 0
- money: 0
- society: 0

Enriched hot takes by intensity:
- Level 1: 7
- Level 2: 3
- Level 3+: 0
```

## After Full Enrichment

### 1. Run Full Enrichment

```bash
cd /Users/eetu/claude-projects/Projects/stance-machine
ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts
```

**Duration**: ~40 minutes (batches of 20, 1 second delay)
**Cost**: ~$3.88 (Sonnet 4.5)

### 2. Remove Temporary Filters

Search for `TEMPORARY FIX` comments in `lib/hot-takes.ts` and remove these filters:

```typescript
// REMOVE THIS LINE after full enrichment:
.filter((t) => t.agreeReasons && t.disagreeReasons)
```

**Files to update**:
- `lib/hot-takes.ts` - `getRandomHotTake()`
- `lib/hot-takes.ts` - `getRandomHotTakeWithIntensity()`
- `lib/hot-takes.ts` - `getFilteredHotTakes()`
- `lib/hot-takes.ts` - `getIntensityDistribution()`

### 3. Verify After Removal

```bash
# Check all categories work
for cat in philosophy relationships work money lifestyle society; do
  echo "$cat:"
  curl -s "http://localhost:3001/api/spin-category?category=$cat" | jq '.statement'
done

# Check intensity distribution
curl -s "http://localhost:3001/api/intensity-distribution" | jq
```

**Expected**:
- All 6 categories return hot takes
- Intensity levels 1-5 all have counts
- Distribution makes sense per category

### 4. Commit Removal

```bash
git add lib/hot-takes.ts
git commit -m "Remove temporary enrichment filter - all hot takes now enriched"
git push origin main
```

## Quick Reference

**Check enrichment status**:
```bash
cat data/hot-takes.json | jq '[.[] | select(.agreeReasons)] | length'
```

**Check distribution by category**:
```bash
cat data/hot-takes.json | jq '[.[] | select(.agreeReasons)] | group_by(.category) | map({category: .[0].category, count: length})'
```

**Check distribution by intensity**:
```bash
cat data/hot-takes.json | jq '[.[] | select(.intensity)] | group_by(.intensity) | map({intensity: .[0].intensity, count: length})'
```

## Why This Approach

1. **Unblock deployment** - Can ship to production with 10 working hot takes
2. **Test UX flow** - Verify intensity system works end-to-end
3. **Incremental enrichment** - Can enrich later without blocking launch
4. **Clear removal path** - Easy to find and remove filters after enrichment

## Alternative: Partial Enrichment

If you want more variety before full enrichment:

```bash
# Enrich 50 hot takes across all categories
npx tsx scripts/enrich-hot-takes-with-claude.ts --limit=50

# Or enrich specific category
cat data/hot-takes.json | jq '[.[] | select(.category == "philosophy")] | .[0:20]' > /tmp/philosophy.json
# Then modify script to process from /tmp/philosophy.json
```
