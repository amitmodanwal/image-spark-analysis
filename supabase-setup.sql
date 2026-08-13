-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  title text,
  image_urls text[] not null default '{}',
  analysis jsonb not null,
  confidence numeric
);

grant select, insert, update, delete on public.analyses to authenticated;
grant all on public.analyses to service_role;

alter table public.analyses enable row level security;

drop policy if exists "Users can read own analyses" on public.analyses;
create policy "Users can read own analyses" on public.analyses
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own analyses" on public.analyses;
create policy "Users can insert own analyses" on public.analyses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own analyses" on public.analyses;
create policy "Users can delete own analyses" on public.analyses
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);
