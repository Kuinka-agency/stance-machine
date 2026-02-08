import { NextRequest, NextResponse } from 'next/server'
import { getRandomHotTake, getRandomHotTakeWithIntensity } from '@/lib/hot-takes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []

  // NEW: Intensity filtering
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

  // Use intensity-aware function if intensity params provided
  const hotTake = (intensityMinParam || intensityMaxParam)
    ? getRandomHotTakeWithIntensity(category, intensityMin, intensityMax, excludeIds)
    : getRandomHotTake(category, excludeIds)

  if (!hotTake) {
    return NextResponse.json(
      { error: 'No hot takes available for this category with requested intensity' },
      { status: 404 }
    )
  }

  return NextResponse.json(hotTake)
}
