// Supabase Edge Function — register-to-systemeio

const SYSTEMEIO_API_KEY  = Deno.env.get('SYSTEMEIO_API_KEY')   ?? ''
const TAG_ID_PARTICULIER = Deno.env.get('SYSTEMEIO_TAG_ID')     ?? ''
const TAG_ID_PRO         = Deno.env.get('SYSTEMEIO_PRO_TAG_ID') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEMEIO_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': SYSTEMEIO_API_KEY,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) {
    console.warn('[systemeio] ✗ pas de header Authorization')
    return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch (err) {
    console.error('[systemeio] ✗ JSON invalide:', err)
    return new Response('Invalid JSON', { status: 400, headers: CORS_HEADERS })
  }

  // ── Détection du mode : webhook DB (trigger INSERT users) ou appel manuel ──
  const isWebhook = body.type === 'INSERT' && body.table === 'users'

  let email  = ''
  let prenom = ''
  let nom    = ''
  let role   = 'particulier'

  if (isWebhook) {
    const rec = body.record as Record<string, unknown>
    email     = String(rec?.email ?? '').trim()
    const dn  = String(rec?.display_name ?? '').trim()
    prenom    = dn.split(' ')[0] ?? ''
    nom       = dn.split(' ').slice(1).join(' ') ?? ''
    role      = String(rec?.role ?? 'user') === 'pro' ? 'pro' : 'particulier'
  } else {
    const rec = body.record as Record<string, unknown>
    if (!rec) return new Response('No record in body', { status: 400, headers: CORS_HEADERS })
    email  = String(rec.email  ?? '').trim()
    prenom = String(rec.prenom ?? '').trim()
    nom    = String(rec.nom    ?? '').trim()
    role   = String(rec.role   ?? 'particulier') === 'pro' ? 'pro' : 'particulier'
  }

  if (!email) {
    console.error('[systemeio] ✗ email vide')
    return new Response('No email', { status: 400, headers: CORS_HEADERS })
  }

  console.log('[systemeio] email:', email, '| role:', role, '| mode:', isWebhook ? 'webhook' : 'manuel')

  const fields: { slug: string; value: string }[] = []
  if (prenom) fields.push({ slug: 'first_name', value: prenom })
  if (nom)    fields.push({ slug: 'surname',    value: nom })

  const contactPayload: Record<string, unknown> = { email }
  if (fields.length > 0) contactPayload.fields = fields

  // ── ÉTAPE 1 : Créer ou retrouver le contact ──────────────────────────────
  let contactId: number | null = null

  let contactRes: Response
  try {
    contactRes = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: SYSTEMEIO_HEADERS,
      body: JSON.stringify(contactPayload),
    })
  } catch (err) {
    console.error('[systemeio] ✗ erreur réseau step1:', err)
    return new Response('Network error', { status: 502, headers: CORS_HEADERS })
  }

  const contactBodyText = await contactRes.text()
  console.log('[systemeio] STEP1 status:', contactRes.status, '| body:', contactBodyText.slice(0, 200))

  if (contactRes.ok) {
    try {
      const created = JSON.parse(contactBodyText) as { id: number }
      contactId = created?.id ?? null
    } catch(_) {}
  } else {
    // Pour tout code non-ok (y compris 409 doublon), on recherche le contact par email.
    // Cela couvre le cas du double appel (trigger DB + appel manuel) sans provoquer de 502.
    console.log('[systemeio] contact non créé (status', contactRes.status, ') → recherche par email')
    try {
      const getRes  = await fetch(`https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`, {
        headers: SYSTEMEIO_HEADERS,
      })
      const getData = await getRes.json() as { items?: { id: number }[] }
      contactId     = getData?.items?.[0]?.id ?? null
      console.log('[systemeio] contact trouvé par email:', contactId)

      if (contactId && fields.length > 0) {
        await fetch(`https://api.systeme.io/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: SYSTEMEIO_HEADERS,
          body: JSON.stringify({ fields }),
        })
      }
    } catch(e) {
      console.error('[systemeio] ✗ erreur recherche contact:', e)
    }
  }

  if (!contactId) {
    console.error('[systemeio] ✗ pas d\'id contact — status step1:', contactRes.status, contactBodyText)
    return new Response(JSON.stringify({ ok: false, error: 'no contact id' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  console.log('[systemeio] ✓ contact id:', contactId)

  // ── ÉTAPE 2 : Assigner le tag ─────────────────────────────────────────────
  const rawTagId = role === 'pro' ? TAG_ID_PRO.trim() : TAG_ID_PARTICULIER.trim()
  const tagIdNum = parseInt(rawTagId, 10)

  if (!rawTagId || isNaN(tagIdNum)) {
    console.warn('[systemeio] ⚠ pas de tag configuré pour le rôle:', role)
    return new Response(JSON.stringify({ ok: true, id: contactId, tagged: false }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let tagRes: Response
  try {
    tagRes = await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: SYSTEMEIO_HEADERS,
      body: JSON.stringify({ tagId: tagIdNum }),
    })
    console.log('[systemeio] STEP2 tag status:', tagRes.status)
  } catch (err) {
    console.error('[systemeio] ✗ erreur réseau step2 (tag):', err)
    return new Response(JSON.stringify({ ok: true, id: contactId, tagged: false }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const tagged = tagRes.ok || tagRes.status === 409
  if (!tagged) {
    console.error('[systemeio] ✗ échec tag:', tagRes.status)
  }

  return new Response(JSON.stringify({ ok: true, id: contactId, role, tagged }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
