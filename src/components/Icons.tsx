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

export function DotsIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M6.2 12h.01M12 12h.01M17.8 12h.01" strokeWidth="2.8" />
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

export function MapPinIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M12 21s6.5-5.2 6.5-10.2a6.5 6.5 0 1 0-13 0C5.5 15.8 12 21 12 21z" />
      <circle cx="12" cy="10.8" r="2.2" />
    </Frame>
  )
}

export function CapIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M3 10.2 12 6l9 4.2-9 4.2-9-4.2z" />
      <path d="M7.2 12.4v3.6c0 .9 2.1 2.2 4.8 2.2s4.8-1.3 4.8-2.2v-3.6" />
      <path d="M21 10.2v4.2" />
    </Frame>
  )
}

export function DocPageIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M7 3.8h7.2L18.5 8v12.2H7z" />
      <path d="M14.2 3.8V8H18.5" />
      <path d="M9.4 12.2h5.4M9.4 15.4h3.6" />
    </Frame>
  )
}

export function MegaphoneIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4.2 10.2v3.6l2.6.8 7.4 3.2V6.2L6.8 9.4z" />
      <path d="M14.4 9.4c1.1.6 1.8 1.5 1.8 2.6s-.7 2-1.8 2.6" />
      <path d="M6.8 14.8V18" />
    </Frame>
  )
}

export function CodeBracketsIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="m8 7.5-4 4.5 4 4.5M16 7.5l4 4.5-4 4.5" />
    </Frame>
  )
}

export function BookIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M6 5.2A2 2 0 0 1 8 3.2h11v15.8H8A2 2 0 0 0 6 21z" />
      <path d="M6 5.2v15.8" />
      <path d="M9.2 7.4h6.8" />
    </Frame>
  )
}

export function SearchIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m16 16 4 4" />
    </Frame>
  )
}

export function FilterIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Frame>
  )
}

export function BookmarkIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1z" />
    </Frame>
  )
}

export function UserIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="8.2" r="3.2" />
      <path d="M5.2 19.2c.8-3.2 3.2-5 6.8-5s6 1.8 6.8 5" />
    </Frame>
  )
}

export function LocateIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.4M12 18.1v2.4M3.5 12h2.4M18.1 12h2.4" />
      <circle cx="12" cy="12" r="7.2" />
    </Frame>
  )
}

export function ListIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M8 7h12M8 12h12M8 17h12" />
      <path d="M4.2 7h.01M4.2 12h.01M4.2 17h.01" strokeWidth="2.4" />
    </Frame>
  )
}

export function BeenToIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.6"
        y="3.6"
        width="16.8"
        height="16.8"
        rx="5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="2.4 1.7"
      />
      <path
        d="M12 17.15c-2.85-2.2-5.35-4.55-5.35-7a5.35 5.35 0 0 1 10.7 0c0 2.45-2.5 4.8-5.35 7z"
        fill="currentColor"
      />
    </svg>
  )
}

export function BellIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M6.2 10.2a5.8 5.8 0 0 1 11.6 0c0 4.2 1.4 5.4 1.4 5.4H4.8s1.4-1.2 1.4-5.4z" />
      <path d="M10 18.6a2 2 0 0 0 4 0" />
    </Frame>
  )
}

export function SwapIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M6.4 8.4h11.2M13.6 5.2 18.2 8.4 13.6 11.6" strokeWidth="2.8" />
      <path d="M17.6 15.6H6.4M10.4 12.4 5.8 15.6 10.4 18.8" strokeWidth="2.8" />
    </Frame>
  )
}

export function LaptopIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="5" y="5.5" width="14" height="10" rx="1.6" />
      <path d="M3.6 18.2h16.8" />
    </Frame>
  )
}

export function CalcIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="5.2" y="3.6" width="13.6" height="16.8" rx="2.2" />
      <rect x="7.4" y="6" width="9.2" height="3.2" rx="0.8" />
      <path
        d="M8.2 12.2h.01M12 12.2h.01M15.8 12.2h.01M8.2 15.6h.01M12 15.6h.01M15.8 15.6h.01"
        strokeWidth="2.2"
      />
    </Frame>
  )
}

export function WantToGoIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.2 3.8h9.6a1.2 1.2 0 0 1 1.2 1.2V20l-6-3.2-6 3.2V5a1.2 1.2 0 0 1 1.2-1.2z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M7.2 3.8h9.6a1.2 1.2 0 0 1 1.2 1.2V20l-6-3.2-6 3.2V5a1.2 1.2 0 0 1 1.2-1.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.2 12.85 8h2.05l-1.65 1.25.65 2-1.9-1.2-1.9 1.2.65-2L8.1 8h2.05z"
        fill="currentColor"
      />
    </svg>
  )
}
