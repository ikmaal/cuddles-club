import { useRef, useState } from 'react'
import { BackIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { useBoothPoses } from '../hooks/useBoothPoses'
import type { BoothPosePhoto } from '../types'

interface BoothPosesScreenProps {
  onBack: () => void
}

export function BoothPosesScreen({ onBack }: BoothPosesScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { poses, ready, busy, error, addFromFile, remove, clearError } =
    useBoothPoses()
  const [active, setActive] = useState<BoothPosePhoto | null>(null)

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    clearError()
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await addFromFile(file)
    }
  }

  return (
    <div className="screen screen--strips screen--poses">
      <header className="booth-subhead">
        <button type="button" className="booth-back" onClick={onBack} aria-label="Back">
          <BackIcon size={20} />
        </button>
        <h1>poses</h1>
        <button
          type="button"
          className="booth-subhead__action"
          onClick={() => {
            clearError()
            inputRef.current?.click()
          }}
          disabled={busy}
          aria-label="Upload pose photos"
        >
          <PlusIcon size={20} />
        </button>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void onFileChange(event)}
      />

      <ScrollRegion className="screen__scroll booth-scroll">
        {error ? (
          <p className="strip-error" role="alert">
            {error}
          </p>
        ) : null}

        {!ready ? (
          <p className="booth-empty">Opening gallery…</p>
        ) : poses.length === 0 ? (
          <div className="booth-empty-block">
            <p className="booth-empty__title">No pose photos yet</p>
            <p className="booth-empty">
              Upload screenshots or photos of poses you want to try next time.
            </p>
          </div>
        ) : (
          <ul className="poses-gallery" aria-label="Pose photos">
            {poses.map((pose) => (
              <li key={pose.id} className="poses-gallery__item">
                <button
                  type="button"
                  className="poses-gallery__open"
                  onClick={() => setActive(pose)}
                >
                  <img src={pose.image} alt="" />
                </button>
                <button
                  type="button"
                  className="poses-gallery__delete"
                  onClick={() => {
                    if (window.confirm('Remove this pose photo?')) {
                      void remove(pose.id)
                      if (active?.id === pose.id) setActive(null)
                    }
                  }}
                  aria-label="Delete pose photo"
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollRegion>

      {active ? (
        <div
          className="poses-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Pose preview"
          onClick={() => setActive(null)}
        >
          <img src={active.image} alt="" onClick={(event) => event.stopPropagation()} />
          <button
            type="button"
            className="poses-lightbox__close"
            onClick={() => setActive(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}
