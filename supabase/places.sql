-- Shared food places journal for Cuddles Club.
-- Run once in Supabase SQL Editor.

create table if not exists public.food_places (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  name text not null,
  status text not null check (status in ('been', 'want')),
  area text not null default '',
  cuisine text not null default '',
  address text not null default '',
  notes text not null default '',
  rating numeric not null default 0,
  lat double precision,
  lng double precision,
  storage_path text,
  visited_at text,
  created_at bigint not null
);

create index if not exists food_places_couple_idx
  on public.food_places (couple_id, status, created_at desc);

alter table public.food_places enable row level security;

drop policy if exists "food_places_all_member" on public.food_places;
create policy "food_places_all_member"
  on public.food_places for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

-- Photos reuse the photostrips bucket under {coupleId}/places/
