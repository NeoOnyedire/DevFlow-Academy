-- db/schema.sql
--
-- Run this once against your Postgres database (Vercel Postgres or Neon
-- both work — see the setup notes in api/_lib/db.ts). This is the only
-- SQL table in the project; everything else (users, reviews, tokens)
-- stays in Upstash Redis and is untouched.
--
-- Why a real table instead of another Redis key:
--   The leaderboard needs "sum points per user, ranked, for a given
--   week" — that's a GROUP BY + RANK() query, which Redis's flat
--   key-value model can't express directly. Postgres can.

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  week_key TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "top scores for this week" queries.
CREATE INDEX IF NOT EXISTS idx_leaderboard_week
  ON leaderboard_entries (week_key, points DESC);

-- One entry per user per challenge — a duplicate "complete challenge"
-- click can't double-count points (see the ON CONFLICT in leaderboard.ts).
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_challenge
  ON leaderboard_entries (user_id, challenge_id);
