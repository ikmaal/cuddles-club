import type { MoodKey } from './types'

export const STARTER_BUCKET = [
  'Watch the sunrise together',
  'Cook a recipe neither of us has tried',
  'Take a spontaneous road trip',
  'Do a photo shoot with just our phones',
]

export const STARTER_IDEAS = [
  'Street food crawl',
  'Movie night with too many snacks',
  'Walk somewhere new with no destination',
  'Cook dinner together, no recipe',
  'Board games and hot drinks',
  'Sunset drive with a good playlist',
  'Try the cafe we keep walking past',
  'Museum or gallery afternoon',
  'Picnic in the park',
  'Karaoke, badly',
]

export const QUESTIONS = [
  'What is something I did recently that made you smile?',
  'Where should we travel next, money aside?',
  'What is your favourite memory of us so far?',
  'What small thing makes your day instantly better?',
  'What are you most looking forward to this month?',
  'What is something new you want us to try together?',
  'When did you feel most supported by me?',
  'What does a perfect lazy day look like to you?',
  'What song reminds you of us?',
  'What is one thing you want to get better at this year?',
  'What is the best gift you have ever received?',
  'Which of our inside jokes still gets you every time?',
  'What is something you are proud of but rarely mention?',
  'What would our ideal weekend look like?',
  'What do you need more of from me right now?',
  'What is a tiny habit of mine that you love?',
  'If we adopted a second pet, what would we name it?',
  'What is the nicest thing anyone has said about us?',
  'What is something you want us to stop putting off?',
  'What made you laugh hardest this week?',
  'What is a place from your childhood you want to show me?',
  'What does feeling loved look like for you?',
  'What is the best decision we have made together?',
  'What are you grateful for today?',
  'What is one thing you want to remember about this year?',
]

export const MOODS: { key: MoodKey; label: string; emoji: string }[] = [
  { key: 'great', label: 'Great', emoji: '🤩' },
  { key: 'good', label: 'Good', emoji: '🙂' },
  { key: 'okay', label: 'Okay', emoji: '😐' },
  { key: 'low', label: 'Low', emoji: '🙁' },
  { key: 'rough', label: 'Rough', emoji: '😔' },
]

/** Same question for both of you all day, rotating each day. */
export function questionForDay(day: string): string {
  let hash = 0
  for (let i = 0; i < day.length; i += 1) {
    hash = (hash * 31 + day.charCodeAt(i)) % 100_000
  }
  return QUESTIONS[hash % QUESTIONS.length]
}
