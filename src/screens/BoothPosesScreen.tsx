import { useRef, useState } from 'react'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { ScreenHeader } from '../components/ScreenHeader'
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
      <ScreenHeader
        title="Poses"
        onBack={onBack}
        action={
          <button
            type="button"
            className="strip-add-btn"
            onClick={() => {
              clearError()
              inputRef.current?.click()
            }}
            disabled={busy}
            aria-label="Upload pose photos"
            title="Upload"
          >
            <PlusIcon size={20} />
          </button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void onFileChange(event)}
      />

      <ScrollRegion className="screen__scroll">
        {error ? (
          <p className="strip-error" role="alert">
            {error}
          </p>
        ) : null}

        {!ready ? (
          <div className="empty">
            <p className="empty__title">Opening gallery…</p>
          </div>
        ) : poses.length === 0 ? (
          <div className="album-empty">
            <p className="album-empty__title">No pose photos yet</p>
            <p className="album-empty__body">
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
