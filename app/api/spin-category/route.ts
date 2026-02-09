import { NextRequest, NextResponse } from 'next/server'
import { getRandomHotTake, getRandomHotTakeWithIntensity } from '@/lib/hot-takes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []

  const intensityMinParam = searchParams.get('intensity_min')
  const intensityMaxParam = searchParams.get('intensity_max')
  const intensityMin = intensityMinParam ? parseInt(intensityMinParam) : 1
  const intensityMax = intensityMaxParam ? parseInt(intensityMaxParam) : 5

  if (!category) {
    return NextResponse.json(
      { error: 'category parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Timeout: don't hang forever if DB is slow
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const hotTake = await Promise.race([
      (intensityMinParam || intensityMaxParam)
        ? getRandomHotTakeWithIntensity(category, intensityMin, intensityMax, excludeIds)
        : getRandomHotTake(category, excludeIds),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 10000)
      ),
    ])

    clearTimeout(timeout)

    if (!hotTake) {
      return NextResponse.json(
        { error: 'No hot takes available for this category with requested intensity' },
        { status: 404 }
      )
    }

    return NextResponse.json(hotTake, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Spin category error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
