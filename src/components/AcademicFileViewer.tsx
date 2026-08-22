import { useEffect, useState } from 'react'
import { academicFileLabel, academicPreviewKind } from '../lib/academicFileKind'
import type { AcademicMaterial } from '../types'

interface AcademicFileViewerProps {
  item: AcademicMaterial
  onClose: () => void
}

export function AcademicFileViewer({ item, onClose }: AcademicFileViewerProps) {
  const kind = academicPreviewKind(item.fileName)
  const [text, setText] = useState('')
  const [textError, setTextError] = useState('')

  useEffect(() => {
    if (kind !== 'text' || !item.fileUrl) return
    let cancelled = false
    setText('')
    setTextError('')
    void fetch(item.fileUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Could not read that file')
        return response.text()
      })
      .then((value) => {
        if (!cancelled) setText(value)
      })
      .catch(() => {
        if (!cancelled) setTextError('Could not read that text file.')
      })
    return () => {
      cancelled = true
    }
  }, [item.fileUrl, kind])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="acad-viewer" role="dialog" aria-modal="true" aria-label={item.title}>
      <header className="acad-viewer__bar">
        <button type="button" className="acad-viewer__close" onClick={onClose}>
          Close
        </button>
        <div className="acad-viewer__title">
          <strong>{item.title}</strong>
          <span>{item.fileName}</span>
        </div>
      </header>
      <div className="acad-viewer__stage">
        {kind === 'pdf' ? (
          <iframe className="acad-viewer__frame" title={item.title} src={item.fileUrl} />
        ) : null}
        {kind === 'image' ? (
          <img className="acad-viewer__img" src={item.fileUrl} alt={item.title} />
        ) : null}
        {kind === 'text' ? (
          textError ? (
            <p className="acad-viewer__fallback">{textError}</p>
          ) : (
            <pre className="acad-viewer__text">{text || 'Opening…'}</pre>
          )
        ) : null}
        {kind === 'other' ? (
          <div className="acad-viewer__unsupported">
            <span className="acad-viewer__ext">{academicFileLabel(item.fileName)}</span>
            <strong>Preview isn’t available</strong>
            <p>
              {academicFileLabel(item.fileName)} files stay on the desk, but they can’t open inside
              the app. Download or open them on your computer if you need to read them.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
