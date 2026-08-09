import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { STARTER_BUCKET, STARTER_IDEAS } from '../data'
import { applyDecay, defaultCat } from '../hooks/useCat.logic'
import { createId, todayKey } from '../hooks/useStored'
import { defaultProfile, loadProfile, normalizeCoupleProfile, saveProfile } from '../storage'
import {
  coupleToProfile,
  createCoupleSpace,
  deleteBucketItem,
  deleteCountdown,
  deleteIdea,
  deleteNote,
  deletePhotostrip,
  fetchMembership,
  joinCoupleSpace,
  loadAllCoupleData,
  renamePhotostrip,
  saveCatState,
  seedCoupleDefaults,
  updateCoupleProfile,
  uploadPhotostrip,
  uploadPhotostripFile,
  upsertAnswer,
  upsertBucketItem,
  upsertCountdown,
  upsertIdea,
  upsertMoodEntry,
  upsertNote,
  type CoupleRow,
} from '../lib/supabaseData'
import { type MemberSlot } from '../lib/coupleSlot'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AnswerEntry,
  BucketItem,
  Carer,
  CatState,
  Countdown,
  CoupleProfile,
  DateIdea,
  MoodEntry,
  MoodKey,
  Note,
  Photostrip,
} from '../types'
import { daysUntil } from '../hooks/useCoupleData.utils'

interface CoupleContextValue {
  ready: boolean
  isConfigured: boolean
  isCloud: boolean
  session: Session | null
  user: User | null
  coupleId: string | null
  slot: MemberSlot | null
  inviteCode: string | null
  authBusy: boolean
  authError: string
  profile: CoupleProfile
  notes: Note[]
  bucket: BucketItem[]
  ideas: DateIdea[]
  events: Countdown[]
  moods: MoodEntry[]
  answers: AnswerEntry[]
  cat: CatState
  strips: Photostrip[]
  stripsReady: boolean
  stripsBusy: boolean
  stripsError: string
  todayMood: MoodEntry | null
  nextEvent: { label: string; days: number } | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  createSpace: () => Promise<boolean>
  joinSpace: (code: string) => Promise<boolean>
  updateProfile: (profile: CoupleProfile) => Promise<void>
  addNote: (text: string, author: Carer) => Promise<void>
  removeNote: (id: string) => Promise<void>
  addBucketItem: (text: string) => Promise<void>
  toggleBucketItem: (id: string) => Promise<void>
  removeBucketItem: (id: string) => Promise<void>
  addIdea: (text: string) => Promise<void>
  removeIdea: (id: string) => Promise<void>
  addEvent: (label: string, date: string, repeatsYearly: boolean) => Promise<void>
  removeEvent: (id: string) => Promise<void>
  setMood: (who: Carer, mood: MoodKey) => Promise<void>
  saveAnswer: (question: string, you: string, partner: string) => Promise<void>
  setCat: (updater: (prev: CatState) => CatState) => void
  addStripFromFile: (
    file: File,
    title: string,
    takenAt?: number,
  ) => Promise<Photostrip | null>
  addStripFromDataUrl: (image: string, title: string) => Promise<boolean>
  renameStrip: (id: string, title: string) => Promise<void>
  removeStrip: (id: string) => Promise<void>
  clearStripsError: () => void
}

const CoupleContext = createContext<CoupleContextValue | null>(null)

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

export function CoupleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [slot, setSlot] = useState<MemberSlot | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  const [profile, setProfile] = useState<CoupleProfile>(() => loadProfile())
  const [notes, setNotes] = useState<Note[]>([])
  const [bucket, setBucket] = useState<BucketItem[]>(seedBucket)
  const [ideas, setIdeas] = useState<DateIdea[]>(seedIdeas)
  const [events, setEvents] = useState<Countdown[]>([])
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [answers, setAnswers] = useState<AnswerEntry[]>([])
  const [cat, setCatState] = useState<CatState>(() => {
    try {
      const raw = localStorage.getItem('cuddles-club-cat-v1')
      if (!raw) return { ...defaultCat }
      return applyDecay({ ...defaultCat, ...JSON.parse(raw) }, Date.now())
    } catch {
      return { ...defaultCat }
    }
  })
  const [strips, setStrips] = useState<Photostrip[]>([])
  const [stripsReady, setStripsReady] = useState(false)
  const [stripsBusy, setStripsBusy] = useState(false)
  const [stripsError, setStripsError] = useState('')

  const localProfileReady = useRef(false)
  const isCloud = Boolean(isSupabaseConfigured && session && coupleId && slot)

  useEffect(() => {
    localProfileReady.current = true
  }, [])

  useEffect(() => {
    if (isCloud || !localProfileReady.current) return
    saveProfile(profile)
  }, [profile, isCloud])

  useEffect(() => {
    if (isCloud) return
    localStorage.setItem('cuddles-club-cat-v1', JSON.stringify(cat))
  }, [cat, isCloud])

  const loadLocalKeys = useCallback(() => {
    try {
      const read = <T,>(key: string, fallback: T): T => {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        return JSON.parse(raw) as T
      }
      setNotes(read('cuddles-club-notes-v1', []))
      setBucket(read('cuddles-club-bucket-v1', seedBucket()))
      setIdeas(read('cuddles-club-ideas-v1', seedIdeas()))
      setEvents(read('cuddles-club-events-v1', []))
      setMoods(read('cuddles-club-moods-v1', []))
      setAnswers(read('cuddles-club-answers-v1', []))
      setProfile(loadProfile())
    } catch {
      // keep defaults
    }
    setStripsReady(true)
  }, [])

  const loadCloud = useCallback(async (uid: string) => {
    const membership = await fetchMembership(uid)
    if (!membership) {
      setCoupleId(null)
      setSlot(null)
      setInviteCode(null)
      setStripsReady(true)
      return
    }

    setCoupleId(membership.coupleId)
    setSlot(membership.slot)
    setInviteCode(membership.inviteCode)

    const data = await loadAllCoupleData(membership.coupleId, membership.slot)
    setProfile(coupleToProfile(membership.couple, membership.slot))
    setNotes(data.notes)
    setBucket(data.bucket.length > 0 ? data.bucket : seedBucket())
    setIdeas(data.ideas.length > 0 ? data.ideas : seedIdeas())
    setEvents(data.events)
    setMoods(data.moods)
    setAnswers(data.answers)
    setCatState(applyDecay(data.cat, Date.now()))
    setStrips(data.strips)
    setStripsReady(true)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      loadLocalKeys()
      return
    }

    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        void loadCloud(data.session.user.id).finally(() => {
          if (alive) setReady(true)
        })
      } else {
        loadLocalKeys()
        setReady(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (nextSession?.user) {
        void loadCloud(nextSession.user.id)
      } else {
        setCoupleId(null)
        setSlot(null)
        setInviteCode(null)
        loadLocalKeys()
      }
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [loadCloud, loadLocalKeys])

  useEffect(() => {
    if (!isCloud) return
    const id = window.setInterval(() => {
      setCatState((prev) => applyDecay(prev, Date.now()))
    }, 20_000)
    return () => window.clearInterval(id)
  }, [isCloud])

  useEffect(() => {
    if (!isCloud || !coupleId) return
    const id = window.setInterval(() => {
      void saveCatState(coupleId, cat)
    }, 3000)
    return () => window.clearInterval(id)
  }, [isCloud, coupleId, cat])

  const persistLocal = useCallback(
    (key: string, value: unknown) => {
      if (isCloud) return
      localStorage.setItem(key, JSON.stringify(value))
    },
    [isCloud],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return false
    setAuthBusy(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return true
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not sign in')
      return false
    } finally {
      setAuthBusy(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return false
    setAuthBusy(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return true
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not sign up')
      return false
    } finally {
      setAuthBusy(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setAuthBusy(true)
    await supabase.auth.signOut()
    setAuthBusy(false)
    loadLocalKeys()
  }, [loadLocalKeys])

  const createSpace = useCallback(async () => {
    if (!user) return false
    setAuthBusy(true)
    setAuthError('')
    try {
      const couple = (await createCoupleSpace()) as CoupleRow
      await seedCoupleDefaults(couple.id)
      await updateCoupleProfile(couple.id, profile, 'a')
      await loadCloud(user.id)
      return true
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not create couple space')
      return false
    } finally {
      setAuthBusy(false)
    }
  }, [user, loadCloud, profile])

  const joinSpace = useCallback(
    async (code: string) => {
      if (!user) return false
      setAuthBusy(true)
      setAuthError('')
      try {
        await joinCoupleSpace(code)
        await loadCloud(user.id)
        return true
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Could not join couple space')
        return false
      } finally {
        setAuthBusy(false)
      }
    },
    [user, loadCloud],
  )

  const updateProfile = useCallback(
    async (next: CoupleProfile) => {
      const merged = normalizeCoupleProfile({
        ...next,
        nameYou: next.nameYou.trim().slice(0, 18) || 'You',
        namePartner: next.namePartner.trim().slice(0, 18) || 'Partner',
      })
      setProfile(merged)
      if (isCloud && coupleId && slot) {
        const synced = await updateCoupleProfile(coupleId, merged, slot)
        setProfile(synced)
      }
    },
    [isCloud, coupleId, slot],
  )

  const addNote = useCallback(
    async (text: string, author: Carer) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const note: Note = { id: createId(), text: trimmed, author, createdAt: Date.now() }
      setNotes((prev) => {
        const next = [note, ...prev]
        persistLocal('cuddles-club-notes-v1', next)
        return next
      })
      if (isCloud && coupleId && slot) await upsertNote(coupleId, note, slot)
    },
    [isCloud, coupleId, slot, persistLocal],
  )

  const removeNote = useCallback(
    async (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id)
        persistLocal('cuddles-club-notes-v1', next)
        return next
      })
      if (isCloud) await deleteNote(id)
    },
    [isCloud, persistLocal],
  )

  const addBucketItem = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const item: BucketItem = {
        id: createId(),
        text: trimmed,
        done: false,
        createdAt: Date.now(),
      }
      setBucket((prev) => {
        const next = [item, ...prev]
        persistLocal('cuddles-club-bucket-v1', next)
        return next
      })
      if (isCloud && coupleId) await upsertBucketItem(coupleId, item)
    },
    [isCloud, coupleId, persistLocal],
  )

  const toggleBucketItem = useCallback(
    async (id: string) => {
      let updated: BucketItem | null = null
      setBucket((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item
          updated = {
            ...item,
            done: !item.done,
            doneAt: item.done ? undefined : Date.now(),
          }
          return updated
        })
        persistLocal('cuddles-club-bucket-v1', next)
        return next
      })
      if (isCloud && coupleId && updated) await upsertBucketItem(coupleId, updated)
    },
    [isCloud, coupleId, persistLocal],
  )

  const removeBucketItem = useCallback(
    async (id: string) => {
      setBucket((prev) => {
        const next = prev.filter((item) => item.id !== id)
        persistLocal('cuddles-club-bucket-v1', next)
        return next
      })
      if (isCloud) await deleteBucketItem(id)
    },
    [isCloud, persistLocal],
  )

  const addIdea = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const idea: DateIdea = { id: createId(), text: trimmed }
      setIdeas((prev) => {
        const next = [...prev, idea]
        persistLocal('cuddles-club-ideas-v1', next)
        return next
      })
      if (isCloud && coupleId) await upsertIdea(coupleId, idea)
    },
    [isCloud, coupleId, persistLocal],
  )

  const removeIdea = useCallback(
    async (id: string) => {
      setIdeas((prev) => {
        const next = prev.filter((idea) => idea.id !== id)
        persistLocal('cuddles-club-ideas-v1', next)
        return next
      })
      if (isCloud) await deleteIdea(id)
    },
    [isCloud, persistLocal],
  )

  const addEvent = useCallback(
    async (label: string, date: string, repeatsYearly: boolean) => {
      const trimmed = label.trim()
      if (!trimmed || !date) return
      const event: Countdown = { id: createId(), label: trimmed, date, repeatsYearly }
      setEvents((prev) => {
        const next = [...prev, event]
        persistLocal('cuddles-club-events-v1', next)
        return next
      })
      if (isCloud && coupleId) await upsertCountdown(coupleId, event)
    },
    [isCloud, coupleId, persistLocal],
  )

  const removeEvent = useCallback(
    async (id: string) => {
      setEvents((prev) => {
        const next = prev.filter((event) => event.id !== id)
        persistLocal('cuddles-club-events-v1', next)
        return next
      })
      if (isCloud) await deleteCountdown(id)
    },
    [isCloud, persistLocal],
  )

  const setMood = useCallback(
    async (who: Carer, mood: MoodKey) => {
      const day = todayKey()
      let entry: MoodEntry | null = null
      setMoods((prev) => {
        const existing = prev.find((e) => e.day === day)
        const field = who === 'you' ? 'you' : 'partner'
        if (!existing) {
          entry = { day, [field]: mood } as MoodEntry
          const next = [...prev, entry]
          persistLocal('cuddles-club-moods-v1', next)
          return next
        }
        entry = { ...existing, [field]: mood }
        const next = prev.map((e) => (e.day === day ? entry! : e))
        persistLocal('cuddles-club-moods-v1', next)
        return next
      })
      if (isCloud && coupleId && slot && entry) await upsertMoodEntry(coupleId, entry, slot)
    },
    [isCloud, coupleId, slot, persistLocal],
  )

  const saveAnswer = useCallback(
    async (question: string, you: string, partner: string) => {
      const day = todayKey()
      const answer: AnswerEntry = {
        id: day,
        question,
        you: you.trim(),
        partner: partner.trim(),
        answeredAt: Date.now(),
      }
      setAnswers((prev) => {
        const next = [answer, ...prev.filter((entry) => entry.id !== day)]
        persistLocal('cuddles-club-answers-v1', next)
        return next
      })
      if (isCloud && coupleId && slot) await upsertAnswer(coupleId, answer, slot)
    },
    [isCloud, coupleId, slot, persistLocal],
  )

  const setCat = useCallback((updater: (prev: CatState) => CatState) => {
    setCatState((prev) => updater(prev))
  }, [])

  const addStripFromFile = useCallback(
    async (file: File, title: string, takenAt = Date.now()) => {
      setStripsBusy(true)
      setStripsError('')
      try {
        if (isCloud && coupleId) {
          const strip = await uploadPhotostripFile(coupleId, file, title, takenAt)
          setStrips((prev) => [strip, ...prev])
          return strip
        }
        const { createStripFromFile, putStrip } = await import('../stripsDb')
        const strip = await createStripFromFile(file, title, takenAt)
        await putStrip(strip)
        setStrips((prev) => [strip, ...prev])
        return strip
      } catch {
        setStripsError('Could not save that strip.')
        return null
      } finally {
        setStripsBusy(false)
      }
    },
    [isCloud, coupleId],
  )

  const addStripFromDataUrl = useCallback(
    async (image: string, title: string) => {
      setStripsBusy(true)
      setStripsError('')
      try {
        if (isCloud && coupleId) {
          const id = createId()
          const strip = await uploadPhotostrip(coupleId, id, title, image, Date.now())
          setStrips((prev) => [strip, ...prev])
          return true
        }
        const { createStripFromDataUrl, putStrip } = await import('../stripsDb')
        const strip = createStripFromDataUrl(image, title)
        await putStrip(strip)
        setStrips((prev) => [strip, ...prev])
        return true
      } catch {
        setStripsError('Could not save that booth strip.')
        return false
      } finally {
        setStripsBusy(false)
      }
    },
    [isCloud, coupleId],
  )

  const renameStrip = useCallback(
    async (id: string, title: string) => {
      const next = title.trim().slice(0, 60)
      if (!next) return
      setStrips((prev) => prev.map((s) => (s.id === id ? { ...s, title: next } : s)))
      if (isCloud) {
        await renamePhotostrip(id, next)
        return
      }
      const { putStrip } = await import('../stripsDb')
      const match = strips.find((s) => s.id === id)
      if (match) await putStrip({ ...match, title: next })
    },
    [isCloud, strips],
  )

  const removeStrip = useCallback(
    async (id: string) => {
      const match = strips.find((s) => s.id === id)
      setStrips((prev) => prev.filter((s) => s.id !== id))
      if (isCloud && coupleId && match) {
        await deletePhotostrip(match, coupleId)
        return
      }
      const { deleteStrip } = await import('../stripsDb')
      await deleteStrip(id)
    },
    [isCloud, coupleId, strips],
  )

  const todayMood = useMemo(
    () => moods.find((entry) => entry.day === todayKey()) ?? null,
    [moods],
  )

  const nextEvent = useMemo(() => {
    const upcoming = events
      .map((event) => ({ event, days: daysUntil(event) }))
      .filter((entry) => entry.days !== null && entry.days >= 0)
      .sort((a, b) => (a.days as number) - (b.days as number))
    const first = upcoming[0]
    return first ? { label: first.event.label, days: first.days as number } : null
  }, [events])

  useEffect(() => {
    if (isCloud || stripsReady) return
    let alive = true
    import('../stripsDb')
      .then(({ ensureSampleStrip }) => ensureSampleStrip())
      .then((rows) => {
        if (alive) setStrips(rows)
      })
      .catch(() => {
        if (alive) setStripsError('Could not load your photobooth album')
      })
      .finally(() => {
        if (alive) setStripsReady(true)
      })
    return () => {
      alive = false
    }
  }, [isCloud, stripsReady])

  const value = useMemo<CoupleContextValue>(
    () => ({
      ready,
      isConfigured: isSupabaseConfigured,
      isCloud,
      session,
      user,
      coupleId,
      slot,
      inviteCode,
      authBusy,
      authError,
      profile,
      notes,
      bucket,
      ideas,
      events,
      moods,
      answers,
      cat,
      strips,
      stripsReady,
      stripsBusy,
      stripsError,
      todayMood,
      nextEvent,
      signIn,
      signUp,
      signOut,
      createSpace,
      joinSpace,
      updateProfile,
      addNote,
      removeNote,
      addBucketItem,
      toggleBucketItem,
      removeBucketItem,
      addIdea,
      removeIdea,
      addEvent,
      removeEvent,
      setMood,
      saveAnswer,
      setCat,
      addStripFromFile,
      addStripFromDataUrl,
      renameStrip,
      removeStrip,
      clearStripsError: () => setStripsError(''),
    }),
    [
      ready,
      isCloud,
      session,
      user,
      coupleId,
      slot,
      inviteCode,
      authBusy,
      authError,
      profile,
      notes,
      bucket,
      ideas,
      events,
      moods,
      answers,
      cat,
      strips,
      stripsReady,
      stripsBusy,
      stripsError,
      todayMood,
      nextEvent,
      signIn,
      signUp,
      signOut,
      createSpace,
      joinSpace,
      updateProfile,
      addNote,
      removeNote,
      addBucketItem,
      toggleBucketItem,
      removeBucketItem,
      addIdea,
      removeIdea,
      addEvent,
      removeEvent,
      setMood,
      saveAnswer,
      setCat,
      addStripFromFile,
      addStripFromDataUrl,
      renameStrip,
      removeStrip,
    ],
  )

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within CoupleProvider')
  return ctx
}

export { defaultProfile }
