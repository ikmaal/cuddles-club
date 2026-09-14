import { useCallback, useEffect, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import {
  getPushPermission,
  hasActivePushSubscription,
  isPushConfigured,
  pushSupportError,
  subscribeToDeadlinePush,
  unsubscribeFromDeadlinePush,
} from '../lib/pushNotifications'

export function useDeadlinePush() {
  const { isCloud, coupleId, slot } = useCouple()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    setPermission(await getPushPermission())
    setSubscribed(await hasActivePushSubscription())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, isCloud, coupleId])

  const enable = useCallback(async () => {
    if (!coupleId || !slot) {
      setMessage('Sign in on the Us tab to enable deadline reminders.')
      return false
    }
    setBusy(true)
    setMessage('')
    const result = await subscribeToDeadlinePush(coupleId, slot)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      await refresh()
      return false
    }
    await refresh()
    setMessage('Deadline reminders enabled.')
    return true
  }, [coupleId, refresh, slot])

  const disable = useCallback(async () => {
    setBusy(true)
    setMessage('')
    const result = await unsubscribeFromDeadlinePush()
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return false
    }
    await refresh()
    setMessage('Deadline reminders turned off.')
    return true
  }, [refresh])

  return {
    configured: isPushConfigured(),
    supportError: pushSupportError(),
    isCloud,
    permission,
    subscribed,
    busy,
    message,
    enable,
    disable,
    refresh,
  }
}
