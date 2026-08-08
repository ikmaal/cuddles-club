-- Pose reference gallery for existing Cuddles Club projects.
-- Run once in Supabase SQL Editor.

create table if not exists public.booth_poses (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  storage_path text not null,
  created_at bigint not null
);

alter table public.booth_poses enable row level security;

drop policy if exists "poses_all_member" on public.booth_poses;

create policy "poses_all_member"
  on public.booth_poses for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());
