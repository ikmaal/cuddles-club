/** Edit this — your birthday letter shows on the first itinerary slide. */
export const BIRTHDAY_LETTER = {
  banner: 'happy birthday my princess',
  paragraphs: [
    'happiest birthday to my most favourite person ever',
    'you have reached 22 years old baby pie. i hope your birthday this year will be a special one and i will make sure it is. i wanna make u the happiest girl ever because u deserve everything in this world. you are so special to me baby.',
    'i hope you will enjoy this trip eventhough its just a small thing from me. i feel like my planning could be better this year but i hope it will still make u happy hehe. cant wait to celebrate more birthdays with u my love. i love u sayang',
  ],
}

export const BIRTHDAY_ITINERARY_INTRO = 'here is the itinerary plan!'

export const BIRTHDAY_ITINERARY_NOTES = {
  title: 'things to take note',
  items: [
    'wear what u feel is most comfortable',
    'pls bring the night dress :)',
    'most importantly, i hope you enjoy the trip baby. i love you ♡',
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
      'Meet at Woodlands MRT (1.30pm)',
      'Reach JB (2.30pm)',
      'Get matcha from Kota Jail',
      'Check in Airbnb',
      'Rest',
      'Dinner at GBQ',
      'Watch a movie (Kudrat 1968)',
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
      'Wake up',
      'Kiss Kiss Cuddles ♡',
      'Whole day surprise activity!',
      'Dinner',
      'go back to airbnb',
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
      'wake up',
      'Kiss Kiss Cuddles ♡',
      'check out at 12pm',
      'Lunch',
      'Photobooth at Cult Classics',
      'Time to go back home :(',
    ],
    footnote: 'End of our birthday trip... for now ♡',
  },
]
