import { useRef } from 'react'
import type { MemberSlot } from '../lib/coupleSlot'

interface CardBuddyProps {
  /** Absolute couple member slot this card belongs to. */
  memberSlot: MemberSlot
  className?: string
}

const BUDDY_SRC: Record<MemberSlot, string> = {
  // Space creator is slot A — keep Dudu fixed to that person on every phone.
  a: 'dudu-underwear.gif',
  b: 'beam-love.gif',
}

const BUDDY_SOUND: Record<MemberSlot, string> = {
  a: 'dudu-sound.mp3',
  b: 'bubu-sound.mp3',
}

const BUDDY_LABEL: Record<MemberSlot, string> = {
  a: 'Play Dudu sound',
  b: 'Play Bubu sound',
}

export function buddyAvatarSrc(memberSlot: MemberSlot): string {
  return `${import.meta.env.BASE_URL}${BUDDY_SRC[memberSlot]}`
}

export function CardBuddy({ memberSlot, className }: CardBuddyProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const src = `${import.meta.env.BASE_URL}${BUDDY_SRC[memberSlot]}`
  const soundSrc = `${import.meta.env.BASE_URL}${BUDDY_SOUND[memberSlot]}`
  const classNames = `card-buddy card-buddy--${memberSlot} card-buddy--sound${
    className ? ` ${className}` : ''
  }`

  function playSound() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Click is a user gesture; ignore rare play() failures.
    })
  }

  return (
    <>
      <button
        type="button"
        className={`${classNames} card-buddy__btn`}
        onClick={playSound}
        aria-label={BUDDY_LABEL[memberSlot]}
      >
        <img src={src} alt="" width={56} height={56} decoding="async" />
      </button>
      <audio ref={audioRef} src={soundSrc} preload="auto" />
    </>
  )
}

/** Map a viewer-relative card (`you` / `partner`) to the absolute couple slot. */
export function cardMemberSlot(
  who: 'you' | 'partner',
  mySlot: MemberSlot | null,
): MemberSlot {
  const self = mySlot ?? 'a'
  if (who === 'you') return self
  return self === 'a' ? 'b' : 'a'
}
