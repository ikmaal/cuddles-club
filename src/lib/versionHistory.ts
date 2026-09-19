export type ReleaseNote = {
  date: string
  version: string
  title: string
  highlights: string[]
}

export const APP_META = {
  name: 'Cuddles Club',
  version: '1.8.0',
  /** ISO date of the latest release shown in Settings */
  lastUpdated: '2026-09-19',
} as const

/** Newest first — update when you ship meaningful changes */
export const RELEASE_HISTORY: ReleaseNote[] = [
  {
    date: '2026-09-19',
    version: '1.8.0',
    title: 'Home Activities polish',
    highlights: [
      'Photobooth card sizing and spacing on small screens',
      'Listening cards aligned to the photobooth height',
      'Smoother horizontal scroll on Activities',
    ],
  },
  {
    date: '2026-09-18',
    version: '1.7.0',
    title: 'Listening & Noms',
    highlights: [
      'Redesigned Spotify activity cards with playback progress',
      'Manual location for Noms and refreshed place overview',
      'Activities row scrolls sideways on narrow phones',
    ],
  },
  {
    date: '2026-09-17',
    version: '1.6.0',
    title: 'Polaroid scenery',
    highlights: [
      'Editable home Polaroid backdrop with stickers',
      'Paste, resize, and rotate scenery from Display settings',
      'Days together and Papernotes styling on home',
    ],
  },
  {
    date: '2026-09-14',
    version: '1.5.0',
    title: 'Study reminders',
    highlights: [
      'Deadline push notifications in Settings',
      'Test notification and reminder scheduling',
      'Study, Poop tracker, and Noms refinements',
    ],
  },
  {
    date: '2026-08-31',
    version: '1.4.0',
    title: 'Noms refresh',
    highlights: [
      'Cleaner place ratings detail layout',
      'Streamlined add-photo flow on place pages',
    ],
  },
]

export function formatReleaseDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}
