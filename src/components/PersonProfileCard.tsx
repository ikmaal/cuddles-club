import { useEffect, useRef, useState } from 'react'
import { CameraIcon, CheckIcon, PencilIcon } from './Icons'
import {
  COLOR_PRESETS,
  LOVE_LANGUAGES,
  ageFromBirthday,
  formatBirthday,
  normalizePerson,
  zodiacFromBirthday,
} from '../lib/personProfile'
import type { PersonProfile } from '../types'

interface PersonProfileCardProps {
  who: 'you' | 'partner'
  name: string
  person: PersonProfile
  busy?: boolean
  onSave: (next: { name: string; person: PersonProfile }) => void | Promise<void>
}

function memberSerial(who: 'you' | 'partner', name: string): string {
  let hash = who === 'you' ? 17 : 41
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000
  }
  return `CC-${String(hash).padStart(5, '0')}`
}

export function PersonProfileCard({
  who,
  name,
  person,
  busy = false,
  onSave,
}: PersonProfileCardProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(name)
  const [draft, setDraft] = useState(() => normalizePerson(person))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) return
    setDraftName(name)
    setDraft(normalizePerson(person))
  }, [name, person, editing])

  const accent = draft.favoriteColor || (who === 'you' ? '#272d88' : '#e85d75')
  const birthdayLabel = formatBirthday(person.birthday)
  const age = ageFromBirthday(person.birthday)
  const zodiac = zodiacFromBirthday(person.birthday)
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  const serial = memberSerial(who, name)
  const roleLabel = who === 'you' ? 'Member A' : 'Member B'

  function updateDraft<K extends keyof PersonProfile>(key: K, value: PersonProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function cancel() {
    setDraftName(name)
    setDraft(normalizePerson(person))
    setEditing(false)
    setError('')
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: draftName.trim().slice(0, 18) || (who === 'you' ? 'You' : 'Partner'),
        person: normalizePerson(draft),
      })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function onPhotoPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    try {
      const { compressImage } = await import('../stripsDb')
      const photo = await compressImage(file, 720, 0.84)
      updateDraft('photo', photo)
      if (!editing) {
        setSaving(true)
        setError('')
        try {
          await onSave({ name, person: normalizePerson({ ...person, photo }) })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not save photo')
        } finally {
          setSaving(false)
        }
      }
    } catch {
      setError('Could not read that photo. Try another image.')
    }
  }

  const display = editing ? draft : person
  const displayName = editing ? draftName : name

  return (
    <article
      className={`person-card person-card--${who}${editing ? ' is-editing' : ''}`}
      style={{ ['--person-accent' as string]: accent }}
    >
      <div className="person-card__bg" aria-hidden>
        <span className="person-card__wash" />
        <span className="person-card__pattern" />
        <span className="person-card__orbit" />
        <span className="person-card__seal">{who === 'you' ? '★' : '♥'}</span>
      </div>

      <header className="person-card__id-bar">
        <div className="person-card__id-brand">
          <span className="person-card__id-mark" aria-hidden />
          <div>
            <p className="person-card__id-club">Cuddles Club</p>
            <p className="person-card__id-role">{roleLabel} · Forever pass</p>
          </div>
        </div>
        <div className="person-card__id-chip" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </header>

      <div className="person-card__body">
        <div className="person-card__top">
          <div className="person-card__identity">
            <div className="person-card__avatar-wrap">
              <button
                type="button"
                className="person-card__avatar"
                onClick={() => fileRef.current?.click()}
                disabled={busy || saving}
                aria-label={`Upload photo for ${displayName}`}
              >
                {display.photo ? (
                  <img src={display.photo} alt="" />
                ) : (
                  <span className="person-card__initial">{initial}</span>
                )}
                <span className="person-card__avatar-add" aria-hidden>
                  <CameraIcon size={16} />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void onPhotoPicked(event)}
              />
            </div>

            <div className="person-card__titles">
              <p className="person-card__field-label">Preferred name</p>
              {editing ? (
                <label className="person-card__name-field">
                  <span className="sr-only">Name</span>
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    maxLength={18}
                    placeholder={who === 'you' ? 'Your name' : 'Partner name'}
                  />
                </label>
              ) : (
                <h2>{displayName}</h2>
              )}
              {editing ? (
                <label className="person-card__nick-field">
                  <span className="sr-only">Nickname</span>
                  <input
                    value={draft.nickname}
                    onChange={(event) => updateDraft('nickname', event.target.value)}
                    maxLength={24}
                    placeholder="Nickname"
                  />
                </label>
              ) : person.nickname ? (
                <p className="person-card__nickname">AKA “{person.nickname}”</p>
              ) : (
                <p className="person-card__nickname person-card__nickname--empty">No nickname yet</p>
              )}
            </div>
          </div>

          <div className="person-card__actions">
            {editing ? (
              <>
                <button
                  type="button"
                  className="person-card__text-btn"
                  onClick={cancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="person-card__icon-btn person-card__icon-btn--save"
                  onClick={() => void save()}
                  disabled={saving || busy}
                  aria-label="Save profile"
                >
                  <CheckIcon size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="person-card__icon-btn"
                onClick={() => setEditing(true)}
                disabled={busy || saving}
                aria-label={`Edit ${displayName}`}
              >
                <PencilIcon size={18} />
              </button>
            )}
          </div>
        </div>

        {!editing ? (
          <div className="person-card__facts">
            {person.favoriteColor ? (
              <div className="person-card__fact person-card__fact--swatch">
                <span>Colour</span>
                <strong>
                  <i className="person-card__swatch" style={{ background: person.favoriteColor }} />
                  Signature shade
                </strong>
              </div>
            ) : null}

            {birthdayLabel ? (
              <div className="person-card__fact">
                <span>Date of birth</span>
                <strong>
                  {birthdayLabel}
                  {age !== null ? ` · ${age}` : ''}
                  {zodiac ? ` · ${zodiac}` : ''}
                </strong>
              </div>
            ) : null}

            {person.loveLanguage ? (
              <div className="person-card__fact">
                <span>Love language</span>
                <strong>{person.loveLanguage}</strong>
              </div>
            ) : null}

            {person.favoriteFood ? (
              <div className="person-card__fact">
                <span>Fuel</span>
                <strong>{person.favoriteFood}</strong>
              </div>
            ) : null}

            {person.hometown ? (
              <div className="person-card__fact">
                <span>Origin</span>
                <strong>{person.hometown}</strong>
              </div>
            ) : null}

            {person.bio ? <p className="person-card__bio">{person.bio}</p> : null}

            {!person.favoriteColor &&
            !birthdayLabel &&
            !person.loveLanguage &&
            !person.favoriteFood &&
            !person.hometown &&
            !person.bio ? (
              <p className="person-card__empty">
                Tap edit to fill this pass — birthday, colours, and the little details.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="person-card__editor">
            <label className="field">
              <span>Birthday</span>
              <span className="field__control">
                <input
                  type="date"
                  value={draft.birthday}
                  onChange={(event) => updateDraft('birthday', event.target.value)}
                />
              </span>
            </label>

            <div className="field">
              <span>Favourite colour</span>
              <div className="person-card__colors" role="listbox" aria-label="Favourite colour">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={draft.favoriteColor === color}
                    className={`person-card__color${draft.favoriteColor === color ? ' is-selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => updateDraft('favoriteColor', color)}
                    aria-label={color}
                  />
                ))}
                <label className="person-card__color-custom" title="Custom colour">
                  <input
                    type="color"
                    value={draft.favoriteColor || '#e85d75'}
                    onChange={(event) => updateDraft('favoriteColor', event.target.value)}
                  />
                </label>
              </div>
            </div>

            <label className="field">
              <span>Love language</span>
              <select
                value={draft.loveLanguage}
                onChange={(event) => updateDraft('loveLanguage', event.target.value)}
              >
                <option value="">Pick one</option>
                {LOVE_LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Favourite food</span>
              <input
                value={draft.favoriteFood}
                onChange={(event) => updateDraft('favoriteFood', event.target.value)}
                maxLength={40}
                placeholder="e.g. spicy ramen"
              />
            </label>

            <label className="field">
              <span>Hometown</span>
              <input
                value={draft.hometown}
                onChange={(event) => updateDraft('hometown', event.target.value)}
                maxLength={40}
                placeholder="Where they grew up"
              />
            </label>

            <label className="field">
              <span>About</span>
              <textarea
                value={draft.bio}
                onChange={(event) => updateDraft('bio', event.target.value)}
                maxLength={160}
                rows={3}
                placeholder="A little note about them"
              />
            </label>
          </div>
        )}
      </div>

      <footer className="person-card__id-foot">
        <span className="person-card__serial">{serial}</span>
        <span className="person-card__validity">Valid · always</span>
      </footer>

      {error ? <p className="person-card__error">{error}</p> : null}
    </article>
  )
}
