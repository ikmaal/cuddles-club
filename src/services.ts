import type { ComponentType } from 'react'
import { AcademicsIcon, PlacesIcon, StripIcon } from './components/Icons'
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
    image: 'photobooth.jpg',
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
    label: 'Places',
    blurb: 'Food we’ve been to, and want to try',
    tone: 'orange',
    Icon: PlacesIcon,
    image: 'places-logo.png',
  },
]
