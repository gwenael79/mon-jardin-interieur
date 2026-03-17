// supabase/functions/audio-stream/index.ts
// ─────────────────────────────────────────────────────────────
//  Génère une URL signée temporaire pour un fichier audio
//  Vérifie que l'utilisateur a bien acheté le produit
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Récupère le JWT de l'utilisateur
    const auth = req.headers.get('Authorization')
    if (!auth) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: CORS })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''))
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: CORS })

    const { produit_id } = await req.json()
    if (!produit_id) return new Response(JSON.stringify({ error: 'produit_id manquant' }), { status: 400, headers: CORS })

    // Vérifie que l'utilisateur a acheté ce produit
    const { data: achat } = await supabase
      .from('achats')
      .select('id')
      .eq('user_id', user.id)
      .eq('produit_id', produit_id)
      .eq('statut', 'complete')
      .maybeSingle()

    // Admin peut toujours accéder
    const isAdmin = user.id === 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'
    if (!achat && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Accès non autorisé' }), { status: 403, headers: CORS })
    }

    // Récupère le chemin du fichier
    const { data: produit } = await supabase
      .from('produits')
      .select('storage_path, titre')
      .eq('id', produit_id)
      .single()

    if (!produit?.storage_path) {
      return new Response(JSON.stringify({ error: 'Fichier non disponible' }), { status: 404, headers: CORS })
    }

    // Génère une URL signée — valide 1h, usage unique
    const { data: signedUrl, error: signErr } = await supabase.storage
      .from('audio-produits')
      .createSignedUrl(produit.storage_path, 3600)

    if (signErr || !signedUrl) {
      return new Response(JSON.stringify({ error: 'Impossible de générer le lien' }), { status: 500, headers: CORS })
    }

    return new Response(
      JSON.stringify({ url: signedUrl.signedUrl, titre: produit.titre }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
})
