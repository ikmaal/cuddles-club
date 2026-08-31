export const PLACE_RATING_MAX = 10
export const PLACE_RATING_STEP = 0.1

export function clampPlaceRating(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(PLACE_RATING_MAX, Math.max(0, Math.round(value * 10) / 10))
}

export type PlaceRatingTone = 'muted' | 'low' | 'mid' | 'high' | 'elite'

export function ratingTone(score: number): PlaceRatingTone {
  if (score <= 0) return 'muted'
  if (score < 5) return 'low'
  if (score < 7.5) return 'mid'
  if (score < 9) return 'high'
  return 'elite'
}

export function ratingVibe(score: number): string {
  if (score <= 0) return 'Set a score from 0 to 10'
  if (score < 3) return 'Not for me'
  if (score < 4) return 'Below average'
  if (score < 6) return 'Average'
  if (score < 7.5) return 'Good'
  if (score < 8.5) return 'Very good'
  if (score < 9.5) return 'Excellent'
  return 'Outstanding'
}

export function ratingEmoji(score: number): string {
  if (score <= 0) return '✨'
  if (score < 3) return '😞'
  if (score < 5) return '😐'
  if (score < 7.5) return '🙂'
  if (score < 9) return '😊'
  return '🤩'
}
