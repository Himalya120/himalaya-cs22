-- Run this whole file in Supabase > SQL Editor. Safe to run more than once (keeps existing data).

create table if not exists public.admins (email text primary key);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 60),
  contact_id text not null check (char_length(contact_id) <= 60),
  steam text not null check (char_length(steam) <= 200),
  playtime text not null check (char_length(playtime) <= 20),
  email text check (char_length(email) <= 80),
  team_name text check (char_length(team_name) <= 60),
  note text check (char_length(note) <= 500),
  created_at timestamptz default now()
);
alter table public.registrations add column if not exists status text not null default 'pending' check (status in ('pending','approved','rejected'));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text check (char_length(name) <= 60),
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz default now()
);
alter table public.messages add column if not exists is_read boolean not null default false;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

alter table public.admins enable row level security;
alter table public.registrations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (email = (auth.jwt() ->> 'email'));

-- Registrations: visitors may only insert; admins may read / update (approve, reject) / delete
drop policy if exists "reg insert public" on public.registrations;
drop policy if exists "reg select admin" on public.registrations;
drop policy if exists "reg update admin" on public.registrations;
drop policy if exists "reg delete admin" on public.registrations;
create policy "reg insert public" on public.registrations for insert to anon, authenticated with check (status = 'pending');
create policy "reg select admin"  on public.registrations for select to authenticated using (public.is_admin());
create policy "reg update admin"  on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reg delete admin"  on public.registrations for delete to authenticated using (public.is_admin());

-- Messages: same idea
drop policy if exists "msg insert public" on public.messages;
drop policy if exists "msg select admin" on public.messages;
drop policy if exists "msg update admin" on public.messages;
drop policy if exists "msg delete admin" on public.messages;
create policy "msg insert public" on public.messages for insert to anon, authenticated with check (is_read = false);
create policy "msg select admin"  on public.messages for select to authenticated using (public.is_admin());
create policy "msg update admin"  on public.messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "msg delete admin"  on public.messages for delete to authenticated using (public.is_admin());

-- Add admins (create the same user first in Authentication > Users). Example:
-- insert into public.admins(email) values ('admin@himalaya.admin');
