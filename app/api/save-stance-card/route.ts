import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { saveStanceCard, stitchSessionToUser } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { stance_hash, session_id } = await request.json()

    if (!stance_hash) {
      return NextResponse.json(
        { error: 'stance_hash is required' },
        { status: 400 }
      )
    }

    // Stitch anonymous votes from this session to the user
    if (session_id) {
      await stitchSessionToUser(session_id, session.user.id)
    }

    // Save the stance card to the user's collection
    await saveStanceCard(session.user.id, stance_hash)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Save stance card error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
