export type Cuisine =
  | 'Malay'
  | 'Chinese'
  | 'Indian'
  | 'Japanese'
  | 'Korean'
  | 'Western'
  | 'Cafe'
  | 'Dessert'
  | 'Street food'
  | 'Other'

export interface Place {
  id: string
  name: string
  cuisine: Cuisine
  lat: number
  lng: number
  address?: string
  visitedAt: string
  ratingYou: number
  ratingPartner: number
  note: string
  wouldReturn: 'yes' | 'maybe' | 'no'
  createdAt: string
}

export interface CoupleProfile {
  nameYou: string
  namePartner: string
}

export type Tab = 'map' | 'list' | 'add'

export const CUISINES: Cuisine[] = [
  'Malay',
  'Chinese',
  'Indian',
  'Japanese',
  'Korean',
  'Western',
  'Cafe',
  'Dessert',
  'Street food',
  'Other',
]

export const DEFAULT_CENTER: [number, number] = [3.139, 101.6869]
export const DEFAULT_ZOOM = 12
