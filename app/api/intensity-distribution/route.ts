import { NextRequest, NextResponse } from 'next/server'
import { getIntensityDistribution } from '@/lib/hot-takes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined

  try {
    const distribution = await Promise.race([
      getIntensityDistribution(category),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 10000)
      ),
    ])

    return NextResponse.json(distribution, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Intensity distribution error:', error)
    // Return default distribution so UI doesn't break
    return NextResponse.json(
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      { status: 503 }
    )
  }
}
