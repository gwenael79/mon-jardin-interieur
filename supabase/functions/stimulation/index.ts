// supabase/functions/stimulation/index.ts
// Génère un message de stimulation personnalisé basé sur l'état de la fleur.

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_KEY   = Deno.env.get('OPENAI_API_KEY')            ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ZONE_LABELS: Record<string, string> = {
  zone_racines:  'Racines (ancrage)',
  zone_tige:     'Tige (élan vital)',
  zone_feuilles: 'Feuilles (ouverture)',
  zone_fleurs:   'Fleurs (épanouissement)',
  zone_souffle:  'Souffle (sérénité)',
}

async function getTodayPlant(db: ReturnType<typeof createClient>, userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db
    .from('plants')
    .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()
  return data
}

async function getRecentBilans(db: ReturnType<typeof createClient>, userId: string) {
  const { data } = await db
    .from('daily_quiz')
    .select('date, degradation')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7)
  return data ?? []
}

function buildContext(plant: any, bilans: any[], payload: Record<string, unknown>): string {
  const streak       = Number(payload.streak       ?? 0)
  const ritualsMonth = Number(payload.ritualsMonth ?? 0)
  const ritualsDone  = Number(payload.ritualsDone  ?? 0)
  const favoriteZone = payload.favoriteZone
    ? (ZONE_LABELS[payload.favoriteZone as string] ?? payload.favoriteZone)
    : null

  // Résumé bilan
  let bilanNote = 'Aucun bilan récent.'
  if (bilans.length > 0) {
    const avg   = Math.round(bilans.reduce((s, b) => s + (b.degradation ?? 50), 0) / bilans.length)
    const trend = bilans.length >= 2
      ? (bilans[0].degradation ?? 50) < (bilans[bilans.length - 1].degradation ?? 50)
        ? 'en amélioration'
        : (bilans[0].degradation ?? 50) > (bilans[bilans.length - 1].degradation ?? 50)
          ? 'en hausse de stress'
          : 'stable'
      : 'données insuffisantes'
    bilanNote = `${bilans.length} bilan(s) — stress moyen ${avg}/100, tendance ${trend}.`
  }

  // Santé fleur
  const plantNote = plant
    ? `Santé ${plant.health}/10. Zones: ${Object.entries(ZONE_LABELS).map(([k, l]) => `${l} ${plant[k] ?? '?'}/10`).join(', ')}.`
    : 'Pas de données de plante.'

  // Zone la plus faible (pour orienter l'invitation)
  let weakZone = ''
  if (plant) {
    const zones = Object.keys(ZONE_LABELS)
    const weakKey = zones.reduce((min, k) => (plant[k] ?? 10) < (plant[min] ?? 10) ? k : min, zones[0])
    weakZone = `Zone la plus faible : ${ZONE_LABELS[weakKey]} (${plant[weakKey] ?? '?'}/10).`
  }

  return [
    plantNote,
    weakZone,
    `Régularité : ${streak} jour(s) d'affilée, ${ritualsMonth} rituels ce mois, ${ritualsDone} rituels aujourd'hui.`,
    favoriteZone ? `Zone favorite : ${favoriteZone}.` : '',
    `Bilans récents : ${bilanNote}`,
  ].filter(Boolean).join('\n')
}

const SYSTEM_PROMPT = `Tu es un accompagnateur de bien-être chaleureux et inspirant.
À partir de l'état actuel de la fleur et des rituels récents, génère un message de stimulation douce et personnalisée pour inviter l'utilisateur à prendre soin de son jardin intérieur aujourd'hui.
- Si la santé est haute : valorise son élan, encourage à approfondir la zone la plus faible.
- Si la santé est moyenne : propose une intention légère et concrète liée à sa zone favorite.
- Si elle est basse : accueille avec douceur, offre un premier petit pas très accessible.
RÈGLES ABSOLUES :
- N'utilise JAMAIS de chiffres, scores, pourcentages ou données numériques dans ta réponse. Traduis tout en ressenti qualitatif (ex : "ta fleur rayonne", "ton ancrage s'éveille doucement", "tu commences à t'épanouir").
- Ne jamais être générique — chaque phrase doit évoquer la réalité observée (zone, régularité, état) sans citer de nombres.
2 phrases maximum, 50 mots maximum au total. Tutoie. Ton poétique et direct. Sans emojis.`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const { userId, ...payload } = body as { userId: string; [k: string]: unknown }

    if (!userId) throw new Error('userId requis')

    const db = createClient(SUPABASE_URL, SUPABASE_KEY)
    const [plant, bilans] = await Promise.all([
      getTodayPlant(db, userId),
      getRecentBilans(db, userId),
    ])

    const context = buildContext(plant, bilans, payload)

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  80,
        temperature: 0.78,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: context },
        ],
      }),
    })

    const json    = await resp.json()
    const message = json.choices?.[0]?.message?.content?.trim() ?? null

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    console.error('[stimulation]', e.message)
    return new Response(
      JSON.stringify({ message: null }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
