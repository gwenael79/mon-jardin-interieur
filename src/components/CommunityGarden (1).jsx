// src/components/CommunityGarden.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../core/supabaseClient'

/* ─────────────────────────────────────────────────────
   CHARGEMENT — dernière plante par user + settings jardin
   Respecte privacy_settings.show_health
───────────────────────────────────────────────────── */
async function loadCommunityPlants() {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [usersRes, plantsRes, privacyRes, settingsRes] = await Promise.all([
    // Tous les membres de la communauté
    supabase.from('users').select('id'),
    // Plantes récentes
    supabase
      .from('plants')
      .select('user_id, health, date')
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false }),
    supabase
      .from('privacy_settings')
      .select('user_id')
      .eq('show_health', false),
    supabase
      .from('garden_settings')
      .select('user_id, petal_color1, petal_color2, petal_shape, sunrise_h, sunrise_m, sunset_h, sunset_m'),
  ])

  if (plantsRes.error) throw new Error(plantsRes.error.message)

  const hidden   = new Set((privacyRes.data || []).map(p => p.user_id))
  const settings = {}
  ;(settingsRes?.data || []).forEach(s => { settings[s.user_id] = s })

  // Dernière plante connue par user
  const plantsByUser = {}
  for (const row of (plantsRes.data || [])) {
    if (!plantsByUser[row.user_id]) plantsByUser[row.user_id] = row
  }

  // Tous les users — avec leur plante ou une graine (health=0) si pas encore de plante
  const result = []
  for (const u of (usersRes.data || [])) {
    if (hidden.has(u.id)) continue
    const plant = plantsByUser[u.id] || { user_id: u.id, health: 0, date: null }
    result.push({ ...plant, gardenSettings: settings[u.id] || null })
  }

  return result
}

/* ─────────────────────────────────────────────────────
   HASH DÉTERMINISTE — génère des couleurs par défaut
   si l'utilisateur n'a pas de settings personnalisés
───────────────────────────────────────────────────── */
function hash(str, seed = 0) {
  let h = (2166136261 ^ seed) >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

// Convertit hex en [r,g,b]
function h2r(hex) {
  const v = parseInt((hex || '#e8789a').replace('#',''), 16)
  return [(v>>16)&255, (v>>8)&255, v&255]
}

// Génère des couleurs pétale déterministes depuis userId
function defaultPetalColors(userId) {
  const s    = String(userId || 'x')
  const h1   = hash(s, 1), h2 = hash(s, 2)
  const hue  = 10 + (h1 % 300)       // évite les verts purs
  const sat  = 55 + (h2 % 35)
  const lit  = 58 + (hash(s,3) % 22)
  // Convertir HSL → hex approximatif pour réutiliser h2r
  const toHex = (h,s,l) => {
    s /= 100; l /= 100
    const a = s * Math.min(l, 1-l)
    const f = n => {
      const k = (n + h/30) % 12
      const color = l - a*Math.max(Math.min(k-3,9-k,1),-1)
      return Math.round(255*color).toString(16).padStart(2,'0')
    }
    return '#' + f(0) + f(8) + f(4)
  }
  return {
    petalColor1: toHex(hue, sat, lit),
    petalColor2: toHex((hue+22)%360, sat-10, lit+10),
    petalShape:  ['round','wide','pointed'][h1 % 3],
  }
}

/* ─────────────────────────────────────────────────────
   COMPOSANT UNE FLEUR — exactement comme PlantSVG
   mais adaptée au champ (pas de ciel/sol propre,
   tige fine, viewBox centré sur la fleur)
───────────────────────────────────────────────────── */
let _n = 0
function FieldFlower({ plant, isMine, x, groundY, sceneH }) {
  // Heure du jour selon les paramètres propres à ce user
  const _hour   = new Date().getHours() + new Date().getMinutes() / 60
  const _gs     = plant.gardenSettings
  const _riseH  = (_gs?.sunrise_h ?? 7)  + (_gs?.sunrise_m ?? 0) / 60
  const _setH   = (_gs?.sunset_h  ?? 20) + (_gs?.sunset_m  ?? 0) / 60
  const _isDay  = _hour >= _riseH && _hour <= _setH
  const _isGold = _isDay && (Math.abs(_hour - _riseH) < 1.2 || Math.abs(_hour - _setH) < 1.2)
  // Opacité globale de la fleur : réduite la nuit, dorée à l'aube/crépuscule
  const _opacity = _isDay ? (_isGold ? 1 : 0.95) : 0.42
  const id  = useRef('cf' + (++_n)).current
  const r   = Math.max(0, Math.min(1, (plant.health ?? 50) / 100))

  // Résoudre les couleurs : settings perso > défaut déterministe
  const gs = useMemo(() => {
    const s = plant.gardenSettings
    if (s && s.petal_color1) {
      return { petalColor1: s.petal_color1, petalColor2: s.petal_color2 || s.petal_color1, petalShape: s.petal_shape || 'round' }
    }
    return defaultPetalColors(plant.user_id)
  }, [plant])

  /* ── Couleurs pétales (identique à PlantSVG) ── */
  const [r1,g1,b1] = h2r(gs.petalColor1)
  const [r2,g2,b2] = h2r(gs.petalColor2)
  const pC1  = `rgba(${r1},${g1},${b1},${0.78+0.18*r})`
  const pC2  = `rgba(${r2},${g2},${b2},${0.60+0.28*r})`
  const pInr = `rgba(${Math.min(255,r2+28)},${Math.min(255,g2+28)},${Math.min(255,b2+28)},${0.45+0.22*r})`
  const pBk1 = `rgba(${Math.round(r1*.72)},${Math.round(g1*.72)},${Math.round(b1*.72)},0.48)`
  const pBk2 = `rgba(${Math.round(r1*.55)},${Math.round(g1*.55)},${Math.round(b1*.55)},0.30)`

  /* ── Forme pétales (identique à PlantSVG) ── */
  const ps  = gs.petalShape || 'round'
  const pRx = ps==='wide' ? 8+14*r : ps==='pointed' ? 4+7*r  : 6+10*r
  const pRy = ps==='wide' ? 9+13*r : ps==='pointed' ? 14+22*r: 12+18*r
  const pD  = 8+11*r

  /* ── Tige — plus fine que PlantSVG (champ = distance) ── */
  const stemH = Math.min(groundY * 0.45, groundY * (0.08 + 0.38*r))  // max 45% du canvas
  const cx    = x
  const sTY   = groundY - stemH
  const sMY   = groundY - stemH * 0.50
  const curve = ((hash(plant.user_id,7) % 20) - 10) * 0.7   // légère courbure naturelle
  const flwY  = sTY

  const stemC = `rgba(${45+25*r},${115+65*r},${32+22*r},${0.55+0.42*r})`
  const stemH2= `rgba(${70+30*r},${162+50*r},${50+20*r},0.26)`
  const lC1   = `rgba(${32+22*r},${105+85*r},${28+18*r},${0.62+0.30*r})`
  const lC2   = `rgba(${38+18*r},${115+72*r},${32+22*r},${0.58+0.34*r})`
  const lV    = `rgba(${55+35*r},${152+55*r},${44+22*r},0.30)`

  /* ── Oscillation — unique par plante ── */
  const swayDur   = 2.6 + (hash(plant.user_id, 3) % 32) / 10
  const swayDelay = (hash(plant.user_id, 4) % 46) / 10
  const swayAmp   = (hash(plant.user_id, 1) % 2 === 0 ? 1 : -1) * (1.1 + (hash(plant.user_id,5) % 18) / 10)

  const p1angles = [0,45,90,135,180,225,270,315]
  const p2angles = [22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5]

  return (
    <g
      style={{
        '--sa': `${swayAmp}deg`,
        animation: `cgSway ${swayDur.toFixed(2)}s ease-in-out infinite ${swayDelay.toFixed(2)}s`,
        transformOrigin: `${cx}px ${groundY}px`,
        opacity: _opacity,
        transition: 'opacity 2s ease',
      }}
    >
      <defs>
        {/* Gradients pétales — identiques à PlantSVG */}
        <radialGradient id={id+'pi'} cx="40%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="rgba(255,242,98,1)"/>
          <stop offset="100%" stopColor="rgba(218,146,46,0.92)"/>
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
          <stop offset="0%"   stopColor={`rgba(${r1},${g1},${b1},${0.14+0.12*r})`}/>
          <stop offset="100%" stopColor={`rgba(${r1},${g1},${b1},0)`}/>
        </radialGradient>
        <filter id={id+'f1'}><feGaussianBlur stdDeviation="0.7"/></filter>
        <filter id={id+'f3'}><feGaussianBlur stdDeviation="4"/></filter>

        {/* Glow point identifiant */}
        {isMine && (
          <radialGradient id={id+'gl'} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(148,242,115,0.95)"/>
            <stop offset="60%"  stopColor="rgba(148,242,115,0.28)"/>
            <stop offset="100%" stopColor="rgba(148,242,115,0)"/>
          </radialGradient>
        )}
      </defs>

      {/* ── POINT LUMINEUX IDENTIFIANT ──
          Fixe dans le sol, seule l'opacité pulse — pas de mouvement */}
      {isMine && (
        <g style={{ animation: 'cgPulse 2.2s ease-in-out infinite' }}>
          <ellipse cx={cx} cy={groundY + 2} rx={14} ry={4.5} fill={`url(#${id}gl)`}/>
          <circle  cx={cx} cy={groundY}     r={3.2}           fill="rgba(158,248,125,0.97)"/>
          <circle  cx={cx} cy={groundY}     r={1.5}           fill="rgba(255,255,255,0.90)"/>
        </g>
      )}

      {/* ── TIGE ── */}
      {r > 0.04 && <>
        <path
          d={`M${cx},${groundY} C${cx+curve*0.4},${sMY+stemH*0.18} ${cx+curve*0.8},${sMY-stemH*0.10} ${cx+curve},${sTY}`}
          stroke={stemC}
          strokeWidth={1.6 + 1.4*r}
          strokeLinecap="round"
          fill="none"
        />
        {r > 0.18 && (
          <path
            d={`M${cx-0.5},${groundY} C${cx+curve*0.4-0.5},${sMY+stemH*0.18} ${cx+curve*0.8-0.5},${sMY-stemH*0.10} ${cx+curve-0.8},${sTY+3}`}
            stroke={stemH2}
            strokeWidth={0.8}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Feuille gauche — même forme que PlantSVG */}
        {r > 0.12 && (
          <g>
            <path d={`M${cx+curve*0.4-1},${Math.round(sMY+18*r)} C${cx+curve*0.4-1-22*r},${Math.round(sMY+8*r)} ${cx+curve*0.4-1-26*r},${Math.round(sMY-8*r)} ${cx+curve*0.4-1-9*r},${Math.round(sMY-9*r)} C${cx+curve*0.4-1-3*r},${Math.round(sMY-8*r)} ${cx+curve*0.4-1-4*r},${Math.round(sMY+6*r)} ${cx+curve*0.4-1},${Math.round(sMY+18*r)} Z`}
              fill={lC1}/>
            <path d={`M${cx+curve*0.4-1},${Math.round(sMY+18*r)} Q${cx+curve*0.4-1-15*r},${Math.round(sMY+5*r)} ${cx+curve*0.4-1-9*r},${Math.round(sMY-9*r)}`}
              stroke={lV} strokeWidth={0.8} fill="none"/>
          </g>
        )}

        {/* Feuille droite */}
        {r > 0.22 && (
          <g>
            <path d={`M${cx+curve*0.6+1},${Math.round(sMY-8*r)} C${cx+curve*0.6+1+24*r},${Math.round(sMY-18*r)} ${cx+curve*0.6+1+28*r},${Math.round(sMY-36*r)} ${cx+curve*0.6+1+11*r},${Math.round(sMY-37*r)} C${cx+curve*0.6+1+1*r},${Math.round(sMY-38*r)} ${cx+curve*0.6+1+3*r},${Math.round(sMY-22*r)} ${cx+curve*0.6+1},${Math.round(sMY-8*r)} Z`}
              fill={lC2}/>
            <path d={`M${cx+curve*0.6+1},${Math.round(sMY-8*r)} Q${cx+curve*0.6+1+17*r},${Math.round(sMY-20*r)} ${cx+curve*0.6+1+11*r},${Math.round(sMY-37*r)}`}
              stroke={lV} strokeWidth={0.8} fill="none"/>
          </g>
        )}
      </>}

      {/* ── GRAINE ── */}
      {r <= 0.08 && (
        <g>
          <ellipse cx={cx} cy={flwY+5} rx={4} ry={2.5} fill="rgba(118,78,36,0.52)"/>
          <path d={`M${cx},${flwY+3} Q${cx+2},${flwY-4} ${cx+1},${flwY-8}`} stroke="rgba(78,138,48,0.60)" strokeWidth={1.2} strokeLinecap="round" fill="none"/>
        </g>
      )}

      {/* ── BOURGEON ── */}
      {r > 0.08 && r <= 0.38 && (
        <g>
          {[-22,0,22].map((a,i) => (
            <path key={i}
              d={`M${cx+curve},${Math.round(flwY+5+7*r)} Q${cx+curve+Math.round(Math.sin(a*Math.PI/180)*7)},${Math.round(flwY+7*r)} ${cx+curve},${Math.round(flwY+6*r)}`}
              fill={lC2} opacity={0.68}/>
          ))}
          <ellipse cx={cx+curve} cy={flwY}   rx={3.5+5.5*r} ry={7+9*r} fill={`rgba(${r1},${g1},${b1},${0.52+0.34*r})`}/>
          <ellipse cx={cx+curve-1} cy={flwY-1} rx={2+4*r}  ry={4.5+7*r} fill={`rgba(${r2},${g2},${b2},0.40)`}/>
        </g>
      )}

      {/* ── FLEUR ÉPANOUIE — identique à PlantSVG ── */}
      {r > 0.38 && (
        <g>
          <circle cx={cx+curve} cy={flwY} r={pD*3.2} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>

          {/* Calice */}
          {[-28,0,28].map((a,i) => {
            const rad = (a-90)*Math.PI/180
            return <path key={i}
              d={`M${cx+curve},${Math.round(flwY+pRy*0.52)} Q${cx+curve+Math.round(Math.cos(rad)*8)},${Math.round(flwY+pRy*0.52+10)} ${cx+curve},${Math.round(flwY+pRy*0.52+12)}`}
              fill={lC2} opacity={0.62}/>
          })}

          {/* Pétales arrière */}
          <g style={{animation:`cgBreath ${(swayDur*1.1).toFixed(2)}s ease-in-out infinite ${(swayDelay+0.5).toFixed(2)}s`}}>
            {p2angles.map((angle,i) => {
              const rad = angle*Math.PI/180
              const px  = cx+curve + Math.cos(rad)*pD*0.8
              const py  = flwY    + Math.sin(rad)*pD*0.8
              return <ellipse key={i} cx={px} cy={py}
                rx={pRx*0.68} ry={pRy*0.68}
                fill={`url(#${id}p2)`}
                transform={`rotate(${angle+90},${px},${py})`}
                filter={`url(#${id}f1)`}/>
            })}
          </g>

          {/* Pétales avant */}
          <g style={{animation:`cgBreath ${swayDur.toFixed(2)}s ease-in-out infinite ${swayDelay.toFixed(2)}s`}}>
            {p1angles.map((angle,i) => {
              const rad = angle*Math.PI/180
              const px  = cx+curve + Math.cos(rad)*pD
              const py  = flwY    + Math.sin(rad)*pD
              return <ellipse key={i} cx={px} cy={py}
                rx={pRx} ry={pRy}
                fill={`url(#${id}p1)`}
                transform={`rotate(${angle+90},${px},${py})`}/>
            })}
          </g>

          {/* Pistil */}
          <circle cx={cx+curve} cy={flwY} r={7+5*r}   fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.88)`}/>
          <circle cx={cx+curve} cy={flwY} r={3.8+3.2*r} fill={`url(#${id}pi)`}/>

          {/* Pollen */}
          {r > 0.52 && [0,51,103,154,205,257,308].map((a,i) => {
            const rp  = 5+3*r
            const rad = a*Math.PI/180
            return <circle key={i}
              cx={cx+curve+Math.cos(rad)*rp} cy={flwY+Math.sin(rad)*rp}
              r={0.9} fill={`rgba(255,232,72,${0.65+0.24*r})`}
              style={{animation:`cgPollen 2.2s ease-in-out infinite ${(i*0.18).toFixed(2)}s`}}/>
          })}
        </g>
      )}
    </g>
  )
}


/* ─────────────────────────────────────────────────────
   FOND ARRIÈRE — herbes hautes floues, effet profondeur
───────────────────────────────────────────────────── */
function BackgroundFoliage({ svgW, groundY }) {
  const items = useMemo(() => {
    const arr = []
    // Grandes herbes hautes — plan intermédiaire
    for (let i = 0; i < Math.floor(svgW / 8); i++) {
      const x     = i * 8 + (hash('bg'+i, 1) % 8)
      const h     = 28 + (hash('bg'+i, 2) % 55)       // 28–83px
      const lean  = ((hash('bg'+i, 3) % 22) - 11) * 0.7
      const thick = 0.8 + (hash('bg'+i, 4) % 12) / 10
      const green = 68 + (hash('bg'+i, 5) % 28)
      const alpha = 0.18 + (hash('bg'+i, 6) % 22) / 100
      arr.push({ x, h, lean, thick, green, alpha, type: 'tall' })
    }
    // Touffes larges — feuilles ovales floues
    for (let i = 0; i < Math.floor(svgW / 22); i++) {
      const x    = 4 + i * 22 + (hash('bt'+i, 1) % 18) - 9
      const h    = 18 + (hash('bt'+i, 2) % 32)
      const w    = 6  + (hash('bt'+i, 3) % 14)
      const g    = 72 + (hash('bt'+i, 4) % 30)
      const a    = 0.12 + (hash('bt'+i, 5) % 18) / 100
      arr.push({ x, h, w, g, a, type: 'bush' })
    }
    return arr
  }, [svgW])

  return (
    <g filter="url(#cgBgBlur)" opacity={0.82}>
      {items.map((b, i) => {
        if (b.type === 'tall') {
          // Brin d'herbe haute avec courbe naturelle
          const mx = b.x + b.lean * 0.45
          const my = groundY - b.h * 0.55
          return (
            <g key={'t'+i}
              style={{
                animation: `cgGrass ${2.8+(i%11)*0.32}s ease-in-out infinite ${(i%15)*0.19}s`,
                transformOrigin: `${b.x}px ${groundY}px`,
              }}
            >
              <path
                d={`M${b.x},${groundY} Q${mx},${my} ${b.x+b.lean},${groundY-b.h}`}
                stroke={`rgba(32,${b.green},18,${b.alpha})`}
                strokeWidth={b.thick}
                strokeLinecap="round"
                fill="none"
              />
              {/* Feuille latérale sur les plus grandes */}
              {b.h > 52 && (
                <path
                  d={`M${mx},${my+8} C${mx-b.lean*0.8-8},${my} ${mx-b.lean*0.8-10},${my-10} ${mx-b.lean*0.4-4},${my-12} C${mx-2},${my-8} ${mx},${my} ${mx},${my+8} Z`}
                  fill={`rgba(28,${b.green-4},14,${b.alpha*0.9})`}
                />
              )}
            </g>
          )
        }
        // Touffe ovale floue
        return (
          <ellipse key={'b'+i}
            cx={b.x} cy={groundY - b.h * 0.55}
            rx={b.w} ry={b.h * 0.55}
            fill={`rgba(24,${b.g},12,${b.a})`}
            style={{
              animation: `cgGrass ${3.2+(i%7)*0.4}s ease-in-out infinite ${(i%9)*0.23}s`,
              transformOrigin: `${b.x}px ${groundY}px`,
            }}
          />
        )
      })}
    </g>
  )
}

/* ─────────────────────────────────────────────────────
   HERBES DE FOND
───────────────────────────────────────────────────── */
function GrassLayer({ svgW, groundY }) {
  const items = useMemo(() => {
    const arr = []
    for (let i = 0; i < Math.floor(svgW / 3); i++) {
      const x    = i * 3 + (hash('g'+i, 1) % 3)
      const h_   = 4 + (hash('g'+i, 2) % 22)
      const lean = ((hash('g'+i, 3) % 18) - 9) * 0.55
      const a    = 0.16 + (hash('g'+i, 4) % 62) / 100
      const gr   = 82 + (hash('g'+i, 5) % 42)
      arr.push({ x, h:h_, lean, a, gr, type:'blade' })
    }
    for (let i = 0; i < Math.floor(svgW / 18); i++) {
      const x    = 8 + i*18 + (hash('df'+i, 1) % 24) - 12
      const yoff = 2 + (hash('df'+i, 2) % 12)
      const hue  = 15 + (hash('df'+i, 3) % 310)
      const r_   = 1.3 + (hash('df'+i, 4) % 20) / 10
      arr.push({ x, yoff, hue, r:r_, type:'deco' })
    }
    return arr
  }, [svgW])

  return (
    <g>
      {items.map((b, i) => {
        if (b.type === 'blade') {
          return (
            <line key={'b'+i}
              x1={b.x} y1={groundY}
              x2={b.x + b.lean} y2={groundY - b.h}
              stroke={`rgba(36,${b.gr},20,${b.a})`}
              strokeWidth={0.6 + (hash('bw'+i,1) % 10)/10}
              strokeLinecap="round"
              style={{
                animation: `cgGrass ${2.0+(i%9)*0.28}s ease-in-out infinite ${(i%14)*0.17}s`,
                transformOrigin: `${b.x}px ${groundY}px`,
              }}
            />
          )
        }
        // Petite fleur déco
        const ang = [0,72,144,216,288]
        return (
          <g key={'d'+i}
            style={{
              animation: `cgGrass ${2.5+(i%6)*0.38}s ease-in-out infinite ${(i%9)*0.22}s`,
              transformOrigin: `${b.x}px ${groundY - b.yoff}px`,
            }}
          >
            {ang.map((a,j) => {
              const rad = a*Math.PI/180
              return (
                <ellipse key={j}
                  cx={b.x + Math.cos(rad)*b.r*1.5}
                  cy={groundY - b.yoff + Math.sin(rad)*b.r*1.5}
                  rx={b.r*0.82} ry={b.r*1.42}
                  fill={`hsla(${b.hue},62%,70%,0.56)`}
                  transform={`rotate(${a+90},${b.x+Math.cos(rad)*b.r*1.5},${groundY-b.yoff+Math.sin(rad)*b.r*1.5})`}
                />
              )
            })}
            <circle cx={b.x} cy={groundY - b.yoff} r={b.r*0.72} fill={`hsla(${(b.hue+45)%360},78%,80%,0.70)`}/>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────── */
export default function CommunityGarden({ currentUserId, onClose }) {
  const [plants,  setPlants]  = useState([])
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    loadCommunityPlants()
      .then(d  => { setPlants(d); setLoading(false) })
      .catch(e => { setErr(e.message); setLoading(false) })
  }, [])

  // Auto-scroll pour centrer MA fleur dans la fenêtre
  useEffect(() => {
    if (!plants.length || !scrollRef.current || !currentUserId) return
    const myIndex = plants.findIndex(p => p.user_id === currentUserId)
    if (myIndex === -1) return
    const myX = positions.find(p => p.user_id === currentUserId)?.x ?? 0
    const containerW = scrollRef.current.clientWidth
    const svgRenderedW = scrollRef.current.scrollWidth
    // Ratio pixels réels / unités SVG
    const ratio = svgRenderedW / svgW
    const scrollTo = myX * ratio - containerW / 2
    scrollRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' })
  }, [plants, currentUserId])

  const W_PER   = 42
  const MIN_W   = 960
  const svgH    = 580
  const groundY = Math.round(svgH * 0.85)
  const svgW    = Math.max(MIN_W, plants.length * W_PER + 220)

  // Ciel global : calculé depuis les settings du user connecté
  // Chaque fleur utilise SES PROPRES horaires pour son opacité individuelle
  const hour = new Date().getHours() + new Date().getMinutes() / 60
  const mySettings = plants.find(p => p.user_id === currentUserId)?.gardenSettings
  const myRiseH = mySettings ? (mySettings.sunrise_h ?? 7)  + (mySettings.sunrise_m ?? 0) / 60 : 7
  const mySetH  = mySettings ? (mySettings.sunset_h  ?? 20) + (mySettings.sunset_m  ?? 0) / 60 : 20

  // Progression dans la journée 0→1 (comme PlantSVG)
  const dp       = Math.max(0, Math.min(1, (hour - myRiseH) / (mySetH - myRiseH)))
  const isDay    = hour >= myRiseH && hour <= mySetH
  const isNight  = !isDay
  const isGolden = isDay && (Math.abs(hour - myRiseH) < 1.2 || Math.abs(hour - mySetH) < 1.2)

  // Soleil suit un arc : gauche (lever) → zénith (midi) → droite (coucher)
  const sunX = svgW * 0.05 + dp * (svgW * 0.90)
  const sunY = svgH * (0.62 - 0.36 * Math.sin(dp * Math.PI))  // arc modéré, visible au centre

  // Couleurs ciel dépendent de dp (teinte chaude lever/coucher, froide midi)
  const skyHue = isNight ? null : Math.round(200 - dp * (1 - dp) * 4 * 60)  // plus chaud aux extrêmes
  const skyA = isNight ? '#020510'  : isGolden ? '#1a0a04' : '#0b1e3a'
  const skyB = isNight ? '#060c1e'  : isGolden ? `hsl(${skyHue},72%,22%)` : '#1e4e8a'
  const skyC = isNight ? '#0a1228'  : isGolden ? '#d96418' : `hsl(${skyHue},60%,46%)`
  const fogC = isNight ? 'rgba(12,18,42,0.80)'
    : isGolden ? 'rgba(180,80,20,0.20)' : 'rgba(40,90,155,0.16)'

  const moonX = svgW * 0.14
  const moonY = groundY * 0.14

  const stars = useMemo(() => isNight
    ? Array.from({length:90},(_,i) => ({
        x: hash('sx'+i,1) % svgW,
        y: hash('sy'+i,2) % Math.round(groundY*0.72),
        r: 0.4 + (hash('sr'+i,3)%14)/10,
        delay: (hash('sd'+i,4)%50)/10,
      }))
    : [], [isNight, svgW, groundY])

  // Positions — désordre naturel, chevauchement
  // Ma fleur placée au centre du canvas SVG
  const positions = useMemo(() => {
    const myIdx = plants.findIndex(p => p.user_id === currentUserId)
    // Si mon user n'est pas dans la liste (pas de plante aujourd'hui),
    // distribuer les fleurs normalement centrées
    const anchorIdx = myIdx >= 0 ? myIdx : Math.floor(plants.length / 2)
    return plants
      .map((p, i) => {
        const xNoise = (hash(p.user_id, 9) % 28) - 14
        const yNoise = p.user_id === currentUserId ? 10 : (hash(p.user_id, 8) % 14) - 9
        const offset = i - anchorIdx
        const baseX  = svgW / 2 + offset * W_PER
        return { ...p, x: baseX + xNoise, yOff: yNoise }
      })
      .sort((a,b) => a.yOff - b.yOff)
  }, [plants, currentUserId, svgW])

  const scrollable = svgW > 1380

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:300,
      background:`linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(8,4,2,0.97) 100%)`,
      overflow:'hidden',
      display:'flex', flexDirection:'column',
      backdropFilter:'blur(10px)',
      animation:'cgFadeIn 0.38s ease',
      padding:'0',
    }}>
      <style>{`
        @keyframes cgFadeIn  { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes cgSway    { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(var(--sa,2deg))} 75%{transform:rotate(calc(var(--sa,2deg)*-0.68))} }
        @keyframes cgBreath  { 0%,100%{opacity:1} 50%{opacity:0.80} }
        @keyframes cgPulse   { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes cgPollen  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes cgGrass   { 0%,100%{transform:rotate(0deg)} 38%{transform:rotate(2.2deg)} 72%{transform:rotate(-1.6deg)} }
        @keyframes cgStar    { 0%,100%{opacity:0.72} 50%{opacity:0.18} }
        @keyframes cgRay     { 0%,100%{opacity:0.50} 50%{opacity:0.20} }
        div[data-cg]::-webkit-scrollbar { height: 5px; }
        div[data-cg]::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius:3px; }
        div[data-cg]::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius:3px; }
        div[data-cg]::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.40); }
      `}</style>

      {/* HEADER — overlay sur le paysage */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:10,
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        padding:'20px 24px 0',
        pointerEvents:'none',  // le bouton a pointerEvents:auto
      }}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:300, color:'rgba(238,232,218,0.95)', letterSpacing:'.01em'}}>
            Le Jardin Collectif
          </div>
          <div style={{fontSize:10, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(238,232,218,0.32)', marginTop:4}}>
            {loading ? "Les jardins s'éveillent…"
              : err ? 'Erreur de chargement'
              : `${plants.length} jardins en fleur · anonyme · temps réel`}
          </div>
        </div>
        <button onClick={onClose} style={{
          width:36, height:36, borderRadius:'50%',
          background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)',
          color:'rgba(238,232,218,0.62)', fontSize:17, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .2s', flexShrink:0,
          pointerEvents:'auto',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >✕</button>
      </div>

      {/* PAYSAGE — pleine largeur, plein écran */}
      <div
        ref={scrollRef}
        data-cg="1"
        style={{
          position:'absolute', inset:0,
          overflowX:'auto',
          overflowY:'hidden',
          scrollbarWidth:'thin',
          scrollbarColor:'rgba(255,255,255,0.22) rgba(255,255,255,0.04)',
        }}
      >

        {loading && (
          <div style={{width:'100%',height:'100%',minHeight:'300px',background:`linear-gradient(180deg,${skyA},${skyB} 55%,${skyC})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:11,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(238,232,218,0.26)'}}>Les jardins s'éveillent…</div>
          </div>
        )}

        {!loading && err && (
          <div style={{width:'100%',height:'100%',minHeight:'300px',background:`linear-gradient(180deg,${skyA},${skyB})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:12,color:'rgba(210,100,100,0.8)'}}>{err}</div>
          </div>
        )}

        {!loading && !err && (
          <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid slice" style={{display:'block'}} fill="none">
            <defs>
              <linearGradient id="cgSky"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={skyA}/>
                <stop offset="58%"  stopColor={skyB}/>
                <stop offset="100%" stopColor={skyC}/>
              </linearGradient>
              <linearGradient id="cgSoil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(30,18,6,0.98)"/>
                <stop offset="100%" stopColor="rgba(10,5,2,1)"/>
              </linearGradient>
              <linearGradient id="cgFog"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
                <stop offset="100%" stopColor={fogC}/>
              </linearGradient>
              <linearGradient id="cgGG"   x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(26,68,14,0.0)"/>
                <stop offset="100%" stopColor="rgba(16,50,8,0.26)"/>
              </linearGradient>
              <radialGradient id="cgVig"  cx="50%" cy="50%" r="50%">
                <stop offset="55%"  stopColor="rgba(0,0,0,0)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.50)"/>
              </radialGradient>
              <filter id="cgGlow">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="cgSoftGlow">
                <feGaussianBlur stdDeviation="14" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              {/* Flou arrière-plan — herbes hautes */}
              <filter id="cgBgBlur" x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur stdDeviation="2.8"/>
              </filter>
            </defs>

            {/* CIEL */}
            <rect width={svgW} height={svgH} fill="url(#cgSky)"/>

            {/* ÉTOILES */}
            {stars.map((s,i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r}
                fill="rgba(245,242,235,0.70)"
                style={{animation:`cgStar ${2.2+(i%8)*0.4}s ease-in-out infinite ${s.delay}s`}}
              />
            ))}

            {/* LUNE */}
            {isNight && <>
              <circle cx={moonX} cy={moonY} r={25} fill="rgba(225,218,198,0.07)" filter="url(#cgSoftGlow)"/>
              <circle cx={moonX} cy={moonY} r={14} fill="rgba(235,228,208,0.88)"/>
              <circle cx={moonX+5.5} cy={moonY-4} r={10.5} fill={skyA}/>
            </>}

            {/* SOLEIL HEURE DORÉE */}
            {/* SOLEIL — toujours visible, style selon heure */}
            <>
              {/* Halo */}
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 90 : isDay ? 70 : 50}
                fill={isGolden ? 'rgba(255,130,20,0.16)' : isDay ? 'rgba(255,218,78,0.11)' : 'rgba(200,220,255,0.06)'}
                filter="url(#cgSoftGlow)"
              />
              {/* Disque */}
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 28 : isDay ? 20 : 14}
                fill={isGolden ? 'rgba(255,185,35,0.92)' : isDay ? 'rgba(255,228,85,0.88)' : 'rgba(220,230,255,0.72)'}
                filter="url(#cgGlow)"
              />
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 18 : isDay ? 13 : 9}
                fill={isGolden ? 'rgba(255,248,165,0.97)' : isDay ? 'rgba(255,252,205,0.94)' : 'rgba(235,242,255,0.88)'}
              />
              {/* Rayons (jour seulement) */}
              {isDay && Array.from({length: isGolden ? 12 : 8}, (_,i) => {
                const a  = i*(isGolden ? 30 : 45)*Math.PI/180
                const r1 = isGolden ? 33 : 24
                const r2 = isGolden ? 52 : 38
                return <line key={i}
                  x1={sunX+Math.cos(a)*r1} y1={sunY+Math.sin(a)*r1}
                  x2={sunX+Math.cos(a)*r2} y2={sunY+Math.sin(a)*r2}
                  stroke={isGolden ? 'rgba(255,175,35,0.60)' : 'rgba(255,232,75,0.42)'}
                  strokeWidth={isGolden ? 2.2 : 1.5}
                  strokeLinecap="round"
                  style={{animation:`cgRay ${1.8+i*0.14}s ease-in-out infinite ${i*0.11}s`}}/>
              })}
            </>

            {/* BRUME HORIZON */}
            <rect x={0} y={groundY - svgH*0.18} width={svgW} height={svgH*0.22} fill="url(#cgFog)"/>

            {/* FOND ARRIÈRE — herbes hautes floues */}
            <BackgroundFoliage svgW={svgW} groundY={groundY}/>

            {/* FLEURS ARRIÈRE (profondeur yOff < 0) */}
            {positions.filter(p => p.yOff < 0).map(p => (
              <FieldFlower key={p.user_id} plant={p}
                isMine={p.user_id === currentUserId}
                x={p.x} groundY={groundY + p.yOff}
                sceneH={svgH}
              />
            ))}

            {/* SOL */}
            <rect x={0} y={groundY} width={svgW} height={svgH - groundY} fill="url(#cgSoil)"/>
            {/* Liseré herbe sur le sol */}
            <path
              d={`M0,${groundY-2} Q${svgW*0.25},${groundY-5} ${svgW*0.5},${groundY-2} Q${svgW*0.75},${groundY-4} ${svgW},${groundY-2} L${svgW},${groundY+3} L0,${groundY+3} Z`}
              fill="rgba(32,72,16,0.55)"
            />

            {/* HERBES */}
            <GrassLayer svgW={svgW} groundY={groundY}/>

            {/* FLEURS AVANT (yOff >= 0) */}
            {positions.filter(p => p.yOff >= 0).map(p => (
              <FieldFlower key={p.user_id} plant={p}
                isMine={p.user_id === currentUserId}
                x={p.x} groundY={groundY + p.yOff}
                sceneH={svgH}
              />
            ))}

            {/* VIGNETTE BORDS */}
            <rect width={svgW} height={svgH} fill="url(#cgVig)"/>
          </svg>
        )}
      </div>


    </div>
  )
}
