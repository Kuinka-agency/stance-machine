import { NextRequest, NextResponse } from 'next/server'
import { spinHotTakes, getCategories } from '@/lib/hot-takes'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lockedParam = searchParams.get('locked')

  // Parse locked hot takes: "philosophy:abc123,work:def456"
  const locked: Record<string, string> = {}

  if (lockedParam) {
    const pairs = lockedParam.split(',')
    for (const pair of pairs) {
      const [category, id] = pair.split(':')
      if (category && id) {
        locked[category] = id
      }
    }
  }

  const hotTakes = spinHotTakes(locked)
  const categories = getCategories()

  return NextResponse.json({
    hotTakes,
    categories,
  })
}
