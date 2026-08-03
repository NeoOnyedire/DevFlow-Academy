-- db/migrations/002_lesson_progress.sql
--
-- Adds per-lesson progress, one level more granular than the existing
-- user_progress table (which tracks whole-module completion). A module
-- is now made of several short lessons (snippet -> quiz -> sandbox), and
-- we want a learner's spot saved mid-module, not just "done" / "not done".
--
-- Run this once against the same Postgres database as db/schema.sql.
-- user_progress itself is untouched — a module still gets a row there
-- (via api/progress.ts) once every lesson inside it is complete, so
-- nothing that already reads user_progress needs to change.

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id      TEXT NOT NULL,
  module_id    TEXT NOT NULL,
  lesson_id    TEXT NOT NULL,
  -- Which step of the lesson the learner has reached. 'complete' means
  -- they watched the snippet, passed the quiz, and finished the sandbox
  -- task — the only state that counts toward module completion.
  step         TEXT NOT NULL CHECK (step IN ('video', 'quiz', 'sandbox', 'complete')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- "Which lessons have I finished in this module?" is the hot read path
-- (runs every time the curriculum panel opens).
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_module
  ON lesson_progress (user_id, module_id);
