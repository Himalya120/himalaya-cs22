-- Run in Supabase > SQL Editor (after schema.sql). Safe to run more than once.

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_a text not null check (char_length(team_a) <= 40),
  team_b text not null check (char_length(team_b) <= 40),
  match_time timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','finished')),
  winner text check (winner in ('a','b')),
  streams jsonb not null default '[]'::jsonb,   -- [{ "title": "...", "url": "https://..." }]
  created_at timestamptz default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  choice text not null check (choice in ('a','b')),
  voter_key text not null check (char_length(voter_key) <= 64),
  created_at timestamptz default now(),
  unique (match_id, voter_key)
);

alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- Matches: everyone can read, only admins can write
drop policy if exists "match read" on public.matches;
drop policy if exists "match insert admin" on public.matches;
drop policy if exists "match update admin" on public.matches;
drop policy if exists "match delete admin" on public.matches;
create policy "match read" on public.matches for select to anon, authenticated using (true);
create policy "match insert admin" on public.matches for insert to authenticated with check (public.is_admin());
create policy "match update admin" on public.matches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "match delete admin" on public.matches for delete to authenticated using (public.is_admin());

-- Predictions: anyone may add one while the match is "upcoming"; only admins read/delete raw rows
drop policy if exists "pred insert" on public.predictions;
drop policy if exists "pred select admin" on public.predictions;
drop policy if exists "pred delete admin" on public.predictions;
create policy "pred insert" on public.predictions for insert to anon, authenticated
  with check (exists (select 1 from public.matches m where m.id = match_id and m.status = 'upcoming'));
create policy "pred select admin" on public.predictions for select to authenticated using (public.is_admin());
create policy "pred delete admin" on public.predictions for delete to authenticated using (public.is_admin());

-- Public vote totals (no personal data)
create or replace function public.match_vote_counts()
returns table (match_id uuid, a_count bigint, b_count bigint)
language sql stable security definer set search_path = public as $$
  select match_id, count(*) filter (where choice = 'a'), count(*) filter (where choice = 'b')
  from public.predictions group by match_id;
$$;
grant execute on function public.match_vote_counts() to anon, authenticated;

notify pgrst, 'reload schema';
