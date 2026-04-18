import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEMEIO_API_KEY = Deno.env.get('SYSTEMEIO_API_KEY') ?? ''
const SYSTEMEIO_TAG_ID  = Deno.env.get('SYSTEMEIO_TAG_ID')  ?? ''  // optionnel

Deno.serve(async (req) => {
  // Supabase appelle cette fonction via un Database Webhook (INSERT sur users)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: { record?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const record = body.record
  if (!record?.email) {
    return new Response('No email in record', { status: 400 })
  }

  const contact: Record<string, unknown> = {
    email:     record.email,
    firstName: record.display_name ?? '',
  }

  // Ajouter un tag si configuré
  if (SYSTEMEIO_TAG_ID) {
    contact.tagIds = [Number(SYSTEMEIO_TAG_ID)]
  }

  const res = await fetch('https://api.systeme.io/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SYSTEMEIO_API_KEY,
    },
    body: JSON.stringify(contact),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[register-to-systemeio] Systeme.io error:', res.status, text)
    return new Response(`Systeme.io error: ${res.status}`, { status: 502 })
  }

  const data = await res.json()
  console.log('[register-to-systemeio] Contact créé:', data?.id)
  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
