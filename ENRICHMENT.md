# Hot Take Enrichment Guide

This guide explains how to enrich the 1,938 hot takes with natural statements and AI-generated reason tags using Claude API.

## Prerequisites

1. **Anthropic API key**: Get one from https://console.anthropic.com/
2. **Neon database**: Set up a Neon Postgres database at https://neon.tech/

## Step 1: Set up environment variables

Create or update `.env.local`:

```bash
# Anthropic API key for enrichment
ANTHROPIC_API_KEY=sk-ant-...

# Neon database connection string
DATABASE_URL=postgresql://...@...neon.tech/...?sslmode=require
```

## Step 2: Set up database

Run the schema SQL in your Neon console:

```bash
# Copy contents of schema.sql and run in Neon SQL Editor
cat schema.sql
```

Or use psql:

```bash
psql $DATABASE_URL < schema.sql
```

## Step 3: Run enrichment (dry run first)

Test without making API calls:

```bash
npx tsx scripts/enrich-hot-takes-with-claude.ts --dry-run
```

Test with a small sample:

```bash
npx tsx scripts/enrich-hot-takes-with-claude.ts --limit=10
```

## Step 4: Full enrichment

Enrich all 1,938 hot takes:

```bash
npx tsx scripts/enrich-hot-takes-with-claude.ts
```

**Estimated cost**: ~$1.74 for full enrichment
**Duration**: ~5-10 minutes (batch processing with rate limiting)

## Step 5: Verify output

Check the enriched data:

```bash
# View sample enriched hot takes
head -n 100 data/hot-takes.json | jq
```

Expected format:

```json
{
  "id": "abc123",
  "statement": "Remote work beats office life",
  "category": "work",
  "slug": "remote-work-beats-office-life",
  "tone": ["controversial"],
  "originalQuestion": "Do you think remote work is better than office work?",
  "agreeReasons": [
    "No commute saves hours",
    "Better work-life balance",
    "More productive at home"
  ],
  "disagreeReasons": [
    "Miss team collaboration",
    "Harder to focus at home",
    "Feel isolated"
  ],
  "enrichmentMetadata": {
    "model": "claude-3-5-sonnet-20241022",
    "validationPassed": true,
    "timestamp": "2026-02-08T..."
  }
}
```

## Validation checks

The enrichment script validates:

- ✓ Statement length (< 280 chars)
- ✓ Natural phrasing (no mechanical templates)
- ✓ Grammar (not in question format)
- ✓ Reason count (3-5 per side)
- ✓ Reason length (< 60 chars each)

Failed validations are logged and can be manually reviewed.

## Retry failed enrichments

If some hot takes failed enrichment:

```bash
# Filter failed items
jq '[.[] | select(.enrichmentMetadata.validationPassed == false)]' data/hot-takes.json > failed.json

# Count failures
jq 'length' failed.json

# Re-run enrichment on failures (manual process)
```

## Deployment

After enrichment is complete and validated:

```bash
# Commit enriched data
git add data/hot-takes.json
git commit -m "Enrich hot takes with Claude API"

# Deploy to Vercel
git push origin main
```

The new sequential UX flow will automatically use the enriched data with reason tags.

## Troubleshooting

**API rate limits**: The script includes 1-second delays between batches. If you hit rate limits, reduce batch size in the script.

**Database connection errors**: Verify DATABASE_URL is correct and includes `?sslmode=require`.

**Validation failures**: Review failed hot takes manually and update the prompt in the enrichment script if needed.

## Monitoring costs

Track API usage in Anthropic console:
https://console.anthropic.com/settings/usage

Expected breakdown:
- Input tokens: ~290K × $3/1M = $0.87
- Output tokens: ~150K × $15/1M = $2.25
- **Total: ~$3.12** (actual cost may vary)
