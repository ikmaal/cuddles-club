import { todayKey } from '../hooks/useStored'

export type PoopHeroLine =
  | string
  | { before?: string; em: string; after?: string }

type PoopHeroMessage = PoopHeroLine[]

const POOPED_TODAY: PoopHeroMessage[] = [
  [
    'Hey {name},',
    { before: 'you nailed ', em: "today's", after: ' poop.' },
  ],
  [
    'Hey {name},',
    { before: 'certified ', em: 'poop', after: ' champion today.' },
  ],
  [
    'Hey {name},',
    { before: 'that log was ', em: "chef's kiss", after: ' material.' },
  ],
  [
    'Hey {name},',
    { before: 'bowel movement ', em: 'unlocked', after: ' successfully.' },
  ],
  [
    'Hey {name},',
    { before: 'the throne has been ', em: 'honoured', after: ' today.' },
  ],
  [
    'Hey {name},',
    { before: 'gut health says ', em: 'thank you', after: '.' },
  ],
  [
    'Hey {name},',
    { before: 'today’s dump: ', em: 'delivered', after: ' on schedule.' },
  ],
  [
    'Hey {name},',
    { before: 'you’re on a ', em: 'roll', after: ' today. Literally.' },
  ],
  [
    'Hey {name},',
    { before: 'another ', em: 'glorious', after: ' deposit logged.' },
  ],
  [
    'Hey {name},',
    { before: 'porcelain throne: ', em: 'conquered', after: '.' },
  ],
]

const POOPED_MULTIPLE: PoopHeroMessage[] = [
  [
    'Hey {name},',
    { before: 'two poops today?', em: 'Legend', after: ' behaviour.' },
  ],
  [
    'Hey {name},',
    { before: 'double feature ', em: 'dump', after: ' day. Iconic.' },
  ],
  [
    'Hey {name},',
    { before: 'going ', em: 'twice', after: '? The gut said yes.' },
  ],
  [
    'Hey {name},',
    { before: 'multi-log ', em: 'masterclass', after: ' in session.' },
  ],
  [
    'Hey {name},',
    { before: 'today’s tally is ', em: 'stacked', after: '. Respect.' },
  ],
]

const NOT_YET_TODAY: PoopHeroMessage[] = [
  [
    'Hey {name},',
    { before: 'the throne ', em: 'awaits', after: ' your arrival.' },
  ],
  [
    'Hey {name},',
    { before: 'today’s poop is ', em: 'still loading', after: '…' },
  ],
  [
    'Hey {name},',
    { before: 'your colon ', em: 'believes', after: ' in you.' },
  ],
  [
    'Hey {name},',
    { before: 'time to visit the ', em: 'porcelain', after: ' office.' },
  ],
  [
    'Hey {name},',
    { before: 'no logs yet, but ', em: 'hope', after: ' poops eternal.' },
  ],
  [
    'Hey {name},',
    { before: 'go make ', em: 'bathroom', after: ' history today.' },
  ],
  [
    'Hey {name},',
    { before: 'your gut is ', em: 'plotting', after: ' something big.' },
  ],
  [
    'Hey {name},',
    { before: 'the pipes are ', em: 'patient', after: '. Are you?' },
  ],
  [
    'Hey {name},',
    { before: 'today’s mission: ', em: 'drop', after: ' the deuce.' },
  ],
  [
    'Hey {name},',
    { before: 'empty calendar, ', em: 'full', after: ' potential.' },
  ],
  [
    'Hey {name},',
    { before: 'send ', em: 'help', after: '… or just send poop.' },
  ],
  [
    'Hey {name},',
    { before: 'be the ', em: 'hero', after: ' your toilet deserves.' },
  ],
]

function hashSeed(seed: string, length: number): number {
  if (length <= 0) return 0
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 1)) % 2147483647
  }
  return Math.abs(hash) % length
}

function personalize(line: PoopHeroLine, name: string): PoopHeroLine {
  if (typeof line === 'string') {
    return line.replace('{name}', name)
  }
  return {
    before: line.before?.replace('{name}', name),
    em: line.em.replace('{name}', name),
    after: line.after?.replace('{name}', name),
  }
}

export function pickPoopHeroMessage(
  owner: string,
  displayName: string,
  todayCount: number,
): PoopHeroLine[] {
  const name = displayName.toLowerCase()
  const pool =
    todayCount > 1 ? POOPED_MULTIPLE : todayCount > 0 ? POOPED_TODAY : NOT_YET_TODAY
  const seed = `${owner}-${todayKey()}-${todayCount}`
  const message = pool[hashSeed(seed, pool.length)]
  return message.map((line) => personalize(line, name))
}
