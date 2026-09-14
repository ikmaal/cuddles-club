import { useDeadlinePush } from '../hooks/useDeadlinePush'

export function DeadlinePushSettingsCard() {
  const push = useDeadlinePush()

  if (!push.isCloud) {
    return (
      <section className="surface push-settings-card" aria-label="Deadline reminders">
        <div className="section-head section-head--tight">
          <h2>Deadline reminders</h2>
        </div>
        <p className="push-settings-card__body">
          Sign in above to get phone reminders before assignment due dates.
        </p>
      </section>
    )
  }

  if (!push.configured) {
    return (
      <section className="surface push-settings-card" aria-label="Deadline reminders">
        <div className="section-head section-head--tight">
          <h2>Deadline reminders</h2>
        </div>
        <p className="push-settings-card__body">
          {push.supportError ?? 'Deadline reminders are not configured yet.'}
        </p>
      </section>
    )
  }

  return (
    <section className="surface push-settings-card" aria-label="Deadline reminders">
      <div className="section-head section-head--tight">
        <h2>Deadline reminders</h2>
        {push.subscribed ? <span className="tag tag-positive">On</span> : null}
      </div>

      <p className="push-settings-card__body">
        Get notified 3 days before, 1 day before, and on assignment due dates — even when the app
        is closed. On iPhone, add Cuddles Club to your Home Screen first.
      </p>

      <div className="push-settings-card__actions">
        {push.subscribed ? (
          <>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
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
              Turn off
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => void push.enable()}
            disabled={push.busy}
          >
            {push.busy ? 'Enabling…' : 'Enable reminders'}
          </button>
        )}
      </div>

      {push.message ? (
        <p className="push-settings-card__message" role="status">
          {push.message}
        </p>
      ) : null}
    </section>
  )
}
