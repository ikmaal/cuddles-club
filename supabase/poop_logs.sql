-- Poop Tracker logs for Cuddles Club.
-- Run once in Supabase SQL Editor.

create table if not exists public.poop_logs (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_slot text not null check (owner_slot in ('a', 'b')),
  created_at bigint not null
);

create index if not exists poop_logs_couple_idx
  on public.poop_logs (couple_id, created_at desc);

alter table public.poop_logs enable row level security;

drop policy if exists "poop_logs_all_member" on public.poop_logs;
create policy "poop_logs_all_member"
  on public.poop_logs for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

-- Live updates between partners (safe to run once; ignore if already added).
do $$
begin
  alter publication supabase_realtime add table public.poop_logs;
exception
  when duplicate_object then null;
end $$;
