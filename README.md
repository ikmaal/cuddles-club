# Cuddles Club

A mobile-first app for two people. The home screen is a hub of small apps you open like tiles, so everything you do together lives in one place.

## Live app

https://ikmaal.github.io/cuddles-club/

## What's inside

The home hub has a service grid, a spotlight rail, and a summary of the two of you. Each tile opens its own screen:

| Tile | What it does |
| --- | --- |
| Our Cat | Raise Mochi together: feed, brush, nap, pet, and a catch-the-feather mini-game |
| Photobooth | Take 4-shot strips, pick a design, and save them to your album |
| Love Notes | Leave each other short messages |
| Bucket List | A shared checklist of things to do together |
| Date Spin | Spin a wheel of date ideas |
| Countdowns | Days until birthdays, trips, and anniversaries |
| Daily Q | One rotating question a day, answered by both of you |
| Mood | A quick check-in for each of you |

The **Us** tab holds your names, cloud sync, and couple settings.

## Storage

- **Local only** — works out of the box with browser storage (no setup).
- **Supabase (recommended for two phones)** — sign in on the **Us** tab, create a couple space, and share the invite code with your partner.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the full script in [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Providers**, enable Email and turn off “Confirm email” for quick testing (optional).
4. Copy your project URL and anon key from **Project Settings → API**.
5. Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

6. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. For GitHub Pages, add the same values as repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
