import type { ComponentType } from 'react'
import { AcademicsIcon, PlacesIcon, PoopIcon, StripIcon } from './components/Icons'
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
    id: 'strips',
    label: 'Photobooth',
    blurb: 'Snap strips, save memories, spin them in 3D',
    tone: 'film',
    Icon: StripIcon,
    image: 'photoboothicon.png',
  },
  {
    id: 'academics',
    label: 'Study Together',
    blurb: 'Modules, notes, and due dates',
    tone: 'neutral',
    Icon: AcademicsIcon,
    image: 'studytogethericon.jpg',
  },
  {
    id: 'places',
    label: 'Noms',
    blurb: 'Food we’ve been to, and want to try',
    tone: 'orange',
    Icon: PlacesIcon,
    image: 'nomsicon.png',
  },
  {
    id: 'pooptracker',
    label: 'Poop Tracker',
    blurb: 'Log daily poops and keep your streak',
    tone: 'poop',
    Icon: PoopIcon,
    image: 'pooptrackericon.png',
  },
]
