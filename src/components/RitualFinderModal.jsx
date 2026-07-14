// RitualFinderModal.jsx — "Trouve tes rituels"
// Questionnaire orienté "j'ai un problème" → rituels curés (table PROBLEMATIQUES)
// → sélection personnelle gardée et retrouvable au prochain accès.
import { useEffect, useState } from 'react'
import { supabase } from '../core/supabaseClient'
import { useIsMobile } from '../pages/dashboardShared'
import { ExerciseDetail } from '../pages/mafleur_rituels'
import { PROBLEMATIQUES, PORTE_DE_SORTIE } from '../data/problematiques'
import { completeRitualHealth, RITUAL_DELTA } from '../utils/completeRitualHealth'
import { loadRitualSession, saveRitualSession } from '../utils/ritualSession'
import { playChime } from '../utils/playChime'

const ZONE_LABELS = { roots: 'Racines', stem: 'Tige', leaves: 'Feuilles', flowers: 'Fleurs', breath: 'Souffle' }
const ZONE_COLORS = { roots: '#c8894a', stem: '#5aaf78', leaves: '#4a9e5c', flowers: '#d4779a', breath: '#6abbe4' }
const PASTELS = ['#fdeae3', '#e8f3ea', '#eef0fb', '#fdf0e5', '#fbe8ef', '#e6f4f1', '#f6ecf9', '#fff6df']
// En free, seules ces 3 problématiques restent accessibles — les autres affichent un cadenas
const FREE_PROBLEM_IDS = [1, 7, 11]

export default function RitualFinderModal({ onClose, userId, plantId, onHealthUpdate, isPremium, onUpgrade }) {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(null) // ligne user_ritual_selections existante
  const [step, setStep] = useState('list') // list | vigilance | result | saved
  const [problematique, setProblematique] = useState(null)
  const [showExitDoor, setShowExitDoor] = useState(false)
  const [ritualDetails, setRitualDetails] = useState([]) // lignes rituels complètes
  const [kept, setKept] = useState(new Set())
  const [activeExercise, setActiveExercise] = useState(null) // rituel ouvert en fiche complète
  const [doneNs, setDoneNs] = useState(new Set()) // rituels déjà faits AUJOURD'HUI (persiste le "✓ fait" toute la journée)
  // Session partagée "2 rituels max / heure" (même compteur que "Définir mon
  // protocole") — sert uniquement à limiter le RYTHME des nouvelles validations,
  // pas à décider ce qui s'affiche "✓ fait" (ça, c'est doneNs, sur la journée).
  const [session, setSession] = useState(loadRitualSession)
  const [, setTick] = useState(0)

  // ── Charge la sélection déjà enregistrée, s'il y en a une ──
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('user_ritual_selections').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data?.ritual_ids?.length) { setSaved(data); setStep('saved') }
        setLoading(false)
      })
  }, [userId])

  // ── Rituels déjà faits aujourd'hui — persiste le "✓ fait" pour toute la
  // journée, pour ne pas refaire un rituel déjà validé plus tôt ──
  useEffect(() => {
    if (!userId) return
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    supabase.from('rituals').select('ritual_id').eq('user_id', userId).gte('completed_at', startOfDay.toISOString())
      .then(({ data }) => {
        const ns = (data || []).map(r => Number(r.ritual_id)).filter(n => !Number.isNaN(n))
        if (ns.length) setDoneNs(prev => new Set([...prev, ...ns]))
      })
  }, [userId])

  // Tick chaque seconde pendant le cooldown pour mettre à jour l'affichage
  useEffect(() => {
    if (!session.cooldownUntil) return
    const id = setInterval(() => {
      if (Date.now() >= new Date(session.cooldownUntil).getTime()) {
        const reset = { count: 0, cooldownUntil: null, doneIds: [] }
        setSession(reset)
        saveRitualSession(reset)
      }
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [session.cooldownUntil])

  const now = Date.now()
  const cooldownMs = session.cooldownUntil ? Math.max(0, new Date(session.cooldownUntil).getTime() - now) : 0
  const inCooldown = cooldownMs > 0
  const canValidate = !inCooldown && session.count < 2
  const cooldownH = Math.floor(cooldownMs / 3600000)
  const cooldownM = Math.floor((cooldownMs % 3600000) / 60000)
  const cooldownLabel = cooldownH > 0 ? `${cooldownH}h ${cooldownM} min` : `${cooldownM} min`

  const chooseProblematique = (p) => {
    setProblematique(p)
    setShowExitDoor(false)
    if (p.vigilance) { setStep('vigilance'); return }
    loadRituals(p)
  }

  const loadRituals = async (p, exitDoor = false) => {
    setShowExitDoor(exitDoor)
    setStep('result')
    const ns = p.rituels.map(r => r.n)
    const { data } = await supabase.from('rituels').select('*').in('n', ns)
    const ordered = ns.map(n => data?.find(r => r.n === n)).filter(Boolean)
    setRitualDetails(ordered)
    // Ne pré-coche que ce qui fait déjà partie du protocole enregistré — le
    // reste attend une décision explicite de l'utilisateur, une fois le
    // rituel fait (voir toggleKeepInProtocol).
    const savedIds = new Set(saved?.ritual_ids ?? [])
    setKept(new Set(ns.filter(n => savedIds.has(n))))
  }

  // Coche/décoche un rituel dans le protocole personnel — persiste immédiatement
  // en fusionnant avec la sélection existante (jamais un remplacement complet),
  // pour que les protocoles de plusieurs problématiques s'additionnent.
  const toggleKeepInProtocol = async (ex) => {
    if (!userId) return
    const alreadyKept = kept.has(ex.n)
    setKept(prev => {
      const next = new Set(prev)
      if (alreadyKept) next.delete(ex.n); else next.add(ex.n)
      return next
    })
    const nextIds = new Set(saved?.ritual_ids ?? [])
    if (alreadyKept) nextIds.delete(ex.n); else nextIds.add(ex.n)
    const nextProblematiqueIds = new Set(saved?.problematique_ids ?? [])
    if (!alreadyKept) nextProblematiqueIds.add(problematique.id)
    const row = {
      user_id: userId,
      problematique_ids: Array.from(nextProblematiqueIds),
      ritual_ids: Array.from(nextIds),
      format: saved?.format ?? null,
      timing: saved?.timing ?? null,
      updated_at: new Date().toISOString(),
    }
    // Mise à jour optimiste immédiate — sinon un clic rapide sur "Valider" (qui
    // bascule vers la vue "saved") pouvait arriver avant la fin de l'upsert
    // réseau, et afficher un protocole encore vide ("le check effacé").
    setSaved(row)
    const { data } = await supabase.from('user_ritual_selections').upsert(row, { onConflict: 'user_id' }).select().single()
    if (data) setSaved(data)
    if (!alreadyKept) playChime()
  }

  const handleRitualDone = async (ex) => {
    // Déjà validé aujourd'hui — on ferme juste la fiche, sans réincrémenter la fleur
    if (doneNs.has(ex.n)) { setActiveExercise(null); return }
    if (!canValidate) { setActiveExercise(null); return }
    setDoneNs(prev => new Set(prev).add(ex.n))
    const newCount = session.count + 1
    const newCooldownUntil = newCount >= 2 ? new Date(now + 60 * 60 * 1000).toISOString() : null
    const newSession = { count: newCount, cooldownUntil: newCooldownUntil, doneIds: [...session.doneIds, ex.n] }
    setSession(newSession)
    saveRitualSession(newSession)
    playChime()
    try { await completeRitualHealth({ plantId, zoneId: ex.zone, onHealthUpdate, userId }) } catch (e) { console.error('[ritual-finder] health update failed:', e) }
    try {
      await supabase.from('rituals').insert({ user_id: userId, plant_id: plantId, name: ex.title, zone: ZONE_LABELS[ex.zone] || ex.zone, health_delta: RITUAL_DELTA, ritual_id: String(ex.n) })
    } catch (e) { console.error('[ritual-finder] log failed:', e) }
    setActiveExercise(null)
  }

  const restart = () => { setProblematique(null); setRitualDetails([]); setActiveExercise(null); setStep('list') }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(10,8,5,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: isMobile ? '100%' : activeExercise ? 'min(900px,95vw)' : 'min(520px,95vw)', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '88vh',
        background: 'linear-gradient(160deg,#fdf9f4,#f4ede4)', borderRadius: isMobile ? 0 : 24,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        transition: 'width 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
          {(step === 'vigilance' || step === 'result') && !activeExercise && (
            <button onClick={restart} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: step === 'saved' || step === 'list' ? 28 : 22, fontWeight: 600, fontStyle: 'italic', color: '#1a1008', margin: 0, lineHeight: 1.2 }}>
              {step === 'saved' ? 'Tes rituels quotidiens' : step === 'list' ? 'Quel est ton problème du moment ?' : problematique?.besoin}
            </p>
            {step === 'list' && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 18, color: '#1a1008', margin: '4px 0 0' }}>Un seul choix suffit pour commencer</p>}
            {step === 'result' && !activeExercise && (
              inCooldown ? (
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, background: 'rgba(200,80,60,0.10)', color: '#c04030', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginTop: 6 }}>
                  Cooldown · {cooldownLabel}
                </span>
              ) : (
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, background: 'rgba(60,140,80,0.10)', color: '#3a8050', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginTop: 6 }}>
                  {session.count}/2 rituels
                </span>
              )
            )}
          </div>
          {!activeExercise && (
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(30,20,8,0.6)', flexShrink: 0 }}>✕</button>
          )}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', WebkitOverflowScrolling: 'touch' }}>
          {loading && <p style={{ textAlign: 'center', color: 'rgba(30,20,8,0.4)', fontFamily: "'Jost',sans-serif", fontSize: 14, padding: '40px 0' }}>Chargement…</p>}

          {/* ── SAUVEGARDÉ ── */}
          {!loading && step === 'saved' && saved && !activeExercise && (
            <SavedSelectionView saved={saved} onModify={restart} onOpen={setActiveExercise} doneNs={doneNs} />
          )}

          {/* ── LISTE DES PROBLÉMATIQUES ── */}
          {!loading && step === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isPremium && (
                <button onClick={() => onUpgrade?.()} style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, padding: '14px 16px',
                  borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: 'linear-gradient(135deg,#7d4368,#a06a8c)', color: '#fff',
                  boxShadow: '0 6px 20px rgba(125,67,104,0.30)',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '.02em' }}>Accès Premium</div>
                    <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, opacity: 0.85, marginTop: 2 }}>3 problématiques offertes, débloque les 17 autres</div>
                  </div>
                  <span style={{ fontSize: 16, opacity: 0.8, flexShrink: 0 }}>›</span>
                </button>
              )}
              {PROBLEMATIQUES.map((p, i) => {
                const locked = !isPremium && !FREE_PROBLEM_IDS.includes(p.id)
                return (
                  <button key={p.id} onClick={() => locked ? onUpgrade?.() : chooseProblematique(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, background: PASTELS[i % PASTELS.length], border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 14, padding: '13px 15px', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    filter: locked ? 'grayscale(0.6) brightness(0.92)' : 'none', position: 'relative',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 16, fontWeight: 500, color: '#1a1008', lineHeight: 1.35 }}>{p.probleme}</div>
                    </div>
                    {locked ? (
                      <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                    ) : !isPremium ? (
                      <span style={{ color: '#2f8a4a', fontWeight: 700, fontSize: 13, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '.03em' }}>Accéder</span>
                    ) : (
                      <span style={{ color: 'rgba(30,20,8,0.25)', fontSize: 16, flexShrink: 0 }}>›</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── QUESTION DE VIGILANCE ── */}
          {!loading && step === 'vigilance' && problematique && (
            <div style={{ padding: '20px 4px' }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontStyle: 'italic', color: '#000', lineHeight: 1.5, marginBottom: 28 }}>
                Est-ce que tu vis cela depuis longtemps, ou est-ce que ces derniers temps, c'est devenu vraiment difficile à porter ?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => loadRituals(problematique, true)} style={{ padding: '18px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: PASTELS[0], cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: '#1a1008', textAlign: 'left' }}>Oui, ça pèse depuis un moment</button>
                <button onClick={() => loadRituals(problematique, false)} style={{ padding: '18px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: PASTELS[1], cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: '#1a1008', textAlign: 'left' }}>non ça va, c'est plus ponctuel</button>
              </div>
            </div>
          )}

          {/* ── RÉSULTAT ── */}
          {!loading && step === 'result' && problematique && !activeExercise && (
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontStyle: 'italic', color: '#000', lineHeight: 1.6, marginBottom: 18 }}>{problematique.intro_voix}</p>

              {showExitDoor && (
                <div style={{ padding: '14px 16px', borderRadius: 14, background: '#fbe1e1', border: '1px solid rgba(212,80,80,0.18)', marginBottom: 18 }}>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12.5, color: '#000', lineHeight: 1.6, margin: 0 }}>{PORTE_DE_SORTIE.message}</p>
                </div>
              )}

              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: '#000', margin: '0 0 12px' }}>
                Une fois un rituel fait, coche-le pour le garder dans ton protocole personnel.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {ritualDetails.map((ex, i) => {
                  const isKept = kept.has(ex.n)
                  const isDone = doneNs.has(ex.n)
                  const canToggleKeep = isDone || isKept
                  const isPrincipal = problematique.rituels.find(r => r.n === ex.n)?.principal
                  return (
                    <div key={ex.n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: PASTELS[i % PASTELS.length], border: `1px solid ${isPrincipal ? ZONE_COLORS[ex.zone] + '40' : 'rgba(0,0,0,0.06)'}`, borderRadius: 14, padding: '13px 15px' }}>
                      <button
                        onClick={() => canToggleKeep && toggleKeepInProtocol(ex)}
                        disabled={!canToggleKeep}
                        aria-label={isKept ? 'Retirer de mon protocole' : 'Garder dans mon protocole'}
                        title={canToggleKeep ? (isKept ? 'Retirer de mon protocole' : 'Garder dans mon protocole') : 'Fais ce rituel pour pouvoir le garder'}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: canToggleKeep ? 'pointer' : 'default',
                          border: `1.5px solid ${isKept ? ZONE_COLORS[ex.zone] : 'rgba(0,0,0,0.25)'}`, background: isKept ? ZONE_COLORS[ex.zone] : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                          opacity: canToggleKeep ? 1 : 0.3,
                        }}>{isKept ? '✓' : ''}</button>
                      <button onClick={() => setActiveExercise(ex)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 17.5, fontWeight: 500, color: '#1a1008', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isPrincipal && <span style={{ color: ZONE_COLORS[ex.zone] }}>★ </span>}{ex.title}
                          </div>
                          <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 13.5, color: ZONE_COLORS[ex.zone] }}>{ex.dur}</div>
                        </div>
                        {isDone ? <span style={{ fontSize: 28, color: '#3a8050', flexShrink: 0 }}>✓ fait</span> : <span style={{ color: 'rgba(30,20,8,0.25)', fontSize: 15, flexShrink: 0 }}>›</span>}
                      </button>
                    </div>
                  )
                })}
              </div>

              <button onClick={() => setStep('saved')} disabled={kept.size === 0} style={{
                width: '100%', padding: '15px 0', borderRadius: 50, border: 'none', marginTop: 12,
                cursor: kept.size === 0 ? 'default' : 'pointer', opacity: kept.size === 0 ? 0.5 : 1,
                fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: '.06em',
                background: 'linear-gradient(135deg,#a07888,#c8a0b0)', color: '#fff', boxShadow: '0 4px 16px rgba(160,100,120,0.28)',
              }}>
                Valider {kept.size > 0 ? `(${kept.size})` : ''}
              </button>
            </div>
          )}

          {/* ── FICHE COMPLÈTE D'UN RITUEL ── */}
          {!loading && activeExercise && (
            inCooldown && !doneNs.has(activeExercise.n) ? (
              <div>
                <button onClick={() => setActiveExercise(null)} style={{ background: 'none', border: 'none', fontFamily: "'Jost',sans-serif", fontSize: 12, color: 'rgba(30,20,8,0.45)', cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>‹ Retour à la liste</button>
                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: '#c04030', margin: '0 0 4px' }}>
                    Vous avez fait 2 rituels dans cette session.
                  </p>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: 'rgba(30,20,8,0.55)', margin: 0 }}>
                    Revenez dans <strong>{cooldownLabel}</strong> pour continuer.
                  </p>
                </div>
              </div>
            ) : (
              <ExerciseDetail
                exercise={activeExercise}
                zone={{ name: ZONE_LABELS[activeExercise.zone], color: ZONE_COLORS[activeExercise.zone] || '#888', accent: ZONE_COLORS[activeExercise.zone] || '#888' }}
                initialMarked={doneNs.has(activeExercise.n)}
                onBack={() => setActiveExercise(null)}
                onDone={() => handleRitualDone(activeExercise)}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sélection déjà enregistrée : accès rapide ──
function SavedSelectionView({ saved, onModify, onOpen, doneNs }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('rituels').select('*').in('n', saved.ritual_ids)
      .then(({ data }) => setRows(saved.ritual_ids.map(n => data?.find(r => r.n === n)).filter(Boolean)))
  }, [saved])

  return (
    <div>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 18, color: '#1a1008', marginBottom: 16 }}>
        Ta sélection est prête. Clique sur un rituel pour le découvrir. L'idéal est d'en pratiquer un le matin, un le midi et un le soir.
      </p>
      {!rows ? (
        <p style={{ textAlign: 'center', color: 'rgba(30,20,8,0.4)', fontFamily: "'Jost',sans-serif", fontSize: 14, padding: '20px 0' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {rows.map((ex, i) => {
            const isDone = doneNs?.has(ex.n)
            return (
              <button key={ex.n} onClick={() => onOpen(ex)} style={{
                display: 'flex', alignItems: 'center', gap: 10, background: PASTELS[i % PASTELS.length], border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 24, fontWeight: 500, color: '#1a1008' }}>{ex.title}</div>
                  <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: 'rgba(30,20,8,0.4)' }}>{ex.dur}</div>
                </div>
                {isDone ? (
                  <span style={{ fontSize: 28, color: '#3a8050', flexShrink: 0 }}>✓ fait</span>
                ) : (
                  <span style={{ color: 'rgba(30,20,8,0.25)', fontSize: 15, flexShrink: 0 }}>›</span>
                )}
              </button>
            )
          })}
        </div>
      )}
      <button onClick={onModify} style={{
        width: '100%', padding: '13px 0', borderRadius: 50, border: '1px solid rgba(0,0,0,0.10)',
        background: 'transparent', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 13, color: 'rgba(30,20,8,0.55)',
      }}>+ Ajouter d'autres rituels à mon protocole</button>
    </div>
  )
}
