/** Compose four captured photos into a decorated photostrip. */

import type { StripDesignId } from './stripDesigns'

const STRIP_W = 420
const STRIP_H = 1260

export async function composeCuteStrip(
  shots: string[],
  options?: {
    title?: string
    takenAt?: number
    design?: StripDesignId
  },
): Promise<string> {
  if (shots.length !== 4) {
    throw new Error('A booth strip needs exactly 4 photos')
  }

  const design = options?.design ?? 'cute'
  const images = await Promise.all(shots.map(loadImage))
  const canvas = document.createElement('canvas')
  canvas.width = STRIP_W
  canvas.height = STRIP_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the strip')

  switch (design) {
    case 'classic':
      drawClassicStrip(ctx, images, options?.title, options?.takenAt)
      break
    case 'dateNight':
      drawDateNightStrip(ctx, images, options?.title, options?.takenAt)
      break
    case 'polaroid':
      drawPolaroidStrip(ctx, images, options?.title, options?.takenAt)
      break
    case 'retro':
      drawRetroStrip(ctx, images, options?.title, options?.takenAt)
      break
    case 'cute':
    default:
      drawCuteStrip(ctx, images, options?.title, options?.takenAt)
      break
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

/* ---------- Cute (original) ---------- */

function drawCuteStrip(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  title?: string,
  takenAt?: number,
) {
  const paper = ctx.createLinearGradient(0, 0, 0, STRIP_H)
  paper.addColorStop(0, '#fff7f2')
  paper.addColorStop(1, '#ffe9ef')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  ctx.strokeStyle = '#f0cfd8'
  ctx.lineWidth = 10
  roundRect(ctx, 8, 8, STRIP_W - 16, STRIP_H - 16, 28)
  ctx.stroke()

  drawCuteHeader(ctx)
  drawCuteSideCritters(ctx)

  const layout = frameLayout(92, 78)
  images.forEach((img, index) => {
    const y = layout.top + index * (layout.frameH + layout.gap)
    drawMatteFrame(ctx, img, layout.insetX, y, layout.frameW, layout.frameH, index, 'cute')
  })

  drawFooter(ctx, title, takenAt, {
    titleColor: '#c44569',
    dateColor: '#a37a84',
    accent: '#e85d75',
  })
}

function drawCuteHeader(ctx: CanvasRenderingContext2D) {
  drawStar(ctx, 48, 42, 9, '#ffd933')
  drawStar(ctx, STRIP_W - 52, 38, 8, '#ffb3c3')
  drawHeart(ctx, 86, 36, 10, '#e85d75')
  drawHeart(ctx, STRIP_W - 88, 44, 9, '#ff8fa8')
  drawMiniCat(ctx, 140, 48, 0.55, '#f4c7a5')
  drawMiniCat(ctx, STRIP_W - 140, 48, 0.55, '#e8b4c8')
  ctx.fillStyle = '#c44569'
  ctx.font = '700 20px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('♡ booth cuties ♡', STRIP_W / 2, 52)
}

function drawCuteSideCritters(ctx: CanvasRenderingContext2D) {
  const spots = [
    { x: 24, y: 220, kind: 'heart' as const, c: '#ff8fa8', s: 9 },
    { x: STRIP_W - 24, y: 280, kind: 'star' as const, c: '#ffd933', s: 8 },
    { x: 22, y: 470, kind: 'cat' as const, c: '#f4c7a5', s: 0.42 },
    { x: STRIP_W - 22, y: 540, kind: 'heart' as const, c: '#e85d75', s: 10 },
    { x: 24, y: 760, kind: 'star' as const, c: '#d194ff', s: 8 },
    { x: STRIP_W - 24, y: 820, kind: 'cat' as const, c: '#ffc9b5', s: 0.42 },
    { x: 24, y: 1000, kind: 'heart' as const, c: '#ffb3c3', s: 9 },
    { x: STRIP_W - 24, y: 1040, kind: 'star' as const, c: '#17b5a6', s: 7 },
  ]
  for (const spot of spots) {
    if (spot.kind === 'heart') drawHeart(ctx, spot.x, spot.y, spot.s, spot.c)
    else if (spot.kind === 'star') drawStar(ctx, spot.x, spot.y, spot.s, spot.c)
    else drawMiniCat(ctx, spot.x, spot.y, spot.s, spot.c)
  }
}

/* ---------- Film classic ---------- */

function drawClassicStrip(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  title?: string,
  takenAt?: number,
) {
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  drawFilmPerforations(ctx, 0, 0, STRIP_W, STRIP_H)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = '700 16px Fredoka, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.18em'
  ctx.fillText('PHOTO BOOTH', STRIP_W / 2, 48)
  ctx.letterSpacing = '0em'

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(56, 58)
  ctx.lineTo(STRIP_W - 56, 58)
  ctx.stroke()

  const layout = frameLayout(72, 72, 56, 14)
  images.forEach((img, index) => {
    const y = layout.top + index * (layout.frameH + layout.gap)
    drawMatteFrame(ctx, img, layout.insetX, y, layout.frameW, layout.frameH, index, 'classic')
  })

  drawFooter(ctx, title, takenAt, {
    titleColor: '#1a1a1a',
    dateColor: '#575757',
    accent: '#1a1a1a',
    font: '600 16px Fredoka, system-ui, sans-serif',
  })
}

function drawFilmPerforations(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const holeW = 14
  const holeH = 10
  const gap = 16
  const cols = 2

  for (let col = 0; col < cols; col += 1) {
    const hx = col === 0 ? x + 8 : x + w - 8 - holeW
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(hx - 2, y, holeW + 4, h)

    let hy = y + 24
    while (hy < y + h - 24) {
      ctx.fillStyle = '#f5f0e8'
      roundRect(ctx, hx, hy, holeW, holeH, 2)
      ctx.fill()
      ctx.strokeStyle = '#c8c0b4'
      ctx.lineWidth = 1
      roundRect(ctx, hx, hy, holeW, holeH, 2)
      ctx.stroke()
      hy += holeH + gap
    }
  }
}

/* ---------- Date night ---------- */

function drawDateNightStrip(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  title?: string,
  takenAt?: number,
) {
  const paper = ctx.createLinearGradient(0, 0, 0, STRIP_H)
  paper.addColorStop(0, '#3d2a5c')
  paper.addColorStop(0.5, '#2a1d42')
  paper.addColorStop(1, '#1f1435')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  ctx.strokeStyle = 'rgba(255, 217, 51, 0.35)'
  ctx.lineWidth = 8
  roundRect(ctx, 10, 10, STRIP_W - 20, STRIP_H - 20, 24)
  ctx.stroke()

  // Gold sparkles
  const sparkles = [
    [52, 38, 7],
    [STRIP_W - 48, 44, 6],
    [90, 52, 5],
    [STRIP_W - 92, 36, 5],
    [36, 400, 5],
    [STRIP_W - 36, 680, 5],
    [40, 960, 6],
    [STRIP_W - 42, 1100, 5],
  ] as const
  for (const [sx, sy, size] of sparkles) {
    drawStar(ctx, sx, sy, size, '#ffd933')
  }

  drawHeart(ctx, 120, 46, 8, '#ff8fa8')
  drawHeart(ctx, STRIP_W - 120, 46, 8, '#ff8fa8')

  ctx.fillStyle = '#ffd933'
  ctx.font = '700 20px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('♡ date night ♡', STRIP_W / 2, 52)

  const layout = frameLayout(88, 76)
  images.forEach((img, index) => {
    const y = layout.top + index * (layout.frameH + layout.gap)
    drawMatteFrame(ctx, img, layout.insetX, y, layout.frameW, layout.frameH, index, 'dateNight')
  })

  drawFooter(ctx, title, takenAt, {
    titleColor: '#ffd933',
    dateColor: 'rgba(255, 255, 255, 0.65)',
    accent: '#ff8fa8',
  })
}

/* ---------- Polaroid ---------- */

function drawPolaroidStrip(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  title?: string,
  takenAt?: number,
) {
  ctx.fillStyle = '#fffdf8'
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  ctx.strokeStyle = '#e8e0d4'
  ctx.lineWidth = 6
  roundRect(ctx, 8, 8, STRIP_W - 16, STRIP_H - 16, 20)
  ctx.stroke()

  drawHeart(ctx, 72, 40, 8, '#5b9a8b')
  drawHeart(ctx, STRIP_W - 72, 40, 8, '#5b9a8b')

  ctx.fillStyle = '#3d5c54'
  ctx.font = '700 22px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('our moments', STRIP_W / 2, 50)

  const layout = frameLayout(80, 70, 44, 22)
  images.forEach((img, index) => {
    const y = layout.top + index * (layout.frameH + layout.gap)
    drawPolaroidFrame(ctx, img, layout.insetX, y, layout.frameW, layout.frameH, index)
  })

  drawFooter(ctx, title, takenAt, {
    titleColor: '#3d5c54',
    dateColor: '#8c8c8c',
    accent: '#5b9a8b',
  })
}

function drawPolaroidFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
) {
  const padTop = 10
  const padSide = 10
  const padBottom = 28
  const totalH = h + padTop + padBottom

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(26, 26, 26, 0.12)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  roundRect(ctx, x - padSide, y - padTop, w + padSide * 2, totalH, 6)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.save()
  roundRect(ctx, x, y, w, h, 2)
  ctx.clip()
  drawCover(ctx, img, x, y, w, h)
  ctx.restore()

  if (index % 2 === 0) {
    drawHeart(ctx, x + w - 14, y + 14, 7, '#5b9a8b')
  } else {
    drawStar(ctx, x + 14, y + h - 10, 6, '#b1eaba')
  }
}

/* ---------- Retro ---------- */

function drawRetroStrip(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  title?: string,
  takenAt?: number,
) {
  const paper = ctx.createLinearGradient(0, 0, 0, STRIP_H)
  paper.addColorStop(0, '#f4e4c8')
  paper.addColorStop(1, '#e8d4b0')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  ctx.strokeStyle = '#d4a574'
  ctx.lineWidth = 8
  roundRect(ctx, 8, 8, STRIP_W - 16, STRIP_H - 16, 16)
  ctx.stroke()

  // Sunburst corners
  drawSunburst(ctx, 50, 46, 22, '#f76708')
  drawSunburst(ctx, STRIP_W - 50, 46, 22, '#f76708')

  ctx.fillStyle = '#9e3105'
  ctx.font = '700 22px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('retro booth', STRIP_W / 2, 52)

  // Dotted line divider
  ctx.strokeStyle = 'rgba(158, 49, 5, 0.25)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 6])
  ctx.beginPath()
  ctx.moveTo(60, 64)
  ctx.lineTo(STRIP_W - 60, 64)
  ctx.stroke()
  ctx.setLineDash([])

  const layout = frameLayout(84, 74)
  images.forEach((img, index) => {
    const y = layout.top + index * (layout.frameH + layout.gap)
    drawMatteFrame(ctx, img, layout.insetX, y, layout.frameW, layout.frameH, index, 'retro')
  })

  drawFooter(ctx, title, takenAt, {
    titleColor: '#9e3105',
    dateColor: '#a55f03',
    accent: '#f76708',
  })
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * Math.PI) / 4
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
    ctx.stroke()
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.fill()
}

/* ---------- Shared frame & layout ---------- */

function frameLayout(top = 92, bottom = 78, insetX = 48, gap = 18) {
  const frameW = STRIP_W - insetX * 2
  const frameH = (STRIP_H - top - bottom - gap * 3) / 4
  return { insetX, top, bottom, gap, frameW, frameH }
}

type FrameStyle = 'cute' | 'classic' | 'dateNight' | 'retro'

function drawMatteFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
  style: FrameStyle,
) {
  const mats: Record<FrameStyle, { mat: string; shadow: string; rim: string }> = {
    cute: { mat: '#ffffff', shadow: 'rgba(196, 69, 105, 0.14)', rim: 'rgba(255,255,255,0.85)' },
    classic: { mat: '#ffffff', shadow: 'rgba(26, 26, 26, 0.18)', rim: 'rgba(0,0,0,0.08)' },
    dateNight: { mat: '#fff8f0', shadow: 'rgba(0, 0, 0, 0.35)', rim: 'rgba(255, 217, 51, 0.4)' },
    retro: { mat: '#fffaf0', shadow: 'rgba(158, 49, 5, 0.15)', rim: 'rgba(255,255,255,0.7)' },
  }
  const { mat, shadow, rim } = mats[style]

  ctx.fillStyle = mat
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, style === 'classic' ? 8 : 18)
  ctx.fill()
  ctx.shadowColor = shadow
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  ctx.fillStyle = mat
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, style === 'classic' ? 8 : 18)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.save()
  roundRect(ctx, x, y, w, h, style === 'classic' ? 4 : 14)
  ctx.clip()
  if (style === 'classic') {
    drawCoverGrayscale(ctx, img, x, y, w, h)
  } else {
    drawCover(ctx, img, x, y, w, h)
  }
  ctx.restore()

  ctx.strokeStyle = rim
  ctx.lineWidth = style === 'classic' ? 2 : 3
  roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, style === 'classic' ? 3 : 13)
  ctx.stroke()

  if (style === 'cute') drawCuteFrameStickers(ctx, x, y, w, h, index)
  else if (style === 'dateNight') drawDateNightFrameStickers(ctx, x, y, w, h, index)
  else if (style === 'retro') drawRetroFrameStickers(ctx, x, y, w, h, index)
}

function drawCuteFrameStickers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
) {
  const stickers = [
    () => {
      drawHeart(ctx, x + 18, y + 18, 11, '#e85d75')
      drawStar(ctx, x + w - 18, y + 18, 9, '#ffd933')
    },
    () => {
      drawMiniCat(ctx, x + 20, y + 20, 0.38, '#f4c7a5')
      drawHeart(ctx, x + w - 18, y + h - 18, 10, '#ff8fa8')
    },
    () => {
      drawStar(ctx, x + 18, y + h - 18, 9, '#d194ff')
      drawHeart(ctx, x + w - 18, y + 18, 11, '#17b5a6')
    },
    () => {
      drawHeart(ctx, x + 18, y + 18, 10, '#ff8fa8')
      drawMiniCat(ctx, x + w - 20, y + h - 20, 0.38, '#e8b4c8')
    },
  ]
  stickers[index]?.()
}

function drawDateNightFrameStickers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
) {
  if (index % 2 === 0) {
    drawStar(ctx, x + 16, y + 16, 7, '#ffd933')
  } else {
    drawHeart(ctx, x + w - 16, y + h - 16, 8, '#ff8fa8')
  }
}

function drawRetroFrameStickers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  _h: number,
  index: number,
) {
  const colors = ['#f76708', '#ffd933', '#ca3e07', '#f09800']
  drawStar(ctx, x + w - 16, y + 16, 7, colors[index % colors.length])
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  title: string | undefined,
  takenAt: number | undefined,
  colors: {
    titleColor: string
    dateColor: string
    accent: string
    font?: string
  },
) {
  const date = new Date(takenAt ?? Date.now())
  const label = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  drawHeart(ctx, STRIP_W / 2 - 70, STRIP_H - 42, 8, colors.accent)
  drawHeart(ctx, STRIP_W / 2 + 70, STRIP_H - 42, 8, colors.accent)

  ctx.fillStyle = colors.titleColor
  ctx.font = colors.font ?? '700 18px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(title?.trim() || 'Cuddles Club', STRIP_W / 2, STRIP_H - 48)

  ctx.fillStyle = colors.dateColor
  ctx.font = '600 13px Fredoka, system-ui, sans-serif'
  ctx.fillText(label, STRIP_W / 2, STRIP_H - 26)
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const dx = x + (w - dw) / 2
  const dy = y + (h - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

function drawCoverGrayscale(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.filter = 'grayscale(1) contrast(1.05)'
  drawCover(ctx, img, x, y, w, h)
  ctx.filter = 'none'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load a booth photo'))
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  const s = size / 2
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.7)
  ctx.bezierCurveTo(cx, cy + s * 0.2, cx - s, cy - s * 0.1, cx - s, cy - s * 0.55)
  ctx.bezierCurveTo(cx - s, cy - s * 1.1, cx, cy - s * 0.95, cx, cy - s * 0.45)
  ctx.bezierCurveTo(cx, cy - s * 0.95, cx + s, cy - s * 1.1, cx + s, cy - s * 0.55)
  ctx.bezierCurveTo(cx + s, cy - s * 0.1, cx, cy + s * 0.2, cx, cy + s * 0.7)
  ctx.fill()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI / 2) * 3 + i * ((Math.PI * 2) / 5)
    const outer = size
    const inner = size * 0.42
    const ox = cx + Math.cos(angle) * outer
    const oy = cy + Math.sin(angle) * outer
    if (i === 0) ctx.moveTo(ox, oy)
    else ctx.lineTo(ox, oy)
    const ia = angle + Math.PI / 5
    ctx.lineTo(cx + Math.cos(ia) * inner, cy + Math.sin(ia) * inner)
  }
  ctx.closePath()
  ctx.fill()
}

function drawMiniCat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  color: string,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 8, 18, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, -6, 14, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-12, -10)
  ctx.lineTo(-16, -24)
  ctx.lineTo(-4, -14)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(12, -10)
  ctx.lineTo(16, -24)
  ctx.lineTo(4, -14)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#5c4636'
  ctx.beginPath()
  ctx.arc(-5, -7, 1.8, 0, Math.PI * 2)
  ctx.arc(5, -7, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e85d75'
  ctx.beginPath()
  ctx.moveTo(0, -2)
  ctx.lineTo(-2.5, 1)
  ctx.lineTo(2.5, 1)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
