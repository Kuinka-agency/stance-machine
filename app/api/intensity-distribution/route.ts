import { NextRequest, NextResponse } from 'next/server'
import { getIntensityDistribution } from '@/lib/hot-takes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined

  const distribution = await getIntensityDistribution(category)

  return NextResponse.json(distribution)
}
