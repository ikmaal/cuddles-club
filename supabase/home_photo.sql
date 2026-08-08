-- Shared home photo for existing Cuddles Club projects.
-- Run once in Supabase SQL Editor.

alter table public.couples
  add column if not exists home_photo_path text;

alter table public.couples
  add column if not exists home_photo_updated_at bigint;
