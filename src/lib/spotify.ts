/**
 * Spotify Authorization Code + PKCE helpers (no client secret).
 * Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
].join(' ')

const VERIFIER_KEY = 'cuddles-club-spotify-verifier'
const STATE_KEY = 'cuddles-club-spotify-state'

export function isSpotifyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SPOTIFY_CLIENT_ID)
}

export function getSpotifyClientId(): string {
  return (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined)?.trim() ?? ''
}

export function getSpotifyRedirectUri(): string {
  const base = import.meta.env.BASE_URL || '/'
  const path = base.endsWith('/') ? base : `${base}/`
  const url = new URL(`${window.location.origin}${path}`)
  // Spotify rejects "localhost"; loopback IP is required for local HTTP redirects.
  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1'
  }
  return url.href
}

/** Same-origin hop so PKCE verifier/tokens survive the Spotify redirect. */
export function ensureSpotifyLoopbackOrigin(): boolean {
  if (window.location.hostname !== 'localhost') return false
  const next = new URL(window.location.href)
  next.hostname = '127.0.0.1'
  sessionStorage.setItem('cuddles-club-spotify-pending-connect', '1')
  window.location.assign(next.toString())
  return true
}

export function consumeSpotifyPendingConnect(): boolean {
  const pending = sessionStorage.getItem('cuddles-club-spotify-pending-connect') === '1'
  if (pending) sessionStorage.removeItem('cuddles-club-spotify-pending-connect')
  return pending
}

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function beginSpotifyLogin(): Promise<void> {
  const clientId = getSpotifyClientId()
  if (!clientId) throw new Error('Spotify is not configured')

  if (ensureSpotifyLoopbackOrigin()) return

  const verifier = randomString(64)
  const state = randomString(24)
  const challenge = await sha256Base64Url(verifier)

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getSpotifyRedirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`)
}

export interface SpotifyTokenSet {
  accessToken: string
  refreshToken: string
  expiresAt: number
  displayName: string
  spotifyUserId: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Spotify token request failed')
  }
  return (await response.json()) as TokenResponse
}

export async function exchangeSpotifyCode(code: string, state: string | null): Promise<SpotifyTokenSet> {
  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)

  if (!verifier) throw new Error('Missing Spotify login session. Try connecting again.')
  if (!expectedState || !state || expectedState !== state) {
    throw new Error('Spotify login state mismatch. Try connecting again.')
  }

  const tokens = await postToken(
    new URLSearchParams({
      client_id: getSpotifyClientId(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: getSpotifyRedirectUri(),
      code_verifier: verifier,
    }),
  )

  if (!tokens.refresh_token) {
    throw new Error('Spotify did not return a refresh token. Try disconnecting and connecting again.')
  }

  const profile = await fetchSpotifyProfile(tokens.access_token)

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    displayName: profile.display_name || profile.id,
    spotifyUserId: profile.id,
  }
}

export async function refreshSpotifyTokens(refreshToken: string): Promise<SpotifyTokenSet> {
  const tokens = await postToken(
    new URLSearchParams({
      client_id: getSpotifyClientId(),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  )

  const nextRefresh = tokens.refresh_token ?? refreshToken
  const profile = await fetchSpotifyProfile(tokens.access_token)

  return {
    accessToken: tokens.access_token,
    refreshToken: nextRefresh,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    displayName: profile.display_name || profile.id,
    spotifyUserId: profile.id,
  }
}

interface SpotifyProfile {
  id: string
  display_name: string | null
}

async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Could not load Spotify profile')
  return (await response.json()) as SpotifyProfile
}

export interface SpotifyNowPlaying {
  trackId: string | null
  trackName: string | null
  artists: string | null
  albumName: string | null
  albumArtUrl: string | null
  trackUrl: string | null
  isPlaying: boolean
}

function emptyNowPlaying(): SpotifyNowPlaying {
  return {
    trackId: null,
    trackName: null,
    artists: null,
    albumName: null,
    albumArtUrl: null,
    trackUrl: null,
    isPlaying: false,
  }
}

function fromTrack(track: {
  id?: string
  name?: string
  artists?: { name: string }[]
  album?: { name?: string; images?: { url: string }[] }
  external_urls?: { spotify?: string }
}, isPlaying: boolean): SpotifyNowPlaying {
  return {
    trackId: track.id ?? null,
    trackName: track.name ?? null,
    artists: track.artists?.map((a) => a.name).join(', ') || null,
    albumName: track.album?.name ?? null,
    albumArtUrl: track.album?.images?.[0]?.url ?? null,
    trackUrl: track.external_urls?.spotify ?? null,
    isPlaying,
  }
}

export async function fetchNowPlaying(accessToken: string): Promise<SpotifyNowPlaying> {
  const current = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (current.status === 204) {
    return fetchRecentlyPlayed(accessToken)
  }

  if (current.status === 401) {
    throw new Error('SPOTIFY_UNAUTHORIZED')
  }

  if (!current.ok) {
    throw new Error('Could not read what you are playing')
  }

  const data = (await current.json()) as {
    is_playing?: boolean
    currently_playing_type?: string
    item?: {
      id?: string
      name?: string
      artists?: { name: string }[]
      album?: { name?: string; images?: { url: string }[] }
      external_urls?: { spotify?: string }
    } | null
  }

  // Only treat actively playing tracks as "now". Otherwise show recently played.
  if (data.is_playing && data.item && data.currently_playing_type !== 'ad') {
    return fromTrack(data.item, true)
  }

  return fetchRecentlyPlayed(accessToken)
}

async function fetchRecentlyPlayed(accessToken: string): Promise<SpotifyNowPlaying> {
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 401) throw new Error('SPOTIFY_UNAUTHORIZED')
  if (!response.ok) return emptyNowPlaying()

  const data = (await response.json()) as {
    items?: {
      track?: {
        id?: string
        name?: string
        artists?: { name: string }[]
        album?: { name?: string; images?: { url: string }[] }
        external_urls?: { spotify?: string }
      }
    }[]
  }

  const track = data.items?.[0]?.track
  if (!track) return emptyNowPlaying()
  return fromTrack(track, false)
}

export function readSpotifyCallbackParams(): { code: string | null; state: string | null; error: string | null } {
  const params = new URLSearchParams(window.location.search)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  }
}

export function clearSpotifyCallbackParams(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash)
}
