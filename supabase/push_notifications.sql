-- Web Push subscriptions + deadline reminder log for Study Together.
-- Run once in Supabase SQL Editor after academics.sql.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_slot text not null check (member_slot in ('a', 'b')),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_couple_slot_idx
  on public.push_subscriptions (couple_id, member_slot);

create table if not exists public.deadline_notification_sent (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  material_id text not null references public.academic_materials (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_key text not null check (reminder_key in ('due_3', 'due_1', 'due_0')),
  sent_at timestamptz not null default now(),
  unique (material_id, user_id, reminder_key)
);

create index if not exists deadline_notification_sent_couple_idx
  on public.deadline_notification_sent (couple_id, sent_at desc);

alter table public.push_subscriptions enable row level security;
alter table public.deadline_notification_sent enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (user_id = auth.uid() and couple_id = public.user_couple_id());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid() and couple_id = public.user_couple_id());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (user_id = auth.uid() and couple_id = public.user_couple_id())
  with check (user_id = auth.uid() and couple_id = public.user_couple_id());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (user_id = auth.uid() and couple_id = public.user_couple_id());

-- Reminder log is written only by the service role (Edge Function).
drop policy if exists "deadline_notification_sent_select_own" on public.deadline_notification_sent;
create policy "deadline_notification_sent_select_own"
  on public.deadline_notification_sent for select
  using (user_id = auth.uid() and couple_id = public.user_couple_id());

-- Setup checklist (manual):
-- 1. Generate VAPID keys: npx web-push generate-vapid-keys
-- 2. Add VITE_VAPID_PUBLIC_KEY to .env and GitHub Actions secrets
-- 3. Set Supabase Edge Function secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
-- 4. Deploy: supabase functions deploy deadline-reminders --no-verify-jwt
-- 5. Schedule daily (9am Singapore = 01:00 UTC): Dashboard → Edge Functions → deadline-reminders → Cron
