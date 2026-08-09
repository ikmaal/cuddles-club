-- Person profile cards for Us tab (details + avatar paths).
-- Run in Supabase SQL editor if your project already exists.

alter table public.couples
  add column if not exists member_a_photo_path text;

alter table public.couples
  add column if not exists member_b_photo_path text;

alter table public.couples
  add column if not exists member_a_details jsonb not null default '{}'::jsonb;

alter table public.couples
  add column if not exists member_b_details jsonb not null default '{}'::jsonb;
