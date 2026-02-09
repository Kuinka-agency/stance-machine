/**
 * Database connection and helpers for Neon Postgres
 */

import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazy-load HTTP driver for game routes (cheapest Neon option)
let _sql: NeonQueryFunction<false, false> | null = null

export function getSQL(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    _sql = neon(databaseUrl)
  }
  return _sql
}

// Lazy-load WebSocket Pool for Auth.js adapter (only used during sign-in/sign-up)
let _pool: Pool | null = null

export function getPool(): Pool {
  if (!_pool) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    _pool = new Pool({ connectionString: databaseUrl })
  }
  return _pool
}

/**
 * Database schema setup
 *
 * Run this manually via psql or Neon console:
 *
 * CREATE TABLE IF NOT EXISTS votes (
 *   id SERIAL PRIMARY KEY,
 *   take_id VARCHAR(12) NOT NULL,
 *   stance VARCHAR(10) NOT NULL,
 *   reason_tags TEXT[],
 *   explanation TEXT,
 *   session_id UUID,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX IF NOT EXISTS idx_take_stance ON votes(take_id, stance);
 * CREATE INDEX IF NOT EXISTS idx_reason_tags ON votes USING GIN(reason_tags);
 * CREATE INDEX IF NOT EXISTS idx_session_id ON votes(session_id);
 *
 * CREATE MATERIALIZED VIEW IF NOT EXISTS take_stats AS
 * SELECT
 *   take_id,
 *   COUNT(*) as total_votes,
 *   ROUND(100.0 * SUM(CASE WHEN stance = 'agree' THEN 1 ELSE 0 END) / COUNT(*), 1) as agree_percentage,
 *   (
 *     SELECT unnest(reason_tags) as tag
 *     FROM votes v2
 *     WHERE v2.take_id = votes.take_id
 *     GROUP BY tag
 *     ORDER BY COUNT(*) DESC
 *     LIMIT 1
 *   ) as top_reason
 * FROM votes
 * GROUP BY take_id;
 *
 * CREATE UNIQUE INDEX IF NOT EXISTS idx_take_stats_take_id ON take_stats(take_id);
 *
 * -- Hot takes table
 * CREATE TABLE IF NOT EXISTS hot_takes (
 *   id VARCHAR(12) PRIMARY KEY,
 *   statement TEXT NOT NULL,
 *   category VARCHAR(20) NOT NULL,
 *   slug VARCHAR(80) NOT NULL,
 *   tone TEXT[] NOT NULL DEFAULT '{}',
 *   original_question TEXT NOT NULL,
 *   agree_reasons TEXT[],
 *   disagree_reasons TEXT[],
 *   intensity SMALLINT DEFAULT 3,
 *   intensity_ai_generated SMALLINT,
 *   intensity_last_updated TIMESTAMPTZ,
 *   enrichment_model VARCHAR(50),
 *   enrichment_validated BOOLEAN DEFAULT FALSE,
 *   enrichment_timestamp TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX IF NOT EXISTS idx_hot_takes_category ON hot_takes(category);
 * CREATE INDEX IF NOT EXISTS idx_hot_takes_intensity ON hot_takes(category, intensity);
 * CREATE INDEX IF NOT EXISTS idx_hot_takes_slug ON hot_takes(slug);
 */

export interface Vote {
  id: number
  take_id: string
  stance: 'agree' | 'disagree'
  reason_tags: string[] | null
  explanation: string | null
  session_id: string | null
  user_id: string | null
  created_at: Date
}

export interface TakeStats {
  take_id: string
  total_votes: number
  agree_percentage: number
  top_reason: string | null
}

/**
 * Insert a new vote
 */
export async function createVote(params: {
  takeId: string
  stance: 'agree' | 'disagree'
  reasonTags?: string[]
  explanation?: string
  sessionId?: string
  userId?: string
}): Promise<Vote> {
  const sql = getSQL()
  const result = await sql`
    INSERT INTO votes (take_id, stance, reason_tags, explanation, session_id, user_id)
    VALUES (
      ${params.takeId},
      ${params.stance},
      ${params.reasonTags || null},
      ${params.explanation || null},
      ${params.sessionId || null},
      ${params.userId || null}
    )
    RETURNING *
  `

  return result[0] as Vote
}

/**
 * Get aggregate stats for a hot take
 */
export async function getTakeStats(takeId: string): Promise<TakeStats | null> {
  const sql = getSQL()
  const result = await sql`
    SELECT
      take_id,
      COUNT(*) as total_votes,
      ROUND(100.0 * SUM(CASE WHEN stance = 'agree' THEN 1 ELSE 0 END) / COUNT(*), 1) as agree_percentage,
      (
        SELECT unnest(reason_tags) as tag
        FROM votes v2
        WHERE v2.take_id = ${takeId} AND reason_tags IS NOT NULL
        GROUP BY tag
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) as top_reason
    FROM votes
    WHERE take_id = ${takeId}
    GROUP BY take_id
  `

  if (result.length === 0) {
    return null
  }

  return {
    take_id: result[0].take_id,
    total_votes: Number(result[0].total_votes),
    agree_percentage: Number(result[0].agree_percentage),
    top_reason: result[0].top_reason,
  }
}

/**
 * Get votes for a session
 */
export async function getSessionVotes(sessionId: string): Promise<Vote[]> {
  const sql = getSQL()
  const result = await sql`
    SELECT * FROM votes
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
  `

  return result as Vote[]
}

/**
 * Update an existing vote with context (reason tags + explanation)
 */
export async function updateVote(voteId: number, params: {
  reasonTags?: string[]
  explanation?: string
}): Promise<void> {
  const sql = getSQL()
  await sql`
    UPDATE votes
    SET reason_tags = ${params.reasonTags || null},
        explanation = ${params.explanation || null}
    WHERE id = ${voteId}
  `
}

/**
 * Refresh materialized view (call periodically via cron)
 */
export async function refreshTakeStats(): Promise<void> {
  const sql = getSQL()
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY take_stats`
}

/**
 * Stitch anonymous votes to an authenticated user.
 * Called after sign-in: links all votes from a session_id to a user_id.
 */
export async function stitchSessionToUser(sessionId: string, userId: string): Promise<number> {
  const sql = getSQL()
  const result = await sql`
    UPDATE votes
    SET user_id = ${userId}
    WHERE session_id = ${sessionId} AND user_id IS NULL
  `
  return result.length
}

/**
 * Save a stance card to user's collection
 */
export async function saveStanceCard(userId: string, stanceHash: string): Promise<void> {
  const sql = getSQL()
  await sql`
    INSERT INTO saved_stance_cards (user_id, stance_hash)
    VALUES (${userId}, ${stanceHash})
    ON CONFLICT (user_id, stance_hash) DO NOTHING
  `
}

/**
 * Get all saved stance cards for a user
 */
export async function getUserStanceCards(userId: string): Promise<{ stance_hash: string; saved_at: Date }[]> {
  const sql = getSQL()
  const result = await sql`
    SELECT stance_hash, saved_at
    FROM saved_stance_cards
    WHERE user_id = ${userId}
    ORDER BY saved_at DESC
  `
  return result as { stance_hash: string; saved_at: Date }[]
}
