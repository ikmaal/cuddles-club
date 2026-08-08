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
import { useCouple } from '../context/CoupleContext'
import type { MemberSlot } from '../lib/coupleSlot'
import {
  deleteListeningStatus,
  fetchListeningStatuses,
  upsertListeningStatus,
} from '../lib/listeningData'
import {
  beginSpotifyLogin,
  clearSpotifyCallbackParams,
  consumeSpotifyPendingConnect,
  exchangeSpotifyCode,
  fetchNowPlaying,
  isSpotifyConfigured,
  readSpotifyCallbackParams,
  refreshSpotifyTokens,
  type SpotifyTokenSet,
} from '../lib/spotify'
import {
  clearSpotifyTokens,
  loadSpotifyTokens,
  saveSpotifyTokens,
} from '../lib/spotifyStorage'
import type { ListeningCard, ListeningStatus } from '../types'

const POLL_MS = 30_000

let spotifyOauthHandled = false

interface SpotifyListeningContextValue {
  configured: boolean
  connected: boolean
  displayName: string
  busy: boolean
  error: string
  you: ListeningCard
  partner: ListeningCard
  isCloud: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const SpotifyListeningContext = createContext<SpotifyListeningContextValue | null>(null)

function toCard(
  status: ListeningStatus | null,
  who: 'you' | 'partner',
  name: string,
  connectedFallback = false,
): ListeningCard {
  return {
    who,
    name,
    trackName: status?.trackName ?? null,
    artists: status?.artists ?? null,
    albumArtUrl: status?.albumArtUrl ?? null,
    trackUrl: status?.trackUrl ?? null,
    isPlaying: status?.isPlaying ?? false,
    updatedAt: status?.updatedAt ?? 0,
    connected: Boolean(status?.spotifyUserId || status?.displayName || connectedFallback),
  }
}

export function SpotifyListeningProvider({ children }: { children: ReactNode }) {
  const { isCloud, coupleId, slot, profile } = useCouple()
  const configured = isSpotifyConfigured()

  const [tokens, setTokens] = useState<SpotifyTokenSet | null>(() => loadSpotifyTokens())
  const [youStatus, setYouStatus] = useState<ListeningStatus | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<ListeningStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tokensRef = useRef(tokens)
  tokensRef.current = tokens

  const connected = Boolean(tokens)

  const applyCoupleRows = useCallback((rows: ListeningStatus[], mySlot: MemberSlot) => {
    setYouStatus(rows.find((row) => row.slot === mySlot) ?? null)
    setPartnerStatus(rows.find((row) => row.slot !== mySlot) ?? null)
  }, [])

  const ensureAccessToken = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current
    if (!current) return null

    if (current.expiresAt > Date.now() + 60_000) {
      return current.accessToken
    }

    try {
      const refreshed = await refreshSpotifyTokens(current.refreshToken)
      saveSpotifyTokens(refreshed)
      setTokens(refreshed)
      tokensRef.current = refreshed
      return refreshed.accessToken
    } catch {
      clearSpotifyTokens()
      setTokens(null)
      tokensRef.current = null
      setError('Spotify session expired. Connect again.')
      return null
    }
  }, [])

  const syncNowPlaying = useCallback(async () => {
    const accessToken = await ensureAccessToken()
    const current = tokensRef.current
    if (!accessToken || !current) return

    try {
      const now = await fetchNowPlaying(accessToken)
      const status: ListeningStatus = {
        slot: (slot ?? 'a') as MemberSlot,
        spotifyUserId: current.spotifyUserId,
        displayName: current.displayName,
        trackId: now.trackId,
        trackName: now.trackName,
        artists: now.artists,
        albumName: now.albumName,
        albumArtUrl: now.albumArtUrl,
        trackUrl: now.trackUrl,
        isPlaying: now.isPlaying,
        updatedAt: Date.now(),
      }

      setYouStatus(status)

      if (isCloud && coupleId && slot) {
        await upsertListeningStatus(coupleId, slot, {
          spotifyUserId: status.spotifyUserId,
          displayName: status.displayName,
          trackId: status.trackId,
          trackName: status.trackName,
          artists: status.artists,
          albumName: status.albumName,
          albumArtUrl: status.albumArtUrl,
          trackUrl: status.trackUrl,
          isPlaying: status.isPlaying,
          updatedAt: status.updatedAt,
        })
      }
      setError('')
    } catch (err) {
      if (err instanceof Error && err.message === 'SPOTIFY_UNAUTHORIZED') {
        await ensureAccessToken()
        return
      }
      setError(err instanceof Error ? err.message : 'Could not sync Spotify')
    }
  }, [coupleId, ensureAccessToken, isCloud, slot])

  const refreshPartner = useCallback(async () => {
    if (!isCloud || !coupleId || !slot) return
    try {
      const rows = await fetchListeningStatuses(coupleId)
      applyCoupleRows(rows, slot)
    } catch {
      // Keep last known partner status if fetch fails.
    }
  }, [applyCoupleRows, coupleId, isCloud, slot])

  useEffect(() => {
    if (!configured || spotifyOauthHandled) return

    const { code, state, error: oauthError } = readSpotifyCallbackParams()
    if (!code && !oauthError) {
      if (consumeSpotifyPendingConnect() && window.location.hostname === '127.0.0.1') {
        setBusy(true)
        void beginSpotifyLogin().catch((err: unknown) => {
          setBusy(false)
          setError(err instanceof Error ? err.message : 'Could not start Spotify login')
        })
      }
      return
    }

    spotifyOauthHandled = true
    clearSpotifyCallbackParams()

    if (oauthError) {
      setError(oauthError === 'access_denied' ? 'Spotify connection cancelled.' : oauthError)
      return
    }

    if (!code) return

    let cancelled = false
    setBusy(true)
    void exchangeSpotifyCode(code, state)
      .then((next) => {
        if (cancelled) return
        saveSpotifyTokens(next)
        setTokens(next)
        setError('')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not connect Spotify')
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })

    return () => {
      cancelled = true
    }
  }, [configured])

  useEffect(() => {
    if (!connected) return

    let timer = 0
    let stopped = false

    const tick = async () => {
      if (stopped || document.visibilityState === 'hidden') return
      await syncNowPlaying()
      await refreshPartner()
    }

    void tick()
    timer = window.setInterval(() => void tick(), POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [connected, refreshPartner, syncNowPlaying])

  useEffect(() => {
    if (connected || !isCloud || !coupleId || !slot) return

    let cancelled = false
    const load = async () => {
      if (cancelled || document.visibilityState === 'hidden') return
      await refreshPartner()
    }

    void load()
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [connected, coupleId, isCloud, refreshPartner, slot])

  const connect = useCallback(async () => {
    if (!configured) {
      setError('Add VITE_SPOTIFY_CLIENT_ID to enable Spotify.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await beginSpotifyLogin()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Could not start Spotify login')
    }
  }, [configured])

  const disconnect = useCallback(async () => {
    setBusy(true)
    try {
      if (isCloud && coupleId && slot) {
        await deleteListeningStatus(coupleId, slot)
      }
      clearSpotifyTokens()
      setTokens(null)
      setYouStatus(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect Spotify')
    } finally {
      setBusy(false)
    }
  }, [coupleId, isCloud, slot])

  const value = useMemo<SpotifyListeningContextValue>(() => {
    const you = toCard(
      youStatus,
      'you',
      youStatus?.displayName || profile.nameYou,
      connected,
    )
    const partner = toCard(
      partnerStatus,
      'partner',
      partnerStatus?.displayName || profile.namePartner,
    )

    return {
      configured,
      connected,
      displayName: tokens?.displayName ?? '',
      busy,
      error,
      you,
      partner,
      isCloud,
      connect,
      disconnect,
    }
  }, [
    busy,
    configured,
    connect,
    connected,
    disconnect,
    error,
    isCloud,
    partnerStatus,
    profile.namePartner,
    profile.nameYou,
    tokens?.displayName,
    youStatus,
  ])

  return (
    <SpotifyListeningContext.Provider value={value}>{children}</SpotifyListeningContext.Provider>
  )
}

export function useSpotifyListening() {
  const ctx = useContext(SpotifyListeningContext)
  if (!ctx) {
    throw new Error('useSpotifyListening must be used within SpotifyListeningProvider')
  }
  return ctx
}

export function listeningEyebrow(card: ListeningCard): string {
  if (!card.connected) return 'Spotify'
  if (!card.trackName) return 'Spotify'
  return card.isPlaying ? 'Listening now' : 'Recently played'
}
