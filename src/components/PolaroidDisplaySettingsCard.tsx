interface PolaroidDisplaySettingsCardProps {
  onDecorate: () => void
}

export function PolaroidDisplaySettingsCard({ onDecorate }: PolaroidDisplaySettingsCardProps) {
  return (
    <section className="surface display-settings-card" aria-label="Home display">
      <div className="display-settings-card__intro">
        <h2>Home scenery</h2>
        <p>
          Add images or paste from your clipboard, then drag stickers around the home Polaroid.
        </p>
      </div>
      <button type="button" className="btn btn--primary btn--sm" onClick={onDecorate}>
        Decorate scenery
      </button>
    </section>
  )
}
