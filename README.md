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
| Places | Shared food journal — Been / Want, list + map |

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
   - `VITE_SPOTIFY_CLIENT_ID` (optional — enables Spotify listening on Home)

## Spotify setup (optional)

Shows what each of you is listening to under **Activities**.

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add these **Redirect URIs** (exact match):
   - `http://127.0.0.1:5173/cuddles-club/` (local — Spotify rejects `localhost`)
   - `https://ikmaal.github.io/cuddles-club/`
3. Copy the **Client ID** into `.env` as `VITE_SPOTIFY_CLIENT_ID` (and the same GitHub Actions secret for deploy).
4. In Supabase SQL Editor, run [`supabase/listening_status.sql`](supabase/listening_status.sql) if your project already had the older schema.
5. Also run [`supabase/home_photo.sql`](supabase/home_photo.sql) so the shared home photo can sync between both phones.
6. Run [`supabase/booth_poses.sql`](supabase/booth_poses.sql) for the shared photobooth pose gallery.
7. Run [`supabase/academics.sql`](supabase/academics.sql) for the Academics modules & materials sync.
8. Run [`supabase/places.sql`](supabase/places.sql) for the shared Places food journal.
9. On the **Us** tab, connect Spotify on each phone (and stay signed into cloud sync so your partner can see you).

For local testing, open the app at `http://127.0.0.1:5173/cuddles-club/` (or tap Connect from `localhost` — the app hops to `127.0.0.1` automatically).

No client secret is needed — the app uses Authorization Code + PKCE.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
