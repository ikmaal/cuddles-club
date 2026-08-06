import type { ComponentType } from 'react'
import {
  BucketIcon,
  CatIcon,
  DiceIcon,
  NoteIcon,
  StripIcon,
} from './components/Icons'
import type { Screen } from './types'

export interface Service {
  id: Screen
  label: string
  blurb: string
  tone: string
  Icon: ComponentType<{ size?: number }>
  image?: string
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
    image: 'photobooth.jpg',
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
]
