import { BackIcon } from './Icons'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
  action?: React.ReactNode
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <button type="button" className="screen-header__back" onClick={onBack}>
        <BackIcon size={22} />
        <span className="sr-only">Back to home</span>
      </button>
      <div className="screen-header__text">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="screen-header__action">{action}</div> : null}
    </header>
  )
}
