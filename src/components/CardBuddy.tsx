import type { MemberSlot } from '../lib/coupleSlot'

interface CardBuddyProps {
  /** Absolute couple member slot this card belongs to. */
  memberSlot: MemberSlot
  className?: string
}

const BUDDY_SRC: Record<MemberSlot, string> = {
  // Space creator is slot A — keep Dudu fixed to that person on every phone.
  a: 'dudu-naughty.gif',
  b: 'beam-love.gif',
}

export function CardBuddy({ memberSlot, className }: CardBuddyProps) {
  return (
    <img
      className={`card-buddy card-buddy--${memberSlot}${className ? ` ${className}` : ''}`}
      src={`${import.meta.env.BASE_URL}${BUDDY_SRC[memberSlot]}`}
      alt=""
      width={56}
      height={56}
      decoding="async"
    />
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
