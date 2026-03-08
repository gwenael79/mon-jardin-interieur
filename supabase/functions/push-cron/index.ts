// supabase/functions/push-cron/index.ts
// Cron quotidien — envoie les push selon l'état de chaque jardin
//
// Deploy   : supabase functions deploy push-cron
// Schedule : dans Supabase Dashboard > Edge Functions > push-cron > Schedule
//            Cron expression : 0 18 * * *   (tous les jours à 18h UTC)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_ID = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const SEND_PUSH_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function callSendPush(payload: object) {
  const res = await fetch(SEND_PUSH_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  return res.json()
}

Deno.serve(async (req) => {
  // Vérification sécurité
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SERVICE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ── 1. Récupère tous les users avec une subscription push ─────────────────
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id')
    .neq('user_id', ADMIN_ID)

  if (!subs?.length) return Response.json({ ok: true, sent: 0, reason: 'no subscriptions' })

  const userIds = [...new Set(subs.map(s => s.user_id))]

  // ── 2. Calcule les jours d'absence via la vue user_last_activity ──────────
  const { data: activities } = await supabase
    .from('user_last_activity')
    .select('user_id, days_since')
    .in('user_id', userIds)

  const activityMap: Record<string, number> = {}
  ;(activities ?? []).forEach(a => { activityMap[a.user_id] = a.days_since ?? 999 })

  // ── 3. Groupe par type de notification à envoyer ──────────────────────────
  const groups: Record<string, string[]> = {
    ritual_reminder: [],
    degradation_1:   [],
    degradation_3:   [],
    degradation_7:   [],
  }

  for (const userId of userIds) {
    const days = activityMap[userId] ?? 999

    if (days === 0) {
      // Actif aujourd'hui → rappel rituel du soir (si pas encore fait)
      groups['ritual_reminder'].push(userId)
    } else if (days === 1) {
      groups['degradation_1'].push(userId)
    } else if (days >= 3 && days <= 6) {
      groups['degradation_3'].push(userId)
    } else if (days >= 7) {
      groups['degradation_7'].push(userId)
    }
  }

  // ── 4. Envoie chaque groupe ───────────────────────────────────────────────
  let totalSent = 0
  const results: Record<string, number> = {}

  for (const [type, ids] of Object.entries(groups)) {
    if (!ids.length) continue
    const res = await callSendPush({ type, userIds: ids })
    results[type] = res.sent ?? 0
    totalSent += results[type]
  }

  console.log('[push-cron] results:', results, 'total:', totalSent)
  return Response.json({ ok: true, sent: totalSent, breakdown: results })
})
