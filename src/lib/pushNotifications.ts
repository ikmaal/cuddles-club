import type { MemberSlot } from './coupleSlot'
import { isSupabaseConfigured, supabase } from './supabase'

export const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? ''

export function isPushConfigured(): boolean {
  return Boolean(isSupabaseConfigured && VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window)
}

export function pushSupportError(): string | null {
  if (!isSupabaseConfigured) return 'Sign in on the Us tab to enable deadline reminders.'
  if (!VAPID_PUBLIC_KEY) return 'Push notifications are not configured yet.'
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'This browser does not support push notifications.'
  }
  return null
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }
  return output
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    })
  } catch {
    return null
  }
}

export async function getPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushConfigured()) return false
  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  if (!registration) return false
  const subscription = await registration.pushManager.getSubscription()
  return Boolean(subscription)
}

export async function subscribeToDeadlinePush(
  coupleId: string,
  memberSlot: MemberSlot,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supportError = pushSupportError()
  if (supportError) return { ok: false, message: supportError }
  if (!supabase) return { ok: false, message: 'Sign in on the Us tab to enable deadline reminders.' }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { ok: false, message: 'Sign in on the Us tab to enable deadline reminders.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, message: 'Notification permission was denied.' }
  }

  const registration = (await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)) ??
    (await registerServiceWorker())
  if (!registration) return { ok: false, message: 'Could not register the notification service.' }

  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return { ok: false, message: 'Could not read your push subscription.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      couple_id: coupleId,
      user_id: user.id,
      member_slot: memberSlot,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent.slice(0, 240),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' },
  )

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function unsubscribeFromDeadlinePush(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: 'Sign in on the Us tab first.' }

  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  const subscription = registration ? await registration.pushManager.getSubscription() : null

  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }

  return { ok: true }
}

export async function showTestDeadlineNotification(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!('Notification' in window)) {
    return { ok: false, message: 'This browser does not support notifications.' }
  }

  if (Notification.permission !== 'granted') {
    return { ok: false, message: 'Enable deadline reminders first and allow notifications.' }
  }

  const registration =
    (await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)) ??
    (await registerServiceWorker())
  if (!registration) {
    return { ok: false, message: 'Could not register the notification service.' }
  }

  await navigator.serviceWorker.ready

  const iconUrl = `${import.meta.env.BASE_URL}favicon.jpg`
  await registration.showNotification('Deadline in 3 days', {
    body: 'Sample assignment · CS101 is due in 3 days.',
    icon: iconUrl,
    badge: iconUrl,
    tag: 'study-deadline-test',
    data: { url: import.meta.env.BASE_URL },
  })

  return { ok: true }
}
