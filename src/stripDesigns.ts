/** Photostrip design themes for the in-app booth. */

export type StripDesignId = 'cute' | 'classic' | 'dateNight' | 'polaroid' | 'retro'

export interface StripDesign {
  id: StripDesignId
  label: string
  description: string
  /** Swatch colors for the picker UI [top, middle, accent]. */
  swatch: [string, string, string]
}

export const STRIP_DESIGNS: StripDesign[] = [
  {
    id: 'cute',
    label: 'Booth cuties',
    description: 'Cats, hearts, and stars on soft pink paper.',
    swatch: ['#fff7f2', '#ffe9ef', '#e85d75'],
  },
  {
    id: 'classic',
    label: 'Film classic',
    description: 'Black-and-white booth strip with film edges.',
    swatch: ['#f5f0e8', '#2a2a2a', '#1a1a1a'],
  },
  {
    id: 'dateNight',
    label: 'Date night',
    description: 'Dark romantic tones with gold sparkles.',
    swatch: ['#3d2a5c', '#1f1435', '#ffd933'],
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    description: 'Stacked instant frames with sage accents.',
    swatch: ['#fffdf8', '#f0ebe3', '#5b9a8b'],
  },
  {
    id: 'retro',
    label: 'Retro vibes',
    description: 'Warm vintage paper with orange sunbursts.',
    swatch: ['#f4e4c8', '#e8d4b0', '#f76708'],
  },
]

export const DEFAULT_STRIP_DESIGN: StripDesignId = 'cute'
