/** Proportions matched to a classic instant print (thin sides/top, compact caption band). */
export const POLAROID_W = 750
export const PHOTO_INSET = 22
export const PHOTO_TOP = 22
export const PHOTO_SIZE = POLAROID_W - PHOTO_INSET * 2
/** Bottom white strip — room to write with the marker. */
export const CAPTION_BAND = Math.round(POLAROID_W * 0.18)
export const POLAROID_H = PHOTO_TOP + PHOTO_SIZE + CAPTION_BAND

/**
 * Capture a clean camera frame and mount it inside a polaroid paper frame.
 * Optional flash boost brightens the print like an instant-camera flash.
 */
export async function composePolaroid(
  source: CanvasImageSource,
  options?: {
    mirror?: boolean
    sourceWidth?: number
    sourceHeight?: number
    /** Brighten the photo as if lit by camera flash. */
    flash?: boolean
  },
): Promise<string> {
  const mirror = options?.mirror ?? false
  const flash = options?.flash ?? true

  const srcW =
    options?.sourceWidth ??
    ('videoWidth' in source && typeof source.videoWidth === 'number'
      ? source.videoWidth
      : 'width' in source && typeof source.width === 'number'
        ? Number(source.width)
        : PHOTO_SIZE)
  const srcH =
    options?.sourceHeight ??
    ('videoHeight' in source && typeof source.videoHeight === 'number'
      ? source.videoHeight
      : 'height' in source && typeof source.height === 'number'
        ? Number(source.height)
        : PHOTO_SIZE)

  if (!srcW || !srcH) throw new Error('Camera frame was empty')

  const photo = document.createElement('canvas')
  photo.width = PHOTO_SIZE
  photo.height = PHOTO_SIZE
  const pctx = photo.getContext('2d')
  if (!pctx) throw new Error('Could not prepare the polaroid')

  const scale = Math.max(PHOTO_SIZE / srcW, PHOTO_SIZE / srcH)
  const drawW = srcW * scale
  const drawH = srcH * scale
  const dx = (PHOTO_SIZE - drawW) / 2
  const dy = (PHOTO_SIZE - drawH) / 2

  pctx.save()
  if (mirror) {
    pctx.translate(PHOTO_SIZE, 0)
    pctx.scale(-1, 1)
    pctx.drawImage(source, dx, dy, drawW, drawH)
  } else {
    pctx.drawImage(source, dx, dy, drawW, drawH)
  }
  pctx.restore()

  if (flash) applyFlashLook(pctx, PHOTO_SIZE, PHOTO_SIZE)

  const frame = document.createElement('canvas')
  frame.width = POLAROID_W
  frame.height = POLAROID_H
  const ctx = frame.getContext('2d')
  if (!ctx) throw new Error('Could not create the polaroid')

  // Classic bright white polaroid stock
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, POLAROID_W, POLAROID_H)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 1
  ctx.fillStyle = '#111'
  ctx.fillRect(PHOTO_INSET - 1, PHOTO_TOP - 1, PHOTO_SIZE + 2, PHOTO_SIZE + 2)
  ctx.restore()

  ctx.drawImage(photo, PHOTO_INSET, PHOTO_TOP)

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, POLAROID_W - 2, POLAROID_H - 2)

  return frame.toDataURL('image/jpeg', 0.92)
}

/** Clean flash-photo look: brighter midtones, crisp contrast — not vintage. */
function applyFlashLook(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const image = ctx.getImageData(0, 0, w, h)
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r = r * 1.12 + 10
    g = g * 1.12 + 10
    b = b * 1.1 + 8

    r = (r - 128) * 1.08 + 128
    g = (g - 128) * 1.08 + 128
    b = (b - 128) * 1.06 + 128

    data[i] = clamp(r)
    data[i + 1] = clamp(g)
    data[i + 2] = clamp(b)
  }

  ctx.putImageData(image, 0, 0)

  const fill = ctx.createRadialGradient(w * 0.5, h * 0.35, w * 0.1, w * 0.5, h * 0.45, w * 0.85)
  fill.addColorStop(0, 'rgba(255, 255, 255, 0.14)')
  fill.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, w, h)
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}
