import { useDeadlinePush } from '../hooks/useDeadlinePush'

export function DeadlinePushPrompt() {
  const push = useDeadlinePush()

  if (!push.isCloud) {
    return (
      <section className="acad-push acad-push--info" aria-label="Deadline reminders">
        <p>Sign in on the Us tab to get phone reminders before assignment due dates.</p>
      </section>
    )
  }

  if (!push.configured) {
    return (
      <section className="acad-push acad-push--info" aria-label="Deadline reminders">
        <p>{push.supportError ?? 'Deadline reminders are not configured yet.'}</p>
      </section>
    )
  }

  if (push.subscribed) {
    return (
      <section className="acad-push acad-push--on" aria-label="Deadline reminders">
        <div>
          <strong>Deadline reminders on</strong>
          <p>You&apos;ll get notified 3 days before, 1 day before, and on due dates.</p>
        </div>
        <button type="button" onClick={() => void push.disable()} disabled={push.busy}>
          Turn off
        </button>
        {push.message ? <p className="acad-push__message">{push.message}</p> : null}
      </section>
    )
  }

  return (
    <section className="acad-push" aria-label="Deadline reminders">
      <div>
        <strong>Get deadline reminders</strong>
        <p>
          Enable phone notifications for upcoming assignments, even when the app is closed. On iPhone,
          add Cuddles Club to your Home Screen first.
        </p>
      </div>
      <button type="button" onClick={() => void push.enable()} disabled={push.busy}>
        {push.busy ? 'Enabling…' : 'Enable reminders'}
      </button>
      {push.message ? <p className="acad-push__message">{push.message}</p> : null}
    </section>
  )
}
