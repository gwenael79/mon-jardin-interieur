// supabase/functions/clarity-proxy/index.ts
// Récupère les données de l'API Data Export de Microsoft Clarity.
// Le token CLARITY_API_TOKEN reste côté serveur — jamais exposé au navigateur.
// verify_jwt ACTIVÉ : protège le quota (10 req/jour) contre les appels non authentifiés.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Auth : vérification manuelle du JWT ────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non authentifié' }, 401)

    const { data: { user }, error: authErr } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return json({ error: 'Token invalide' }, 401)

    // ── Paramètres ─────────────────────────────────────────────────────────
    const { numOfDays = 1, dimensions = [] } = await req.json()

    const clampedDays = Math.min(Math.max(Number(numOfDays), 1), 3)
    const clampedDims: string[] = (dimensions as string[]).slice(0, 3)

    const params = new URLSearchParams({ numOfDays: String(clampedDays) })
    clampedDims.forEach((d, i) => params.set(`dimension${i + 1}`, d))

    // ── Appel Clarity ──────────────────────────────────────────────────────
    const clarityToken = Deno.env.get('CLARITY_API_TOKEN')
    if (!clarityToken) return json({ error: 'CLARITY_API_TOKEN non configuré' }, 500)

    const clarityRes = await fetch(
      `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`,
      { headers: { Authorization: `Bearer ${clarityToken}` } }
    )

    if (clarityRes.status === 429) {
      return json({
        error: 'Quota Clarity atteint (10 requêtes/jour). Réessaie demain.',
        quota_exceeded: true,
      }, 429)
    }

    if (!clarityRes.ok) {
      const errText = await clarityRes.text()
      return json({ error: `Clarity API ${clarityRes.status}: ${errText}` }, 502)
    }

    const clarityData = await clarityRes.json()

    // ── Stockage en base (service_role — bypass RLS) ───────────────────────
    const { data: report, error: dbErr } = await supabase
      .from('mji_clarity_reports')
      .insert({
        report_date: new Date().toISOString().split('T')[0],
        num_days: clampedDays,
        dimensions: clampedDims,
        raw_data: clarityData,
      })
      .select('id')
      .single()

    if (dbErr) {
      console.error('[clarity-proxy] DB insert error:', dbErr.message)
    }

    return json({ clarity: clarityData, report: report ?? null })

  } catch (e) {
    console.error('[clarity-proxy] Unexpected error:', e)
    return json({ error: String(e) }, 500)
  }
})
