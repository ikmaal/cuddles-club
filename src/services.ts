import type { ComponentType } from 'react'
import {
  BucketIcon,
  CalendarIcon,
  CatIcon,
  ChatIcon,
  DiceIcon,
  NoteIcon,
  SmileIcon,
  StripIcon,
} from './components/Icons'
import type { Screen } from './types'

export interface Service {
  id: Screen
  label: string
  blurb: string
  tone: string
  Icon: ComponentType<{ size?: number }>
}

export const SERVICES: Service[] = [
  {
    id: 'cat',
    label: 'Our Cat',
    blurb: 'Feed, play and raise Mochi together',
    tone: 'rose',
    Icon: CatIcon,
  },
  {
    id: 'strips',
    label: 'Photobooth',
    blurb: 'Snap strips, save memories, spin them in 3D',
    tone: 'film',
    Icon: StripIcon,
  },
  {
    id: 'notes',
    label: 'Love Notes',
    blurb: 'Leave each other little messages',
    tone: 'purple',
    Icon: NoteIcon,
  },
  {
    id: 'bucket',
    label: 'Bucket List',
    blurb: 'Everything you want to do together',
    tone: 'green',
    Icon: BucketIcon,
  },
  {
    id: 'roulette',
    label: 'Date Spin',
    blurb: 'Let fate pick tonight’s plan',
    tone: 'orange',
    Icon: DiceIcon,
  },
  {
    id: 'countdown',
    label: 'Countdowns',
    blurb: 'Days until the moments that matter',
    tone: 'blue',
    Icon: CalendarIcon,
  },
  {
    id: 'question',
    label: 'Daily Q',
    blurb: 'One question, two answers',
    tone: 'teal',
    Icon: ChatIcon,
  },
  {
    id: 'mood',
    label: 'Mood',
    blurb: 'Check in on how you both feel',
    tone: 'yellow',
    Icon: SmileIcon,
  },
]
