// supabase/functions/send-push/index.ts
// Envoi via FCM v1 API avec OAuth2 JWT

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Base64url helpers ─────────────────────────────────────────────────────────
function b64uEncode(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Google OAuth2 JWT pour FCM ────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
  const privateKeyPem = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   clientEmail,
    sub:   clientEmail,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  const enc = (o: object) => b64uEncode(new TextEncoder().encode(JSON.stringify(o)))
  const signing = `${enc(header)}.${enc(payload)}`

  // Importer la clé RSA privée
  const pemBody = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const derBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8', derBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signing)
  )

  const jwt = `${signing}.${b64uEncode(sig)}`

  // Échanger le JWT contre un access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`OAuth2 error: ${JSON.stringify(data)}`)
  return data.access_token
}

// ── Payloads ──────────────────────────────────────────────────────────────────
function buildPayload(type: string, data?: Record<string, string>) {
  const map: Record<string, object> = {
    ritual_reminder: { title: '✨ Votre rituel vous attend',       body: "Un moment pour vous aujourd'hui.",          tag: 'ritual' },
    degradation_1:   { title: '🌿 Votre jardin vous attend',      body: 'Revenez cultiver votre équilibre.',          tag: 'degradation' },
    degradation_3:   { title: '🍂 Votre plante a besoin de vous', body: 'Cela fait 3 jours…',                         tag: 'degradation' },
    degradation_7:   { title: '🥀 Votre jardin vous attend',      body: 'Votre jardin est fragile.',                  tag: 'degradation' },
    coeur_recu:      { title: "💚 Quelqu'un pense à vous",        body: data?.senderName ? `${data.senderName} vous a envoyé un cœur.` : 'Un cœur bienveillant.', tag: 'coeur' },
  }
  return map[type] ?? map['ritual_reminder']
}

// ── Fetch REST Supabase ───────────────────────────────────────────────────────
async function dbSelect(table: string, filters: Record<string, string>) {
  const url = new URL(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}`)
  Object.entries(filters).forEach(([k, v]) => url.searchParams.set(k, `eq.${v}`))
  url.searchParams.set('select', '*')
  const res = await fetch(url.toString(), {
    headers: {
      'apikey':        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    }
  })
  const text = await res.text()
  if (!res.ok) { console.error('[db] error:', res.status, text); return [] }
  return JSON.parse(text)
}

async function dbDelete(table: string, id: string) {
  await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey':        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    }
  })
}

// ── Envoi FCM v1 ─────────────────────────────────────────────────────────────
async function sendToUser(userId: string, type: string, data?: Record<string, string>) {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')!
  const subs = await dbSelect('push_subscriptions', { user_id: userId })
  if (!subs?.length) { console.log('[send] no subs for', userId); return { sent: 0 } }

  const notif   = buildPayload(type, data) as Record<string, string>
  const token   = await getAccessToken()
  let sent = 0

  for (const sub of subs) {
    // Le endpoint stocké est "fcm:TOKEN" ou l'ancien format /fcm/send/TOKEN
    let fcmToken = sub.endpoint
    if (fcmToken.startsWith('fcm:')) {
      fcmToken = fcmToken.slice(4)
    } else if (fcmToken.includes('/fcm/send/')) {
      fcmToken = fcmToken.split('/fcm/send/')[1]
    }

    try {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            message: {
              token: fcmToken,
              notification: {
                title: notif.title,
                body:  notif.body,
              },
              webpush: {
                notification: {
                  icon:  '/icon-192.png',
                  badge: '/icon-192.png',
                  tag:   notif.tag,
                },
              },
            },
          }),
        }
      )
      const resText = await res.text()
      console.log('[send] FCM status:', res.status, resText.slice(0, 100))
      if (res.status === 404 || res.status === 410) {
        await dbDelete('push_subscriptions', sub.id)
      }
      if (res.ok) sent++
    } catch (e) {
      console.error('[send] error:', e)
    }
  }
  return { sent }
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  // Vérification auth par secret partagé
  const token      = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey    = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (token !== serviceKey && token !== anonKey) {
    return new Response('Unauthorized', { status: 401, headers: CORS })
  }

  const { type, userId, userIds, data } = await req.json().catch(() => ({}))

  if (userIds?.length) {
    const results = await Promise.all(userIds.map((id: string) => sendToUser(id, type, data)))
    return Response.json({ ok: true, sent: results.reduce((s, r) => s + r.sent, 0) }, { headers: CORS })
  }
  if (userId) {
    const result = await sendToUser(userId, type, data)
    return Response.json({ ok: true, ...result }, { headers: CORS })
  }
  return Response.json({ ok: false, error: 'userId required' }, { status: 400, headers: CORS })
})
