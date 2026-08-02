# Cuddles Club

A mobile-first app for two people. The home screen is a hub of small apps you open like tiles, so everything you do together lives in one place.

## Live app

https://ikmaal.github.io/cuddles-club/

## What's inside

The home hub has a searchable service grid, a spotlight rail that picks up where you left off, and a summary of the two of you. Each tile opens its own screen:

| Tile | What it does |
| --- | --- |
| Our Cat | Raise Mochi together: feed, brush, nap, pet, and a catch-the-feather mini-game with a shared bond level |
| Love Notes | Leave each other short messages, tagged by who wrote them |
| Bucket List | A shared checklist of things to do together, with progress |
| Date Spin | Spin a wheel of date ideas when neither of you can decide |
| Countdowns | Days until birthdays, trips, and anniversaries, with yearly repeats |
| Daily Q | One rotating question a day, answered by both of you |
| Mood | A quick check-in for each of you, plus a seven-day view |

The **Us** tab holds your names, the day you got together, and your running totals.

Everything is stored in the browser's local storage — nothing leaves the device.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173/cuddles-club/`).

## Deploy

Pushes to `main` build the app and publish it to the `gh-pages` branch.

In the repo: **Settings → Pages → Build and deployment**
- Source: **Deploy from a branch**
- Branch: **gh-pages** / **/** (root)

Live URL: https://ikmaal.github.io/cuddles-club/
