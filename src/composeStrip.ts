/** Compose four captured photos into a cute character photostrip. */

const STRIP_W = 420
const STRIP_H = 1260

export async function composeCuteStrip(
  shots: string[],
  options?: { title?: string; takenAt?: number },
): Promise<string> {
  if (shots.length !== 4) {
    throw new Error('A booth strip needs exactly 4 photos')
  }

  const images = await Promise.all(shots.map(loadImage))
  const canvas = document.createElement('canvas')
  canvas.width = STRIP_W
  canvas.height = STRIP_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the strip')

  // Paper background
  const paper = ctx.createLinearGradient(0, 0, 0, STRIP_H)
  paper.addColorStop(0, '#fff7f2')
  paper.addColorStop(1, '#ffe9ef')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  // Soft outer border
  ctx.strokeStyle = '#f0cfd8'
  ctx.lineWidth = 10
  roundRect(ctx, 8, 8, STRIP_W - 16, STRIP_H - 16, 28)
  ctx.stroke()

  // Header decorations
  drawHeader(ctx)
  drawSideCritters(ctx)

  const insetX = 48
  const top = 92
  const bottom = 78
  const gap = 18
  const frameW = STRIP_W - insetX * 2
  const frameH = (STRIP_H - top - bottom - gap * 3) / 4

  images.forEach((img, index) => {
    const y = top + index * (frameH + gap)
    drawPhotoFrame(ctx, img, insetX, y, frameW, frameH, index)
  })

  drawFooter(ctx, options?.title, options?.takenAt)

  return canvas.toDataURL('image/jpeg', 0.92)
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  // Little stars and hearts across the top
  drawStar(ctx, 48, 42, 9, '#ffd933')
  drawStar(ctx, STRIP_W - 52, 38, 8, '#ffb3c3')
  drawHeart(ctx, 86, 36, 10, '#e85d75')
  drawHeart(ctx, STRIP_W - 88, 44, 9, '#ff8fa8')

  // Tiny cats peeking
  drawMiniCat(ctx, 140, 48, 0.55, '#f4c7a5')
  drawMiniCat(ctx, STRIP_W - 140, 48, 0.55, '#e8b4c8')

  ctx.fillStyle = '#c44569'
  ctx.font = '700 20px Fraunces, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('♡ booth cuties ♡', STRIP_W / 2, 52)
}

function drawSideCritters(ctx: CanvasRenderingContext2D) {
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

function drawPhotoFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
) {
  // Mat / polaroid edge
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 18)
  ctx.fill()
  ctx.shadowColor = 'rgba(196, 69, 105, 0.14)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 18)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Clip photo
  ctx.save()
  roundRect(ctx, x, y, w, h, 14)
  ctx.clip()
  drawCover(ctx, img, x, y, w, h)
  ctx.restore()

  // Soft white rim
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 3
  roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 13)
  ctx.stroke()

  // Corner stickers rotate by frame
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

function drawFooter(
  ctx: CanvasRenderingContext2D,
  title?: string,
  takenAt?: number,
) {
  const date = new Date(takenAt ?? Date.now())
  const label = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  drawHeart(ctx, STRIP_W / 2 - 70, STRIP_H - 42, 8, '#e85d75')
  drawHeart(ctx, STRIP_W / 2 + 70, STRIP_H - 42, 8, '#ff8fa8')

  ctx.fillStyle = '#c44569'
  ctx.font = '700 18px Fraunces, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(title?.trim() || 'Cuddles Club', STRIP_W / 2, STRIP_H - 48)

  ctx.fillStyle = '#a37a84'
  ctx.font = '600 13px Inter, system-ui, sans-serif'
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
