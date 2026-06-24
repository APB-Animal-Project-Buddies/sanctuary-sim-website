-- Waitlist table for the Sanctuary Game.
-- Run this in the Supabase SQL Editor (or via the Supabase CLI) before deploying.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- Lock the table down. Row Level Security is on and no policies are added,
-- so the anon/public key cannot read or write. Inserts happen only through
-- the server-side Server Action using the service role key, which bypasses RLS.
alter table public.waitlist enable row level security;

-- Case-insensitive uniqueness so "Foo@x.com" and "foo@x.com" don't both get in.
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));
