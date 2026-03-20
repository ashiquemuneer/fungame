# FunGame

An internal quiz game app for office events. Hosts can create question sets, launch live sessions, collect answers from colleagues, track the leaderboard, and announce the winner.

The current build is intentionally set up in `mock mode` so you can use and polish the product flow before wiring it to Supabase.

## Stack

- `React + Vite + TypeScript`
- `Tailwind CSS v4`
- `Supabase` ready schema and RLS migration in `supabase/migrations`
- `Cloudflare Pages` friendly SPA build

## Run locally

```bash
npm install
npm run dev
```

Open the app and use the seeded room code `PLAY42` to test the player flow.

## Project Structure

```text
src/
  components/
  lib/
  pages/
  state/
  types/
supabase/
  migrations/
```

## Supabase Setup

1. Create a free Supabase project.
2. Run the SQL in [supabase/migrations/001_initial_schema.sql](/Users/ashiq/Documents/fungame/supabase/migrations/001_initial_schema.sql).
3. Copy `.env.example` to `.env`.
4. Add your Supabase URL and anon key.

## Current App Capabilities

- Host dashboard with reusable games
- Question builder for MCQ, True/False, and short text
- Live session creation with room code
- Lobby, join, answer, leaderboard, and winner flow
- Local persistence through `localStorage`
- Supabase schema, RPC, and RLS starter

## Next Build Steps

1. Replace mock store actions with Supabase reads and writes.
2. Add anonymous player auth through Supabase Auth.
3. Add Supabase Realtime subscriptions for live updates.
4. Deploy to Cloudflare Pages.
