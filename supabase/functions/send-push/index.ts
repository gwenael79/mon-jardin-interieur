// supabase/functions/send-push/index.ts
// Web Push implémenté avec Web Crypto API native — aucune dépendance npm

// pas de client supabase-js — fetch direct

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Fetch direct vers l'API REST Supabase (bypass client JS)
async function dbSelect(table: string, filters: Record<string, string>) {
  const url  = new URL(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}`)
  Object.entries(filters).forEach(([k, v]) => url.searchParams.set(k, `eq.${v}`))
  url.searchParams.set('select', '*')
  console.log('[db] fetching:', url.toString().slice(0, 120))
  const res  = await fetch(url.toString(), {
    headers: {
      'apikey':        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type':  'application/json',
    }
  })
  const text = await res.text()
  console.log('[db] status:', res.status, 'body:', text.slice(0, 200))
  if (!res.ok) { console.error('[db] error:', res.status, text); return [] }
  try { return JSON.parse(text) } catch { return [] }
}

async function dbDelete(table: string, id: string) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}?id=eq.${id}`
  await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey':        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    }
  })
}

// ── Base64url helpers ─────────────────────────────────────────────────────────
function b64uDecode(s: string): Uint8Array {
  const pad = s + '='.repeat((4 - s.length % 4) % 4)
  const b64 = pad.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}
function b64uEncode(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── VAPID JWT ─────────────────────────────────────────────────────────────────
async function makeVapidJWT(audience: string, subject: string, privateKeyB64: string, publicKeyB64?: string): Promise<string> {
  const header  = { typ: 'JWT', alg: 'ES256' }
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject }
  const enc     = (o: object) => b64uEncode(new TextEncoder().encode(JSON.stringify(o)))
  const signing = `${enc(header)}.${enc(payload)}`

  // Extraire x et y depuis la clé publique (65 bytes: 0x04 + 32 + 32)
  const pubBytes = publicKeyB64 ? b64uDecode(publicKeyB64) : new Uint8Array(65)
  const x = b64uEncode(pubBytes.slice(1, 33))
  const y = b64uEncode(pubBytes.slice(33, 65))

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: privateKeyB64, x, y, key_ops: ['sign'], ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signing)
  )
  return `${signing}.${b64uEncode(sig)}`
}

// ── HKDF ──────────────────────────────────────────────────────────────────────
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const ikmKey  = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const prk     = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: new Uint8Array(0) }, ikmKey, 256)
  const prkKey  = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits'])
  const bits    = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info }, prkKey, length * 8)
  return new Uint8Array(bits)
}

// ── Chiffrement RFC8291 ───────────────────────────────────────────────────────
async function encrypt(plaintext: string, p256dh: string, auth: string): Promise<{ body: Uint8Array, salt: Uint8Array, serverPub: Uint8Array }> {
  const clientPubKey = b64uDecode(p256dh)
  const authSecret   = b64uDecode(auth)
  const salt         = crypto.getRandomValues(new Uint8Array(16))

  const serverKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey))

  const clientKey = await crypto.subtle.importKey('raw', clientPubKey, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKP.privateKey, 256))

  // ikm = HKDF(auth, sharedBits || clientPub || serverPub, "Content-Encoding: auth\0", 32)
  const ikmInfo = concat(new TextEncoder().encode('Content-Encoding: auth\0'), clientPubKey, serverPubRaw)
  const ikm     = await hkdf(authSecret, sharedBits, ikmInfo, 32)

  // cek = HKDF(salt, ikm, "Content-Encoding: aesgcm\0" || context, 16)
  const context  = concat(new TextEncoder().encode('P-256\0'), u16(clientPubKey.length), clientPubKey, u16(serverPubRaw.length), serverPubRaw)
  const cekInfo  = concat(new TextEncoder().encode('Content-Encoding: aesgcm\0'), context)
  const nonceInfo= concat(new TextEncoder().encode('Content-Encoding: nonce\0'), context)
  const cek      = await hkdf(salt, ikm, cekInfo, 16)
  const nonce    = await hkdf(salt, ikm, nonceInfo, 12)

  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const padded = concat(new Uint8Array(2), new TextEncoder().encode(plaintext)) // 2 bytes padding length = 0
  const body   = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded))

  return { body, salt, serverPub: serverPubRaw }
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out   = new Uint8Array(total)
  let offset  = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}
function u16(n: number): Uint8Array { return new Uint8Array([(n >> 8) & 0xff, n & 0xff]) }

// ── Payloads ──────────────────────────────────────────────────────────────────
function buildPayload(type: string, data?: Record<string, string>) {
  const map: Record<string, object> = {
    ritual_reminder: { title: '✨ Votre rituel vous attend',       body: "Un moment pour vous aujourd'hui.",          tag: 'ritual',      url: '/' },
    degradation_1:   { title: '🌿 Votre jardin vous attend',      body: 'Revenez cultiver votre équilibre.',          tag: 'degradation', url: '/' },
    degradation_3:   { title: '🍂 Votre plante a besoin de vous', body: 'Cela fait 3 jours…',                         tag: 'degradation', url: '/' },
    degradation_7:   { title: '🥀 Votre jardin vous attend',      body: 'Votre jardin est fragile.',                  tag: 'degradation', url: '/' },
    coeur_recu:      { title: "💚 Quelqu'un pense à vous",        body: data?.senderName ? `${data.senderName} vous a envoyé un cœur.` : 'Un cœur bienveillant.', tag: 'coeur', url: '/' },
  }
  return map[type] ?? map['ritual_reminder']
}

// ── Envoi ─────────────────────────────────────────────────────────────────────
async function sendToUser(userId: string, type: string, data?: Record<string, string>) {
  const pubKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const privKey = Deno.env.get('VAPID_PRIVATE_KEY')!
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@monjardin.app'

  console.log('[send] pubKey length:', pubKey?.length, 'privKey length:', privKey?.length)

  console.log('[send] querying for userId:', userId)
  const subs = await dbSelect('push_subscriptions', { user_id: userId })
  console.log('[send] subs count:', subs?.length ?? 0, 'raw:', JSON.stringify(subs?.slice(0,1)))
  if (!subs?.length) { console.log('[send] no subs for', userId); return { sent: 0 } }

  const payload = JSON.stringify(buildPayload(type, data))
  let sent = 0

  for (const sub of subs) {
    try {
      const { body, salt, serverPub } = await encrypt(payload, sub.p256dh, sub.auth)
      const url      = new URL(sub.endpoint)
      const audience = `${url.protocol}//${url.host}`
      console.log('[jwt] audience:', audience)
      const jwt      = await makeVapidJWT(audience, subject, privKey, pubKey)
      console.log('[jwt] generated parts:', jwt.split('.').length, 'sig length:', jwt.split('.')[2]?.length)
console.log('[jwt] full:', jwt)
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Authorization':    `WebPush ${jwt}`,
          'Crypto-Key':       `p256ecdsa=${pubKey};dh=${b64uEncode(serverPub)}`,
          'Content-Encoding': 'aesgcm',
          'Content-Type':     'application/octet-stream',
          'Encryption':       `salt=${b64uEncode(salt)}`,
          'TTL':              '86400',
        },
        body,
      })
      const resText = await res.text()
      console.log('[send] endpoint status:', res.status, 'body:', resText.slice(0, 300))
      if (res.status === 410 || res.status === 404) {
        await dbDelete('push_subscriptions', sub.id)
      }
      if (res.ok || res.status === 201) sent++
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

  // Auth temporairement désactivée pour test
  console.log('[auth] token reçu:', (req.headers.get('Authorization') ?? '').slice(0, 20))

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
