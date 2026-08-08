-- Add Spotify listening sync for existing Cuddles Club projects.
-- Run once in Supabase SQL Editor if you already applied schema.sql earlier.

create table if not exists public.listening_status (
  couple_id uuid not null references public.couples (id) on delete cascade,
  slot text not null check (slot in ('a', 'b')),
  spotify_user_id text,
  display_name text not null default '',
  track_id text,
  track_name text,
  artists text,
  album_name text,
  album_art_url text,
  track_url text,
  is_playing boolean not null default false,
  updated_at bigint not null,
  primary key (couple_id, slot)
);

alter table public.listening_status enable row level security;

drop policy if exists "listening_select_member" on public.listening_status;
drop policy if exists "listening_insert_own" on public.listening_status;
drop policy if exists "listening_update_own" on public.listening_status;
drop policy if exists "listening_delete_own" on public.listening_status;

create policy "listening_select_member"
  on public.listening_status for select
  using (couple_id = public.user_couple_id());

create policy "listening_insert_own"
  on public.listening_status for insert
  with check (
    couple_id = public.user_couple_id()
    and slot = public.user_couple_slot()
  );

create policy "listening_update_own"
  on public.listening_status for update
  using (
    couple_id = public.user_couple_id()
    and slot = public.user_couple_slot()
  )
  with check (
    couple_id = public.user_couple_id()
    and slot = public.user_couple_slot()
  );

create policy "listening_delete_own"
  on public.listening_status for delete
  using (
    couple_id = public.user_couple_id()
    and slot = public.user_couple_slot()
  );
