import { BellIcon } from './Icons'
import { useDeadlinePush } from '../hooks/useDeadlinePush'

const REMINDER_STEPS = [
  { label: '3 days before', detail: 'Early heads-up' },
  { label: '1 day before', detail: 'Final reminder' },
  { label: 'Due date', detail: 'Day-of alert' },
] as const

export function DeadlinePushSettingsCard() {
  const push = useDeadlinePush()

  if (!push.isCloud) {
    return (
      <section className="surface push-settings-card push-settings-card--muted" aria-label="Deadline reminders">
        <PushSettingsHeader subscribed={false} inactive />
        <p className="push-settings-card__empty">
          Sign in under Account to enable phone reminders for assignment due dates.
        </p>
      </section>
    )
  }

  if (!push.configured) {
    return (
      <section className="surface push-settings-card push-settings-card--muted" aria-label="Deadline reminders">
        <PushSettingsHeader subscribed={false} inactive />
        <p className="push-settings-card__empty">
          {push.supportError ?? 'Deadline reminders are not configured yet.'}
        </p>
      </section>
    )
  }

  return (
    <section
      className={`surface push-settings-card${push.subscribed ? ' push-settings-card--on' : ''}`}
      aria-label="Deadline reminders"
    >
      <PushSettingsHeader subscribed={push.subscribed} />

      <div className="push-settings-card__schedule" aria-label="Reminder schedule">
        {REMINDER_STEPS.map((step) => (
          <div className="push-settings-card__step" key={step.label}>
            <span className="push-settings-card__step-dot" aria-hidden />
            <div>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="push-settings-card__note">
        Notifications work even when the app is closed.
      </p>

      <p className="push-settings-card__tip">
        On iPhone, add Cuddles Club to your Home Screen for reliable push alerts.
      </p>

      {push.message ? (
        <p
          className={`push-settings-card__feedback${push.message.includes('enabled') || push.message.includes('sent') ? ' push-settings-card__feedback--ok' : ''}`}
          role="status"
        >
          {push.message}
        </p>
      ) : null}

      <div className="push-settings-card__actions">
        {push.subscribed ? (
          <>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void push.test()}
              disabled={push.busy}
            >
              {push.busy ? 'Sending…' : 'Send test notification'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => void push.disable()}
              disabled={push.busy}
            >
              Turn off reminders
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => void push.enable()}
            disabled={push.busy}
          >
            {push.busy ? 'Enabling…' : 'Enable deadline reminders'}
          </button>
        )}
      </div>
    </section>
  )
}

function PushSettingsHeader({
  subscribed,
  inactive = false,
}: {
  subscribed: boolean
  inactive?: boolean
}) {
  return (
    <div className="push-settings-card__hero">
      <div
        className={`push-settings-card__icon${subscribed ? ' push-settings-card__icon--on' : ''}${inactive ? ' push-settings-card__icon--muted' : ''}`}
        aria-hidden
      >
        <BellIcon size={22} />
      </div>
      <div className="push-settings-card__intro">
        <div className="push-settings-card__title-row">
          <h2>Deadline reminders</h2>
          {subscribed ? <span className="tag tag-positive">On</span> : null}
        </div>
        <p className="push-settings-card__subtitle">Study Together assignments</p>
      </div>
    </div>
  )
}
