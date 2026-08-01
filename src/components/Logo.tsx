export function Logo({ size = 42 }: { size?: number }) {
  return (
    <svg
      className="brand-logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="64" height="64" rx="18" fill="#FFE4EA" />
      <path
        d="M26 46c-6.2-5-14-11.4-14-18.7C12 20.2 17.1 16 22.2 16c2.8 0 5 1.3 4.6 3.5C26.4 17.3 28.6 16 31.4 16 36.5 16 41.6 20.2 41.6 27.3 41.6 34.6 33.8 41 26 46z"
        fill="#FF8FA8"
      />
      <path
        d="M38 48c-6.2-5-14-11.4-14-18.7C24 22.2 29.1 18 34.2 18c2.8 0 5 1.3 4.6 3.5C38.4 19.3 40.6 18 43.4 18 48.5 18 53.6 22.2 53.6 29.3 53.6 36.6 45.8 43 38 48z"
        fill="#E85D75"
      />
      <circle cx="22.5" cy="28.5" r="2.2" fill="#FFB7C5" />
      <circle cx="45.5" cy="30.5" r="2.2" fill="#FFB7C5" />
      <circle cx="12" cy="14" r="1.6" fill="#E85D75" />
      <circle cx="52" cy="12" r="1.3" fill="#FF8FA8" />
      <path
        d="M50 40l1.2 2.4L53.6 43.6l-2.4 1.2L50 47.2l-1.2-2.4L46.4 43.6l2.4-1.2L50 40z"
        fill="#FFD0DA"
      />
    </svg>
  )
}
