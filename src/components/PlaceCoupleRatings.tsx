import { PlaceRatingsDuo } from '../components/PlaceRatingsDuo'
import { useCouple } from '../context/CoupleContext'
import { placeRatingsForViewer } from '../lib/placeRatings'
import type { CoupleProfile, FoodPlace } from '../types'

interface PlaceCoupleRatingsProps {
  profile: CoupleProfile
  place: FoodPlace
  onYouChange?: (rating: number) => void
  layout?: 'stack' | 'inline'
}

export function PlaceCoupleRatings({
  profile,
  place,
  onYouChange,
  layout = 'stack',
}: PlaceCoupleRatingsProps) {
  const { slot } = useCouple()
  const ratings = placeRatingsForViewer(place, slot ?? 'a')

  return (
    <PlaceRatingsDuo
      names={{ you: profile.nameYou, partner: profile.namePartner }}
      ratings={ratings}
      onYouChange={onYouChange}
      layout={layout}
    />
  )
}
