import { createPortal } from 'react-dom'

interface HomeWallpaperProps {
  imageUrl: string
  visible: boolean
}

export function HomeWallpaper({ imageUrl, visible }: HomeWallpaperProps) {
  return createPortal(
    <div
      className={`home-wallpaper${visible ? ' is-visible' : ''}`}
      style={{ ['--home-bg' as string]: `url(${imageUrl})` }}
      aria-hidden
    />,
    document.body,
  )
}
