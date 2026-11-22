import { useCallback, useEffect, useRef, useState } from 'react'
import type { MemberSlot } from '../lib/coupleSlot'
import type { LatLng } from '../lib/geoguessrMath'
import { findSingaporeStreetViewRound } from '../lib/singaporeGeoguess'
import {
  abortDuel,
  bothGuessesIn,
  createDuelLobby,
  duelLocation,
  duelSecondsLeft,
  fetchActiveDuel,
  finalizeDuelRound,
  nextDuelRound,
  publishDuelRound,
  setDuelReady,
  slotSubmitted,
  startDuelMatch,
  submitDuelGuess,
  type SgGuessDuelRow,
} from '../lib/sgGuessDuel'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function useSgGuessDuel(coupleId: string | null, slot: MemberSlot | null, mapsReady: boolean) {
  const [duel, setDuel] = useState<SgGuessDuelRow | null>(null)
  const [duelBusy, setDuelBusy] = useState(false)
  const [duelError, setDuelError] = useState<string | null>(null)
  const [duelView, setDuelView] = useState<'lobby' | 'play' | null>(null)
  const [mapSubview, setMapSubview] = useState<'explore' | 'guess'>('explore')
  const [clockTick, setClockTick] = useState(0)
  const [realtimeOk, setRealtimeOk] = useState(false)

  const duelRef = useRef(duel)
  duelRef.current = duel

  const mapsRef = useRef<typeof google.maps | null>(null)

  const enabled = Boolean(isSupabaseConfigured && coupleId && slot)

  const refresh = useCallback(async () => {
    if (!coupleId) return null
    try {
      const row = await fetchActiveDuel(coupleId)
      setDuel(row)
      return row
    } catch {
      setDuelError('Could not load duel. Run supabase/sg_guess_duels.sql and enable Realtime.')
      return null
    }
  }, [coupleId])

  useEffect(() => {
    if (!enabled) {
      setDuel(null)
      return
    }
    void refresh()
  }, [enabled, refresh])

  useEffect(() => {
    if (!duel) return
    if (duel.status === 'lobby') {
      setDuelView('lobby')
    } else if (['loading', 'playing', 'reveal', 'summary'].includes(duel.status)) {
      setDuelView('play')
    }
  }, [duel?.status])

  useEffect(() => {
    if (duelView !== 'lobby' || !coupleId) return
    const id = window.setInterval(() => {
      void refresh()
    }, 2500)
    return () => window.clearInterval(id)
  }, [coupleId, duelView, refresh])

  useEffect(() => {
    if (duel?.status !== 'playing') return
    const id = window.setInterval(() => setClockTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [duel?.status, duel?.guess_deadline_at])

  useEffect(() => {
    if (!enabled || !coupleId || !supabase) return

    const client = supabase
    const channel = client
      .channel(`sg_guess_duel:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sg_guess_duels',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const row = payload.new as SgGuessDuelRow
          if (row?.id) {
            setDuel(row)
            setRealtimeOk(true)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeOk(true)
      })

    return () => {
      setRealtimeOk(false)
      void client.removeChannel(channel)
    }
  }, [coupleId, enabled])

  const isHost = Boolean(duel && slot && duel.host_slot === slot)

  const enterLobby = useCallback(async () => {
    if (!coupleId || !slot) return
    setDuelError(null)
    setDuelBusy(true)
    try {
      const row = await createDuelLobby(coupleId, slot)
      setDuel(row)
      setDuelView('lobby')
    } catch {
      setDuelError('Could not open duel lobby.')
    } finally {
      setDuelBusy(false)
    }
  }, [coupleId, slot])

  const joinLobby = useCallback(async () => {
    if (!coupleId || !slot) return
    setDuelBusy(true)
    setDuelError(null)
    try {
      const existing = duel ?? (await fetchActiveDuel(coupleId))
      if (!existing || existing.status !== 'lobby') {
        setDuelError('No open lobby — ask your partner to open one first.')
        return
      }
      setDuel(existing)
      setDuelView('lobby')
    } catch {
      setDuelError('Could not join lobby.')
    } finally {
      setDuelBusy(false)
    }
  }, [coupleId, duel, slot])

  const toggleReady = useCallback(
    async (ready: boolean) => {
      if (!duel || !slot || duel.status !== 'lobby') return
      setDuelBusy(true)
      setDuelError(null)
      try {
        const row = await setDuelReady(duel.id, slot, ready)
        setDuel(row)
      } catch {
        setDuelError('Could not update ready status.')
      } finally {
        setDuelBusy(false)
      }
    },
    [duel, slot],
  )

  const leaveDuel = useCallback(async () => {
    if (duel?.id) {
      try {
        await abortDuel(duel.id)
      } catch {
        /* ignore */
      }
    }
    setDuel(null)
    setDuelView(null)
    setMapSubview('explore')
    await refresh()
  }, [duel?.id, refresh])

  const startMatch = useCallback(async () => {
    if (!duel || !isHost) return
    setDuelBusy(true)
    setDuelError(null)
    try {
      await startDuelMatch(duel.id)
      setDuelView('play')
      setMapSubview('explore')
    } catch {
      setDuelError('Could not start duel.')
    } finally {
      setDuelBusy(false)
    }
  }, [duel, isHost])

  const bindMaps = useCallback((maps: typeof google.maps) => {
    mapsRef.current = maps
  }, [])

  // Host loads Street View when status is loading
  useEffect(() => {
    if (!isHost || !duel || duel.status !== 'loading' || !mapsReady) return

    let cancelled = false
    const maps = mapsRef.current
    if (!maps) return

    ;(async () => {
      setDuelBusy(true)
      try {
        const location = await findSingaporeStreetViewRound(maps)
        if (cancelled) return
        await publishDuelRound(duel.id, duel.round_index, location)
        setMapSubview('explore')
      } catch {
        if (!cancelled) setDuelError('No Street View for this round. Skipping…')
        if (!cancelled) await nextDuelRound(duel.id, duel.round_index)
      } finally {
        if (!cancelled) setDuelBusy(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [duel?.id, duel?.round_index, duel?.status, isHost, mapsReady])

  // Host finalizes round when both guessed or time is up
  useEffect(() => {
    if (!isHost || !duel || duel.status !== 'playing') return

    const tick = () => {
      const row = duelRef.current
      if (!row || row.status !== 'playing') return

      const timeUp = duelSecondsLeft(row) <= 0
      const ready = bothGuessesIn(row) || timeUp
      if (!ready) return

      void finalizeDuelRound(row.id, row).catch(() => {
        setDuelError('Could not score this round.')
      })
    }

    const id = window.setInterval(tick, 400)
    return () => window.clearInterval(id)
  }, [duel?.id, duel?.status, isHost])

  const postGuess = useCallback(
    async (guess: LatLng | null) => {
      if (!duel || !slot || duel.status !== 'playing') return
      if (slotSubmitted(duel, slot)) return
      try {
        await submitDuelGuess(duel.id, slot, guess)
      } catch {
        setDuelError('Could not send your guess.')
      }
    },
    [duel, slot],
  )

  const advanceRound = useCallback(async () => {
    if (!duel || !isHost) return
    setDuelBusy(true)
    try {
      await nextDuelRound(duel.id, duel.round_index)
      setMapSubview('explore')
    } catch {
      setDuelError('Could not advance duel.')
    } finally {
      setDuelBusy(false)
    }
  }, [duel, isHost])

  const secondsLeft = duelSecondsLeft(duel, Date.now())
  void clockTick

  const duelPhase =
    duelView === 'play' && duel
      ? duel.status === 'loading'
        ? 'loading'
        : duel.status === 'playing'
          ? mapSubview === 'guess'
            ? 'guess'
            : 'explore'
          : duel.status === 'reveal'
            ? 'reveal'
            : duel.status === 'summary'
              ? 'summary'
              : 'menu'
      : duelView === 'lobby'
        ? 'duel-lobby'
        : 'menu'

  return {
    enabled,
    duel,
    duelBusy,
    duelError,
    duelView,
    setDuelView,
    duelPhase,
    isHost,
    mapSubview,
    setMapSubview,
    duelLocation: duelLocation(duel),
    secondsLeft,
    enterLobby,
    joinLobby,
    toggleReady,
    leaveDuel,
    startMatch,
    postGuess,
    advanceRound,
    bindMaps,
    refresh,
    clearDuelError: () => setDuelError(null),
    realtimeOk,
  }
}