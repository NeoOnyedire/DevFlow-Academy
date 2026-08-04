-- db/migrations/003_admin_audit_log.sql
--
-- Every destructive admin action (wiping someone's progress, deleting a
-- review, clearing a leaderboard week) gets one row here — a paper trail
-- for the one account on earth allowed to do these things.
--
-- Run this once against the same Postgres database as db/schema.sql.

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