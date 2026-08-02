import { composeCuteStrip } from './composeStrip'
import { STRIP_DESIGNS, type StripDesignId } from './stripDesigns'

const PREVIEW_WIDTH = 112
let cache: Partial<Record<StripDesignId, string>> | null = null
let loading: Promise<Record<StripDesignId, string>> | null = null

/** Placeholder booth shots used only for design picker thumbnails. */
function createPlaceholderShots(): string[] {
  const palettes: [string, string][] = [
    ['#ffd6e0', '#ff8fa8'],
    ['#d9fcde', '#7dd99a'],
    ['#ebfaff', '#8fd4ff'],
    ['#fff4eb', '#ffc9a8'],
  ]

  return palettes.map(([top, bottom], index) => {
    const canvas = document.createElement('canvas')
    canvas.width = 360
    canvas.height = 440
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, top)
    gradient.addColorStop(1, bottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Soft portrait silhouette so frames read like real booth photos
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)'
    ctx.beginPath()
    ctx.arc(180, 148, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(180, 300, 78, 96, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.beginPath()
    ctx.arc(156, 140, 5, 0, Math.PI * 2)
    ctx.arc(204, 140, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.lineWidth = 3
    ctx.beginPath()
    if (index % 2 === 0) {
      ctx.arc(180, 162, 16, 0.1 * Math.PI, 0.9 * Math.PI)
    } else {
      ctx.moveTo(164, 158)
      ctx.lineTo(196, 158)
    }
    ctx.stroke()

    return canvas.toDataURL('image/jpeg', 0.86)
  })
}

function scaleDataUrl(dataUrl: string, targetWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = targetWidth / img.width
      canvas.width = targetWidth
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not scale preview'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => reject(new Error('Could not load preview'))
    img.src = dataUrl
  })
}

export async function loadStripDesignPreviews(): Promise<Record<StripDesignId, string>> {
  if (cache && Object.keys(cache).length === STRIP_DESIGNS.length) {
    return cache as Record<StripDesignId, string>
  }
  if (loading) return loading

  loading = (async () => {
    const shots = createPlaceholderShots()
    const takenAt = Date.UTC(2026, 0, 14)
    const entries = await Promise.all(
      STRIP_DESIGNS.map(async (design) => {
        const strip = await composeCuteStrip(shots, {
          design: design.id,
          title: 'Cuddles Club',
          takenAt,
        })
        const preview = await scaleDataUrl(strip, PREVIEW_WIDTH)
        return [design.id, preview] as const
      }),
    )

    const result = Object.fromEntries(entries) as Record<StripDesignId, string>
    cache = result
    return result
  })()

  return loading
}
