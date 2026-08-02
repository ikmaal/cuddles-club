import { CatHome } from '../components/CatHome'
import { ScreenHeader } from '../components/ScreenHeader'
import type { CareResult } from '../hooks/useCat'
import type { CatMood, CatState, Carer, CoupleProfile } from '../types'

interface CatScreenProps {
  cat: CatState
  mood: CatMood
  level: number
  profile: CoupleProfile
  onFeed: () => CareResult
  onGroom: () => CareResult
  onPet: () => CareResult
  onToggleSleep: () => CareResult
  onPlay: () => void
  onSetCarer: (carer: Carer) => void
  onRename: (name: string) => void
  onNotify: (message: string) => void
  onBack: () => void
}

export function CatScreen({ onBack, ...catProps }: CatScreenProps) {
  return (
    <div className="screen screen--cat">
      <ScreenHeader
        title="Our Cat"
        subtitle={`${catProps.cat.name} · bond level ${catProps.level}`}
        onBack={onBack}
      />
      <CatHome {...catProps} />
    </div>
  )
}
