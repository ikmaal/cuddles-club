import type { ComponentType } from 'react'
import { AcademicsIcon, PlacesIcon, PolaroidIcon, StripIcon } from './components/Icons'
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
    id: 'moments',
    label: 'Moments',
    blurb: 'Instant polaroids with a film look',
    tone: 'orange',
    Icon: PolaroidIcon,
    image: 'moments-logo.png',
  },
  {
    id: 'academics',
    label: 'Academics',
    blurb: 'Modules, materials, and due dates',
    tone: 'neutral',
    Icon: AcademicsIcon,
    image: 'academics-logo.png',
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
