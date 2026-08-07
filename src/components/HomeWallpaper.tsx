import { createPortal } from 'react-dom'

interface HomeWallpaperProps {
  imageUrl: string
  visible: boolean
}

export function HomeWallpaper({ imageUrl, visible }: HomeWallpaperProps) {
  return createPortal(
    <img
      className={`home-wallpaper${visible ? ' is-visible' : ''}`}
      src={imageUrl}
      alt=""
      decoding="async"
      draggable={false}
    />,
    document.body,
  )
}
