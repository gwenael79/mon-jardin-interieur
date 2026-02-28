import { supabase } from '../core/supabaseClient'

export const communityService = {

  async getPulse() {
    const since = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    // Jardins actifs (7 jours)
    const { count: activeGardens } = await supabase
      .from('journal_entries')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', since)

    // Rituels complétés (7 jours)
    const { count: completedRituals } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    // Défis actifs
    const { count: activeDefis } = await supabase
      .from('defis')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Participations
    const { count: participations } = await supabase
      .from('defi_participants')
      .select('*', { count: 'exact', head: true })

    return {
      activeGardens: activeGardens ?? 0,
      completedRituals: completedRituals ?? 0,
      activeDefis: activeDefis ?? 0,
      participations: participations ?? 0
    }
  }

}