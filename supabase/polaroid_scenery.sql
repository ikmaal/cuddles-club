-- Shared Polaroid scenery stickers (JSON + storage paths in photostrip bucket).
-- Run once in Supabase SQL Editor.

alter table public.couples
  add column if not exists polaroid_scenery jsonb not null default '[]'::jsonb;
