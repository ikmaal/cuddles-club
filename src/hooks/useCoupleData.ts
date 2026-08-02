import { useCallback, useMemo } from 'react'
import { STARTER_BUCKET, STARTER_IDEAS } from '../data'
import type {
  AnswerEntry,
  BucketItem,
  Carer,
  Countdown,
  DateIdea,
  MoodEntry,
  MoodKey,
  Note,
} from '../types'
import { createId, todayKey, useStored } from './useStored'

function seedBucket(): BucketItem[] {
  return STARTER_BUCKET.map((text, index) => ({
    id: `seed-bucket-${index}`,
    text,
    done: false,
    createdAt: Date.now(),
  }))
}

function seedIdeas(): DateIdea[] {
  return STARTER_IDEAS.map((text, index) => ({ id: `seed-idea-${index}`, text }))
}

export function useCoupleData() {
  const [notes, setNotes] = useStored<Note[]>('cuddles-club-notes-v1', [])
  const [bucket, setBucket] = useStored<BucketItem[]>(
    'cuddles-club-bucket-v1',
    seedBucket(),
  )
  const [ideas, setIdeas] = useStored<DateIdea[]>(
    'cuddles-club-ideas-v1',
    seedIdeas(),
  )
  const [events, setEvents] = useStored<Countdown[]>('cuddles-club-events-v1', [])
  const [moods, setMoods] = useStored<MoodEntry[]>('cuddles-club-moods-v1', [])
  const [answers, setAnswers] = useStored<AnswerEntry[]>(
    'cuddles-club-answers-v1',
    [],
  )

  const addNote = useCallback(
    (text: string, author: Carer) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setNotes((prev) => [
        { id: createId(), text: trimmed, author, createdAt: Date.now() },
        ...prev,
      ])
    },
    [setNotes],
  )

  const removeNote = useCallback(
    (id: string) => setNotes((prev) => prev.filter((note) => note.id !== id)),
    [setNotes],
  )

  const addBucketItem = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setBucket((prev) => [
        { id: createId(), text: trimmed, done: false, createdAt: Date.now() },
        ...prev,
      ])
    },
    [setBucket],
  )

  const toggleBucketItem = useCallback(
    (id: string) =>
      setBucket((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                done: !item.done,
                doneAt: item.done ? undefined : Date.now(),
              }
            : item,
        ),
      ),
    [setBucket],
  )

  const removeBucketItem = useCallback(
    (id: string) => setBucket((prev) => prev.filter((item) => item.id !== id)),
    [setBucket],
  )

  const addIdea = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setIdeas((prev) => [...prev, { id: createId(), text: trimmed }])
    },
    [setIdeas],
  )

  const removeIdea = useCallback(
    (id: string) => setIdeas((prev) => prev.filter((idea) => idea.id !== id)),
    [setIdeas],
  )

  const addEvent = useCallback(
    (label: string, date: string, repeatsYearly: boolean) => {
      const trimmed = label.trim()
      if (!trimmed || !date) return
      setEvents((prev) => [
        ...prev,
        { id: createId(), label: trimmed, date, repeatsYearly },
      ])
    },
    [setEvents],
  )

  const removeEvent = useCallback(
    (id: string) => setEvents((prev) => prev.filter((event) => event.id !== id)),
    [setEvents],
  )

  const setMood = useCallback(
    (who: Carer, mood: MoodKey) => {
      const day = todayKey()
      setMoods((prev) => {
        const existing = prev.find((entry) => entry.day === day)
        const field = who === 'you' ? 'you' : 'partner'
        if (!existing) return [...prev, { day, [field]: mood } as MoodEntry]
        return prev.map((entry) =>
          entry.day === day ? { ...entry, [field]: mood } : entry,
        )
      })
    },
    [setMoods],
  )

  const saveAnswer = useCallback(
    (question: string, you: string, partner: string) => {
      const day = todayKey()
      setAnswers((prev) => {
        const next = prev.filter((entry) => entry.id !== day)
        return [
          {
            id: day,
            question,
            you: you.trim(),
            partner: partner.trim(),
            answeredAt: Date.now(),
          },
          ...next,
        ]
      })
    },
    [setAnswers],
  )

  const nextEvent = useMemo(() => {
    const upcoming = events
      .map((event) => ({ event, days: daysUntil(event) }))
      .filter((entry) => entry.days !== null && entry.days >= 0)
      .sort((a, b) => (a.days as number) - (b.days as number))
    const first = upcoming[0]
    return first ? { label: first.event.label, days: first.days as number } : null
  }, [events])

  const todayMood = useMemo(
    () => moods.find((entry) => entry.day === todayKey()) ?? null,
    [moods],
  )

  return {
    notes,
    addNote,
    removeNote,
    bucket,
    addBucketItem,
    toggleBucketItem,
    removeBucketItem,
    ideas,
    addIdea,
    removeIdea,
    events,
    addEvent,
    removeEvent,
    nextEvent,
    moods,
    todayMood,
    setMood,
    answers,
    saveAnswer,
  }
}

export function daysUntil(event: Countdown): number | null {
  const target = new Date(`${event.date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let next = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  if (event.repeatsYearly) {
    next = new Date(today.getFullYear(), target.getMonth(), target.getDate())
    if (next.getTime() < today.getTime()) {
      next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate())
    }
  }

  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}
