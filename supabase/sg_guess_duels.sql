-- Live 1v1 SG Guess duels (sync via Realtime). Run once in Supabase SQL Editor.

create table if not exists public.sg_guess_duels (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  status text not null default 'lobby'
    check (status in ('lobby', 'loading', 'playing', 'reveal', 'summary', 'aborted')),
  round_index int not null default -1,
  host_slot text not null check (host_slot in ('a', 'b')),
  ready_a boolean not null default false,
  ready_b boolean not null default false,
  guess_deadline_at timestamptz,
  answer_lat double precision,
  answer_lng double precision,
  pano_id text,
  start_heading double precision,
  guess_a_lat double precision,
  guess_a_lng double precision,
  guess_b_lat double precision,
  guess_b_lng double precision,
  score_a int not null default 0,
  score_b int not null default 0,
  last_round jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sg_guess_duels_couple_active_idx
  on public.sg_guess_duels (couple_id)
  where status not in ('summary', 'aborted');

alter table public.sg_guess_duels enable row level security;

drop policy if exists "sg_duel_select_member" on public.sg_guess_duels;
drop policy if exists "sg_duel_insert_member" on public.sg_guess_duels;
drop policy if exists "sg_duel_update_member" on public.sg_guess_duels;
drop policy if exists "sg_duel_delete_member" on public.sg_guess_duels;

create policy "sg_duel_select_member"
  on public.sg_guess_duels for select
  using (couple_id = public.user_couple_id());

create policy "sg_duel_insert_member"
  on public.sg_guess_duels for insert
  with check (
    couple_id = public.user_couple_id()
    and host_slot = public.user_couple_slot()
  );

create policy "sg_duel_update_member"
  on public.sg_guess_duels for update
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "sg_duel_delete_member"
  on public.sg_guess_duels for delete
  using (couple_id = public.user_couple_id());

-- Realtime: Dashboard → Database → Replication, or:
-- alter publication supabase_realtime add table public.sg_guess_duels;