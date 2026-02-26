import { useState } from "react"
import { useAuth }     from '../hooks/useAuth'
import { usePlant }    from '../hooks/usePlant'
import { useCircle }   from '../hooks/useCircle'
import { usePrivacy }  from '../hooks/usePrivacy'
import { useGestures } from '../hooks/useGestures'
import { useJournal }  from '../hooks/useJournal'
import { RITUAL_CATALOG } from '../services/ritual.service'

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }

:root {
  --bg:      #1a2e1a;
  --bg2:     #213d21;
  --bg3:     #274827;
  --border:  rgba(255,255,255,0.14);
  --border2: rgba(255,255,255,0.08);
  --text:    #f2ede0;
  --text2:   rgba(242,237,224,0.85);
  --text3:   rgba(242,237,224,0.55);
  --green:   #96d485;
  --green2:  rgba(150,212,133,0.22);
  --green3:  rgba(150,212,133,0.11);
  --greenT:  rgba(150,212,133,0.48);
  --gold:    #e8d4a8;
  --rose:    rgba(210,130,130,0.7);
  --blue:    rgba(130,170,210,0.7);
  --amber:   rgba(220,180,100,0.7);
}

body { background: var(--bg); }

.root {
  font-family: 'Jost', sans-serif;
  background: var(--bg);
  height: 100vh;
  width: 100vw;
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--greenT); border-radius: 100px; }

/* ── APP LAYOUT ── */
.app-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── SIDEBAR ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border2);
  background: rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  padding: 22px 0 18px;
  overflow-y: auto;
}

.sb-logo {
  padding: 0 22px 18px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 300;
  color: var(--gold);
  border-bottom: 1px solid var(--border2);
  margin-bottom: 14px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}
.sb-logo em { font-style: italic; color: var(--green); }

.sb-section {
  padding: 0 14px 6px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.04em;
  color: var(--text3);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid transparent;
  user-select: none;
}
.sb-item:hover { color: var(--text2); background: rgba(255,255,255,0.04); }
.sb-item.active {
  color: #c8f0b8;
  background: var(--green3);
  border-left-color: var(--green);
}
.sb-icon { font-size: 15px; flex-shrink: 0; }
.sb-badge {
  margin-left: auto;
  min-width: 18px; height: 18px;
  background: var(--green2);
  border: 1px solid var(--greenT);
  border-radius: 100px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
  color: var(--green);
  padding: 0 4px;
}

.sb-divider { height: 1px; background: var(--border2); margin: 10px 22px; }

.sb-plant-card {
  margin: 8px 16px;
  padding: 14px 12px;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.15);
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.sb-plant-card:hover { background: var(--green2); }
.spc-emoji { font-size: 30px; margin-bottom: 6px; display: block; }
.spc-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  color: #c8f0b8;
  line-height: 1;
}
.spc-label {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  margin-top: 4px;
}

.sb-footer {
  margin-top: auto;
  padding: 14px 22px 0;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.7;
  letter-spacing: 0.03em;
}
.sb-logout {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(242,237,224,0.25);
  transition: color 0.2s;
  padding: 4px 0;
}
.sb-logout:hover { color: rgba(210,110,110,0.7); }

/* ── MAIN ── */
.main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
  background: rgba(0,0,0,0.08);
}
.tb-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 300;
  color: var(--gold);
  flex: 1;
}
.tb-title em { font-style: italic; color: var(--green); }
.tb-subtitle {
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.05em;
  align-self: flex-end;
  padding-bottom: 2px;
}
.tb-btn {
  padding: 7px 18px;
  border-radius: 100px;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--greenT);
  background: var(--green2);
  color: #c8f0b8;
}
.tb-btn:hover { background: rgba(150,212,133,0.32); }
.tb-btn.ghost { background: transparent; color: var(--text2); border-color: var(--border); }
.tb-notif {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  position: relative;
  cursor: pointer;
}
.notif-dot {
  position: absolute; top: -1px; right: -1px;
  width: 8px; height: 8px;
  background: var(--green);
  border-radius: 50%;
  border: 1.5px solid var(--bg2);
}

/* ── CONTENT AREAS ── */
.content { flex: 1; overflow: hidden; display: flex; min-height: 0; }
.col { overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }

.slabel {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border2);
}

/* ── CARDS ── */
.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s;
}
.card:hover { border-color: rgba(255,255,255,0.18); }
.card.green { background: var(--green3); border-color: rgba(150,212,133,0.18); }

/* ─────────────────────────────────────────
   SCREEN 1 — CERCLE
───────────────────────────────────────── */
.gardens-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.gcard {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 10px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: all 0.2s;
}
.gcard:hover { background: var(--green3); border-color: rgba(150,212,133,0.25); }
.gcard-emoji { font-size: 26px; }
.gcard-name { font-size: 11px; letter-spacing: 0.06em; color: var(--text2); }
.gcard-bar { width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
.gcard-fill { height: 100%; background: linear-gradient(90deg, #3a7a32, var(--green)); border-radius: 100px; }
.gcard-n { font-size: 10px; color: rgba(150,212,133,0.7); letter-spacing: 0.05em; }
.gcard-absent { opacity: 0.45; }

.collective-banner {
  background: rgba(170,140,210,0.09);
  border: 1px solid rgba(170,140,210,0.25);
  border-radius: 14px;
  padding: 14px 16px;
}
.cb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.cb-badge {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 10px;
  background: rgba(170,140,210,0.18);
  border: 1px solid rgba(170,140,210,0.35);
  border-radius: 100px;
  color: rgba(210,190,240,0.9);
}
.cb-timer { font-size: 11px; color: var(--text3); }
.cb-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 300; color: #e8e0f8; margin-bottom: 5px; }
.cb-desc { font-size: 12px; font-weight: 300; color: var(--text2); margin-bottom: 10px; line-height: 1.6; }
.cb-foot { display: flex; align-items: center; gap: 8px; }
.cb-avatars { display: flex; }
.cb-av {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(170,140,210,0.22);
  border: 1px solid rgba(170,140,210,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; margin-left: -5px;
}
.cb-av:first-child { margin-left: 0; }
.cb-count { font-size: 10px; color: var(--text3); margin-left: 6px; flex: 1; }
.cb-join {
  padding: 5px 16px;
  background: rgba(170,140,210,0.18);
  border: 1px solid rgba(170,140,210,0.35);
  border-radius: 100px;
  font-size: 10px; letter-spacing: 0.08em;
  color: rgba(210,190,240,0.9);
  cursor: pointer;
}

.act-item { display: flex; align-items: flex-start; gap: 10px; }
.act-av {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.22);
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.act-body { flex: 1; }
.act-text { font-size: 12px; font-weight: 300; color: var(--text2); line-height: 1.5; }
.act-text b { color: var(--text); font-weight: 400; }
.act-time { font-size: 10px; color: var(--text3); margin-top: 2px; }
.act-zone {
  font-size: 9px; letter-spacing: 0.08em;
  padding: 3px 10px;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.22);
  border-radius: 100px;
  color: rgba(150,212,133,0.9);
  flex-shrink: 0; align-self: flex-start;
}

.rpanel { width: 260px; flex-shrink: 0; border-left: 1px solid var(--border2); overflow-y: auto; }
.rp-section { padding: 18px 18px 0; }
.rp-slabel {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text3); padding-bottom: 10px;
  border-bottom: 1px solid var(--border2);
  margin-bottom: 12px;
}

.member-row { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.mr-av {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--green3); border: 1px solid rgba(150,212,133,0.22);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.mr-name { flex: 1; font-size: 12px; font-weight: 300; color: var(--text2); }
.mr-bar { width: 44px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; flex-shrink: 0; }
.mr-fill { height: 100%; background: var(--green); border-radius: 100px; }
.mr-pct { font-size: 10px; color: rgba(150,212,133,0.7); width: 28px; text-align: right; flex-shrink: 0; }

.gesture-item {
  display: flex; align-items: center; gap: 9px; margin-bottom: 9px;
  padding: 8px 11px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px; border: 1px solid var(--border2);
}
.gi-emoji { font-size: 15px; }
.gi-text { flex: 1; font-size: 11px; font-weight: 300; color: var(--text2); line-height: 1.4; }
.gi-text b { color: var(--text); font-weight: 400; }
.gi-time { font-size: 10px; color: var(--text3); }

`

/* ─────────────────────────────────────────
   PLANT SVG
───────────────────────────────────────── */
function PlantSVG({ health = 72, w = 90, h = 100 }) {
  const r = health / 100
  return (
    <svg width={w} height={h} viewBox="0 0 90 100" fill="none">
      <ellipse cx="45" cy="93" rx="18" ry="4" fill="rgba(100,60,30,0.25)" />
      <path d="M29 93 Q27 81 30 79 H60 Q63 81 61 93 Z" fill="#7a4a2a" opacity="0.7" />
      <rect x="28" y="76" width="34" height="5" rx="1.5" fill="#8a5535" />
      <ellipse cx="45" cy="80" rx="15" ry="4" fill="#2d1f12" opacity={0.9 * r + 0.1} />
      <path d={`M45 ${79 - 32 * r} Q42 ${68 - 18 * r} 45 ${79 - 6 * r}`}
        stroke={`rgba(60,${100 + 40 * r},40,${0.4 + 0.6 * r})`}
        strokeWidth={1.5 + r} strokeLinecap="round" fill="none" />
      {r > 0.2 && <ellipse cx="37" cy={68 - 12 * r} rx={9 * r} ry={4.5 * r}
        fill={`rgba(35,${70 + 70 * r},25,${0.55 + 0.35 * r})`}
        transform={`rotate(-30,37,${68 - 12 * r})`} />}
      {r > 0.3 && <ellipse cx="53" cy={62 - 16 * r} rx={10 * r} ry={5 * r}
        fill={`rgba(40,${75 + 65 * r},30,${0.55 + 0.35 * r})`}
        transform={`rotate(25,53,${62 - 16 * r})`} />}
      {r > 0.45 && [0,60,120,180,240,300].map((a, i) => (
        <ellipse key={i}
          cx={45 + Math.cos(a * Math.PI / 180) * (5 * r)}
          cy={(79 - 32 * r) + Math.sin(a * Math.PI / 180) * (5 * r)}
          rx={3.5 * r} ry={2 * r}
          fill={`rgba(${190 - 30 * r},${70 + 70 * r},${90 + 50 * r},${0.5 + 0.4 * r})`}
          transform={`rotate(${a},${45 + Math.cos(a * Math.PI / 180) * 5 * r},${(79 - 32 * r) + Math.sin(a * Math.PI / 180) * 5 * r})`}
        />
      ))}
      {r > 0.45 && <circle cx="45" cy={79 - 32 * r} r={3 * r} fill={`rgba(240,${170 + 50 * r},90,${0.7 + 0.3 * r})`} />}
      {r > 0.65 && <circle cx="45" cy={79 - 32 * r} r={14 * r} fill={`rgba(150,212,133,${0.05 * r})`} />}
    </svg>
  )
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const MEMBER_EMOJIS = { Marie:'🌸', Lucas:'🌿', Sofia:'🌾', Paul:'🌱', Léa:'🌺', Tom:'🍃' }
const memberEmoji = n => MEMBER_EMOJIS[n] ?? '🌿'
const GESTURE_EMOJI = { water:'💧', sun:'☀️', seed:'🌱' }
const GESTURE_LABEL = { water:'une goutte', sun:'un rayon', seed:'une graine' }

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  if (m < 1440) return `il y a ${Math.floor(m/60)}h`
  return 'hier'
}
function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { weekday:'short', day:'numeric', month:'short' }).format(new Date(iso))
}

const ZONES = [
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'#96d485' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'#7ad490' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'#60d475' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'#e088a8' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'#88b8e8' },
]

/* ─────────────────────────────────────────
   SCREEN 1 — CERCLE
───────────────────────────────────────── */
function ScreenCercle({ userId, openCreate, onCreateClose }) {
  const { circleMembers, activeCircle } = useCircle(userId)
  const { received, send } = useGestures(userId)
  const [sentGestures, setSentGestures] = useState(new Set())
  const [toast, setToast] = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function handleSendGesture(toUserId, type) {
    const key = `${toUserId}-${type}`
    if (sentGestures.has(key)) return
    setSentGestures(prev => new Set([...prev, key]))
    try {
      await send(toUserId, activeCircle?.id, type)
      const labels = { '💧':'une goutte', '☀️':'un rayon', '🌱':'une graine' }
      showToast(`${type} ${labels[type]} envoyé${type==='☀️'?'':' !'} ✨`)
    } catch {
      setSentGestures(prev => { const s = new Set(prev); s.delete(key); return s })
      showToast("Erreur lors de l'envoi")
    }
  }

  const ACTIVITY = [
    { name:'Léa',   action:'a complété', ritual:'Respiration consciente', zone:'Souffle', t: new Date(Date.now()-480000).toISOString() },
    { name:'Marie', action:'a envoyé ☀️ à Lucas', ritual:'', zone:'', t: new Date(Date.now()-1320000).toISOString() },
    { name:'Lucas', action:'a complété', ritual:'Bouger mon corps', zone:'Tige',    t: new Date(Date.now()-2400000).toISOString() },
    { name:'Paul',  action:'a complété', ritual:'5 min de centrage', zone:'Racines', t: new Date(Date.now()-3600000).toISOString() },
  ]

  return (
    <>
      <Toast msg={toast} />
      <div className="content">
        <div className="col" style={{ flex:1 }}>
        <div className="slabel">Jardins du cercle — {activeCircle?.name ?? 'Cercle'} · Aujourd'hui</div>
        <div className="gardens-grid">
          {circleMembers.map(m => {
            const name = m.user?.display_name ?? m.user?.email ?? '?'
            const plant = m.todayPlant
            return (
              <div key={m.userId} className={'gcard' + (!plant ? ' gcard-absent' : '')}>
                <div className="gcard-emoji">{memberEmoji(name)}</div>
                <div className="gcard-name">{name}</div>
                <div className="gcard-bar"><div className="gcard-fill" style={{ width:`${plant?.health ?? 0}%` }} /></div>
                <div className="gcard-n">{plant ? `${plant.health}%` : 'Pas encore là'}</div>
                {m.userId !== userId && (
                  <div className="gcard-gestures">
                    {['💧','☀️','🌱'].map(type => (
                      <div key={type}
                        className={'gcard-gesture-btn' + (sentGestures.has(`${m.userId}-${type}`) ? ' sent' : '')}
                        onClick={() => handleSendGesture(m.userId, type)}
                        title={`Envoyer ${type}`}
                      >{type}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="collective-banner">
          <div className="cb-top">
            <span className="cb-badge">Collectif · Ce soir</span>
            <span className="cb-timer">dans 3h 42min</span>
          </div>
          <div className="cb-title">Instant de silence partagé — 21h</div>
          <div className="cb-desc">5 minutes de silence conscient, ensemble à distance. Chacun dans son jardin, chacun présent.</div>
          <div className="cb-foot">
            <div className="cb-avatars">
              {['🌸','🌿','🌾','🌱'].map((e,i) => <div key={i} className="cb-av">{e}</div>)}
            </div>
            <span className="cb-count">14 participants inscrits</span>
            <div className="cb-join">Rejoindre</div>
          </div>
        </div>

        <div className="slabel">Activité récente</div>
        {ACTIVITY.map((a, i) => (
          <div key={i} className="act-item">
            <div className="act-av">{memberEmoji(a.name)}</div>
            <div className="act-body">
              <div className="act-text"><b>{a.name}</b> {a.action} {a.ritual && <b>{a.ritual}</b>}</div>
              <div className="act-time">{timeAgo(a.t)}</div>
            </div>
            {a.zone && <div className="act-zone">{a.zone}</div>}
          </div>
        ))}
        </div>

        <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Membres · {circleMembers.length}</div>
          {circleMembers.map(m => {
            const name = m.user?.display_name ?? '?'
            const h = m.todayPlant?.health ?? 0
            return (
              <div key={m.userId} className="member-row">
                <div className="mr-av">{memberEmoji(name)}</div>
                <div className="mr-name">{name}</div>
                <div className="mr-bar"><div className="mr-fill" style={{ width:`${h}%` }} /></div>
                <div className="mr-pct">{h}%</div>
              </div>
            )
          })}
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Gestes reçus</div>
          {received.map(g => (
            <div key={g.id} className="gesture-item">
              <div className="gi-emoji">{GESTURE_EMOJI[g.type]}</div>
              <div className="gi-text"><b>{g.users?.display_name ?? '?'}</b> t'a envoyé {GESTURE_LABEL[g.type]}</div>
              <div className="gi-time">{timeAgo(g.created_at)}</div>
            </div>
          ))}
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Prochains collectifs</div>
          {[
            { e:'🌬️', t:'Silence partagé',     d:'Ce soir 21h',    n:14 },
            { e:'🌱',  t:'Semaine Racines',     d:'Lun. – 7 jours', n:8  },
            { e:'🍃',  t:"5 min d'étirements", d:'Demain 7h30',    n:5  },
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9, padding:'8px 10px', background:'rgba(255,255,255,0.05)', borderRadius:10, border:'1px solid var(--border2)' }}>
              <span style={{ fontSize:15 }}>{r.e}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{r.t}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{r.d} · {r.n} pers.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

/* ─────────────────────────────────────────
   JOURNAL COMPOSER
───────────────────────────────────────── */
function JournalComposer({ userId, plantId, onSaved }) {
  const { create } = useJournal(userId)
  const [text, setText]         = useState('')
  const [zones, setZones]       = useState([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const ZONE_LABELS = ['Racines','Tige','Feuilles','Fleurs','Souffle']

  function toggleZone(z) {
    setZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z])
  }

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const entry = await create(plantId ?? null, text.trim(), zones)
      onSaved?.(entry)
      setText(''); setZones([])
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="journal-composer">
      <textarea
        className="jc-textarea"
        placeholder="Comment s'est passée votre journée ? Qu'avez-vous remarqué en vous ?"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="jc-zones">
        {ZONE_LABELS.map(z => (
          <div key={z} className={'jc-zone' + (zones.includes(z) ? ' selected' : '')} onClick={() => toggleZone(z)}>
            {z}
          </div>
        ))}
      </div>
      <div className="jc-foot">
        <span className="jc-hint">{text.length > 0 ? `${text.length} caractères` : 'Votre journal est privé par défaut'}</span>
        <button className="jc-save" disabled={!text.trim() || saving} onClick={handleSave}>
          {saved ? '✓ Sauvegardé' : saving ? '…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 2 — MON JARDIN
───────────────────────────────────────── */
function ScreenMonJardin({ userId, openCreate, onCreateClose }) {
  const { todayPlant, history, weekGrid, stats, todayRituals, isLoading, error, completeRitual } = usePlant(userId)
  const { settings, toggle } = usePrivacy(userId)
  const { entries } = useJournal(userId)

  const PRIVACY_FIELDS = [
    { field:'show_health',       icon:'💚', label:'Vitalité globale' },
    { field:'show_rituals',      icon:'🌿', label:'Rituels complétés' },
    { field:'show_zone_scores',  icon:'📊', label:'Scores par zone' },
    { field:'show_quiz_answers', icon:'📝', label:'Réponses au quiz' },
    { field:'show_journal',      icon:'📓', label:'Journal personnel' },
  ]

  const doneIds = new Set(todayRituals.map(r => RITUAL_CATALOG.find(c => c.name === r.name)?.id))

  if (isLoading) return (
    <div className="mj-layout" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:13, color:'var(--text3)', letterSpacing:'.1em' }}>Votre jardin se réveille…</div>
    </div>
  )

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())

  return (
    <div className="mj-layout">
      <div className="mj-left">
        <div className="plant-hero">
          <div className="ph-glow" />
          <div className="ph-plant"><PlantSVG health={todayPlant?.health ?? 50} w={90} h={100} /></div>
          <div className="ph-info">
            <div className="ph-health">{todayPlant?.health ?? '—'} <span>%</span></div>
            <div className="ph-label">Vitalité · {todayLabel}</div>
            <div className="ph-zones">
              {ZONES.map(z => {
                const val = todayPlant?.[z.key] ?? 50
                return (
                  <div key={z.key} className="ph-zone-row">
                    <div className="pzr-icon">{z.icon}</div>
                    <div className="pzr-name">{z.name}</div>
                    <div className="pzr-bar"><div className="pzr-fill" style={{ width:`${val}%`, background:z.color+'99' }} /></div>
                    <div className="pzr-val">{val}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="slabel">Rituels du jour</div>
        <div className="ritual-grid">
          {RITUAL_CATALOG.map(r => {
            const done = doneIds.has(r.id)
            return (
              <div key={r.id}
                className={'ritual-btn ' + (r.delta > 0 ? 'positive' : 'negative') + (done ? ' done' : '')}
                onClick={() => !done && completeRitual(r.id)}
              >
                <span className="rb-emoji">{done ? '✅' : r.emoji}</span>
                <span className="rb-name">{r.name}</span>
                <span className={'rb-delta ' + (r.delta > 0 ? 'pos' : 'neg')}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>
              </div>
            )
          })}
        </div>

        <div className="history-chart">
          <div className="hc-header">
            <div className="hc-title">Évolution sur 7 jours</div>
            <div className="hc-period">
              {history.length >= 2
                ? `${history[0]?.date?.slice(5).replace('-','/')} – ${history.at(-1)?.date?.slice(5).replace('-','/')}`
                : '7 derniers jours'}
            </div>
          </div>
          <div className="hc-graph">
            {history.map((d, i) => {
              const isToday = d.date === today
              const lbl = new Date(d.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,1).toUpperCase()
              return (
                <div key={i} className="hc-bar-wrap">
                  <div className={'hc-bar' + (isToday ? ' today' : '')} style={{ height:`${d.health}%` }} />
                  <div className="hc-day">{lbl}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="slabel">Rituels cette semaine</div>
        <div className="week-grid">
          {weekGrid.map((d, i) => (
            <div key={i} className="wday">
              <div className={'wd-dot ' + d.status + (d.isToday ? ' today' : '')}>{d.count||'–'}</div>
              <div className="wd-label">{d.label}</div>
            </div>
          ))}
        </div>

        <div className="slabel">Journal personnel</div>
        <JournalComposer userId={userId} plantId={todayPlant?.id} onSaved={entry => {}} />
        {entries.map(e => (
          <div key={e.id} className="journal-entry">
            <div className="je-date">{formatDate(e.created_at)}</div>
            <div className="je-text">"{e.content}"</div>
            <div className="je-rituals">{(e.zone_tags??[]).map(t => <div key={t} className="je-tag">{t}</div>)}</div>
          </div>
        ))}
      </div>

      <div className="mj-right">
        <div className="slabel">Confidentialité</div>
        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, marginBottom:10 }}>
          Ce que vos cercles peuvent voir de vous.
        </div>
        {PRIVACY_FIELDS.map(p => (
          <div key={p.field} className="privacy-item">
            <div className="priv-icon">{p.icon}</div>
            <div className="priv-label">{p.label}</div>
            <div className={'priv-toggle ' + (settings?.[p.field] ? 'on' : 'off')} onClick={() => toggle(p.field)}>
              <div className="pt-knob" />
            </div>
          </div>
        ))}

        <div className="slabel" style={{ marginTop:8 }}>Statistiques</div>
        {[
          { label:'Jours consécutifs',   val: stats ? `${stats.streak} 🔥` : '—' },
          { label:'Rituels ce mois',     val: stats?.ritualsThisMonth ?? '—'      },
          { label:'Zone la plus active', val: stats?.favoriteZone ?? '—'          },
          { label:'Cercles actifs',      val: '2'                                 },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:12, color:'var(--text2)', fontWeight:300 }}>{s.label}</div>
            <div style={{ fontSize:14, color:'var(--text)', fontFamily:"'Cormorant Garamond',serif" }}>{s.val}</div>
          </div>
        ))}

        <div className="slabel" style={{ marginTop:8 }}>Exporter</div>
        {[
          { label:'Journal PDF',    icon:'📄', action:() => exportPDF(history, entries, user?.display_name ?? user?.email) },
          { label:'Vitalité CSV',   icon:'📊', action:() => exportPlantCSV(history) },
          { label:'Journal CSV',    icon:'📝', action:() => exportJournalCSV(entries) },
        ].map((e, i) => (
          <div key={i}
            onClick={e.action}
            style={{ padding:'9px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text2)', cursor:'pointer', marginBottom:7, display:'flex', alignItems:'center', gap:9, transition:'all .2s' }}
            onMouseEnter={ev => ev.currentTarget.style.background='rgba(255,255,255,0.09)'}
            onMouseLeave={ev => ev.currentTarget.style.background='rgba(255,255,255,0.05)'}
          >
            <span style={{ fontSize:14 }}>{e.icon}</span>{e.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null
  return <div className="toast">{msg}</div>
}

/* ─────────────────────────────────────────
   MODAL CRÉER UN CERCLE
───────────────────────────────────────── */
function CreateCircleModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom du cercle est requis.'); return }
    setLoading(true); setError(null)
    try {
      await onCreate(name.trim(), theme.trim() || 'Bien-être général', isOpen)
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Créer un cercle 🌿</div>
        <div className="modal-field">
          <label className="modal-label">Nom du cercle</label>
          <input className="modal-input" placeholder="ex. Cercle du Matin" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-field">
          <label className="modal-label">Thème (optionnel)</label>
          <input className="modal-input" placeholder="ex. Rituels de réveil & ancrage" value={theme} onChange={e => setTheme(e.target.value)} />
        </div>
        <div className="modal-row">
          <span className="modal-toggle-lbl">Cercle ouvert (rejoignable sans code)</span>
          <div className={'priv-toggle ' + (isOpen ? 'on' : 'off')} onClick={() => setIsOpen(v => !v)}>
            <div className="pt-knob" />
          </div>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? '…' : 'Créer le cercle'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   EXPORT HELPERS
───────────────────────────────────────── */
function downloadCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = filename; a.click(); URL.revokeObjectURL(a.href)
}

function exportPlantCSV(history) {
  downloadCSV((history ?? []).map(p => ({
    Date: p.date,
    'Vitalité (%)': p.health,
    'Racines (%)': p.zone_racines ?? '',
    'Tige (%)': p.zone_tige ?? '',
    'Feuilles (%)': p.zone_feuilles ?? '',
    'Fleurs (%)': p.zone_fleurs ?? '',
    'Souffle (%)': p.zone_souffle ?? '',
  })), `jardin-vitalite-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportJournalCSV(entries) {
  downloadCSV((entries ?? []).map(e => ({
    Date: new Date(e.created_at).toLocaleDateString('fr-FR'),
    Contenu: e.content,
    Zones: (e.zone_tags ?? []).join(' | '),
  })), `jardin-journal-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportPDF(history, entries, userName) {
  const w = window.open('', '_blank')
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const plantRows = (history ?? []).map(p =>
    `<tr><td>${p.date}</td><td>${p.health}%</td><td>${p.zone_racines??'—'}%</td><td>${p.zone_tige??'—'}%</td><td>${p.zone_feuilles??'—'}%</td><td>${p.zone_fleurs??'—'}%</td><td>${p.zone_souffle??'—'}%</td></tr>`
  ).join('')
  const journalRows = (entries ?? []).map(e =>
    `<tr><td>${new Date(e.created_at).toLocaleDateString('fr-FR')}</td><td>${e.content ?? ''}</td><td>${(e.zone_tags??[]).join(', ')}</td></tr>`
  ).join('')
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Mon Jardin Intérieur — Bilan</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,serif;color:#1a1a1a;padding:40px 48px;max-width:860px;margin:0 auto}
h1{font-size:26px;font-weight:300;color:#2d5a27;margin-bottom:4px}
.sub{font-size:12px;color:#888;margin-bottom:28px}
h2{font-size:14px;font-weight:500;color:#2d5a27;border-bottom:1px solid #ddd;padding-bottom:6px;margin:24px 0 12px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f0f7ee;text-align:left;padding:7px 9px;color:#2d5a27;font-weight:500}
td{padding:6px 9px;border-bottom:1px solid #eee;color:#333;vertical-align:top;line-height:1.5}
@media print{body{padding:20px}}
</style></head><body>
<h1>Mon Jardin Intérieur</h1>
<div class="sub">Bilan de ${userName ?? 'votre jardin'} — ${today}</div>
<h2>Historique de vitalité</h2>
<table><thead><tr><th>Date</th><th>Vitalité</th><th>Racines</th><th>Tige</th><th>Feuilles</th><th>Fleurs</th><th>Souffle</th></tr></thead>
<tbody>${plantRows || '<tr><td colspan="7" style="color:#999;font-style:italic">Aucune donnée</td></tr>'}</tbody></table>
<h2>Journal personnel</h2>
<table><thead><tr><th>Date</th><th>Entrée</th><th>Zones</th></tr></thead>
<tbody>${journalRows || '<tr><td colspan="3" style="color:#999;font-style:italic">Aucune entrée</td></tr>'}</tbody></table>
<script>window.onload=()=>window.print()<\/script>
</body></html>`)
  w.document.close()
}

/* ─────────────────────────────────────────
   SCREEN 3 — CERCLES
───────────────────────────────────────── */
function ScreenCercles({ userId, openCreate, onCreateClose }) {
  const { circles, activeCircle, createCircle, joinByCode } = useCircle(userId)
  const [joinCode, setJoinCode]       = useState('')
  const [joinError, setJoinError]     = useState(null)
  const [joinLoading, setJoinLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [toast, setToast]             = useState(null)
  // Topbar "Créer" button also opens the modal
  const isCreateOpen = showCreate || openCreate
  const EMOJIS = ['🌸','🌿','🌾','🌱','🌺','🍃','🌼','🌷','🌻']

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoinLoading(true); setJoinError(null)
    try {
      const circle = await joinByCode(joinCode.trim())
      setJoinCode(''); showToast(`✅ Vous avez rejoint "${circle.name}"`)
    } catch (e) { setJoinError(e.message) }
    finally { setJoinLoading(false) }
  }

  function handleCopyCode(code) {
    navigator.clipboard?.writeText(code ?? '').then(() => {
      setCopied(true); showToast('🌿 Code copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCreate(name, theme, isOpen) {
    const circle = await createCircle(name, theme, isOpen)
    showToast(`🌱 Cercle "${circle.name}" créé !`)
  }

  return (
    <>
      {isCreateOpen && <CreateCircleModal onClose={() => { setShowCreate(false); onCreateClose?.() }} onCreate={handleCreate} />}
      <Toast msg={toast} />
      <div className="content">
        <div className="col" style={{ flex:1 }}>
          <div className="slabel">Mes cercles · {circles.length} actifs</div>
          <div className="circles-grid">
            {circles.map(c => (
              <div key={c.id} className={'circle-card-big' + (c.id===activeCircle?.id ? ' active-circle' : '')}>
                <div className="ccb-top">
                  <div className="ccb-name">{c.name}</div>
                  <div className={'ccb-badge ' + (c.isAdmin ? 'admin' : 'member')}>{c.isAdmin?'Admin':'Membre'}</div>
                </div>
                <div className="ccb-theme">{c.theme}</div>
                <div className="ccb-members">
                  {EMOJIS.slice(0, c.memberCount).map((e,i) => <div key={i} className="ccb-member-av">{e}</div>)}
                  <div className="ccb-member-count">{c.memberCount} membres</div>
                </div>
                <div className="ccb-stats">
                  <div className="ccbs-item"><div className="ccbs-val">—</div><div className="ccbs-lbl">rituels ce mois</div></div>
                  <div className="ccbs-item">
                    <div className="ccbs-val">{Math.floor((Date.now()-new Date(c.created_at??Date.now()))/86400000)}</div>
                    <div className="ccbs-lbl">jours ensemble</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="create-circle-card" onClick={() => setShowCreate(true)}>
              <div className="ccc-icon">＋</div>
              <div className="ccc-text">Créer un cercle</div>
            </div>
          </div>

          {activeCircle && (
            <>
              <div className="slabel" style={{ marginTop:4 }}>Détail — {activeCircle.name}</div>
              <div className="circle-detail">
                <div className="cd-header">
                  <div className="cd-title">{activeCircle.name} · {activeCircle.isAdmin?'Admin':'Membre'}</div>
                  <div className="cd-meta">{activeCircle.memberCount} membres · {activeCircle.theme}</div>
                </div>
                <div className="cd-body">
                  {activeCircle.isAdmin && (
                    <>
                      <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>Code d'invitation</div>
                      <div className="cd-invite">
                        <div className="cdi-code">{activeCircle.invite_code??'——'}</div>
                        <div className="cdi-copy" onClick={() => handleCopyCode(activeCircle.invite_code)}>
                          {copied ? '✓ Copié' : 'Copier'}
                        </div>
                      </div>
                      <div style={{ height:1, background:'var(--border2)', margin:'8px 0' }} />
                    </>
                  )}
                  {[
                    { l:'Thème',      v: activeCircle.theme??'—' },
                    { l:'Visibilité', v: activeCircle.is_open?'Public':'Sur invitation' },
                    { l:'Capacité',   v: `${activeCircle.memberCount}/${activeCircle.max_members??8}` },
                  ].map((s,i) => (
                    <div key={i} className="cd-setting">
                      <div className="cds-label">{s.l}</div>
                      <div className="cds-val">{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rpanel">
          <div className="rp-section">
            <div className="rp-slabel">Rejoindre via code</div>
            <div style={{ display:'flex', gap:7, marginBottom:6 }}>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="CODE…"
                style={{ flex:1, padding:'9px 13px', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text2)', letterSpacing:'.1em', outline:'none' }}
              />
              <div
                onClick={handleJoin}
                style={{ padding:'9px 16px', background: joinLoading?'transparent':'var(--green2)', border:'1px solid var(--greenT)', borderRadius:10, fontSize:14, color:'#c8f0b8', cursor:'pointer', opacity: joinLoading?.6:1, transition:'all .2s' }}
              >{joinLoading ? '…' : '→'}</div>
            </div>
            {joinError && <div style={{ fontSize:10, color:'rgba(210,110,110,.85)', marginBottom:12, padding:'6px 10px', background:'rgba(210,110,110,.07)', borderRadius:8, border:'1px solid rgba(210,110,110,.2)' }}>{joinError}</div>}

            <div className="rp-slabel" style={{ marginTop:14 }}>Découvrir</div>
            {[
              { e:'🌙', n:'Rituels du Soir',  m:5, theme:'Décompression & sommeil', open:true  },
              { e:'🧘', n:'Mindful & Souffle', m:7, theme:'Méditation profonde',    open:false },
              { e:'🌿', n:'Nature & Corps',    m:4, theme:'Plein air & mouvement',  open:true  },
            ].map((c, i) => (
              <div key={i} style={{ marginBottom:11, padding:'11px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                  <span style={{ fontSize:17 }}>{c.e}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'var(--text)' }}>{c.n}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{c.theme}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{c.m} membres</div>
                  {c.open
                    ? <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--greenT)', color:'#c8f0b8', background:'var(--green3)', cursor:'pointer' }}>Rejoindre</div>
                    : <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--border)', color:'var(--text3)' }}>Sur invitation</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────
   SCREEN 4 — DÉFIS
───────────────────────────────────────── */
const DEFIS_DATA = [
  { e:'🌬️', t:'7 jours de silence matinal',  zone:'Souffle',  dur:'7 jours',  desc:"5 min de silence conscient chaque matin, avant tout écran.",    p:1847, joined:true,  fill:72, color:'#88b8e8' },
  { e:'🌱',  t:'Semaine Racines',              zone:'Racines',  dur:'7 jours',  desc:'Centrage quotidien, repas conscient, coucher avant minuit.',     p:934,  joined:false, fill:45, color:'#96d485' },
  { e:'💧',  t:'21 jours de gratitude',        zone:'Feuilles', dur:'21 jours', desc:'3 nouvelles gratitudes spécifiques chaque soir.',               p:3201, joined:false, fill:58, color:'#90d890' },
  { e:'🌸',  t:'Mois sans réseaux le matin',   zone:'Souffle',  dur:'30 jours', desc:"Pas de réseaux sociaux dans la première heure du matin.",       p:612,  joined:true,  fill:81, color:'#e088a8' },
  { e:'🧘',  t:'14 jours de respiration',      zone:'Tige',     dur:'14 jours', desc:'Cohérence cardiaque 5 min, chaque matin et chaque soir.',       p:1103, joined:false, fill:33, color:'#a8c8a0' },
  { e:'🌙',  t:'Rituel du coucher — 30 jours', zone:'Racines',  dur:'30 jours', desc:'Téléphone coupé à 22h, décompression avant minuit.',           p:788,  joined:false, fill:19, color:'#9898d8' },
]

function ScreenDefis({ userId, openCreate, onCreateClose }) {
  const [cat, setCat] = useState('Tous')
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const filtered = cat === 'Tous' ? DEFIS_DATA : DEFIS_DATA.filter(d => d.zone === cat)

  return (
    <div className="content">
      <div className="col" style={{ flex:1 }}>
        <div className="defi-featured">
          <div className="df-glow" />
          <div className="df-tag">Défi communauté · En cours</div>
          <div className="df-title">30 jours pour se retrouver</div>
          <div className="df-desc">Un rituel par jour, choisi librement dans l'une des 5 zones. Pas de classement. Pas de pression. Juste la régularité et la présence à soi.</div>
          <div className="df-meta">
            <div className="dfm-item"><span>📅</span> 30 jours</div>
            <div className="dfm-item"><span>🌿</span> Toutes zones</div>
            <div className="dfm-item"><span>👥</span> 8 432 participants</div>
          </div>
          <div className="df-progress"><div className="dfp-fill" style={{ width:'61%' }} /></div>
          <div className="df-progress-label"><span>Démarré le 1er fév.</span><span>61% · Jour 18/30</span></div>
          <div className="df-actions">
            <div className="df-join">Je rejoins</div>
            <div className="df-learn">En savoir plus</div>
          </div>
        </div>

        <div className="cat-filter">
          {cats.map(c => <div key={c} className={'cat-btn' + (cat===c ? ' active' : '')} onClick={() => setCat(c)}>{c}</div>)}
        </div>
        <div className="slabel">{cat==='Tous'?'Tous les défis':`Zone ${cat}`} · {filtered.length} disponibles</div>

        <div className="defis-grid">
          {filtered.map((d, i) => (
            <div key={i} className="defi-card">
              <div className="dc-top">
                <div className="dc-emoji">{d.e}</div>
                <div className="dc-info">
                  <div className="dc-title">{d.t}</div>
                  <div className="dc-zone">{d.zone}</div>
                </div>
                <div className="dc-dur">{d.dur}</div>
              </div>
              <div className="dc-desc">{d.desc}</div>
              <div className="dc-foot">
                <div className="dc-participants">{d.p.toLocaleString()} pers.</div>
                <div className="dc-bar"><div className="dc-bar-fill" style={{ width:`${d.fill}%`, background:d.color+'88' }} /></div>
                {d.joined ? <div className="dc-joined">✓ En cours</div> : <div className="dc-join-btn">Rejoindre</div>}
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Mes défis actifs</div>
          {DEFIS_DATA.filter(d => d.joined).map((d, i) => (
            <div key={i} style={{ marginBottom:11, padding:'11px 13px', background:'var(--green3)', border:'1px solid rgba(150,212,133,0.18)', borderRadius:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <span style={{ fontSize:17 }}>{d.e}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{d.t}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{d.zone} · {d.dur}</div>
                </div>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.09)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${d.fill}%`, background:d.color+'aa', borderRadius:100 }} />
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:5, display:'flex', justifyContent:'space-between' }}>
                <span>Progression</span><span>{d.fill}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rp-section" style={{ marginTop:10 }}>
          <div className="rp-slabel">Pouls de la communauté</div>
          <div className="community-pulse">
            <div className="cp-title">Ce dimanche dans Mon Jardin</div>
            {[
              { icon:'🌿', val:'12 483', lbl:'jardins actifs' },
              { icon:'✅', val:'47 291', lbl:'rituels complétés' },
              { icon:'💧', val:'8 904',  lbl:'gestes de soin' },
              { icon:'✨', val:'341',    lbl:'nouveaux défis' },
            ].map((s, i) => (
              <div key={i} className="cp-stat">
                <div className="cps-icon">{s.icon}</div>
                <div className="cps-info">
                  <div className="cps-val">{s.val}</div>
                  <div className="cps-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN APP
───────────────────────────────────────── */
const SCREENS = [
  { id:'cercle',  icon:'🏠', label:'Cercle',     badge:null, Component:ScreenCercle    },
  { id:'jardin',  icon:'🌿', label:'Mon Jardin', badge:null, Component:ScreenMonJardin },
  { id:'cercles', icon:'👥', label:'Cercles',    badge:'3',  Component:ScreenCercles   },
  { id:'defis',   icon:'✨', label:'Défis',      badge:'2',  Component:ScreenDefis     },
]

export default function DashboardPage() {
  const [active, setActive] = useState('cercle')
  const { user, signOut } = useAuth()
  const { todayPlant } = usePlant(user?.id)

  const { Component } = SCREENS.find(s => s.id === active)

  const [showCreateCircle, setShowCreateCircle] = useState(false)

  const topbar = {
    cercle:  { title:<>Cercle <em>du Matin</em></>,   sub:`6 membres · ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'})}`, btn:'+ Inviter', onBtn: null },
    jardin:  { title:<>Mon <em>Jardin</em></>,         sub:`${todayPlant?.health??'—'}% · 12 jours consécutifs`, btn:null },
    cercles: { title:<>Mes <em>Cercles</em></>,        sub:'3 actifs · 13 membres au total',   btn:'+ Créer',    onBtn: () => setShowCreateCircle(true) },
    defis:   { title:<>Défis & <em>Challenges</em></>, sub:'2 en cours · 8 432 participants',  btn:'Proposer',   onBtn: null },
  }[active]

  return (
    <div className="root">
      <style>{css}</style>
      <div className="app-layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sb-logo">Mon <em>Jardin</em><br />Intérieur</div>
          <div className="sb-section" style={{ marginBottom:4 }}>Navigation</div>
          {SCREENS.map(s => (
            <div key={s.id} className={'sb-item' + (active===s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
              <span className="sb-icon">{s.icon}</span>
              {s.label}
              {s.badge && <div className="sb-badge">{s.badge}</div>}
            </div>
          ))}
          <div className="sb-divider" />
          <div className="sb-plant-card" onClick={() => setActive('jardin')}>
            <span className="spc-emoji">🌸</span>
            <div className="spc-val">{todayPlant?.health??'—'}%</div>
            <div className="spc-label">Mon jardin · aujourd'hui</div>
          </div>
          <div className="sb-footer">
            {user?.display_name ?? user?.email ?? 'Jardinier'}<br />
            Niveau 2 · 18 rituels / semaine
            <div className="sb-logout" onClick={signOut}>
              <span>⎋</span> Se déconnecter
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="tb-title">{topbar.title}</div>
            <div className="tb-subtitle">{topbar.sub}</div>
            <div style={{ flex:1 }} />
            <div className="tb-btn ghost" style={{ marginRight:5 }}>Aide</div>
            {topbar.btn && <div className="tb-btn" onClick={topbar.onBtn ?? undefined}>{topbar.btn}</div>}
            <div className="tb-notif">🔔<div className="notif-dot" /></div>
          </div>
          <Component userId={user?.id} openCreate={showCreateCircle} onCreateClose={() => setShowCreateCircle(false)} />
        </div>
      </div>
    </div>
  )
}
