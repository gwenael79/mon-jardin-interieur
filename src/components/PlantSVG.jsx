// PlantSVG.jsx — Composant partagé entre ScreenMonJardin et CommunityGarden
// Extrait de ScreenMonJardin.jsx pour éviter la duplication de logique visuelle

export const DEFAULT_GARDEN_SETTINGS = {
  sunriseH: 7, sunriseM: 0,
  sunsetH: 20, sunsetM: 0,
  petalColor1: '#e8789a',
  petalColor2: '#f0a8be',
  petalShape: 'round',
}

let _svgN = 0
function PlantSVG({ health = 5, gardenSettings = DEFAULT_GARDEN_SETTINGS, lumensLevel = 'faible', clearSky = false }) {
  const r   = Math.max(0, Math.min(1, (health ?? 5) / 100))
  const gs  = gardenSettings || DEFAULT_GARDEN_SETTINGS
  const W = 400, H = 260, cx = 200, gY = 188   // gY = groundY
  const id  = 'g' + (++_svgN)   // unique prefix per instance, no hooks needed

  /* ── Soleil ── */
  const now   = new Date()
  const nowH  = clearSky ? 12 : now.getHours() + now.getMinutes() / 60
  const riseH = (gs.sunriseH || 7)  + (gs.sunriseM || 0) / 60
  const setH  = (gs.sunsetH  || 20) + (gs.sunsetM  || 0) / 60
  const dp    = clearSky ? 0.5 : Math.max(0, Math.min(1, (nowH - riseH) / (setH - riseH)))
  const isDay = clearSky ? true : (nowH >= riseH && nowH <= setH)
  const isG   = clearSky ? false : (isDay && (Math.abs(nowH - riseH) < 1.2 || Math.abs(nowH - setH) < 1.2))
  const sunX  = 30 + dp * (W - 60)
  const sunY  = 18 + 58 * (1 - Math.sin(dp * Math.PI))

  /* ── Couleurs pétales personnalisées ── */
  const h2r = h => { const v = parseInt((h || '#e8789a').replace('#',''), 16); return [(v>>16)&255,(v>>8)&255,v&255] }
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

  /* ── Courbe de croissance progressive ──
     5 stades visuels :
       0–8%   Graine   : graine + 1 germe minuscule
       8–25%  Pousse   : tige courte + 2 cotylédons (feuilles embryonnaires)
       25–45% Jeune    : tige moyenne + premières vraies feuilles
       25–45% Jeune    : tige + feuilles + bourgeon
       45–65% Petite fleur : petite fleur épanouie
       65–100% Fleur   : grande fleur ouverte, pollen à 85%+
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

  /* ── Ciel bleu — identique au jardin collectif ── */
  const skyHue = isDay ? Math.round(200 - dp * (1 - dp) * 4 * 60) : null
  const skyA = clearSky ? '#4aa8e0' : isDay ? (isG ? '#1a0a04' : '#0b1e3a') : '#020510'
  const skyB = clearSky ? '#7ec8f0' : isDay ? (isG ? `hsl(${skyHue},72%,22%)` : '#1e4e8a') : '#060c1e'
  const skyC = clearSky ? '#b8e4f8' : isDay ? (isG ? '#d96418' : `hsl(${skyHue},60%,46%)`) : '#0a1228'
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
          <stop offset="0%"   stopColor={isG ? 'rgba(255,128,18,0.45)' : 'rgba(255,218,78,0.32)'}/>
          <stop offset="100%" stopColor="rgba(255,190,60,0)"/>
        </radialGradient>
        <radialGradient id={id+'lh'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(246,196,83,0)" />
          <stop offset="40%"  stopColor={lumensLevel === 'rayonnement' ? 'rgba(246,196,83,0.22)' : lumensLevel === 'aura' ? 'rgba(246,196,83,0.14)' : lumensLevel === 'halo' ? 'rgba(246,196,83,0.08)' : 'rgba(246,196,83,0)'} />
          <stop offset="100%" stopColor="rgba(246,196,83,0)" />
        </radialGradient>
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

        {/* HALO LUMENS */}
        {lumensLevel !== 'faible' && (() => {
          const sH = 32 + 100*r
          const fy = gY - sH
          const rX = lumensLevel === 'rayonnement' ? 85 : lumensLevel === 'aura' ? 65 : 48
          const rY = lumensLevel === 'rayonnement' ? 75 : lumensLevel === 'aura' ? 55 : 40
          const op = lumensLevel === 'rayonnement' ? 0.9 : lumensLevel === 'aura' ? 0.7 : 0.5
          return (
            <ellipse cx={cx} cy={fy} rx={rX} ry={rY}
              fill="none"
              stroke="rgba(246,196,83,1)"
              strokeWidth="0"
              style={{ animation:'lumenGlow 4s ease-in-out infinite' }}>
              <animate attributeName="opacity" values={`${op*0.4};${op};${op*0.4}`} dur="4s" repeatCount="indefinite"/>
            </ellipse>
          )
        })()}
        {lumensLevel !== 'faible' && (() => {
          const sH = 32 + 100*r
          const fy = gY - sH
          const rX = lumensLevel === 'rayonnement' ? 100 : lumensLevel === 'aura' ? 78 : 58
          const rY = lumensLevel === 'rayonnement' ? 88 : lumensLevel === 'aura' ? 66 : 50
          const v1 = lumensLevel === 'rayonnement' ? '0.35' : lumensLevel === 'aura' ? '0.22' : '0.12'
          const v2 = lumensLevel === 'rayonnement' ? '0.65' : lumensLevel === 'aura' ? '0.42' : '0.25'
          return (
            <ellipse cx={cx} cy={fy} rx={rX} ry={rY}
              fill="rgba(246,196,83,0)"
              style={{ filter:'blur(16px)' }}>
              <animate attributeName="fill" values={`rgba(246,196,83,${v1});rgba(246,196,83,${v2});rgba(246,196,83,${v1})`} dur="4s" repeatCount="indefinite"/>
            </ellipse>
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
                  stroke={isG?'rgba(255,152,28,0.62)':'rgba(255,222,78,0.52)'}
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

          // Branches : angles de départ asymétriques
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
              <ellipse cx={cx} cy={gY+3} rx={5} ry={3.5} fill="rgba(118,72,28,0.75)" />
              <ellipse cx={cx-1} cy={gY+2} rx={3} ry={2} fill="rgba(155,100,50,0.35)" />
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
            const sy = gY - sH
            const my = gY - sH * 0.55
            const cR = 3 + t * 5           // rayon des cotylédons grandit avec t
            return (
              <g>
                {/* tige fine et courte */}
                <path d={`M${cx},${gY} Q${cx+3*t},${my} ${cx},${sy}`}
                  stroke={stemC} strokeWidth={1.6+0.8*t} strokeLinecap="round" fill="none"/>
                {/* cotylédon gauche */}
                <ellipse cx={cx - 5 - t*4} cy={my+4} rx={cR} ry={cR*0.65}
                  fill={`rgba(${72+20*t},${168+40*t},${48+18*t},${0.65+0.2*t})`}
                  transform={`rotate(-30,${cx-5-t*4},${my+4})`}/>
                {/* cotylédon droit */}
                <ellipse cx={cx + 5 + t*4} cy={my+4} rx={cR} ry={cR*0.65}
                  fill={`rgba(${68+22*t},${162+42*t},${44+20*t},${0.60+0.22*t})`}
                  transform={`rotate(30,${cx+5+t*4},${my+4})`}/>
                {/* germe minuscule au sommet */}
                {t > 0.4 && (
                  <ellipse cx={cx} cy={sy-2} rx={2+t*2} ry={3+t*3}
                    fill={`rgba(${r1},${g1},${b1},${0.2+t*0.3})`}/>
                )}
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

              {/* BOURGEON — stade 'young' à 'bud' (25–65%) */}
              {stage !== 'flower' && (
                <g>
                  {[-24,0,24].map((a,i) => (
                    <path key={i} d={`M${cx},${Math.round(flwY+6+8*r)} Q${cx+Math.round(Math.sin(a*Math.PI/180)*8)},${Math.round(flwY+8*r)} ${cx},${Math.round(flwY+7*r)}`} fill={lC2} opacity={0.7}/>
                  ))}
                  <ellipse cx={cx} cy={flwY} rx={4+6*r} ry={8+9*r} fill={`rgba(${r1},${g1},${b1},${0.30+0.36*r})`}/>
                  <ellipse cx={cx-1} cy={flwY-1} rx={2.5+4*r} ry={5+7*r} fill={`rgba(${r2},${g2},${b2},0.32)`}/>
                </g>
              )}
              {/* GRANDE FLEUR — à partir de 65% */}
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

export { PlantSVG }
