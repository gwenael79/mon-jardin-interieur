// src/utils/ritualSession.js
// Session partagée "2 rituels max / heure" — utilisée par tous les modaux de
// sélection de rituel (RitualByTimeModal, RitualFinderModal) pour éviter de
// cumuler des rituels sans limite, quel que soit le point d'entrée.
const SESSION_KEY = 'ritual_session_v2'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function loadRitualSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')
    // Nouveau jour — on repart à zéro. Sans ce garde-fou, un compteur resté à 1
    // (le cooldown ne se déclenche qu'au 2e rituel) restait figé indéfiniment
    // d'un jour sur l'autre au lieu de repartir à zéro chaque matin.
    if (s.date && s.date !== todayStr()) {
      return { count: 0, cooldownUntil: null, doneIds: [] }
    }
    if (s.cooldownUntil && Date.now() >= new Date(s.cooldownUntil).getTime()) {
      return { count: 0, cooldownUntil: null, doneIds: [] }
    }
    return { count: s.count ?? 0, cooldownUntil: s.cooldownUntil ?? null, doneIds: s.doneIds ?? [] }
  } catch { return { count: 0, cooldownUntil: null, doneIds: [] } }
}

export function saveRitualSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, date: todayStr() }))
}
