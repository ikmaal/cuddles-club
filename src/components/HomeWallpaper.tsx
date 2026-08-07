import { createPortal } from 'react-dom'

interface HomeWallpaperProps {
  imageUrl: string
}

export function HomeWallpaper({ imageUrl }: HomeWallpaperProps) {
  return createPortal(
    <div
      className="home-wallpaper"
      style={{ ['--home-bg' as string]: `url(${imageUrl})` }}
      aria-hidden
    />,
    document.body,
  )
}
