// ─────────────────────────────────────────────────────────────────────────────
import { useAnalytics } from '../hooks/useAnalytics'
import { logNetworkActivity } from '../utils/logNetworkActivity'
//  ScreenDefis.jsx  —  Écran "Défis"
//  Contient : ProposeModal, ScreenDefis, ScreenJardinCollectif
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { supabase } from '../core/supabaseClient'
import { useDefi } from '../hooks/useDefi'
import CommunityGarden from '../components/CommunityGarden'
import { useIsMobile, LumenBadge } from './dashboardShared'

/* ─────────────────────────────────────────
   SCREEN 4 — DÉFIS
───────────────────────────────────────── */
// DEFIS_DATA → now in Supabase via useDefi

function ProposeModal({ onClose, onSubmit, initialData = null }) {
  const isEdit = !!initialData
  const [title, setTitle]     = useState(initialData?.title ?? '')
  const [desc, setDesc]       = useState(initialData?.description ?? '')
  const [zone, setZone]       = useState(initialData?.zone ?? 'Souffle')
  const [dur, setDur]         = useState(initialData?.duration_days ?? 7)
  const [actionVal, setActionVal] = useState(() => {
    const m = initialData?.action_duration_minutes ?? 20
    return m >= 60 ? m / 60 : m
  })
  const [actionUnit, setActionUnit] = useState(initialData?.action_duration_minutes >= 60 ? 'h' : 'min')
  const [emoji, setEmoji]     = useState(initialData?.emoji ?? '🌿')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [periods, setPeriods] = useState(initialData?.action_periods ?? [])
  const zones = ['Souffle','Racines','Feuilles','Tige','Fleurs','Toutes']
  const durs  = [7,14,21,30]

  // Durée action en minutes (pour la DB)
  const actionMinutes = actionUnit === 'h' ? actionVal * 60 : actionVal

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        title, description: desc, zone, duration_days: dur, emoji,
        action_duration_minutes: actionMinutes,
        action_periods: periods.length > 0 ? periods : null,
      })
      setSent(true)
      setTimeout(onClose, 1800)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? '✏️ Modifier le défi' : 'Proposer un défi ✨'}</div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:'var(--fs-emoji-lg, 32px)', marginBottom:12 }}>🌿</div>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color:'rgba(var(--green-rgb),0.9)', letterSpacing:'.04em' }}>{isEdit ? 'Défi modifié !' : 'Proposition envoyée !'}</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', marginTop:6 }}>{isEdit ? '' : 'Elle sera examinée par notre équipe.'}</div>
          </div>
        ) : (
          <>
            {/* Emoji picker + titre */}
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Emoji</div>
                <div
                  style={{ width:54, height:46, borderRadius:11, border:'1px solid var(--border)', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-h2, 22px)', cursor:'text', position:'relative' }}
                  onClick={() => document.getElementById('pm-emoji').focus()}
                >
                  {emoji || '🌿'}
                  <input
                    id="pm-emoji"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    style={{ position:'absolute', inset:0, opacity:0, width:'100%', cursor:'text' }}
                  />
                </div>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Nom du défi</div>
                <input
                  className="modal-input"
                  placeholder="Ex: 5 min de marche chaque matin"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width:'100%' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div className="modal-label">Description</div>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="Décris l'intention du défi…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                style={{ resize:'none', width:'100%' }}
              />
            </div>

            {/* Zone + Durée */}
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Zone</div>
                <select className="modal-input" value={zone} onChange={e => setZone(e.target.value)} style={{ width:'100%' }}>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Durée du défi</div>
                <select className="modal-input" value={dur} onChange={e => setDur(Number(e.target.value))} style={{ width:'100%' }}>
                  {durs.map(d => <option key={d} value={d}>{d} jours</option>)}
                </select>
              </div>
            </div>

            {/* Durée de l'action quotidienne */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div className="modal-label">Durée de l'action quotidienne
                <span style={{ color:'var(--text3)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, fontSize:'var(--fs-h5, 9px)' }}>
                  — combien de temps activer le bouton ACTION chaque jour
                </span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input
                  type="number" min={1} max={actionUnit==='h' ? 24 : 59}
                  value={actionVal}
                  onChange={e => setActionVal(Math.max(1, Number(e.target.value)))}
                  className="modal-input"
                  style={{ width:80 }}
                />
                <select
                  className="modal-input"
                  value={actionUnit}
                  onChange={e => setActionUnit(e.target.value)}
                  style={{ width:90 }}
                >
                  <option value="min">minutes</option>
                  <option value="h">heures</option>
                </select>
                <span style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', whiteSpace:'nowrap' }}>
                  = {actionMinutes < 60
                    ? `${actionMinutes} min`
                    : `${Math.floor(actionMinutes/60)}h${actionMinutes%60>0?String(actionMinutes%60).padStart(2,'0'):''}`
                  } / jour
                </span>
              </div>
            </div>

            {/* Périodes de disponibilité du bouton ACTION */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div className="modal-label">Périodes de disponibilité
                <span style={{ color:'var(--text3)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, fontSize:'var(--fs-h5, 9px)' }}>
                  — quand le bouton ACTION est actif (vide = toute la journée)
                </span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {[['matin','🌅 Matin','6h–12h'], ['midi','☀️ Midi','12h–18h'], ['soir','🌙 Soir','18h–0h']].map(([val, lbl, hint]) => {
                  const active = periods.includes(val)
                  return (
                    <div
                      key={val}
                      onClick={() => setPeriods(prev => active ? prev.filter(p => p !== val) : [...prev, val])}
                      style={{
                        flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        padding:'8px 6px', borderRadius:10, cursor:'pointer', transition:'all .2s',
                        background: active ? 'rgba(var(--green-rgb),0.12)' : 'var(--surface-2)',
                        border:`1px solid ${active ? 'rgba(var(--green-rgb),0.35)' : 'var(--surface-3)'}`,
                        userSelect:'none',
                      }}
                    >
                      <span style={{ fontSize:'var(--fs-emoji-sm, 16px)' }}>{lbl.split(' ')[0]}</span>
                      <span style={{ fontSize:'var(--fs-h5, 11px)', color: active ? 'var(--cream)' : 'var(--text3)', fontWeight: active ? 600 : 400 }}>{lbl.split(' ')[1]}</span>
                      <span style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)' }}>{hint}</span>
                      {active && <span style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--green)' }}>✓</span>}
                    </div>
                  )
                })}
              </div>
              {periods.length === 0 && (
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', fontStyle:'italic' }}>
                  Disponible toute la journée — le bouton peut être activé à n'importe quelle heure.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose}>Annuler</button>
              <button className="modal-submit" onClick={handleSubmit} disabled={!title.trim() || loading}>
                {loading ? (isEdit ? 'Sauvegarde…' : 'Envoi…') : (isEdit ? '✓ Sauvegarder' : 'Envoyer la proposition')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ZONE_COLORS = { Souffle:'var(--zone-breath)', Racines:'var(--zone-roots)', Feuilles:'var(--zone-leaves)', Tige:'var(--zone-stem)', Fleurs:'var(--zone-flowers)', Toutes:'var(--green)' }
const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

// ─────────────────────────────────────────────────────────────────────────────
//  SYSTÈME ACTION
//  - 1 activation par jour autorisée
//  - Décompte silencieux de action_duration_minutes
//  - Journée validée quand le décompte atteint 0
//  - Progression = jours_validés / duration_days
// ─────────────────────────────────────────────────────────────────────────────

function fmtDuration(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}

function fmtCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const h   = Math.floor(totalSec / 3600)
  const m   = Math.floor((totalSec % 3600) / 60)
  const s   = totalSec % 60
  if (h > 0) return `${h}h${String(m).padStart(2,'0')}m`
  if (m > 0) return `${m}m${String(s).padStart(2,'0')}s`
  return `${s}s`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/* ── Hook : état ACTION de l'utilisateur pour un défi ── */
function useActionState(defiId, userId, actionDurationMin) {
  const [status,    setStatus]    = useState('idle')    // 'idle' | 'running' | 'done'
  const [startedAt, setStartedAt] = useState(null)      // timestamp ms
  const [remaining, setRemaining] = useState(0)         // ms
  const [daysCount, setDaysCount] = useState(0)         // jours validés
  const timerRef  = useRef(null)
  const durationMs = (actionDurationMin ?? 20) * 60 * 1000

  // Charger depuis Supabase au montage
  const load = useCallback(async () => {
    if (!userId || !defiId) return
    const today = todayStr()

    // Jours validés (toutes les sessions complétées)
    const { data: completed } = await supabase
      .from('defi_daily_actions')
      .select('action_date')
      .eq('defi_id', defiId)
      .eq('user_id', userId)
      .eq('completed', true)
    setDaysCount((completed ?? []).length)

    // Session d'aujourd'hui
    const { data: todayRow } = await supabase
      .from('defi_daily_actions')
      .select('*')
      .eq('defi_id', defiId)
      .eq('user_id', userId)
      .eq('action_date', today)
      .maybeSingle()

    if (!todayRow) {
      setStatus('idle')
      setStartedAt(null)
      setRemaining(durationMs)
      return
    }
    if (todayRow.completed) {
      setStatus('done')
      return
    }
    // En cours : reprendre là où on en était
    const elapsed = Date.now() - new Date(todayRow.started_at).getTime()
    const left = Math.max(0, durationMs - elapsed)
    if (left <= 0) {
      // Terminé pendant l'absence
      await supabase
        .from('defi_daily_actions')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', todayRow.id)
      setStatus('done')
      setDaysCount(n => n + 1)
    } else {
      setStatus('running')
      setStartedAt(new Date(todayRow.started_at).getTime())
      setRemaining(left)
    }
  }, [defiId, userId, durationMs])

  useEffect(() => { load() }, [load])

  // Ticker quand running
  useEffect(() => {
    if (status !== 'running' || !startedAt) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      const elapsed = Date.now() - startedAt
      const left = Math.max(0, durationMs - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(timerRef.current)
        setStatus('done')
        setDaysCount(n => n + 1)
        logNetworkActivity(userId, 'defi_validated')
        // Marquer complété en DB
        const today = todayStr()
        await supabase
          .from('defi_daily_actions')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('defi_id', defiId)
          .eq('user_id', userId)
          .eq('action_date', today)
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [status, startedAt, durationMs, defiId, userId])

  async function startAction() {
    if (status !== 'idle' || !userId || !defiId) return
    const today = todayStr()
    const now = new Date().toISOString()
    await supabase
      .from('defi_daily_actions')
      .upsert({
        defi_id:     defiId,
        user_id:     userId,
        action_date: today,
        started_at:  now,
        completed:   false,
      }, { onConflict: 'user_id,defi_id,action_date' })
    setStartedAt(Date.now())
    setRemaining(durationMs)
    setStatus('running')
  }

  return { status, remaining, daysCount, startAction }
}

/* ── Générique de film — remplace la carte entière pendant l'action ── */
function CreditsView({ defiId, color, title, emoji, remaining, onBack }) {
  const [names, setNames] = useState([])

  useEffect(() => {
    if (!defiId) return
    async function load() {
      const today = todayStr()
      const { data } = await supabase
        .from('defi_daily_actions')
        .select('user:user_id(display_name)')
        .eq('defi_id', defiId)
        .eq('action_date', today)
        .eq('completed', false)
      setNames((data ?? []).map(r => r.user?.display_name).filter(Boolean))
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [defiId])

  // Durée du scroll : plus il y a de noms, plus c'est lent
  const scrollDuration = Math.max(12, names.length * 3)

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      borderRadius:14, height:220,
      background:`linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, ${color} 6%, var(--bg)) 100%)`,
      border:`1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @keyframes creditsRoll {
          0%   { transform: translateY(100%) }
          100% { transform: translateY(-100%) }
        }
        @keyframes creditsFade { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* Haut : décompte + bouton retour */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', flexShrink:0,
        borderBottom:`1px solid color-mix(in srgb, ${color} 15%, transparent)`,
        background:'rgba(0,0,0,0.25)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{
            width:7, height:7, borderRadius:'50%',
            background:color, boxShadow:`0 0 6px ${color}`,
            display:'inline-block', animation:'actionGlow 1.5s ease-in-out infinite',
          }}/>
          <span style={{ fontSize:'var(--fs-h5, 10px)', color, fontFamily:"'Jost',sans-serif", fontWeight:700, letterSpacing:'.08em' }}>
            ⚡ {fmtCountdown(remaining)}
          </span>
        </div>
        <span style={{ fontSize:'var(--fs-h4, 13px)', fontFamily:"'Cormorant Garamond',serif", color:'var(--text3)', fontStyle:'italic', flex:1, textAlign:'center', paddingRight:8 }}>
          {emoji} {title}
        </span>
        <div
          onClick={onBack}
          style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', cursor:'pointer', padding:'3px 8px', borderRadius:20, border:'1px solid var(--surface-3)', fontFamily:"'Jost',sans-serif", flexShrink:0 }}
        >← retour</div>
      </div>

      {/* Zone de défilement */}
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {/* Fondu haut */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:40, background:'linear-gradient(to bottom, var(--bg), transparent)', zIndex:2, pointerEvents:'none' }}/>
        {/* Fondu bas */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40, background:'linear-gradient(to top, var(--bg), transparent)', zIndex:2, pointerEvents:'none' }}/>

        {names.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:8 }}>
            <span style={{ fontSize:'var(--fs-emoji-md, 22px)', opacity:.4 }}>⚡</span>
            <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontFamily:"'Jost',sans-serif", fontStyle:'italic' }}>
              Tu es le premier à agir aujourd'hui
            </span>
          </div>
        ) : (
          <div style={{
            animation:`creditsRoll ${scrollDuration}s linear infinite`,
            paddingTop:30,
          }}>
            {/* Label intro */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'var(--fs-h5, 8px)', letterSpacing:'.18em', textTransform:'uppercase', color, opacity:.5, fontFamily:"'Jost',sans-serif" }}>
                En action maintenant
              </div>
            </div>
            {/* Noms */}
            {names.map((name, i) => (
              <div key={i} style={{
                textAlign:'center', padding:'9px 0',
                animation:`creditsFade .4s ease ${i * 0.05}s both`,
              }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                  <span style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background:`color-mix(in srgb, ${color} 18%, transparent)`,
                    border:`1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    fontSize:'var(--fs-h5, 12px)', fontWeight:700, color,
                    fontFamily:"'Jost',sans-serif",
                  }}>{name.charAt(0).toUpperCase()}</span>
                  <span style={{
                    fontSize:'var(--fs-h3, 15px)', color:'var(--cream)',
                    fontFamily:"'Cormorant Garamond',serif",
                    fontWeight:300, letterSpacing:'.04em',
                  }}>{name}</span>
                </div>
              </div>
            ))}
            {/* Séparateur */}
            <div style={{ textAlign:'center', padding:'14px 0', color, opacity:.3, fontSize:'var(--fs-emoji-md, 18px)' }}>✦</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Badge ACTION (reçoit l'état depuis DefiCard) ── */
function ActionBadge({ status, remaining, daysCount, startAction, onOpenCredits, color, actionDurationMin, actionPeriods, inline = false }) {
  const isRunning = status === 'running'
  const isDone    = status === 'done'
  const isIdle    = status === 'idle'

  // Vérifier si la période courante est autorisée
  const currentHour = new Date().getHours()
  const currentPeriod = currentHour < 12 ? 'matin' : currentHour < 18 ? 'midi' : 'soir'
  const PERIOD_LABELS = { matin:'🌅 Matin (6h–12h)', midi:'☀️ Midi (12h–18h)', soir:'🌙 Soir (18h–0h)' }
  const inPeriod = !actionPeriods || actionPeriods.length === 0 || actionPeriods.includes(currentPeriod)
  const nextPeriod = actionPeriods?.find(p => p !== currentPeriod) ?? null
  const blockedMsg = !inPeriod
    ? `Disponible : ${actionPeriods.map(p => PERIOD_LABELS[p]).join(' · ')}`
    : null

  return (
    <div style={{ display:'flex', flexDirection: inline ? 'row' : 'column', alignItems:'center', gap:4, marginTop: inline ? 0 : 8 }}>
      <style>{`
        @keyframes actionPulse {
          0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, ${color} 40%, transparent); }
          50%      { box-shadow: 0 0 0 6px color-mix(in srgb, ${color} 0%, transparent); }
        }
        @keyframes actionGlow {
          0%,100% { opacity:1; } 50% { opacity:.55; }
        }
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div
          onClick={isIdle && inPeriod ? startAction : isRunning ? onOpenCredits : undefined}
          style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 10px', borderRadius:20,
            fontFamily:"'Jost',sans-serif", fontSize:'var(--fs-h5, 10px)', fontWeight:500,
            letterSpacing:'.04em', cursor: (isIdle && inPeriod) || isRunning ? 'pointer' : 'not-allowed',
            transition:'all .2s',
            ...(isDone ? {
              background:'var(--green3)', border:'1px solid var(--greenT)', color:'var(--green)',
            } : isRunning ? {
              background:`color-mix(in srgb, ${color} 15%, transparent)`,
              border:`1px solid color-mix(in srgb, ${color} 45%, transparent)`,
              color, animation:'actionPulse 2s ease-in-out infinite',
            } : {
              background:`color-mix(in srgb, ${color} 8%, transparent)`,
              border:`1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              color, animation: inPeriod ? 'actionGlow 3s ease-in-out infinite' : 'none',
              opacity: inPeriod ? 1 : 0.45,
            }),
          }}
        >
          <span style={{
            width:7, height:7, borderRadius:'50%', flexShrink:0,
            background: isDone ? 'var(--green)' : color,
            boxShadow: isDone ? '0 0 5px var(--green)' : `0 0 5px ${color}`,
          }}/>
          {isDone
            ? '✓ Fait aujourd\'hui'
            : isRunning
            ? `⚡ ACTION · ${fmtCountdown(remaining)}`
            : `⚡ ACTION · ${fmtDuration(actionDurationMin)}`}
        </div>
        {daysCount > 0 && (
          <span style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', fontFamily:"'Jost',sans-serif" }}>
            {daysCount} j
          </span>
        )}
      </div>
      {blockedMsg && (
        <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', fontStyle:'italic', textAlign:'center', marginTop:4 }}>
          {blockedMsg}
        </div>
      )}
    </div>
  )
}

/* ── Carte défi avec mode générique ── */
function DefiCard({ d, isJoined, color, userId, toggleJoin, awardLumens, track, joinedIds, isAdmin, onEdit, onDelete }) {
  const [showCredits, setShowCredits] = useState(false)
  const { status, remaining, daysCount, startAction } = useActionState(d.id, userId, d.action_duration_minutes)

  // Ouvrir le générique si action en cours (reprise après rechargement)
  // Fermer quand terminé
  useEffect(() => {
    if (status === 'running') setShowCredits(true)
    if (status === 'done')    setShowCredits(false)
  }, [status])

  const pct = d.duration_days > 0
    ? Math.round(((d.days_validated ?? d.progress ?? 0) / d.duration_days) * 100)
    : (d.progress ?? 0)
  const daysVal = d.days_validated ?? Math.round((d.progress ?? 0) * d.duration_days / 100) ?? 0

  if (showCredits) {
    return (
      <div className="defi-card" style={{ padding:0, overflow:'hidden' }}>
        <CreditsView
          defiId={d.id}
          color={color}
          title={d.title}
          emoji={d.emoji}
          remaining={remaining}
          onBack={() => setShowCredits(false)}
        />
      </div>
    )
  }

  return (
    <div className="defi-card">
      <div className="dc-top">
        <div className="dc-emoji">{d.emoji}</div>
        <div className="dc-info">
          <div className="dc-title">{d.title}</div>
          <div className="dc-zone">{d.zone}</div>
        </div>
        <div className="dc-dur">{d.duration_days} j</div>
      </div>
      <div className="dc-desc">{d.description}</div>
      {/* Ligne unique : participants + barre + action/rejoindre */}
      <div className="dc-foot">
        <div className="dc-participants">{(d.participantCount??0).toLocaleString()} pers.</div>
        <div className="dc-bar">
          <div className="dc-bar-fill" style={{ width:`${pct}%`, background:color+'88', transition:'width .4s' }} />
        </div>
        {isJoined && d.action_duration_minutes
          ? <ActionBadge
              status={status}
              remaining={remaining}
              daysCount={daysCount}
              startAction={() => { startAction(); setShowCredits(true) }}
              onOpenCredits={() => setShowCredits(true)}
              color={color}
              actionDurationMin={d.action_duration_minutes}
              actionPeriods={d.action_periods ?? null}
              inline
            />
          : isJoined
          ? <div className="dc-joined" onClick={() => { toggleJoin(d.id); awardLumens?.(-2, 'leave_defi', { defi_id: d.id }) }} style={{ cursor:'pointer' }}>✓ En cours</div>
          : <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <LumenBadge amount={2} />
              <div className="dc-join-btn" onClick={() => {
                toggleJoin(d.id)
                if (!joinedIds.has(d.id)) { awardLumens?.(2, 'join_defi', { defi_id: d.id }); track('defi_join', { defi_id: d.id }, 'defis', 'defis'); logNetworkActivity(userId, 'join_defi') }
              }}>Rejoindre</div>
            </div>}
      </div>
      {isAdmin && (
        <div className="dc-admin">
          <button className="dc-admin-btn" onClick={() => onEdit?.(d)}>✏️ Modifier</button>
          <button className="dc-admin-btn del" onClick={() => onDelete?.(d)}>🗑 Supprimer</button>
        </div>
      )}
    </div>
  )
}

function ScreenDefis({ userId, awardLumens, isPremium = false, onUpgrade }) {
  const { track } = useAnalytics(userId)
  const isMobile = useIsMobile()
  const [cat, setCat] = useState('Tous')
  const [showPropose, setShowPropose] = useState(false)
  const [editDefi, setEditDefi]       = useState(null)
  const [refreshKey, setRefreshKey]   = useState(0)
  const [dismissedIds, setDismissedIds] = useState(new Set())
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const { defis: rawDefis, featured: rawFeatured, myDefis, joinedIds, communityStats, isLoading, toggleJoin, proposeDefi, reload: reloadDefis } = useDefi(userId)
  const [periodsMap, setPeriodsMap] = useState({})

  // Charger action_periods directement depuis Supabase (le service ne l'inclut peut-être pas)
  useEffect(() => {
    if (!rawDefis.length) return
    supabase.from('defis').select('id, action_periods')
      .then(({ data }) => {
        if (!data) return
        const map = Object.fromEntries(data.map(d => [d.id, d.action_periods ?? null]))
        setPeriodsMap(map)
      })
  }, [rawDefis.length])

  // Fusionner action_periods dans les défis
  const defis = rawDefis.map(d => ({ ...d, action_periods: periodsMap[d.id] ?? d.action_periods ?? null }))
  const featured = rawFeatured ? { ...rawFeatured, action_periods: periodsMap[rawFeatured.id] ?? rawFeatured.action_periods ?? null } : null
  const filtered = cat === 'Tous'
  ? defis.filter(d => !d.is_featured)
  : defis.filter(d => d.zone === cat && !d.is_featured)

  // Défis visibles : rejoints + non écartés, ordre original, 6 max
  const visibleDefis = useMemo(() => {
    const notDismissed = filtered.filter(d => !dismissedIds.has(d.id))
    const joined = notDismissed.filter(d => joinedIds.has(d.id))
    const others = notDismissed.filter(d => !joinedIds.has(d.id))
    return [...joined, ...others].slice(0, 6)
  }, [filtered, dismissedIds, joinedIds])
  const featuredJoined = featured ? joinedIds.has(featured.id) : false

  useEffect(() => {
    const handler = () => setShowPropose(true)
    document.addEventListener('openPropose', handler)
    return () => document.removeEventListener('openPropose', handler)
  }, [])

  // Actualisation après édition/suppression via Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel('defis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defis' }, () => {
        setRefreshKey(k => k + 1)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="content" key={refreshKey}>
      {showPropose && <ProposeModal onClose={() => setShowPropose(false)} onSubmit={proposeDefi} />}
      {editDefi && (
        <ProposeModal
          onClose={() => setEditDefi(null)}
          initialData={editDefi}
          onSubmit={async (fields) => {
            const { error } = await supabase.from('defis').update({
              title:                   fields.title,
              description:             fields.description,
              zone:                    fields.zone,
              duration_days:           fields.duration_days,
              emoji:                   fields.emoji,
              action_duration_minutes: fields.action_duration_minutes,
              action_periods:          fields.action_periods ?? null,
            }).eq('id', editDefi.id)
            if (error) {
              console.error('Erreur update défi:', error.message)
              alert('Erreur : ' + error.message)
              return
            }
            setEditDefi(null)
            await reloadDefis()   // Recharge les défis avec les nouvelles données
          }}
        />
      )}
      <div className="col" style={{ flex:1 }}>
        <div className="defi-featured">
          <div className="df-glow" />
          {featured ? (
  <>
    <div className="df-tag">
      Défi communauté · {featuredJoined ? '✓ En cours' : 'Rejoins-nous'}
    </div>

    <div className="df-title">{featured.title}</div>

    <div className="df-desc">{featured.description}</div>

    <div className="df-meta">
      <div className="dfm-item"><span>📅</span> {featured.duration_days} jours</div>
      <div className="dfm-item"><span>🌿</span> {featured.zone}</div>
      <div className="dfm-item">
        <span>👥</span> {(featured.participantCount ?? 0).toLocaleString()} participants
      </div>
    </div>

    {featuredJoined && (
      <>
        <div className="df-progress">
          <div className="dfp-fill" style={{ width:(featured.progress ?? 0) + '%' }} />
        </div>
        <div className="df-progress-label">
          <span>Progression</span>
          <span>{featured.progress ?? 0}%</span>
        </div>
      </>
    )}

    <div className="df-actions">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4 }}>
        {!featuredJoined && <LumenBadge amount={2} />}
        <div
          className={featuredJoined ? 'df-join df-join-active' : 'df-join'}
          onClick={() => { const joining = !joinedIds.has(featured.id); toggleJoin(featured.id); if (joining) { awardLumens?.(2, 'join_defi', { defi_id: featured.id }); track('defi_join', { defi_id: featured.id }, 'defis', 'defis'); logNetworkActivity(userId, 'join_defi') } else { awardLumens?.(-2, 'leave_defi', { defi_id: featured.id }) } }}
        >
          {featuredJoined ? '✓ En cours' : 'Je rejoins'}
        </div>
      </div>

      <div className="df-learn" onClick={isPremium ? () => setShowPropose(true) : onUpgrade} style={{ opacity: isPremium ? 1 : 0.4, cursor: isPremium ? 'pointer' : 'not-allowed' }}>
        {isPremium ? 'Proposer un défi' : '🔒 Proposer un défi'}
      </div>
    </div>
  </>
) : (
  <>
    {/* 🌿 CARTE INSPIRATIONNELLE */}

    <div className="df-tag">
      Inspiration du moment
    </div>

    <div className="df-title">
      🌸 Le Rituel des 5 Minutes
    </div>

    <div className="df-desc">
      Même sans défi officiel, votre jardin peut évoluer.
      Aujourd’hui, prenez 5 minutes pour respirer,
      écrire une gratitude ou simplement marcher en conscience.
    </div>

    <div className="df-meta">
      <div className="dfm-item"><span>✨</span> Micro-rituel libre</div>
      <div className="dfm-item"><span>🌿</span> Toutes zones</div>
      <div className="dfm-item"><span>🕊</span> Sans engagement</div>
    </div>

    <div className="df-actions">
      <div
  className="df-join"
  onClick={() => {
    document.querySelector('.defis-grid')?.scrollIntoView({ behavior: 'smooth' })
  }}
>
  🌱 Trouvez votre défi du jour
</div>

      <div className="df-learn" onClick={isPremium ? () => setShowPropose(true) : onUpgrade} style={{ opacity: isPremium ? 1 : 0.4, cursor: isPremium ? 'pointer' : 'not-allowed' }}>
        {isPremium ? 'Proposer un défi à la communauté' : '🔒 Proposer un défi'}
      </div>
    </div>
  </>
)}
        </div>
        {isLoading && <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--text3)', padding:'20px 0' }}>Chargement des défis…</div>}
        <div className="cat-filter">
          {cats.map(c => {
            const locked = !isPremium && ['Racines','Feuilles','Tige','Fleurs'].includes(c)
            return (
              <div key={c}
                className={'cat-btn'+(cat===c?' active':'')}
                onClick={() => locked ? onUpgrade?.() : setCat(c)}
                style={{ opacity: locked ? 0.35 : 1, cursor: locked ? 'not-allowed' : 'pointer', position:'relative' }}>
                {locked ? '🔒 ' : ''}{c}
              </div>
            )
          })}
        </div>
        <div className="slabel">{cat==='Tous'?'Tous les défis':`Zone ${cat}`} · {filtered.length} disponibles</div>
        <div className="defis-grid-2col">
          {visibleDefis.map((d,i) => {
            const isJoined = joinedIds.has(d.id)
            const color = ZONE_COLORS[d.zone] ?? 'var(--green)'
            return (
              <div key={d.id??i} style={{ position:'relative' }}>
                <DefiCard
                  d={d}
                  isJoined={isJoined}
                  color={color}
                  userId={userId}
                  toggleJoin={toggleJoin}
                  awardLumens={awardLumens}
                  track={track}
                  joinedIds={joinedIds}
                  isAdmin={ADMIN_IDS.includes(userId)}
                  onEdit={defi => setEditDefi(defi)}
                  onDelete={async defi => {
                    if (!confirm(`Supprimer "${defi.title}" ? Cette action est irréversible.`)) return
                    await supabase.from('defis').delete().eq('id', defi.id)
                    setRefreshKey(k => k + 1)
                  }}
                />
                {/* Bouton écarter — n'apparaît que si pas rejoint */}
                {!isJoined && (
                  <button
                    onClick={() => setDismissedIds(s => new Set([...s, d.id]))}
                    title="Ne pas afficher ce défi"
                    style={{
                      position:'absolute', top:6, right:6,
                      background:'none', border:'none', cursor:'pointer',
                      fontSize:10, color:'var(--text3)',
                      opacity:0.3, lineHeight:1, padding:'3px 5px',
                      transition:'opacity .15s', fontFamily:"'Jost',sans-serif",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity='0.3'}
                  >✕</button>
                )}
              </div>
            )
          })}
        </div>
        {/* Recharger de nouveaux défis */}
        {visibleDefis.filter(d => !joinedIds.has(d.id)).length === 0 && filtered.filter(d => !joinedIds.has(d.id)).length > 0 && (
          <div style={{ marginTop:8, textAlign:'center' }}>
            <button onClick={() => setDismissedIds(new Set())}
              style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', background:'none', border:'1px solid var(--border2)', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
              🔄 Voir d'autres défis
            </button>
          </div>
        )}
      </div>

      <div className="rpanel" style={{ display: isMobile ? "none" : undefined }}>
        <div className="rp-section">
          <div className="rp-slabel">Mes défis actifs</div>
          {myDefis.length === 0 && <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text3)', padding:'8px 0' }}>Aucun défi en cours</div>}
          {myDefis.map((d,i) => {
            const pct = d.duration_days > 0
              ? Math.round(((d.days_validated ?? d.progress ?? 0) / d.duration_days) * 100)
              : (d.progress ?? 0)
            const daysVal = d.days_validated ?? Math.round((d.progress ?? 0) * d.duration_days / 100) ?? 0
            return (
            <div key={i} style={{ marginBottom:11, padding:'11px 13px', background:'var(--green3)', border:'1px solid rgba(var(--green-rgb),0.18)', borderRadius:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <span style={{ fontSize:'var(--fs-emoji-md, 17px)' }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text)' }}>{d.title}</div>
                  <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>{d.zone} · {d.duration_days} j</div>
                </div>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.09)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:(ZONE_COLORS[d.zone]??'var(--green)'), borderRadius:100, transition:'width .4s' }} />
              </div>
              <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:5, display:'flex', justifyContent:'space-between' }}>
                <span>{daysVal} / {d.duration_days} jours validés</span>
                <span>{pct}%</span>
              </div>
            </div>
            )
          })}
        </div>
        <div className="rp-section">
          <div className="rp-slabel">Pouls de la communauté</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>🌿</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 22px)', color:'var(--text)', lineHeight:1 }}>{communityStats.activeGardens}</div>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>jardins actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>✅</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 22px)', color:'var(--text)', lineHeight:1 }}>{communityStats.completedRituals}</div>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>rituels complétés</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>✨</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 22px)', color:'var(--text)', lineHeight:1 }}>{communityStats.totalDefis}</div>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>défis actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>👥</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 22px)', color:'var(--text)', lineHeight:1 }}>{communityStats.totalParticipants.toLocaleString()}</div>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>participations</div></div>
            </div>
          </div>
        </div>
        <div className="rp-section" style={{ marginTop:'auto' }}>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', lineHeight:1.6, fontStyle:'italic' }}>
            "Ce dimanche dans mon jardin" · données en temps réel
          </div>
        </div>
      </div>
    </div>
  )
}


function ScreenJardinCollectif({ userId, isPremium = false, onUpgrade }) {
  const isMobile = useIsMobile()
  return (
    <div className="content" style={{ flex:1, overflow:'hidden', paddingBottom: isMobile ? 64 : 0, position:'relative' }}>
      <CommunityGarden currentUserId={userId} embedded isPremium={isPremium} />

      {/* Overlay flou pour les non-premium — masque les fleurs éloignées */}
      {!isPremium && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 5%, rgba(var(--overlay-dark-rgb,6,14,7),0.40) 25%, rgba(var(--overlay-dark-rgb,6,14,7),0.75) 45%, rgba(var(--overlay-dark-rgb,6,14,7),0.96) 65%)',
          zIndex: 10,
        }} />
      )}

      {/* Badge premium */}
      {!isPremium && (
        <div style={{
          position: 'absolute', bottom: isMobile ? 80 : 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <div onClick={onUpgrade} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '8px 18px', borderRadius: 20,
            background: 'rgba(var(--lumens-rgb),0.12)', border: '1px solid rgba(var(--lumens-rgb),0.30)',
          }}>
            <span style={{ fontSize:'var(--fs-emoji-sm, 13px)' }}>🔒</span>
            <span style={{ fontSize:'var(--fs-h5, 12px)', color: 'var(--green)', fontWeight: 500 }}>Voir tout le jardin — Premium</span>
            <span style={{ fontSize:'var(--fs-h5, 11px)', color: 'rgba(var(--lumens-rgb),0.60)' }}>→</span>
          </div>
        </div>
      )}
    </div>
  )
}


export { ScreenDefis, ScreenJardinCollectif }
