-- Run in Supabase > SQL Editor (after schema.sql). Safe to run more than once.
-- Creates: videos, timers, channel posts + the "channel" image bucket.

-- ---------- Videos ----------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'youtube' check (platform in ('youtube','aparat')),
  video_id text not null check (char_length(video_id) <= 40),
  url text not null check (char_length(url) <= 300),
  title text not null check (char_length(title) <= 120),
  kind text not null default 'long' check (kind in ('long','short')),
  featured boolean not null default false,
  created_at timestamptz default now()
);
alter table public.videos enable row level security;
drop policy if exists "videos read" on public.videos;
drop policy if exists "videos insert admin" on public.videos;
drop policy if exists "videos update admin" on public.videos;
drop policy if exists "videos delete admin" on public.videos;
create policy "videos read" on public.videos for select to anon, authenticated using (true);
create policy "videos insert admin" on public.videos for insert to authenticated with check (public.is_admin());
create policy "videos update admin" on public.videos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "videos delete admin" on public.videos for delete to authenticated using (public.is_admin());

-- ---------- Countdown timers (end time is computed by the server when saved) ----------
create table if not exists public.timers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 80),
  finish_text text check (char_length(finish_text) <= 80),
  duration_seconds int not null check (duration_seconds between 10 and 604800),
  ends_at timestamptz not null default now(),
  created_at timestamptz default now()
);
create or replace function public.timers_set_end() returns trigger language plpgsql as $$
begin new.ends_at := now() + make_interval(secs => new.duration_seconds); return new; end $$;
drop trigger if exists timers_set_end on public.timers;
create trigger timers_set_end before insert on public.timers for each row execute function public.timers_set_end();

create or replace function public.server_now() returns timestamptz language sql stable as $$ select now() $$;
grant execute on function public.server_now() to anon, authenticated;

alter table public.timers enable row level security;
drop policy if exists "timers read" on public.timers;
drop policy if exists "timers insert admin" on public.timers;
drop policy if exists "timers delete admin" on public.timers;
create policy "timers read" on public.timers for select to anon, authenticated using (true);
create policy "timers insert admin" on public.timers for insert to authenticated with check (public.is_admin());
create policy "timers delete admin" on public.timers for delete to authenticated using (public.is_admin());

-- ---------- Channel posts (image + text, Telegram-channel style) ----------
create table if not exists public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  body text check (char_length(body) <= 1000),
  image_path text check (char_length(image_path) <= 200),
  created_at timestamptz default now(),
  check (body is not null or image_path is not null)
);
alter table public.channel_posts enable row level security;
drop policy if exists "channel read" on public.channel_posts;
drop policy if exists "channel insert admin" on public.channel_posts;
drop policy if exists "channel delete admin" on public.channel_posts;
create policy "channel read" on public.channel_posts for select to anon, authenticated using (true);
create policy "channel insert admin" on public.channel_posts for insert to authenticated with check (public.is_admin());
create policy "channel delete admin" on public.channel_posts for delete to authenticated using (public.is_admin());

-- ---------- Image storage bucket (public read, admin upload, 5 MB per file) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('channel', 'channel', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "channel files select admin" on storage.objects;
drop policy if exists "channel files insert admin" on storage.objects;
drop policy if exists "channel files delete admin" on storage.objects;
create policy "channel files select admin" on storage.objects for select to authenticated using (bucket_id = 'channel' and public.is_admin());
create policy "channel files insert admin" on storage.objects for insert to authenticated with check (bucket_id = 'channel' and public.is_admin());
create policy "channel files delete admin" on storage.objects for delete to authenticated using (bucket_id = 'channel' and public.is_admin());

notify pgrst, 'reload schema';
