/** Edit this — your birthday letter shows on the first itinerary slide. */
export const BIRTHDAY_LETTER = {
  banner: 'for you ♡',
  paragraphs: [
    'Happy birthday, my favourite person.',
    'I wrote this little plan because every moment with you feels like something worth celebrating — and this trip is just one more excuse to hold your hand a little longer.',
    'Swipe through the days when you are ready. Until then, read this slowly, like I mean every word.',
    'Love you always. ♡',
  ],
}

export type ItineraryDayId = 'day1' | 'day2' | 'day3'

export type ItineraryDay = {
  id: ItineraryDayId
  dateLabel: string
  weekday: string
  banner: string
  dayNumber: number
  items: string[]
  footnote?: string
}

export const BIRTHDAY_ITINERARY_DAYS: ItineraryDay[] = [
  {
    id: 'day1',
    dateLabel: '15 Nov',
    weekday: 'Sat',
    banner: '15 Nov • Day 1 ♡',
    dayNumber: 1,
    items: [
      'Meet at Woodlands MRT (2.00pm)',
      'Reach JB (3.00pm)',
      'Get matcha from Kota Jail',
      'Check in Airbnb',
      'Rest',
      'Dinner at GBQ',
      'Watch a movie',
    ],
    footnote: 'See you JB! ♡',
  },
  {
    id: 'day2',
    dateLabel: '16 Nov',
    weekday: 'Sun',
    banner: '16 Nov • Day 2 ♡',
    dayNumber: 2,
    items: [
      'Wake up (8.00am)',
      'Kiss Kiss Cuddles ♡',
      'Whole day surprise activity!',
      'Dinner',
      'Gift reveal back at Airbnb ♡',
    ],
    footnote: 'Another day, another surprise ♡',
  },
  {
    id: 'day3',
    dateLabel: '17 Nov',
    weekday: 'Mon',
    banner: '17 Nov • Day 3 ♡',
    dayNumber: 3,
    items: [
      'Wake up whenever',
      'Kiss Kiss Cuddles ♡',
      'Lunch',
      'Photobooth at Cult Classics',
      'Time to go back home :(',
    ],
    footnote: 'End of our birthday trip... for now ♡',
  },
]
