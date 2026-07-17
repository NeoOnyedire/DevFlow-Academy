// api/_lib/db.ts
//
// Postgres client for the leaderboard feature — the one part of this
// app that's genuinely relational (rank users by summed points, grouped
// by week). Everything else (users, reviews, tokens) stays in Upstash
// Redis; this file doesn't touch or replace any of that.
//
// ---- One-time setup ----
//   1. In your Vercel project: Storage tab -> Create Database -> Postgres
//      (or use Neon directly at https://neon.tech and paste its connection
//      string in — both work with @vercel/postgres).
//   2. Vercel automatically sets POSTGRES_URL (and friends) as environment
//      variables on your project once the database is connected — nothing
//      to copy by hand for Production/Preview.
//   3. For local dev, run `vercel env pull .env.local` to copy those same
//      variables down, or paste your Neon connection string into
//      .env.local as POSTGRES_URL yourself.
//   4. Run the SQL in db/schema.sql once against that database (Vercel's
//      dashboard has a "Query" tab that runs raw SQL directly).
//
// The `sql` tagged-template export below is from @vercel/postgres — it
// parameterizes every value automatically, so there's no manual escaping
// or injection risk anywhere this is used.

import { sql } from '@vercel/postgres'

export { sql }
