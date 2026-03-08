// supabase/functions/push-cron/index.ts
// Appelé quotidiennement par pg_cron — envoie les rappels selon les horaires

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SEND_PUSH_URL     = `${SUPABASE_URL}/functions/v1/send-push`

async function dbQuery(query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ query })
  })
  return res.json()
}

Deno.serve(async (req) => {
  const hour = new Date().getUTCHours()
  
  // Déterminer l'horaire selon l'heure UTC (France = UTC+1 ou UTC+2)
  let horaire = ''
  if (hour === 7 || hour === 6)  horaire = 'matin'   // 8h France
  if (hour === 11 || hour === 10) horaire = 'midi'   // 12h France
  if (hour === 19 || hour === 18) horaire = 'soir'   // 20h France

  console.log('[cron] UTC hour:', hour, 'horaire:', horaire || 'none')
  if (!horaire) return Response.json({ ok: true, skipped: true, hour })

  // Récupérer les users abonnés à cet horaire
  const url = new URL(`${SUPABASE_URL}/rest/v1/push_subscriptions`)
  url.searchParams.set('select', 'user_id')
  url.searchParams.set('horaires', `cs.{"${horaire}"}`)

  const res = await fetch(url.toString(), {
    headers: {
      'apikey':        SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
    }
  })
  const subs = await res.json()
  console.log('[cron] subs for', horaire, ':', subs?.length ?? 0)

  if (!subs?.length) return Response.json({ ok: true, sent: 0, horaire })

  const userIds = [...new Set(subs.map((s: { user_id: string }) => s.user_id))]

  const sendRes = await fetch(SEND_PUSH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ type: 'ritual_reminder', userIds }),
  })
  const result = await sendRes.json()
  console.log('[cron] result:', result)

  return Response.json({ ok: true, horaire, userIds: userIds.length, ...result })
})
