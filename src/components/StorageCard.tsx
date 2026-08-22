import { useCallback, useEffect, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import {
  fetchCoupleStorageUsage,
  formatStorageBytes,
  type CoupleStorageUsage,
} from '../lib/storageUsage'

export function StorageCard() {
  const { isConfigured, isCloud, coupleId } = useCouple()
  const [usage, setUsage] = useState<CoupleStorageUsage | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadUsage = useCallback(async () => {
    if (!isCloud || !coupleId) return
    setBusy(true)
    setError('')
    try {
      setUsage(await fetchCoupleStorageUsage(coupleId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read cloud storage.')
    } finally {
      setBusy(false)
    }
  }, [coupleId, isCloud])

  useEffect(() => {
    void loadUsage()
  }, [loadUsage])

  if (!isConfigured) {
    return (
      <section className="surface cloud-card storage-card">
        <div className="section-head section-head--tight">
          <h2>Storage</h2>
        </div>
        <p className="cloud-card__body">
          Cloud storage tracking needs Supabase connected on this build.
        </p>
      </section>
    )
  }

  if (!isCloud) {
    return (
      <section className="surface cloud-card storage-card">
        <div className="section-head section-head--tight">
          <h2>Storage</h2>
        </div>
        <p className="cloud-card__body">
          Sign in to cloud sync to see how much of the 1 GB allowance your photos and files are
          using.
        </p>
      </section>
    )
  }

  const percent = usage
    ? Math.min(100, Math.round((usage.bytes / usage.quotaBytes) * 1000) / 10)
    : 0
  const warn = percent >= 80

  return (
    <section className="surface cloud-card storage-card">
      <div className="section-head section-head--tight">
        <h2>Storage</h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void loadUsage()}
          disabled={busy}
        >
          {busy ? 'Checking…' : 'Refresh'}
        </button>
      </div>

        <p className="cloud-card__body">
          Photostrips, places, and study files in this couple space.
        </p>

      {error ? (
        <p className="cloud-card__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="storage-card__meter-wrap">
        <div
          className="storage-card__meter"
          role="meter"
          aria-label="Cloud storage used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <span
            className={`storage-card__meter-fill${warn ? ' is-warn' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="storage-card__used">
          <strong>
            {usage ? formatStorageBytes(usage.bytes) : busy ? '…' : '0 B'} of 1 GB
          </strong>
          <span>
            {usage
              ? `${usage.files} ${usage.files === 1 ? 'file' : 'files'}`
              : busy
                ? 'Reading files…'
                : ''}
          </span>
        </div>
      </div>

      {usage && usage.categories.length > 0 ? (
        <ul className="storage-card__rows">
          {usage.categories.map((row) => (
            <li key={row.id}>
              <span>{row.label}</span>
              <span>
                {formatStorageBytes(row.bytes)}
                <em>
                  {row.files} {row.files === 1 ? 'file' : 'files'}
                </em>
              </span>
            </li>
          ))}
        </ul>
      ) : !busy && !error ? (
        <p className="cloud-card__body">Nothing uploaded yet.</p>
      ) : null}

      {warn && usage ? (
        <p className="cloud-card__body">
          You are using most of the included space. Deleting old photostrips or lecture files
          frees room for new ones.
        </p>
      ) : null}
    </section>
  )
}
