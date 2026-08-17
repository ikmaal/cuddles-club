-- Academics modules & materials for Cuddles Club.
-- Run once in Supabase SQL Editor.

create table if not exists public.academic_modules (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_slot text not null check (owner_slot in ('a', 'b')),
  code text not null default '',
  title text not null,
  term text not null default '',
  created_at bigint not null
);

create table if not exists public.academic_materials (
  id text primary key,
  couple_id uuid not null references public.couples (id) on delete cascade,
  module_id text not null references public.academic_modules (id) on delete cascade,
  kind text not null check (kind in ('lecture', 'tutorial', 'assignment', 'notes')),
  title text not null,
  due_date text,
  notes text not null default '',
  file_name text,
  storage_path text,
  done boolean not null default false,
  extracted_text text not null default '',
  created_at bigint not null
);

create index if not exists academic_modules_couple_idx
  on public.academic_modules (couple_id, owner_slot);

create index if not exists academic_materials_module_idx
  on public.academic_materials (module_id);

alter table public.academic_modules enable row level security;
alter table public.academic_materials enable row level security;

drop policy if exists "academic_modules_all_member" on public.academic_modules;
create policy "academic_modules_all_member"
  on public.academic_modules for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

drop policy if exists "academic_materials_all_member" on public.academic_materials;
create policy "academic_materials_all_member"
  on public.academic_materials for all
  using (couple_id = public.user_couple_id())
  with check (couple_id = public.user_couple_id());

-- Reuse the existing photostrips bucket with path prefix {coupleId}/academics/
-- No new bucket required.

-- If you already ran an older academics.sql, also run:
-- alter table public.academic_materials
--   add column if not exists extracted_text text not null default '';
