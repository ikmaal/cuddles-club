export function PhotoboothBanner() {
  return (
    <figure className="booth-banner">
      <img
        className="booth-banner__art"
        src={`${import.meta.env.BASE_URL}photoboothbanner.jpg`}
        alt="Photobooth"
      />
    </figure>
  )
}
