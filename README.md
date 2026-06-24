# Sanctuary — Waitlist

A cozy waitlist landing page for **Sanctuary**, a game about caring for rescued animals. Built with Next.js (App Router) + Supabase, ready to deploy on Vercel.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The page works immediately — but signups need Supabase (below). Until then, submitting shows a friendly "not connected yet" message.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the migration in `supabase/migrations/0001_waitlist.sql` to create the `waitlist` table.
3. Copy your keys from **Project Settings → API**:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Restart `npm run dev`. Signups now save to the `waitlist` table.

> The **service role key is secret**. It's used only in the server-side Server Action (`app/actions.ts`) and never reaches the browser. RLS is enabled on the table with no public policies, so the anon key can't read or write — only the server can.

## Deploy to Vercel

```bash
npm i -g vercel   # if you don't have the CLI
vercel            # link & deploy a preview
```

Add the two env vars in the Vercel dashboard (**Settings → Environment Variables**) or via:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel --prod
```

## Project layout

| Path                                   | Purpose                                  |
| -------------------------------------- | ---------------------------------------- |
| `app/page.tsx`                         | Landing page shell                       |
| `app/time-of-day-hero.tsx`             | Time-of-day adaptive hero + waitlist form|
| `app/actions.ts`                       | Server Action — validates & inserts email|
| `lib/supabase.ts`                      | Server-side Supabase client              |
| `app/globals.css`                      | Scene + theme styles                      |
| `supabase/migrations/0001_waitlist.sql`| Database schema                          |

## Viewing signups

In the Supabase dashboard: **Table Editor → waitlist**.
