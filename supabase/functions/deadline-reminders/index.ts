import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

type ReminderKey = 'due_3' | 'due_1' | 'due_0'

interface MaterialRow {
  id: string
  couple_id: string
  title: string
  due_date: string
  module_id: string
  academic_modules: {
    owner_slot: 'a' | 'b'
    code: string
    title: string
  } | null
}

interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

const REMINDER_BY_DAYS: Record<number, ReminderKey> = {
  3: 'due_3',
  1: 'due_1',
  0: 'due_0',
}

function daysUntilDue(dueDate: string): number | null {
  if (!dueDate) return null
  const due = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(due.getTime())) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function reminderCopy(days: number, title: string, moduleCode: string) {
  const label = moduleCode ? `${title} · ${moduleCode}` : title
  if (days === 0) return { title: 'Due today', body: `${label} is due today.` }
  if (days === 1) return { title: 'Due tomorrow', body: `${label} is due tomorrow.` }
  return { title: 'Deadline in 3 days', body: `${label} is due in 3 days.` }
}

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim()
  const cronSecret = (Deno.env.get('CRON_SECRET') ?? '').trim()
  if (!bearer) return false
  if (serviceKey && bearer === serviceKey) return true
  if (cronSecret && bearer === cronSecret) return true
  return isLegacyServiceRoleJwt(bearer)
}

function isLegacyServiceRoleJwt(token: string): boolean {
  if (!token.startsWith('eyJ')) return false
  const projectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return false
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role' && (!projectRef || payload.ref === projectRef)
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@cuddlesclub.app'
  const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'https://ikmaal.github.io/cuddles-club/'

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return new Response('Missing server configuration', { status: 500 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: materials, error: materialsError } = await supabase
    .from('academic_materials')
    .select('id, couple_id, title, due_date, module_id, academic_modules ( owner_slot, code, title )')
    .eq('kind', 'assignment')
    .eq('done', false)
    .not('due_date', 'is', null)

  if (materialsError) {
    return new Response(materialsError.message, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let removed = 0

  for (const row of (materials ?? []) as MaterialRow[]) {
    const days = daysUntilDue(row.due_date)
    if (days === null || days < 0) continue

    const reminderKey = REMINDER_BY_DAYS[days]
    if (!reminderKey) continue

    const ownerSlot = row.academic_modules?.owner_slot
    if (!ownerSlot) continue

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('couple_id', row.couple_id)
      .eq('member_slot', ownerSlot)

    if (subError || !subscriptions?.length) {
      skipped += 1
      continue
    }

    const copy = reminderCopy(days, row.title, row.academic_modules?.code ?? '')

    for (const subscription of subscriptions as PushSubscriptionRow[]) {
      const { data: existing } = await supabase
        .from('deadline_notification_sent')
        .select('id')
        .eq('material_id', row.id)
        .eq('user_id', subscription.user_id)
        .eq('reminder_key', reminderKey)
        .maybeSingle()

      if (existing) {
        skipped += 1
        continue
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: copy.title,
            body: copy.body,
            url: appUrl,
            tag: `${row.id}-${reminderKey}`,
          }),
        )

        await supabase.from('deadline_notification_sent').insert({
          couple_id: row.couple_id,
          material_id: row.id,
          user_id: subscription.user_id,
          reminder_key: reminderKey,
        })

        sent += 1
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
          removed += 1
        }
      }
    }
  }

  return Response.json({ sent, skipped, removed })
})
