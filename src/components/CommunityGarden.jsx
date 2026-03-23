// src/components/CommunityGarden.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../core/supabaseClient'

/* ─────────────────────────────────────────────────────
   CHARGEMENT — dernière plante par user + settings jardin
   Respecte privacy_settings.show_health
───────────────────────────────────────────────────── */
async function loadCommunityPlants() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [usersRes, plantsRes, privacyRes, settingsRes] = await Promise.all([
    // Tous les membres de la communauté
    supabase.from('users').select('id'),
    // Dernière plante connue par user (30 jours)
    supabase
      .from('plants')
      .select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date')
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

  // Tous les users — avec leur plante ou une graine si pas encore de plante
  const ZONE_KEYS = ['zone_racines', 'zone_tige', 'zone_feuilles', 'zone_fleurs', 'zone_souffle']
  const isUninitialised = (p) =>
    p.health === 50 && ZONE_KEYS.every(k => (p[k] ?? 50) === 50)

  const result = []
  for (const u of (usersRes.data || [])) {
    if (hidden.has(u.id)) continue
    let plant = plantsByUser[u.id] || { user_id: u.id, health: 0, date: null }
    // Plante jamais initialisée (valeurs DB par défaut 50) → afficher comme graine à 5%
    if (isUninitialised(plant)) {
      const zeros = Object.fromEntries(ZONE_KEYS.map(k => [k, 5]))
      plant = { ...plant, health: 5, ...zeros }
    }
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
  const _opacity = _isDay ? (_isGold ? 1 : 0.95) : 0.85
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

  /* ── Forme pétales — système botanique complet (sync DashboardPage) ── */
  const ps  = gs.petalShape || 'round'
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
              <ellipse key={j} cx={0} cy={yb} rx={fallW*0.15} ry={fallW*0.05} fill="rgba(255,195,40,0.88)"/>
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
        {/* Étamines : cercle dense d'anthères noires */}
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

      {/* ── FLÈCHE + LABEL "Ma fleur" au-dessus de la fleur ── */}
      {isMine && (() => {
        const tipY = sTY - 18
        const labelY = tipY - 20
        return (
          <g>
            {/* Ligne verticale */}
            <line x1={cx+curve} y1={tipY + 2} x2={cx+curve} y2={labelY + 12}
              stroke="rgba(158,248,125,0.70)" strokeWidth={1} strokeDasharray="3,2"/>
            {/* Pointe de flèche */}
            <polygon
              points={`${cx+curve},${tipY} ${cx+curve-4},${tipY+7} ${cx+curve+4},${tipY+7}`}
              fill="rgba(158,248,125,0.85)"/>
            {/* Fond label */}
            <rect x={cx+curve-22} y={labelY - 10} width={44} height={14} rx={7}
              fill="rgba(8,22,10,0.82)" stroke="rgba(158,248,125,0.40)" strokeWidth={0.8}/>
            {/* Texte */}
            <text x={cx+curve} y={labelY} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fill="rgba(188,255,168,0.95)" fontFamily="Jost,sans-serif"
              letterSpacing="0.08em">
              Ma fleur
            </text>
          </g>
        )
      })()}

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

        {/* Feuilles — poussent par paires gauche/droite selon santé */}
        {r > 0.12 && (() => {
          // Nombre de paires : 1 à 5 selon r (+ légère variation par user)
          const pairCount = Math.max(1, Math.round(r * 5) - (hash(plant.user_id, 20) % 2 === 0 ? 0 : 0))
          // Chaque côté peut avoir un nombre légèrement différent de feuilles
          const leftCount  = pairCount + (hash(plant.user_id, 21) % 2 === 0 && r > 0.6 ? 1 : 0)
          const rightCount = pairCount + (hash(plant.user_id, 22) % 2 === 0 && r > 0.7 ? 1 : 0)
          const maxCount   = Math.max(leftCount, rightCount)

          const leaves = []
          for (let li = 0; li < maxCount; li++) {
            // Répartir uniformément le long de la tige (20% → 88%)
            const tBase = 0.20 + (li / Math.max(maxCount - 1, 1)) * 0.68
            // Décalage vertical léger entre gauche et droite pour éviter la symétrie parfaite
            const tOffL = ((hash(plant.user_id, 30 + li) % 10) - 5) / 100
            const tOffR = ((hash(plant.user_id, 31 + li) % 10) - 5) / 100

            for (const [side, count, tOff, seedBase] of [[-1, leftCount, tOffL, 100], [1, rightCount, tOffR, 200]]) {
              if (li >= count) continue
              const t  = Math.min(0.92, Math.max(0.15, tBase + tOff))
              // Point sur la tige
              const bx = cx + curve * t
              const by = groundY - stemH * t
              // Taille : plus grande au milieu de la tige
              const sizeF  = 0.55 + Math.sin(t * Math.PI) * 0.65
              const lw     = (28 + (hash(plant.user_id, seedBase + li) % 16)) * sizeF * (0.65 + r * 0.55)
              const lh     = (22 + (hash(plant.user_id, seedBase + 10 + li) % 14)) * sizeF * (0.65 + r * 0.55)
              // Angle : part de la tige vers l'extérieur, légèrement vers le bas
              const angleBase = side === -1 ? 210 : -30
              const angleVar  = ((hash(plant.user_id, seedBase + 20 + li) % 36) - 18)
              const angle     = angleBase + angleVar
              const rad       = angle * Math.PI / 180
              const tipX      = bx + Math.cos(rad) * lh
              const tipY      = by + Math.sin(rad) * lh
              const ctrlOff   = lw * side
              // Couleur verte légèrement variée
              const gr    = 98 + (hash(plant.user_id, seedBase + 30 + li) % 24)
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
      </>}

      {/* ── GRAINE ── */}
      {r <= 0.08 && (
        <g>
          <ellipse cx={cx} cy={flwY+5} rx={4} ry={2.5} fill="rgba(118,78,36,0.52)"/>
          <path d={`M${cx},${flwY+3} Q${cx+2},${flwY-4} ${cx+1},${flwY-8}`} stroke="rgba(78,138,48,0.60)" strokeWidth={1.2} strokeLinecap="round" fill="none"/>
        </g>
      )}

      {/* ── PETIT BOURGEON — 8–25% ── */}
      {r > 0.08 && r <= 0.25 && (() => {
        const t = (r - 0.08) / 0.17
        return (
          <g>
            {[-18,0,18].map((a,i) => (
              <path key={i}
                d={`M${cx+curve},${Math.round(flwY+4+5*r)} Q${cx+curve+Math.round(Math.sin(a*Math.PI/180)*5)},${Math.round(flwY+5*r)} ${cx+curve},${Math.round(flwY+4*r)}`}
                fill={lC2} opacity={0.60}/>
            ))}
            <ellipse cx={cx+curve} cy={flwY}     rx={2+2.5*t} ry={4+4*t} fill={`rgba(${r1},${g1},${b1},${0.22+0.22*t})`}/>
            <ellipse cx={cx+curve-0.5} cy={flwY-0.5} rx={1.2+1.5*t} ry={2.5+2.5*t} fill={`rgba(${r2},${g2},${b2},0.25)`}/>
          </g>
        )
      })()}

      {/* ── BOURGEON FERMÉ — 25–45% ── */}
      {r > 0.25 && r <= 0.45 && (
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
      {/* ── PETITE FLEUR — 45–65% ── */}
      {r > 0.45 && r <= 0.65 && (
        <g>
          <circle cx={cx+curve} cy={flwY} r={fS*2.2} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>
          {[-28,0,28].map((a,i) => {
            const rad=(a-90)*Math.PI/180
            return <path key={i} d={`M${cx+curve},${Math.round(flwY+fS*0.4)} Q${cx+curve+Math.round(Math.cos(rad)*7)},${Math.round(flwY+fS*0.4+9)} ${cx+curve},${Math.round(flwY+fS*0.4+12)}`} fill={lC2} opacity={0.65}/>
          })}
          <g style={{animation:`cgBreath ${swayDur.toFixed(2)}s ease-in-out infinite ${swayDelay.toFixed(2)}s`}}>
            {renderFlower(cx+curve, flwY, `url(#${id}p1)`, id+'f1', `url(#${id}p2)`)}
          </g>
          <circle cx={cx+curve} cy={flwY} r={fS*0.60} fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.88)`}/>
          <circle cx={cx+curve} cy={flwY} r={fS*0.34} fill={`url(#${id}pi)`}/>
        </g>
      )}
      {/* ── FLEUR ÉPANOUIE — 65%+ ── */}
      {r > 0.65 && (
        <g>
          <circle cx={cx+curve} cy={flwY} r={fS*3.2} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>
          {[-28,0,28].map((a,i) => {
            const rad=(a-90)*Math.PI/180
            return <path key={i} d={`M${cx+curve},${Math.round(flwY+fS*0.5)} Q${cx+curve+Math.round(Math.cos(rad)*8)},${Math.round(flwY+fS*0.5+10)} ${cx+curve},${Math.round(flwY+fS*0.5+12)}`} fill={lC2} opacity={0.62}/>
          })}
          <g style={{animation:`cgBreath ${swayDur.toFixed(2)}s ease-in-out infinite ${swayDelay.toFixed(2)}s`}}>
            {renderFlower(cx+curve, flwY, `url(#${id}p1)`, id+'f1', `url(#${id}p2)`)}
          </g>
          <circle cx={cx+curve} cy={flwY} r={fS*0.72} fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.88)`}/>
          <circle cx={cx+curve} cy={flwY} r={fS*0.40} fill={`url(#${id}pi)`}/>
          {r > 0.52 && [0,51,103,154,205,257,308].map((a,i) => {
            const rp=fS*0.52, rad=a*Math.PI/180
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
    <g opacity={0.82}>
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
export default function CommunityGarden({ currentUserId, onClose, embedded }) {
  const [plants,  setPlants]  = useState([])
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState(null)
  const scrollRef = useRef(null)
  const [scrollX, setScrollX] = useState(0)
  const [winH, setWinH] = useState(window.innerHeight)
  const [starFlashes, setStarFlashes] = useState({}) // { userId: timestamp }

  // Realtime — étoiles sur la fleur du membre actif
  useEffect(() => {
    const ch = supabase.channel('garden-stars')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'network_activity' },
        (p) => {
          const uid = p.new?.user_id
          if (uid) {
            setStarFlashes(prev => ({ ...prev, [uid]: Date.now() }))
            setTimeout(() => setStarFlashes(prev => {
              const n = { ...prev }; delete n[uid]; return n
            }), 4000)
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  useEffect(() => {
    const fn = () => setWinH(window.innerHeight)
    window.addEventListener('resize', fn)
    window.addEventListener('orientationchange', () => setTimeout(fn, 100))
    return () => { window.removeEventListener('resize', fn) }
  }, [])

  // Suivi du scroll horizontal pour positionner les étoiles correctement
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrollX(el.scrollLeft)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef.current])

  useEffect(() => {
    loadCommunityPlants()
      .then(d  => { setPlants(d); setLoading(false) })
      .catch(e => { setErr(e.message); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!plants.length || !currentUserId) return
    setTimeout(() => {
      if (!scrollRef.current) return
      const myIndex = plants.findIndex(p => p.user_id === currentUserId)
      if (myIndex === -1) return
      const W_PER_ = 42
      const svgW_  = Math.max(2400, plants.length * W_PER_ + 220)
      const xNoise = (hash(currentUserId, 9) % 28) - 14
      const myX    = svgW_ / 2 + xNoise
      const containerW = scrollRef.current.clientWidth
      scrollRef.current.scrollTo({ left: Math.max(0, myX - containerW / 2), behavior: 'instant' })
    }, 50)
  }, [plants, currentUserId])

  const W_PER   = 42
  const MIN_W   = 2400
  const svgH    = Math.max(380, Math.min(580, winH - (window.innerWidth < 768 ? 130 : 80)))
  const groundY = svgH - 20
  const svgW    = Math.max(MIN_W, plants.length * W_PER + 220)

  const hour = new Date().getHours() + new Date().getMinutes() / 60
  const mySettings = plants.find(p => p.user_id === currentUserId)?.gardenSettings
  const myRiseH = mySettings ? (mySettings.sunrise_h ?? 7)  + (mySettings.sunrise_m ?? 0) / 60 : 7
  const mySetH  = mySettings ? (mySettings.sunset_h  ?? 20) + (mySettings.sunset_m  ?? 0) / 60 : 20

  const dp       = Math.max(0, Math.min(1, (hour - myRiseH) / (mySetH - myRiseH)))
  const isDay    = hour >= myRiseH && hour <= mySetH
  const isNight  = !isDay
  const isGolden = isDay && (Math.abs(hour - myRiseH) < 1.2 || Math.abs(hour - mySetH) < 1.2)

  const sunX = svgW * 0.05 + dp * (svgW * 0.90)
  const sunY = svgH * (0.40 - 0.22 * Math.sin(dp * Math.PI))

  const skyHue = isNight ? null : Math.round(200 - dp * (1 - dp) * 4 * 60)
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

  const positions = useMemo(() => {
    const myIdx = plants.findIndex(p => p.user_id === currentUserId)
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

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      inset: embedded ? 'auto' : 0,
      zIndex: embedded ? 'auto' : 300,
      width: embedded ? '100%' : undefined,
      height: embedded ? svgH : undefined,
      minHeight: embedded ? svgH : undefined,
      background:`linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(8,4,2,0.97) 100%)`,
      overflow:'hidden',
      display:'flex', flexDirection:'column',
      backdropFilter: embedded ? 'none' : 'blur(10px)',
      animation: embedded ? 'none' : 'cgFadeIn 0.38s ease',
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
        div[data-cg]::-webkit-scrollbar-track { background: transparent; }
        div[data-cg]::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.30); border-radius:3px; }
        div[data-cg]::-webkit-scrollbar-thumb:hover { background: rgba(120,120,120,0.50); }
      `}</style>

      {/* HEADER — bouton fermer uniquement */}
      {onClose && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:10,
          display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
          padding:'20px 24px 0',
          pointerEvents: embedded ? 'none' : 'auto',
        }}>
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
      )}

      {/* PAYSAGE — pleine largeur, plein écran */}
      <div
        ref={scrollRef}
        data-cg="1"
        style={{
          position:'absolute', inset:0,
          overflowX:'auto',
          overflowY:'hidden',
          height: svgH,
          scrollbarWidth:'thin',
          scrollbarColor:'rgba(120,120,120,0.3) transparent',
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

        {!loading && !err && (<>
          <style>{`
            @keyframes cg-star-float-0 {
              0%   { opacity:0; transform: translateY(0px)   scale(0.6) rotate(-8deg); }
              15%  { opacity:1; }
              60%  { opacity:0.9; transform: translateY(-55px)  scale(1.1) rotate(6deg); }
              100% { opacity:0; transform: translateY(-90px)  scale(0.5) rotate(15deg); }
            }
            @keyframes cg-star-float-1 {
              0%   { opacity:0; transform: translateY(0px)   scale(0.5) rotate(10deg); }
              20%  { opacity:1; }
              55%  { opacity:0.8; transform: translateY(-65px)  scale(1.2) rotate(-5deg); }
              100% { opacity:0; transform: translateY(-100px) scale(0.4) rotate(-20deg); }
            }
            @keyframes cg-star-float-2 {
              0%   { opacity:0; transform: translateY(0px)   scale(0.7) rotate(0deg); }
              10%  { opacity:1; }
              65%  { opacity:0.85; transform: translateY(-50px)  scale(1.0) rotate(12deg); }
              100% { opacity:0; transform: translateY(-85px)  scale(0.35) rotate(25deg); }
            }
          `}</style>
          <div style={{ position: 'relative' }}>
          <svg width={svgW} height={svgH} style={{display:'block', minHeight:svgH}} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMax meet" fill="none">
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

            {/* SOLEIL */}
            <>
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 90 : isDay ? 70 : 50}
                fill={isGolden ? 'rgba(255,130,20,0.16)' : isDay ? 'rgba(255,218,78,0.11)' : 'rgba(200,220,255,0.06)'}
                filter="url(#cgSoftGlow)"
              />
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 28 : isDay ? 20 : 14}
                fill={isGolden ? 'rgba(255,185,35,0.92)' : isDay ? 'rgba(255,228,85,0.88)' : 'rgba(220,230,255,0.72)'}
                filter="url(#cgGlow)"
              />
              <circle cx={sunX} cy={sunY}
                r={isGolden ? 18 : isDay ? 13 : 9}
                fill={isGolden ? 'rgba(255,248,165,0.97)' : isDay ? 'rgba(255,252,205,0.94)' : 'rgba(235,242,255,0.88)'}
              />
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

            {/* FLEURS ARRIÈRE */}
            {positions.filter(p => p.yOff < 0 && p.user_id !== currentUserId).map(p => (
              <FieldFlower key={p.user_id} plant={p}
                isMine={false}
                x={p.x} groundY={groundY + p.yOff}
                sceneH={svgH}
              />
            ))}

            {/* SOL */}
            <rect x={0} y={groundY} width={svgW} height={svgH - groundY} fill="url(#cgSoil)"/>
            <path
              d={`M0,${groundY-2} Q${svgW*0.25},${groundY-5} ${svgW*0.5},${groundY-2} Q${svgW*0.75},${groundY-4} ${svgW},${groundY-2} L${svgW},${groundY+3} L0,${groundY+3} Z`}
              fill="rgba(32,72,16,0.55)"
            />

            {/* HERBES */}
            <GrassLayer svgW={svgW} groundY={groundY}/>

            {/* FLEURS AVANT */}
            {positions.filter(p => p.yOff >= 0 && p.user_id !== currentUserId).map(p => (
              <FieldFlower key={p.user_id} plant={p}
                isMine={false}
                x={p.x} groundY={groundY}
                sceneH={svgH}
              />
            ))}

            {/* MA FLEUR */}
            {positions.filter(p => p.user_id === currentUserId).map(p => (
              <FieldFlower key={p.user_id} plant={p}
                isMine={true}
                x={p.x} groundY={groundY + 6}
                sceneH={svgH}
              />
            ))}

            {/* VIGNETTE BORDS */}
            <rect width={svgW} height={svgH} fill="url(#cgVig)"/>
          </svg>
          {/* ── Étoiles dorées sur fleurs actives ── */}
          {positions.filter(p => starFlashes[p.user_id]).flatMap(p => {
            const screenX = p.x - scrollX
            if (screenX < -120 || screenX > (scrollRef.current?.clientWidth ?? window.innerWidth) + 120) return []
            const flowerBaseY = svgH - groundY + 30
            const GLYPHS  = ['✦','✧','✶','⋆','✦','✧','✶']
            const COLORS  = ['#FFE566','#FFD700','#FFF3AA','#FFB800','#FFFACD','#FFC800','#FFE000']
            const SIZES   = [13, 10, 15, 9, 12, 11, 14]
            const SPREADS = [-28, -14, -6, 0, 8, 18, 30]
            const DELAYS  = [0, 0.12, 0.06, 0.22, 0.04, 0.18, 0.10]
            const DURS    = [3.2, 2.8, 3.6, 2.5, 3.0, 3.4, 2.6]
            return SPREADS.map((dx, i) => (
              <div key={`${p.user_id}-${i}-${starFlashes[p.user_id]}`} style={{
                position: 'absolute',
                left: screenX + dx,
                bottom: flowerBaseY,
                fontSize: SIZES[i],
                color: COLORS[i],
                pointerEvents: 'none',
                animation: `cg-star-float-${i % 3} ${DURS[i]}s cubic-bezier(0.25,0.46,0.45,0.94) ${DELAYS[i]}s forwards`,
                opacity: 0,
                zIndex: 20,
                userSelect: 'none',
              }}>{GLYPHS[i]}</div>
            ))
          })}
          </div>
        </>)}
      </div>
    </div>
  )
}
