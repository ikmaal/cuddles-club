interface CardBuddyProps {
  who: 'you' | 'partner'
}

export function CardBuddy({ who }: CardBuddyProps) {
  return (
    <img
      className={`card-buddy card-buddy--${who}`}
      src={`${import.meta.env.BASE_URL}dudu-naughty.gif`}
      alt=""
      width={56}
      height={56}
      decoding="async"
    />
  )
}
