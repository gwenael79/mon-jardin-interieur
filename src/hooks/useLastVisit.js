// hooks/useLastVisit.js
// Lit la dernière visite depuis Supabase et calcule les jours d'absence

import { useEffect, useState } from 'react'
import { supabase } from '../core/supabaseClient'

export function useLastVisit(userId) {
  const [daysSince, setDaysSince] = useState(0)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!userId) return

    async function fetchAndUpdate() {
      // 1. Lire la dernière visite
      const { data, error } = await supabase
        .from('user_visits')          // ← adaptez au nom de votre table
        .select('visited_at')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        const last   = new Date(data.visited_at)
        const now    = new Date()
        const diff   = Math.floor((now - last) / (1000 * 60 * 60 * 24))
        setDaysSince(diff)
      }

      // 2. Enregistrer la visite d'aujourd'hui
      await supabase
        .from('user_visits')
        .insert({ user_id: userId, visited_at: new Date().toISOString() })

      setLoading(false)
    }

    fetchAndUpdate()
  }, [userId])

  return { daysSince, loading }
}

/*
  ── TABLE SUPABASE à créer (SQL) ────────────────────────────────────
  
  create table user_visits (
    id         uuid default gen_random_uuid() primary key,
    user_id    uuid references auth.users(id) on delete cascade,
    visited_at timestamptz not null default now()
  );

  -- Index pour les requêtes rapides
  create index on user_visits (user_id, visited_at desc);

  -- Sécurité : chaque utilisateur ne voit que ses propres visites
  alter table user_visits enable row level security;

  create policy "own visits only"
    on user_visits for all
    using (auth.uid() = user_id);

  ────────────────────────────────────────────────────────────────────
*/
