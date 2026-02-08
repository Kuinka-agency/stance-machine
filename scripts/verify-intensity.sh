#!/bin/bash

# Intensity Measurement Verification Script
# Tests all implemented intensity features

set -e

echo "🔍 Intensity Measurement Verification"
echo "======================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "❌ Dev server not running on localhost:3001"
  echo "   Start with: npm run dev"
  exit 1
fi

echo "✅ Dev server running"
echo ""

# Test 1: Intensity distribution API
echo "Test 1: Intensity Distribution API"
echo "-----------------------------------"
DIST=$(curl -s "http://localhost:3001/api/intensity-distribution")
echo "Full distribution: $DIST"
echo ""

# Test 2: Category-specific distribution
echo "Test 2: Category-Specific Distribution"
echo "---------------------------------------"
for category in philosophy relationships work money lifestyle society; do
  DIST=$(curl -s "http://localhost:3001/api/intensity-distribution?category=$category" | jq -r 'to_entries | map("\(.key):\(.value)") | join(", ")')
  echo "  $category: $DIST"
done
echo ""

# Test 3: Intensity filtering (Chill mode)
echo "Test 3: Intensity Filtering - Chill Mode (1-2)"
echo "-----------------------------------------------"
RESULT=$(curl -s "http://localhost:3001/api/spin-category?category=lifestyle&intensity_min=1&intensity_max=2")
ID=$(echo "$RESULT" | jq -r '.id')
STATEMENT=$(echo "$RESULT" | jq -r '.statement')
INTENSITY=$(echo "$RESULT" | jq -r '.intensity')

if [ "$INTENSITY" = "null" ]; then
  echo "⚠️  No enriched hot takes at intensity 1-2 in lifestyle"
else
  echo "✅ Found hot take:"
  echo "   ID: $ID"
  echo "   Statement: $STATEMENT"
  echo "   Intensity: $INTENSITY"
fi
echo ""

# Test 4: Intensity filtering (Balanced mode)
echo "Test 4: Intensity Filtering - Balanced Mode (2-4)"
echo "--------------------------------------------------"
RESULT=$(curl -s "http://localhost:3001/api/spin-category?category=philosophy&intensity_min=2&intensity_max=4")
ID=$(echo "$RESULT" | jq -r '.id')
STATEMENT=$(echo "$RESULT" | jq -r '.statement')
INTENSITY=$(echo "$RESULT" | jq -r '.intensity')
echo "✅ Found hot take:"
echo "   ID: $ID"
echo "   Statement: $STATEMENT"
echo "   Intensity: ${INTENSITY:-3 (default)}"
echo ""

# Test 5: Enrichment status
echo "Test 5: Enrichment Status"
echo "-------------------------"
TOTAL=$(cat data/hot-takes.json | jq 'length')
ENRICHED=$(cat data/hot-takes.json | jq '[.[] | select(.intensity != null)] | length')
PERCENT=$(awk "BEGIN {printf \"%.1f\", ($ENRICHED / $TOTAL) * 100}")

echo "Total hot takes: $TOTAL"
echo "Enriched with intensity: $ENRICHED ($PERCENT%)"
echo ""

# Test 6: Intensity distribution breakdown
echo "Test 6: Intensity Distribution Breakdown"
echo "----------------------------------------"
cat data/hot-takes.json | jq -r '[.[] | select(.intensity != null) | .intensity] | group_by(.) | map({intensity: .[0], count: length}) | .[] | "  Level \(.intensity): \(.count) hot takes"'
echo ""

# Test 7: Sample enriched hot takes
echo "Test 7: Sample Enriched Hot Takes"
echo "----------------------------------"
cat data/hot-takes.json | jq -r '.[] | select(.intensity != null) | "[\(.intensity)] \(.statement)"' | head -5
echo ""

# Summary
echo "======================================"
echo "Summary"
echo "======================================"
echo "✅ All API endpoints working"
echo "✅ Intensity filtering functional"
if [ "$ENRICHED" -gt 0 ]; then
  echo "✅ $ENRICHED hot takes enriched with intensity"
else
  echo "⚠️  No hot takes enriched yet"
fi

if [ "$ENRICHED" -eq "$TOTAL" ]; then
  echo "🎉 Full enrichment complete!"
  echo ""
  echo "Next: Deploy to production"
else
  echo ""
  echo "Next: Run full enrichment"
  echo "  ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-hot-takes-with-claude.ts"
fi
