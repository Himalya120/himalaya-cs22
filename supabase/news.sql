-- Run in Supabase > SQL Editor (after schema.sql). Safe to run more than once.

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 80),
  body text not null check (char_length(body) <= 300),
  created_at timestamptz default now()
);
alter table public.news enable row level security;

drop policy if exists "news read" on public.news;
drop policy if exists "news insert admin" on public.news;
drop policy if exists "news update admin" on public.news;
drop policy if exists "news delete admin" on public.news;
create policy "news read" on public.news for select to anon, authenticated using (true);
create policy "news insert admin" on public.news for insert to authenticated with check (public.is_admin());
create policy "news update admin" on public.news for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "news delete admin" on public.news for delete to authenticated using (public.is_admin());

notify pgrst, 'reload schema';
