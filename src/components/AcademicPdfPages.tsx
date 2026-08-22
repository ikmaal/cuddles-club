import { useEffect, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ScrollRegion } from './ScrollRegion'

GlobalWorkerOptions.workerSrc = pdfWorker

interface AcademicPdfPagesProps {
  url: string
  title: string
}

export function AcademicPdfPages({ url, title }: AcademicPdfPagesProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [status, setStatus] = useState('Opening…')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!host) return
    const root = host
    let cancelled = false
    let destroyTask: (() => Promise<unknown>) | null = null

    async function renderPages() {
      setError('')
      setStatus('Opening…')
      root.replaceChildren()

      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Could not load that PDF')
        const data = new Uint8Array(await response.arrayBuffer())
        if (cancelled) return

        const loadingTask = getDocument({ data })
        destroyTask = () => loadingTask.destroy()
        const pdf = await loadingTask.promise
        if (cancelled) return

        const cssWidth = Math.max(root.clientWidth, 32)
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return
          setStatus(`Page ${pageNumber} of ${pdf.numPages}`)

          const page = await pdf.getPage(pageNumber)
          const unscaled = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: cssWidth / unscaled.width })
          const canvas = document.createElement('canvas')
          canvas.className = 'acad-viewer__page'
          canvas.width = Math.floor(viewport.width * pixelRatio)
          canvas.height = Math.floor(viewport.height * pixelRatio)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.height = `${Math.floor(viewport.height)}px`
          root.appendChild(canvas)

          const renderTask = page.render({
            canvas,
            viewport,
            ...(pixelRatio === 1
              ? {}
              : { transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] }),
          })
          await renderTask.promise
        }

        if (!cancelled) setStatus('')
      } catch {
        if (!cancelled) {
          setError('Could not open that PDF in the app.')
          setStatus('')
        }
      }
    }

    void renderPages()

    return () => {
      cancelled = true
      void destroyTask?.()
      root.replaceChildren()
    }
  }, [host, url])

  return (
    <ScrollRegion className="acad-viewer__pages">
      <div ref={setHost} className="acad-viewer__pdf" />
      {status ? <p className="acad-viewer__status">{status}</p> : null}
      {error ? (
        <div className="acad-viewer__unsupported">
          <strong>{error}</strong>
          <p>Open it in the browser to read every page.</p>
          <a
            className="acad-viewer__open"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open {title}
          </a>
        </div>
      ) : null}
    </ScrollRegion>
  )
}
