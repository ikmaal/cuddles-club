import { createId } from './hooks/useStored'
import type { Photostrip } from './types'

const DB_NAME = 'cuddles-club-strips'
const STORE = 'strips'
const DB_VERSION = 1
export const SAMPLE_STRIP_ID = 'sample-booth-strip'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open strips database'))
  })
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = work(tx.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Strip storage failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function listStrips(): Promise<Photostrip[]> {
  const rows = await run('readonly', (store) => store.getAll())
  return (rows as Photostrip[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putStrip(strip: Photostrip): Promise<void> {
  await run('readwrite', (store) => store.put(strip))
}

export async function deleteStrip(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

/** If the vault is empty, drop in one demo strip so the 3D viewer is testable. */
export async function ensureSampleStrip(): Promise<Photostrip[]> {
  const existing = await listStrips()
  if (existing.length > 0) return existing

  const sample: Photostrip = {
    id: SAMPLE_STRIP_ID,
    title: 'Sample booth strip',
    image: drawSampleStrip(),
    createdAt: Date.now(),
  }
  await putStrip(sample)
  return [sample]
}

/** Hand-drawn 4-frame booth strip used as the demo entry. */
function drawSampleStrip(): string {
  const width = 360
  const height = 1080
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#fff8f4'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#ead7cf'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, width - 8, height - 8)

  const frames = [
    { bg: ['#ffe4ea', '#ffd0da'], draw: drawWave },
    { bg: ['#eefbfb', '#d9f3f1'], draw: drawKiss },
    { bg: ['#fff4eb', '#ffe0c8'], draw: drawCat },
    { bg: ['#fbf0ff', '#eed8ff'], draw: drawHearts },
  ] as const

  const inset = 28
  const gap = 18
  const frameH = (height - inset * 2 - gap * 3) / 4

  frames.forEach((frame, index) => {
    const y = inset + index * (frameH + gap)
    const x = inset
    const w = width - inset * 2
    const h = frameH

    const gradient = ctx.createLinearGradient(x, y, x, y + h)
    gradient.addColorStop(0, frame.bg[0])
    gradient.addColorStop(1, frame.bg[1])
    ctx.fillStyle = gradient
    roundRect(ctx, x, y, w, h, 18)
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, x, y, w, h, 18)
    ctx.clip()
    frame.draw(ctx, x, y, w, h)
    ctx.restore()

    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 3
    roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 16)
    ctx.stroke()
  })

  ctx.fillStyle = '#c44569'
  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Cuddles Club', width / 2, height - 10)

  return canvas.toDataURL('image/jpeg', 0.92)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2
  const cy = y + h * 0.58
  drawPerson(ctx, cx - 48, cy, '#e85d75', true)
  drawPerson(ctx, cx + 48, cy, '#17b5a6', false)
  ctx.fillStyle = '#c44569'
  ctx.font = '700 22px Fraunces, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('hi ♥', cx, y + 42)
}

function drawKiss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2
  const cy = y + h * 0.55
  drawPerson(ctx, cx - 36, cy, '#e85d75', true)
  drawPerson(ctx, cx + 36, cy, '#17b5a6', false)
  ctx.fillStyle = '#e85d75'
  ctx.beginPath()
  heartPath(ctx, cx, cy - 18, 16)
  ctx.fill()
}

function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2
  const cy = y + h * 0.55
  ctx.fillStyle = '#f4c7a5'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 18, 52, 40, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx, cy - 18, 38, 34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 34, cy - 28)
  ctx.lineTo(cx - 48, cy - 62)
  ctx.lineTo(cx - 10, cy - 42)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 34, cy - 28)
  ctx.lineTo(cx + 48, cy - 62)
  ctx.lineTo(cx + 10, cy - 42)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#2f6d5f'
  ctx.beginPath()
  ctx.ellipse(cx - 12, cy - 20, 6, 8, 0, 0, Math.PI * 2)
  ctx.ellipse(cx + 12, cy - 20, 6, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e85d75'
  ctx.beginPath()
  ctx.moveTo(cx, cy - 8)
  ctx.lineTo(cx - 5, cy - 2)
  ctx.lineTo(cx + 5, cy - 2)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#c44569'
  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Mochi says hi', cx, y + h - 28)
}

function drawHearts(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2
  const cy = y + h * 0.5
  const hearts = [
    { dx: 0, dy: -10, s: 34, c: '#e85d75' },
    { dx: -48, dy: 28, s: 18, c: '#ff8fa8' },
    { dx: 52, dy: 18, s: 22, c: '#c44569' },
    { dx: -20, dy: 48, s: 12, c: '#ffb3c3' },
    { dx: 28, dy: 52, s: 14, c: '#ff8fa8' },
  ]
  for (const heart of hearts) {
    ctx.fillStyle = heart.c
    ctx.beginPath()
    heartPath(ctx, cx + heart.dx, cy + heart.dy, heart.s)
    ctx.fill()
  }
}

function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  left: boolean,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y - 38, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x, y + 18, 28, 36, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + (left ? 18 : -18), y - 4)
  ctx.quadraticCurveTo(
    x + (left ? 48 : -48),
    y - 40,
    x + (left ? 36 : -36),
    y - 58,
  )
  ctx.stroke()
}

function heartPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const s = size / 2
  ctx.moveTo(cx, cy + s * 0.7)
  ctx.bezierCurveTo(cx, cy + s * 0.2, cx - s, cy - s * 0.1, cx - s, cy - s * 0.55)
  ctx.bezierCurveTo(cx - s, cy - s * 1.1, cx, cy - s * 0.95, cx, cy - s * 0.45)
  ctx.bezierCurveTo(cx, cy - s * 0.95, cx + s, cy - s * 1.1, cx + s, cy - s * 0.55)
  ctx.bezierCurveTo(cx + s, cy - s * 0.1, cx, cy + s * 0.2, cx, cy + s * 0.7)
}

/** Shrink a photo so strips stay light in IndexedDB. */
export function compressImage(file: File, maxEdge = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not prepare the image'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    img.src = url
  })
}

export async function createStripFromFile(
  file: File,
  title: string,
): Promise<Photostrip> {
  const image = await compressImage(file)
  return {
    id: createId(),
    title: title.trim() || defaultTitle(file.name),
    image,
    createdAt: Date.now(),
  }
}

export function createStripFromDataUrl(image: string, title: string): Photostrip {
  return {
    id: createId(),
    title: title.trim().slice(0, 40) || 'Booth strip',
    image,
    createdAt: Date.now(),
  }
}

function defaultTitle(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  return base.slice(0, 40) || 'Photo strip'
}
