-- Stance Machine Database Schema
-- Run this in Neon console to set up the database

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  take_id VARCHAR(12) NOT NULL,
  stance VARCHAR(10) NOT NULL CHECK (stance IN ('agree', 'disagree')),
  reason_tags TEXT[],
  explanation TEXT CHECK (length(explanation) <= 280),
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_take_stance ON votes(take_id, stance);
CREATE INDEX IF NOT EXISTS idx_reason_tags ON votes USING GIN(reason_tags);
CREATE INDEX IF NOT EXISTS idx_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON votes(created_at);

-- Materialized view for aggregate stats
CREATE MATERIALIZED VIEW IF NOT EXISTS take_stats AS
SELECT
  take_id,
  COUNT(*) as total_votes,
  ROUND(100.0 * SUM(CASE WHEN stance = 'agree' THEN 1 ELSE 0 END) / COUNT(*), 1) as agree_percentage,
  (
    SELECT unnest(reason_tags) as tag
    FROM votes v2
    WHERE v2.take_id = votes.take_id AND reason_tags IS NOT NULL
    GROUP BY tag
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as top_reason
FROM votes
GROUP BY take_id;

-- Unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_take_stats_take_id ON take_stats(take_id);

-- Optional: Refresh materialized view periodically (run via cron or manually)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY take_stats;
