# Deadline push notifications

Study Together can send phone notifications when assignment due dates are near, even when the app is closed.

## 1. Run SQL

In Supabase **SQL Editor**, run:

1. `supabase/academics.sql` (if not already)
2. `supabase/push_notifications.sql`

## 2. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Save the **public** and **private** keys.

## 3. Frontend env (GitHub Pages + local `.env`)

```env
VITE_VAPID_PUBLIC_KEY=your-public-key
```

Add the same value to GitHub Actions secret `VITE_VAPID_PUBLIC_KEY`.

## 4. Supabase Edge Function secrets

In Supabase **Project Settings → Edge Functions → Secrets**, set:

| Secret | Value |
|--------|--------|
| `VAPID_PUBLIC_KEY` | Same public key as above |
| `VAPID_PRIVATE_KEY` | Private key from web-push |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `PUBLIC_APP_URL` | `https://YOUR_USERNAME.github.io/cuddles-club/` |
| `CRON_SECRET` | Optional random string for manual testing |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions.

## 5. Deploy the function

Install [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, then:

```bash
supabase functions deploy deadline-reminders --no-verify-jwt
```

## 6. Schedule daily checks

Run the SQL in [`supabase/deadline_reminders_cron.sql`](deadline_reminders_cron.sql) in **Supabase Dashboard → SQL Editor**:

1. Open **Project Settings → API** and copy your **service_role** key (Reveal).
2. Paste it over `PASTE_SERVICE_ROLE_KEY_HERE` in the SQL file.
3. Click **Run**.

This creates a cron job named `deadline-reminders-daily` that POSTs to your Edge Function every day at **01:00 UTC** (9:00 AM Singapore).

Reminders are sent **3 days before**, **1 day before**, and **on the due date** for assignments you own (your module slot).

Verify under **Integrations → Cron** or run:

```sql
select jobname, schedule, active from cron.job where jobname = 'deadline-reminders-daily';
```

## 7. Enable on your phone

1. Sign in on the **Us** tab (cloud sync required)
2. Open **Study Together**
3. Tap **Enable deadline reminders** and allow notifications
4. Add Cuddles Club to your **Home Screen** (required for reliable iOS push)

## Manual test

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/deadline-reminders" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```
