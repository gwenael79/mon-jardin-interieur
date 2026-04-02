// supabase/functions/compagnon/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function callOpenAI(prompt: string, maxTokens = 160): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: `Tu es Félin, un petit lutin bienveillant des forêts qui accompagne un utilisateur dans un parcours de bien-être intérieur de 7 jours, inspiré du monde végétal et de la pleine conscience.
Tu accueilles l'utilisateur à chaque nouvelle journée avec un message court, chaleureux et personnalisé.
Ton doux, encourageant, bienveillant — jamais moralisateur.
Tu utilises "tu" informel, style poétique et simple, ancré dans les métaphores de la nature.
2 à 3 phrases maximum. Pas d'émojis.
Ne commence jamais par "Bonjour" ou une formule de salutation classique.`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })
  const data = await resp.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

const ZONE_DESCRIPTIONS: Record<string, string> = {
  'Racines':  "l'ancrage intérieur, la stabilité et les fondations de la personne",
  'Tige':     "l'élan vital, la continuité et le soutien intérieur",
  'Feuilles': "l'ouverture au monde, la légèreté et la vitalité",
  'Fleurs':   "l'épanouissement, la joie et l'expression de soi",
  'Souffle':  "la paix intérieure, la respiration et la sérénité",
  'Lumière':  "la gratitude, la clarté et la vision",
  'Fruit':    "l'intégration, la récolte et l'aboutissement",
}

const FEEL_LABELS: Record<string, string> = {
  fatigue: 'fatigué·e',
  stresse: 'stressé·e',
  neutre:  'dans un entre-deux, ni bien ni mal',
  calme:   'calme et posé·e',
  bien:    'bien',
}

const ENERGY_LABELS: Record<string, string> = {
  vide:    "vidé·e d'énergie",
  basse:   'à plat',
  moyenne: 'avec une énergie moyenne',
  haute:   "plein·e d'énergie",
  deborde: "débordant·e d'énergie",
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { day, dayTitle, zone, stepTheme, feel, energy } = await req.json()

    const zoneDesc    = ZONE_DESCRIPTIONS[zone] ?? zone
    const feelCtx     = feel      ? ` L'utilisateur se sent ${FEEL_LABELS[feel]   ?? feel}.`   : ''
    const energyCtx   = energy    ? ` Son énergie est ${ENERGY_LABELS[energy] ?? energy}.` : ''
    const stepThemeCtx = stepTheme ? ` Thème de l'étape actuelle : ${stepTheme}.` : ''

    const message = await callOpenAI(
      `Jour ${day} / 7 — "${dayTitle}"
Zone du rituel : ${zone} (${zoneDesc}).${stepThemeCtx}${feelCtx}${energyCtx}

Génère le message d'accueil de Félin pour ce moment. Réponds uniquement avec le message, sans guillemets.`
    )

    return new Response(
      JSON.stringify({ message: message || "Prends le temps d'être là, simplement. Cette étape t'attend avec douceur." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ message: "Prends le temps d'être là, simplement. Cette étape t'attend avec douceur." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
