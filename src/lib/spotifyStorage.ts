import type { SpotifyTokenSet } from './spotify'

const TOKEN_KEY = 'cuddles-club-spotify-tokens-v1'

export function loadSpotifyTokens(): SpotifyTokenSet | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SpotifyTokenSet
    if (!parsed?.accessToken || !parsed?.refreshToken) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSpotifyTokens(tokens: SpotifyTokenSet): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

export function clearSpotifyTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}
