// supabase/functions/slide-insight/index.ts
// Génère une mini-analyse motivante par slide, basée sur les données réelles de l'utilisateur.

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_KEY   = Deno.env.get('OPENAI_API_KEY')       ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')          ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Prompts système par slide ─────────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  bilan: `Tu es un accompagnateur de bien-être bienveillant. En te basant sur les bilans récents de l'utilisateur, rédige une observation courte et chaleureuse sur son évolution émotionnelle. Mentionne une tendance concrète si elle existe (amélioration, régularité, pic de stress). Encourage sans minimiser. Tutoie. MAXIMUM 2 phrases courtes, moins de 35 mots au total, ton doux et direct, sans émojis.
RÈGLE ABSOLUE : adapte ton langage à l'état visuel de la plante indiqué dans le contexte. Si l'état est "graine" ou "pousse", ne mentionne JAMAIS les zones (racines, tige, feuilles, fleurs, souffle) — parle uniquement de début de chemin, de première graine semée, de potentiel qui s'éveille. Si l'état est "jeune plante" ou plus, tu peux évoquer les zones avec parcimonie.`,

  jardin: `Tu es un accompagnateur de bien-être. Observe la vitalité de la plante et les rituels accomplis. Donne une lecture chaleureuse et concrète de l'état du jardin intérieur de l'utilisateur. Si des rituels ont été faits, valorise-les. Si la vitalité est basse, encourage sans alarmer. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.
RÈGLE ABSOLUE : adapte ton langage à l'état visuel de la plante. Si l'état est "graine" ou "pousse", parle de naissance, de premiers pas, de potentiel — ne mentionne JAMAIS les zones ou des parties de la fleur qui n'existent pas encore visuellement pour l'utilisateur.`,

  champ: `Tu es un accompagnateur de bien-être. Commente la présence de l'utilisateur dans le jardin collectif — sa régularité, sa contribution. Relie son parcours individuel à la dynamique commune de manière inspirante. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.
RÈGLE ABSOLUE : ne mentionne jamais les zones (racines, tige, feuilles, fleurs, souffle) ni les pourcentages de zones.`,

  defis: `Tu es un accompagnateur de bien-être. Analyse l'engagement de l'utilisateur dans les défis. Si tu connais ses défis en cours, mentionne-en un ou deux par nom et valorise sa progression concrète (jours validés). S'il n'en a pas encore rejoint, invite-le à s'y plonger sans pression. Sois précis et personnel. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.
RÈGLE ABSOLUE : ne mentionne jamais les zones (racines, tige, feuilles, fleurs, souffle) ni les pourcentages de zones.`,

  club: `Tu es un accompagnateur de bien-être. Commente la vie de son club — nombre de membres, activité. Relie l'importance de la communauté à son parcours personnel. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.
RÈGLE ABSOLUE : ne mentionne jamais les zones (racines, tige, feuilles, fleurs, souffle) ni les pourcentages de zones. Parle uniquement de la vitalité globale et de l'engagement dans la communauté.`,

  ateliers: `Tu es un accompagnateur de bien-être. Sur la base des rituels accomplis et de la zone favorite de l'utilisateur, suggère en quoi les ateliers pourraient approfondir ce qui l'attire déjà. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.`,

  bibliotheque: `Tu es un accompagnateur de bien-être. L'utilisateur a une bibliothèque personnelle qui regroupe les outils qu'il a acquis — méditations audio, e-books, vidéos, échangés contre des lumens ou achetés. Si sa bibliothèque est vide ou presque (0 ou peu de rituels ce mois), invite-le à découvrir et acquérir ses premiers outils sans pression. S'il a déjà des ressources, encourage-le à les utiliser. Ne suppose jamais que la bibliothèque est pleine. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, sans émojis.`,

  jardinotheque: `Tu es un accompagnateur de bien-être. La Jardinothèque est une boutique où l'utilisateur peut acquérir des ressources (méditations, hypnoses, e-books, vidéos) en échangeant ses lumens. Mentionne explicitement son solde de lumens fourni dans le contexte. Si solde < 50 : dis-lui qu'il a peu de lumens et qu'il peut en gagner en faisant ses rituels quotidiens. Si solde >= 50 : dis-lui combien il a de lumens et qu'il peut dès maintenant acquérir une ressource dans la boutique. Reste court, concret, sans métaphores floues. 2 phrases max, tutoie, sans émojis.`,

  stimulation: `Tu es un accompagnateur de bien-être chaleureux et inspirant. À partir de l'état actuel de la plante et des rituels récents, génère un message de stimulation douce et personnalisée pour inviter l'utilisateur à prendre soin de son jardin intérieur aujourd'hui. Si la vitalité est haute (70-100%), valorise son élan et encourage à approfondir. Si elle est moyenne (30-70%), propose une intention légère et bienveillante. Si elle est basse (moins de 30%), accueille avec douceur et offre un premier petit pas concret. Jamais de généralité — parle de CE que tu observes dans ses données. MAXIMUM 2 phrases courtes, moins de 35 mots au total, tutoie, ton direct et chaleureux, sans émojis.
RÈGLE ABSOLUE : adapte ton langage à l'état visuel de la plante. Si c'est une graine ou une pousse, ne parle pas de zones — parle du début du chemin.`,

  boite_graine: `Tu es un accompagnateur de bien-être bienveillant, spécialisé dans l'estime de soi. Ce soir, l'utilisateur va déposer une réussite dans sa boîte à graines — un moment de fierté, un geste de soin, une petite victoire. Génère un message d'invitation chaleureux et personnel qui l'encourage à reconnaître sa valeur ce soir. Si tu as accès à ses réussites passées, valorise leur accumulation comme un trésor qui grandit. Sinon, invite-le à poser la première graine. Tutoie. MAXIMUM 2 phrases courtes, moins de 35 mots au total, ton doux et inspirant, sans émojis.
RÈGLE ABSOLUE : ne parle jamais de zones (racines, tige, feuilles, fleurs, souffle). Reste centré sur l'estime de soi, la fierté, la valeur personnelle.`,

  jardin_benefits: `Tu es un accompagnateur de bien-être. En te basant sur les rituels accomplis aujourd'hui et la vitalité de la plante, génère exactement 3 bénéfices concrets que l'utilisateur ressent grâce à ses pratiques. Si aucun rituel n'a été fait, génère 3 bénéfices inspirants liés à la vitalité actuelle de la plante.
RÈGLE ABSOLUE : réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaire. Format exact : [{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."}]. Chaque "title" : 3 à 5 mots. Chaque "desc" : 10 à 14 mots. Tutoie. Sans émojis. Ne mentionne jamais les noms techniques des zones (zone_racines etc).`,

  jardin_quote: `Tu es un accompagnateur de bien-être bienveillant et poétique. En te basant sur l'état de la plante et les rituels accomplis aujourd'hui, génère une citation originale, inspirante et personnelle — comme si elle était écrite spécialement pour cette personne en ce moment précis. La citation doit être encourageante, douce, et refléter le chemin parcouru. Elle peut parler de soin de soi, de croissance intérieure, de continuité, ou de douceur envers soi-même. Tutoie. MAXIMUM 20 mots. Sans émojis. Pas de guillemets dans la réponse.
RÈGLE ABSOLUE : réponds UNIQUEMENT avec le texte de la citation, rien d'autre. Pas de tiret, pas d'auteur, pas de contexte.`,
}

const ZONE_LABELS: Record<string, string> = {
  zone_racines:  'Racines (ancrage)',
  zone_tige:     'Tige (élan vital)',
  zone_feuilles: 'Feuilles (ouverture)',
  zone_fleurs:   'Fleurs (épanouissement)',
  zone_souffle:  'Souffle (sérénité)',
}

// ── Lecture des 7 derniers bilans ─────────────────────────────────────────────
async function getRecentBilans(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('daily_quiz')
    .select('date, degradation')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7)
  return data ?? []
}

// ── Lecture des graines d'estime récentes ────────────────────────────────────
async function getRecentGraines(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('graines_estime')
    .select('content, tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

// ── Lecture de la plante aujourd'hui ─────────────────────────────────────────
async function getTodayPlant(supabase: ReturnType<typeof createClient>, userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('plants')
    .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()
  return data
}

// ── Appel OpenAI ──────────────────────────────────────────────────────────────
async function callGPT(system: string, user: string, maxTokens = 180): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model:      'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.75,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
    }),
  })
  const json = await resp.json()
  return json.choices?.[0]?.message?.content?.trim() ?? ''
}

// ── État visuel de la plante ──────────────────────────────────────────────────
function getPlantStage(health: number | null): string {
  if (health === null || health === undefined) return 'inconnue'
  if (health <= 5)  return 'graine (la plante vient d\'être semée, aucune zone visible pour l\'utilisateur)'
  if (health <= 20) return 'pousse (très jeune plante, quelques signes de vie, zones à peine perceptibles)'
  if (health <= 50) return 'jeune plante (en croissance, zones visibles mais encore fragiles)'
  if (health <= 80) return 'plante en fleurs (bien développée, toutes les zones sont actives)'
  return 'plante épanouie (fleur mature et rayonnante)'
}

// ── Construire le contexte utilisateur ───────────────────────────────────────
function buildContext(slide: string, payload: Record<string, unknown>, bilans: any[], plant: any): string {
  const streak          = payload.streak         ?? 0
  const ritualsMonth    = payload.ritualsMonth   ?? 0
  const favoriteZone    = payload.favoriteZone   ? ZONE_LABELS[payload.favoriteZone as string] ?? payload.favoriteZone : null
  const health          = plant?.health          ?? null
  const circleMembers   = payload.circleMembers  ?? 0
  const circleName      = payload.circleName     ?? null
  const defisJoined     = payload.defisJoined    ?? 0
  const communityPeople = payload.communityPeople ?? 0
  const gardenCount     = payload.gardenCount    ?? 0
  const ritualsDone     = payload.ritualsDone    ?? 0

  // Résumé des bilans récents
  let bilanSummary = 'Aucun bilan récent disponible.'
  if (bilans.length > 0) {
    const avg = Math.round(bilans.reduce((a, b) => a + (b.degradation ?? 50), 0) / bilans.length)
    const trend = bilans.length >= 2
      ? (bilans[0].degradation ?? 50) < (bilans[bilans.length - 1].degradation ?? 50)
        ? 'en amélioration'
        : (bilans[0].degradation ?? 50) > (bilans[bilans.length - 1].degradation ?? 50)
          ? 'en hausse de stress'
          : 'stable'
      : 'pas assez de données pour une tendance'
    bilanSummary = `${bilans.length} bilan${bilans.length > 1 ? 's' : ''} sur 7 jours — stress moyen : ${avg}/100 — tendance : ${trend}.`
    if (bilans.length >= 2) {
      bilanSummary += ` Dernier score : ${bilans[0].degradation}/100. Il y a ${bilans.length - 1} jours : ${bilans[bilans.length - 1].degradation}/100.`
    }
  }

  // État visuel et santé de la plante
  const plantStage = getPlantStage(health)
  // Slides qui ont besoin du détail des zones (bilan personnel, jardin intime, stimulation)
  const needsZoneDetail = ['bilan', 'jardin', 'stimulation', 'jardin_benefits', 'jardin_quote'].includes(slide)
  const plantSummary = plant
    ? needsZoneDetail
      ? `État visuel de la plante : ${plantStage}. Vitalité globale : ${health}%. Zones — ${Object.entries(ZONE_LABELS).map(([k, l]) => `${l} : ${plant[k] ?? '?'}%`).join(', ')}.`
      : `État visuel de la plante : ${plantStage}. Vitalité globale : ${health}%.`
    : 'Pas de données de plante aujourd\'hui.'

  const lines = [
    `Slide : ${slide}`,
    `Régularité : ${streak} jour${Number(streak) > 1 ? 's' : ''} d'affilée, ${ritualsMonth} rituels ce mois.`,
    favoriteZone ? `Zone favorite : ${favoriteZone}.` : '',
    `Bilans récents : ${bilanSummary}`,
    plantSummary,
  ]

  if (slide === 'stimulation')  lines.push(`Rituels accomplis aujourd'hui : ${ritualsDone}.`)
  if (slide === 'jardin_benefits' || slide === 'jardin_quote') {
    const ritualsList = (payload.ritualsList as string[]) ?? []
    if (ritualsList.length > 0) {
      lines.push(`Rituels accomplis aujourd'hui : ${ritualsList.join(', ')}.`)
    } else {
      lines.push(`Aucun rituel accompli aujourd'hui.`)
    }
  }
  if (slide === 'champ')        lines.push(`${gardenCount} fleurs dans le jardin collectif, ${communityPeople} jardiniers actifs.`)
  if (slide === 'defis') {
    const defisDetails = (payload.defisDetails as string[]) ?? []
    const detail = defisDetails.length > 0 ? ` Défis en cours : ${defisDetails.join(', ')}.` : ''
    lines.push(`${defisJoined} défi${Number(defisJoined) > 1 ? 's' : ''} rejoints. ${communityPeople} participants dans la communauté.${detail}`)
  }
  if (slide === 'club')         lines.push(circleName ? `Cercle "${circleName}" avec ${circleMembers} membres.` : 'Pas encore de cercle.')
  if (slide === 'ateliers')     lines.push(favoriteZone ? `Zone d'intérêt principal : ${favoriteZone}.` : '')
  if (slide === 'jardinotheque') {
    const lumens = (payload.lumens as number) ?? 0
    lines.push(`Solde de lumens : ${lumens}. ${lumens < 50 ? 'Peu de lumens disponibles.' : lumens < 200 ? 'Quelques lumens disponibles.' : 'Bon solde de lumens.'}`)
    if (favoriteZone) lines.push(`Zone d'intérêt : ${favoriteZone}.`)
  }
  if (slide === 'bibliotheque') {
    const achatCount = (payload.achatCount as number) ?? 0
    lines.push(achatCount === 0
      ? `Bibliothèque vide — aucune ressource acquise pour le moment.`
      : `${achatCount} ressource${achatCount > 1 ? 's' : ''} dans la bibliothèque. ${ritualsMonth} rituels pratiqués ce mois.`
    )
  }
  if (slide === 'boite_graine') {
    const graines = (payload.graines as any[]) ?? []
    if (graines.length === 0) {
      lines.push(`L'utilisateur n'a pas encore déposé de graine. C'est peut-être ce soir la première fois.`)
    } else {
      lines.push(`${graines.length} graine${graines.length > 1 ? 's' : ''} déposée${graines.length > 1 ? 's' : ''} jusqu'ici.`)
      lines.push(`Réussites récentes : ${graines.slice(0, 3).map((g: any) => `"${g.content}"`).join(' · ')}.`)
    }
  }

  return lines.filter(Boolean).join('\n')
}

// ── Handler principal ─────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body    = await req.json()
    const { userId, slide, ...payload } = body as { userId: string; slide: string; [k: string]: unknown }

    if (!userId || !slide) throw new Error('userId et slide requis')

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const [bilans, plant, graines] = await Promise.all([
      getRecentBilans(supabase, userId),
      getTodayPlant(supabase, userId),
      slide === 'boite_graine' ? getRecentGraines(supabase, userId) : Promise.resolve([]),
    ])

    const enrichedPayload = slide === 'boite_graine' ? { ...payload, graines } : payload
    const systemPrompt = SYSTEM_PROMPTS[slide] ?? SYSTEM_PROMPTS.bilan
    const userContext  = buildContext(slide, enrichedPayload, bilans, plant)

    const rawMessage = await callGPT(systemPrompt, userContext, slide === 'jardin_benefits' ? 300 : 180)

    // Pour jardin_benefits, on augmente la tolérance de tokens via le prompt dédié
    // et on retourne le JSON brut dans message — le frontend le parse
    const message = rawMessage || null

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.error('[slide-insight]', e.message)
    return new Response(
      JSON.stringify({ message: null }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
