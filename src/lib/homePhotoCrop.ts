/** Cover-style crop math for the home photo rectangle. */

export function coverScale(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
  zoom: number,
): number {
  return Math.max(viewWidth / imageWidth, viewHeight / imageHeight) * Math.max(1, zoom)
}

export function clampPan(
  panX: number,
  panY: number,
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
  scale: number,
): { x: number; y: number } {
  const drawnW = imageWidth * scale
  const drawnH = imageHeight * scale
  const baseX = (viewWidth - drawnW) / 2
  const baseY = (viewHeight - drawnH) / 2
  const left = baseX + panX
  const top = baseY + panY

  const clampedLeft = Math.min(0, Math.max(viewWidth - drawnW, left))
  const clampedTop = Math.min(0, Math.max(viewHeight - drawnH, top))

  return {
    x: clampedLeft - baseX,
    y: clampedTop - baseY,
  }
}

export function cropCoverToDataUrl(
  image: HTMLImageElement,
  viewWidth: number,
  viewHeight: number,
  panX: number,
  panY: number,
  zoom: number,
  outputMaxEdge = 1200,
  quality = 0.88,
): string {
  const scale = coverScale(image.naturalWidth, image.naturalHeight, viewWidth, viewHeight, zoom)
  const pan = clampPan(
    panX,
    panY,
    image.naturalWidth,
    image.naturalHeight,
    viewWidth,
    viewHeight,
    scale,
  )

  const drawnW = image.naturalWidth * scale
  const drawnH = image.naturalHeight * scale
  const left = (viewWidth - drawnW) / 2 + pan.x
  const top = (viewHeight - drawnH) / 2 + pan.y

  const sx = Math.max(0, -left / scale)
  const sy = Math.max(0, -top / scale)
  const sw = Math.min(image.naturalWidth - sx, viewWidth / scale)
  const sh = Math.min(image.naturalHeight - sy, viewHeight / scale)

  const aspect = viewWidth / viewHeight
  const targetW =
    aspect >= 1
      ? Math.min(outputMaxEdge, Math.round(viewWidth * 3))
      : Math.min(outputMaxEdge, Math.round(viewHeight * 3 * aspect))
  const targetH = Math.max(1, Math.round(targetW / aspect))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, targetW)
  canvas.height = Math.max(1, targetH)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not crop the image')

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}
