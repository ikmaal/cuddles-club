-- Cuddles Club — run this in the Supabase SQL editor (Dashboard → SQL → New query).

-- Couple spaces
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  member_a_name text not null default 'You',
  member_b_name text not null default 'Partner',
  since date,
  home_photo_path text,
  home_photo_updated_at bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('a', 'b')),
  primary key (couple_id, user_id),
  unique (couple_id, slot)
);

create table if not exists public.notes (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  author_slot text not null check (author_slot in ('a', 'b')),
  text text not null,
  created_at bigint not null
);

create table if not exists public.bucket_items (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at bigint not null,
  done_at bigint
);

create table if not exists public.date_ideas (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  text text not null
);

create table if not exists public.countdowns (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  label text not null,
  date date not null,
  repeats_yearly boolean not null default false
);

create table if not exists public.mood_entries (
  couple_id uuid not null references public.couples (id) on delete cascade,
  day text not null,
  mood_a text check (mood_a in ('great', 'good', 'okay', 'low', 'rough')),
  mood_b text check (mood_b in ('great', 'good', 'okay', 'low', 'rough')),
  primary key (couple_id, day)
);

create table if not exists public.daily_answers (
  couple_id uuid not null references public.couples (id) on delete cascade,
  day text not null,
  question text not null,
  answer_a text not null default '',
  answer_b text not null default '',
  answered_at bigint not null,
  primary key (couple_id, day)
);

create table if not exists public.cat_states (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.photostrips (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  storage_path text not null,
  created_at bigint not null
);

create table if not exists public.booth_poses (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  storage_path text not null,
  created_at bigint not null
);

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

-- Helpers
create or replace function public.user_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id
  from public.couple_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.user_couple_slot()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select slot
  from public.couple_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.create_couple_space()
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  new_couple public.couples;
  code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.user_couple_id() is not null then
    raise exception 'Already in a couple space';
  end if;

  loop
    code := public.generate_invite_code();
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;

  insert into public.couples (invite_code)
  values (code)
  returning * into new_couple;

  insert into public.couple_members (couple_id, user_id, slot)
  values (new_couple.id, auth.uid(), 'a');

  insert into public.cat_states (couple_id, state)
  values (
    new_couple.id,
    '{"name":"Mochi","fullness":70,"happiness":80,"energy":75,"cleanliness":85,"sleeping":false,"xp":0,"careYou":0,"carePartner":0,"bestScore":0,"activeCarer":"you","updatedAt":0,"lastPettedAt":0}'::jsonb
  );

  return new_couple;
end;
$$;

create or replace function public.join_couple_space(p_invite_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.couples;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.user_couple_id() is not null then
    raise exception 'Already in a couple space';
  end if;

  select * into target
  from public.couples
  where invite_code = upper(trim(p_invite_code));

  if target.id is null then
    raise exception 'Invalid invite code';
  end if;

  if exists (
    select 1 from public.couple_members
    where couple_id = target.id and slot = 'b'
  ) then
    raise exception 'This couple space is full';
  end if;

  insert into public.couple_members (couple_id, user_id, slot)
  values (target.id, auth.uid(), 'b');

  return target;
end;
$$;

-- Row level security
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.notes enable row level security;
alter table public.bucket_items enable row level security;
alter table public.date_ideas enable row level security;
alter table public.countdowns enable row level security;
alter table public.mood_entries enable row level security;
alter table public.daily_answers enable row level security;
alter table public.cat_states enable row level security;
alter table public.photostrips enable row level security;
alter table public.booth_poses enable row level security;
alter table public.listening_status enable row level security;

create policy "couples_select_member"
  on public.couples for select
  using (id = public.user_couple_id());

create policy "couples_update_member"
  on public.couples for update
  using (id = public.user_couple_id());

create policy "couple_members_select_own"
  on public.couple_members for select
  using (user_id = auth.uid() or couple_id = public.user_couple_id());

create policy "notes_all_member"
  on public.notes for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "bucket_all_member"
  on public.bucket_items for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "ideas_all_member"
  on public.date_ideas for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "countdowns_all_member"
  on public.countdowns for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "moods_all_member"
  on public.mood_entries for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "answers_all_member"
  on public.daily_answers for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "cat_all_member"
  on public.cat_states for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "strips_all_member"
  on public.photostrips for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

create policy "poses_all_member"
  on public.booth_poses for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

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

-- Storage bucket for photostrip images (create bucket named "photostrips" in Dashboard → Storage, set to public)
insert into storage.buckets (id, name, public)
values ('photostrips', 'photostrips', true)
on conflict (id) do nothing;

create policy "photostrips_read"
  on storage.objects for select
  using (bucket_id = 'photostrips');

create policy "photostrips_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'photostrips'
    and (storage.foldername(name))[1] = public.user_couple_id()::text
  );

create policy "photostrips_delete_member"
  on storage.objects for delete
  using (
    bucket_id = 'photostrips'
    and (storage.foldername(name))[1] = public.user_couple_id()::text
  );
