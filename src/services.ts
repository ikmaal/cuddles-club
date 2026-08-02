import type { ComponentType } from 'react'
import {
  BucketIcon,
  CalendarIcon,
  CatIcon,
  ChatIcon,
  DiceIcon,
  GridIcon,
  NoteIcon,
  SmileIcon,
} from './components/Icons'
import type { Screen } from './types'

export interface Service {
  id: Screen | 'more'
  label: string
  blurb: string
  tone: string
  Icon: ComponentType<{ size?: number }>
  keywords: string[]
}

export const SERVICES: Service[] = [
  {
    id: 'cat',
    label: 'Our Cat',
    blurb: 'Feed, play and raise Mochi together',
    tone: 'rose',
    Icon: CatIcon,
    keywords: ['cat', 'pet', 'mochi', 'feed', 'play', 'game'],
  },
  {
    id: 'notes',
    label: 'Love Notes',
    blurb: 'Leave each other little messages',
    tone: 'purple',
    Icon: NoteIcon,
    keywords: ['note', 'love', 'message', 'letter', 'write'],
  },
  {
    id: 'bucket',
    label: 'Bucket List',
    blurb: 'Everything you want to do together',
    tone: 'green',
    Icon: BucketIcon,
    keywords: ['bucket', 'list', 'goals', 'todo', 'plans'],
  },
  {
    id: 'roulette',
    label: 'Date Spin',
    blurb: 'Let fate pick tonight’s plan',
    tone: 'orange',
    Icon: DiceIcon,
    keywords: ['date', 'spin', 'random', 'idea', 'roulette'],
  },
  {
    id: 'countdown',
    label: 'Countdowns',
    blurb: 'Days until the moments that matter',
    tone: 'blue',
    Icon: CalendarIcon,
    keywords: ['countdown', 'date', 'anniversary', 'birthday', 'calendar'],
  },
  {
    id: 'question',
    label: 'Daily Q',
    blurb: 'One question, two answers',
    tone: 'teal',
    Icon: ChatIcon,
    keywords: ['question', 'daily', 'answer', 'talk', 'prompt'],
  },
  {
    id: 'mood',
    label: 'Mood',
    blurb: 'Check in on how you both feel',
    tone: 'yellow',
    Icon: SmileIcon,
    keywords: ['mood', 'feel', 'check in', 'today'],
  },
  {
    id: 'more',
    label: 'More',
    blurb: 'What’s coming next',
    tone: 'neutral',
    Icon: GridIcon,
    keywords: ['more', 'soon', 'other'],
  },
]

export const UPCOMING = [
  'Shared photo album',
  'Song of the day',
  'Split the bill',
  'Movie watchlist',
]
