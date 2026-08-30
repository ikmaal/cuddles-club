import { clampPlaceRating } from './placeRating'
import type { MemberSlot } from './coupleSlot'
import type { FoodPlace, PlaceRatings } from '../types'

export function placeRatingsForViewer(place: FoodPlace, mySlot: MemberSlot): PlaceRatings {
  if (mySlot === 'a') {
    return { you: place.ratingA, partner: place.ratingB }
  }
  return { you: place.ratingB, partner: place.ratingA }
}

/** Mean of rated scores (> 0). Returns null when nobody has rated yet. */
export function placeRatingAverage(ratings: PlaceRatings): number | null {
  const scores = [ratings.you, ratings.partner].filter((score) => score > 0)
  if (scores.length === 0) return null
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return clampPlaceRating(mean)
}

export function placeRatingAverageFromPlace(place: FoodPlace): number | null {
  return placeRatingAverage({ you: place.ratingA, partner: place.ratingB })
}

export function withMyPlaceRating(
  place: FoodPlace,
  rating: number,
  mySlot: MemberSlot,
): FoodPlace {
  const next = clampPlaceRating(rating)
  if (mySlot === 'a') return { ...place, ratingA: next }
  return { ...place, ratingB: next }
}

export function legacyRatingToSlots(legacyRating: number): { ratingA: number; ratingB: number } {
  const rating = clampPlaceRating(legacyRating)
  if (rating <= 0) return { ratingA: 0, ratingB: 0 }
  return { ratingA: rating, ratingB: 0 }
}

export function normalizePlaceRatings(
  row: Partial<FoodPlace> & { rating?: number },
): Pick<FoodPlace, 'ratingA' | 'ratingB'> {
  const hasA = row.ratingA != null
  const hasB = row.ratingB != null
  if (hasA || hasB) {
    return {
      ratingA: clampPlaceRating(Number(row.ratingA) || 0),
      ratingB: clampPlaceRating(Number(row.ratingB) || 0),
    }
  }
  return legacyRatingToSlots(Number(row.rating) || 0)
}
