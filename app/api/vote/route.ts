import { NextRequest, NextResponse } from 'next/server'
import { createVote, updateVote, getTakeStats } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { take_id, stance, reason_tags, explanation, session_id } = body

    // Validation
    if (!take_id || !stance) {
      return NextResponse.json(
        { error: 'take_id and stance are required' },
        { status: 400 }
      )
    }

    if (stance !== 'agree' && stance !== 'disagree') {
      return NextResponse.json(
        { error: 'stance must be "agree" or "disagree"' },
        { status: 400 }
      )
    }

    // Check if user is authenticated — if so, attach user_id to vote
    const session = await auth()
    const userId = session?.user?.id

    // Create vote
    const vote = await createVote({
      takeId: take_id,
      stance,
      reasonTags: reason_tags,
      explanation,
      sessionId: session_id,
      userId,
    })

    // Get updated aggregate stats
    const stats = await getTakeStats(take_id)

    return NextResponse.json({
      vote_id: vote.id,
      aggregate: {
        total_votes: stats?.total_votes || 1,
        agree_percentage: stats?.agree_percentage || (stance === 'agree' ? 100 : 0),
        top_reason: stats?.top_reason || null,
      },
    })
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { vote_id, reason_tags, explanation } = await request.json()

    if (!vote_id) {
      return NextResponse.json(
        { error: 'vote_id is required' },
        { status: 400 }
      )
    }

    await updateVote(vote_id, {
      reasonTags: reason_tags,
      explanation,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Vote PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
