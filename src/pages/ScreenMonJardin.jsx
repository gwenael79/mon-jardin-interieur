// ─────────────────────────────────────────────────────────────────────────────
//  ScreenMonJardin.jsx  —  Écran "Ma Fleur"
//  Contient : PlantSVG, GardenSettingsModal, rituels, journal, ScreenMonJardin
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../core/supabaseClient'
import { logActivity } from '../utils/logActivity'
import { logNetworkActivity } from '../utils/logNetworkActivity'
import { usePlant }   from '../hooks/usePlant'
import { usePrivacy } from '../hooks/usePrivacy'
import { useJournal } from '../hooks/useJournal'
import { useIsMobile, LumenBadge, LumensCard, useProfile, AIInsightBlock } from './dashboardShared'
import { ExerciseDetail, useRituels, PLANT_RITUALS_EMPTY } from './mafleur_rituels'

const DEFAULT_GARDEN_SETTINGS = {
  sunriseH: 7, sunriseM: 0,
  sunsetH: 20, sunsetM: 0,
  petalColor1: 'var(--zone-flowers)',
  petalColor2: 'var(--zone-flowers)',
  petalShape: 'round',
}

/* ─────────────────────────────────────────
   MODAL RÉGLAGES JARDIN
───────────────────────────────────────── */
/* ── Badge niveau — composant séparé pour éviter hook dans .map() ── */
function LevelBadge({ lv, label, badge, unlockInfo, colorU, bgU, bdU, unlocked, isCurrent, isPast, onOpen }) {
  const [tooltip, setTooltip] = useState(false)

  // Couleurs selon état : actif, passé (grisé), verrouillé
  const bg  = isPast ? 'var(--surface-1)' : unlocked ? bgU  : 'var(--surface-2)'
  const bd  = isPast ? 'var(--surface-2)' : unlocked ? bdU  : 'var(--surface-3)'
  const col = isPast ? 'var(--separator)' : unlocked ? colorU : 'var(--separator)'
  const op  = isPast ? 0.35 : unlocked ? 1 : 0.65

  return (
    <div style={{ position:'relative', display:'inline-flex' }}>
      <div
        onClick={() => unlocked ? onOpen() : setTooltip(t => !t)}
        style={{
          display:'inline-flex', flexDirection:'row', alignItems:'center', gap:4,
          padding:'5px 12px 5px 8px', borderRadius:20, cursor: unlocked ? 'pointer' : 'default',
          background: bg, border: `1px solid ${bd}`,
          transition:'all .2s', opacity: op, userSelect:'none',
          boxShadow: isCurrent ? `0 0 0 2px ${colorU}55` : 'none',
          whiteSpace:'nowrap',
        }}
        onMouseEnter={e => { if (unlocked && !isPast) e.currentTarget.style.background = bgU.replace('0.14','0.24') }}
        onMouseLeave={e => { e.currentTarget.style.background = bg }}
      >
        <span style={{ fontSize:'var(--fs-h4, 13px)', position:'relative', lineHeight:1 }}>
          {isPast ? <span style={{ filter:'grayscale(1)', opacity:0.4 }}>{badge}</span> : badge}
          {!unlocked && <span style={{ position:'absolute', top:-2, right:-4, fontSize:'var(--fs-h5, 6px)' }}>🔒</span>}
        </span>
        <span style={{ fontSize:'var(--fs-h5, 11px)', color: col, fontWeight: isCurrent ? 600 : 400, letterSpacing:'.03em' }}>{label}</span>
      </div>

      {tooltip && !unlocked && (
        <div
          onClick={() => setTooltip(false)}
          style={{
            position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
            width:164, padding:'9px 11px', borderRadius:10, zIndex:50,
            background:'var(--overlay-dark)', border:'1px solid rgba(var(--gold-rgb),0.35)',
            boxShadow:'0 4px 20px var(--overlay)',
            fontSize:'var(--fs-h5, 9px)', color:'var(--gold)', lineHeight:1.6, textAlign:'center',
          }}>
          🔒 {unlockInfo}
          <div style={{
            position:'absolute', bottom:-5, left:'50%',
            width:8, height:8, background:'var(--overlay-dark)',
            border:'1px solid rgba(var(--gold-rgb),0.35)', borderTop:'none', borderLeft:'none',
            transform:'translateX(-50%) rotate(45deg)',
          }}/>
        </div>
      )}
    </div>
  )
}

/* ── Données de tous les niveaux ── */
const ALL_COLORS = [
  // Niveau 1 — teintes douces et classiques (4 couleurs)
  { c1:'var(--zone-flowers)', c2:'var(--zone-flowers)', name:'Rose',      lvl:1 },
  { c1:'var(--lumens)', c2:'var(--lumens)', name:'Lilas',     lvl:1 },
  { c1:'#e89038', c2:'var(--gold)', name:'Soleil',    lvl:1 },
  { c1:'#48c878', c2:'#88e8a8', name:'Émeraude',  lvl:1 },
  // Niveau 2 — teintes vives et saturées (4 nouvelles couleurs)
  { c1:'#e83030', c2:'#f87060', name:'Écarlate',  lvl:2 },
  { c1:'#1890d8', c2:'#50c8f8', name:'Océan',     lvl:2 },
  { c1:'#c020a0', c2:'#e060d0', name:'Magenta',   lvl:2 },
  { c1:'#208850', c2:'#40c880', name:'Jungle',    lvl:2 },
  // Niveau 3 — teintes rares et précieuses (7 nouvelles couleurs)
  { c1:'#b89010', c2:'var(--gold)', name:'Or',        lvl:3 },
  { c1:'#101888', c2:'#3848d8', name:'Saphir',    lvl:3 },
  { c1:'#601060', c2:'#a040a0', name:'Améthyste', lvl:3 },
  { c1:'#108088', c2:'#30c0c8', name:'Turquoise', lvl:3 },
  { c1:'#a03010', c2:'#e06830', name:'Terracotta',lvl:3 },
  { c1:'#607010', c2:'#a0c020', name:'Olive',     lvl:3 },
  { c1:'#181818', c2:'#484858', name:'Nuit',      lvl:3 },
]

const ALL_SHAPES = [
  // Niveau 1 — formes classiques (3)
  { id:'round',         label:'Ronde',       icon:'⬤',  desc:'Pétales ovales doux',            lvl:1 },
  { id:'wide',          label:'Large',       icon:'◈',  desc:'Pétales étalés et amples',        lvl:1 },
  { id:'pointed',       label:'Étoilée',     icon:'✦',  desc:'Pétales effilés en pointe',       lvl:1 },
  // Niveau 2 — paths custom (2)
  { id:'tulip',         label:'Tulipe',      icon:'🌷', desc:'3+3 pétales hauts et fermés',     lvl:2 },
  { id:'daisy',         label:'Marguerite',  icon:'🌼', desc:'14 pétales fins en spatule',      lvl:2 },
  // Niveau 3 — botanique avancée (5)
  { id:'orchid',        label:'Orchidée',    icon:'🪷', desc:'Labelle + sépales asymétriques',  lvl:3 },
  { id:'cactus',        label:'Cactus',      icon:'🌵', desc:'12 pétales dentelés étalés',      lvl:3 },
  { id:'passionflower', label:'Passiflore',  icon:'🌀', desc:'Corona à 40 filaments',           lvl:3 },
  { id:'iris',          label:'Iris',        icon:'💜', desc:'Standards + falls + barbe',       lvl:3 },
  { id:'anemone',       label:'Anémone',     icon:'🖤', desc:'8 pétales + 80 étamines noires',  lvl:3 },
]

const LEVEL_META = {
  1: { label:'Niveau 1', color:'var(--green)', bg:'rgba(var(--green-rgb),0.12)', border:'rgba(var(--green-rgb),0.25)', badge:'🌱' },
  2: { label:'Niveau 2', color:'var(--zone-breath)', bg:'rgba(var(--zone-breath-rgb),0.12)', border:'rgba(var(--zone-stem-rgb),0.25)', badge:'🌿' },
  3: { label:'Niveau 3', color:'var(--gold)', bg:'rgba(var(--gold-rgb),0.12)', border:'rgba(var(--gold-rgb),0.25)', badge:'🌟' },
}

function AccordionSection({ title, icon, isOpen, onToggle, children, accent }) {
  return (
    <div style={{ borderRadius:12, overflow:'hidden', marginBottom:6, border:`1px solid ${isOpen ? (accent||'var(--surface-3)') : 'var(--track)'}`, transition:'border-color .2s' }}>
      <div onClick={onToggle} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', cursor:'pointer', userSelect:'none',
        background: isOpen ? 'var(--surface-2)' : 'var(--surface-1)',
        transition:'background .2s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'var(--fs-emoji-sm, 14px)' }}>{icon}</span>
          <span style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', letterSpacing:'.06em' }}>{title}</span>
        </div>
        <span style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--border)', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>▾</span>
      </div>
      {isOpen && (
        <div style={{ padding:'12px 14px', background:'var(--surface-1)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function GardenSettingsModal({ settings, onSave, onClose, level = 1, tier = 1, isAdmin = false }) {
  const [s, setS] = useState({ ...settings })
  const [open, setOpen] = useState('couleurs')
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }))
  const toggle = (key) => setOpen(o => o === key ? null : key)

  const visibleTiers = isAdmin ? [1, 2, 3] : [tier]
  const meta = LEVEL_META[Math.min(tier, 3)] ?? LEVEL_META[1]

  // Résumé de la sélection active
  const activeColor = ALL_COLORS.find(c => c.c1 === s.petalColor1)
  const activeShape = ALL_SHAPES.find(sh => sh.id === s.petalShape)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width:420, maxWidth:'96vw', padding:'16px' }}>

        {/* En-tête compact */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--text2)', fontWeight:400, letterSpacing:'.04em' }}>🌸 Ma fleur</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20,
              background: meta.bg, border: `1px solid ${meta.border}`,
            }}>
              <span style={{ fontSize:'var(--fs-h5, 11px)' }}>{meta.badge}</span>
              <span style={{ fontSize:'var(--fs-h5, 9px)', color: meta.color }}>{isAdmin ? '⚙ Admin' : meta.label}</span>
            </div>
            <div onClick={onClose} style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'var(--surface-2)', color:'rgba(var(--ritual-modal-text-rgb),0.45)', fontSize:'var(--fs-h5, 12px)' }}>✕</div>
          </div>
        </div>

        {/* ── ACCORDÉON COULEURS ── */}
        <AccordionSection
          title={`Couleur${activeColor ? ` — ${activeColor.name}` : ''}`}
          icon="🎨"
          isOpen={open === 'couleurs'}
          onToggle={() => toggle('couleurs')}
          accent={meta.border}
        >
          {visibleTiers.map(lv => {
            const lvColors = ALL_COLORS.filter(c => c.lvl === lv)
            const lm = LEVEL_META[lv]
            return (
              <div key={lv} style={{ marginBottom: lv < visibleTiers.at(-1) ? 10 : 0 }}>
                {isAdmin && <div style={{ fontSize:'var(--fs-h5, 8px)', color: lm.color, marginBottom:6, letterSpacing:'.08em' }}>{lm.badge} {lm.label}</div>}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {lvColors.map(p => {
                    const active = s.petalColor1 === p.c1
                    return (
                      <div key={p.name} title={p.name}
                        onClick={() => { set('petalColor1', p.c1); set('petalColor2', p.c2) }}
                        style={{
                          width:34, height:34, borderRadius:'50%', cursor:'pointer',
                          background: `linear-gradient(135deg,${p.c1},${p.c2})`,
                          border: active ? '2px solid var(--badge-lvl1)' : '2px solid var(--surface-3)',
                          boxShadow: active ? '0 0 0 3px rgba(var(--green-rgb),0.35)' : 'none',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all .15s', flexShrink:0,
                        }}>
                        {active && <span style={{ fontSize:'var(--fs-h4, 13px)', color:'white', textShadow:'0 1px 3px var(--overlay)' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </AccordionSection>

        {/* ── ACCORDÉON FORMES ── */}
        <AccordionSection
          title={`Forme${activeShape ? ` — ${activeShape.label}` : ''}`}
          icon="✦"
          isOpen={open === 'formes'}
          onToggle={() => toggle('formes')}
          accent={meta.border}
        >
          {visibleTiers.map(lv => {
            const lvShapes = ALL_SHAPES.filter(sh => sh.lvl === lv)
            const lm = LEVEL_META[lv]
            return (
              <div key={lv} style={{ marginBottom: lv < visibleTiers.at(-1) ? 10 : 0 }}>
                {isAdmin && <div style={{ fontSize:'var(--fs-h5, 8px)', color: lm.color, marginBottom:6, letterSpacing:'.08em' }}>{lm.badge} {lm.label}</div>}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {lvShapes.map(ps => {
                    const active = s.petalShape === ps.id
                    return (
                      <div key={ps.id} title={ps.desc}
                        onClick={() => set('petalShape', ps.id)}
                        style={{
                          minWidth:60, padding:'7px 8px', borderRadius:10, textAlign:'center', cursor:'pointer',
                          border: active ? '1px solid var(--greenT)' : '1px solid var(--surface-3)',
                          background: active ? 'var(--green2)' : 'var(--surface-1)',
                          transition:'all .15s',
                        }}>
                        <div style={{ fontSize:'var(--fs-emoji-sm, 15px)', marginBottom:2 }}>{ps.icon}</div>
                        <div style={{ fontSize:'var(--fs-h5, 8px)', color: active ? 'var(--badge-lvl1)' : 'var(--text2)' }}>{ps.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </AccordionSection>

        {/* ── ACCORDÉON SOLEIL ── */}
        <AccordionSection
          title={`Soleil — lever ${s.sunriseH}h${String(s.sunriseM).padStart(2,'0')} · coucher ${s.sunsetH}h${String(s.sunsetM).padStart(2,'0')}`}
          icon="☀️"
          isOpen={open === 'soleil'}
          onToggle={() => toggle('soleil')}
        >
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', marginBottom:5 }}>🌅 Lever</div>
              <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                <input type="number" min={4} max={11} value={s.sunriseH} onChange={e => set('sunriseH',+e.target.value)} className="modal-input" style={{ width:48, textAlign:'center', padding:'6px 4px' }}/>
                <span style={{ color:'var(--text3)', fontSize:'var(--fs-h5, 10px)' }}>h</span>
                <input type="number" min={0} max={59} value={s.sunriseM} onChange={e => set('sunriseM',+e.target.value)} className="modal-input" style={{ width:48, textAlign:'center', padding:'6px 4px' }}/>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', marginBottom:5 }}>🌇 Coucher</div>
              <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                <input type="number" min={15} max={23} value={s.sunsetH} onChange={e => set('sunsetH',+e.target.value)} className="modal-input" style={{ width:48, textAlign:'center', padding:'6px 4px' }}/>
                <span style={{ color:'var(--text3)', fontSize:'var(--fs-h5, 10px)' }}>h</span>
                <input type="number" min={0} max={59} value={s.sunsetM} onChange={e => set('sunsetM',+e.target.value)} className="modal-input" style={{ width:48, textAlign:'center', padding:'6px 4px' }}/>
              </div>
            </div>
          </div>
          <div style={{ marginTop:10, position:'relative', height:24 }}>
            <div style={{ position:'absolute', left:0, right:0, top:'50%', height:1, background:'var(--border)' }}/>
            {(() => {
              const now = new Date(); const h = now.getHours() + now.getMinutes()/60
              const rise = s.sunriseH + s.sunriseM/60; const set2 = s.sunsetH + s.sunsetM/60
              const pct = Math.max(0, Math.min(1,(h-rise)/(set2-rise)))
              const isD = h>=rise && h<=set2
              return <>
                <div style={{ position:'absolute', left:'2%', top:'50%', transform:'translateY(-50%)', fontSize:'var(--fs-h5, 8px)', color:'var(--text3)' }}>{s.sunriseH}h{String(s.sunriseM).padStart(2,'0')}</div>
                <div style={{ position:'absolute', right:'2%', top:'50%', transform:'translateY(-50%)', fontSize:'var(--fs-h5, 8px)', color:'var(--text3)' }}>{s.sunsetH}h{String(s.sunsetM).padStart(2,'0')}</div>
                <div style={{ position:'absolute', left:`${pct*76+12}%`, top:'50%', transform:'translate(-50%,-50%)', fontSize:'var(--fs-emoji-sm, 16px)', filter:isD?'none':'grayscale(1) opacity(0.4)' }}>☀️</div>
              </>
            })()}
          </div>
        </AccordionSection>

        {/* Actions — toujours visible */}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button className="modal-cancel" onClick={onClose} style={{ flex:1 }}>Annuler</button>
          <button className="modal-submit" onClick={() => { onSave(s); onClose() }} style={{ flex:2 }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}
let _svgN = 0
function PlantSVG({ health = 5, gardenSettings = DEFAULT_GARDEN_SETTINGS, lumensLevel = 'faible', lumensTotal = 0, compact = false }) {
  const r   = Math.max(0, Math.min(1, (health ?? 5) / 100))
  const gs  = gardenSettings || DEFAULT_GARDEN_SETTINGS
  const W = 400, H = 260, cx = 200, gY = 188   // gY = groundY
  const id  = 'g' + (++_svgN)   // unique prefix per instance, no hooks needed

  /* ── Soleil ── */
  const now   = new Date()
  const nowH  = now.getHours() + now.getMinutes() / 60
  const riseH = (gs.sunriseH || 7)  + (gs.sunriseM || 0) / 60
  const setH  = (gs.sunsetH  || 20) + (gs.sunsetM  || 0) / 60
  const dp    = Math.max(0, Math.min(1, (nowH - riseH) / (setH - riseH)))
  const isDay = nowH >= riseH && nowH <= setH
  const isG   = isDay && (Math.abs(nowH - riseH) < 1.2 || Math.abs(nowH - setH) < 1.2)
  const sunX  = 30 + dp * (W - 60)
  const sunY  = 18 + 58 * (1 - Math.sin(dp * Math.PI))

  /* ── Couleurs pétales personnalisées ── */
  const h2r = h => {
    let hex = h || 'var(--zone-flowers)'
    // Résoudre les CSS variables (ex: 'var(--zone-flowers)' → '#e088a8')
    if (hex.startsWith('var(')) {
      hex = getComputedStyle(document.documentElement)
        .getPropertyValue(hex.slice(4, -1).trim()).trim()
    }
    const v = parseInt(hex.replace('#',''), 16)
    if (isNaN(v)) return [200, 136, 168]  // fallback rose si parsing échoue
    return [(v>>16)&255,(v>>8)&255,v&255]
  }
  const [r1,g1,b1]  = h2r(gs.petalColor1)
  const [r2,g2,b2]  = h2r(gs.petalColor2)
  const pC1   = `rgba(${r1},${g1},${b1},${0.78+0.18*r})`
  const pC2   = `rgba(${r2},${g2},${b2},${0.60+0.28*r})`
  const pInr  = `rgba(${Math.min(255,r2+28)},${Math.min(255,g2+28)},${Math.min(255,b2+28)},${0.45+0.22*r})`
  const pBk1  = `rgba(${Math.round(r1*.72)},${Math.round(g1*.72)},${Math.round(b1*.72)},0.48)`
  const pBk2  = `rgba(${Math.round(r1*.55)},${Math.round(g1*.55)},${Math.round(b1*.55)},0.30)`

  /* ── Forme pétales — 10 formes avec géométries distinctes ── */
  const ps = gs.petalShape || 'round'
  /* ── Système de formes botaniques ─────────────────────────────────────────
     Chaque forme a sa propre fonction de rendu qui retourne du JSX SVG.
     renderPetal(cx,cy,angle,scale,fillUrl,blurUrl) → <path|ellipse|g>
     
     Coordonnées locales : pétale centré en 0,0 pointant vers le haut (270°),
     puis rotate(angle) positionne autour du cœur.

     NIVEAU 1 : round, wide, pointed  (ellipses classiques)
     NIVEAU 2 : tulip, daisy          (paths custom)
     NIVEAU 3 : orchid, cactus, passionflower, iris, anemone  (paths avancés)
  ─────────────────────────────────────────────────────────────────────────── */

  // Taille globale de la fleur selon la santé
  const fS = 7 + 12 * r   // flower size base

  // Générateur de pétale : path SVG en coordonnées locales (0,0 = base, pointe vers -Y)
  const petalPath = (w, h, curve=0.3) => {
    // Bézier cubique symétrique : base large, pointe en haut
    const hw = w/2
    return `M 0,0 C ${-hw},${-h*curve} ${-hw*0.6},${-h*0.85} 0,${-h} C ${hw*0.6},${-h*0.85} ${hw},${-h*curve} 0,0`
  }
  // Pétale pointu : pointe effilée
  const pointedPath = (w, h) => {
    const hw = w/2
    return `M 0,0 C ${-hw},${-h*0.25} ${-hw*0.4},${-h*0.7} 0,${-h} C ${hw*0.4},${-h*0.7} ${hw},${-h*0.25} 0,0`
  }
  // Pétale tulipe : haut arrondi, bords légèrement recourbés vers l'intérieur
  const tulipPath = (w, h) => {
    const hw = w/2
    return `M 0,0 C ${-hw*1.1},${-h*0.2} ${-hw*1.15},${-h*0.65} ${-hw*0.7},${-h*0.85} C ${-hw*0.3},${-h} ${hw*0.3},${-h} ${hw*0.7},${-h*0.85} C ${hw*1.15},${-h*0.65} ${hw*1.1},${-h*0.2} 0,0 Z`
  }
  // Pétale marguerite : fin, long, spatule au bout
  const daisyPath = (w, h) => {
    const hw = w/2
    return `M 0,0 C ${-hw*0.8},${-h*0.15} ${-hw},${-h*0.6} ${-hw*0.85},${-h*0.82} C ${-hw*1.1},${-h*0.88} ${-hw*0.9},${-h} 0,${-h} C ${hw*0.9},${-h} ${hw*1.1},${-h*0.88} ${hw*0.85},${-h*0.82} C ${hw},${-h*0.6} ${hw*0.8},${-h*0.15} 0,0 Z`
  }
  // Pétale orchidée : labelle asymétrique avec ondulation latérale
  const orchidPath = (w, h, side=1) => {
    const hw = w/2
    // Pétale principal avec renflement latéral caractéristique de l'orchidée
    return `M 0,0 C ${-hw*0.9},${-h*0.15} ${-hw*1.2*side},${-h*0.45} ${-hw*0.8},${-h*0.75} C ${-hw*0.5},${-h*0.92} ${hw*0.2},${-h} ${hw*0.3},${-h*0.9} C ${hw*1.1},${-h*0.7} ${hw*0.9},${-h*0.3} 0,0 Z`
  }
  // Pétale cactus-flower : bords dentelés, texture structurée
  const cactusPath = (w, h) => {
    const hw = w/2
    // Pétale avec micro-ondulations sur les bords
    return `M 0,0 C ${-hw},${-h*0.1} ${-hw*1.1},${-h*0.3} ${-hw*0.95},${-h*0.5} L ${-hw*1.05},${-h*0.55} L ${-hw*0.85},${-h*0.62} L ${-hw*0.98},${-h*0.7} L ${-hw*0.72},${-h*0.8} C ${-hw*0.4},${-h*0.92} ${hw*0.4},${-h*0.92} ${hw*0.72},${-h*0.8} L ${hw*0.98},${-h*0.7} L ${hw*0.85},${-h*0.62} L ${hw*1.05},${-h*0.55} L ${hw*0.95},${-h*0.5} C ${hw*1.1},${-h*0.3} ${hw},${-h*0.1} 0,0 Z`
  }
  // Pétale passiflore : fil corona + pétale aplati
  const passionPath = (w, h) => {
    const hw = w/2
    return `M 0,0 C ${-hw*1.3},${-h*0.08} ${-hw*1.4},${-h*0.35} ${-hw*1.1},${-h*0.55} C ${-hw*0.85},${-h*0.72} ${-hw*0.4},${-h} 0,${-h} C ${hw*0.4},${-h} ${hw*0.85},${-h*0.72} ${hw*1.1},${-h*0.55} C ${hw*1.4},${-h*0.35} ${hw*1.3},${-h*0.08} 0,0 Z`
  }
  // Pétale iris : forme en chute d'eau avec renflement médian
  const irisPath = (w, h, drooping=false) => {
    const hw = w/2
    if (drooping) {
      // Tepale tombant vers le bas
      return `M 0,0 C ${-hw*0.6},${h*0.1} ${-hw*1.1},${h*0.4} ${-hw*0.9},${h*0.75} C ${-hw*0.6},${h} ${hw*0.6},${h} ${hw*0.9},${h*0.75} C ${hw*1.1},${h*0.4} ${hw*0.6},${h*0.1} 0,0 Z`
    }
    // Tepal érigé vers le haut
    return `M 0,0 C ${-hw*0.7},${-h*0.12} ${-hw*1.2},${-h*0.42} ${-hw*1.0},${-h*0.72} C ${-hw*0.7},${-h*0.9} ${-hw*0.2},${-h} 0,${-h*0.95} C ${hw*0.2},${-h} ${hw*0.7},${-h*0.9} ${hw*1.0},${-h*0.72} C ${hw*1.2},${-h*0.42} ${hw*0.7},${-h*0.12} 0,0 Z`
  }
  // Pétale anémone : rond, avec nervures rayonnantes
  const anemonePath = (w, h) => {
    const hw = w * 0.55
    return `M 0,0 C ${-hw*1.1},${-h*0.05} ${-hw*1.3},${-h*0.5} ${-hw},${-h*0.85} C ${-hw*0.65},${-h} ${hw*0.65},${-h} ${hw},${-h*0.85} C ${hw*1.3},${-h*0.5} ${hw*1.1},${-h*0.05} 0,0 Z`
  }

  /* Render d'un pétale à angle donné autour de (ox,oy)
     pathFn : fonction retournant la string path en coords locales
     d      : distance du centre
     scale  : taille (0-1)
     angle  : degrés
  */
  const R = (deg) => deg * Math.PI / 180
  const renderFlower = (ox, oy, fillUrl, blurUrl, fillUrl2) => {
    const s = fS
    // Fonctions communes
    const petal = (pathStr, angle, dist, scaleX=1, scaleY=1, fill=fillUrl, blur=null, op=1) => {
      const rad = R(angle - 90)
      const px = ox + Math.cos(rad) * dist
      const py = oy + Math.sin(rad) * dist
      return <path d={pathStr}
        transform={`translate(${px},${py}) rotate(${angle})`}
        fill={fill} filter={blur ? `url(#${blur})` : undefined}
        opacity={op}/>
    }

    /* ── NIVEAU 1 : ellipses classiques (rendu original) ── */
    if (ps === 'round') {
      const pRx = 8+14*r, pRy = 9+13*r, pD = 8+11*r
      return <g>
        {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD*0.8, py=oy+Math.sin(rad)*pD*0.8
          return <ellipse key={i} cx={px} cy={py} rx={pRx*0.68} ry={pRy*0.68}
            fill={fillUrl2} transform={"rotate("+String(a+90)+","+px+","+py+")"}
            filter={"url(#"+blurUrl+")"} opacity={0.85}/>
        })}
        {[0,45,90,135,180,225,270,315].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD, py=oy+Math.sin(rad)*pD
          return <ellipse key={i} cx={px} cy={py} rx={pRx} ry={pRy}
            fill={fillUrl} transform={"rotate("+String(a+90)+","+px+","+py+")"}/>
        })}
      </g>
    }
    if (ps === 'wide') {
      const pRx = 6+10*r, pRy = 12+18*r, pD = 8+11*r
      return <g>
        {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD*0.8, py=oy+Math.sin(rad)*pD*0.8
          return <ellipse key={i} cx={px} cy={py} rx={pRx*0.68} ry={pRy*0.68}
            fill={fillUrl2} transform={"rotate("+String(a+90)+","+px+","+py+")"}
            filter={"url(#"+blurUrl+")"} opacity={0.85}/>
        })}
        {[0,45,90,135,180,225,270,315].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD, py=oy+Math.sin(rad)*pD
          return <ellipse key={i} cx={px} cy={py} rx={pRx} ry={pRy}
            fill={fillUrl} transform={"rotate("+String(a+90)+","+px+","+py+")"}/>
        })}
      </g>
    }
    if (ps === 'pointed') {
      const pRx = 4+7*r, pRy = 14+22*r, pD = 8+11*r
      return <g>
        {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD*0.8, py=oy+Math.sin(rad)*pD*0.8
          return <ellipse key={i} cx={px} cy={py} rx={pRx*0.68} ry={pRy*0.68}
            fill={fillUrl2} transform={"rotate("+String(a+90)+","+px+","+py+")"}
            filter={"url(#"+blurUrl+")"} opacity={0.75}/>
        })}
        {[0,45,90,135,180,225,270,315].map((a,i) => {
          const rad=a*Math.PI/180
          const px=ox+Math.cos(rad)*pD, py=oy+Math.sin(rad)*pD
          return <ellipse key={i} cx={px} cy={py} rx={pRx} ry={pRy}
            fill={fillUrl} transform={"rotate("+String(a+90)+","+px+","+py+")"}/>
        })}
      </g>
    }
    /* ──────── NIVEAU 2 ──────── */
    if (ps === 'tulip') {
      const outer = tulipPath(s*1.0, s*2.0)
      const inner = tulipPath(s*0.75, s*1.65)
      return <g>
        {[0,120,240].map((a,i) =>
          <path key={'o'+i} d={outer} transform={`translate(${ox+Math.cos(R(a-90))*s*0.65},${oy+Math.sin(R(a-90))*s*0.65}) rotate(${a})`} fill={fillUrl2} filter={`url(#${blurUrl})`} opacity={0.75}/>
        )}
        {[60,180,300].map((a,i) =>
          <path key={'i'+i} d={inner} transform={`translate(${ox+Math.cos(R(a-90))*s*0.55},${oy+Math.sin(R(a-90))*s*0.55}) rotate(${a})`} fill={fillUrl} opacity={0.9}/>
        )}
        {[0,120,240].map((a,i) =>
          <path key={'f'+i} d={outer} transform={`translate(${ox+Math.cos(R(a-90))*s*0.7},${oy+Math.sin(R(a-90))*s*0.7}) rotate(${a})`} fill={fillUrl}/>
        )}
      </g>
    }
    if (ps === 'daisy') {
      // 14 pétales fins, 2 couches décalées, cœur jaune proéminent
      const path = daisyPath(s*0.42, s*1.85)
      const path2 = daisyPath(s*0.35, s*1.5)
      const angles1 = Array.from({length:7},(_,i)=>i*(360/7))
      const angles2 = Array.from({length:7},(_,i)=>i*(360/7)+360/14)
      return <g>
        {angles2.map((a,i) =>
          <path key={'b'+i} d={path2} transform={`translate(${ox+Math.cos(R(a-90))*s*1.05},${oy+Math.sin(R(a-90))*s*1.05}) rotate(${a})`} fill={fillUrl2} filter={`url(#${blurUrl})`} opacity={0.6}/>
        )}
        {angles1.map((a,i) =>
          <path key={'f'+i} d={path} transform={`translate(${ox+Math.cos(R(a-90))*s*1.1},${oy+Math.sin(R(a-90))*s*1.1}) rotate(${a})`} fill={fillUrl}/>
        )}
      </g>
    }

    /* ──────── NIVEAU 3 ──────── */
    if (ps === 'orchid') {
      const sepal     = pointedPath(s*0.5,  s*2.2)
      const petal     = orchidPath(s*1.4,   s*1.9, 1)
      const petalR    = orchidPath(s*1.4,   s*1.9, -1)
      const labelle   = petalPath(s*1.8,    s*1.4, 0.55)
      const labelleIn = petalPath(s*1.0,    s*0.85, 0.6)
      return <g>
        <path d={sepal} transform={"translate("+ox+","+(oy-s*1.1)+") rotate(0)"}          fill={fillUrl2} filter={"url(#"+blurUrl+")"} opacity={0.72}/>
        <path d={sepal} transform={"translate("+(ox-s*0.9)+","+(oy-s*0.3)+") rotate(-42)"} fill={fillUrl2} filter={"url(#"+blurUrl+")"} opacity={0.72}/>
        <path d={sepal} transform={"translate("+(ox+s*0.9)+","+(oy-s*0.3)+") rotate(42)"}  fill={fillUrl2} filter={"url(#"+blurUrl+")"} opacity={0.72}/>
        <path d={petal}  transform={"translate("+(ox-s*0.6)+","+(oy-s*0.65)+") rotate(-62)"} fill={fillUrl} opacity={0.93}/>
        <path d={petalR} transform={"translate("+(ox+s*0.6)+","+(oy-s*0.65)+") rotate(62)"}  fill={fillUrl} opacity={0.93}/>
        <path d={labelle}   transform={"translate("+ox+","+(oy+s*0.6)+") rotate(180)"} fill={fillUrl} opacity={0.97}/>
        <path d={labelleIn} transform={"translate("+ox+","+(oy+s*0.65)+") rotate(180)"}
          fill={"rgba("+Math.min(255,r2+50)+","+Math.min(255,g2+25)+","+Math.min(255,b2+70)+",0.8)"}/>
        {[-s*0.35,-s*0.18,0,s*0.18,s*0.35].map((dx,i) =>
          <line key={i} x1={ox+dx} y1={oy+s*0.4} x2={ox+dx*0.5} y2={oy+s*1.7}
            stroke={"rgba("+Math.round(r1*0.45)+","+Math.round(g1*0.35)+","+Math.round(b1*0.95)+",0.42)"}
            strokeWidth={0.7} strokeLinecap="round"/>
        )}
        <ellipse cx={ox} cy={oy} rx={s*0.24} ry={s*0.38}
          fill={"rgba("+Math.min(255,r2+65)+","+Math.min(255,g2+45)+","+Math.min(255,b2+85)+",0.92)"}/>
        <ellipse cx={ox} cy={oy-s*0.14} rx={s*0.13} ry={s*0.11} fill="rgba(255,248,220,0.88)"/>
      </g>
    }
        if (ps === 'cactus') {
      // Fleur de cactus : 12 pétales dentelés, très étalés, style Echinocactus
      const path = cactusPath(s*0.85, s*1.55)
      const inner = cactusPath(s*0.6, s*1.1)
      const angles = Array.from({length:12},(_,i)=>i*30)
      const anglesI = Array.from({length:12},(_,i)=>i*30+15)
      return <g>
        {anglesI.map((a,i) =>
          <path key={'i'+i} d={inner} transform={`translate(${ox+Math.cos(R(a-90))*s*0.5},${oy+Math.sin(R(a-90))*s*0.5}) rotate(${a})`} fill={fillUrl2} filter={`url(#${blurUrl})`} opacity={0.7}/>
        )}
        {angles.map((a,i) =>
          <path key={'o'+i} d={path} transform={`translate(${ox+Math.cos(R(a-90))*s*0.85},${oy+Math.sin(R(a-90))*s*0.85}) rotate(${a})`} fill={fillUrl} opacity={0.9}/>
        )}
      </g>
    }
    if (ps === 'passionflower') {
      // Passiflore : 10 pétales aplatis + 40 filaments de corona rayonnants
      const path = passionPath(s*0.7, s*1.4)
      const angles = Array.from({length:10},(_,i)=>i*36)
      const coronaAngles = Array.from({length:40},(_,i)=>i*9)
      return <g>
        {/* Pétales de base */}
        {angles.map((a,i) =>
          <path key={'p'+i} d={path} transform={`translate(${ox+Math.cos(R(a-90))*s*0.7},${oy+Math.sin(R(a-90))*s*0.7}) rotate(${a})`} fill={fillUrl2} opacity={0.75}/>
        )}
        {angles.map((a,i) =>
          <path key={'f'+i} d={path} transform={`translate(${ox+Math.cos(R(a+18-90))*s*0.75},${oy+Math.sin(R(a+18-90))*s*0.75}) rotate(${a+18})`} fill={fillUrl} opacity={0.85}/>
        )}
        {/* Corona : filaments rayonnants bicolores */}
        {coronaAngles.map((a,i) => {
          const rad = R(a)
          const inner2 = s * 0.55
          const outer2 = s * (i%2===0 ? 1.15 : 0.9)
          const midPct = 0.45 + (i%5)*0.04
          const mx = ox + Math.cos(rad) * s * (outer2*midPct)
          const my = oy + Math.sin(rad) * s * (outer2*midPct)
          return <path key={'c'+i}
            d={`M ${ox+Math.cos(rad)*inner2} ${oy+Math.sin(rad)*inner2} Q ${mx} ${my} ${ox+Math.cos(rad)*outer2*s*0.14} ${oy+Math.sin(rad)*outer2*s*0.14}`}
            stroke={i%3===0 ? `rgba(${r2},${g2},${b2},0.85)` : `rgba(${r1},${g1},${b1},0.65)`}
            strokeWidth={i%2===0 ? 1.0 : 0.65} strokeLinecap="round" fill="none"/>
        })}
      </g>
    }
    if (ps === 'iris') {
      const fallW=s*1.55, fallH=s*2.4, standW=s*1.2, standH=s*2.2
      const fallPath  = irisPath(fallW,  fallH,  true)
      const standPath = irisPath(standW, standH, false)
      return <g>
        {[0, 120, 240].map((a,i) => {
          const baseX = ox + Math.cos(R(a)) * s * 0.22
          const baseY = oy + Math.sin(R(a)) * s * 0.22
          return <g key={'f'+i} transform={"translate("+baseX+","+baseY+") rotate("+(a+180)+")"}>
            <path d={fallPath} fill={fillUrl2} opacity={0.90} filter={"url(#"+blurUrl+")"}/>
            <line x1={0} y1={0} x2={0} y2={fallH*0.82}
              stroke={"rgba("+r2+","+g2+","+b2+",0.48)"} strokeWidth={1.1} strokeLinecap="round"/>
            {[fallH*0.15, fallH*0.34, fallH*0.52, fallH*0.68].map((yb,j) =>
              <ellipse key={j} cx={0} cy={yb} rx={fallW*0.15} ry={fallW*0.05} fill="rgba(var(--gold-rgb),0.88)"/>
            )}
          </g>
        })}
        {[60, 180, 300].map((a,i) => {
          const baseX = ox + Math.cos(R(a)) * s * 0.24
          const baseY = oy + Math.sin(R(a)) * s * 0.24
          return <g key={'s'+i} transform={"translate("+baseX+","+baseY+") rotate("+a+")"}>
            <path d={standPath} fill={fillUrl} opacity={0.94}/>
            <line x1={0} y1={0} x2={0} y2={-standH*0.85}
              stroke={"rgba("+r1+","+g1+","+b1+",0.35)"} strokeWidth={0.9} strokeLinecap="round"/>
          </g>
        })}
        <circle cx={ox} cy={oy} r={s*0.32}
          fill={"rgba("+Math.min(255,r2+35)+","+Math.min(255,g2+22)+","+Math.min(255,b2+45)+",0.88)"}/>
      </g>
    }
        if (ps === 'anemone') {
      // Anémone : 8 pétales ronds superposés + 80+ étamines noires
      const path = anemonePath(s*1.0, s*1.3)
      const angles = Array.from({length:8},(_,i)=>i*45)
      const stamenCount = 60
      return <g>
        {/* Pétales arrière légèrement décalés */}
        {angles.map((a,i) =>
          <path key={'b'+i} d={path} transform={`translate(${ox+Math.cos(R(a+22.5-90))*s*0.6},${oy+Math.sin(R(a+22.5-90))*s*0.6}) rotate(${a+22.5})`} fill={fillUrl2} filter={`url(#${blurUrl})`} opacity={0.7}/>
        )}
        {/* Pétales avant */}
        {angles.map((a,i) =>
          <path key={'f'+i} d={path} transform={`translate(${ox+Math.cos(R(a-90))*s*0.62},${oy+Math.sin(R(a-90))*s*0.62}) rotate(${a})`} fill={fillUrl} opacity={0.88}/>
        )}
        {/* Étamines : groupe dense d'anthères noires */}
        {Array.from({length:stamenCount},(_,i) => {
          const ra = R(i * 360/stamenCount)
          const dist = s * (0.25 + (i%3)*0.06)
          return <circle key={'st'+i}
            cx={ox+Math.cos(ra)*dist} cy={oy+Math.sin(ra)*dist}
            r={0.7} fill={`rgba(18,8,4,0.88)`}/>
        })}
        {/* Anneau d'étamines proéminent */}
        {Array.from({length:24},(_,i) => {
          const ra = R(i * 15)
          const dist = s * 0.38
          return <circle key={'sa'+i}
            cx={ox+Math.cos(ra)*dist} cy={oy+Math.sin(ra)*dist}
            r={1.1} fill={`rgba(12,5,2,0.92)`}/>
        })}
      </g>
    }

    // Fallback round
    const path = petalPath(s*0.9, s*1.7)
    return <g>
      {[0,45,90,135,180,225,270,315].map((a,i) =>
        <path key={i} d={path} transform={`translate(${ox+Math.cos(R(a-90))*s},${oy+Math.sin(R(a-90))*s}) rotate(${a})`} fill={fillUrl}/>
      )}
    </g>
  }

  /* ── Courbe de croissance progressive ──
     5 stades visuels :
       0–8%   Graine   : graine + 1 germe minuscule
       8–25%  Pousse   : tige courte + 2 cotylédons (feuilles embryonnaires)
       25–45% Jeune    : tige moyenne + premières vraies feuilles
       45–65% Bouton   : tige pleine + bourgeon fermé
       65–100% Fleur   : fleur ouverte, pollen à 85%+
  ── */
  const stage = r < 0.08 ? 'seed' : r < 0.25 ? 'sprout' : r < 0.45 ? 'young' : r < 0.65 ? 'bud' : 'flower'

  /* Hauteur de tige : démarre à 10px, croît sur une courbe douce */
  const sH   = 10 + 122 * Math.pow(r, 0.55)
  const sTY  = gY - sH
  const sMY  = gY - sH * 0.5
  const flwY = sTY

  /* ── Couleurs végétales ── */
  const stemC = `rgba(${45+25*r},${115+65*r},${32+22*r},${0.55+0.45*r})`
  const stemH2= `rgba(${70+30*r},${162+50*r},${50+20*r},0.28)`
  const lC1   = `rgba(${32+22*r},${105+85*r},${28+18*r},${0.65+0.3*r})`
  const lC2   = `rgba(${38+18*r},${115+72*r},${32+22*r},${0.6+0.35*r})`
  const lV    = `rgba(${55+35*r},${152+55*r},${44+22*r},0.32)`
  const rootC = `rgba(${112+28*r},${72+26*r},${38+12*r},${0.28+0.32*r})`

  /* ── Ciel bleu — identique au jardin collectif ── */
  const skyHue = isDay ? Math.round(215 - dp * (1 - dp) * 4 * 12) : null   // reste dans les bleus (203–215)
  const skyA = isDay ? (isG ? '#1a0a04' : '#0b1e3a') : '#020510'
  const skyB = isDay ? (isG ? `hsl(${skyHue},72%,22%)` : '#1e4e8a') : '#060c1e'
  const skyC = isDay ? (isG ? '#d96418' : `hsl(${skyHue},60%,46%)`) : '#0a1228'
  const soilT = `rgba(${55+Math.round(15*r)},${36+Math.round(10*r)},${18+Math.round(5*r)},0.94)`
  const soilB = `rgba(${26+Math.round(8*r)},${16+Math.round(5*r)},${8+Math.round(2*r)},0.98)`
  const sunC  = isG ? `rgba(255,${Math.round(145+50*dp)},${Math.round(30+50*dp)},1)` : 'rgba(255,218,88,1)'

  /* ── Hash déterministe pour gazon statique ── */
  const hsvg = (str, seed = 0) => {
    let h = (2166136261 ^ seed) >>> 0
    const s = String(str)
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
    return h
  }

  /* ── Gazon dense statique — brins fins par centaine ── */
  const grassBlades = Array.from({ length: 130 }, (_, i) => ({
    x:    (i / 130) * W + ((hsvg('gx'+i,1) % 24) - 12),
    h:    5 + (hsvg('gh'+i,2) % 20),
    lean: ((hsvg('gl'+i,3) % 18) - 9) * 0.55,
    a:    0.18 + (hsvg('ga'+i,4) % 58) / 100,
    gr:   82 + (hsvg('gg'+i,5) % 42),
  }))

  /* ── Herbes hautes arrière-plan ── */
  const tallGrass = Array.from({ length: 52 }, (_, i) => ({
    x:     (i / 52) * W + ((hsvg('tx'+i,1) % 16) - 8),
    h:     18 + (hsvg('th'+i,2) % 38),
    lean:  ((hsvg('tl'+i,3) % 20) - 10) * 0.7,
    thick: 0.7 + (hsvg('tt'+i,4) % 12) / 10,
    green: 62 + (hsvg('tg'+i,5) % 28),
    alpha: 0.14 + (hsvg('ta'+i,6) % 20) / 100,
  }))

  /* ── Petites fleurs — déco dense au sol ── */
  const deco = Array.from({ length: 22 }, (_, i) => ({
    x:    10 + (i / 22) * (W - 20) + ((hsvg('dx'+i,1) % 22) - 11),
    yoff: 2  + (hsvg('dy'+i,2) % 10),
    hue:  15 + (hsvg('dh'+i,3) % 310),
    rs:   1.2 + (hsvg('dr'+i,4) % 18) / 10,
  }))

  /* ── Animations inline ── */
  const swA = (dur, delay='0s') => ({ animation: `svgSway ${dur}s ease-in-out infinite ${delay}`, transformOrigin: 'center bottom' })
  const plantSway = { animation: `svgPlant ${(3.5-r*0.8).toFixed(2)}s ease-in-out infinite`, transformOrigin: `${cx}px ${gY}px` }
  const breathe1  = { animation: 'svgBreath 2.6s ease-in-out infinite' }
  const breathe2  = { animation: 'svgBreath 3.1s ease-in-out infinite 0.5s' }
  const rayAnim   = { animation: 'svgRay 2.8s ease-in-out infinite' }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" fill="none" style={{display:'block'}}>
      <defs>
        <style>{`
          @keyframes svgSway   { 0%,100%{ transform:rotate(0deg) } 35%{ transform:rotate(2deg) } 70%{ transform:rotate(-1.5deg) } }
          @keyframes svgPlant  { 0%,100%{ transform:rotate(-1deg) } 50%{ transform:rotate(1.2deg) } }
          @keyframes svgBreath { 0%,100%{ opacity:1 } 50%{ opacity:0.82 } }
          @keyframes svgPollen { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-2px) } }
          @keyframes svgRay    { 0%,100%{ opacity:0.7 } 50%{ opacity:0.3 } }
          @keyframes svgWind   { 0%{ transform:translateX(-8px); opacity:0 } 40%{ opacity:0.22 } 100%{ transform:translateX(28px); opacity:0 } }
          @keyframes lumenGlow  { 0%,100%{ opacity:0.25 } 50%{ opacity:0.55 } }
          @keyframes pulse      { 0%,100%{ transform:scale(1); opacity:0.30 } 50%{ transform:scale(1.12); opacity:0.45 } }
        `}</style>
        <linearGradient id={id+'sk'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyA}/>
          <stop offset="55%"  stopColor={skyB}/>
          <stop offset="100%" stopColor={skyC}/>
        </linearGradient>
        <linearGradient id={id+'so'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={soilT}/>
          <stop offset="100%" stopColor={soilB}/>
        </linearGradient>
        <linearGradient id={id+'ss'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(20,11,5,0.94)"/>
          <stop offset="100%" stopColor="rgba(10,5,2,0.98)"/>
        </linearGradient>
        <radialGradient id={id+'sh'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={isG ? 'rgba(255,128,18,0.45)' : 'rgba(var(--gold-rgb),0.32)'}/>
          <stop offset="100%" stopColor="rgba(var(--gold-rgb),0)"/>
        </radialGradient>
        <radialGradient id={id+'lh'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(var(--gold-rgb),0)" />
          <stop offset="40%"  stopColor={lumensLevel === 'rayonnement' ? 'rgba(var(--gold-rgb),0.22)' : lumensLevel === 'aura' ? 'rgba(var(--gold-rgb),0.14)' : lumensLevel === 'halo' ? 'rgba(var(--gold-rgb),0.08)' : 'rgba(var(--gold-rgb),0)'} />
          <stop offset="100%" stopColor="rgba(var(--gold-rgb),0)" />
        </radialGradient>
        <radialGradient id={id+'pi'} cx="40%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="rgba(255,242,98,1)"/>
          <stop offset="100%" stopColor="rgba(var(--gold-rgb),0.92)"/>
        </radialGradient>
        <radialGradient id={id+'p1'} cx="50%" cy="78%" r="62%">
          <stop offset="0%"   stopColor={pInr}/>
          <stop offset="55%"  stopColor={pC2}/>
          <stop offset="100%" stopColor={pC1}/>
        </radialGradient>
        <radialGradient id={id+'p2'} cx="50%" cy="78%" r="62%">
          <stop offset="0%"   stopColor={pBk2}/>
          <stop offset="100%" stopColor={pBk1}/>
        </radialGradient>
        <radialGradient id={id+'fg'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={`rgba(${r1},${g1},${b1},${0.16+0.14*r})`}/>
          <stop offset="100%" stopColor={`rgba(${r1},${g1},${b1},0)`}/>
        </radialGradient>
        <filter id={id+'f1'}><feGaussianBlur stdDeviation="0.9"/></filter>
        <filter id={id+'f2'}><feGaussianBlur stdDeviation="2.4"/></filter>
        <filter id={id+'f3'}><feGaussianBlur stdDeviation="5"/></filter>
        <clipPath id={id+'cl'}><rect width={W} height={H}/></clipPath>
      </defs>

      <g clipPath={`url(#${id}cl)`}>

        {/* CIEL — pleine hauteur comme jardin collectif */}
        <rect width={W} height={H} fill={`url(#${id}sk)`}/>

        {/* AURA LUMENS — lueur organique diffuse, sans contour */}
        {lumensLevel !== 'faible' && (() => {
          const sf = compact ? 0.45 : 1.0
          // Centre de l'aura : sur le bourgeon/fleur = sommet de la tige (sTY)
          const ay = sTY

          // Taille et opacité selon le niveau
          const cfg = {
            halo:        { rX: 55,  rY: 38,  op1: 0.28, op2: 0.16, op3: 0.08, blur1: 18, blur2: 35, blur3: 60  },
            aura:        { rX: 85,  rY: 58,  op1: 0.42, op2: 0.24, op3: 0.12, blur1: 22, blur2: 45, blur3: 80  },
            rayonnement: { rX: 120, rY: 82,  op1: 0.55, op2: 0.32, op3: 0.16, blur1: 28, blur2: 55, blur3: 100 },
          }[lumensLevel] ?? { rX: 55, rY: 38, op1: 0.10, op2: 0.06, op3: 0.03, blur1: 18, blur2: 35, blur3: 60 }

          const rX1 = cfg.rX * sf
          const rY1 = cfg.rY * sf
          // Couches de plus en plus larges et de moins en moins opaques
          const rX2 = rX1 * 1.6
          const rY2 = rY1 * 1.5
          const rX3 = rX1 * 2.4
          const rY3 = rY1 * 2.2

          const b1 = (compact ? cfg.blur1 * 0.5 : cfg.blur1)
          const b2 = (compact ? cfg.blur2 * 0.5 : cfg.blur2)
          const b3 = (compact ? cfg.blur3 * 0.5 : cfg.blur3)

          // Couleur chaude dorée avec légère teinte ambrée
          const col1 = `rgba(252,210,80,${cfg.op1})`
          const col2 = `rgba(246,185,60,${cfg.op2})`
          const col3 = `rgba(240,160,40,${cfg.op3})`

          return (
            <g>
              {/* Couche 3 — halo très diffus, large */}
              <ellipse cx={cx} cy={ay} rx={rX3} ry={rY3}
                fill={col3}
                style={{ filter:`blur(${b3}px)` }}>
                <animate attributeName="opacity"
                  values={`${cfg.op3};${(cfg.op3*1.6).toFixed(3)};${cfg.op3}`}
                  dur="7s" repeatCount="indefinite"/>
              </ellipse>
              {/* Couche 2 — halo intermédiaire */}
              <ellipse cx={cx} cy={ay} rx={rX2} ry={rY2}
                fill={col2}
                style={{ filter:`blur(${b2}px)` }}>
                <animate attributeName="opacity"
                  values={`${cfg.op2};${(cfg.op2*1.5).toFixed(3)};${cfg.op2}`}
                  dur="5s" repeatCount="indefinite"/>
              </ellipse>
              {/* Couche 1 — cœur de la lueur, plus concentré */}
              <ellipse cx={cx} cy={ay} rx={rX1} ry={rY1}
                fill={col1}
                style={{ filter:`blur(${b1}px)` }}>
                <animate attributeName="opacity"
                  values={`${cfg.op1};${(cfg.op1*1.4).toFixed(3)};${cfg.op1}`}
                  dur="4s" repeatCount="indefinite"/>
              </ellipse>
              {/* Reflet chaud sur le sol */}
              <ellipse cx={cx} cy={gY} rx={rX1 * 0.9} ry={rY1 * 0.25}
                fill={`rgba(246,196,60,${(cfg.op1 * 0.5).toFixed(3)})`}
                style={{ filter:`blur(${b1 * 0.8}px)` }}>
                <animate attributeName="opacity"
                  values={`${cfg.op1*0.4};${cfg.op1*0.7};${cfg.op1*0.4}`}
                  dur="4s" repeatCount="indefinite"/>
              </ellipse>
            </g>
          )
        })()}

        {/* SOLEIL */}
        {isDay && (
          <g>
            <circle cx={sunX} cy={sunY} r={isG?52:40} fill={`url(#${id}sh)`} filter={`url(#${id}f3)`}/>
            <circle cx={sunX} cy={sunY} r={isG?13:9.5} fill={sunC} filter={`url(#${id}f1)`}/>
            <circle cx={sunX} cy={sunY} r={isG?8.5:6} fill="rgba(255,252,222,0.95)"/>
            <g style={rayAnim}>
              {(isG?[0,30,60,90,120,150,180,210,240,270,300,330]:[0,45,90,135,180,225,270,315]).map((a,i) => {
                const rad=a*Math.PI/180, ra1=isG?15:11, ra2=isG?24:17
                return <line key={i}
                  x1={sunX+Math.cos(rad)*ra1} y1={sunY+Math.sin(rad)*ra1}
                  x2={sunX+Math.cos(rad)*ra2} y2={sunY+Math.sin(rad)*ra2}
                  stroke={isG?'rgba(255,152,28,0.62)':'rgba(var(--gold-rgb),0.52)'}
                  strokeWidth={isG?1.5:1.1} strokeLinecap="round"/>
              })}
            </g>
          </g>
        )}

        {/* VENT */}
        {r > 0.35 && (
          <g>
            <path d={`M14,${Math.round(gY*0.28)} Q38,${Math.round(gY*0.26)} 56,${Math.round(gY*0.30)}`} stroke="rgba(175,222,242,0.22)" strokeWidth={1.3} strokeLinecap="round" fill="none" style={{animation:`svgWind ${(2.0+r*0.7).toFixed(2)}s ease-in-out infinite`}}/>
            <path d={`M8,${Math.round(gY*0.40)} Q32,${Math.round(gY*0.38)} 50,${Math.round(gY*0.42)}`}  stroke="rgba(175,222,242,0.16)" strokeWidth={1.0} strokeLinecap="round" fill="none" style={{animation:`svgWind ${(2.5+r*0.5).toFixed(2)}s ease-in-out infinite 0.7s`}}/>
          </g>
        )}

        {/* SOL */}
        <rect x={0} y={gY} width={W} height={H-gY} fill={`url(#${id}ss)`}/>
        <path d={`M0,${gY} Q60,${gY-4} 120,${gY+2} Q200,${gY+6} 260,${gY+2} Q328,${gY-3} 400,${gY+1} L400,${gY+24} Q280,${gY+22} 160,${gY+26} L0,${gY+22} Z`} fill={`url(#${id}so)`}/>

        {/* HERBES HAUTES — arrière-plan, floues et statiques */}
        <g opacity={0.75}>
          {tallGrass.map((b, i) => {
            const mx = b.x + b.lean * 0.45
            const my = gY - b.h * 0.55
            return (
              <g key={'t'+i}>
                <path
                  d={`M${b.x},${gY} Q${mx},${my} ${b.x+b.lean},${gY-b.h}`}
                  stroke={`rgba(32,${b.green},18,${b.alpha})`}
                  strokeWidth={b.thick} strokeLinecap="round" fill="none"
                />
                {b.h > 38 && (
                  <path
                    d={`M${mx},${my+6} C${mx-b.lean*0.8-6},${my} ${mx-b.lean*0.8-8},${my-8} ${mx-b.lean*0.4-3},${my-10} C${mx-2},${my-6} ${mx},${my} ${mx},${my+6} Z`}
                    fill={`rgba(28,${b.green-4},14,${b.alpha*0.85})`}
                  />
                )}
              </g>
            )
          })}
        </g>

        {/* GAZON DENSE — brins fins statiques */}
        <g>
          {grassBlades.map((b, i) => (
            <line key={'g'+i}
              x1={b.x} y1={gY}
              x2={b.x + b.lean} y2={gY - b.h}
              stroke={`rgba(36,${b.gr},20,${b.a})`}
              strokeWidth={0.55 + (hsvg('bw'+i,1) % 10) / 10}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* PETITES FLEURS — toujours visibles, style jardin collectif */}
        <g>
          {deco.map((b, i) => {
            const ang = [0, 72, 144, 216, 288]
            return (
              <g key={'d'+i}>
                {ang.map((a, j) => {
                  const rad = a * Math.PI / 180
                  return (
                    <ellipse key={j}
                      cx={b.x + Math.cos(rad) * b.rs * 1.5}
                      cy={gY - b.yoff + Math.sin(rad) * b.rs * 1.5}
                      rx={b.rs * 0.82} ry={b.rs * 1.42}
                      fill={`hsla(${b.hue},62%,70%,0.56)`}
                      transform={`rotate(${a+90},${b.x+Math.cos(rad)*b.rs*1.5},${gY-b.yoff+Math.sin(rad)*b.rs*1.5})`}
                    />
                  )
                })}
                <circle cx={b.x} cy={gY - b.yoff} r={b.rs * 0.72} fill={`hsla(${(b.hue+45)%360},78%,80%,0.70)`}/>
              </g>
            )
          })}
        </g>

        {/* ── RACINES : fixes, hors plantSway, organiques ── */}
        {r > 0.10 && (() => {
          // Hash déterministe pour asymétrie stable
          const rh = (a, b = 0) => {
            let h = (2166136261 ^ b) >>> 0
            const s = String(a)
            for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
            return h
          }
          const rn = (seed, lo, hi) => lo + ((rh(seed) % 1000) / 1000) * (hi - lo)

          // Profondeur pivot selon seuils progressifs
          const pivotD = r < 0.15 ? 10
                       : r < 0.20 ? 16
                       : r < 0.30 ? 22
                       : r < 0.40 ? 32
                       : r < 0.50 ? 44
                       : r < 0.65 ? 54
                       : r < 0.75 ? 62
                       : r < 0.85 ? 68 : 74

          // Couleurs selon profondeur — plus sombre et transparent en profondeur
          const cRoot0 = `rgba(${138+20*r},${88+18*r},${48+10*r},${0.22+0.28*r})`  // surface
          const cRoot1 = `rgba(${118+15*r},${72+14*r},${36+8*r},${0.16+0.22*r})`   // intermédiaire
          const cRoot2 = `rgba(${98+10*r},${58+10*r},${28+6*r},${0.10+0.16*r})`    // profond

          // Branches : angle de départ asymétriques
          const branches = [
            { ang:-105, len: pivotD*0.82, sw:1.6+0.7*r, col:cRoot0, seed:'aL' },
            { ang:-130, len: pivotD*0.65, sw:1.2+0.5*r, col:cRoot1, seed:'bL' },
            { ang: -80, len: pivotD*0.52, sw:0.9+0.4*r, col:cRoot1, seed:'cL' },
            { ang: 112, len: pivotD*0.78, sw:1.5+0.6*r, col:cRoot0, seed:'aR' },
            { ang: 145, len: pivotD*0.60, sw:1.1+0.4*r, col:cRoot1, seed:'bR' },
            { ang:  95, len: pivotD*0.48, sw:0.8+0.35*r, col:cRoot1, seed:'cR' },
          ]

          // Filtre blur pour diffusion
          const fid = id + 'rf'

          return (
            <g clipPath={`url(#${id+'rc'})`} opacity={0.30+0.42*r}>
              <defs>
                <filter id={fid}><feGaussianBlur stdDeviation="1.2"/></filter>
                <clipPath id={id+'rc'}><rect x={0} y={gY+2} width={W} height={H}/></clipPath>
              </defs>

              {/* Pivot central — légèrement courbé */}
              {r > 0.10 && (
                <path
                  d={`M${cx},${gY+8} C${cx+rn('pv1',-3,3)},${gY+pivotD*0.4} ${cx+rn('pv2',-2,2)},${gY+pivotD*0.7} ${cx+rn('pv3',-2,3)},${gY+pivotD}`}
                  stroke={cRoot0} strokeWidth={2.0+1.2*r} strokeLinecap="round" fill="none"
                  filter={`url(#${fid})`}
                />
              )}

              {/* Branches latérales organiques */}
              {r > 0.15 && branches.slice(0, r < 0.20 ? 2 : r < 0.30 ? 3 : r < 0.40 ? 4 : r < 0.50 ? 5 : 6).map((b, i) => {
                const rad = b.ang * Math.PI / 180
                const wobble = rn(b.seed+'w', -8, 8)
                const ex = cx + Math.cos(rad) * b.len
                const ey = gY + 8 + Math.abs(Math.sin(rad)) * b.len
                const mx = cx + Math.cos(rad) * b.len * 0.5 + wobble
                const my = gY + 8 + Math.abs(Math.sin(rad)) * b.len * 0.45 + rn(b.seed+'m', -4, 4)
                return (
                  <g key={i}>
                    <path
                      d={`M${cx},${gY+8} Q${mx},${my} ${ex},${ey}`}
                      stroke={b.col} strokeWidth={b.sw} strokeLinecap="round" fill="none"
                      filter={`url(#${fid})`}
                    />
                    {/* Sous-branche — visible à partir de 40% */}
                    {r > 0.40 && (() => {
                      const rad2 = (b.ang + rn(b.seed+'a2',-22,22)) * Math.PI / 180
                      const l2 = b.len * (0.38 + rn(b.seed+'l2',0,0.22))
                      const ex2 = ex + Math.cos(rad2) * l2
                      const ey2 = ey + Math.abs(Math.sin(rad2)) * l2 * 0.6
                      return (
                        <path
                          d={`M${ex},${ey} Q${(ex+ex2)/2+rn(b.seed+'cx',-5,5)},${(ey+ey2)/2+rn(b.seed+'cy',-3,3)} ${ex2},${ey2}`}
                          stroke={cRoot1} strokeWidth={b.sw*0.58} strokeLinecap="round" fill="none"
                          filter={`url(#${fid})`}
                        />
                      )
                    })()}
                    {/* Radicelles fines — à partir de 65% */}
                    {r > 0.65 && [0,1].map(k => {
                      const rad3 = (b.ang + rn(b.seed+'r'+k,-35,35)) * Math.PI / 180
                      const l3 = b.len * (0.18 + rn(b.seed+'l3'+k,0,0.12))
                      const bx = ex + Math.cos(rad3) * l3 * 0.4
                      const by = ey + Math.abs(Math.sin(rad3)) * l3 * 0.3
                      return (
                        <path key={k}
                          d={`M${ex},${ey} L${bx},${by}`}
                          stroke={cRoot2} strokeWidth={0.45} strokeLinecap="round" fill="none"
                          filter={`url(#${fid})`}
                        />
                      )
                    })}
                  </g>
                )
              })}

              {/* Poils absorbants — réseau fin à partir de 75% */}
              {r > 0.75 && Array.from({ length: 10 }, (_, i) => {
                const bx = cx + rn('ha'+i,-30,30)
                const by = gY + 10 + rn('hb'+i,8,pivotD*0.85)
                const dx = rn('hc'+i,-5,5)
                const dy = rn('hd'+i,3,8)
                return (
                  <line key={i}
                    x1={bx} y1={by} x2={bx+dx} y2={by+dy}
                    stroke={cRoot2} strokeWidth={0.3} strokeLinecap="round"
                    opacity={0.40+0.18*r}
                  />
                )
              })}
            </g>
          )
        })()}

        {/* PLANTE */}
        <g style={plantSway}>

          {/* ── STADE 1 : GRAINE 0–8% ─────────────────────────────
              Une graine dans la terre avec 1 minuscule germe courbé */}
          {stage === 'seed' && (
            <g>
              {/* graine dans le sol */}
              <ellipse cx={cx} cy={gY+3} rx={5} ry={3.5} fill="rgba(var(--zone-roots-rgb),0.75)" />
              <ellipse cx={cx-1} cy={gY+2} rx={3} ry={2} fill="rgba(var(--zone-roots-rgb),0.35)" />
              {/* germe minuscule qui sort */}
              <path d={`M${cx},${gY+1} Q${cx+4},${gY-6} ${cx+2},${gY-12}`}
                stroke={`rgba(68,148,48,${0.5+r*3})`} strokeWidth={1.6} strokeLinecap="round" fill="none"/>
              {/* petite courbe de feuille embryonnaire */}
              {r > 0.03 && (
                <path d={`M${cx+2},${gY-12} C${cx+8},${gY-16} ${cx+6},${gY-22} ${cx+1},${gY-18}`}
                  stroke={`rgba(78,158,52,${0.4+r*4})`} strokeWidth={1.3} strokeLinecap="round" fill="none"/>
              )}
            </g>
          )}

          {/* ── STADE 2 : POUSSE 8–25% ────────────────────────────
              Petite tige + 2 cotylédons (feuilles embryonnaires rondes) */}
          {stage === 'sprout' && (() => {
            const t = (r - 0.08) / 0.17   // 0→1 dans ce stade
            return (
              <g>
                {/* Tige fine */}
                <path d={`M${cx},${gY} Q${cx+2*t},${sMY} ${cx},${sTY}`}
                  stroke={stemC} strokeWidth={1.4+0.6*t} strokeLinecap="round" fill="none"/>
                {/* Petit bourgeon fermé — grandit avec t */}
                {[-18,0,18].map((a,i) => (
                  <path key={i} d={`M${cx},${Math.round(flwY+4+5*r)} Q${cx+Math.round(Math.sin(a*Math.PI/180)*5)},${Math.round(flwY+5*r)} ${cx},${Math.round(flwY+4*r)}`} fill={lC2} opacity={0.60}/>
                ))}
                <ellipse cx={cx} cy={flwY} rx={2+2.5*t} ry={4+4*t} fill={`rgba(${r1},${g1},${b1},${0.22+0.22*t})`}/>
                <ellipse cx={cx-0.5} cy={flwY-0.5} rx={1.2+1.5*t} ry={2.5+2.5*t} fill={`rgba(${r2},${g2},${b2},0.25)`}/>
              </g>
            )
          })()}

          {/* ── STADE 3 : JEUNE PLANTE 25–45% ────────────────────
              Tige + premières vraies feuilles, pas encore de fleur */}
          {(stage === 'young' || stage === 'bud' || stage === 'flower') && (
            <>
              {/* Tige principale */}
              <path d={`M${cx},${gY} C${cx-6},${Math.round(sMY+14)} ${cx+7},${Math.round(sMY-14)} ${cx},${sTY}`}
                stroke={stemC} strokeWidth={2.2+2*r} strokeLinecap="round" fill="none"/>
              {r > 0.35 && <path d={`M${cx-1},${gY} C${cx-5},${Math.round(sMY+12)} ${cx+6},${Math.round(sMY-16)} ${cx-1},${sTY}`}
                stroke={stemH2} strokeWidth={1.1} strokeLinecap="round" fill="none"/>}

              {/* Feuilles — système dynamique identique à FieldFlower */}
              {r > 0.25 && (() => {
                // Fonction hash locale (identique à CommunityGarden)
                const hsh = (str, seed = 0) => {
                  let h = (2166136261 ^ seed) >>> 0
                  const s = String(str || 'plant')
                  for (let i = 0; i < s.length; i++) {
                    h ^= s.charCodeAt(i)
                    h = Math.imul(h, 16777619) >>> 0
                  }
                  return h
                }
                const uid = 'myplant'

                // Hauteur de tige courante
                const stemH = sH
                const curve = 0  // pas de courbure latérale dans PlantSVG

                // Nombre de paires de feuilles selon santé
                const pairCount = Math.max(1, Math.round(r * 5) - (hsh(uid, 20) % 2 === 0 ? 0 : 0))
                const leftCount  = pairCount + (hsh(uid, 21) % 2 === 0 && r > 0.6 ? 1 : 0)
                const rightCount = pairCount + (hsh(uid, 22) % 2 === 0 && r > 0.7 ? 1 : 0)
                const maxCount   = Math.max(leftCount, rightCount)

                const leaves = []
                for (let li = 0; li < maxCount; li++) {
                  const tBase = 0.20 + (li / Math.max(maxCount - 1, 1)) * 0.68
                  const tOffL = ((hsh(uid, 30 + li) % 10) - 5) / 100
                  const tOffR = ((hsh(uid, 31 + li) % 10) - 5) / 100

                  for (const [side, count, tOff, seedBase] of [[-1, leftCount, tOffL, 100], [1, rightCount, tOffR, 200]]) {
                    if (li >= count) continue
                    const t  = Math.min(0.92, Math.max(0.15, tBase + tOff))
                    const bx = cx + curve * t
                    const by = gY - stemH * t
                    const sizeF  = 0.55 + Math.sin(t * Math.PI) * 0.65
                    const lw     = (28 + (hsh(uid, seedBase + li) % 16)) * sizeF * (0.65 + r * 0.55)
                    const lh     = (22 + (hsh(uid, seedBase + 10 + li) % 14)) * sizeF * (0.65 + r * 0.55)
                    const angleBase = side === -1 ? 210 : -30
                    const angleVar  = ((hsh(uid, seedBase + 20 + li) % 36) - 18)
                    const angle     = angleBase + angleVar
                    const rad       = angle * Math.PI / 180
                    const tipX      = bx + Math.cos(rad) * lh
                    const tipY      = by + Math.sin(rad) * lh
                    const ctrlOff   = lw * side
                    const gr    = 98 + (hsh(uid, seedBase + 30 + li) % 24)
                    const leafC = `rgba(${28 + Math.round(16*r)},${gr + Math.round(68*r)},${22 + Math.round(14*r)},${0.58 + 0.32*r})`
                    const veinC = `rgba(${52 + Math.round(24*r)},${gr + 38 + Math.round(36*r)},${36 + Math.round(14*r)},0.30)`

                    leaves.push(
                      <g key={`${side}-${li}`}>
                        <path
                          d={`M${bx},${by}
                              C${bx + ctrlOff * 0.8},${by - lh * 0.18}
                                ${tipX + ctrlOff * 0.4},${tipY - lh * 0.12}
                                ${tipX},${tipY}
                              C${tipX - ctrlOff * 0.3},${tipY + lh * 0.08}
                                ${bx + ctrlOff * 0.3},${by + lh * 0.12}
                                ${bx},${by} Z`}
                          fill={leafC}
                        />
                        <path
                          d={`M${bx},${by} Q${(bx + tipX) / 2 + ctrlOff * 0.15},${(by + tipY) / 2} ${tipX},${tipY}`}
                          stroke={veinC} strokeWidth={0.65} fill="none"
                        />
                      </g>
                    )
                  }
                }
                return leaves
              })()}

              {/* BOURGEON FERMÉ — stade 'young' (25–45%) — plus gros que sprout */}
              {stage === 'young' && (
                <g>
                  {[-24,0,24].map((a,i) => (
                    <path key={i} d={`M${cx},${Math.round(flwY+6+8*r)} Q${cx+Math.round(Math.sin(a*Math.PI/180)*8)},${Math.round(flwY+8*r)} ${cx},${Math.round(flwY+7*r)}`} fill={lC2} opacity={0.7}/>
                  ))}
                  <ellipse cx={cx} cy={flwY} rx={4+6*r} ry={8+9*r} fill={`rgba(${r1},${g1},${b1},${0.30+0.36*r})`}/>
                  <ellipse cx={cx-1} cy={flwY-1} rx={2.5+4*r} ry={5+7*r} fill={`rgba(${r2},${g2},${b2},0.32)`}/>
                </g>
              )}
              {/* PETITE FLEUR — stade 'bud' (45–65%) */}
              {stage === 'bud' && (
                <g>
                  <circle cx={cx} cy={flwY} r={fS*2.2} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>
                  {[-28,0,28].map((a,i) => {
                    const rad=(a-90)*Math.PI/180
                    return <path key={i} d={`M${cx},${Math.round(flwY+fS*0.4)} Q${cx+Math.round(Math.cos(rad)*7)},${Math.round(flwY+fS*0.4+9)} ${cx},${Math.round(flwY+fS*0.4+12)}`} fill={lC2} opacity={0.65}/>
                  })}
                  <g style={breathe1}>
                    {renderFlower(cx, flwY, `url(#${id}p1)`, id+'f1', `url(#${id}p2)`)}
                  </g>
                  <circle cx={cx} cy={flwY} r={fS*0.60} fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.88)`}/>
                  <circle cx={cx} cy={flwY} r={fS*0.34} fill={`url(#${id}pi)`}/>
                </g>
              )}
              {/* FLEUR — à partir de 65% */}
              {stage === 'flower' && (
                <g>
                  {/* Halo de fond */}
                  <circle cx={cx} cy={flwY} r={fS*3.2} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>
                  {/* Sépales */}
                  {[-28,0,28].map((a,i) => {
                    const rad=(a-90)*Math.PI/180
                    return <path key={i} d={`M${cx},${Math.round(flwY+fS*0.5)} Q${cx+Math.round(Math.cos(rad)*9)},${Math.round(flwY+fS*0.5+12)} ${cx},${Math.round(flwY+fS*0.5+14)}`} fill={lC2} opacity={0.65}/>
                  })}
                  {/* Pétales via renderFlower */}
                  <g style={breathe1}>
                    {renderFlower(cx, flwY, `url(#${id}p1)`, id+'f1', `url(#${id}p2)`)}
                  </g>
                  {/* Cœur */}
                  <circle cx={cx} cy={flwY} r={fS*0.72} fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.90)`}/>
                  <circle cx={cx} cy={flwY} r={fS*0.40} fill={`url(#${id}pi)`}/>
                  {/* Pollen à 85%+ */}
                  {r > 0.85 && [0,51,103,154,205,257,308].map((a,i) => {
                    const rp=fS*0.52, rad=a*Math.PI/180
                    return <circle key={i}
                      cx={cx+Math.cos(rad)*rp} cy={flwY+Math.sin(rad)*rp}
                      r={1.1} fill={`rgba(255,232,72,${0.68+0.24*r})`}
                      style={{animation:`svgPollen 2.2s ease-in-out infinite ${(i*0.18).toFixed(2)}s`}}/>
                  })}
                </g>
              )}


            </>
          )}

        </g>
      </g>
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
const ZONE_DISPLAY  = {
  zone_racines:  { name:'Racines',  icon:'🌱', color:'var(--zone-roots)' },
  zone_tige:     { name:'Tige',     icon:'🌿', color:'var(--zone-stem)' },
  zone_feuilles: { name:'Feuilles', icon:'🍃', color:'var(--zone-leaves)' },
  zone_fleurs:   { name:'Fleurs',   icon:'🌸', color:'var(--zone-flowers)' },
  zone_souffle:  { name:'Souffle',  icon:'🌬️', color:'var(--zone-breath)' },
}

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
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'var(--green)' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'var(--green)' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'#60d475' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'#e088a8' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'#88b8e8' },
]

/* ─────────────────────────────────────────
   MODAL INVITATION
───────────────────────────────────────── */
function InviteModal({ circle, onClose, onCopied }) {
  const [copied, setCopied] = useState(false)
  const code = circle?.invite_code ?? '——'
  const shareText = 'Rejoins mon groupe "' + (circle?.name ?? '') + '" sur Mon Jardin Intérieur 🌿 - Code : ' + code

  function handleCopy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShareText() {
    navigator.clipboard?.writeText(shareText).then(() => {
      onCopied?.()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Inviter dans {circle?.name} 🌿</div>

        <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text3)', lineHeight:1.6 }}>
          Partagez ce code avec les personnes que vous souhaitez inviter dans votre groupe.
        </div>

        <div style={{ background:'rgba(var(--green-rgb),0.08)', border:'1px solid var(--greenT)', borderRadius:14, padding:'18px 20px', textAlign:'center' }}>
          <div style={{ fontSize:'var(--fs-h5, 9px)', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Code d'invitation</div>
          <div style={{ fontFamily:'monospace', fontSize:'var(--fs-h1, 28px)', letterSpacing:'.3em', color:'var(--text)', fontWeight:300 }}>{code}</div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="modal-submit" style={{ flex:1 }} onClick={handleCopy}>
            {copied ? '✓ Copié !' : '📋 Copier le code'}
          </button>
          <button className="modal-cancel" onClick={handleShareText} title="Copier un message complet">
            ✉️ Copier message
          </button>
        </div>

        <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>
          {circle?.memberCount ?? 0}/{circle?.max_members ?? 8} membres · {circle?.is_open ? 'Groupe ouvert' : 'Sur invitation uniquement'}
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 1 — CERCLE
───────────────────────────────────────── */
function useCollectifs(userId) {
  const [collectifs, setCollectifs] = useState([])
  const [joinedIds, setJoinedIds]   = useState(new Set())

  async function fetchCollectifs() {
    const { data } = await supabase
      .from('collectifs')
      .select(`id, emoji, title, description, starts_at, duration_min, collectif_participants(count)`)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5)
    setCollectifs(data ?? [])
  }

  async function fetchJoined() {
    if (!userId) return
    const { data } = await supabase
      .from('collectif_participants')
      .select('collectif_id')
      .eq('user_id', userId)
    setJoinedIds(new Set(data?.map(d => d.collectif_id) ?? []))
  }

  useEffect(() => { fetchCollectifs() }, [])
  useEffect(() => { fetchJoined() }, [userId])

  async function rejoindre(collectifId) {
    await supabase
      .from('collectif_participants')
      .upsert({ collectif_id: collectifId, user_id: userId }, { onConflict: 'collectif_id,user_id' })
    await Promise.all([fetchCollectifs(), fetchJoined()])
  }

  async function quitter(collectifId) {
    await supabase
      .from('collectif_participants')
      .delete()
      .eq('collectif_id', collectifId)
      .eq('user_id', userId)
    await Promise.all([fetchCollectifs(), fetchJoined()])
  }

  return { collectifs, joinedIds, rejoindre, quitter }
}

function useRecentActivity(circleId) {
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!circleId) { setLoading(false); return }

    async function load() {
      setLoading(true)

      // Récupérer les membres du groupe
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId)

      if (!members?.length) { setLoading(false); return }
      const userIds = members.map(m => m.user_id)

      // Rituels complétés récemment (48h)
      const since = new Date(Date.now() - 48 * 3600000).toISOString()

      const [{ data: rituals }, { data: gestures }] = await Promise.all([
        supabase
          .from('rituals')
          .select('user_id, name, zone, completed_at, users:user_id(display_name, email)')
          .in('user_id', userIds)
          .gte('completed_at', since)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('gestures')
          .select('from_user_id, to_user_id, type, created_at, sender:from_user_id(display_name, email), receiver:to_user_id(display_name, email)')
          .in('from_user_id', userIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Fusionner et trier par date
      const items = [
        ...(rituals ?? []).map(r => ({
          type:   'ritual',
          name:   r.users?.display_name ?? r.users?.email ?? '?',
          action: 'a complété',
          ritual: r.name,
          zone:   r.zone,
          t:      r.completed_at
        })),
        ...(gestures ?? []).map(g => {
          const to = g.receiver?.display_name ?? g.receiver?.email ?? '?'
          return {
            type:   'gesture',
            name:   g.sender?.display_name ?? g.sender?.email ?? '?',
            action: `a envoyé ${g.type} à ${to}`,
            ritual: '',
            zone:   '',
            t:      g.created_at
          }
        })
      ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8)

      setActivity(items)
      setLoading(false)
    }

    load()
  }, [circleId])

  return { activity, loading }
}

/* ─────────────────────────────────────────
   HOOK — MEMBRES PAR PROXIMITÉ (30 jours)
   Scores :
     geste envoyé/reçu   → +3 pts
     même groupe actif   → +2 pts
     même collectif      → +2 pts
     commentaire/réaction→ +4 pts
   Niveaux dynamiques :
     top 10%  → 🌳 Famille
     top 35%  → 🌿 Amis
     reste    → 🌱 Relations
───────────────────────────────────────── */
function useProximityMembers(userId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const since = new Date(Date.now() - 30 * 86400000).toISOString()
      const scores = {}

      const ensure = (id, name, email, avatar) => {
        if (!scores[id]) scores[id] = { userId: id, name: name ?? email ?? '?', score: 0 }
      }

      // 1. Gestes envoyés/reçus (+3 pts chacun)
      const [{ data: sent }, { data: recv }] = await Promise.all([
        supabase.from('gestures')
          .select('to_user_id, receiver:to_user_id(display_name, email)')
          .eq('from_user_id', userId)
          .gte('created_at', since),
        supabase.from('gestures')
          .select('from_user_id, sender:from_user_id(display_name, email)')
          .eq('to_user_id', userId)
          .gte('created_at', since)
      ])
      ;(sent ?? []).forEach(g => {
        const id = g.to_user_id
        ensure(id, g.receiver?.display_name, g.receiver?.email)
        scores[id].score += 3
      })
      ;(recv ?? []).forEach(g => {
        const id = g.from_user_id
        ensure(id, g.sender?.display_name, g.sender?.email)
        scores[id].score += 3
      })

      // 2. Même groupe actif (+2 pts par groupe partagé)
      const { data: myCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)
      const circleIds = (myCircles ?? []).map(c => c.circle_id)
      if (circleIds.length > 0) {
        const { data: coMembers } = await supabase
          .from('circle_members')
          .select('user_id, users:user_id(display_name, email)')
          .in('circle_id', circleIds)
          .neq('user_id', userId)
        ;(coMembers ?? []).forEach(m => {
          ensure(m.user_id, m.users?.display_name, m.users?.email)
          scores[m.user_id].score += 2
        })
      }

      // 3. Même collectif rejoint (+2 pts)
      const { data: myCollectifs } = await supabase
        .from('collectif_participants')
        .select('collectif_id')
        .eq('user_id', userId)
        .gte('created_at', since)
      const collectifIds = (myCollectifs ?? []).map(c => c.collectif_id)
      if (collectifIds.length > 0) {
        const { data: coParticipants } = await supabase
          .from('collectif_participants')
          .select('user_id, users:user_id(display_name, email)')
          .in('collectif_id', collectifIds)
          .neq('user_id', userId)
          .gte('created_at', since)
        ;(coParticipants ?? []).forEach(p => {
          ensure(p.user_id, p.users?.display_name, p.users?.email)
          scores[p.user_id].score += 2
        })
      }

      // Trier par score décroissant, garder les 50 premiers
      const sorted = Object.values(scores)
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)

      setMembers(sorted)
      setLoading(false)
    }

    load()
  }, [userId])

  return { members, loading }
}

function ScreenCercle({ userId, openCreate, onCreateClose, openInvite, onInviteClose }) {
  const isMobile = useIsMobile()
  const { circleMembers, activeCircle } = useCircle(userId)
  const { received, send } = useGestures(userId)
  const { activity } = useRecentActivity(activeCircle?.id)
  const { collectifs, joinedIds, rejoindre, quitter } = useCollectifs(userId)
  const { members: proximityMembers, loading: proximityLoading } = useProximityMembers(userId)
  const [sentGestures, setSentGestures] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // Topbar "+ Inviter" ouvre le modal
  const isInviteOpen = showInvite || openInvite

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



  return (
    <>
      <Toast msg={toast} />
      {isInviteOpen && activeCircle && (
        <InviteModal
          circle={activeCircle}
          onClose={() => { setShowInvite(false); onInviteClose?.() }}
          onCopied={() => showToast('🌿 Code copié !')}
        />
      )}
      <div className="content">
        <div className="col" style={{ flex:1 }}>
        {collectifs[0] && (() => {
          const c = collectifs[0]
          const diff = new Date(c.starts_at) - Date.now()
          const h = Math.floor(diff / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          const heure = new Date(c.starts_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
          const nbPart = c.collectif_participants?.[0]?.count ?? 0
          const timer = diff > 0 ? (h > 0 ? `dans ${h}h ${m}min` : `dans ${m} min`) : 'En cours'
          return (
            <div className="collective-banner">
              <div className="cb-top">
                <span className="cb-badge">{c.emoji} Collectif · {heure}</span>
                <span className="cb-timer">{timer}</span>
              </div>
              <div className="cb-title">{c.title} — {heure}</div>
              {c.description && <div className="cb-desc">{c.description}</div>}
              <div className="cb-foot">
                <div className="cb-avatars">
                  {['🌸','🌿','🌾','🌱'].map((e,i) => <div key={i} className="cb-av">{e}</div>)}
                </div>
                <span className="cb-count">{nbPart} participants inscrits</span>
                <div style={{ display:'flex', gap:6 }}>
                  <div
                    className="cb-join"
                    onClick={() => !joinedIds.has(c.id) && rejoindre(c.id)}
                    style={{ opacity: joinedIds.has(c.id) ? 0.5 : 1, cursor: joinedIds.has(c.id) ? 'default' : 'pointer' }}
                  >
                    {joinedIds.has(c.id) ? '✓ Inscrit' : 'Rejoindre'}
                  </div>
                  {joinedIds.has(c.id) && (
                    <div
                      className="cb-join"
                      onClick={() => quitter(c.id)}
                      style={{ background:'rgba(var(--zone-flowers-rgb),0.12)', border:'1px solid rgba(var(--zone-flowers-rgb),0.3)', color:'rgba(var(--zone-flowers-rgb),0.85)', cursor:'pointer' }}
                    >
                      Se désinscrire
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <div className="slabel">Activité récente</div>
        {activity.length === 0 ? (
          <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text3)', padding:'12px 0', fontStyle:'italic' }}>
            Aucune activité récente dans ce groupe.
          </div>
        ) : activity.map((a, i) => (
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

        <div className="rpanel" style={{ display: isMobile ? "none" : undefined }}>
        <div className="rp-section">
          <div className="rp-slabel">Ma communauté · {proximityMembers.length}</div>

          {proximityLoading && (
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>Calcul des proximités…</div>
          )}

          {!proximityLoading && proximityMembers.length === 0 && (
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>
              Pas encore d'interactions ce mois-ci.
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {proximityMembers.slice(0, 50).map((m, i) => (
              <div key={m.userId} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface-2)', border:'1px solid var(--border2)', borderRadius:10 }}>
                <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', width:16, textAlign:'right', flexShrink:0 }}>{i+1}</div>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(var(--green-rgb),0.12)', border:'1px solid rgba(var(--green-rgb),0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-h5, 12px)', flexShrink:0 }}>
                  {memberEmoji(m.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', marginTop:1 }}>{m.score} interactions</div>
                </div>
                {m.userId !== userId && (
                  <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                    {['💧','☀️','🌱'].map(type => (
                      <div key={type}
                        className={'mr-gesture-btn' + (sentGestures.has(`${m.userId}-${type}`) ? ' sent' : '')}
                        onClick={() => !sentGestures.has(`${m.userId}-${type}`) && handleSendGesture(m.userId, type)}
                        title={`Envoyer ${type}`}
                        style={{ fontSize:'var(--fs-h5, 11px)', padding:'2px 5px' }}
                      >{type}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Gestes reçus</div>
          {received.map(g => (
            <div key={g.id} className="gesture-item">
              <div className="gi-emoji">{GESTURE_EMOJI[g.type]}</div>
              <div className="gi-text" style={{ flex:1 }}>
                <b>{g.users?.display_name ?? '?'}</b> t'a envoyé {GESTURE_LABEL[g.type]}
                {g.target_zone && ZONE_DISPLAY[g.target_zone] && (
                  <span style={{ marginLeft:6, fontSize:'var(--fs-h5, 9px)', padding:'1px 6px', borderRadius:10,
                    background:`${ZONE_DISPLAY[g.target_zone].color}20`,
                    border:`1px solid ${ZONE_DISPLAY[g.target_zone].color}45`,
                    color:ZONE_DISPLAY[g.target_zone].color }}>
                    {ZONE_DISPLAY[g.target_zone].icon} {ZONE_DISPLAY[g.target_zone].name}
                  </span>
                )}
              </div>
              <div className="gi-time">{timeAgo(g.created_at)}</div>
            </div>
          ))}
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Prochains collectifs</div>
          {collectifs.slice(0, 4).map((c, i) => {
            const d = new Date(c.starts_at)
            const now = new Date()
            const isToday = d.toDateString() === now.toDateString()
            const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
            const heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
            const label = isToday ? `Ce soir ${heure}` : isTomorrow ? `Demain ${heure}` : d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric' }) + ` ${heure}`
            const nbPart = c.collectif_participants?.[0]?.count ?? 0
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9, padding:'8px 10px', background:'var(--surface-2)', borderRadius:10, border:'1px solid var(--border2)' }}>
                <span style={{ fontSize:'var(--fs-emoji-sm, 15px)' }}>{c.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text2)' }}>{c.title}</div>
                  <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:2 }}>{label} · {nbPart} pers.</div>
                </div>
              </div>
            )
          })}
          {collectifs.length === 0 && (
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic' }}>Aucun collectif prévu.</div>
          )}
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
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <LumenBadge amount={1} />
          <button className="jc-save" disabled={!text.trim() || saving} onClick={handleSave}>
            {saved ? '✓ Sauvegardé' : saving ? '…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 2 — MON JARDIN
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   RITUELS — DONNÉES & COMPOSANTS
   (intégré depuis mafleur_rituels.jsx)
───────────────────────────────────────── */

const PLANT_ZONES = {
  roots:   { name:'Racines',  subtitle:'Ancrage & Énergie',    emoji:'🌱', color:'var(--zone-roots)', accent:'var(--gold-warm)',  },
  stem:    { name:'Tige',     subtitle:'Flexibilité & Corps',  emoji:'🌿', color:'var(--zone-stem)', accent:'#9DDBB4',  },
  leaves:  { name:'Feuilles', subtitle:'Liens & Humeur',       emoji:'🍃', color:'var(--zone-leaves)', accent:'var(--green)',  },
  flowers: { name:'Fleurs',   subtitle:'Soin de Soi',          emoji:'🌸', color:'var(--zone-flowers)', accent:'var(--zone-flowers)',  },
  breath:  { name:'Souffle',  subtitle:'Présence & Sérénité',  emoji:'🌬️', color:'var(--zone-breath)', accent:'var(--zone-breath)',  },
}

// Correspondance zone → clé DB pour la mise à jour de la plante
const ZONE_DB_KEY = {
  roots:   'zone_racines',
  stem:    'zone_tige',
  leaves:  'zone_feuilles',
  flowers: 'zone_fleurs',
  breath:  'zone_souffle',
}

// PLANT_RITUALS — chargé depuis Supabase via useRituels() dans ScreenMonJardin
// La variable est mutée au chargement pour que tous les composants du module l'utilisent
let PLANT_RITUALS = PLANT_RITUALS_EMPTY


const PLANT_QUESTIONS = [
  { id:'q1',  zone:'roots',   theme:'Énergie vitale',   icon:'⚡', text:'Comment est votre énergie physique en ce moment ?',            sub:'Fermez les yeux. Scannez votre corps de la tête aux pieds.',          answers:[{label:'Vidé·e',emoji:'🪫',stress:95},{label:'Épuisé·e',emoji:'😴',stress:72},{label:'Passable',emoji:'😐',stress:48},{label:'Bien',emoji:'🌱',stress:20},{label:'Plein·e d\'élan',emoji:'✨',stress:0}] },
  { id:'q2',  zone:'roots',   theme:'Sommeil',           icon:'🌙', text:'Quelle qualité avait votre sommeil cette nuit ?',             sub:'Nuit agitée, fragments de rêves, réveil difficile…',                  answers:[{label:'Cauchemardesque',emoji:'😩',stress:95},{label:'Agité·e',emoji:'😣',stress:72},{label:'Moyen',emoji:'😶',stress:45},{label:'Reposant',emoji:'😌',stress:15},{label:'Profond & doux',emoji:'🌟',stress:0}] },
  { id:'q3',  zone:'stem',    theme:'Corps',             icon:'🤸', text:'Où en est votre corps en ce début de journée ?',             sub:'Tensions, lourdeurs, contractures… ou légèreté.',                    answers:[{label:'Douloureux',emoji:'😖',stress:95},{label:'Contracté',emoji:'😬',stress:70},{label:'Neutre',emoji:'😑',stress:45},{label:'Détendu',emoji:'😊',stress:18},{label:'Léger & libre',emoji:'🕊️',stress:0}] },
  { id:'q4',  zone:'stem',    theme:'Flexibilité',       icon:'🌊', text:'Face à un imprévu, votre posture intérieure est…',           sub:'Ce que vous portez avant même qu\'il arrive.',                        answers:[{label:'Effondrement',emoji:'😤',stress:95},{label:'Résistance',emoji:'😰',stress:70},{label:'Hésitation',emoji:'🤔',stress:48},{label:'Adaptation',emoji:'🙆',stress:20},{label:'Fluidité totale',emoji:'🌿',stress:0}] },
  { id:'q5',  zone:'leaves',  theme:'Lien aux autres',   icon:'🤝', text:'Votre désir de connexion avec les autres ce matin ?',        sub:'Envie de partager, d\'échanger, de rire ensemble…',                   answers:[{label:'Retrait total',emoji:'🙈',stress:95},{label:'Isolé·e',emoji:'🫥',stress:72},{label:'Neutre',emoji:'🙂',stress:48},{label:'Présent·e',emoji:'😄',stress:20},{label:'Rayonnant·e',emoji:'🌞',stress:0}] },
  { id:'q6',  zone:'leaves',  theme:'Humeur',            icon:'🎨', text:'Quelle couleur peindrait votre humeur en ce moment ?',       sub:'Une teinte émotionnelle, pas un jugement.',                           answers:[{label:'Noir profond',emoji:'🌑',stress:95},{label:'Gris lourd',emoji:'🌥️',stress:72},{label:'Beige terne',emoji:'🌤️',stress:48},{label:'Jaune doux',emoji:'🌼',stress:18},{label:'Or lumineux',emoji:'☀️',stress:0}] },
  { id:'q7',  zone:'flowers', theme:'Rapport à soi',     icon:'💆', text:'Comment vous sentez-vous vis-à-vis de vous-même ?',          sub:'Bienveillance, indifférence, critique intérieure…',                   answers:[{label:'Très dur·e',emoji:'😞',stress:95},{label:'Déconnecté·e',emoji:'😕',stress:70},{label:'Neutre',emoji:'😌',stress:45},{label:'Avec douceur',emoji:'🌸',stress:18},{label:'Avec amour',emoji:'💖',stress:0}] },
  { id:'q8',  zone:'flowers', theme:'Anticipation',      icon:'🌅', text:'Face à la journée qui s\'ouvre, votre ressenti est…',        sub:'Ce que vous portez avant même qu\'elle commence.',                    answers:[{label:'Angoisse',emoji:'😨',stress:95},{label:'Préoccupation',emoji:'😟',stress:70},{label:'Neutralité',emoji:'😐',stress:45},{label:'Sérénité',emoji:'🙂',stress:18},{label:'Joie anticipée',emoji:'🌟',stress:0}] },
  { id:'q9',  zone:'breath',  theme:'Stress intérieur',  icon:'🌀', text:'Quel est le niveau de tension que vous portez là, maintenant ?', sub:'Pas dans les idées — dans le ventre, la gorge, les épaules.',      answers:[{label:'Insupportable',emoji:'🔥',stress:100},{label:'Élevé',emoji:'⚠️',stress:75},{label:'Gérable',emoji:'💛',stress:48},{label:'Faible',emoji:'💚',stress:18},{label:'Absent',emoji:'🌬️',stress:0}] },
  { id:'q10', zone:'breath',  theme:'Présence',          icon:'🔮', text:'Êtes-vous dans votre corps, ou perdu·e dans vos pensées ?',  sub:'Le fil entre le mental et le vivant.',                                answers:[{label:'Tourbillon mental',emoji:'🌪️',stress:95},{label:'Plutôt dans la tête',emoji:'💭',stress:70},{label:'Entre les deux',emoji:'⚖️',stress:45},{label:'Ancré·e',emoji:'🌱',stress:15},{label:'Pleinement ici',emoji:'🧘',stress:0}] },
]

function computeDegradation(answers) {
  const acc = {}
  Object.keys(PLANT_ZONES).forEach(z => { acc[z] = { w:0, s:0 } })
  PLANT_QUESTIONS.forEach(q => {
    if (answers[q.id] === undefined) return
    acc[q.zone].s += q.answers[answers[q.id]].stress
    acc[q.zone].w += 1
  })
  const deg = {}
  Object.keys(PLANT_ZONES).forEach(z => {
    deg[z] = acc[z].w > 0 ? Math.round(acc[z].s / acc[z].w) : 50
  })
  return deg
}

// ── Système de croissance progressive ──────────────────────
// La plante démarre à 5%. La progression ralentit au fur et à mesure.
// Un bonus de streak récompense la fréquence quotidienne.
//
//  Paliers visuels :
//   0–8%   → Graine      (juste un germe)
//   8–38%  → Pousse      (tige + bourgeon)
//   38–60% → Bouton      (fleur fermée)
//   60–85% → Fleur       (fleur ouverte)
//   85–100%→ Épanouie    (+ pollen + glow)
//
//  Delta par rituel = baseDelta × courbeRalentissement × bonusStreak
//   baseDelta = 4 pts
//   courbeRalentissement = 1 - (health / 100) * 0.65  → à 5% = ×0.97, à 80% = ×0.48
//   bonusStreak : +0% / +20% / +40% / +60% selon jours consécutifs (0/1/2/3+)

function computeRitualDelta(currentHealth, streakDays) {
  const base       = 4
  const slowdown   = 1 - (currentHealth / 100) * 0.65
  const streakBonus = Math.min(1.6, 1 + streakDays * 0.20)
  return Math.max(1, Math.round(base * slowdown * streakBonus))
}

// ── Hook streak ─────────────────────────────────────────────
function useStreak(userId) {
  const KEY = userId ? `mafleur-streak-${userId}` : 'mafleur-streak'

  function getStreak() {
    try {
      const raw  = localStorage.getItem(KEY)
      if (!raw) return 0
      const { lastDate, days } = JSON.parse(raw)
      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (lastDate === today)      return days          // déjà enregistré aujourd'hui
      if (lastDate === yesterday)  return days          // hier → streak continue
      return 0                                          // trop long → streak cassé
    } catch { return 0 }
  }

  function recordToday() {
    try {
      const raw       = localStorage.getItem(KEY)
      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      let days = 1
      if (raw) {
        const { lastDate, days: prev } = JSON.parse(raw)
        if (lastDate === today)      return prev         // déjà enregistré
        if (lastDate === yesterday)  days = prev + 1    // continue le streak
      }
      localStorage.setItem(KEY, JSON.stringify({ lastDate: today, days }))
      return days
    } catch { return 1 }
  }

  return { getStreak, recordToday }
}


function useRitualsState(userId, awardLumens) {
  const [degradation,      setDegradation]      = useState(null)
  const [completedRituals, setCompletedRituals] = useState({})
  const [showQuiz,         setShowQuiz]         = useState(false)

  const todayKey = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!userId) return

    // 1. Dégradation du jour — source de vérité = Supabase (table daily_quiz)
    supabase
      .from('daily_quiz')
      .select('degradation')
      .eq('user_id', userId)
      .eq('date', todayKey)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data?.degradation) {
          setDegradation(data.degradation)
        } else {
          // Pas de bilan aujourd'hui — chercher le dernier bilan connu
          const { data: last } = await supabase
            .from('daily_quiz')
            .select('degradation')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (last?.degradation) setDegradation(last.degradation)
          setShowQuiz(true)
        }
      })

    // 2. Rituels complétés aujourd'hui — source de vérité = Supabase
    supabase
      .from('rituals')
      .select('ritual_id')
      .eq('user_id', userId)
      .gte('completed_at', todayKey + 'T00:00:00')
      .not('ritual_id', 'is', null)
      .then(({ data }) => {
        if (data?.length) {
          const completed = {}
          data.forEach(r => { completed[r.ritual_id] = true })
          setCompletedRituals(completed)
        }
      })
  }, [userId])

  const handleQuizComplete = (deg) => {
    setDegradation(deg)
    setShowQuiz(false)

    // Mapping zone quiz → colonne DB
    const ZONE_MAP = {
      roots:   'zone_racines',
      stem:    'zone_tige',
      leaves:  'zone_feuilles',
      flowers: 'zone_fleurs',
      breath:  'zone_souffle',
    }

    supabase
      .from('daily_quiz')
      .upsert({ user_id: userId, date: todayKey, degradation: deg }, { onConflict: 'user_id,date' })
      .then(async ({ error }) => {
        if (!error && awardLumens) {
          const { data: existing } = await supabase
            .from('lumen_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('reason', 'bilan_matin')
            .gte('created_at', todayKey + 'T00:00:00.000Z')
            .maybeSingle()
          if (!existing) {
            awardLumens(3, 'bilan_matin', { date: todayKey })
          }
        }

        // Synchronise plants avec le plancher issu du quiz
        // → le quiz ne descend jamais sous ce que les rituels ont déjà construit
        const { data: currentPlant } = await supabase
          .from('plants')
          .select('id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId)
          .eq('date', todayKey)
          .maybeSingle()

        if (!currentPlant) return

        const patch = {}
        Object.entries(ZONE_MAP).forEach(([zone, col]) => {
          const floor   = Math.max(5, 100 - (deg[zone] ?? 50))
          const current = currentPlant[col] ?? 5
          if (floor > current) patch[col] = floor
        })

        if (Object.keys(patch).length === 0) return

        // Recalcule health = moyenne des zones après patch
        const cols = Object.values(ZONE_MAP)
        const avg  = Math.round(
          cols.reduce((sum, col) => sum + (patch[col] ?? currentPlant[col] ?? 5), 0) / cols.length
        )
        patch.health = Math.max(currentPlant.health ?? 5, avg)

        await supabase.from('plants').update(patch).eq('id', currentPlant.id)
        setPlantOverride(prev => ({ ...(prev ?? currentPlant), ...patch }))
      })
  }

  const handleToggleRitual = (ritualId) => {
    setCompletedRituals(prev => {
      if (prev[ritualId]) return prev  // déjà fait — immuable
      return { ...prev, [ritualId]: true }
    })
  }

  return { degradation, completedRituals, showQuiz, setShowQuiz, handleQuizComplete, handleToggleRitual }
}

// ── ExerciseDetail ──────────────────────────────────────────
function RitualExercises({ ritual, zone, onComplete, onBack, initialMode }) {
  const [mode,     setMode]     = useState(initialMode ?? null)
  const [activeEx, setActiveEx] = useState(null)

  if (activeEx) return <ExerciseDetail exercise={activeEx} zone={zone} onDone={onComplete} onBack={() => setActiveEx(null)} />

  if (!mode) return (
    <div style={{ animation:'fadeUp 0.3s ease both' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'rgba(var(--ritual-modal-text-rgb),0.45)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', padding:0, letterSpacing:'0.05em' }}>← Retour</button>
        <button onClick={onBack} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--ritual-modal-text-rgb),0.6)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style={{ fontSize:'var(--fs-emoji-md, 26px)' }}>{ritual.icon}</span>
        <h3 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h2, 20px)', color:'var(--ritual-modal-text)', fontWeight:400, lineHeight:1.1 }}>{ritual.text}</h3>
      </div>
      <p style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.35)', fontStyle:'italic', marginBottom:22, lineHeight:1.5 }}>Comment souhaitez-vous aborder ce rituel aujourd'hui ?</p>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        <button onClick={onComplete} style={{ padding:'14px 16px', borderRadius:12, textAlign:'left', cursor:'pointer', border:`1px solid ${zone.color}35`, background:`${zone.color}0C`, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink:0 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color:zone.accent, fontWeight:500, marginBottom:2 }}>Je sais quoi faire</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.4)' }}>Je le marque comme accompli directement.</div>
          </div>
          <span style={{ color:'rgba(var(--ritual-modal-text-rgb),0.25)', fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>
        <button onClick={() => setMode('quick')} style={{ padding:'14px 16px', borderRadius:12, textAlign:'left', cursor:'pointer', border:'1px solid var(--surface-3)', background:'var(--surface-1)', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink:0 }}>💡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--ritual-modal-text)', fontWeight:500, marginBottom:2 }}>J'ai besoin d'un coup de pouce</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.4)' }}>3 exercices rapides · 1 à 3 minutes</div>
          </div>
          <span style={{ color:'rgba(var(--ritual-modal-text-rgb),0.25)', fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>
        <button onClick={() => setMode('deep')} style={{ padding:'14px 16px', borderRadius:12, textAlign:'left', cursor:'pointer', border:'1px solid var(--surface-3)', background:'var(--surface-1)', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink:0 }}>🌿</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--ritual-modal-text)', fontWeight:500, marginBottom:2 }}>Je prends du temps pour ça</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.4)' }}>3 pratiques profondes · 10 à 30 minutes</div>
          </div>
          <span style={{ color:'rgba(var(--ritual-modal-text-rgb),0.25)', fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>
      </div>
    </div>
  )

  const exercises  = mode === 'quick' ? ritual.quick : ritual.deep
  const modeLabel  = mode === 'quick' ? 'Coup de pouce · 1–3 min' : 'Pratique profonde · 10–30 min'
  const modeColor  = mode === 'quick' ? 'var(--gold)' : 'var(--zone-breath)'

  return (
    <div style={{ animation:'fadeUp 0.28s ease both' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button onClick={() => setMode(null)} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'rgba(var(--ritual-modal-text-rgb),0.45)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', padding:0, letterSpacing:'0.05em' }}>← Retour</button>
        <button onClick={onBack} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--ritual-modal-text-rgb),0.6)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
      </div>
      <div style={{ marginBottom:6 }}>
        <span style={{ fontSize:'var(--fs-h5, 10px)', textTransform:'uppercase', letterSpacing:'0.12em', color:modeColor, fontWeight:500 }}>{modeLabel}</span>
      </div>
      <h3 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h3, 18px)', color:'var(--ritual-modal-text)', fontWeight:400, marginBottom:18, lineHeight:1.2 }}>Choisissez un exercice</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {exercises.map((ex, i) => (
          <button key={i} onClick={() => setActiveEx(ex)} style={{ padding:'14px 15px', borderRadius:12, textAlign:'left', cursor:'pointer', border:'1px solid var(--surface-3)', background:'var(--surface-1)', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink:0 }}>{ex.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--ritual-modal-text)', fontWeight:500, marginBottom:2 }}>{ex.title}</div>
              <span style={{ fontSize:'var(--fs-h5, 10px)', color:modeColor, fontWeight:500, background:`${modeColor}18`, padding:'2px 8px', borderRadius:10 }}>⏱ {ex.dur}</span>
            </div>
            <span style={{ color:'rgba(var(--ritual-modal-text-rgb),0.25)', fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── RitualZoneModal ─────────────────────────────────────────
// ── QuickExerciseModal — affiche uniquement l'exercice final quick[0] ────────
function QuickExerciseModal({ quickRitual, onClose, onToggleRitual }) {
  if (!quickRitual?.quick?.[0]) return null
  const zone = PLANT_ZONES[quickRitual.zoneId]
  const exercise = quickRitual.quick[0]

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay)', backdropFilter:'blur(10px)', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width:'100%', maxWidth:480, background:'var(--modal-surface)', border:'1px solid rgba(var(--green-rgb),0.13)', borderRadius:22, padding:'28px 26px', animation:'fadeUp 0.28s ease' }}>
        <ExerciseDetail
          exercise={exercise}
          zone={zone}
          onDone={() => { onToggleRitual?.(quickRitual.ritualId); onClose() }}
          onBack={onClose}
        />
      </div>
    </div>
  )
}

function RitualZoneModal({ zoneId, completed, onToggle, onClose, initialRitualId, initialMode }) {
  const zone    = PLANT_ZONES[zoneId]
  const rituals = PLANT_RITUALS[zoneId] || []
  const done    = rituals.filter(r => completed[r.id]).length
  const pct     = rituals.length > 0 ? done / rituals.length * 100 : 0
  const [activeRitual, setActiveRitual] = useState(
    initialRitualId ? (rituals.find(r => r.id === initialRitualId) ?? null) : null
  )

  const handleComplete = (ritualId) => { onToggle(ritualId); setActiveRitual(null) }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay)', backdropFilter:'blur(12px)', padding:'20px' }} onClick={!activeRitual ? onClose : undefined}>
      <div style={{ width:'100%', maxWidth:520, borderRadius:22, padding:'28px 28px 36px', border:'1px solid var(--track)', background:`linear-gradient(175deg,var(--ritual-modal-bg-start, #06100A) 0%,var(--ritual-modal-bg-end, #030808) 100%)`, maxHeight:'85vh', overflowY:'auto', animation:'fadeUp 0.3s cubic-bezier(0.34,1.4,0.64,1)' }} onClick={e => e.stopPropagation()}>
        {activeRitual ? (
          <RitualExercises ritual={activeRitual} zone={zone} onComplete={() => handleComplete(activeRitual.id)} onBack={() => setActiveRitual(null)} initialMode={initialMode} zoneAlreadyDone={rituals.some(r => completed[r.id])} />
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <span style={{ fontSize:'var(--fs-h5, 10px)', textTransform:'uppercase', letterSpacing:'0.12em', color:zone.color, fontWeight:500, display:'block', marginBottom:4 }}>{zone.subtitle}</span>
                <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h1, 28px)', color:'var(--ritual-modal-text)', fontWeight:300, lineHeight:1.05 }}>{zone.name}</h2>
              </div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:'var(--fs-h4, 13px)', color:'rgba(var(--ritual-modal-text-rgb),0.4)', display:'block' }}>{done}/{rituals.length} rituels</span>
                </div>
                <button onClick={onClose} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--ritual-modal-text-rgb),0.6)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
              </div>
            </div>
            <div style={{ height:3, borderRadius:2, background:'var(--track)', marginBottom:22, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:2, background:`linear-gradient(90deg,${zone.color},${zone.accent})`, width:`${pct}%`, transition:'width 0.7s ease' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {rituals.map(r => {
                const isDone = !!completed[r.id]
                const fs = r.text.length > 32 ? 22 : r.text.length > 24 ? 25 : 28
                return (
                  <button key={r.id} onClick={() => { if (!isDone) setActiveRitual(r) }}
                    style={{ display:'flex', alignItems:'stretch', gap:0, padding:0, borderRadius:14,
                      border:`1px solid ${isDone ? zone.color+'45' : 'var(--surface-3)'}`,
                      background: isDone ? `${zone.color}0e` : 'var(--surface-1)',
                      cursor: isDone ? 'default' : 'pointer', textAlign:'left',
                      transition:'all 0.22s', opacity: isDone ? 0.7 : 1, overflow:'hidden' }}>

                    {/* Bande couleur gauche */}
                    <div style={{ width:4, flexShrink:0, background: isDone ? zone.color+'60' : zone.color+'25', borderRadius:'14px 0 0 14px' }} />

                    {/* Contenu */}
                    <div style={{ flex:1, padding:'22px 18px 18px', display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
                      <div style={{
                        fontSize: fs,
                        color: isDone ? 'rgba(var(--ritual-modal-text-rgb),0.70)' : 'var(--ritual-modal-text)',
                        fontWeight: 300,
                        lineHeight: 1.3,
                        letterSpacing: fs >= 20 ? '-0.02em' : '-0.01em',
                        fontFamily: "'Jost', sans-serif",
                      }}>{r.text}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'var(--fs-h5, 10px)', color: isDone ? zone.color+'aa' : 'rgba(var(--ritual-modal-text-rgb),0.25)', letterSpacing:'0.04em' }}>
                          {isDone ? '✓ Complété' : `${r.icon}  Explorer →`}
                        </span>
                        <div style={{ width:20, height:20, borderRadius:'50%',
                          border:`1.5px solid ${isDone ? zone.color : 'var(--separator)'}`,
                          background: isDone ? `${zone.color}30` : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isDone && <span style={{ fontSize:'var(--fs-h5, 9px)', color:zone.accent, fontWeight:700 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={onClose} style={{ marginTop:22, width:'100%', padding:'13px', borderRadius:12, border:`1px solid ${zone.color}40`, background:`${zone.color}10`, color:zone.accent, fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'0.06em', cursor:'pointer', fontFamily:"'Jost',sans-serif", transition:'all 0.2s' }}>
              ✓ Enregistrer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── DailyQuizModal ──────────────────────────────────────────
// ── Calcule les zones prioritaires depuis la dégradation ──────────────────────
function getBilanRecommendation(degradation) {
  if (!degradation || typeof degradation !== 'object') return { type:'good', message:'', sub:'', zones:[] }
  const ZONE_LABELS = {
    roots:   { name:'les Racines',  emoji:'🌿', desc:'ancrage et énergie vitale' },
    stem:    { name:'la Tige',      emoji:'🌱', desc:'flexibilité et corps' },
    leaves:  { name:'les Feuilles', emoji:'🍃', desc:'lien aux autres et humeur' },
    flowers: { name:'les Fleurs',   emoji:'🌸', desc:'rapport à soi' },
    breath:  { name:'le Souffle',   emoji:'🌬️', desc:'stress et présence' },
  }
  // Trie les zones par dégradation décroissante
  const sorted = Object.entries(degradation)
    .sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).filter(([, v]) => v >= 40)
  const allGood = sorted[0][1] < 30

  if (allGood) return {
    type: 'good',
    message: "Votre jardin intérieur est dans un bel équilibre ce matin.",
    sub: "Tous vos rituels méritent votre attention aujourd'hui — choisissez celui qui vous attire.",
    zones: [],
  }

  const zones = top.map(([id]) => ZONE_LABELS[id]).filter(Boolean)
  const zoneNames = zones.map(z => z.name).join(' et ')

  return {
    type: 'focus',
    message: `D'après votre bilan, ${zoneNames} ${zones.length > 1 ? 'semblent' : 'semble'} avoir besoin de votre attention aujourd'hui.`,
    sub: "Nous vous suggérons de commencer par les rituels de " + zones.map(z => `${z.emoji} ${z.desc}`).join(', ') + ".",
    zones: top.map(([id]) => id),
  }
}
function BilanClosingPhrase({ answers, degradation }) {
  const [phrase,  setPhrase]  = useState(null)
  const [loading, setLoading] = useState(true)

  const cacheKey = 'bilan-closing-v1-'
    + new Date().toISOString().slice(0, 10)
    + '-' + Object.values(answers).join('')

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) { setPhrase(cached); setLoading(false); return }
    } catch {}

    const answersSummary = PLANT_QUESTIONS.map(q => {
      const idx = answers[q.id]
      if (idx === undefined) return null
      return { zone: q.zone, theme: q.theme, answer: q.answers[idx].label }
    }).filter(Boolean)

    fetch(SUPABASE_FN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:          'generate_closing_phrase',
        answers_summary: answersSummary,
        degradation,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const p = data.phrase ?? null
        setPhrase(p)
        if (p) try { sessionStorage.setItem(cacheKey, p) } catch {}
      })
      .catch(() => setPhrase(null))
      .finally(() => setLoading(false))
  }, [])

if (loading) return (
  <div style={{
    padding:'18px 22px', borderRadius:14,
    background:'rgba(var(--gold-warm-rgb),0.06)',
    border:'1px solid rgba(var(--gold-warm-rgb),0.18)',
    display:'flex', flexDirection:'column',
    alignItems:'center', gap:10,
    minHeight:90, justifyContent:'center',
  }}>
    <style>{`
      @keyframes grow {
        0%,100% { transform: scaleY(0.6); opacity:.4 }
        50%      { transform: scaleY(1.0); opacity:1 }
      }
    `}</style>

    {/* Petite plante qui grandit */}
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:22 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:3, borderRadius:2,
          height: [10,16,22,16,10][i],
          background:'rgba(var(--gold-warm-rgb),0.50)',
          transformOrigin:'bottom',
          animation:`grow 1.6s ease-in-out infinite`,
          animationDelay: (i * 0.18) + 's',
        }}/>
      ))}
    </div>

    <span style={{
      fontSize:'var(--fs-h5, 11px)',
      color:'rgba(var(--quiz-modal-text-rgb),0.35)',
      fontStyle:'italic', letterSpacing:'.03em',
    }}>
      Votre jardin vous répond…
    </span>
  </div>
)

  if (!phrase) return null

  return (
    <div style={{
      padding:'18px 22px', borderRadius:14,
      background:'rgba(var(--gold-warm-rgb),0.06)',
      border:'1px solid rgba(var(--gold-warm-rgb),0.18)',
      animation:'fadeUp 0.5s ease both',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', left:0, top:'20%', bottom:'20%',
        width:2, borderRadius:2,
        background:'linear-gradient(180deg, transparent, rgba(var(--gold-warm-rgb),0.5), transparent)',
      }}/>
      <p style={{
        fontFamily:"'Cormorant Garamond','Georgia',serif",
        fontSize:'clamp(15px, 1.4vw, 19px)',
        color:'rgba(var(--ritual-modal-text-rgb),0.85)',
        lineHeight:1.7, fontStyle:'italic', fontWeight:300,
        margin:0, paddingLeft:14,
      }}>
        {phrase}
      </p>
    </div>
  )
}
function DailyQuizModal({ onComplete, onDismiss, onSkip }) {
  const [step,          setStep]          = useState(-1)
  const [answers,       setAnswers]       = useState({})
  const [selected,      setSelected]      = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [visible,       setVisible]       = useState(true)
  const [result,        setResult]        = useState(null)  // écran de résultat
  const isMobile = useIsMobile()

  const startQuiz = () => { setVisible(false); setTimeout(() => { setStep(0); setVisible(true) }, 250) }
const choose = (idx) => {
  if (transitioning) return
  setSelected(idx)
  // Auto-avance après 320ms — laisse le temps de voir la sélection
  setTimeout(() => {
    setTransitioning(true); setVisible(false)
    const q          = PLANT_QUESTIONS[step]
    const newAnswers = { ...answers, [q.id]: idx }
    setTimeout(() => {
      if (step < PLANT_QUESTIONS.length - 1) {
        setStep(s => s + 1); setAnswers(newAnswers); setSelected(null); setTransitioning(false); setVisible(true)
      } else {
        const deg = computeDegradation(newAnswers)
        setResult({ deg, answers: newAnswers, recommendation: getBilanRecommendation(deg) })
      }
    }, 280)
  }, 320)
}
 

  // ── Écran de résultat ────────────────────────────────────────────────────────
  if (result) {
    const { deg, answers, recommendation } = result
    const ZONE_COLORS = { roots:'var(--zone-roots)', stem:'var(--zone-stem)', leaves:'var(--zone-breath)', flowers:'var(--zone-flowers)', breath:'var(--lumens)' }
    const ZONE_NAMES  = { roots:'Racines', stem:'Tige', leaves:'Feuilles', flowers:'Fleurs', breath:'Souffle' }
    return (
      <div style={{ position:'fixed', inset:0, zIndex:500, background: isMobile ? 'var(--quiz-modal-bg)' : 'rgba(0,0,0,0.55)', backdropFilter: isMobile ? 'none' : 'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width: isMobile ? '100%' : 480, height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '88vh', borderRadius: isMobile ? 0 : 20, background:'var(--quiz-modal-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', overflowY:'auto', padding:'40px 28px', boxShadow: isMobile ? 'none' : '0 24px 60px rgba(0,0,0,0.45)', animation:'fadeUp 0.35s ease both' }}>
          <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>

            {/* Icône */}
            <div style={{ fontSize:'var(--fs-emoji-lg, 48px)', marginBottom:20 }}>
              {recommendation.type === 'good' ? '✨' : '🌿'}
            </div>

            {/* Message principal */}
            <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h2, 26px)', color:'var(--quiz-modal-text)', fontWeight:300, lineHeight:1.3, marginBottom:12 }}>
              {recommendation.message}
            </h2>

            <div style={{ width:40, height:1, background:'rgba(var(--gold-warm-rgb),0.3)', margin:'16px auto' }} />

            {/* Phrase personnalisée */}
            <BilanClosingPhrase answers={answers} degradation={deg} />

            {/* CTA */}
            <button
              onClick={() => { onComplete(result.deg, {}); onDismiss?.() }}
              style={{ width:'100%', padding:'14px 40px', borderRadius:50, border:'1px solid rgba(var(--green-rgb),0.35)', background:'rgba(var(--green-rgb),0.1)', color:'var(--green)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', letterSpacing:'0.08em', marginBottom:10, marginTop:24, fontFamily:"'Jost',sans-serif" }}
            >
              Voir mes rituels du jour →
            </button>
            <button
              onClick={onSkip}
              style={{ padding:10, borderRadius:50, border:'none', background:'none', color:'rgba(var(--quiz-modal-text-rgb),0.3)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', width:'100%', fontFamily:"'Jost',sans-serif" }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Écran d'accueil
  if (step === -1) return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background: isMobile ? 'var(--quiz-modal-bg)' : 'rgba(0,0,0,0.55)', backdropFilter: isMobile ? 'none' : 'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width: isMobile ? '100%' : 480, height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '88vh', borderRadius: isMobile ? 0 : 20, background:'var(--quiz-modal-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:'40px 28px', boxShadow: isMobile ? 'none' : '0 24px 60px rgba(0,0,0,0.45)', position:'relative' }}>
        <button onClick={onSkip} style={{ position:'absolute', top:16, right:16, background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--quiz-modal-text-rgb),0.6)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
        <div style={{ textAlign:'center', maxWidth:340, opacity: visible ? 1 : 0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:'var(--fs-emoji-lg, 52px)', marginBottom:24, display:'inline-block', animation:'pulse 3s ease-in-out infinite' }}>🌹</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h1, 36px)', color:'var(--quiz-modal-text)', fontWeight:300, lineHeight:1.1, marginBottom:12 }}>Comment vous<br /><em style={{ fontStyle:'italic', color:'var(--gold-warm)' }}>sentez-vous</em> aujourd'hui ?</h2>
          <div style={{ width:40, height:1, background:'rgba(var(--gold-warm-rgb),0.3)', margin:'16px auto' }} />
          <p style={{ color:'rgba(var(--quiz-modal-text-rgb),0.5)', fontSize:'var(--fs-h4, 13px)', lineHeight:1.7, marginBottom:6 }}>Dix questions pour prendre votre pouls intérieur.</p>
          <p style={{ color:'rgba(var(--quiz-modal-text-rgb),0.3)', fontSize:'var(--fs-h5, 11px)', lineHeight:1.7, marginBottom:32 }}>Votre plante reflétera votre état et révèlera les zones à soigner en priorité.</p>
          <button onClick={startQuiz} style={{ padding:'13px 40px', borderRadius:50, border:'1px solid rgba(var(--gold-warm-rgb),0.35)', background:'rgba(var(--gold-warm-rgb),0.1)', color:'var(--gold-warm)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', letterSpacing:'0.08em', display:'block', width:'100%', marginBottom:10 }}>Commencer le bilan</button>
          <button onClick={onSkip} style={{ padding:10, borderRadius:50, border:'none', background:'none', color:'rgba(var(--quiz-modal-text-rgb),0.3)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', letterSpacing:'0.05em', width:'100%' }}>Passer pour aujourd'hui</button>
          <p style={{ color:'rgba(var(--quiz-modal-text-rgb),0.2)', fontSize:'var(--fs-h5, 10px)', marginTop:12 }}>Environ 2 minutes · Confidentiel</p>
        </div>
      </div>
    </div>
  )

  const q        = PLANT_QUESTIONS[step]
  const zone     = PLANT_ZONES[q.zone]
  const progress = (step + 1) / PLANT_QUESTIONS.length

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background: isMobile ? 'var(--quiz-modal-bg)' : 'rgba(0,0,0,0.55)', backdropFilter: isMobile ? 'none' : 'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width: isMobile ? '100%' : 480, height: isMobile ? '100%' : '88vh', maxHeight:'88vh', borderRadius: isMobile ? 0 : 20, background:'var(--quiz-modal-bg)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow: isMobile ? 'none' : '0 24px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ display:'flex', gap:3, padding:'12px 20px 0', flexShrink:0 }}>
          {PLANT_QUESTIONS.map((_, i) => {
            const done    = i < step
            const current = i === step
            const zColor  = PLANT_ZONES[PLANT_QUESTIONS[i].zone].color
            return (
              <div key={i} style={{
                flex:1, height:3, borderRadius:2,
                background: done ? zColor : current ? zColor + '55' : 'var(--surface-3)',
                transition:'background 0.4s ease',
              }}/>
            )
          })}
        </div>
        <div style={{ padding:'16px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'var(--fs-h5, 10px)', textTransform:'uppercase', letterSpacing:'0.12em', color:zone.color, opacity:0.8, fontWeight:500 }}>{zone.name} · {q.theme}</span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--quiz-modal-text-rgb),0.3)' }}>{step+1} <span style={{ opacity:0.4 }}>/ 10</span></span>
            <button onClick={onSkip} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--quiz-modal-text-rgb),0.6)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
          </div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 24px', maxWidth:440, width:'100%', margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition:'opacity 0.28s ease, transform 0.28s ease' }}>
          <div style={{ fontSize:'var(--fs-emoji-lg, 36px)', marginBottom:12 }}>{q.icon}</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h2, 24px)', color:'var(--quiz-modal-text)', fontWeight:400, lineHeight:1.25, marginBottom:6 }}>{q.text}</h3>
          <p style={{ fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--quiz-modal-text-rgb),0.4)', lineHeight:1.6, marginBottom:20, fontStyle:'italic' }}>{q.sub}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {q.answers.map((ans, i) => {
              const sel = selected === i
              return (
                <button key={i} onClick={() => choose(i)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, textAlign:'left', cursor:'pointer', border:`1px solid ${sel ? zone.color+'55' : 'var(--track)'}`, background: sel ? 'rgba(var(--green-rgb),0.08)' : 'var(--surface-1)', boxShadow: sel ? `0 0 0 1px ${zone.color}30` : 'none', transition:'all 0.18s ease' }}>
                  <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>{ans.emoji}</span>
                  <span style={{ flex:1, fontSize:'var(--fs-h4, 13px)', color: sel ? 'var(--quiz-modal-text)' : 'rgba(var(--quiz-modal-text-rgb),0.6)', fontWeight: sel ? 500 : 300 }}>{ans.label}</span>
                  <div style={{ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${sel ? zone.color : 'var(--separator)'}`, background: sel ? `${zone.color}30` : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s', flexShrink:0 }}>
                    {sel && <div style={{ width:6, height:6, borderRadius:'50%', background:zone.accent }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


// ── BilanInsightCard — texte IA parallèle plante / personne ──
const SLIDE_INSIGHT_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/slide-insight'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

function BilanInsightCard({ degradation, plant, userId, fillHeight = false }) {
  const [insight,  setInsight]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(false)
  const containerRef = useRef(null)
  const textRef      = useRef(null)

  const cacheKey = 'bilan-insight-v3-' + new Date().toISOString().slice(0, 10) + '-' + (plant?.health ?? 0)

  useEffect(() => {
    if (!userId) return
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) { setInsight(cached); return }
    } catch {}
    setLoading(true)
    setError(false)
    fetch(SLIDE_INSIGHT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ userId, slide: 'bilan' }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data.message || data.insight
        if (text) {
          setInsight(text)
          try { sessionStorage.setItem(cacheKey, text) } catch {}
        } else { setError(true) }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [cacheKey])

  // Supprime l'ancien algo de fit — remplacé par CSS clamp + fondu

  const rec          = getBilanRecommendation(degradation)
  const ZONE_COLORS  = { roots:'var(--zone-roots)', stem:'var(--zone-stem)', leaves:'var(--zone-breath)', flowers:'var(--zone-flowers)', breath:'var(--lumens)' }
  const ZONE_NAMES   = { roots:'Racines', stem:'Tige', leaves:'Feuilles', flowers:'Fleurs', breath:'Souffle' }
  const primaryColor = rec.zones.length > 0 ? (ZONE_COLORS[rec.zones[0]] ?? 'var(--green)') : 'var(--green)'
  const isGood       = rec.type === 'good'

  return (
    <div ref={containerRef}
      style={{
        padding:'10px 14px', borderRadius:12,
        background: isGood ? 'rgba(var(--green-rgb),0.05)' : `${primaryColor}07`,
        border:`1px solid ${isGood ? 'rgba(var(--green-rgb),0.20)' : primaryColor + '30'}`,
        animation:'fadeUp 0.4s ease both',
        ...(fillHeight
          ? { flex:'1 1 0', display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }
          : {}
        ),
      }}>

      {/* En-tête */}
      <div className="bic-header" style={{ display:'flex', alignItems:'center', gap:8, marginBottom: (loading || insight) ? 8 : 0, flexShrink:0 }}>
        <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>{isGood ? '✨' : '🌿'}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'var(--fs-h4, 13px)', color: isGood ? 'rgba(var(--green-rgb),0.90)' : primaryColor, fontWeight:600, letterSpacing:'0.04em' }}>
            {isGood ? 'Votre jardin est en équilibre' : 'Votre jardin intérieur vous parle'}
          </div>
        </div>
        {!isGood && rec.zones.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
            <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', letterSpacing:'0.05em', fontStyle:'italic', whiteSpace:'nowrap' }}>
              Zone(s) à prendre soin :
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {rec.zones.map(zoneId => (
                <span key={zoneId} style={{ fontSize:'var(--fs-h5, 10px)', padding:'2px 8px', borderRadius:50, background:`${ZONE_COLORS[zoneId]}18`, border:`1px solid ${ZONE_COLORS[zoneId]}40`, color:ZONE_COLORS[zoneId], fontWeight:500 }}>
                  {ZONE_NAMES[zoneId]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Texte IA */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:4, height:4, borderRadius:'50%', background: isGood ? 'rgba(var(--green-rgb),0.5)' : primaryColor + '80', animation:'navPulse 1.4s ease-in-out infinite', animationDelay: (i * 0.2) + 's' }} />
            ))}
          </div>
          <span style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.35)', fontStyle:'italic' }}>Lecture de votre jardin…</span>
        </div>
      )}

      {!loading && insight && (
        <div style={{
          ...(fillHeight ? { flex:'1 1 0', minHeight:0, overflow:'hidden' } : {}),
        }}>
          <p ref={textRef}
            style={{
              fontSize:'clamp(13px, 1.2vw, 16px)',
              color:'var(--text2)',
              lineHeight:1.65,
              margin:0,
              fontStyle:'italic',
              ...(fillHeight ? { height:'100%', overflow:'hidden' } : {}),
            }}>
            {insight}
          </p>
        </div>
      )}

      {!loading && error && (
        <p style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.30)', lineHeight:1.6, margin:0, fontStyle:'italic' }}>
          Votre jardin a été entendu. Explorez les rituels qui vous appellent aujourd'hui.
        </p>
      )}
    </div>
  )
}

// ── useQuickRitual — zone la plus faible + rituel le plus fréquent ──────────────
function useQuickRitual(userId, todayPlant, completedRituals) {
  const [quickRitual, setQuickRitual] = useState(null)
  const [loadingQuick, setLoading]    = useState(true)

  useEffect(() => {
    if (!userId || !todayPlant) { setLoading(false); return }
    let cancelled = false

    async function compute() {
      setLoading(true)
      const zoneEntries = Object.entries(ZONE_DB_KEY).map(([zoneId, dbKey]) => ({
        zoneId,
        value: todayPlant[dbKey] ?? 5,
        allDone: (PLANT_RITUALS[zoneId] ?? []).every(r => completedRituals[r.id]),
      }))
      const available = zoneEntries.filter(z => !z.allDone)
      if (!available.length) { if (!cancelled) { setQuickRitual(null); setLoading(false) }; return }
      const weakest = available.sort((a, b) => a.value - b.value)[0]

      const since = new Date(Date.now() - 60 * 86400000).toISOString()
      const { data: hist } = await supabase
        .from('rituals').select('ritual_id').eq('user_id', userId)
        .eq('zone', PLANT_ZONES[weakest.zoneId].name)
        .not('ritual_id', 'is', null).gte('completed_at', since)

      let bestId = null
      if (hist?.length) {
        const counts = {}
        hist.forEach(r => { counts[r.ritual_id] = (counts[r.ritual_id] ?? 0) + 1 })
        bestId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      }

      const defs = PLANT_RITUALS[weakest.zoneId] ?? []
      const ritual =
        (bestId ? defs.find(r => r.id === bestId && !completedRituals[r.id]) : null) ??
        defs.find(r => !completedRituals[r.id]) ??
        defs[0]

      if (!cancelled && ritual) setQuickRitual({ zoneId: weakest.zoneId, ritual })
      if (!cancelled) setLoading(false)
    }

    compute()
    return () => { cancelled = true }
  }, [userId, todayPlant?.id, JSON.stringify(completedRituals)])

  return { quickRitual, loadingQuick }
}

// ── RitualsSection ──────────────────────────────────────────
function RitualsSection({ userId, degradation, completedRituals, onToggleRitual, onQuizComplete, todayPlant, onOpenBilan, bilanDoneToday }) {
  const isMobile = useIsMobile()
  const [showQuiz,   setShowQuiz]   = useState(false)
  const [activeZone, setActiveZone] = useState(null)
  const [activeInitialRitualId, setActiveInitialRitualId] = useState(null)
  const [activeInitialMode, setActiveInitialMode] = useState(null)

  // ── Rituel rapide : calcul synchrone immédiat + affinage async ─────────────
  // Exclut les zones dont le rituel quick a déjà été complété aujourd'hui
  const [quickRitual, setQuickRitual] = useState(null)
  const [quickLoading, setQuickLoading] = useState(false)  // pas de spinner — affichage immediat
  const [showQuickModal, setShowQuickModal] = useState(false)

  // Nombre de zones déjà accomplies via action rapide (1 par zone, 5 zones max)
  const quickZonesDone = Object.entries(ZONE_DB_KEY).filter(([zoneId]) => {
    const rituals = PLANT_RITUALS[zoneId] ?? []
    return rituals.some(r => completedRituals[r.id])
  }).length
  const quickZonesRemaining = 5 - quickZonesDone

  useEffect(() => {
    if (!userId || !todayPlant) return
    let cancelled = false

    // ── PHASE 1 : synchrone — zone la plus faible parmi celles non encore accomplies ────
    const entries = Object.entries(ZONE_DB_KEY)
      .map(([zoneId, dbKey]) => ({
        zoneId, dbKey, val: todayPlant[dbKey] ?? 5,
        // Zone "faite" si au moins un de ses rituels est complété
        done: (PLANT_RITUALS[zoneId] ?? []).some(r => completedRituals[r.id]),
      }))
      .filter(e => !e.done)   // exclure les zones déjà accomplies
      .sort((a, b) => a.val - b.val)

    if (!entries.length) { setQuickRitual(null); return }  // toutes les zones faites

    const weakest = entries[0]
    const zone    = PLANT_ZONES[weakest.zoneId]
    const defs    = PLANT_RITUALS[weakest.zoneId] ?? []
    const firstRitual = defs[0]
    if (firstRitual) {
      setQuickRitual({
        zoneId:     weakest.zoneId,
        zoneName:   zone.name,
        zoneColor:  zone.color,
        zoneAccent: zone.accent,
        zoneBg:     zone.modalBg,
        zoneValue:  weakest.val,
        ritualId:   firstRitual.id,
        ritualText: firstRitual.text,
        ritualIcon: firstRitual.icon,
        quick:      firstRitual.quick ?? [],
      })
    }

    // ── PHASE 2 : async — affine vers le rituel le plus souvent pratiqué ──────
    async function refine() {
      const { data: hist } = await supabase
        .from('rituals').select('ritual_id')
        .eq('user_id', userId).eq('zone', zone.name)
        .not('ritual_id', 'is', null).limit(100)
      if (cancelled || !hist?.length) return
      const counts = {}
      hist.forEach(r => { counts[r.ritual_id] = (counts[r.ritual_id] ?? 0) + 1 })
      const bestId  = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const bestRitual = (bestId ? defs.find(r => r.id === bestId) : null) ?? firstRitual
      if (!cancelled && bestRitual) {
        setQuickRitual(prev => prev ? {
          ...prev,
          ritualId:   bestRitual.id,
          ritualText: bestRitual.text,
          ritualIcon: bestRitual.icon,
          quick:      bestRitual.quick ?? [],
        } : null)
      }
    }
    refine()
    return () => { cancelled = true }
  }, [userId, todayPlant?.id, completedRituals])

  const hasDegradation = degradation !== null && degradation !== undefined

  const sortedZones = ['roots', 'stem', 'leaves', 'flowers', 'breath']

  const handleQuizComplete = (deg) => { setShowQuiz(false); onQuizComplete(deg) }
  const handleQuizSkip     = () => { setShowQuiz(false); onQuizComplete({ roots:50, stem:50, leaves:50, flowers:50, breath:50 }) }

  // Compteur global de rituels complétés aujourd'hui
  const totalRituals = Object.values(PLANT_RITUALS).flat().length
  const doneCount    = Object.values(completedRituals).filter(Boolean).length

  return (
    <>
      {/* DailyQuizModal géré dans DashboardPage */}
      {activeZone && <RitualZoneModal zoneId={activeZone} completed={completedRituals} onToggle={onToggleRitual} onClose={() => { setActiveZone(null); setActiveInitialRitualId(null); setActiveInitialMode(null) }} initialRitualId={activeInitialRitualId} initialMode={activeInitialMode} />}

      <div style={{ width:'100%' }}>
        {/* En-tête section */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 20px)', fontWeight:400, color:'var(--text2)', marginBottom:4 }}>
              Prenez soin de vous
            </p>
            <p style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', lineHeight:1.5 }}>
              Agissez au quotidien avec vos rituels
              {hasDegradation && <span style={{ color:'var(--text3)', opacity:0.55 }}> · {doneCount}/{totalRituals} accomplis</span>}
            </p>
          </div>
          {bilanDoneToday && hasDegradation && (
            <button
              onClick={() => onOpenBilan?.()}
              style={{ fontSize:'var(--fs-h5, 10px)', color:'rgba(var(--ritual-modal-text-rgb),0.5)', background:'none', border:'1px solid var(--surface-3)', borderRadius:20, padding:'8px 14px', cursor:'pointer', letterSpacing:'0.05em', fontFamily:"'Jost',sans-serif", WebkitTapHighlightColor:'transparent', minHeight:36, touchAction:'manipulation' }}
            >
              ↺ Refaire le bilan
            </button>
          )}
        </div>

        {/* Grille des zones */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', gap: isMobile ? 10 : 9 }}>
          {sortedZones.map((zoneId, index) => {
            const zone      = PLANT_ZONES[zoneId]
            const rituals   = PLANT_RITUALS[zoneId] || []
            const doneCnt   = rituals.filter(r => completedRituals[r.id]).length
            const deg       = hasDegradation ? (degradation[zoneId] ?? 50) : 50
            const dbKey     = ZONE_DB_KEY[zoneId]
            const health    = todayPlant?.[dbKey] ?? 5
            const isPriority= hasDegradation && deg >= 65 && doneCnt === 0
            const allDone   = doneCnt === rituals.length && rituals.length > 0
            const zoneIcons = { roots:'🌱', stem:'🌿', leaves:'🍃', flowers:'🌸', breath:'🌬️' }

            return (
              <button key={zoneId} onClick={() => setActiveZone(zoneId)}
                style={{
                  position:'relative', overflow:'hidden',
                  padding: isMobile ? '12px 12px 10px' : '14px 14px 12px',
                  borderRadius:14, textAlign:'left', cursor:'pointer',
                  background: `color-mix(in srgb, ${zone.color} 8%, var(--zone-card-bg, var(--bg3)))`,
                  border:`1px solid ${isPriority ? zone.color + '50' : allDone ? zone.color + '35' : 'var(--track)'}`,
                  boxShadow: isPriority ? `0 0 18px ${zone.color}22, inset 0 1px 0 ${zone.color}18` : allDone ? `0 0 12px ${zone.color}18` : 'none',
                  width:'100%', display:'flex', flexDirection:'column', gap:0,
                  transition:'all .2s ease',
                }}>

                {/* Lueur de fond sur priorité */}
                {isPriority && (
                  <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%, ${zone.color}18 0%, transparent 70%)`, pointerEvents:'none' }} />
                )}

                {/* Mobile : layout horizontal icône + contenu / Desktop : colonne */}
                {isMobile ? (
                  <>
                    {/* Ligne haute : icône + nom + % alignés */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                        <span style={{ fontSize:'var(--fs-h2, 22px)', lineHeight:1, flexShrink:0 }}>{zoneIcons[zoneId]}</span>
                        <span style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--zone-card-text, var(--text))', fontWeight:700, letterSpacing:'0.04em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{zone.name}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2, flexShrink:0, paddingLeft:8 }}>
                        <span style={{ fontSize:'var(--fs-h3, 18px)', fontFamily:"'Cormorant Garamond',serif", color:'var(--zone-card-text, var(--text))', fontWeight:600, lineHeight:1 }}>{health}<span style={{ fontSize:'var(--fs-h5, 10px)', opacity:0.6 }}>%</span></span>
                        {allDone && <span style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--zone-card-text, var(--text))' }}>✓</span>}
                        {isPriority && !allDone && <span style={{ fontSize:'var(--fs-h5, 8px)', color: zone.color, background:`${zone.color}22`, padding:'1px 6px', borderRadius:10, whiteSpace:'nowrap' }}>⚡ priorité</span>}
                      </div>
                    </div>
                    {/* Barre */}
                    <div style={{ height:3, borderRadius:3, background:'var(--surface-2)', overflow:'hidden', marginBottom:7 }}>
                      <div style={{ height:'100%', width:`${health}%`, background:`linear-gradient(90deg, ${zone.color}70, ${zone.color})`, borderRadius:3, transition:'width .6s ease', boxShadow: health > 50 ? `0 0 6px ${zone.color}80` : 'none' }} />
                    </div>
                    {/* Compteur + flèche */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--zone-card-text-sub, var(--text3))' }}>
                        {doneCnt > 0 ? <span style={{ color: zone.color + 'cc' }}>{doneCnt}</span> : <span>{doneCnt}</span>}
                        <span style={{ color:'var(--zone-card-text-sub, var(--text3))' }}>/{rituals.length}</span>
                      </span>
                      <span style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--zone-card-text-sub, var(--text3))' }}>›</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Desktop — layout colonne original */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        <span style={{ fontSize:'var(--fs-h2, 22px)', lineHeight:1 }}>{zoneIcons[zoneId]}</span>
                        <span style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--zone-card-text, var(--text))', fontWeight:600, letterSpacing:'0.05em', marginTop:5 }}>{zone.name.toUpperCase()}</span>
                        <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--zone-card-text-sub, var(--text3))', letterSpacing:'0.02em', marginTop:2 }}>{zone.subtitle}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                        <span style={{ fontSize:'var(--fs-h2, 20px)', fontFamily:"'Cormorant Garamond',serif", color:'var(--zone-card-text, var(--text))', fontWeight:600, lineHeight:1 }}>{health}<span style={{ fontSize:'var(--fs-h5, 11px)', opacity:0.6 }}>%</span></span>
                        {isPriority && !allDone && <span style={{ fontSize:'var(--fs-h5, 8px)', color: zone.color, background:`${zone.color}22`, padding:'1px 5px', borderRadius:10, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>Priorité</span>}
                        {allDone && <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--zone-card-text, var(--text))' }}>✓</span>}
                      </div>
                    </div>
                    <div style={{ height:3, borderRadius:3, background:'var(--surface-2)', overflow:'hidden', marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${health}%`, background:`linear-gradient(90deg, ${zone.color}70, ${zone.color})`, borderRadius:3, transition:'width .6s ease', boxShadow: health > 50 ? `0 0 6px ${zone.color}80` : 'none' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--zone-card-text-sub, var(--text3))' }}>
                        {doneCnt > 0 ? <span style={{ color: zone.color + 'cc' }}>{doneCnt}</span> : <span>{doneCnt}</span>}
                        <span style={{ color:'var(--zone-card-text-sub, var(--text3))' }}>/{rituals.length} rituels</span>
                      </span>
                      <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--zone-card-text-sub, var(--text3))' }}>›</span>
                    </div>
                  </>
                )}
              </button>
            )
          })}
          {/* ── 6ème card inline : Rituel rapide ── */}
          {!quickLoading && (quickRitual ? (
            <>
              <button
                onClick={() => setShowQuickModal(true)}
                style={{
                  position:'relative', overflow:'hidden',
                  padding: isMobile ? '14px 14px 12px' : '16px 16px 14px',
                  borderRadius:14, textAlign:'left', cursor:'pointer',
                  background:'var(--modal-surface)',
                  border:'1px solid rgba(var(--gold-rgb),0.45)',
                  boxShadow:'0 2px 24px rgba(var(--gold-rgb),0.14), 0 1px 0 rgba(var(--gold-rgb),0.12) inset',
                  width:'100%', display:'flex', flexDirection:'column', gap:0,
                  transition:'all .25s ease',
                }}
              >
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 0%, rgba(var(--gold-rgb),0.14) 0%, transparent 65%)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(var(--gold-rgb),0.35), transparent)', pointerEvents:'none' }} />

                {/* Ligne haute icône + badge : desktop uniquement */}
                {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:'rgba(var(--gold-rgb),0.14)', border:'1px solid rgba(var(--gold-rgb),0.40)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 12px rgba(var(--gold-rgb),0.22)' }}>
                    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8.5" stroke="rgba(var(--gold-rgb),0.85)" strokeWidth="1.4"/>
                      <circle cx="10" cy="10" r="1.2" fill="rgba(var(--gold-rgb),0.90)"/>
                      <line x1="10" y1="10" x2="10" y2="4.5" stroke="rgba(var(--gold-rgb),0.90)" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="10" y1="10" x2="13.8" y2="12.2" stroke="rgba(var(--gold-rgb),0.70)" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="10" y1="2" x2="10" y2="3.2" stroke="rgba(var(--gold-rgb),0.45)" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="10" y1="16.8" x2="10" y2="18" stroke="rgba(var(--gold-rgb),0.45)" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="2" y1="10" x2="3.2" y2="10" stroke="rgba(var(--gold-rgb),0.45)" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="16.8" y1="10" x2="18" y2="10" stroke="rgba(var(--gold-rgb),0.45)" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                    <span style={{ fontSize:'var(--fs-h5, 9px)', color:'rgba(var(--gold-rgb),0.88)', fontWeight:600, background:'rgba(var(--gold-rgb),0.12)', border:'1px solid rgba(var(--gold-rgb),0.28)', padding:'3px 8px', borderRadius:20, letterSpacing:'0.06em', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:'var(--fs-h5, 11px)' }}>{quickRitual.ritualIcon}</span>
                      <span>1–3 min</span>
                    </span>
                    <span style={{ fontSize:'var(--fs-h5, 8px)', color:'rgba(var(--gold-rgb),0.40)', letterSpacing:'0.04em' }}>{quickZonesRemaining}/5 restantes</span>
                  </div>
                </div>
                )}

                {isMobile ? (
                  /* Mobile : horloge + titre sur ligne 1, zone + restantes sur ligne 2 */
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'rgba(var(--gold-rgb),0.14)', border:'1px solid rgba(var(--gold-rgb),0.40)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="8.5" stroke="rgba(var(--gold-rgb),0.85)" strokeWidth="1.4"/>
                          <circle cx="10" cy="10" r="1.2" fill="rgba(var(--gold-rgb),0.90)"/>
                          <line x1="10" y1="10" x2="10" y2="4.5" stroke="rgba(var(--gold-rgb),0.90)" strokeWidth="1.4" strokeLinecap="round"/>
                          <line x1="10" y1="10" x2="13.8" y2="12.2" stroke="rgba(var(--gold-rgb),0.70)" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize:'var(--fs-h5, 12px)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--gold)', lineHeight:1.2 }}>Une action rapide</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'var(--fs-h5, 12px)', fontWeight:600, color:'var(--gold-warm)' }}>{quickRitual.zoneName}</span>
                      <span style={{ fontSize:'var(--fs-h5, 9px)', color:'rgba(var(--gold-rgb),0.45)', letterSpacing:'0.04em' }}>{quickZonesRemaining}/5 restantes</span>
                    </div>
                  </div>
                ) : (
                  /* Desktop : layout colonne original */
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:'var(--fs-h5, 12px)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--gold)', marginBottom:3, lineHeight:1.2 }}>Une action rapide</div>
                    <div style={{ fontSize:'var(--fs-h4, 13px)', fontWeight:600, letterSpacing:'0.01em', color:'var(--gold-warm)', lineHeight:1.3 }}>{quickRitual.zoneName}</div>
                  </div>
                )}

                <div style={{ height:1, background:'rgba(var(--gold-rgb),0.18)', borderRadius:1 }} />
              </button>

              {showQuickModal && (
                <QuickExerciseModal
                  quickRitual={quickRitual}
                  onClose={() => setShowQuickModal(false)}
                  onToggleRitual={onToggleRitual}
                />
              )}
            </>
          ) : quickZonesDone >= 5 ? (
            /* Toutes les zones accomplies aujourd'hui */
            <div style={{
              position:'relative', overflow:'hidden',
              padding: isMobile ? '14px 12px 12px' : '16px 16px 14px',
              borderRadius:14, textAlign:'left',
              background:'var(--bg2)',
              border:'1px solid rgba(var(--green-rgb),0.20)',
              width:'100%', display:'flex', flexDirection:'column', gap:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{
                  width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius:'50%',
                  background:'rgba(var(--green-rgb),0.12)', border:'1px solid rgba(var(--green-rgb),0.30)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7.5" stroke="rgba(var(--green-rgb),0.70)" strokeWidth="1.3"/>
                    <path d="M5.5 9.2L7.8 11.5L12.5 6.5" stroke="rgba(var(--green-rgb),0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:'var(--fs-h5, 9px)', color:'rgba(var(--green-rgb),0.55)', letterSpacing:'0.06em' }}>5/5</span>
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(var(--green-rgb),0.60)', marginBottom:3 }}>
                Actions du jour
              </div>
              <div style={{ height:1, background:'rgba(var(--green-rgb),0.10)', marginBottom:8, borderRadius:1 }} />
              <div style={{ fontSize: isMobile ? 10 : 11, color:'rgba(var(--green-rgb),0.45)', lineHeight:1.4, fontStyle:'italic' }}>
                Toutes les zones accomplies ✦
              </div>
            </div>
          ) : null)}
        </div>

      </div>
    </>
  )
}


// ── Composant message d'encouragement IA ─────────────────────
function StreakMessage({ streak }) {
  const isMobile = useIsMobile()
  if (!streak || streak < 1) return null

  const PHRASES = [
    [30, "Tu incarnes pleinement la personne que tu choisis de devenir"],
  [29, "Ta constance rayonne bien au-delà de ce que tu imagines"],
  [28, "Tu as transformé un effort en nouvelle norme personnelle"],
  [27, "Ton engagement est devenu une force tranquille"],
  [26, "Tu avances avec une assurance profonde et stable"],
  [25, "Ce que tu construis maintenant t'accompagnera longtemps"],
  [24, "Ta discipline intérieure est solide et inspire confiance"],
  [23, "Tu prouves que la persévérance change vraiment les choses"],
  [22, "Ton élan est maîtrisé et durable"],
  [21, "Tu tiens avec maturité et détermination"],
  [20, "Ton implication commence à porter de vrais fruits"],
  [19, "Tu renforces chaque jour la confiance en toi"],
  [18, "L'habitude est bien installée et te soutient"],
  [17, "Tu progresses avec calme et régularité"],
  [16, "Ta constance devient naturelle"],
  [15, "Tu es en train d'ancrer un changement profond"],
  [14, "Tu consolides quelque chose de vraiment durable"],
  [13, "Ton engagement devient une évidence"],
  [12, "Tu gagnes en stabilité et en clarté"],
  [11, "Ta motivation se transforme en discipline"],
  [10, "Tu tiens ton cap avec détermination"],
  [9,  "Ton effort d'aujourd'hui construit ton équilibre de demain"],
  [8,  "Tu installes une dynamique positive et solide"],
  [7,  "Tu franchis un cap intérieur important"],
  [6,  "Tu confirmes que tu peux compter sur toi"],
  [5,  "Ton rythme commence à s'affirmer"],
  [4,  "Tu poses des bases saines et solides"],
  [3,  "Quelque chose de stable prend forme en toi"],
  [2,  "Tu avances avec courage et intention"],
  [1,  "Tu as décidé de commencer, et cela change tout"],
  ]
  const phrase = (PHRASES.find(([k]) => streak >= k) ?? PHRASES[PHRASES.length - 1])[1]

  const color = streak >= 30 ? 'var(--gold)'
              : streak >= 14 ? 'var(--lumens)'
              : streak >= 7  ? 'var(--zone-breath)'
              : streak >= 3  ? 'var(--green)'
              :                '#d4ecc8'
  const glow = streak >= 7 ? '0 0 14px ' + color + 'aa' : 'none'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:4 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, flexShrink:0 }}>
        <span style={{ fontFamily:"'Playfair Display','Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h1, 38px)', fontWeight:400, lineHeight:1, letterSpacing:'-1px', color, textShadow:glow }}>{streak}</span>
        <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', paddingBottom:3 }}>j.</span>
      </div>
      {!isMobile && (
        <div style={{ display:'flex', flexDirection:'column', gap:2, overflow:'hidden', minWidth:0 }}>
          {streak > 1 && (
            <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', whiteSpace:'nowrap' }}>
              Vous êtes à{' '}
              <strong style={{ color, fontWeight:600 }}>{streak} jour{streak > 1 ? 's' : ''} consécutifs</strong>
            </span>
          )}
          <em className='streak-phrase' style={{ fontSize:'var(--fs-h2, 20px)', fontWeight:300, fontStyle:'italic', color:'var(--text)' }}>
            {phrase}
          </em>
        </div>
      )}
    </div>
  )
}



// ═══════════════════════════════════════════════════════
//  BOÎTE À GRAINES — Estime de soi
// ═══════════════════════════════════════════════════════
const GRAINE_TAGS = [
  { id: 'coeur', emoji: '❤️', label: 'Cœur' },
  { id: 'merci', emoji: '🙏', label: 'Merci' },
]

function BoiteAGraines({ userId, inline }) {
  const isMobile = useIsMobile()
  const [text, setText]             = useState('')
  const [tags, setTags]             = useState([])
  const [saving, setSaving]         = useState(false)
  const [savedToday, setSavedToday] = useState(false)
  const [todayEntry, setTodayEntry] = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const [graines, setGraines]       = useState([])
  const [loadingG, setLoadingG]     = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  function toggleTag(id) {
    setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  // Vérifie si la personne a déjà écrit aujourd'hui + compte total pour le bouton inline
  useEffect(() => {
    if (!userId) return
    supabase
      .from('graines_estime')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setTodayEntry(data); setSavedToday(true) }
      })
    // Compte total pour afficher le bouton "Voir mes graines" dès le chargement
    supabase
      .from('graines_estime')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count }) => { if (count) setGraines(Array(count).fill(null)) })
  }, [userId])

  async function handleSave() {
    if (!text.trim() || saving || savedToday) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('graines_estime')
        .insert({ user_id: userId, content: text.trim(), tags })
        .select()
        .single()
      if (!error) {
        setTodayEntry(data)
        setSavedToday(true)
        setText('')
        setTags([])
      }
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function openModal() {
    setShowModal(true)
    setLoadingG(true)
    const { data } = await supabase
      .from('graines_estime')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setGraines(data ?? [])
    setLoadingG(false)
  }

  const ENCOURAGEMENTS = [
    "Chaque graine que tu plantes aujourd'hui nourrit ta confiance de demain.",
    "Tu mérites de voir tout ce que tu accomplis.",
    "Tes réussites existent. Ce journal en est la preuve.",
    "Revenir ici, c'est déjà prendre soin de toi.",
    "Une seule chose bien faite par jour — c'est énorme.",
  ]
  const tip = ENCOURAGEMENTS[new Date().getDay() % ENCOURAGEMENTS.length]

  return (
    <>
      {/* ── CARD ── */}
      <div style={{
        background: inline ? 'transparent' : 'linear-gradient(160deg, var(--green3) 0%, var(--bg) 100%)',
        border: inline ? 'none' : '1px solid var(--border2)',
        borderRadius: inline ? 0 : 14,
        padding: inline ? (isMobile ? '18px 16px' : '22px 20px') : (isMobile ? '14px 12px' : '16px'),
        marginTop: inline ? 0 : 16,
        display: 'flex', flexDirection: 'column', gap: inline ? 18 : 10,
      }}>

        {/* ── CONCEPT (visible uniquement en mode slide inline) ── */}
        {inline && (
          <div style={{ textAlign:'center', padding: isMobile ? '0 4px' : '0 8px' }}>
            <div style={{ fontSize: isMobile ? 42 : 48, lineHeight:1, marginBottom:12 }}>🫙</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 32, fontWeight:600, fontStyle:'italic', color:'#1a1208', lineHeight:1.25, marginBottom:12 }}>
              La boîte à graines
            </div>
            <p style={{ fontSize: isMobile ? 18 : 19, color:'#1a1208', lineHeight:1.75, margin:'0 0 8px', fontFamily:"'Jost',sans-serif", fontWeight:400 }}>
              Chaque soir, dépose ici <strong style={{ fontWeight:600 }}>une réussite de ta journée</strong> —<br/>
              un moment dont tu es fier·e, un geste de soin, une petite victoire.
            </p>
            <p style={{ fontSize: isMobile ? 16 : 17, color:'#3a3a3a', lineHeight:1.75, margin:0, fontStyle:'italic' }}>
              Ces graines s'accumulent jour après jour et deviennent ton trésor — la preuve vivante de ta valeur.
              C'est ainsi que grandit l'estime de soi.
            </p>
            <div style={{ margin:'14px auto 0', width:40, height:1, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* ── EN-TÊTE (mode card standard) ── */}
        {!inline && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 15 : 16, color:'var(--green)', lineHeight:1.2 }}>
                🌱 Boîte à graines
              </div>
              <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginTop:3 }}>
                Estime de soi · chaque soir
              </div>
            </div>
            {(graines.length > 0 || savedToday) && (
              <div onClick={openModal} style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, minHeight:44, padding:'0 14px', borderRadius:100, background:'rgba(var(--green-rgb),0.10)', border:'1px solid rgba(var(--green-rgb),0.25)', cursor:'pointer', fontSize:'var(--fs-h5, 11px)', color:'var(--green)' }}>
                <span>🫙</span><span>Voir mes graines</span>
              </div>
            )}
          </div>
        )}

        {/* ── BOUTON VOIR MES GRAINES (mode inline) ── */}
        {inline && (graines.length > 0 || savedToday) && (
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div onClick={openModal} style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 26px', borderRadius:100, background:'rgba(60,120,60,0.12)', border:'1px solid rgba(60,120,60,0.3)', cursor:'pointer', fontSize: isMobile ? 17 : 18, color:'#1a4a18', fontFamily:"'Jost',sans-serif", fontWeight:500 }}>
              <span style={{ fontSize:20 }}>🫙</span>
              <span>Voir mes graines ({graines.length > 0 ? graines.length : '…'})</span>
            </div>
          </div>
        )}

        {/* ── CITATION DU JOUR (mode inline seulement, avant le form) ── */}
        {inline && !savedToday && (
          <div style={{ background:'rgba(60,120,60,0.07)', border:'1px solid rgba(60,120,60,0.18)', borderRadius:12, padding:'14px 18px', textAlign:'center' }}>
            <span style={{ fontSize: isMobile ? 17 : 18, color:'#2a3a20', lineHeight:1.75, fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>
              "{tip}"
            </span>
          </div>
        )}

        {/* ── CONTENU SELON ÉTAT ── */}
        {savedToday ? (
          <div style={{ background:'rgba(60,120,60,0.07)', border:'1px solid rgba(60,120,60,0.2)', borderRadius:14, padding: isMobile ? '16px' : '18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize: isMobile ? 12 : 13, color:'rgba(60,120,60,0.7)', letterSpacing:'.12em', textTransform:'uppercase', fontFamily:"'Jost',sans-serif" }}>
              ✓ Graine du jour plantée
            </div>
            <div style={{ fontSize: isMobile ? 19 : 20, color:'#1a1208', lineHeight:1.65, fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif", fontWeight:400 }}>
              « {todayEntry?.content} »
            </div>
            {todayEntry?.tags?.length > 0 && (
              <div style={{ display:'flex', gap:8 }}>
                {GRAINE_TAGS.filter(t => todayEntry.tags.includes(t.id)).map(t => (
                  <span key={t.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 16px', borderRadius:100, background:'rgba(60,120,60,0.1)', border:'1px solid rgba(60,120,60,0.2)', fontSize: isMobile ? 15 : 16, color:'#1a3a18' }}>
                    <span style={{ fontSize:18 }}>{t.emoji}</span> {t.label}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: isMobile ? 14 : 15, color:'#5a6840', marginTop:2 }}>
              Reviens demain soir pour planter une nouvelle graine 🌿
            </div>
          </div>
        ) : (
          <>
            {/* Citation (mode card standard) */}
            {!inline && (
              <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', lineHeight:1.6, fontStyle:'italic' }}>
                {tip}
              </div>
            )}

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Qu'est-ce qui s'est bien passé aujourd'hui ? Une réussite, un moment, une fierté…"
              maxLength={400}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(60,120,60,0.25)',
                borderRadius: 12, padding: isMobile ? '14px' : '14px 16px', resize: 'none',
                height: isMobile ? (inline ? 120 : 96) : (inline ? 110 : 80),
                fontSize: isMobile ? (inline ? 18 : 14) : (inline ? 18 : 13),
                fontFamily: "'Jost', sans-serif", color: '#1a1208',
                outline: 'none', lineHeight: 1.7,
              }}
            />

            {/* Badges */}
            <div style={{ display:'flex', gap: isMobile ? 10 : 12 }}>
              {GRAINE_TAGS.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    minHeight: isMobile ? 54 : 50, borderRadius: 12,
                    fontSize: isMobile ? (inline ? 18 : 13) : (inline ? 18 : 12),
                    cursor:'pointer',
                    background: tags.includes(t.id) ? 'rgba(220,80,120,0.12)' : 'rgba(255,255,255,0.7)',
                    border: `1.5px solid ${tags.includes(t.id) ? 'rgba(220,80,120,0.45)' : 'rgba(0,0,0,0.12)'}`,
                    color: tags.includes(t.id) ? '#8a2040' : '#3a3a3a',
                    transition:'all .18s', userSelect:'none', WebkitTapHighlightColor:'transparent',
                    fontFamily:"'Jost',sans-serif", fontWeight: tags.includes(t.id) ? 600 : 400,
                  }}
                >
                  <span style={{ fontSize: isMobile ? 22 : 20 }}>{t.emoji}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <span style={{ fontSize: isMobile ? 13 : 12, color:'#7a8060', flex:1 }}>
                {text.length > 0 ? `${text.length}/400` : '🔒 Privé · visible uniquement par toi'}
              </span>
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                style={{
                  minHeight: isMobile ? 54 : 50,
                  padding: inline ? '0 36px' : '0 22px',
                  borderRadius: 12,
                  fontSize: isMobile ? (inline ? 18 : 14) : (inline ? 18 : 13),
                  background: text.trim() ? 'rgba(40,100,40,0.85)' : 'rgba(0,0,0,0.07)',
                  border: `1px solid ${text.trim() ? 'rgba(40,100,40,0.6)' : 'rgba(0,0,0,0.1)'}`,
                  color: text.trim() ? '#fff' : '#aaa',
                  cursor: text.trim() ? 'pointer' : 'default',
                  fontFamily: "'Jost', sans-serif", fontWeight:600, transition: 'all .18s',
                  WebkitTapHighlightColor:'transparent',
                  width: isMobile ? '100%' : 'auto',
                  letterSpacing:'.04em',
                }}
              >
                {saving ? '…' : '🌱 Planter cette graine'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 300,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, var(--bg2) 0%, var(--bg) 100%)',
              border: '1px solid rgba(var(--green-rgb),0.25)',
              borderRadius: isMobile ? '18px 18px 0 0' : 18,
              padding: isMobile ? '20px 18px 32px' : 28,
              width: '100%', maxWidth: isMobile ? '100%' : 480,
              maxHeight: isMobile ? '88vh' : '85vh',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            {/* Handle mobile drag indicator */}
            {isMobile && (
              <div style={{ width:40, height:4, borderRadius:2, background:'var(--separator)', margin:'-4px auto 4px' }} />
            )}

            {/* Header modal */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 24, color:'var(--cream)', lineHeight:1.2 }}>
                  🫙 Mes graines
                </div>
                <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', marginTop:4 }}>
                  {graines.length} réussite{graines.length > 1 ? 's' : ''} semée{graines.length > 1 ? 's' : ''}
                </div>
              </div>
              <div
                onClick={() => setShowModal(false)}
                style={{ minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-h3, 18px)', color:'var(--text3)', cursor:'pointer' }}
              >✕</div>
            </div>

            {/* Message d'ancrage */}
            <div style={{
              background: 'rgba(var(--green-rgb),0.06)', border: '1px solid rgba(var(--green-rgb),0.15)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: isMobile ? 13 : 12, color: 'var(--text3)', lineHeight: 1.7, fontStyle: 'italic',
            }}>
              Ces moments sont réels. Tu les as vécus. Ils font partie de qui tu es.
            </div>

            {/* Liste des graines */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, WebkitOverflowScrolling:'touch' }}>
              {loadingG && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:'var(--fs-h5, 12px)', padding:20 }}>Chargement…</div>
              )}
              {!loadingG && graines.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:'var(--fs-h5, 12px)', fontStyle:'italic', padding:20 }}>
                  Aucune graine pour l'instant — reviens ce soir 🌙
                </div>
              )}
              {graines.map((g, i) => {
                const d = new Date(g.created_at)
                const label = new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(d)
                return (
                  <div key={g.id} style={{
                    padding: isMobile ? '12px' : '12px 14px',
                    background: i === 0 && today === g.created_at?.slice(0,10)
                      ? 'rgba(var(--green-rgb),0.08)'
                      : 'var(--surface-1)',
                    border: `1px solid ${i === 0 && today === g.created_at?.slice(0,10) ? 'rgba(var(--green-rgb),0.2)' : 'var(--surface-2)'}`,
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:5 }}>
                      {label}
                      {i === 0 && today === g.created_at?.slice(0,10) && (
                        <span style={{ marginLeft:8, color:'rgba(var(--green-rgb),0.6)' }}>· aujourd'hui</span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, fontSize: isMobile ? 14 : 13, color:'var(--text2)', lineHeight:1.65, fontStyle:'italic' }}>
                        "{g.content}"
                      </div>
                      {g.tags?.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                          {GRAINE_TAGS.filter(t => g.tags.includes(t.id)).map(t => (
                            <span key={t.id} title={t.label} style={{ fontSize:'var(--fs-emoji-md, 22px)' }}>{t.emoji}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bas de modal — bouton fermer */}
            <div
              onClick={() => setShowModal(false)}
              style={{ textAlign:'center', minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:9, background:'var(--surface-2)', border:'1px solid var(--surface-3)', fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--ritual-modal-text-rgb),0.4)', cursor:'pointer' }}
            >
              Fermer
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  WAKEUP MODAL  "Le Réveil du Jardin"
// ─────────────────────────────────────────────────────────────────────────────
// ── EgregoreCard (accordéon) ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  PARTICULE — identique à ScreenClubJardiniers
// ─────────────────────────────────────────────────────────────────────────────
function WakeUpParticle({ x, y, color, char, vx: initVx, vy: initVy, dur: initDur, onDone }) {
  const [pos, setPos]   = useState({ x, y, o: 1, rot: 0 })
  const [gone, setGone] = useState(false)
  const frame = useRef(null)
  const start = useRef(Date.now())

  useEffect(() => {
    const dur = initDur ?? (3200 + Math.random() * 1200)
    const vx  = initVx  ?? (0.5 + Math.random() * 0.8)
    const vy  = initVy  ?? -(0.5 + Math.random() * 0.7)
    const rot = (Math.random() - 0.5) * 0.004
    function tick() {
      const elapsed = Date.now() - start.current
      const p = Math.min(elapsed / dur, 1)
      setPos({ x: x + vx * elapsed * 0.06, y: y + vy * elapsed * 0.06, o: 1 - p, rot: rot * elapsed })
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else { setGone(true); onDone?.() }
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (gone) return null
  if (char) return (
    <div style={{
      position:'fixed', left: pos.x - 10, top: pos.y - 10,
      fontSize:'var(--fs-emoji-md, 18px)', opacity: pos.o, pointerEvents:'none', zIndex:9999,
      transform:`rotate(${pos.rot}rad)`, transition:'none', userSelect:'none',
    }}>{char}</div>
  )
  return (
    <div style={{
      position:'fixed', left: pos.x - 4, top: pos.y - 4,
      width:8, height:8, borderRadius:'50%',
      background: color, opacity: pos.o, pointerEvents:'none',
      boxShadow:`0 0 6px ${color}`, transition:'none',
    }}/>
  )
}

function EgregoreCard({ intention, progress, isMobile, onJoin, onBurst }) {
  const [open, setOpen] = useState(false)
  const isDone = progress.egregore
  const btnRef = useRef(null)

  function spawnBurst() {
    if (!btnRef.current) return
    const rect  = btnRef.current.getBoundingClientRect()
    const bx    = rect.left + rect.width  / 2
    const by    = rect.top  + rect.height / 2
    const PETALS = ['🌸','🌺','🌼','🌷','💮','🌻']
    const STARS  = ['✨','⭐','🌟','💫','✦']
    const ps = []

    // Pétales — montent en éventail
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 1.4
      const speed = 0.4 + Math.random() * 0.7
      ps.push({
        id:   `ep-${i}-${Date.now()}-${Math.random()}`,
        x:    bx + (Math.random() - 0.5) * 30,
        y:    by + (Math.random() - 0.5) * 20,
        char: PETALS[Math.floor(Math.random() * PETALS.length)],
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed,
        dur:  2800 + Math.random() * 1600,
        color: null,
      })
    }

    // Étoiles — explosent dans toutes les directions, rapides
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.0 + Math.random() * 1.4
      ps.push({
        id:   `es-${i}-${Date.now()}-${Math.random()}`,
        x:    bx + (Math.random() - 0.5) * 16,
        y:    by + (Math.random() - 0.5) * 16,
        char: STARS[Math.floor(Math.random() * STARS.length)],
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed,
        dur:  800 + Math.random() * 500,
        color: null,
      })
    }

    onBurst?.(ps)
  }

  function handleJoin() {
    spawnBurst()
    onJoin?.()
  }

  return (
    <div style={{
      borderRadius:16,
      border:`1px solid ${isDone ? 'var(--greenT)' : 'var(--border2)'}`,
      background: isDone ? 'var(--green3)' : 'var(--surface-1)',
      transition:'all .3s',
      overflow:'hidden',
    }}>
      {/* Header row */}
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{
          width:42, height:42, borderRadius:13,
          background: isDone ? 'var(--green3)' : 'var(--surface-2)',
          border:`1px solid ${isDone ? 'var(--greenT)' : 'var(--border)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'var(--fs-emoji-md, 20px)', flexShrink:0,
        }}>
          {isDone ? '✓' : '🌸'}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize: isMobile ? 16 : 15,
            fontFamily:"'Cormorant Garamond',serif",
            fontWeight:600,
            color: isDone ? 'var(--text3)' : 'var(--gold)',
            lineHeight:1.3,
            letterSpacing:'0.01em',
          }}>
            {intention?.text ?? 'Intention du jour'}
          </div>
          <div style={{
            fontSize: isMobile ? 12 : 11,
            color: isDone ? 'var(--text3)' : 'var(--zone-breath)',
            marginTop:3,
          }}>
            Je participe à la pensée collective (égregore)
          </div>
        </div>

        {/* Bouton accordéon */}
        {intention?.description && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: isDone ? 'var(--surface-2)' : 'var(--green3)',
              border:`1px solid ${isDone ? 'var(--border2)' : 'var(--greenT)'}`,
              borderRadius:100,
              width:32, height:32,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', flexShrink:0,
              fontSize:'var(--fs-h4, 14px)', color: isDone ? 'var(--text3)' : 'var(--gold)',
              transition:'transform .25s',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
            aria-label={open ? 'Fermer' : 'Lire la pensée'}
          >▾</button>
        )}

        {/* Rejoindre / checkmark */}
        {!isDone && (
          <button ref={btnRef} onClick={handleJoin} style={{
            background:'var(--green3)',
            border:'1px solid var(--greenT)',
            borderRadius:100, padding:'7px 14px',
            fontSize: isMobile ? 13 : 12,
            color:'var(--green)',
            cursor:'pointer', flexShrink:0, fontWeight:500,
            whiteSpace:'nowrap',
          }}>Rejoindre</button>
        )}
        {isDone && <span style={{ fontSize:'var(--fs-h3, 18px)', color:'var(--green)' }}>✓</span>}
      </div>

      {/* Accordéon — description complète */}
      {intention?.description && open && (
        <div style={{
          margin:'0 16px 14px',
          padding:'14px 16px',
          borderRadius:12,
          background:'var(--green3)',
          border:'1px solid var(--greenT)',
          animation:'fadeUp 0.22s ease',
        }}>
          <div style={{
            fontSize: isMobile ? 14 : 13,
            color:'var(--text3)',
            lineHeight:1.75,
            fontStyle:'italic',
            fontFamily:"'Cormorant Garamond',serif",
          }}>
            {intention.description}
          </div>
        </div>
      )}
    </div>
  )
}

function WakeUpModal({ userId, plant, completedRituals, onToggleRitual, onClose, profile }) {
  const isMobile = useIsMobile()
  const [closing, setClosing]                 = useState(false)
  const [confetti, setConfetti]               = useState(false)
  const [progress, setProgress]               = useState({ ritual:false, flowers:false, thought:false, egregore:false })
  const [suggestedRitual, setSuggestedRitual] = useState(null)
  const [exerciseActive, setExerciseActive]   = useState(false)
  const [weakestPeople, setWeakestPeople]     = useState([])
  const [flowersSent, setFlowersSent]         = useState(new Set())
  const [closestFriend, setClosestFriend]     = useState(null)
  const [thoughtSent, setThoughtSent]         = useState(false)
  const [intention, setIntention]             = useState(null)
  const [intentionJoined, setIntentionJoined] = useState(false)
  const [flowersExhausted, setFlowersExhausted] = useState(false)  // plus personne a contacter
  const [thoughtExhausted, setThoughtExhausted] = useState(false)  // aucun ami disponible
  const todayKey  = new Date().toISOString().slice(0, 10)
  const firstName = (profile?.display_name ?? '').split(' ')[0] || 'vous'
  const doneCount = Object.values(progress).filter(Boolean).length

  useEffect(() => { if (userId && plant?.id) init() }, [userId, plant?.id])

  async function init() {
    // Reset a chaque apparition pour proposer de nouvelles suggestions
    setFlowersSent(new Set())
    setProgress({ ritual:false, flowers:false, thought:false, egregore:false })
    try {

    // ── Rituel : zone la plus faible non encore accomplie aujourd'hui ────────────
    const zoneMap = [
      { id:'roots',   dbKey:'zone_racines',  ...PLANT_ZONES.roots   },
      { id:'stem',    dbKey:'zone_tige',     ...PLANT_ZONES.stem    },
      { id:'leaves',  dbKey:'zone_feuilles', ...PLANT_ZONES.leaves  },
      { id:'flowers', dbKey:'zone_fleurs',   ...PLANT_ZONES.flowers },
      { id:'breath',  dbKey:'zone_souffle',  ...PLANT_ZONES.breath  },
    ]
    // Exclure les zones dont au moins un rituel a été complété aujourd'hui
    const availableZones = zoneMap.filter(z =>
      !(PLANT_RITUALS[z.id] ?? []).some(r => completedRituals?.[r.id])
    )

    if (!availableZones.length) {
      // Toutes les zones accomplies → rituel coché
      markDone('ritual', true)
    } else {
      const sorted  = [...availableZones].sort((a, b) => (plant[a.dbKey] ?? 5) - (plant[b.dbKey] ?? 5))
      const weakest = sorted[0]
      const { data: hist } = await supabase.from('rituals').select('ritual_id').eq('user_id', userId).eq('zone', weakest.name).not('ritual_id', 'is', null).order('completed_at', { ascending: false }).limit(50)
      let bestId = null
      if (hist?.length) {
        const counts = {}
        hist.forEach(r => { counts[r.ritual_id] = (counts[r.ritual_id] ?? 0) + 1 })
        bestId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      }
      const defs   = PLANT_RITUALS[weakest.id] ?? []
      const ritual = (bestId ? defs.find(r => r.id === bestId) : null) ?? defs[0]
      if (ritual) setSuggestedRitual({ ...ritual, zoneId: weakest.id, zoneName: weakest.name, zoneColor: weakest.color, zoneValue: plant[weakest.dbKey] ?? 5 })
    }

    // ── Cœurs deja envoyes aujourd'hui (partage entre fleurs + pensee) ─────────
    const { data: sentToday } = await supabase
      .from('coeurs').select('receiver_id').eq('sender_id', userId)
      .gte('created_at', todayKey + 'T00:00:00')
    const alreadySentIds = new Set((sentToday ?? []).map(c => c.receiver_id))

    // ── Bouquet de fleurs : source = onglet 'Le Jardin' ───────────────────────
    // Tous les users (sauf soi + deja envoye) tries par vitalite ascendante
    const { data: allUsers } = await supabase
      .from('users').select('id, display_name, flower_name')
      .neq('id', userId)
    const otherIds = (allUsers ?? []).filter(u => !alreadySentIds.has(u.id)).map(u => u.id)
    if (otherIds.length) {
      const { data: allPlants } = await supabase
        .from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
        .in('user_id', otherIds).order('date', { ascending: false })
      // Garder le plant le plus recent par user
      const plantMap = {}
      ;(allPlants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
      // Calcul vitalite = moyenne des 5 zones (identique a ModalJardin)
      const withVit = (allUsers ?? [])
        .filter(u => !alreadySentIds.has(u.id) && u.id !== userId)
        .map(u => {
          const p = plantMap[u.id] ?? {}
          const zones = ['zone_racines','zone_tige','zone_feuilles','zone_fleurs','zone_souffle']
          const vit = Math.round(zones.reduce((s, k) => s + (p[k] ?? 5), 0) / zones.length)
          return { ...u, plant: p, vitalite: vit }
        })
        .sort((a, b) => a.vitalite - b.vitalite) // les plus fragiles en premier
      setWeakestPeople(withVit.slice(0, 3))
      if (withVit.length === 0) { setFlowersExhausted(true); markDone('flowers', true) }
    } else {
      setFlowersExhausted(true); markDone('flowers', true) // tout le monde a deja recu un coeur aujourd'hui
    }

    // ── Belle pensee : source = onglet 'Mes Amis' (echanges mutuels) ──────────
    // Logique identique a ModalBouquet : j'ai envoye un coeur + ils m'ont remercie
    const [{ data: sentAll }, { data: recvMercis }] = await Promise.all([
      supabase.from('coeurs').select('receiver_id').eq('sender_id', userId),
      supabase.from('mercis').select('sender_id').eq('receiver_id', userId),
    ])
    const sentAllIds = new Set((sentAll ?? []).map(c => c.receiver_id))
    const recvIds    = new Set((recvMercis ?? []).map(m => m.sender_id))
    // Echanges mutuels = j'ai envoye ET j'ai recu un merci en retour
    const amisIds = [...sentAllIds].filter(id => recvIds.has(id))
    if (amisIds.length) {
      const { data: amisUsers } = await supabase
        .from('users').select('id, display_name, flower_name').in('id', amisIds)
      // Exclure ceux deja contactes aujourd'hui, puis prioriser le moins recemment contacte
      const { data: recentCoeurs } = await supabase
        .from('coeurs').select('receiver_id').eq('sender_id', userId)
        .order('created_at', { ascending: false }).limit(10)
      const recentIds = (recentCoeurs ?? []).map(c => c.receiver_id)
      const amisFiltered = (amisUsers ?? [])
        .filter(a => !alreadySentIds.has(a.id))
        .sort((a, b) => {
          const ia = recentIds.indexOf(a.id)
          const ib = recentIds.indexOf(b.id)
          // Ceux pas dans recentIds (-1) en premier, sinon le moins recent (index le plus grand)
          if (ia === -1 && ib === -1) return 0
          if (ia === -1) return -1
          if (ib === -1) return 1
          return ib - ia
        })
      const chosenAmi = amisFiltered[0] ?? (amisUsers ?? [])[0]
      if (chosenAmi) setClosestFriend(chosenAmi)
      else setThoughtExhausted(true)
    } else {
      setThoughtExhausted(true) // aucun ami (echanges mutuels) disponible
    }
    // NE PAS pre-cocher thought si pas d'ami trouve

    // ── Egregore : intention du jour ───────────────────────────────────────────
    const { data: int } = await supabase.from('intentions').select('*').eq('date', todayKey).maybeSingle()
    setIntention(int ?? { text: 'Prendre soin de soi', description: "Chaque rituel nourrit l'energie collective." })
    const { data: joined } = await supabase.from('intentions_joined').select('id').eq('user_id', userId).eq('date', todayKey).maybeSingle()
    if (joined) { setIntentionJoined(true); markDone('egregore', true) }
    } catch(e) {
      console.error('[WakeUpModal] init error:', e)
      // En cas d'erreur, laisser les actions disponibles sans les pre-cocher
    }
  }

  // silent=true : pré-cochage init (pas de fermeture auto), silent=false : action user
  function markDone(key, silent = false) {
    setProgress(prev => {
      if (prev[key]) return prev
      const next = { ...prev, [key]: true }
      // Fermeture auto uniquement si l'user a activement accompli quelque chose
      if (!silent && Object.values(next).every(Boolean)) {
        setConfetti(true)
        setTimeout(() => { setClosing(true); setTimeout(onClose, 700) }, 2400)
      }
      return next
    })
  }

  function doClose() { setClosing(true); setTimeout(onClose, 300) }

  function handleStartRitual() { setExerciseActive(true) }
  function handleCompleteRitual() {
    if (!suggestedRitual) return
    onToggleRitual?.(suggestedRitual.id)
    setExerciseActive(false)
    // Désactiver le bouton jusqu'à la prochaine ouverture du modal
    // (init() rechargera automatiquement la prochaine zone disponible)
    markDone('ritual')
  }
  async function handleSendFlower(personId) {
    if (flowersSent.has(personId)) return
    const zoneName = suggestedRitual?.zoneId ? ZONE_DB_KEY[suggestedRitual.zoneId].replace('zone_', '') : 'racines'
    try {
      await supabase.from('coeurs').insert({ sender_id: userId, receiver_id: personId, zone: zoneName, message_ia: 'Un coeur depuis le jardin' })
      const next = new Set([...flowersSent, personId])
      setFlowersSent(next)
      if (next.size >= Math.min(3, weakestPeople.length)) markDone('flowers')
    } catch(e) { console.warn('coeur', e) }
  }
  async function handleSendThought() {
    if (!closestFriend || thoughtSent) return
    try {
      // Envoie un coeur a l'ami jardinier selectionne
      const zoneName = suggestedRitual?.zoneId ? ZONE_DB_KEY[suggestedRitual.zoneId].replace('zone_', '') : 'racines'
      await supabase.from('coeurs').insert({
        sender_id:  userId,
        receiver_id: closestFriend.id,
        zone: zoneName,
        message_ia: 'Une belle pensee pour toi, de la part de ton jardinier'
      })
      setThoughtSent(true)
      markDone('thought')
    } catch(e) { console.warn('thought coeur', e) }
  }
  async function handleJoinEgregore() {
    if (intentionJoined) return
    try {
      await supabase.from('intentions_joined').insert({ user_id: userId, date: todayKey })
      setIntentionJoined(true)
      markDone('egregore')
    } catch(e) { console.warn('egregore', e) }
  }

  const zColor = suggestedRitual?.zoneColor ?? 'var(--green)'
  const [particles, setParticles] = useState([])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'var(--overlay)', backdropFilter: isMobile ? 'none' : 'blur(10px)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', padding: isMobile ? 0 : 20 }} onClick={e => { if (e.target === e.currentTarget) doClose() }}>
      <div style={{ width:'100%', maxWidth: isMobile ? '100%' : 560, maxHeight: isMobile ? '94vh' : '88vh', overflowY:'auto', background:'linear-gradient(170deg, var(--bg2) 0%, var(--bg) 100%)', border:'1px solid var(--greenT)', borderRadius: isMobile ? '22px 22px 0 0' : 24, borderBottom: isMobile ? 'none' : undefined, opacity: closing ? 0 : 1, transition:'opacity .3s, transform .3s', transform: closing ? (isMobile ? 'translateY(30px)' : 'scale(.97)') : 'none', animation: closing ? 'none' : 'fadeUp 0.35s cubic-bezier(0.34,1.3,0.64,1)' }}>
        {isMobile && <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}><div style={{ width:36, height:3, borderRadius:2, background:'var(--separator)' }}/></div>}

        {/* Header */}
        <div style={{ padding: isMobile ? '14px 20px 0' : '26px 28px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 26 : 30, fontWeight:300, color:'var(--cream)', lineHeight:1.1 }}>
                Bonjour, {firstName} 🌿
              </div>
              <div style={{ fontSize: isMobile ? 14 : 13, color:'var(--text3)', marginTop:6, lineHeight:1.4 }}>
                2 minutes pour prendre soin de votre jardin intérieur
              </div>
            </div>
            <button onClick={doClose} style={{ background:'none', border:'none', color:'var(--text3)', fontSize:'var(--fs-h2, 22px)', cursor:'pointer', padding:'2px 0 0 14px', lineHeight:1, flexShrink:0 }}>x</button>
          </div>
          <div style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase' }}>Progression</span>
              <span style={{ fontSize:'var(--fs-h5, 11px)', fontWeight:500, color: doneCount===4 ? 'var(--green)' : 'var(--text3)' }}>{doneCount===4 ? 'Tout accompli !' : `${doneCount} / 4`}</span>
            </div>
            <div style={{ height:3, borderRadius:3, background:'var(--track)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, width:`${(doneCount/4)*100}%`, background:'linear-gradient(90deg, var(--green), var(--green))', transition:'width .5s ease' }}/>
            </div>
          </div>
          {confetti && <div style={{ textAlign:'center', padding:'8px 0 2px', fontSize:'var(--fs-h4, 14px)', color:'var(--green)', fontStyle:'italic' }}>Magnifique — votre jardin rayonne aujourd'hui.</div>}
        </div>

        {/* Actions */}
        <div style={{ padding: isMobile ? '12px 20px 24px' : '14px 28px 28px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* 1 Rituel */}
          {(() => {
            const zoneMap = ['roots','stem','leaves','flowers','breath']
            const doneZones = zoneMap.filter(zId => (PLANT_RITUALS[zId] ?? []).some(r => completedRituals?.[r.id])).length
            const remainingZones = 5 - doneZones
            return (
          <div style={{ borderRadius:16, border:`1px solid ${progress.ritual ? zColor+'35' : 'var(--track)'}`, background: progress.ritual ? `${zColor}08` : 'var(--surface-1)', overflow:'hidden', transition:'all .3s' }}>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:`${zColor}18`, border:`1px solid ${zColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-emoji-md, 20px)', flexShrink:0 }}>
                {progress.ritual ? '✓' : (suggestedRitual?.icon ?? '🌱')}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize: isMobile ? 15 : 14, color: progress.ritual ? 'var(--text3)' : 'var(--text)', fontWeight:500 }}>Mon rituel rapide</span>
                  {!progress.ritual && (
                    <span style={{ fontSize:'var(--fs-h5, 9px)', color:'rgba(var(--ritual-modal-text-rgb),0.35)', background:'var(--surface-2)', border:'1px solid var(--surface-3)', borderRadius:20, padding:'1px 7px', whiteSpace:'nowrap', flexShrink:0 }}>
                      {remainingZones}/5
                    </span>
                  )}
                </div>
                {suggestedRitual && (
                  <div style={{ fontSize: isMobile ? 12 : 11, color:zColor, marginTop:2, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {suggestedRitual.text}
                    <span style={{ color:'var(--text3)' }}> · {suggestedRitual.zoneName} {suggestedRitual.zoneValue}%</span>
                  </div>
                )}
              </div>
              {!progress.ritual && (
                <button onClick={exerciseActive ? handleCompleteRitual : handleStartRitual} style={{ background: exerciseActive ? `${zColor}22` : `${zColor}12`, border:`1px solid ${zColor}${exerciseActive ? '55' : '28'}`, borderRadius:100, padding:'7px 14px', fontSize: isMobile ? 13 : 12, color: exerciseActive ? '#fff' : 'var(--badge-lvl1)', cursor:'pointer', flexShrink:0, fontWeight:500, whiteSpace:'nowrap' }}>
                  {exerciseActive ? 'Terminer' : 'Demarrer'}
                </button>
              )}
              {progress.ritual && <span style={{ fontSize:'var(--fs-h3, 18px)', color:zColor }}>✓</span>}
            </div>
            {exerciseActive && suggestedRitual?.quick?.[0] && (
              <div style={{ margin:'0 16px 14px', padding:'14px 16px', borderRadius:12, background:`${zColor}0c`, border:`1px solid ${zColor}20` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>{suggestedRitual.quick[0].icon}</span>
                  <div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color:'var(--text2)', fontWeight:500 }}>{suggestedRitual.quick[0].title}</div>
                    <div style={{ fontSize:'var(--fs-h5, 11px)', color:zColor }}>{suggestedRitual.quick[0].dur}</div>
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 13 : 12, color:'var(--text3)', lineHeight:1.65 }}>{suggestedRitual.quick[0].desc}</div>
              </div>
            )}
          </div>
            )
          })()}

          {/* 2 Fleurs */}
          <div style={{ borderRadius:16, border:`1px solid ${progress.flowers ? 'var(--zone-flowers)' : flowersExhausted ? 'var(--border2)' : 'var(--border2)'}`, background: progress.flowers ? 'var(--surface-1)' : flowersExhausted ? 'var(--surface-1)' : 'var(--surface-1)', opacity: flowersExhausted && !progress.flowers ? 0.45 : 1, transition:'all .3s' }}>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:13, background: flowersExhausted && !progress.flowers ? 'var(--surface-2)' : 'var(--surface-3)', border:`1px solid ${flowersExhausted && !progress.flowers ? 'var(--border2)' : 'var(--zone-flowers)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-emoji-md, 20px)', flexShrink:0 }}>
                {progress.flowers ? '✓' : flowersExhausted ? '🚫' : '💐'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: isMobile ? 15 : 14, color: progress.flowers || flowersExhausted ? 'var(--text3)' : 'var(--text)', fontWeight:500 }}>Offrir un élan à un jardin fragile</div>
                <div style={{ fontSize: isMobile ? 12 : 11, color: flowersExhausted && !progress.flowers ? 'var(--text3)' : 'var(--zone-flowers)', marginTop:2, fontStyle:'italic' }}>
                  {progress.flowers
                    ? `Élan envoyé — merci pour eux`
                    : flowersExhausted
                      ? `Tous les jardins ont déjà reçu un élan aujourd'hui`
                      : `Ces jardins ont besoin d'un peu d'énergie`}
                </div>
              </div>
              {progress.flowers && <span style={{ fontSize:'var(--fs-h3, 18px)', color:'var(--zone-flowers)' }}>✓</span>}
            </div>
            {!progress.flowers && !flowersExhausted && weakestPeople.length > 0 && (
              <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic', lineHeight:1.6, textAlign:'center', padding:'0 4px' }}>
                  Un élan bienveillant, sans attente de retour — comme de la lumière partagée.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                {weakestPeople.map(p => {
                  const sent = flowersSent.has(p.id)
                  return (
                    <button key={p.id} onClick={() => handleSendFlower(p.id)} style={{ flex:1, padding:'10px 8px', borderRadius:12, background: sent ? 'var(--surface-2)' : 'var(--surface-2)', border:`1px solid ${sent ? 'var(--zone-flowers)' : 'var(--border2)'}`, cursor: sent ? 'default' : 'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ fontSize:'var(--fs-h5, 11px)', fontWeight:600, color: sent ? 'var(--zone-flowers)' : 'var(--text3)', letterSpacing:'.02em' }}>{sent ? '✓' : `${p.vitalite ?? p.health ?? '—'}%`}</span>
                      <span style={{ fontSize:'var(--fs-h2, 22px)', lineHeight:1 }}>{sent ? '🌿' : '💐'}</span>
                      <span style={{ fontSize: isMobile ? 10 : 9, color: sent ? 'var(--zone-flowers)' : 'var(--text3)', lineHeight:1.2, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>
                        {sent ? 'Soutenu' : (p.display_name?.split(' ')[0] ?? 'Jardinier')}
                      </span>
                    </button>
                  )
                })}
                </div>
              </div>
            )}
          </div>

          {/* 3 Pensee */}
          <div style={{ borderRadius:16, border:`1px solid ${progress.thought ? 'var(--gold)' : thoughtExhausted ? 'var(--border2)' : 'var(--border2)'}`, background: progress.thought ? 'var(--surface-1)' : thoughtExhausted ? 'var(--surface-1)' : 'var(--surface-1)', opacity: thoughtExhausted && !progress.thought ? 0.45 : 1, transition:'all .3s' }}>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:13, background: thoughtExhausted && !progress.thought ? 'var(--surface-2)' : 'var(--surface-3)', border:`1px solid ${thoughtExhausted && !progress.thought ? 'var(--border2)' : 'var(--gold)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--fs-emoji-md, 20px)', flexShrink:0 }}>
                {progress.thought ? '✓' : thoughtExhausted ? '🚫' : '💌'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: isMobile ? 15 : 14, color: progress.thought || thoughtExhausted ? 'var(--text3)' : 'var(--text)', fontWeight:500 }}>Envoyer une belle pensée à un jardinier proche</div>
                <div style={{ fontSize: isMobile ? 12 : 11, color: thoughtExhausted && !progress.thought ? 'var(--text3)' : 'var(--gold)', marginTop:2, fontStyle: thoughtExhausted && !progress.thought ? 'italic' : 'normal' }}>
                  {progress.thought
                    ? <span>Envoyé à <strong style={{color:'var(--gold-warm)'}}>{[closestFriend?.display_name?.split(' ')[0], closestFriend?.flower_name].filter(Boolean).join(' · ')}</strong></span>
                    : thoughtExhausted
                      ? `Tous vos amis ont déjà reçu un cœur aujourd'hui`
                      : closestFriend
                        ? <span>Pour <strong style={{color:'var(--gold)'}}>{[closestFriend.display_name?.split(' ')[0], closestFriend.flower_name].filter(Boolean).join(' · ')}</strong></span>
                        : 'Aucun ami disponible'}
                </div>
              </div>
              {!progress.thought && !thoughtExhausted && closestFriend && (
                <button onClick={handleSendThought} style={{ background:'var(--green3)', border:'1px solid var(--greenT)', borderRadius:100, padding:'7px 14px', fontSize: isMobile ? 13 : 12, color:'var(--gold)', cursor:'pointer', flexShrink:0, fontWeight:500, whiteSpace:'nowrap' }}>
                  Lui offrir 🌿
                </button>
              )}
              {progress.thought && <span style={{ fontSize:'var(--fs-h3, 18px)', color:'var(--gold)' }}>✓</span>}
            </div>
          </div>

          {/* 4 Egregore */}
          <EgregoreCard
            intention={intention}
            progress={progress}
            isMobile={isMobile}
            onJoin={handleJoinEgregore}
            onBurst={ps => setParticles(prev => [...prev, ...ps])}
          />

          {/* Passer */}
          <div onClick={doClose} style={{ textAlign:'center', paddingTop:4, fontSize: isMobile ? 13 : 12, color:'var(--text3)', cursor:'pointer', letterSpacing:'.04em', userSelect:'none' }}>
            Passer pour l'instant
          </div>
        </div>
      </div>

      {/* Particules égrégore — rendues hors du modal pour passer au-dessus */}
      {particles.map(p => (
        <WakeUpParticle key={p.id} {...p}
          onDone={() => setParticles(prev => prev.filter(q => q.id !== p.id))} />
      ))}
    </div>
  )
}

function useWakeUpTrigger({ userId }) {
  const [showWakeUp, setShowWakeUp] = useState(false)

  const todayKey = new Date().toISOString().slice(0, 10)

  // Reset à la déconnexion
  useEffect(() => {
    if (!userId) setShowWakeUp(false)
  }, [userId])

  // Déclencheur : event "openWakeUp" (bouton Action rapide ou ancien WelcomeScreen)
  useEffect(() => {
    const handler = () => setShowWakeUp(true)
    window.addEventListener('openWakeUp', handler)
    return () => window.removeEventListener('openWakeUp', handler)
  }, [])

  async function closeModal() {
    setShowWakeUp(false)
    if (!userId) return
    try {
      await supabase
        .from('wakeup_seen')
        .upsert({ user_id: userId, date: todayKey }, { onConflict: 'user_id,date' })
    } catch(e) {
      console.warn('[wakeup_seen] upsert failed', e)
    }
  }

  return { showWakeUp, setShowWakeUp: closeModal }
}

// ── Composant réutilisable : colonne fleur ───────────────────────────────────
function ColonneFleur({ plant, gardenSettings, lumens, isMobile, todayLabel, profile, userId, setGardenTier, setShowGardenSettings, streak = 0 }) {
  const streakColor = streak >= 30 ? 'var(--gold)' : streak >= 14 ? 'var(--lumens)' : streak >= 7 ? 'var(--zone-breath)' : 'var(--green)'
  return (
    <div style={{
      flex:'1 1 0', minWidth:0,
      display:'flex', flexDirection:'column',
      borderRight: isMobile ? 'none' : '1px solid var(--border2)',
      borderBottom: isMobile ? '1px solid var(--border2)' : 'none',
    }}>
      <div style={{
        position:'relative', flex:'1 1 0', minHeight: isMobile ? 320 : 420,
        overflow:'hidden',
        borderRadius: 18,
        margin: '12px 14px 0',
        boxShadow: '0 4px 32px rgba(10,22,40,0.22), 0 1px 4px rgba(10,22,40,0.10)',
      }}>
        <PlantSVG health={plant?.health ?? 5} gardenSettings={gardenSettings} lumensLevel={lumens?.level ?? 'faible'} lumensTotal={lumens?.total ?? 0} compact={isMobile} />
        {streak >= 1 && (
          <div className="streak-pill" style={{ borderColor: streakColor + '40' }}>
            <span className="streak-pill-count">👍 {streak} jour{streak > 1 ? 's' : ''}</span>
            <span className="streak-pill-label">CONSÉCUTIFS</span>
          </div>
        )}
        <div className="ph-health-overlay">
          <div className="ph-health-label">Vitalité</div>
          <div className="ph-health-date">{todayLabel}</div>
        </div>
      </div>
      <div style={{
        display:'flex', flexWrap:'wrap',
        padding:'10px 14px 11px',
        borderTop:'1px solid var(--border2)',
        background:'var(--bg)', flexShrink:0,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 8 : 8,
      }}>
        <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', letterSpacing:'.06em', whiteSpace: isMobile ? 'normal' : 'nowrap', flexShrink:0 }}>
          {isMobile ? 'Personnalisez votre fleur facilement :' : '✦ Personnalisez :'}
        </span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {[
          { lv:1, label:'Basique', badge:'🌱', unlockInfo:'Disponible dès le départ', colorU:'var(--green)', bgU:'rgba(var(--green-rgb),0.14)',  bdU:'rgba(var(--green-rgb),0.30)'  },
          { lv:2, label:'Cool',    badge:'🌿', unlockInfo:'Atteignez le niveau 2',    colorU:'var(--zone-breath)', bgU:'rgba(var(--zone-breath-rgb),0.14)', bdU:'rgba(var(--zone-stem-rgb),0.30)'  },
          { lv:3, label:'Extra',   badge:'🌟', unlockInfo:'Atteignez le niveau 3',    colorU:'var(--gold)', bgU:'rgba(var(--gold-rgb),0.14)', bdU:'rgba(var(--gold-rgb),0.30)'  },
        ].map(cfg => (
          <LevelBadge key={cfg.lv} {...cfg}
            unlocked={(profile?.level ?? 1) >= cfg.lv || userId === 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'}
            isCurrent={(profile?.level ?? 1) === cfg.lv && userId !== 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'}
            isPast={(profile?.level ?? 1) > cfg.lv && userId !== 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'}
            onOpen={() => { setGardenTier(cfg.lv); setShowGardenSettings(true) }}
          />
        ))}
        </div>
      </div>
    </div>
  )
}

// ── Composant réutilisable : message jardin ───────────────────────────────────
function MessageJardin({ profile, isMobile }) {
  const firstName = (profile?.display_name ?? '').split(' ')[0] || 'ami(e)'
  const PHRASES = [
    '{p}, votre jardin est prêt pour aujourd\'hui.',
    '{p}, un petit geste aujourd\'hui fera grandir votre jardin.',
    '{p}, votre jardin vous attend.',
    '{p}, prêt à nourrir votre jardin intérieur ?',
    '{p}, une nouvelle journée pour faire pousser l\'essentiel.',
    '{p}, votre jardin grandit avec vous.',
    '{p}, une minute suffit pour prendre soin de votre jardin.',
    '{p}, continuons à faire fleurir ce jardin.',
    '{p}, votre présence fait grandir votre jardin.',
    '{p}, plantons une belle graine aujourd\'hui.',
    '{p}, votre jardin n\'attend que vous.',
    '{p}, un nouveau jour commence dans votre jardin.',
    '{p}, prêt à faire grandir quelque chose de beau ?',
    '{p}, chaque action nourrit votre jardin.',
    '{p}, votre jardin avance avec vous.',
  ]
  const dayIndex = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const idx    = parseInt(dayIndex) % PHRASES.length
  const phrase = PHRASES[idx].replace('{p}', firstName)
  const colonIdx = phrase.indexOf(',')
  const namePart = phrase.slice(0, colonIdx + 1)
  const restPart = phrase.slice(colonIdx + 1)
  return (
    <div style={{
      flex:'1 1 0', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'24px 16px', textAlign:'center',
      animation:'fadeUp 0.5s ease both',
    }}>
      <div style={{ marginBottom:24, animation:'pulse 3s ease-in-out infinite' }}>
        <img src="/icons/icon-192.png" alt="logo" style={{ width:96, height:96, borderRadius:'50%', mixBlendMode:'screen' }} />
      </div>
      <div style={{
        fontFamily:"'Cormorant Garamond','Georgia',serif",
        fontSize: isMobile ? 26 : 30,
        fontWeight:700, fontStyle:'italic',
        lineHeight:1.35, maxWidth:320, letterSpacing:'0.01em',
      }}>
        <span style={{ color:'var(--green)' }}>{namePart}</span>
        <span style={{ color:'var(--text)' }}>{restPart}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AllRitualsModal — tous les rituels en colonne unique
// ─────────────────────────────────────────────────────────────────────────────
function RitualCard({ r, zone, zoneId, isDone, onOpen }) {
  return (
    <button
      onClick={() => { if (!isDone) onOpen(zoneId, r.id) }}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
        borderRadius:14, textAlign:'left', cursor: isDone ? 'default' : 'pointer', width:'100%',
        background: isDone ? `${zone.color}10` : '#fff',
        border:`1px solid ${isDone ? zone.color+'30' : 'rgba(200,160,150,.18)'}`,
        boxShadow: isDone ? 'none' : '0 1px 4px rgba(0,0,0,.05)',
        transition:'all .18s',
      }}
      onMouseEnter={e => { if (!isDone) { e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,.09)'; e.currentTarget.style.transform='translateY(-1px)' } }}
      onMouseLeave={e => { if (!isDone) { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.05)'; e.currentTarget.style.transform='none' } }}
    >
      <div style={{ flexShrink:0, width:32, height:32, borderRadius:'50%', background: isDone ? zone.color : `${zone.color}15`, border:`1.5px solid ${isDone ? zone.color : zone.color+'35'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color: isDone ? '#fff' : zone.color, transition:'all .2s' }}>
        {isDone ? '✓' : zone.emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontFamily:"'Jost',sans-serif", fontWeight: isDone ? 400 : 500, color: isDone ? 'rgba(30,20,8,.4)' : '#1a1208', lineHeight:1.35, textDecoration: isDone ? 'line-through' : 'none', textDecorationColor:`${zone.color}80` }}>{r.text}</div>
        {r.duration && (
          <span style={{ display:'inline-block', marginTop:5, padding:'2px 8px', borderRadius:100, fontSize:10, fontFamily:"'Jost',sans-serif", fontWeight:500, background:`${zone.color}15`, color:zone.color, letterSpacing:'.03em' }}>{r.duration}</span>
        )}
      </div>
      {!isDone && (
        <div style={{ flexShrink:0, width:26, height:26, borderRadius:'50%', background:`${zone.color}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:zone.color }}>›</div>
      )}
    </button>
  )
}

function AllRitualsModal({ completedRituals, onToggle, onClose }) {
  const isMobile = useIsMobile()
  const [activeZone,     setActiveZone]     = useState(null)
  const [activeRitualId, setActiveRitualId] = useState(null)
  // Accordéon mobile : première zone ouverte par défaut
  const [openZone, setOpenZone] = useState(() => Object.keys(PLANT_ZONES)[0])

  const totalDone  = Object.entries(PLANT_ZONES).reduce((acc, [zoneId]) => acc + (PLANT_RITUALS[zoneId] || []).filter(r => completedRituals[r.id]).length, 0)
  const totalCount = Object.entries(PLANT_ZONES).reduce((acc, [zoneId]) => acc + (PLANT_RITUALS[zoneId]?.length || 0), 0)

  const openRitual = (zoneId, ritualId) => { setActiveZone(zoneId); setActiveRitualId(ritualId) }

  const zoneEntries = Object.entries(PLANT_ZONES).filter(([zoneId]) => (PLANT_RITUALS[zoneId]?.length || 0) > 0)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:250, background:'rgba(20,12,5,.60)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', alignItems:'stretch' }}>
      <div style={{ flex:1, background:'#faf5f2', margin:'24px 0 0', borderRadius:'24px 24px 0 0', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 -16px 48px rgba(0,0,0,.18)' }}>

        {/* ── Header ── */}
        <div style={{ flexShrink:0, padding:'20px 22px 16px', borderBottom:'1px solid rgba(200,160,150,.15)', background:'rgba(255,255,255,.75)', backdropFilter:'blur(8px)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:400, color:'#1a1208', lineHeight:1.2 }}>Prendre soin de ma fleur</div>
              <div style={{ fontSize:11, color:'rgba(30,20,8,.38)', fontFamily:"'Jost',sans-serif", marginTop:4, letterSpacing:'.04em' }}>
                {totalDone === totalCount && totalCount > 0 ? '✦ Tout accompli aujourd\'hui' : `${totalDone} rituel${totalDone > 1 ? 's' : ''} accompli${totalDone > 1 ? 's' : ''} sur ${totalCount}`}
              </div>
            </div>
            <button onClick={onClose} style={{ flexShrink:0, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.8)', border:'1px solid rgba(200,160,150,.25)', cursor:'pointer', fontSize:14, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>✕</button>
          </div>
          <div style={{ height:3, borderRadius:3, background:'rgba(0,0,0,.07)', marginTop:14, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${totalCount ? totalDone/totalCount*100 : 0}%`, background:'linear-gradient(90deg,#c8a0d8,#9070a8)', borderRadius:3, transition:'width .6s ease' }}/>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '12px 0 40px' : '20px 28px 40px' }}>

          {/* ══ MOBILE : accordéon ══ */}
          {isMobile && (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {zoneEntries.map(([zoneId, zone]) => {
                const rituals = PLANT_RITUALS[zoneId] || []
                const done    = rituals.filter(r => completedRituals[r.id]).length
                const allDone = done === rituals.length
                const isOpen  = openZone === zoneId

                return (
                  <div key={zoneId} style={{ borderBottom:'1px solid rgba(200,160,150,.12)' }}>
                    {/* Trigger accordéon */}
                    <button
                      onClick={() => setOpenZone(isOpen ? null : zoneId)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'16px 22px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                    >
                      <div style={{ width:38, height:38, borderRadius:'50%', background: allDone ? zone.color : `${zone.color}18`, border:`1.5px solid ${zone.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {allDone ? <span style={{ fontSize:16, color:'#fff' }}>✓</span> : zone.emoji}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontFamily:"'Jost',sans-serif", fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:zone.color }}>{zone.name}</div>
                        <div style={{ fontSize:11, color:'rgba(30,20,8,.38)', fontFamily:"'Jost',sans-serif", marginTop:1 }}>{zone.subtitle}</div>
                      </div>
                      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, fontFamily:"'Jost',sans-serif", fontWeight:600, color: allDone ? zone.color : 'rgba(30,20,8,.3)' }}>
                          {allDone ? '✓' : `${done}/${rituals.length}`}
                        </span>
                        <span style={{ fontSize:14, color:'rgba(30,20,8,.3)', transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .2s', display:'inline-block' }}>›</span>
                      </div>
                    </button>

                    {/* Barre + Cards dépliées */}
                    {isOpen && (
                      <div style={{ padding:'0 22px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                        <div style={{ height:2, borderRadius:2, background:'rgba(0,0,0,.06)', marginBottom:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${rituals.length ? done/rituals.length*100 : 0}%`, background:zone.color, borderRadius:2, transition:'width .5s ease', opacity:.8 }}/>
                        </div>
                        {rituals.map(r => (
                          <RitualCard key={r.id} r={r} zone={zone} zoneId={zoneId} isDone={!!completedRituals[r.id]} onOpen={openRitual} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ══ DESKTOP : 2 colonnes ══ */}
          {!isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
              {zoneEntries.map(([zoneId, zone]) => {
                const rituals = PLANT_RITUALS[zoneId] || []
                const done    = rituals.filter(r => completedRituals[r.id]).length
                const allDone = done === rituals.length

                return (
                  <div key={zoneId} style={{ background:'rgba(255,255,255,.6)', borderRadius:18, border:'1px solid rgba(200,160,150,.14)', padding:'18px 18px 14px', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
                    {/* En-tête zone */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background: allDone ? zone.color : `${zone.color}18`, border:`1.5px solid ${zone.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {allDone ? <span style={{ fontSize:15, color:'#fff' }}>✓</span> : zone.emoji}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontFamily:"'Jost',sans-serif", fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:zone.color }}>{zone.name}</div>
                        <div style={{ fontSize:10, color:'rgba(30,20,8,.38)', fontFamily:"'Jost',sans-serif", marginTop:1 }}>{zone.subtitle}</div>
                      </div>
                      <span style={{ fontSize:11, fontFamily:"'Jost',sans-serif", fontWeight:600, color: allDone ? zone.color : 'rgba(30,20,8,.28)' }}>
                        {allDone ? '✓ Tout fait' : `${done}/${rituals.length}`}
                      </span>
                    </div>
                    <div style={{ height:2, borderRadius:2, background:'rgba(0,0,0,.06)', marginBottom:12, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${rituals.length ? done/rituals.length*100 : 0}%`, background:zone.color, borderRadius:2, transition:'width .5s ease', opacity:.8 }}/>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {rituals.map(r => (
                        <RitualCard key={r.id} r={r} zone={zone} zoneId={zoneId} isDone={!!completedRituals[r.id]} onOpen={openRitual} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {activeZone && (
        <RitualZoneModal
          zoneId={activeZone}
          completed={completedRituals}
          onToggle={onToggle}
          onClose={() => { setActiveZone(null); setActiveRitualId(null) }}
          initialRitualId={activeRitualId}
        />
      )}
    </div>
  )
}

function ScreenMonJardin({ userId, openCreate, onCreateClose, lumens, awardLumens, bilanDoneToday, onOpenBilan, openRitualsModal, onCloseRituals }) {
  // ── Charge PLANT_RITUALS depuis Supabase ──────────────────
  const { rituals: _rituals, loading: ritualsLoading } = useRituels()
  useEffect(() => {
    if (!ritualsLoading) {
      PLANT_RITUALS = _rituals
    }
  }, [_rituals, ritualsLoading])

  const { track } = useAnalytics(userId)
  const isMobile = useIsMobile()
  const { todayPlant, history, weekGrid, stats, todayRituals, isLoading, error, completeRitual } = usePlant(userId)
  const profile = useProfile(userId)

  // Optimistic override : mis à jour immédiatement quand un rituel est coché
  const [plantOverride, setPlantOverride] = useState(null)
  const plant = plantOverride ?? todayPlant   // ← utilisé partout à la place de todayPlant
  const { showWakeUp, setShowWakeUp } = useWakeUpTrigger({ userId })

  // ── Initialisation / carry-over du plant du jour ──────────────────────────────
  // Règle métier fondamentale : une plante ne revient JAMAIS à 5% une fois qu'elle
  // a progressé. Seul un tout nouvel utilisateur (history vide) commence à 5%.
  //
  // Deux cas gérés ici :
  //   A) Nouvel utilisateur (history vide) : le plant créé en DB a health=5 par défaut ✓
  //      → rien à faire, on laisse tel quel.
  //
  //   B) Utilisateur existant, cron raté la nuit : le plant du jour a été créé par
  //      le front avec les défauts DB (health=5), alors qu'il devrait avoir les valeurs
  //      de la veille. On détecte ce cas et on applique le carry-over manuellement.
  //
  //   C) Ancien bug (valeurs à 50 au lieu de 5) : géré aussi par sécurité.
  useEffect(() => {
    if (!todayPlant?.id) return
    if (isLoading) return
    if (todayRituals === undefined || todayRituals === null) return

    const isFirstEverPlant = !history || history.length === 0

    // ── Cas A : nouvel utilisateur → plant à 5% est correct, rien à faire
    if (isFirstEverPlant) return

    // ── Cas B & C : utilisateur existant avec plant du jour aux valeurs par défaut
    // (soit 5 = défaut DB si le cron a raté, soit 50 = ancien défaut front)
    const ZONE_KEYS = Object.values(ZONE_DB_KEY)
    const isAtDefault5  = todayPlant.health <= 5  && ZONE_KEYS.every(k => (todayPlant[k] ?? 5)  <= 5)
    const isAtDefault50 = todayPlant.health === 50 && ZONE_KEYS.every(k => (todayPlant[k] ?? 50) === 50)

    if ((isAtDefault5 || isAtDefault50) && todayRituals.length === 0) {
      // Cherche le plant le plus récent dans l'historique pour faire le carry-over
      const lastPlant = history[0]  // history est trié par date DESC
      if (!lastPlant) return

      const carryValues = Object.fromEntries(ZONE_KEYS.map(k => [k, Math.max(5, Math.floor((lastPlant[k] ?? 5) * 0.97))]))
      const carryHealth = Math.max(5, Math.floor((lastPlant.health ?? 5) * 0.97))

      // Ne carry-over que si les valeurs d'hier sont meilleures que ce qu'on a aujourd'hui
      if (carryHealth > (todayPlant.health ?? 5)) {
        supabase.from('plants').update({ health: carryHealth, ...carryValues }).eq('id', todayPlant.id)
        setPlantOverride({ ...todayPlant, health: carryHealth, ...carryValues })
        console.log(`[carry-over front] ${lastPlant.date} → aujourd'hui : health=${carryHealth}`)
      }
    }
  }, [todayPlant?.id, isLoading, todayRituals, history])
  const { settings, toggle } = usePrivacy(userId)

  // ── Mode contextuel selon l'heure ────────────────────────
  const timeContext = useMemo(() => {
    const h = new Date().getHours()
    if (h >= 0  && h < 12) return 'matin'   // 00h01 - 12h
    if (h >= 12 && h < 18) return 'aprem'   // 12h - 18h
    return 'soir'                             // 18h - 24h
  }, [])

  const CONTEXT_MESSAGES = {
    matin: [
      'Un beau matin commence dans votre jardin.',
      'Le matin est le meilleur moment pour prendre soin de vous.',
      'Commencez par votre bilan, votre jardin vous remerciera.',
      'Un rituel du matin, une journée qui s\'ancre.',
      'Votre jardin s\'éveille avec vous ce matin.',
    ],
    aprem: [
      'Un moment pour vous, au cœur de la journée.',
      'Vos rituels vous attendent, prenez un instant.',
      'Un souffle de calme au milieu de votre journée.',
      'Quelques minutes pour nourrir votre équilibre.',
      'Un rituel simple, un ancrage pour l\'après-midi.',
    ],
    soir: [
      'La journée se pose, votre jardin aussi.',
      'Ce soir, semez une graine de gratitude.',
      'Le soir est fait pour récolter ce que la journée a donné.',
      'Prenez soin de vous avant de vous reposer.',
      'Un dernier geste pour votre jardin avant la nuit.',
    ],
  }

  const contextMessage = useMemo(() => {
    const pool = CONTEXT_MESSAGES[timeContext]
    const day  = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,''))
    return pool[day % pool.length]
  }, [timeContext])

  // ── Nouveau système rituels ──────────────────────────────
  const {
    degradation,
    completedRituals,
    showQuiz,
    setShowQuiz,
    handleQuizComplete,
    handleToggleRitual: _toggleRitual,
  } = useRitualsState(userId, awardLumens)

  // Reçoit le résultat du bilan lancé depuis le NavHub
  useEffect(() => {
    const handler = (e) => handleQuizComplete(e.detail)
    window.addEventListener('bilanComplete', handler)
    return () => window.removeEventListener('bilanComplete', handler)
  }, [handleQuizComplete])

  const { getStreak, recordToday } = useStreak(userId)

  const handleToggleRitual = useCallback(async (ritualId) => {
    track('ritual_complete', { ritual_id: ritualId }, 'jardin', 'engagement')
    const alreadyDone = !!completedRituals[ritualId]

    // Un rituel complété ne peut pas être décoché — 1 seul par jour
    if (alreadyDone) return

    _toggleRitual(ritualId)

    if (!plant?.id) return

    // Trouve le rituel dans PLANT_RITUALS
    let ritualName = ritualId, ritualZoneStr = 'Racines', ritualZoneId = 'roots'
    for (const [zoneId, rits] of Object.entries(PLANT_RITUALS)) {
      const found = rits.find(r => r.id === ritualId)
      if (found) {
        ritualName    = found.text
        ritualZoneStr = PLANT_ZONES[zoneId]?.name ?? 'Racines'
        ritualZoneId  = zoneId
        break
      }
    }

    const dbKey       = ZONE_DB_KEY[ritualZoneId]
    const zoneKeys    = Object.values(ZONE_DB_KEY)
    const currentZone = plant?.[dbKey] ?? 5
    const currentHealth = plant?.health ?? 5

    // Delta progressif : petit au début (grande progression), ralentit en grandissant
    const streak  = recordToday()
    const delta   = computeRitualDelta(currentHealth, streak)

    const newZoneVal = Math.min(100, currentZone + delta)
    // newHealth = max entre (currentHealth + delta) et la moyenne des zones
    // Garantit que compléter un rituel ne fait JAMAIS baisser la vitalité,
    // même si les valeurs de zone en DB sont incohérentes avec plant.health
    const avgHealth = Math.round(
      zoneKeys.reduce((sum, k) => sum + (k === dbKey ? newZoneVal : (plant?.[k] ?? currentHealth)), 0) / zoneKeys.length
    )
    const newHealth = Math.min(100, Math.max(currentHealth + delta, avgHealth))

    // ── Optimistic update immédiat ──
    setPlantOverride(prev => ({ ...(prev ?? plant), [dbKey]: newZoneVal, health: newHealth }))

    const PENDING_KEY = `mji_pending_plant_${userId}`

    // Flush les éventuels updates en attente du passé
    const flushPending = async () => {
      try {
        const raw = localStorage.getItem(PENDING_KEY)
        if (!raw) return
        const pending = JSON.parse(raw)
        const { error } = await supabase.from('plants').update(pending.patch).eq('id', pending.plantId)
        if (!error) localStorage.removeItem(PENDING_KEY)
      } catch {}
    }
    flushPending()

    try {
      await supabase.from('rituals').upsert({
        user_id:      userId,
        plant_id:     plant.id,
        name:         ritualName,
        zone:         ritualZoneStr,
        health_delta: delta,
        ritual_id:    ritualId,
      }, { onConflict: 'user_id,ritual_id,plant_id' })
      logActivity({ userId, action: 'ritual', ritual: ritualName, zone: ritualZoneStr })
      logNetworkActivity(userId, 'ritual_complete')

      const patch = { [dbKey]: newZoneVal, health: newHealth }
      const { error } = await supabase.from('plants').update(patch).eq('id', plant.id)

      if (error) throw error
      localStorage.removeItem(PENDING_KEY)
    } catch (e) {
      // Retry une fois après 3s
      console.warn('ritual update failed, retrying in 3s…', e)
      setTimeout(async () => {
        const patch = { [dbKey]: newZoneVal, health: newHealth }
        const { error } = await supabase.from('plants').update(patch).eq('id', plant.id)
        if (error) {
          // Persiste pour réconciliation au prochain chargement
          try {
            localStorage.setItem(PENDING_KEY, JSON.stringify({ plantId: plant.id, patch }))
          } catch {}
          console.warn('ritual update retry failed, saved to localStorage', error)
        } else {
          localStorage.removeItem(PENDING_KEY)
        }
      }, 3000)
    }
  }, [_toggleRitual, completedRituals, plant, userId, recordToday])

  const PRIVACY_FIELDS = [
    { field:'show_health', icon:'🌸', label:'Visibilité de ma fleur' },
  ]

  const [gardenSettings, setGardenSettings] = useState(DEFAULT_GARDEN_SETTINGS)
  const [showGardenSettings, setShowGardenSettings] = useState(false)
  const [gardenTier, setGardenTier] = useState(1)
  const [showRitualsModal, setShowRitualsModal] = useState(false)

  // Ouverture depuis le bandeau bas du ScreenModal (DashboardV2)
  useEffect(() => {
    if (openRitualsModal) { setShowRitualsModal(true); onCloseRituals?.() }
  }, [openRitualsModal])

  // ── Stimulation IA ─────────────────────────────────────────
  const stimulationPayload = useMemo(() => ({
    streak:       stats?.streak           ?? 0,
    ritualsMonth: stats?.ritualsThisMonth ?? 0,
    favoriteZone: stats?.favoriteZone     ?? null,
    ritualsDone:  todayRituals?.length    ?? 0,
  }), [stats, todayRituals])

  // Charger les settings depuis Supabase
  useEffect(() => {
    if (!userId) return
    supabase
      .from('garden_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGardenSettings({
          sunriseH: data.sunrise_h ?? 7,
          sunriseM: data.sunrise_m ?? 0,
          sunsetH:  data.sunset_h  ?? 20,
          sunsetM:  data.sunset_m  ?? 0,
          petalColor1: data.petal_color1 ?? 'var(--zone-flowers)',
          petalColor2: data.petal_color2 ?? 'var(--zone-flowers)',
          petalShape:  data.petal_shape  ?? 'round',
        })
      })
  }, [userId])

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())

  const resolveColor = (c) => {
    if (!c || !c.startsWith('var(')) return c
    return getComputedStyle(document.documentElement)
      .getPropertyValue(c.slice(4, -1).trim()).trim() || c
  }

  const saveGardenSettings = async s => {
    setGardenSettings(s)
    await supabase.from('garden_settings').upsert({
      user_id: userId, sunrise_h: s.sunriseH, sunrise_m: s.sunriseM,
      sunset_h: s.sunsetH, sunset_m: s.sunsetM,
      petal_color1: resolveColor(s.petalColor1),
      petal_color2: resolveColor(s.petalColor2),
      petal_shape: s.petalShape,
    }, { onConflict: 'user_id' })
  }

  const timeIcon = timeContext === 'matin' ? '🌅' : timeContext === 'aprem' ? '☀️' : '🌙'
  const streak   = stats?.streak ?? 0

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(30,20,8,.4)', fontFamily:"'Jost',sans-serif", fontSize:13 }}>
      Votre jardin se réveille…
    </div>
  )

  return (
    <>
    {showGardenSettings && (
      <GardenSettingsModal
        settings={gardenSettings}
        level={profile?.level ?? 1}
        tier={gardenTier}
        isAdmin={userId === 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'}
        onSave={saveGardenSettings}
        onClose={() => setShowGardenSettings(false)}
      />
    )}
    {showRitualsModal && (
      <AllRitualsModal
        completedRituals={completedRituals}
        onToggle={handleToggleRitual}
        onClose={() => setShowRitualsModal(false)}
      />
    )}

    {/* ── Wrapper relatif pour l'image de fond ── */}
    <div style={{ position:'relative', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* ── Arbre en fond pleine hauteur — desktop uniquement ── */}
      {!isMobile && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
          <img src="/arbre.png" alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'left center', display:'block', opacity:1 }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(250,245,242,0) 0%, rgba(250,245,242,.5) 100%)' }}/>
        </div>
      )}

    {/* ── Contenu scrollable au-dessus ── */}
    <div style={{ position:'relative', zIndex:1, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', padding: isMobile ? '24px 20px 32px' : '32px 80px 40px 80px', gap:20, boxSizing:'border-box' }}>

      {/* Phrase contextuelle */}
      <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', textAlign:'center' }}>
        <span style={{ fontSize:26, flexShrink:0 }}>{timeIcon}</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, fontStyle:'italic', color:'#1a1208', lineHeight:1.3 }}>{contextMessage}</span>
      </div>

      {/* Fleur — cercle avec contours fondus */}
      <div style={{ position:'relative', flexShrink:0, display:'flex', justifyContent:'center', alignItems:'center' }}>
        {/* Cercle principal */}
        <div style={{
          position:'relative',
          width: isMobile ? 280 : 320,
          height: isMobile ? 280 : 320,
          borderRadius:'50%',
          overflow:'hidden',
          flexShrink:0,
          boxShadow:'0 0 0 1px rgba(200,160,150,.12), 0 8px 40px rgba(10,22,40,.14)',
        }}>
          <PlantSVG health={plant?.health ?? 5} gardenSettings={gardenSettings} lumensLevel={lumens?.level ?? 'faible'} lumensTotal={lumens?.total ?? 0} />
          {/* Fondu radial sur les bords — blend dans le fond */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'radial-gradient(circle, rgba(250,245,242,0) 55%, rgba(250,245,242,.55) 78%, rgba(250,245,242,1) 100%)', pointerEvents:'none' }}/>
        </div>

        {/* Streak */}
        {streak >= 1 && (
          <div style={{ position:'absolute', top:12, right: isMobile ? 12 : 16, display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:100, background:'rgba(0,0,0,.22)', border:'1px solid rgba(255,255,255,.18)', fontSize:11, color:'rgba(255,255,255,.88)', fontFamily:"'Jost',sans-serif" }}>
            👍 {streak} jour{streak > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Personnaliser */}
      <button
        onClick={() => { setGardenTier(profile?.level ?? 1); setShowGardenSettings(true) }}
        style={{ alignSelf:'center', display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:100, background:'rgba(255,255,255,.7)', border:'1px solid rgba(200,160,150,.25)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,.6)', transition:'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.95)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.7)'}
      >
        <span style={{ fontSize:14 }}>🎨</span>
        Personnaliser ma fleur
      </button>

      {/* Stimulation IA */}
      {!!userId && !!plant && (
        <AIInsightBlock
          userId={userId}
          edgeFn="stimulation"
          payload={stimulationPayload}
          color="#b090c8"
        />
      )}


    </div>{/* fin contenu scrollable */}
    </div>{/* fin wrapper relatif */}
    {false && <div className="mj-left" style={{ display:'none' }}>
        {/* ── Message contextuel ── */}
        <div style={{
          padding: isMobile ? '12px 4px 6px' : '10px 4px 8px',
          display:'flex', alignItems:'center', gap:12,
          marginBottom: isMobile ? 8 : 10,
        }}>
          <span style={{ fontSize: isMobile ? 22 : 24, flexShrink:0 }}>
            {timeContext === 'matin' ? '🌅' : timeContext === 'aprem' ? '☀️' : '🌙'}
          </span>
          <span style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 22 : 26,
            fontWeight:300, fontStyle:'italic',
            color:'var(--text2)',
            letterSpacing:'0.01em',
            lineHeight:1.25,
          }}>{contextMessage}</span>
        </div>

        {/* ── Bouton Action rapide — sous le message sur mobile, intégré sur desktop ── */}
        {isMobile && (
          <div
            onClick={() => window.dispatchEvent(new CustomEvent('openWakeUp'))}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'12px 20px', borderRadius:14, cursor:'pointer',
              marginBottom:10,
              background: timeContext === 'matin'
                ? 'linear-gradient(135deg,rgba(var(--gold-rgb),0.15),rgba(var(--gold-rgb),0.06))'
                : timeContext === 'aprem'
                ? 'linear-gradient(135deg,rgba(var(--green-rgb),0.12),rgba(var(--green-rgb),0.05))'
                : 'linear-gradient(135deg,rgba(var(--lumens-rgb),0.12),rgba(var(--lumens-rgb),0.05))',
              border: timeContext === 'matin'
                ? '1px solid rgba(var(--gold-rgb),0.30)'
                : timeContext === 'aprem'
                ? '1px solid rgba(var(--green-rgb),0.25)'
                : '1px solid rgba(var(--lumens-rgb),0.25)',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <span style={{ fontSize:'var(--fs-emoji-sm, 16px)' }}>⚡</span>
            <span style={{
              fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'.04em',
              fontFamily:"'Jost',sans-serif",
              color: timeContext === 'matin' ? 'var(--gold)'
                : timeContext === 'aprem' ? 'var(--green)'
                : 'rgba(var(--lumens-rgb),0.9)',
            }}>
              {timeContext === 'matin' ? 'Mon jardin en express'
                : timeContext === 'aprem' ? 'Une micro-pause qui compte'
                : 'Un instant pour mon jardin'}
            </span>
          </div>
        )}

        {/* ══ LAYOUT CONTEXTUEL ══ */}

        {/* ── MATIN : Fleur gauche | Bilan + Message droite ── */}
        {timeContext === 'matin' && (
          <div style={{
            display:'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems:'stretch', borderRadius:16, overflow:'hidden',
            border:'1px solid var(--border2)',
            background:'var(--bg)',
            flexShrink:0,
            minHeight: isMobile ? 'auto' : 360,
          }}>
            {/* Colonne gauche : fleur */}
            <ColonneFleur plant={plant} gardenSettings={gardenSettings} lumens={lumens} isMobile={isMobile} todayLabel={todayLabel} profile={profile} userId={userId} setGardenTier={setGardenTier} setShowGardenSettings={setShowGardenSettings} streak={stats?.streak ?? 0} />
            {/* Colonne droite : bilan */}
            <div style={{
              flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column',
              padding: isMobile ? '14px 16px 12px' : '18px 20px 16px',
              background:'var(--bg2)',
              gap:10,
            }}>
              {!bilanDoneToday ? (
                <button onClick={() => onOpenBilan?.()}
                  style={{ width:'100%', padding: isMobile ? '14px 16px' : '14px 18px', borderRadius:14,
                    border:'1px solid rgba(var(--gold-warm-rgb),0.25)', background:'rgba(var(--gold-warm-rgb),0.07)',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:12, textAlign:'left',
                    minHeight: isMobile ? 56 : 'auto', flexShrink:0 }}>
                  <span style={{ fontSize: isMobile ? 26 : 24 }}>🌹</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: isMobile ? 14 : 13, color:'var(--gold-warm)', fontWeight:500, marginBottom:2 }}>Faire mon bilan du jour</div>
                    <div style={{ fontSize: isMobile ? 11 : 10, color:'rgba(var(--ritual-modal-text-rgb),0.4)', fontStyle:'italic' }}>Prendre soin de soi commence ici</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, background:'rgba(var(--gold-rgb),0.12)', border:'1px solid rgba(var(--gold-rgb),0.30)', fontSize:'var(--fs-h5, 11px)', color:'var(--gold)', fontWeight:600, flexShrink:0 }}>
                    +3 ✦
                  </div>
                </button>
              ) : (
                <div>
                  <div style={{ width:'100%', padding:'12px 16px', borderRadius:14,
                    border:'1px solid var(--surface-2)', background:'var(--surface-1)',
                    display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                    <span style={{ fontSize:'var(--fs-emoji-md, 22px)', filter:'grayscale(1)', opacity:0.4 }}>🌹</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--text3)', fontWeight:500, marginBottom:1 }}>Bilan du matin ✓</div>
                      <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', opacity:0.4, fontStyle:'italic' }}>Demain nous ferons le point ✦</div>
                    </div>
                    <div style={{ fontSize:'var(--fs-h4, 14px)', color:'rgba(var(--green-rgb),0.35)' }}>✓</div>
                  </div>

                </div>
              )}
              {/* Bouton Action rapide — desktop uniquement */}
              {!isMobile && (
                <div
                  onClick={() => window.dispatchEvent(new CustomEvent('openWakeUp'))}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'13px 20px', borderRadius:13, cursor:'pointer',
                    background: timeContext === 'matin'
                      ? 'linear-gradient(135deg,rgba(var(--gold-rgb),0.14),rgba(var(--gold-rgb),0.06))'
                      : timeContext === 'aprem'
                      ? 'linear-gradient(135deg,rgba(var(--green-rgb),0.12),rgba(var(--green-rgb),0.05))'
                      : 'linear-gradient(135deg,rgba(var(--lumens-rgb),0.12),rgba(var(--lumens-rgb),0.05))',
                    border: timeContext === 'matin'
                      ? '1px solid rgba(var(--gold-rgb),0.32)'
                      : timeContext === 'aprem'
                      ? '1px solid rgba(var(--green-rgb),0.28)'
                      : '1px solid rgba(var(--lumens-rgb),0.28)',
                    WebkitTapHighlightColor:'transparent',
                    transition:'all .18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '.82'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'none' }}
                >
                  <span style={{ fontSize:'var(--fs-emoji-sm, 16px)' }}>⚡</span>
                  <span style={{
                    fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'.04em',
                    fontFamily:"'Jost',sans-serif",
                    color: timeContext === 'matin' ? 'var(--gold)'
                      : timeContext === 'aprem' ? 'var(--green)'
                      : 'rgba(var(--lumens-rgb),0.9)',
                  }}>
                    {timeContext === 'matin' ? 'Mon jardin en express'
                      : timeContext === 'aprem' ? 'Une micro-pause qui compte'
                      : 'Un instant pour mon jardin'}
                  </span>
                </div>
              )}

              {/* Message jardin ou insight */}
              {!bilanDoneToday ? (
                <MessageJardin profile={profile} isMobile={isMobile} />
              ) : degradation && (
                <BilanInsightCard degradation={degradation} plant={plant} userId={userId} fillHeight={!isMobile} />
              )}
            </div>
          </div>
        )}

        {/* ── APRÈS-MIDI : Fleur gauche | Insight ou Message droite ── */}
        {timeContext === 'aprem' && (
          <div style={{
            display:'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems:'stretch', borderRadius:16, overflow:'hidden',
            border:'1px solid var(--border2)',
            background:'var(--bg)',
            flexShrink:0,
            minHeight: isMobile ? 'auto' : 360,
          }}>
            {/* Colonne gauche : fleur */}
            <ColonneFleur plant={plant} gardenSettings={gardenSettings} lumens={lumens} isMobile={isMobile} todayLabel={todayLabel} profile={profile} userId={userId} setGardenTier={setGardenTier} setShowGardenSettings={setShowGardenSettings} streak={stats?.streak ?? 0} />
            {/* Colonne droite : bilan si pas fait, insight si fait, bouton express desktop */}
            <div style={{
              flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column',
              padding: isMobile ? '14px 16px 12px' : '18px 20px 16px',
              background:'var(--bg2)',
              gap:10,
              maxHeight: isMobile ? 200 : 'none',
              overflow: isMobile ? 'hidden' : 'visible',
            }}>
              {bilanDoneToday && degradation
                  ? <BilanInsightCard degradation={degradation} plant={plant} userId={userId} fillHeight={!isMobile} />
                  : <MessageJardin profile={profile} isMobile={isMobile} />
              }
              {/* Bouton Action rapide — desktop */}
              {!isMobile && (
                <div
                  onClick={() => window.dispatchEvent(new CustomEvent('openWakeUp'))}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'13px 20px', borderRadius:13, cursor:'pointer',
                    background:'linear-gradient(135deg,rgba(var(--green-rgb),0.12),rgba(var(--green-rgb),0.05))',
                    border:'1px solid rgba(var(--green-rgb),0.28)',
                    WebkitTapHighlightColor:'transparent',
                    transition:'all .18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='.82'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='none' }}
                >
                  <span style={{ fontSize:'var(--fs-emoji-sm, 16px)' }}>⚡</span>
                  <span style={{ fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'.04em', fontFamily:"'Jost',sans-serif", color:'var(--green)' }}>
                    Une micro-pause qui compte
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SOIR : Fleur gauche | Boîte à graines droite (desktop) / Fleur + Boîte (mobile) ── */}
        {timeContext === 'soir' && (
          isMobile ? (
            <>
              {/* Mobile : fleur seule */}
              <div style={{
                borderRadius:16, overflow:'hidden',
                border:'1px solid rgba(var(--green-rgb),0.08)',
                background:'var(--bg)',
                flexShrink:0,
              }}>
                <ColonneFleur plant={plant} gardenSettings={gardenSettings} lumens={lumens} isMobile={isMobile} todayLabel={todayLabel} profile={profile} userId={userId} setGardenTier={setGardenTier} setShowGardenSettings={setShowGardenSettings} streak={stats?.streak ?? 0} />
              </div>
              {/* Mobile : boîte à graines en dessous, pleine largeur */}
              <BoiteAGraines userId={userId} />
            </>
          ) : (
            /* Desktop : 2 colonnes */
            <div style={{
              display:'flex', flexDirection:'row',
              alignItems:'stretch', borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(var(--green-rgb),0.08)',
              background:'linear-gradient(160deg, var(--green3) 0%, var(--bg) 100%)',
              flexShrink:0, minHeight:360,
            }}>
              <ColonneFleur plant={plant} gardenSettings={gardenSettings} lumens={lumens} isMobile={false} todayLabel={todayLabel} profile={profile} userId={userId} setGardenTier={setGardenTier} setShowGardenSettings={setShowGardenSettings} streak={stats?.streak ?? 0} />
              <div style={{
                flex:'1 1 0', minWidth:0,
                padding:'18px 20px',
                display:'flex', flexDirection:'column',
                justifyContent:'center', gap:10,
                overflow:'auto',
              }}>
                <div
                  onClick={() => window.dispatchEvent(new CustomEvent('openWakeUp'))}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'13px 20px', borderRadius:13, cursor:'pointer',
                    background:'linear-gradient(135deg,rgba(var(--lumens-rgb),0.12),rgba(var(--lumens-rgb),0.05))',
                    border:'1px solid rgba(var(--lumens-rgb),0.28)',
                    WebkitTapHighlightColor:'transparent',
                    transition:'all .18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='.82'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='none' }}
                >
                  <span style={{ fontSize:'var(--fs-emoji-sm, 16px)' }}>⚡</span>
                  <span style={{ fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'.04em', fontFamily:"'Jost',sans-serif", color:'rgba(var(--lumens-rgb),0.9)' }}>
                    Un instant pour mon jardin
                  </span>
                </div>
                <BoiteAGraines userId={userId} inline />
              </div>
            </div>
          )
        )}

        {/* ── Rituels — toujours visibles ── */}
        <RitualsSection
          userId={userId}
          degradation={degradation}
          completedRituals={completedRituals}
          onToggleRitual={handleToggleRitual}
          onQuizComplete={handleQuizComplete}
          todayPlant={plant}
          onOpenBilan={onOpenBilan}
          bilanDoneToday={bilanDoneToday}
        />
      </div>}
    </>
  )
}

export { ScreenMonJardin, DailyQuizModal, BoiteAGraines }
