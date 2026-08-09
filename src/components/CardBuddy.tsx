interface CardBuddyProps {
  who: 'you' | 'partner'
}

const BUDDY_SRC: Record<CardBuddyProps['who'], string> = {
  you: 'dudu-naughty.gif',
  partner: 'beam-love.gif',
}

export function CardBuddy({ who }: CardBuddyProps) {
  return (
    <img
      className={`card-buddy card-buddy--${who}`}
      src={`${import.meta.env.BASE_URL}${BUDDY_SRC[who]}`}
      alt=""
      width={56}
      height={56}
      decoding="async"
    />
  )
}
