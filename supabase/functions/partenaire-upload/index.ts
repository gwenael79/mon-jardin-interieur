// supabase/functions/partenaire-upload/index.ts
// ─────────────────────────────────────────────────────────────
//  Upload d'un fichier audio pour un partenaire
//  Reçoit : multipart/form-data { file, code_vendeur }
//  Vérifie que le code_vendeur existe et est actif
//  Stocke dans audio-produits/<partenaire_id>/<uuid>.<ext>
//  Retourne : { storage_path }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/mp4']
const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const formData = await req.formData()
    const file        = formData.get('file') as File | null
    const codeVendeur = formData.get('code_vendeur') as string | null

    if (!file)        return new Response(JSON.stringify({ error: 'Fichier manquant' }),        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    if (!codeVendeur) return new Response(JSON.stringify({ error: 'code_vendeur manquant' }),   { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })

    // Vérification taille
    if (file.size > MAX_SIZE) return new Response(JSON.stringify({ error: 'Fichier trop volumineux (max 100 Mo)' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })

    // Vérification type MIME
    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.includes(mime)) {
      return new Response(JSON.stringify({ error: `Type non autorisé : ${mime}` }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // Vérification partenaire actif
    const { data: partenaire, error: pErr } = await supabase
      .from('partenaires')
      .select('id, statut')
      .eq('code_vendeur', codeVendeur)
      .maybeSingle()

    if (pErr || !partenaire) return new Response(JSON.stringify({ error: 'Partenaire introuvable' }),  { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } })
    if (partenaire.statut !== 'actif') return new Response(JSON.stringify({ error: 'Compte non actif' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } })

    // Extension depuis le nom du fichier (fallback sur mime)
    const originalName = file.name ?? 'audio'
    const ext = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : mime.split('/')[1] ?? 'mp3'

    // Nom unique
    const uuid = crypto.randomUUID()
    const storagePath = `${partenaire.id}/${uuid}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('audio-produits')
      .upload(storagePath, arrayBuffer, { contentType: mime, upsert: false })

    if (uploadErr) {
      return new Response(JSON.stringify({ error: 'Upload échoué : ' + uploadErr.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    return new Response(
      JSON.stringify({ storage_path: storagePath }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
