interface IconProps {
  size?: number
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Frame({ size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...base}>
      {children}
    </svg>
  )
}

export function CatIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M5 11c0-4 .9-7.6 1.5-7.6C7.3 3.4 9 5.2 10 6.2a8.8 8.8 0 0 1 4 0c1-1 2.7-2.8 3.5-2.8.6 0 1.5 3.6 1.5 7.6 0 5.1-3.1 9-7 9s-7-3.9-7-9z" />
      <path d="M9.6 12h.01M14.4 12h.01" strokeWidth="2.4" />
      <path d="M12 14.6v.9M12 15.5c-.6 1-1.9.9-2.4.3M12 15.5c.6 1 1.9.9 2.4.3" />
    </Frame>
  )
}

export function NoteIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3.6 7.2 12 13l8.4-5.8" />
    </Frame>
  )
}

export function BucketIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M9 3h9a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9" />
      <path d="m3 5 2.6 2.6L10 3.2" />
      <path d="M9.5 11h7M9.5 15.5h4.5" />
    </Frame>
  )
}

export function DiceIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <path d="M8.4 8.4h.01M15.6 8.4h.01M12 12h.01M8.4 15.6h.01M15.6 15.6h.01" strokeWidth="2.6" />
    </Frame>
  )
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="3" y="5" width="18" height="16" rx="3.5" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
      <path d="M8 14h3.5" />
    </Frame>
  )
}

export function ChatIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M21 12.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-4.4A7.5 7.5 0 0 1 3 12.5 7.5 7.5 0 0 1 10.5 5h3A7.5 7.5 0 0 1 21 12.5z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" strokeWidth="2.4" />
    </Frame>
  )
}

export function SmileIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" strokeWidth="2.4" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
    </Frame>
  )
}

export function StripIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M9.5 5.5h5M9.5 10h5M9.5 14.5h5M9.5 19h5" />
    </Frame>
  )
}

export function CameraIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4 8.5h3.2l1.4-2.2h6.8L16.8 8.5H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z" />
      <circle cx="12" cy="13.5" r="3.2" />
      <path d="M18.2 10.8h.01" strokeWidth="2.4" />
    </Frame>
  )
}

/** Two people striking a photobooth pose. */
export function PoseIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="8.2" cy="5.8" r="2.1" />
      <path d="M8.2 8.4v5.2" />
      <path d="M5.2 11.2 8.2 9.6l3 1.6" />
      <path d="M5.8 20.2 8.2 14.2l2.4 6" />
      <circle cx="16.4" cy="6.2" r="2.1" />
      <path d="M16.4 8.8v4.8" />
      <path d="M16.4 10.4 20 8.2" />
      <path d="M14.2 20.2 16.4 14.2l2.2 6" />
      <path d="M12 2.8v2.4M10.8 4h2.4" strokeWidth="1.7" />
    </Frame>
  )
}

export function GridIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="6" cy="12" r="1.6" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="1.6" strokeWidth="2.2" />
      <circle cx="18" cy="12" r="1.6" strokeWidth="2.2" />
    </Frame>
  )
}

export function HomeIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4 10.5 12 4l8 6.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M9.5 21v-6h5v6" />
    </Frame>
  )
}

export function HeartIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M12 20.3C7.9 17.1 4 13.6 4 10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3.6-3.9 7.1-8 10.3z" />
    </Frame>
  )
}

export function BackIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </Frame>
  )
}

export function PlusIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Frame>
  )
}

export function TrashIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    </Frame>
  )
}

export function PencilIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M12.5 5.5 18.5 11.5" />
      <path d="M4.5 19.5 5.7 14.3 15.2 4.8a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L9.7 18.3z" />
      <path d="M4.5 19.5h5" />
    </Frame>
  )
}

export function CheckIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="m5.5 12.5 4.2 4.2 8.8-9.4" />
    </Frame>
  )
}

export function ChevronIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Frame>
  )
}

export function SettingsIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Frame>
  )
}

export function AcademicsIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4 19.5V6.2c0-.7.4-1.3 1-1.6L12 2.5l7 2.1c.6.3 1 .9 1 1.6v13.3" />
      <path d="M12 2.5v17" />
      <path d="M4 19.5 12 17l8 2.5" />
    </Frame>
  )
}

export function PlacesIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9.2 10.2v5.2M9.2 10.2c.9-.8 2-.8 2.6 0 .6.8.4 1.6 0 2.1L9.2 15.4" />
      <path d="M14.8 9.6v6.2M13.4 9.6h2.8" />
    </Frame>
  )
}
