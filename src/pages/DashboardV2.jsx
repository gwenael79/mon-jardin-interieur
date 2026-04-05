// ─────────────────────────────────────────────────────────────────────────────
//  DashboardV2.jsx  —  Dashboard "Flow Slides" — version expérimentale
//
//  ╔══════════════════════════════════════════════════════════════════╗
//  ║  ACTIVER   → App.jsx (ou partout où DashboardPage est importé)  ║
//  ║    import DashboardPage from './pages/DashboardV2'               ║
//  ║                                                                  ║
//  ║  DÉSACTIVER → remettre l'import original :                       ║
//  ║    import DashboardPage from './pages/DashboardPage'             ║
//  ╚══════════════════════════════════════════════════════════════════╝
//
//  • Ne touche à AUCUN fichier existant
//  • Réutilise tous les Screen components tels quels
//  • Mobile  → Flow slides avec illustrations botaniques
//  • Desktop → Layout sidebar identique à DashboardPage (aucun changement)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ADMIN_IDS }    from './AdminPage'
import { useAuth }      from '../hooks/useAuth'
import { usePlant }     from '../hooks/usePlant'
import { useCircle }    from '../hooks/useCircle'
import { useDefi }      from '../hooks/useDefi'
import { supabase }     from '../core/supabaseClient'
import { useTheme }     from '../hooks/useTheme'
import { useAnalytics } from '../hooks/useAnalytics'
import { logActivity }  from '../utils/logActivity'
import '../styles/dashboard.css'

import {
  useIsMobile, useProfile, useLumens,
  LumenBadge, LumenOrb, LumensCard,
  clearProfileCache,
} from './dashboardShared'

import PushNotificationButton        from '../components/PushNotificationButton'
import { ScreenMonJardin, DailyQuizModal } from './ScreenMonJardin'
import { WelcomeScreen }             from './WelcomeScreen'
import { ScreenJardinCollectif, ScreenDefis } from './ScreenDefis'
import { ScreenClubJardiniers }      from './ScreenClubJardiniers'
import { ScreenAteliers }            from './ScreenAteliers'
import { MaBibliotheque }            from './MaBibliotheque'
import { ScreenJardinotheque }       from './ScreenJardinotheque'
import { HelpModal }                 from './HelpModal'
import PremiumGate                   from '../components/PremiumGate'
import PremiumBanner                 from '../components/PremiumBanner'
import AccessPage                    from './AccessPage'
import { ONB_STYLES, NatureBg }      from './OnboardingScreen'
import { useSlideInsight }           from '../hooks/useSlideInsight'

// Verrou anti-double award (React Strict Mode)
const _dailyLoginAwarded = new Set()


// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DES SLIDES
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES_CONFIG = [
  {
    id:        'bilan',     illusKey: 'bilan',
    badge:     'Chaque matin',      icon: '🌹',
    title:     'Comment te sens-tu aujourd\'hui ?',
    subtitle:  'Ton bilan quotidien en 2 minutes — humeur, énergie, intention.',
    color:     '#c87878',
    btnLabel:  'Commencer le bilan',
    btnGrad:   'linear-gradient(135deg, #c87878, #a05858)',
    btnShadow: 'rgba(180,80,80,.38)',
    isBilan:   true,
    Component: null,
  },
  {
    id:        'jardin',    illusKey: 'jardin',   image: '/champs3.png',
    badge:     'Ma Fleur',           icon: '🌸',
    title:     'Ton jardin intérieur',
    subtitle:  'Ta fleur grandit chaque jour que tu prends soin de toi. Observe-la évoluer.',
    color:     '#b090c8',
    btnLabel:  'Soigner ma fleur',
    btnGrad:   'linear-gradient(135deg, #c8a0d8, #9070a8)',
    btnShadow: 'rgba(160,100,180,.36)',
    Component: ScreenMonJardin,
  },
  {
    id:        'champ',     illusKey: 'champ',   image: '/collectif.png',
    badge:     'Jardin Collectif',   icon: '🌻',
    title:     'Le jardin collectif',
    subtitle:  'Les fleurs de ta communauté. Une présence partagée, sans noms, sans profils.',
    color:     '#c8a040',
    btnLabel:  'Rejoindre le jardin',
    btnGrad:   'linear-gradient(135deg, #d4b050, #a87c28)',
    btnShadow: 'rgba(180,140,40,.36)',
    Component: ScreenJardinCollectif,
  },
  {
    id:        'defis',     illusKey: 'defis',
    badge:     'Défis',              icon: '✨',
    title:     'Tes défis du moment',
    subtitle:  'De petits engagements hebdomadaires pour avancer, à ton rythme.',
    color:     '#9080c0',
    btnLabel:  'Voir mes défis',
    btnGrad:   'linear-gradient(135deg, #a890d0, #7860a8)',
    btnShadow: 'rgba(140,110,190,.34)',
    Component: ScreenDefis,
  },
  {
    id:        'club',      illusKey: 'club',
    badge:     'Club des Jardiniers', icon: '👥',
    title:     'Ton cercle de jardiniers',
    subtitle:  'Un espace intime pour partager, s\'encourager et grandir ensemble.',
    color:     '#6898c0',
    btnLabel:  'Rejoindre mon club',
    btnGrad:   'linear-gradient(135deg, #80aad0, #5070a0)',
    btnShadow: 'rgba(80,120,180,.34)',
    Component: ScreenClubJardiniers,
  },
  {
    id:        'ateliers',  illusKey: 'ateliers',  image: '/champs2.png',
    badge:     'Ateliers',           icon: '📖',
    title:     'Les ateliers guidés',
    subtitle:  'Des séances thématiques pour explorer, apprendre et pratiquer.',
    color:     '#60a870',
    btnLabel:  'Explorer les ateliers',
    btnGrad:   'linear-gradient(135deg, #78c088, #488858)',
    btnShadow: 'rgba(80,160,100,.34)',
    Component: ScreenAteliers,
  },
  {
    id:        'bibliotheque', illusKey: 'bibliotheque', image: '/biblio.png',
    badge:     'Ma Bibliothèque',    icon: '📚',
    title:     'Ta bibliothèque personnelle',
    subtitle:  'Retrouve tes rituels, ressources et contenus sauvegardés.',
    color:     '#a07850',
    btnLabel:  'Ouvrir ma bibliothèque',
    btnGrad:   'linear-gradient(135deg, #c09060, #886040)',
    btnShadow: 'rgba(160,120,80,.34)',
    Component: MaBibliotheque,
  },
  {
    id:        'jardinotheque', illusKey: 'jardinotheque',
    badge:     'Jardinothèque',      icon: '🌿',
    title:     'La Jardinothèque',
    subtitle:  'Explore les pratiques, connaissances et ressources du jardin intérieur.',
    color:     '#5890a0',
    btnLabel:  'Explorer',
    btnGrad:   'linear-gradient(135deg, #70a8b8, #406878)',
    btnShadow: 'rgba(80,140,160,.34)',
    Component: ScreenJardinotheque,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK — swipe horizontal (touch)
// ─────────────────────────────────────────────────────────────────────────────
function useSwipe(onSwipeLeft, onSwipeRight) {
  const startX = useRef(null)
  const onTouchStart = useCallback(e => { startX.current = e.touches[0].clientX }, [])
  const onTouchEnd   = useCallback(e => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 48) { dx < 0 ? onSwipeLeft() : onSwipeRight() }
    startX.current = null
  }, [onSwipeLeft, onSwipeRight])
  return { onTouchStart, onTouchEnd }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLIDE INSIGHTS AI — bloc IA seul (sans cards de données)
// ─────────────────────────────────────────────────────────────────────────────
function SlideInsightsAI({ slideId, screenProps, color }) {
  const { user, stats, circleMembers, activeCircle, communityStats, myDefis, joinedIds, gardenFlowerCount } = screenProps ?? {}

  const insightPayload = useMemo(() => ({
    streak:          stats?.streak            ?? 0,
    ritualsMonth:    stats?.ritualsThisMonth  ?? 0,
    favoriteZone:    stats?.favoriteZone      ?? null,
    circleMembers:   circleMembers?.length    ?? 0,
    circleName:      activeCircle?.name       ?? null,
    defisJoined:     joinedIds?.size          ?? myDefis?.length ?? 0,
    communityPeople: communityStats?.totalParticipants ?? 0,
    gardenCount:     gardenFlowerCount        ?? 0,
  }), [stats, circleMembers, activeCircle, joinedIds, myDefis, communityStats, gardenFlowerCount])

  const { message: aiMessage, loading: aiLoading } = useSlideInsight({
    userId:  user?.id,
    slideId,
    payload: insightPayload,
    enabled: !!user?.id,
  })

  if (aiLoading) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:12, background:`${color}08`, border:`1px solid ${color}20` }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:color, opacity:.5, animation:'onbPulse 1.2s ease-in-out 0s infinite' }}/>
      <div style={{ width:5, height:5, borderRadius:'50%', background:color, opacity:.5, animation:'onbPulse 1.2s ease-in-out .2s infinite' }}/>
      <div style={{ width:5, height:5, borderRadius:'50%', background:color, opacity:.5, animation:'onbPulse 1.2s ease-in-out .4s infinite' }}/>
    </div>
  )

  if (!aiMessage) return null

  return (
    <div style={{ padding:'11px 14px', borderRadius:12, background:`${color}08`, border:`1px solid ${color}22` }}>
      <div style={{ fontSize:26, color, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", marginBottom:7, letterSpacing:'.02em', fontStyle:'italic' }}>Parlons de toi…</div>
      <p style={{ margin:0, fontSize:24, color:'rgba(30,20,8,.75)', fontFamily:"'Cormorant Garamond',serif", fontWeight:700, lineHeight:1.65, fontStyle:'italic' }}>{aiMessage}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT MOBILE — slides preview plein écran, swipeable
// ─────────────────────────────────────────────────────────────────────────────
function MobileSlideFlow({ slides, curIdx, onNav, onOpenModal, bilanDoneToday, screenProps }) {
  const slide  = slides[curIdx]
  const isLast = curIdx === slides.length - 1
  const swipe  = useSwipe(() => onNav(1), () => onNav(-1))

  return (
    <div
      style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', background:'linear-gradient(160deg,#f8f0ec,#ede5de)', zIndex:10 }}
      {...swipe}
    >
      {/* ── Bandeau titre mobile ── */}
      <div style={{ flexShrink:0, height:48, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px', background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(96,160,100,.2)', zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <img src="/icons/icon-192.png" alt="" style={{ width:26, height:26, borderRadius:'50%' }}/>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
            Mon <em style={{ color:'#7a4030' }}>Jardin</em>
            <span style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontStyle:'normal', marginLeft:6 }}>Intérieur</span>
          </div>
        </div>
      </div>

      {/* ── Barre de progression ── */}
      <div style={{ position:'absolute', top:48, left:14, right:14, display:'flex', gap:4, zIndex:20 }}>
        {slides.map((s, i) => (
          <div key={s.id} style={{ flex:1, height:2.5, background:'rgba(160,100,90,.18)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:s.color, width: i < curIdx ? '100%' : i === curIdx ? '60%' : '0%', transition: i === curIdx ? 'none' : 'width .3s' }}/>
          </div>
        ))}
      </div>

      {/* ── Illustration ── */}
      <div style={{ flexShrink:0, height:250, position:'relative', overflow:'hidden' }}>
        <img src={slide.image ?? '/champs.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(248,240,236,0) 40%, rgba(237,229,222,1) 100%)' }}/>
        <div style={{ position:'absolute', bottom:14, left:14, fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.88)', background:'rgba(0,0,0,.22)', border:'1px solid rgba(255,255,255,.28)', padding:'4px 11px', borderRadius:100 }}>
          {slide.badge}
        </div>
        <div style={{ position:'absolute', bottom:14, right:14, fontFamily:"'Jost',sans-serif", fontSize:10, color:'rgba(255,255,255,.5)' }}>
          {curIdx + 1} / {slides.length}
        </div>
      </div>

      {/* ── Preview texte ── */}
      <div style={{ flex:1, overflow:'auto', padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:8 }}>

        {/* Tag */}
        <div style={{ display:'inline-flex', width:'fit-content', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:100, fontSize:9.5, fontFamily:"'Jost',sans-serif", letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600, background:`${slide.color}14`, border:`1px solid ${slide.color}30`, color:slide.color, flexShrink:0 }}>
          {slide.icon}  {slide.badge}
        </div>

        {/* Titre */}
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,7vw,34px)', fontWeight:300, color:'#1a1208', lineHeight:1.2, flexShrink:0 }}>
          {slide.title}
        </div>

        {/* Sous-titre + analyse IA */}
        <div style={{ fontSize:15, fontWeight:300, color:'#1a1208', lineHeight:1.7, flexShrink:0 }}>
          {slide.subtitle}
        </div>
        <SlideInsightsAI slideId={slide.id} screenProps={screenProps} bilanDoneToday={bilanDoneToday} color={slide.color} />
      </div>

      {/* ── Navigation bas ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 16px 28px', display:'flex', gap:8, alignItems:'center', background:'linear-gradient(transparent, rgba(237,229,222,.98) 38%)', zIndex:20 }}>

        {/* Slide précédent */}
        {curIdx > 0 && (() => { const prev = slides[curIdx-1]; return (
          <button
            onClick={() => onNav(-1)}
            style={{ flexShrink:0, padding:'4px 12px', borderRadius:100, background:prev.color, border:`1px solid ${prev.color}`, fontSize:10, fontFamily:"'Jost',sans-serif", color:'#1a1208', cursor:'pointer', transition:'opacity .2s', whiteSpace:'nowrap', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis' }}
          >‹ {prev.badge}</button>
        )})()}
        {curIdx === 0 && <div style={{ flexShrink:0, width:10 }}/>}

        {/* Bouton principal */}
        <button
          onClick={() => onOpenModal(slide.id)}
          style={{ flex:1, padding:'5px 16px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13.5, fontWeight:500, color:'#fff', letterSpacing:'.04em', background:slide.btnGrad, boxShadow:`0 6px 16px ${slide.btnShadow}`, transition:'transform .15s ease', color:'#1a1208', fontWeight:700 }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          {slide.isBilan && bilanDoneToday ? 'Revoir mon bilan' : slide.btnLabel}
        </button>

        {/* Slide suivant */}
        {!isLast && (() => { const next = slides[curIdx+1]; return (
          <button
            onClick={() => onNav(1)}
            style={{ flexShrink:0, padding:'4px 12px', borderRadius:100, background:next.color, border:`1px solid ${next.color}`, fontSize:10, fontFamily:"'Jost',sans-serif", color:'#1a1208', cursor:'pointer', transition:'opacity .2s', whiteSpace:'nowrap', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis' }}
          >{next.badge} ›</button>
        )})()}
        {isLast && <div style={{ flexShrink:0, width:10 }}/>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN MODAL — overlay plein écran qui ouvre un slide sur ses hooks
// ─────────────────────────────────────────────────────────────────────────────
function ScreenModal({ slideId, slides, screenProps, bilanDoneToday, onBilan, onClose }) {
  const idx   = slides.findIndex(s => s.id === slideId)
  const slide = slides[idx]
  if (!slide) return null

  const isMobile = window.innerWidth < 768

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column' }}>
      {/* Fond semi-transparent */}
      <div
        style={{ position:'absolute', inset:0, background:'rgba(20,12,5,0.55)', backdropFilter:'blur(8px)' }}
        onClick={onClose}
      />

      {/* Carte modale */}
      <div style={{
        position:'relative', zIndex:1,
        margin: isMobile ? 0 : 'auto',
        width:  isMobile ? '100%' : slide.id === 'champ' ? 'min(92vw, calc((100vh - 40px) * 16/9))' : 'min(820px, 96vw)',
        height: isMobile ? '100%' : slide.id === 'champ' ? 'min(calc(100vh - 40px), calc(min(92vw, (100vh - 40px) * 16/9) * 9/16))' : 'calc(100vh - 40px)',
        background:'#faf5f2', borderRadius: isMobile ? 0 : 20,
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,.30)',
        '--text':'#1a1208', '--text2':'rgba(35,25,12,0.78)',
        color:'#1a1208',
        animation: isMobile ? 'none' : 'modalIn .32s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* Header */}
        <div style={{
          flexShrink:0, height:52, display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'0 18px',
          borderBottom:'1px solid rgba(96,160,100,.2)',
          background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)',
        }}>
          {/* Nom appli */}
          <div onClick={onClose} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <img src="/icons/icon-192.png" alt="" style={{ width:26, height:26, borderRadius:'50%' }}/>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
              Mon <em style={{ color:'#7a4030' }}>Jardin</em>
              <span style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontStyle:'normal', marginLeft:6 }}>Intérieur</span>
            </div>
          </div>

          {/* Titre centré */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:22 }}>{slide.icon}</span>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#1a1208', fontStyle:'italic' }}>{slide.badge}</div>
          </div>

          {/* Date + Lumens */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:10, color:'rgba(30,20,8,.4)', fontFamily:"'Jost',sans-serif", letterSpacing:'.03em' }}>
              {new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())}
            </div>
            {screenProps?.lumens && (
              <div
                onClick={() => screenProps.onOpenLumens?.()}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:100, background:'rgba(207,166,74,.12)', border:'1px solid rgba(207,166,74,.28)', cursor:'pointer', transition:'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(207,166,74,.22)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(207,166,74,.12)'}
              >
                <div style={{ width:16, height:16, borderRadius:'50%', background:'radial-gradient(circle at 38% 35%, #ffe97a, #c8a040)', boxShadow:'0 0 6px rgba(207,166,74,.5)', flexShrink:0 }}/>
                <span style={{ fontSize:11, fontWeight:600, color:'#c8a040', fontFamily:"'Jost',sans-serif" }}>{screenProps.lumens.available}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu du screen — prend tout l'espace restant */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
          {slide.isBilan ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:20, padding:'32px 24px' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#1a1208', textAlign:'center', lineHeight:1.2 }}>
                Comment te sens-tu<br/>aujourd'hui ?
              </div>
              <div style={{ fontSize:13, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", fontWeight:300 }}>
                {bilanDoneToday ? '✓ Bilan complété aujourd\'hui' : 'Pas encore renseigné ce matin'}
              </div>
              <button
                onClick={onBilan}
                style={{
                  padding:'16px 40px', borderRadius:100, border:'none', cursor:'pointer',
                  fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:500, color:'#fff',
                  letterSpacing:'.06em',
                  background: slide.btnGrad,
                  boxShadow:`0 8px 24px ${slide.btnShadow}`,
                  transition:'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none' }}
              >
                {bilanDoneToday ? 'Revoir mon bilan ›' : 'Commencer le bilan ✦'}
              </button>
            </div>
          ) : (
            slide.Component && <slide.Component {...screenProps}/>
          )}
        </div>

        {/* Bandeau bas */}
        <div style={{ flexShrink:0, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)', borderTop:'1px solid rgba(96,160,100,.2)' }}>
          <button
            onClick={onClose}
            style={{ padding:'9px 20px', borderRadius:100, background:'rgba(255,255,255,.8)', border:'1px solid rgba(200,160,150,.3)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,.55)', transition:'background .15s, transform .15s', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,1)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.8)'; e.currentTarget.style.transform='none' }}
          >‹ Retour</button>

          {slide.id === 'jardin' && (
            <button
              onClick={() => screenProps?.onOpenRituals?.()}
              style={{ flex:1, padding:'10px 20px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600, color:'#1a1208', background:'linear-gradient(135deg,#c8a0d8,#9070a8)', boxShadow:'0 4px 16px rgba(160,100,180,.3)', transition:'transform .15s, box-shadow .15s', letterSpacing:'.02em' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(160,100,180,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(160,100,180,.3)' }}
            >🌸 Je prends soin de ma fleur</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL — DashboardV2
//  Export identique à DashboardPage → swap transparent dans App.jsx
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const isMobile = useIsMobile()
  useTheme()

  // ── Polices ──
  useEffect(() => {
    if (!document.getElementById('gf-v2')) {
      const l = document.createElement('link')
      l.id = 'gf-v2'; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  // ── Auth & données ── (identique à DashboardPage)
  const { user, signOut }                      = useAuth()
  const { todayPlant, stats: plantStats }      = usePlant(user?.id)
  const { communityStats, defis, myDefis, joinedIds } = useDefi(user?.id)
  const { stats, circleMembers, activeCircle } = useCircle(user?.id)
  const profile                                = useProfile(user?.id)
  const { lumens, award: awardLumens, refresh } = useLumens(user?.id)
  const { track }                              = useAnalytics(user?.id)

  const isPremium = (profile?.plan === 'premium' || !!profile?.premium_until)
    && profile?.premium_until && new Date(profile.premium_until) > new Date()

  // ── Modals & états ── (identique à DashboardPage)
  const [active,              setActive]              = useState('jardin')
  const [slideIdx,            setSlideIdx]            = useState(0)
  const [showBilanModal,      setShowBilanModal]      = useState(false)
  const [openRitualsModal,    setOpenRitualsModal]    = useState(false)
  const [bilanDoneToday,      setBilanDoneToday]      = useState(false)
  const [showWelcome,         setShowWelcome]         = useState(false)
  const [isNewUser,           setIsNewUser]           = useState(false)
  const [welcomeReady,        setWelcomeReady]        = useState(false)
  const [showAccessModal,     setShowAccessModal]     = useState(false)
  const [showLumensModal,     setShowLumensModal]     = useState(false)
  const [showLumenInfo,       setShowLumenInfo]       = useState(false)
  const [showProfileModal,    setShowProfileModal]    = useState(false)
  const [showSettingsDrawer,  setShowSettingsDrawer]  = useState(false)
  const [showHelp,            setShowHelp]            = useState(false)
  const [showPrefsAccordion,  setShowPrefsAccordion]  = useState(false)
  const [showCreateCircle,    setShowCreateCircle]    = useState(false)
  const [showInviteModal,     setShowInviteModal]     = useState(false)
  const [showMjRight,         setShowMjRight]         = useState(false)
  const [pendingReports,      setPendingReports]      = useState(0)
  const [gardenFlowerCount,   setGardenFlowerCount]   = useState(null)
  const [pendingInvitations,  setPendingInvitations]  = useState(0)
  const [unreadCoeurs,        setUnreadCoeurs]        = useState(0)
  const [pendingDegradation,  setPendingDegradation]  = useState(null)
  const [openModalId,         setOpenModalId]         = useState(null)   // id du slide dont la modal est ouverte

  // ── Stripe return ──
  const isStripeReturn = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const isReturn = params.has('lumens') || params.has('premium')
    if (isReturn) {
      window.history.replaceState({}, '', window.location.pathname)
      if (params.has('premium')) clearProfileCache(user?.id)
    }
    return isReturn
  }, [])

  const isFirstToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const key   = `last_welcome_${user?.id}`
    const last  = localStorage.getItem(key)
    if (last !== today) { localStorage.setItem(key, today); return true }
    return false
  }, [user?.id])

  // ── Effets identiques à DashboardPage ──
  useEffect(() => {
    if (!user?.id || welcomeReady) return
    supabase.from('users').select('onboarded, created_at').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setWelcomeReady(true)
        if (!data?.onboarded || isStripeReturn) return
        const isJustCreated = data?.created_at && (Date.now() - new Date(data.created_at).getTime()) < 10 * 60 * 1000
        setIsNewUser(!!isJustCreated)
        if (isJustCreated || isFirstToday) setShowWelcome(true)
      })
  }, [user?.id])

  const refreshGardenCount = useCallback(() => {
    const since = new Date(); since.setDate(since.getDate() - 7)
    Promise.all([
      supabase.from('plants').select('user_id, health, date').gte('date', since.toISOString().split('T')[0]).order('date', { ascending: false }),
      supabase.from('privacy_settings').select('user_id').eq('show_health', false),
    ]).then(([plantsRes, privacyRes]) => {
      if (plantsRes.error) return
      const hidden = new Set((privacyRes.data || []).map(p => p.user_id))
      const byUser = {}
      for (const row of (plantsRes.data || [])) { if (!byUser[row.user_id]) byUser[row.user_id] = row }
      setGardenFlowerCount(Object.values(byUser).filter(p => !hidden.has(p.user_id) && p.health > 0).length)
    })
  }, [])

  useEffect(() => { refreshGardenCount() }, [])

  // Rafraîchit le compteur après un bilan ou un rituel complété
  useEffect(() => {
    const handler = () => refreshGardenCount()
    window.addEventListener('bilanComplete', handler)
    window.addEventListener('ritualComplete', handler)
    return () => {
      window.removeEventListener('bilanComplete', handler)
      window.removeEventListener('ritualComplete', handler)
    }
  }, [refreshGardenCount])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('coeurs').select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id).eq('seen', false)
      .then(({ count }) => setUnreadCoeurs(count ?? 0))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('atelier_invitations').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('seen', false)
      .then(({ count }) => setPendingInvitations(count ?? 0))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('daily_quiz').select('id').eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => setBilanDoneToday(!!data))
  }, [user?.id])

  useEffect(() => {
    if (ADMIN_IDS.includes(user?.id)) {
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('resolved', false)
        .then(({ count }) => setPendingReports(count ?? 0))
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !awardLumens) return
    if (_dailyLoginAwarded.has(user.id)) return
    _dailyLoginAwarded.add(user.id)
    const today = new Date().toISOString().split('T')[0]
    supabase.from('lumen_transactions').select('id').eq('user_id', user.id)
      .eq('reason', 'daily_login').gte('created_at', today + 'T00:00:00.000Z').maybeSingle()
      .then(({ data }) => { if (!data) awardLumens(1, 'daily_login', { date: today }) })
  }, [user?.id])

  useEffect(() => {
    const handler = e => {
      const { event, props, page, cat } = e.detail ?? {}
      if (event) track(event, props ?? {}, page, cat)
    }
    window.addEventListener('analytics_track', handler)
    return () => window.removeEventListener('analytics_track', handler)
  }, [track])

  // window.openAccessModal (utilisé dans les sous-composants)
  useEffect(() => {
    window.openAccessModal = () => setShowAccessModal(true)
    return () => { delete window.openAccessModal }
  }, [])

  // ── Navigation slides ──
  const handleNav = useCallback((dir) => {
    setSlideIdx(prev => {
      const next = prev + dir
      if (next < 0 || next >= SLIDES_CONFIG.length) return prev
      // Mettre à jour l'écran actif pour les effets analytics
      const nextSlide = SLIDES_CONFIG[next]
      if (!nextSlide.isBilan) setActive(nextSlide.id)
      track('page_view', {}, nextSlide.id, 'navigation')
      return next
    })
  }, [track])

  // ── Props partagées transmises aux Screen components ──
  const screenProps = useMemo(() => ({
    user,
    userId:         user?.id,          // requis par tous les Screen components
    profile,
    isPremium,
    todayPlant,
    stats:          plantStats,
    circleStats:    stats,
    circleMembers,
    activeCircle,
    communityStats,
    lumens,
    awardLumens,                       // alias attendu par ScreenMonJardin, ScreenDefis, ScreenClubJardiniers, ScreenAteliers
    onAwardLumens:  awardLumens,
    onRefreshLumens: refresh,
    gardenFlowerCount,
    defis,
    myDefis,
    joinedIds,
    unreadMessages: unreadCoeurs,
    pendingInvitations,
    onOpenBilan:    () => setShowBilanModal(true),
    onOpenLumens:   () => setShowLumensModal(true),
    onOpenAccess:   () => setShowAccessModal(true),
    onUpgrade:      () => setShowAccessModal(true), // alias attendu par ScreenJardinCollectif, ScreenDefis, ScreenClubJardiniers, ScreenAteliers, ScreenJardinotheque
    onOpenProfile:  () => setShowProfileModal(true),
    onCoeurSeen:    () => setUnreadCoeurs(0),
    onOpenRituals:  () => setOpenRitualsModal(true),
    openRitualsModal,
    onCloseRituals: () => setOpenRitualsModal(false),
    bilanDoneToday,
    track,
  }), [user, profile, isPremium, todayPlant, plantStats, stats, circleMembers, activeCircle, communityStats, lumens, awardLumens, refresh, gardenFlowerCount, defis, myDefis, joinedIds, unreadCoeurs, pendingInvitations, bilanDoneToday, openRitualsModal, track])


  // Saut direct vers un slide (nav latérale desktop)
  const handleJump = useCallback((idx) => {
    if (idx === slideIdx) return
    const s = SLIDES_CONFIG[idx]
    if (!s.isBilan) setActive(s.id)
    track('page_view', {}, s.id, 'navigation')
    setSlideIdx(idx)
  }, [slideIdx, track])

  // ── Navigation clavier : slides (fond) et modal (si ouverte) ──
  useEffect(() => {
    if (isMobile) return
    const onKey = (e) => {
      if (openModalId) {
        const idx  = SLIDES_CONFIG.findIndex(s => s.id === openModalId)
        if (e.key === 'ArrowRight' && idx < SLIDES_CONFIG.length - 1) {
          handleModalNav(1)
        }
        if (e.key === 'ArrowLeft' && idx > 0) handleModalNav(-1)
        if (e.key === 'Escape') setOpenModalId(null)
      } else {
        if (e.key === 'ArrowRight') handleNav(1)
        if (e.key === 'ArrowLeft')  handleNav(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, handleNav, openModalId])

  // ── Navigation dans la ScreenModal ──
  const handleModalNav = useCallback((dir) => {
    setOpenModalId(prev => {
      const idx  = SLIDES_CONFIG.findIndex(s => s.id === prev)
      const next = idx + dir
      if (next < 0 || next >= SLIDES_CONFIG.length) return prev
      const s = SLIDES_CONFIG[next]
      setSlideIdx(next)
      if (!s.isBilan) setActive(s.id)
      track('page_view', {}, s.id, 'navigation')
      return s.id
    })
  }, [track])

  // ── Overlays communs (desktop + mobile) ──
  const commonOverlays = (
    <>
      {showAccessModal && <AccessPage onActivateFree={() => setShowAccessModal(false)} onSuccess={() => { setShowAccessModal(false); clearProfileCache(user?.id) }} onBack={() => setShowAccessModal(false)} />}
      {showWelcome && <WelcomeScreen profile={profile} isNewUser={isNewUser} onDone={() => setShowWelcome(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showBilanModal && (
        <DailyQuizModal
          onComplete={deg => {
            setBilanDoneToday(true)
            track('bilan_complete', { degradation: deg }, 'jardin', 'engagement')
            logActivity({ userId: user?.id, action: 'bilan' })
            window.dispatchEvent(new CustomEvent('bilanComplete', { detail: deg }))
            setTimeout(() => {
              setShowBilanModal(false)
              setOpenModalId(null)
              handleNav(1)
            }, 800)
          }}
          onDismiss={() => setShowBilanModal(false)}
          onSkip={() => { setShowBilanModal(false); track('bilan_skip', {}, 'jardin', 'engagement') }}
        />
      )}
      {showLumensModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)' }} onClick={() => setShowLumensModal(false)} />
          <div style={{ position:'relative', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:460, border:'1px solid rgba(200,160,150,.25)', boxShadow:'0 24px 60px rgba(180,120,100,.2)' }}>
            <button onClick={() => setShowLumensModal(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,150,.3)', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'rgba(30,20,8,.5)', fontSize:14 }}>✕</button>
            <LumensCard lumens={lumens} userId={user?.id} awardLumens={awardLumens} onRefresh={refresh} />
          </div>
        </div>
      )}
      {showProfileModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)' }} onClick={() => setShowProfileModal(false)} />
          <div style={{ position:'relative', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderRadius:24, padding:'24px', width:'100%', maxWidth:420, border:'1px solid rgba(200,160,150,.25)', boxShadow:'0 24px 60px rgba(180,120,100,.2)' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,150,.3)', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'rgba(30,20,8,.5)' }}>✕</button>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#1a1208', marginBottom:16 }}>Mon profil</div>
            <div style={{ fontSize:12, color:'rgba(30,20,8,.5)', fontFamily:"'Jost',sans-serif" }}>Modifiez votre profil dans les paramètres.</div>
          </div>
        </div>
      )}
      {openModalId && (
        <ScreenModal
          slideId={openModalId}
          slides={SLIDES_CONFIG}
          screenProps={screenProps}
          bilanDoneToday={bilanDoneToday}
          onBilan={() => setShowBilanModal(true)}
          onClose={() => setOpenModalId(null)}
          onNav={handleModalNav}
        />
      )}
    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDU DESKTOP — carte preview centrée sur fond nature
  // ─────────────────────────────────────────────────────────────────────────
  if (!isMobile) {
    const slide  = SLIDES_CONFIG[slideIdx]
    const isLast = slideIdx === SLIDES_CONFIG.length - 1
    const name    = profile?.display_name ?? user?.display_name ?? null
    const email   = user?.email ?? ''
    const initial = (name ?? email).charAt(0).toUpperCase()

    return (
      <>
        {commonOverlays}
        <style>{ONB_STYLES + `
          @keyframes dkIllusIn   { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
          @keyframes dkSlideIn   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes dkThumbIn   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        `}</style>

        <div style={{ position:'fixed', inset:0, zIndex:10, fontFamily:"'Jost',sans-serif" }}>
          <NatureBg />
          {[
            { left:'8%',  top:'15%', dur:'2.4s', fdur:'5s',   delay:'0s'   },
            { left:'25%', top:'70%', dur:'1.8s', fdur:'4.2s', delay:'.6s'  },
            { left:'70%', top:'22%', dur:'2.8s', fdur:'6s',   delay:'1.1s' },
            { left:'85%', top:'58%', dur:'2s',   fdur:'4.6s', delay:'.3s'  },
            { left:'50%', top:'88%', dur:'3.2s', fdur:'5.5s', delay:'1.7s' },
            { left:'60%', top:'8%',  dur:'2.1s', fdur:'4s',   delay:'.9s'  },
          ].map((s, i) => (
            <div key={i} className="spark" style={{ left:s.left, top:s.top, '--dur':s.dur, '--fdur':s.fdur, '--delay':s.delay }}/>
          ))}

          {/* Carte principale centrée */}
          <div className="onb-backdrop">
            <div style={{
              width:'min(680px, 96vw)', height:'min(88vh, 800px)',
              borderRadius:24, background:'#faf5f2',
              boxShadow:'0 24px 70px rgba(180,120,110,.22), 0 0 0 1px rgba(200,160,150,.15)',
              display:'flex', flexDirection:'column', overflow:'hidden',
              animation:'modalIn .4s cubic-bezier(.22,1,.36,1) both',
              position:'relative',
              '--text':'#1a1208', '--text2':'rgba(35,25,12,0.78)', '--bg':'#faf5f2',
              color:'#1a1208',
            }}>

              {/* ── Barre supérieure ── */}
              <div style={{ flexShrink:0, height:46, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', borderBottom:'1px solid rgba(200,160,150,.16)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <img src="/icons/icon-192.png" alt="" style={{ width:26, height:26, borderRadius:'50%' }}/>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
                    Mon <em style={{ color:'#7a4030' }}>Jardin</em>
                    <span style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontStyle:'normal', marginLeft:6 }}>Intérieur</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {lumens && (
                    <div onClick={() => setShowLumensModal(true)} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:100, background:'rgba(207,166,74,.09)', border:'1px solid rgba(207,166,74,.22)', cursor:'pointer', transition:'background .12s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(207,166,74,.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(207,166,74,.09)'}>
                      <span style={{ fontSize:10, color:'#c8a040' }}>✦</span>
                      <span style={{ fontSize:10.5, color:'#c8a040', fontWeight:500 }}>{lumens.available}</span>
                    </div>
                  )}
                  <div onClick={() => setShowProfileModal(true)} title={name ?? email} style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,rgba(200,160,176,.4),rgba(160,190,160,.4))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:'#8a6050', cursor:'pointer', border:'1px solid rgba(200,160,150,.25)', transition:'opacity .12s' }} onMouseEnter={e=>e.currentTarget.style.opacity='.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{initial}</div>
                  <div onClick={() => setShowHelp(true)} style={{ padding:'3px 10px', borderRadius:100, background:'rgba(255,255,255,.5)', border:'1px solid rgba(200,160,150,.2)', fontSize:10.5, color:'rgba(30,20,8,.45)', cursor:'pointer', transition:'background .12s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.5)'}>Aide</div>
                  <div onClick={signOut} style={{ padding:'3px 10px', borderRadius:100, background:'rgba(255,255,255,.5)', border:'1px solid rgba(200,160,150,.2)', fontSize:10.5, color:'rgba(30,20,8,.45)', cursor:'pointer', transition:'background .12s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.5)'}>Quitter</div>
                  {ADMIN_IDS.includes(user?.id) && (
                    <div onClick={() => { window.location.hash = 'admin' }} style={{ padding:'3px 10px', borderRadius:100, background:'rgba(207,166,74,.07)', border:'1px solid rgba(207,166,74,.2)', fontSize:10.5, color:'rgba(180,140,50,.9)', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                      ⚙️{pendingReports > 0 && <span style={{ background:'#c04a4a', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:100 }}>{pendingReports}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Illustration pleine largeur ── */}
              <div style={{ flexShrink:0, height:250, position:'relative', overflow:'hidden' }}>
                <img key={`illus-${slideIdx}`} src={slide.image ?? '/champs.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block', animation:'dkIllusIn .42s cubic-bezier(.4,0,.2,1) both' }}/>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(250,245,242,0) 40%, rgba(250,245,242,1) 100%)' }}/>
                {/* Badge slide actuel */}
                <div style={{ position:'absolute', bottom:12, left:18, fontFamily:"'Jost',sans-serif", fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.9)', background:'rgba(0,0,0,.24)', border:'1px solid rgba(255,255,255,.28)', padding:'4px 11px', borderRadius:100 }}>{slide.badge}</div>
                {/* Progress dots dans l'illus */}
                <div style={{ position:'absolute', bottom:14, right:18, display:'flex', gap:4, alignItems:'center' }}>
                  {SLIDES_CONFIG.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => handleJump(i)}
                      style={{ width: i === slideIdx ? 14 : 5, height:5, borderRadius:3, background: i <= slideIdx ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.32)', cursor:'pointer', transition:'all .3s' }}
                    />
                  ))}
                </div>
              </div>

              {/* ── Contenu texte du slide (preview) ── */}
              <div key={`slide-${slideIdx}`} style={{ flex:1, display:'flex', flexDirection:'column', padding:'18px 24px 0', overflow:'hidden', animation:'dkSlideIn .32s cubic-bezier(.22,1,.36,1) both' }}>

                {/* Tag badge coloré */}
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontSize:9.5, letterSpacing:'.15em', textTransform:'uppercase', color:slide.color, fontWeight:600, padding:'4px 12px', borderRadius:100, background:`${slide.color}14`, border:`1px solid ${slide.color}30` }}>
                    {slide.icon}  {slide.badge}
                  </span>
                </div>

                {/* Titre */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,3vw,38px)', fontWeight:300, color:'#1a1208', lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.01em', marginBottom:10 }}>
                  {slide.title}
                </div>

                {/* Sous-titre */}
                <div style={{ fontSize:15, fontWeight:300, color:'rgba(30,20,8,.55)', lineHeight:1.7, marginBottom:12 }}>
                  {slide.subtitle}
                </div>

                {/* Analyse IA */}
                <div style={{ flex:1, overflow:'auto' }}>
                  <SlideInsightsAI slideId={slide.id} screenProps={screenProps} color={slide.color} />
                </div>
              </div>

              {/* ── Navigation bas ── */}
              <div style={{ flexShrink:0, padding:'14px 24px 20px', display:'flex', gap:10, alignItems:'center', background:'linear-gradient(transparent, rgba(250,245,242,.98) 38%)' }}>

                {/* Slide précédent */}
                {slideIdx > 0 && (() => { const prev = SLIDES_CONFIG[slideIdx-1]; return (
                  <button
                    onClick={() => handleNav(-1)}
                    style={{ flexShrink:0, padding:'5px 14px', borderRadius:100, background:prev.color, border:`1px solid ${prev.color}`, fontSize:11, fontFamily:"'Jost',sans-serif", color:'#1a1208', cursor:'pointer', transition:'opacity .2s, transform .15s', whiteSpace:'nowrap', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='none'}
                  >‹ {prev.badge}</button>
                )})()}
                {slideIdx === 0 && <div style={{ flexShrink:0, width:10 }}/>}

                {/* Bouton principal : ouvre la ScreenModal */}
                <button
                  onClick={() => {
                    if (slide.isBilan) { setShowBilanModal(true) }
                    else { setOpenModalId(slide.id) }
                  }}
                  style={{ flex:1, padding:'5px 20px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13.5, fontWeight:700, color:'#1a1208', letterSpacing:'.05em', background: slide.btnGrad, boxShadow:`0 6px 16px ${slide.btnShadow}`, transition:'transform .15s ease, box-shadow .15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 22px ${slide.btnShadow}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 6px 16px ${slide.btnShadow}` }}
                >
                  {slide.isBilan && bilanDoneToday ? 'Revoir mon bilan' : slide.btnLabel}
                </button>

                {/* Slide suivant */}
                {!isLast && (() => { const next = SLIDES_CONFIG[slideIdx+1]; return (
                  <button
                    onClick={() => handleNav(1)}
                    style={{ flexShrink:0, padding:'5px 14px', borderRadius:100, background:next.color, border:`1px solid ${next.color}`, fontSize:11, fontFamily:"'Jost',sans-serif", color:'#1a1208', cursor:'pointer', transition:'opacity .2s, transform .15s', whiteSpace:'nowrap', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='none'}
                  >{next.badge} ›</button>
                )})()}
                {isLast && <div style={{ flexShrink:0, width:10 }}/>}
              </div>

            </div>
          </div>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDU MOBILE — slides preview plein écran + ScreenModal en sheet
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {commonOverlays}
      <MobileSlideFlow
        slides={SLIDES_CONFIG}
        curIdx={slideIdx}
        onNav={handleNav}
        onOpenModal={(id) => {
          if (SLIDES_CONFIG.find(s => s.id === id)?.isBilan) setShowBilanModal(true)
          else setOpenModalId(id)
        }}
        bilanDoneToday={bilanDoneToday}
        screenProps={screenProps}
      />
    </>
  )
}
