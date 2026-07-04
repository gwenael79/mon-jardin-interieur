// src/utils/completeRitualHealth.js
import { supabase } from '../core/supabaseClient'

const ZONE_DB_KEY = { roots: 'zone_racines', stem: 'zone_tige', leaves: 'zone_feuilles', flowers: 'zone_fleurs', breath: 'zone_souffle' }
const RITUAL_DELTA = 0.5

// Incrémente la zone concernée + la santé globale d'une fleur suite à un
// rituel complété. N'écrit jamais `health` comme une moyenne recalculée des
// 5 zones — ces colonnes peuvent avoir dérivé de la valeur affichée (vécu :
// une fleur à 47% dont la moyenne des zones tombait à 30%). On incrémente
// toujours `health` depuis sa propre valeur actuelle.
export async function completeRitualHealth({ plantId, zoneId, onHealthUpdate, userId }) {
  let id = plantId
  // plantId absent (pas encore chargé côté appelant, ou non fourni) — on retrouve
  // la plante du jour par userId plutôt que d'abandonner silencieusement.
  if (!id) {
    if (!userId) { console.warn('[completeRitualHealth] ni plantId ni userId — mise à jour ignorée'); return null }
    const today = new Date().toISOString().split('T')[0]
    const { data: p } = await supabase.from('plants').select('id').eq('user_id', userId).eq('date', today).maybeSingle()
    id = p?.id
    if (!id) { console.warn('[completeRitualHealth] aucune plante du jour trouvée pour', userId); return null }
  }
  const dbKey = ZONE_DB_KEY[zoneId] || 'zone_racines'
  const { data: plant } = await supabase.from('plants').select(`${dbKey}, health`).eq('id', id).single()
  if (!plant) return null
  const newZoneVal = Math.min(100, (plant[dbKey] ?? 5) + RITUAL_DELTA)
  const newHealth  = Math.min(100, (plant.health ?? 5) + RITUAL_DELTA)
  onHealthUpdate?.(newHealth)
  await supabase.from('plants').update({ [dbKey]: newZoneVal, health: newHealth }).eq('id', id)
  window.dispatchEvent(new CustomEvent('plantHealthPatched', { detail: { health: newHealth, plantId: id } }))
  window.dispatchEvent(new CustomEvent('plantCelebrate'))
  return newHealth
}

export { RITUAL_DELTA }
