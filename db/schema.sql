-- db/schema.sql
--
-- Run this once against your Postgres database (Vercel Postgres or Neon
-- both work — see the setup notes in api/_lib/db.ts). It creates every
-- SQL table the app uses, so a fresh setup needs only this file:
-- leaderboard_entries, user_progress, lesson_progress and admin_actions.
-- Everything else (users, reviews, tokens, sessions) lives in Upstash
-- Redis and is untouched.
--
-- Every statement is idempotent (IF NOT EXISTS), so it is safe to re-run.
-- The files in db/migrations/ hold the same definitions for 002 and 003,
-- for databases that were set up before they were folded in here — an
-- existing database does not need to be changed.
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

-- ----------------------------------------------------------------------
-- Course progress — replaces the old `devflow_progress_<userId>`
-- localStorage key. One row per completed module per user; a module is
-- "completed" if a row exists, "not completed" if it doesn't. This is
-- the app's actual core data, so it belongs in the shared database, not
-- a browser that can be cleared or swapped.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- ----------------------------------------------------------------------
-- Per-lesson progress (db/migrations/002_lesson_progress.sql). One level
-- more granular than user_progress: a learner's spot is saved mid-module.
-- A module gets a row in user_progress once every lesson in it is
-- 'complete'. Only 'complete' rows count toward module completion.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id      TEXT NOT NULL,
  module_id    TEXT NOT NULL,
  lesson_id    TEXT NOT NULL,
  step         TEXT NOT NULL CHECK (step IN ('video', 'quiz', 'sandbox', 'complete')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- "Which lessons have I finished in this module?" is the hot read path.
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_module
  ON lesson_progress (user_id, module_id);

-- ----------------------------------------------------------------------
-- Admin audit trail (db/migrations/003_admin_audit_log.sql). One row per
-- destructive admin action, plus AI-rejected reviews (api/moderate-review.ts).
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_actions (
  id SERIAL PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created
  ON admin_actions (created_at DESC);
