-- ─────────────────────────────────────────────────────────────
-- Portfolio AI — OPTIONAL Supabase schema
-- Only needed if you set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
-- Run in: Supabase Dashboard → SQL Editor → New query. Safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- Every chat turn, with token usage for cost tracking.
create table if not exists public.conversations (
  id                 uuid        primary key default gen_random_uuid(),
  session_id         text        not null,
  question           text        not null,
  answer             text        not null,
  model              text,
  input_tokens       integer,
  output_tokens      integer,
  cache_read_tokens  integer,
  cache_write_tokens integer,
  cost_usd           numeric(10, 6),
  created_at         timestamptz not null default now()
);
create index if not exists conversations_session_idx on public.conversations (session_id);
create index if not exists conversations_created_idx on public.conversations (created_at desc);

-- Contact details a visitor chose to share with the assistant.
create table if not exists public.portfolio_leads (
  id                   uuid        primary key default gen_random_uuid(),
  session_id           text,
  name                 text,
  email                text        not null,
  company              text,
  conversation_summary text,
  created_at           timestamptz not null default now()
);
create index if not exists leads_created_idx on public.portfolio_leads (created_at desc);

-- RLS on, no policies: anon/authenticated keys get nothing.
-- Only the server-side service role key (which bypasses RLS) can read/write.
alter table public.conversations   enable row level security;
alter table public.portfolio_leads enable row level security;
revoke all on public.conversations   from anon, authenticated;
revoke all on public.portfolio_leads from anon, authenticated;

-- Optional retention (privacy): delete chat logs older than 180 days.
-- delete from public.conversations where created_at < now() - interval '180 days';
