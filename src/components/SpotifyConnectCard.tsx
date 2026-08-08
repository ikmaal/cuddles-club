import { useSpotifyListening } from '../context/SpotifyListeningContext'

export function SpotifyConnectCard() {
  const {
    configured,
    connected,
    displayName,
    busy,
    error,
    isCloud,
    connect,
    disconnect,
  } = useSpotifyListening()

  if (!configured) {
    return (
      <section className="surface cloud-card spotify-card">
        <div className="section-head section-head--tight">
          <h2>Spotify</h2>
        </div>
        <p className="cloud-card__body">
          Add <code>VITE_SPOTIFY_CLIENT_ID</code> to connect Spotify and show what each of you is
          listening to in Lately.
        </p>
      </section>
    )
  }

  return (
    <section className="surface cloud-card spotify-card">
      <div className="section-head section-head--tight">
        <h2>Spotify</h2>
        {connected ? <span className="tag tag-positive">Connected</span> : null}
      </div>
      <p className="cloud-card__body">
        {connected
          ? `Connected as ${displayName}. Your listening updates on Home → Lately.`
          : 'Connect your Spotify so your partner can see what you’re listening to.'}
      </p>
      {!isCloud ? (
        <p className="cloud-card__body">
          Cloud sync is needed for your partner to see your listening on their phone.
        </p>
      ) : null}
      {error ? (
        <p className="cloud-card__error" role="alert">
          {error}
        </p>
      ) : null}
      {connected ? (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void disconnect()}
          disabled={busy}
        >
          Disconnect Spotify
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => void connect()}
          disabled={busy}
        >
          {busy ? 'Connecting…' : 'Connect Spotify'}
        </button>
      )}
    </section>
  )
}
