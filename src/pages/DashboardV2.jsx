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

import { useState, useEffect, useRef, useMemo, useCallback, memo, startTransition } from 'react'
import { AppAvisModal } from '../components/AppAvisModal'
import { ADMIN_IDS }    from './AdminPage'
import { useAuth }      from '../hooks/useAuth'
import { usePlant }     from '../hooks/usePlant'
import { usePlantStore } from '../store/plant.store'
import { useCircle }    from '../hooks/useCircle'
import { useDefi }      from '../hooks/useDefi'
import { supabase }     from '../core/supabaseClient'
import { useTheme }     from '../hooks/useTheme'
import { useAmbiance, ambianceAsset } from '../hooks/useAmbiance'
import { useAnalytics } from '../hooks/useAnalytics'
import { logActivity }  from '../utils/logActivity'
import '../styles/dashboard.css'


import {
  useIsMobile, useProfile, useLumens,
  LumenBadge, LumenOrb, LumensCard,
  clearProfileCache,
} from './dashboardShared'

import PushNotificationButton        from '../components/PushNotificationButton'
import RituelMieuxEtre              from '../components/RituelMieuxEtre'
import { usePushNotification }       from '../hooks/usePushNotification'
import { ScreenMonJardin, DailyQuizModal, BoiteAGraines, PlantSVG, DEFAULT_GARDEN_SETTINGS } from './ScreenMonJardin'
import { WelcomeScreen }             from './WelcomeScreen'
import { VideoIntro, pickVideo }    from './VideoIntro'
import { ScreenJardinCollectif, ScreenDefis } from './ScreenDefis'
import { ScreenProblematiques }      from './ScreenProblematiques'
import { ScreenClubJardiniers }      from './ScreenClubJardiniers'
import { ScreenCercleFondateurs }    from './ScreenCercleFondateurs'
import { ScreenAteliers }            from './ScreenAteliers'
import { MaBibliotheque, useAchats } from './MaBibliotheque'
import { ScreenJardinotheque }       from './ScreenJardinotheque'
import { HelpModal }                 from './HelpModal'
import AccessPage, { PremiumModal }  from './AccessPage'
import { ONB_STYLES, NatureBg }      from './OnboardingScreen'
import { useSlideInsight, prefetchAllSlideInsights } from '../hooks/useSlideInsight'
import NeedSelectionModal   from '../components/NeedSelectionModal'
import RitualSuggestionModal from '../components/RitualSuggestionModal'
import { ProProfile }        from './ProProfile'
// Verrou anti-double award (React Strict Mode)
const _dailyLoginAwarded = new Set()


// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DES SLIDES
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES_CONFIG = [
  {
    id:        'bilan',     illusKey: 'bilan',    image: '/matin.png',
    badge:     'Chaque matin',      icon: '🌅',
    title:     'Comment tu vas\nce matin ?',
    subtitle:  'Ton espace de 2 minutes, juste pour toi.',
    guideDesc: 'Ton bilan en 2 minutes',
    color:     '#d49040',
    btnLabel:  'Je commence ma journée',
    btnGrad:   'linear-gradient(135deg, #e0a848, #c07830)',
    btnShadow: 'rgba(200,140,50,.38)',
    isBilan:   true,
    Component: null,
  },
  {
    id:        'jardin',    illusKey: 'jardin',   image: '/fleur.png',
    badge:     'Ma Fleur',           icon: '🌸',
    title:     'Ton jardin intérieur',
    subtitle:  'Ta fleur grandit chaque jour que tu prends soin de toi. Observe-la évoluer.',
    guideDesc: 'Observe et prends soin de toi',
    color:     '#b090c8',
    btnLabel:  'Je prends soin de moi',
    btnGrad:   'linear-gradient(135deg, #c8a0d8, #9070a8)',
    btnShadow: 'rgba(160,100,180,.36)',
    Component: ScreenMonJardin,
  },
  {
    id:        'champ',     illusKey: 'champ',   image: '/collectif.png',
    badge:     'Jardin Collectif',   icon: '🌼',
    title:     'Le jardin collectif',
    subtitle:  'Les fleurs de ta communauté. Une présence partagée, sans noms, sans profils.',
    guideDesc: 'Inspire-toi et partage',
    color:     '#c8a040',
    btnLabel:  'Rejoindre le jardin',
    btnGrad:   'linear-gradient(135deg, #d4b050, #a87c28)',
    btnShadow: 'rgba(180,140,40,.36)',
    Component: ScreenJardinCollectif,
  },
  {
    id:        'problematiques', illusKey: 'problematiques', image: '/reponse.png',
    badge:     'Solutions Express', icon: '🧭',
    title:     'Trouve une réponse\nà ce que tu vis !',
    subtitle:  'Identifie ce qui perturbe ton équilibre et reçois une réponse immédiate : hypnose, exercice et clés de compréhension.',
    guideDesc: 'Trouve une réponse à ce que tu vis',
    color:     '#5c7c96',
    btnLabel:  'Je trouve ma réponse',
    btnGrad:   'linear-gradient(135deg, #7ca0bc, #46647c)',
    btnShadow: 'rgba(70,100,130,.36)',
    Component: ScreenProblematiques,
  },
  {
    id:        'defis',     illusKey: 'defis',     image: '/defi.png',
    badge:     'Défis',              icon: '✨',
    title:     'Tes défis du moment',
    subtitle:  'De petits engagements hebdomadaires pour avancer, à ton rythme.',
    guideDesc: 'Avance avec des défis simples',
    color:     '#9080c0',
    btnLabel:  'Voir mes défis',
    btnGrad:   'linear-gradient(135deg, #a890d0, #7860a8)',
    btnShadow: 'rgba(140,110,190,.34)',
    Component: ScreenDefis,
    hiddenFromCarousel: true,
  },
  {
    id:        'club',      illusKey: 'club',      image: '/club.png',
    badge:     'Club des Jardiniers', icon: '👥',
    title:     'Ton club de jardiniers',
    subtitle:  'Un espace intime pour partager, s\'encourager et grandir ensemble.',
    guideDesc: 'Échange avec bienveillance',
    color:     '#6898c0',
    btnLabel:  'Rejoindre mon club',
    btnGrad:   'linear-gradient(135deg, #80aad0, #5070a0)',
    btnShadow: 'rgba(80,120,180,.34)',
    Component: ScreenClubJardiniers,
  },
  {
    id:        'cercle',    illusKey: 'cercle',    image: '/club.png',
    badge:     'Cercle des Fondateurs', icon: '🌸',
    title:     'Le Cercle des Fondateurs',
    subtitle:  'Ceux qui nous portent — contributeurs qui permettent à Mon Jardin Intérieur d\'exister librement.',
    guideDesc: 'Rejoindre le cercle',
    color:     '#8a6a9a',
    btnLabel:  'Découvrir le Cercle',
    btnGrad:   'linear-gradient(135deg, #a07ab0, #6a4a7a)',
    btnShadow: 'rgba(138,106,154,.34)',
    Component: ScreenCercleFondateurs,
    hiddenFromCarousel: true,
  },
  {
    id:        'ateliers',  illusKey: 'ateliers',  image: '/atelier.png',
    badge:     'Ateliers',           icon: '📘',
    title:     'Les ateliers guidés',
    subtitle:  'Des séances thématiques pour explorer, apprendre et pratiquer.',
    guideDesc: 'Pratique et progresse',
    color:     '#60a870',
    btnLabel:  'Explorer les ateliers',
    btnGrad:   'linear-gradient(135deg, #78c088, #488858)',
    btnShadow: 'rgba(80,160,100,.34)',
    Component: ScreenAteliers,
  },
  {
    id:        'bibliotheque', illusKey: 'bibliotheque', image: '/biblio.png',
    badge:     'Ma Bibliothèque',    icon: '📚',
    title:     'Tes outils personnels',
    subtitle:  'Retrouve ici tout ce que tu as acquis — rituels achetés, contenus échangés contre des lumens. Ton espace, à portée de main.',
    guideDesc: 'Retrouve tes essentiels',
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
    subtitle:  'Ta boutique de ressources : méditations, hypnoses, e-books et vidéos de développement personnel. Acquiers-les avec tes lumens ou directement.',
    guideDesc: 'Ressources pour t\'apaiser',
    color:     '#5890a0',
    btnLabel:  'Explorer',
    btnGrad:   'linear-gradient(135deg, #70a8b8, #406878)',
    btnShadow: 'rgba(80,140,160,.34)',
    Component: ScreenJardinotheque,
  },
  {
    id:        'boite_graine', illusKey: 'boite_graine', image: '/Boiteagraines.png',
    badge:     'Boîte à graines',    icon: '🌱',
    title:     'La boîte à graines',
    subtitle:  'Déposez ce soir les graines de vos intentions pour demain.',
    guideDesc: 'Cultive ton estime de toi',
    color:     '#4a8060',
    btnLabel:  'Ouvrir ma boîte',
    btnGrad:   'linear-gradient(135deg, #5a9870, #3a6850)',
    btnShadow: 'rgba(60,120,80,.34)',
    Component: ScreenBoiteAGraine,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  SLIDE BOÎTE À GRAINES — délègue au composant existant BoiteAGraines
// ─────────────────────────────────────────────────────────────────────────────
function ScreenBoiteAGraine({ userId, isPremium, onUpgrade }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'8px 4px 16px' }}>
      <BoiteAGraines userId={userId} inline isPremium={isPremium} onUpgrade={onUpgrade} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAGE HORAIRE — détermine quel slide est affiché en premier
//  matin   00:00–11:59 → bilan
//  après-m 12:00–17:59 → ma fleur
//  soir    18:00–23:59 → boite à graines
// ─────────────────────────────────────────────────────────────────────────────
function slideImage(slide, ambiance) {
  if (slide.id === 'jardinotheque' && ambiance === 'zen') return '/zen-jardino.png'
  return ambianceAsset(slide.image ?? '/champs.png', ambiance)
}

function getTimeSlot() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

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
const SlideInsightsAI = memo(function SlideInsightsAI({ slideId, screenProps, color }) {
  const { user, stats, circleMembers, activeCircle, communityStats, myDefis, joinedIds, gardenFlowerCount, achats } = screenProps ?? {}

  const insightPayload = useMemo(() => ({
    streak:          stats?.streak            ?? 0,
    ritualsMonth:    stats?.ritualsThisMonth  ?? 0,
    favoriteZone:    stats?.favoriteZone      ?? null,
    circleMembers:   circleMembers?.length    ?? 0,
    circleName:      activeCircle?.name       ?? null,
    defisJoined:     joinedIds?.size          ?? myDefis?.length ?? 0,
    defisDetails:    myDefis?.map(d => `${d.title} (${d.days_validated ?? 0}/${d.duration_days} jours validés)`) ?? [],
    achatCount:      achats?.length           ?? 0,
    lumens:          screenProps?.lumens?.available ?? 0,
    fleursActives:   gardenFlowerCount ?? 0,
  }), [stats, circleMembers, activeCircle, joinedIds, myDefis, communityStats, gardenFlowerCount, achats, screenProps])

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
})

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT MOBILE — slides preview plein écran, swipeable
// ─────────────────────────────────────────────────────────────────────────────
function MobileSlideFlow({ slides, curIdx, onNav, onOpenModal, onOpenNeedModal, bilanDoneToday, bilanHistory, screenProps, initial, onOpenProfile, onHelp, onSignOut, onGuide, showGuide, guideProps }) {
  const slide  = slides[curIdx]
  const isLast = curIdx === slides.length - 1
  const swipe  = useSwipe(() => onNav(1), () => onNav(-1))
  const ambiance = useAmbiance()

  // Précharge toutes les images des slides pour éviter le gel au swipe
  useEffect(() => {
    slides.forEach(s => {
      const img = new window.Image()
      img.src = slideImage(s, ambiance)
    })
  }, [slides, ambiance])

  return (
    <div
      style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', background:'linear-gradient(160deg,#f8f0ec,#ede5de)', zIndex:10 }}
    >
      <style>{`
        @keyframes ctaGlow { 0%,100%{filter:brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))} 50%{filter:brightness(1.18) drop-shadow(0 0 12px rgba(255,255,255,0.6))} }
        .cta-btn { animation: ctaGlow 2.4s ease-in-out infinite; }
        .cta-btn:active { transform:scale(0.97) !important; }
        @keyframes guidePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        .guide-btn { animation: guidePulse 2s ease-in-out infinite; }
        @keyframes arrowBlink { 0%,100%{transform:scale(1);box-shadow:0 4px 16px rgba(0,0,0,0.28),0 0 0 0 rgba(40,160,80,0.6)} 50%{transform:scale(1.10);box-shadow:0 6px 22px rgba(0,0,0,0.22),0 0 0 9px rgba(40,160,80,0)} }
        .nav-arrow { transition: transform .15s; }
        @keyframes slideImgIn { from{opacity:0} to{opacity:1} }
        @keyframes pmPulse { 0%,100%{box-shadow:0 4px 16px rgba(0,0,0,.20),0 0 0 0 rgba(90,154,40,.55)} 50%{box-shadow:0 4px 16px rgba(0,0,0,.20),0 0 0 8px rgba(90,154,40,0)} }
        .pm-slide-btn { animation: pmPulse 2s ease-in-out infinite; transition: transform .15s; }
        .pm-slide-btn:active { transform:scale(0.96); }
      `}</style>
      {/* ── Bandeau titre mobile ── */}
      <div style={{ flexShrink:0, height:'calc(48px + env(safe-area-inset-top, 0px))', boxSizing:'border-box', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'env(safe-area-inset-top, 0px) 12px 0', background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(96,160,100,.2)', zIndex:20 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <img src="/icons/icon-192.png" alt="" style={{ width:24, height:24, borderRadius:'50%' }}/>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
            Mon <em style={{ color:'#7a4030' }}>Jardin</em>
          </div>
        </div>
        {/* Actions droite */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {screenProps?.lumens && (
            <div onClick={() => screenProps.onOpenLumens?.()} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:100, background:'rgba(207,166,74,.12)', border:'1px solid rgba(207,166,74,.28)', cursor:'pointer' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'radial-gradient(circle at 38% 35%,#ffe97a,#c8a040)', flexShrink:0 }}/>
              <span style={{ fontSize:10, fontWeight:600, color:'#c8a040', fontFamily:"'Jost',sans-serif" }}>{screenProps.lumens.available}</span>
            </div>
          )}
          <div onClick={onOpenProfile} style={{ padding:'3px 9px', borderRadius:100, background:'rgba(200,160,150,.12)', border:'1px solid rgba(200,160,150,.25)', fontSize:10, fontWeight:500, color:'rgba(30,20,8,.65)', cursor:'pointer', fontFamily:"'Jost',sans-serif", display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#c8a0b0,#a07888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:600, color:'#fff', flexShrink:0 }}>{initial}</span>
            Mon profil
          </div>
          <div onClick={onHelp} style={{ padding:'3px 8px', borderRadius:100, background:'rgba(255,255,255,.5)', border:'1px solid rgba(200,160,150,.2)', fontSize:10, color:'rgba(30,20,8,.45)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>Aide</div>
          <div onClick={onSignOut} style={{ padding:'3px 8px', borderRadius:100, background:'rgba(255,255,255,.5)', border:'1px solid rgba(200,160,150,.2)', fontSize:10, color:'rgba(30,20,8,.45)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>✕</div>
        </div>
      </div>

      {/* ── Barre de progression ── */}
      <div style={{ position:'absolute', top:'calc(48px + env(safe-area-inset-top, 0px))', left:14, right:14, display:'flex', gap:4, zIndex:20 }}>
        {slides.map((s, i) => (
          <div key={s.id} style={{ flex:1, height:2.5, background:'rgba(160,100,90,.18)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:s.color, width: i < curIdx ? '100%' : i === curIdx ? '60%' : '0%', transition: i === curIdx ? 'none' : 'width .3s' }}/>
          </div>
        ))}
      </div>

      {/* ── Illustration — zone de swipe horizontal ── */}
      <div style={{ flexShrink:0, height: 280, position:'relative', overflow:'hidden', touchAction:'pan-y' }} {...swipe}>
        <img key={slideImage(slide, ambiance)} src={slideImage(slide, ambiance)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block', animation:'slideImgIn .25s ease both' }}/>
        {ambiance !== 'zen' && (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(248,240,236,0) 70%, rgba(237,229,222,1) 100%)' }}/>
        )}

        {/* ── Flèches navigation ── */}
        {curIdx > 0 && (
          <button onClick={() => onNav(-1)} className="nav-arrow" style={{ position:'absolute', bottom:16, left:16, width:58, height:58, borderRadius:'50%', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', border:'1.5px solid rgba(255,255,255,0.40)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.15)', animation:'arrowBlink 1.8s ease-in-out infinite' }}>
            <svg width="46" height="46" viewBox="0 0 20 20" fill="none"><path d="M12 2L5 10L12 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 2L10 10L17 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        {!isLast && (
          <button onClick={() => onNav(1)} className="nav-arrow" style={{ position:'absolute', bottom:16, right:16, width:58, height:58, borderRadius:'50%', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', border:'1.5px solid rgba(255,255,255,0.40)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.15)', animation:'arrowBlink 1.8s ease-in-out infinite .3s' }}>
            <svg width="46" height="46" viewBox="0 0 20 20" fill="none"><path d="M8 2L15 10L8 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 2L10 10L3 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}

        {/* ── Bouton Passer Premium — comptes free uniquement ── */}
        {!screenProps?.isPremium && (
          <button
            onClick={() => { screenProps?.track?.('premium_button_slide', {}, slide.id, 'monetization'); screenProps?.onUpgrade?.() }}
            className="pm-slide-btn"
            style={{ position:'absolute', bottom:84, right:16, padding:'9px 16px', borderRadius:100, border:'1px solid rgba(255,255,255,0.35)', background:'linear-gradient(135deg,#78c040,#4a8820)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:12.5, fontWeight:600, letterSpacing:'.02em', cursor:'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}
          >✨ Passer Premium</button>
        )}

      </div>

      {/* ── Historique bilan 7 jours — juste sous l'image ── */}
      {slide.isBilan && (
        <div style={{ flexShrink:0, background:'linear-gradient(135deg,rgba(255,255,255,0.72),rgba(252,240,218,0.60))', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(160,100,30,0.10)', padding:'12px 16px 10px', boxShadow:'0 2px 10px rgba(160,100,30,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(160,100,30,0.15))' }}/>
            <span style={{ fontSize:9, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(160,100,30,0.55)', letterSpacing:'.14em', textTransform:'uppercase' }}>Mon humeur · 7 jours</span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(160,100,30,0.15),transparent)' }}/>
          </div>
          <BilanHistory7Days history={bilanHistory ?? []} maxDays={7} />
        </div>
      )}

      {/* ── Preview texte — scroll vertical natif ── */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'16px 20px calc(80px + env(safe-area-inset-bottom, 0px))', display:'flex', flexDirection:'column', gap:8, position:'relative', zIndex:1 }}>

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

        {/* ── Bouton CTA centré ── */}
        <div style={{ textAlign:'center', paddingTop:10, paddingBottom:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <button
            className="cta-btn"
            onClick={() => {
              if (slide.isBilan) { onOpenModal(slide.id) }
              else if (slide.id === 'jardin') { onOpenNeedModal?.() }
              else { onOpenModal(slide.id) }
            }}
            style={{ padding:'18px 0', borderRadius:100, border:'none', cursor:'pointer', touchAction:'manipulation', fontFamily:"'Jost',sans-serif", fontSize:18, fontWeight:700, color:'#1a1208', letterSpacing:'.05em', background:slide.btnGrad, boxShadow:`0 10px 28px ${slide.btnShadow}`, whiteSpace:'nowrap', transition:'transform .18s ease, box-shadow .18s ease', width:'100%', maxWidth:340 }}
          >
            {slide.isBilan && bilanDoneToday ? 'Refaire mon bilan ›' : slide.btnLabel}
          </button>
          {slide.id === 'jardin' && (
            <button
              onClick={() => onOpenModal('jardin')}
              style={{ padding:'11px 28px', borderRadius:100, border:'1px solid rgba(200,160,150,.3)', background:'rgba(255,255,255,.55)', cursor:'pointer', touchAction:'manipulation', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:500, color:'rgba(30,20,8,.65)', letterSpacing:'.02em', backdropFilter:'blur(4px)' }}
            >🌸 Voir ma fleur</button>
          )}
        </div>
      </div>

      {/* Bouton ? bas-droite mobile */}
      <button
        onClick={onGuide}
        title="Guide & Repérage"
        className="guide-btn"
        style={{ position:'absolute', bottom:'calc(20px + env(safe-area-inset-bottom, 0px))', right:16, width:48, height:48, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#4cd964,#28a745)', cursor:'pointer', fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, touchAction:'manipulation' }}
      >?</button>

      {/* Guide panel mobile */}
      {showGuide && guideProps && <GuidePanel {...guideProps} />}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  BILAN HISTORY — bandeau 7 jours glissants
// ─────────────────────────────────────────────────────────────────────────────
const MOOD = [
  { max:30,  emoji:'😔', label:'Difficile', bg:'#f9d4d4', ring:'#e57373' },
  { max:50,  emoji:'😕', label:'Tendu',     bg:'#fde8c8', ring:'#ffb74d' },
  { max:65,  emoji:'😐', label:'Neutre',    bg:'#fdf9c8', ring:'#fdd835' },
  { max:80,  emoji:'🙂', label:'Bien',      bg:'#dff0c8', ring:'#aed581' },
  { max:101, emoji:'😊', label:'Épanoui',   bg:'#c8f0d4', ring:'#66bb6a' },
]
function moodFromDeg(deg) {
  const vals = Object.values(deg ?? {})
  if (!vals.length) return null
  const stressAvg = vals.reduce((s, v) => s + v, 0) / vals.length
  const wellbeing = 100 - stressAvg  // stress élevé = bien-être bas
  return MOOD.find(m => wellbeing < m.max) ?? MOOD[MOOD.length - 1]
}

const BilanHistory7Days = memo(function BilanHistory7Days({ history, maxDays = 7 }) {
  const DAY_LABELS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const today = new Date().toISOString().split('T')[0]

  // Nombre de jours à afficher : depuis le 1er bilan, max maxDays, min 1
  let daysToShow = 1
  if (history.length > 0) {
    const first = history[0].date
    const msPerDay = 86400000
    const diff = Math.round((new Date(today) - new Date(first)) / msPerDay)
    daysToShow = Math.min(maxDays, Math.max(1, diff + 1))
  }

  const days = []
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = DAY_LABELS[d.getDay()]
    const isToday = i === 0
    const entry = history.find(r => r.date === key)
    const mood = entry ? moodFromDeg(entry.degradation) : null
    days.push({ key, label, isToday, mood })
  }
  return (
    <div style={{ overflowX: daysToShow > 7 ? 'auto' : 'visible', overflowY:'visible', WebkitOverflowScrolling:'touch' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent: daysToShow <= 7 ? 'space-between' : 'flex-start', gap: daysToShow > 7 ? 8 : 0, padding:'2px 4px 0', position:'relative', minWidth: daysToShow > 7 ? daysToShow * 50 : 'auto' }}>
      {/* Trait connecteur */}
      <div style={{ position:'absolute', top:20, left:24, right:24, height:1, background:'linear-gradient(90deg,rgba(26,74,40,0.08),rgba(26,74,40,0.18),rgba(26,74,40,0.08))', zIndex:0 }}/>
      {days.map(({ key, label, isToday, mood }) => (
        <div key={key} title={mood ? mood.label : 'Pas de bilan'} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, position:'relative', zIndex:1 }}>
          <div style={{
            width: isToday ? 52 : 42,
            height: isToday ? 52 : 42,
            borderRadius:'50%',
            background: mood
              ? `radial-gradient(circle at 38% 35%, white, ${mood.bg})`
              : isToday ? 'rgba(26,74,40,0.07)' : 'rgba(255,255,255,0.7)',
            border: isToday
              ? `2px solid ${mood ? mood.ring : '#1a4a28'}`
              : `1.5px dashed ${mood ? mood.ring + 'aa' : 'rgba(26,74,40,0.20)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: isToday ? 28 : 22,
            boxShadow: mood
              ? (isToday ? `0 3px 12px ${mood.ring}55, 0 0 0 3px ${mood.ring}18` : `0 1px 6px ${mood.ring}33`)
              : (isToday ? '0 2px 8px rgba(26,74,40,0.15)' : 'none'),
            transition:'transform .15s',
          }}>
            {mood
              ? mood.emoji
              : <span style={{ width:6, height:6, borderRadius:'50%', background: isToday ? '#1a4a28' : 'rgba(26,74,40,0.25)', display:'block' }}/>
            }
          </div>
          <span style={{
            fontSize: isToday ? 9.5 : 8.5,
            fontFamily:"'Jost',sans-serif",
            fontWeight: isToday ? 700 : 400,
            color: isToday ? '#1a4a28' : 'rgba(30,20,8,.35)',
            letterSpacing:'.03em',
          }}>
            {isToday ? '· auj ·' : label}
          </span>
        </div>
      ))}
    </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN MODAL — overlay plein écran qui ouvre un slide sur ses hooks
// ─────────────────────────────────────────────────────────────────────────────
function ScreenModal({ slideId, slides, screenProps, bilanDoneToday, bilanHistory, onBilan, onClose, onOpenSlide }) {
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
        width:  isMobile ? '100%' : slide.id === 'champ' ? 'min(92vw, calc((100vh - 40px) * 16/9))' : 'min(960px, 97vw)',
        height: isMobile ? '100%' : slide.id === 'champ' ? 'min(calc(100vh - 16px), calc(min(92vw, (100vh - 16px) * 16/9) * 9/16))' : 'calc(100vh - 16px)',
        background:'#faf5f2', borderRadius: isMobile ? 0 : 20,
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,.30)',
        '--text':'#1a1208', '--text2':'rgba(35,25,12,0.78)',
        color:'#1a1208',
        animation: isMobile ? 'none' : 'modalIn .32s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* Header */}
        <div style={{
          flexShrink:0,
          height: isMobile ? 'calc(52px + env(safe-area-inset-top, 0px))' : 52,
          boxSizing:'border-box',
          display:'flex', alignItems:'center',
          justifyContent:'space-between', padding: isMobile ? 'env(safe-area-inset-top, 0px) 18px 0' : '0 18px',
          borderBottom:'1px solid rgba(96,160,100,.2)',
          background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)',
        }}>
          {/* Nom appli — logo masqué sur mobile */}
          <div onClick={onClose} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            {!isMobile && <img src="/icons/icon-192.png" alt="" style={{ width:26, height:26, borderRadius:'50%' }}/>}
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
              Mon <em style={{ color:'#7a4030' }}>Jardin</em>
              <span style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontStyle:'normal', marginLeft:6 }}>Intérieur</span>
            </div>
          </div>

          {/* Titre centré — emoji masqué sur mobile */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!isMobile && <span style={{ fontSize:22 }}>{slide.icon}</span>}
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#1a1208', fontStyle:'italic' }}>{slide.badge}</div>
          </div>

          {/* Lumens — date masquée sur mobile */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!isMobile && (
              <div style={{ fontSize:10, color:'rgba(30,20,8,.4)', fontFamily:"'Jost',sans-serif", letterSpacing:'.03em' }}>
                {new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())}
              </div>
            )}
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
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', height:'100%', overflowY:'auto', WebkitOverflowScrolling:'touch', gap:16, padding:'28px 24px', boxSizing:'border-box' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#1a1208', textAlign:'center', lineHeight:1.2 }}>
                Comment te sens-tu<br/>aujourd'hui ?
              </div>
              <div style={{ fontSize:13, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", fontWeight:300 }}>
                {bilanDoneToday ? '✓ Bilan complété aujourd\'hui' : 'Pas encore renseigné ce matin'}
              </div>
              <div style={{ width:'100%', background:'rgba(255,255,255,0.55)', backdropFilter:'blur(6px)', borderRadius:16, padding:'12px 8px', border:'1px solid rgba(26,74,40,0.10)' }}>
                <div style={{ fontSize:10, fontFamily:"'Jost',sans-serif", fontWeight:500, color:'rgba(26,74,40,0.5)', letterSpacing:'.10em', textTransform:'uppercase', textAlign:'center', marginBottom:8 }}>Mon humeur — 7 jours</div>
                <BilanHistory7Days history={bilanHistory ?? []} />
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
                {bilanDoneToday ? 'Refaire mon bilan ›' : 'Commencer le bilan ✦'}
              </button>
            </div>
          ) : (
            slide.Component && (
              (['defis', 'jardinotheque'].includes(slide.id) && !screenProps?.isPremium) ? (
                <div style={{ flex:1, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  {/* Contenu flouté */}
                  <div style={{ flex:1, overflow:'hidden', filter:'blur(7px)', transform:'scale(1.04)', transition:'filter .4s ease', pointerEvents:'none' }}>
                    <slide.Component {...screenProps}/>
                  </div>
                  {/* Carte premium centrée */}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding: isMobile ? '28px 32px' : '36px 48px', borderRadius:20, background:'rgba(250,245,242,.88)', backdropFilter:'blur(14px)', border:'1px solid rgba(26,74,40,.12)', boxShadow:'0 8px 48px rgba(0,0,0,.18)', maxWidth:300, textAlign:'center' }}>
                      <span style={{ fontSize: isMobile ? 36 : 44 }}>{slide.icon}</span>
                      <div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 28, fontWeight:600, color:'rgba(26,18,8,.92)', marginBottom:8, lineHeight:1.25 }}>
                          {slide.id === 'defis' ? 'Défis communautaires' : 'La Jardinothèque'}
                        </div>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 13 : 14, color:'rgba(26,18,8,.50)', lineHeight:1.6 }}>
                          {slide.id === 'defis'
                            ? 'Rejoins les défis de la communauté et cultive ta pratique au quotidien.'
                            : 'Accède aux méditations, hypnoses et e-books pour aller plus loin.'}
                        </div>
                      </div>
                      <button
                        onClick={screenProps?.onUpgrade}
                        style={{ padding:'14px 32px', borderRadius:100, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#5a9a28,#3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 13 : 14, fontWeight:600, letterSpacing:'.06em', boxShadow:'0 8px 24px rgba(90,154,40,.30)', transition:'transform .15s', width:'100%' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='none'}
                      >
                        Passer Premium ✦
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <slide.Component {...screenProps}/>
              )
            )
          )}
        </div>

        {/* Bandeau bas — masqué pour le jardin collectif (plein écran) */}
        {slide.id !== 'champ' && (
          <div style={{ flexShrink:0, padding:'12px 18px', paddingBottom:'calc(12px + env(safe-area-inset-bottom))', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)', borderTop:'1px solid rgba(96,160,100,.2)' }}>
            <button
              onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:100, background:'rgba(255,255,255,.8)', border:'1px solid rgba(200,160,150,.3)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,.55)', transition:'background .15s, transform .15s', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,1)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.8)'; e.currentTarget.style.transform='none' }}
            >‹ Retour</button>

            {slide.id === 'jardin' && (
              <button
                onClick={() => onOpenSlide?.('champ')}
                style={{ flex:1, padding:'10px 20px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:20, fontWeight:600, color:'#1a1208', background:'linear-gradient(135deg,#d4b050,#a87c28)', boxShadow:'0 4px 16px rgba(180,140,40,.3)', transition:'transform .15s, box-shadow .15s', letterSpacing:'.02em' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(180,140,40,.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(180,140,40,.3)' }}
              >🌻 Voir ma fleur dans le jardin collectif</button>
            )}
          </div>
        )}

        {/* Bouton Retour en overlay pour le jardin collectif */}
        {slide.id === 'champ' && (
          <div style={{ position:'absolute', bottom:'calc(24px + env(safe-area-inset-bottom))', left:24, zIndex:400 }}>
            <button
              onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:100, background:'rgba(255,255,255,.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(200,160,150,.3)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,.55)', transition:'background .15s, transform .15s', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,1)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.85)'; e.currentTarget.style.transform='none' }}
            >‹ Retour</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL — DashboardV2
//  Export identique à DashboardPage → swap transparent dans App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  SETTINGS PANEL — vue paramètres dans le modal profil
// ─────────────────────────────────────────────────────────────────────────────
const FLOWER_NAMES_LIST = [
  'Aubépine','Cèdre','Pivoine','Iris','Verveine','Jasmin','Glycine',
  'Lilas','Noisetier','Pervenche','Sauge','Lavande','Magnolia','Acacia',
  'Clématite','Bruyère','Capucine','Gentiane','Muguet','Orchidée','Tilleul',
  'Violette','Camélia','Renoncule','Mimosa','Angélique','Bouleau','Eglantine',
  'Chèvrefeuille','Coquelicot',
]

const _settingsIsIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent)
const _settingsIsStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const HORAIRES_SETTINGS     = [
  { id:'matin', label:'Matin', emoji:'🌅' },
  { id:'midi',  label:'Midi',  emoji:'☀️' },
  { id:'soir',  label:'Soir',  emoji:'🌙' },
]

function TrialInfoModal({ daysLeft, trialActive, onActivate, onClose, onUpgrade }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(8px)' }} onClick={onClose} />
      <div style={{
        position:'relative', width:'100%', maxWidth:400, borderRadius:22,
        background:'linear-gradient(160deg,#fdf6ec,#f5ead8)',
        border:'1px solid rgba(200,158,55,.40)',
        boxShadow:'0 32px 80px rgba(0,0,0,.25)',
        padding:'28px 24px 24px',
        fontFamily:"'Jost',sans-serif",
      }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,100,.3)', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'rgba(30,20,8,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✕</button>

        {/* Icône + titre */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#c8a040,#a07820)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🎁</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, color:'#4a3808', lineHeight:1.1 }}>Votre mois Premium<br/>est actif</div>
            <div style={{ fontSize:11, color:'rgba(140,100,20,.75)', marginTop:3 }}>Accès complet · {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize:12, fontWeight:300, color:'rgba(80,55,10,.65)', lineHeight:1.75, marginBottom:16 }}>
          En répondant au questionnaire, vous avez débloqué un mois complet sans restriction, sans carte bancaire requise.
        </p>

        {/* Features */}
        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:22 }}>
          {[
            'Tous les espaces et rituels débloqués',
            'Club des jardiniers & jardin collectif',
            'Jardinothèque complète (audio, vidéo, e-books)',
            'Défis communautaires complets',
            'Ateliers guidés & accompagnements',
          ].map((f, i) => (
            <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
              <span style={{ color:'#c8a040', fontSize:13, flexShrink:0, marginTop:1 }}>✓</span>
              <span style={{ fontSize:12, fontWeight:300, color:'rgba(80,55,10,.72)', lineHeight:1.5 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <button onClick={trialActive ? onClose : onActivate} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#c8a040,#a07820)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:10 }}>
          {trialActive ? '✨ Explorer mon jardin' : '🎁 Activer mon mois offert'}
        </button>

        {/* CTA secondaire */}
        <button onClick={onUpgrade} style={{ width:'100%', padding:'10px', borderRadius:14, border:'1px solid rgba(140,100,20,.25)', background:'transparent', color:'rgba(140,100,20,.65)', fontSize:12, cursor:'pointer' }}>
          Passer au Premium payant →
        </button>
      </div>
    </div>
  )
}

// ── PremiumTeaserModal — popup de stimulation avant la modale de paiement ──
// Explique l'intérêt du Premium (bénéfices concrets, personnalisés si possible)
// avant d'envoyer vers PremiumModal pour le choix de formule.
function PremiumTeaserModal({ onDiscover, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:490, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(10,22,8,.55)', backdropFilter:'blur(10px)' }} onClick={onClose} />
      <div style={{
        position:'relative', width:'100%', maxWidth:400, borderRadius:22,
        background:'linear-gradient(160deg,#f4f9ef,#e9f3e0)',
        border:'1px solid rgba(90,154,40,.32)',
        boxShadow:'0 32px 80px rgba(0,0,0,.25)',
        padding:'30px 26px 24px',
        fontFamily:"'Jost',sans-serif",
        animation:'fadeUp .35s ease both',
      }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(90,154,40,.25)', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'rgba(30,20,8,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✕</button>

        {/* Icône + titre */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#78c040,#4a8820)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🌱</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:500, color:'#1a1208', lineHeight:1.15 }}>Tu n'as encore<br/>rien vu…</div>
        </div>

        {/* Accroche */}
        <p style={{ fontSize:14, fontWeight:400, color:'#1a1208', lineHeight:1.7, marginBottom:6 }}>
          La version gratuite te permet de découvrir quelques rituels.
        </p>
        <p style={{ fontSize:14, fontWeight:400, color:'#1a1208', lineHeight:1.7, marginBottom:18 }}>
          Avec Premium, profite de <strong style={{ fontWeight:700 }}>120 rituels</strong>, des <strong style={{ fontWeight:700 }}>séances audio guidées</strong>, de la <strong style={{ fontWeight:700 }}>Jardinothèque complète</strong>, du <strong style={{ fontWeight:700 }}>Club des Jardiniers</strong>, et bien plus encore…
        </p>

        {/* Tagline de clôture */}
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:16, color:'#1a1208', textAlign:'center', margin:'0 0 18px' }}>
          Prends soin de toi, sans limite.
        </p>

        {/* CTA principal */}
        <button onClick={onDiscover} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#5a9a28,#3a7a18)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:10, boxShadow:'0 6px 20px rgba(60,120,20,.30)' }}>
          Découvrir Premium →
        </button>

        {/* CTA secondaire */}
        <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:14, border:'1px solid rgba(90,154,40,.20)', background:'transparent', color:'rgba(26,18,8,.55)', fontSize:12, cursor:'pointer' }}>
          Plus tard
        </button>
      </div>
    </div>
  )
}

// ── RitualCelebrationModal — popup temporaire après un rituel complété ──
// Montée une seule fois au niveau racine, se ferme seule après 5s. La santé
// affichée s'anime de `before` à `after` pour rendre la croissance visible,
// pas juste un chiffre qui change d'un coup.
function RitualCelebrationModal({ before, after, delta, gardenSettings, onClose }) {
  const [displayHealth, setDisplayHealth] = useState(before)

  useEffect(() => {
    const duration = 1400
    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayHealth(before + (after - before) * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [before, after])

  const gain = delta != null ? delta : Math.round((after - before) * 10) / 10

  return (
    <div style={{
      // zIndex très élevé volontairement : AudioRitualsModal (99999) reste ouvert derrière
      // (son propre écran de résultat) au moment où ce popup se déclenche — sans ce niveau,
      // il restait invisible, caché sous ce modal encore affiché.
      position:'fixed', inset:0, zIndex:200000, display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, background:'rgba(20,30,10,0.35)', backdropFilter:'blur(6px)', animation:'fadeUp .3s ease both',
    }} onClick={onClose}>
      <div style={{
        position:'relative', width:'100%', maxWidth:460, borderRadius:32, padding:'44px 36px 36px', textAlign:'center',
        background:'linear-gradient(170deg,#fdf9f2,#f3ece0)', boxShadow:'0 30px 80px rgba(0,0,0,.28)', border:'1px solid rgba(200,160,100,.25)',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', border:'none', background:'rgba(0,0,0,.06)', color:'rgba(30,20,8,.5)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        <div style={{ width:300, height:196, margin:'0 auto' }}>
          <PlantSVG health={displayHealth} gardenSettings={gardenSettings ?? DEFAULT_GARDEN_SETTINGS} celebrate />
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:32, fontWeight:600, color:'#3a5a1e', marginTop:14 }}>
          Ta fleur grandit 🌱
        </div>
        {gain > 0 && (
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:19, fontWeight:700, color:'#5a9a28', marginTop:8, letterSpacing:'.03em' }}>
            +{gain}
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsPanel({ name, email, isPremium, isTrial, trialDaysLeft, trialCardSeen, isPro, isAdmin, userId, onBack, onOpenFleur, onUpgrade, onTrialInfo, onNameSaved }) {
  const [portalLoading, setPortalLoading] = useState(false)

  async function openPortal() {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { returnUrl: window.location.origin },
      })
      if (error || !data?.url) throw new Error(error?.message ?? 'Erreur portail')
      window.location.href = data.url
    } catch (e) {
      console.error('[stripe-portal]', e)
      alert("Impossible d'accéder au portail. Veuillez réessayer.")
    } finally {
      setPortalLoading(false)
    }
  }
  const [editName,      setEditName]      = useState(name ?? '')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [showFlower,    setShowFlower]    = useState(false)
  const [showPremium,   setShowPremium]   = useState(false)
  const [selFlower,     setSelFlower]     = useState(null)
  const [savingFlower,  setSavingFlower]  = useState(false)
  const [savedFlower,   setSavedFlower]   = useState(false)
  const [currentFlower, setCurrentFlower] = useState(null)

  // ── Ambiance ──
  const [ambiance,       setAmbianceState] = useState(null)
  const [savingAmbiance, setSavingAmbiance] = useState(false)

  useEffect(() => {
    if (!userId) return
    const t = setTimeout(() => {
      supabase.from('users').select('ambiance').eq('id', userId).maybeSingle()
        .then(({ data }) => setAmbianceState(data?.ambiance === 'zen' ? 'zen' : 'feerique'))
    }, 150)
    return () => clearTimeout(t)
  }, [userId])

  async function handleSetAmbiance(val) {
    if (val === ambiance || savingAmbiance) return
    setSavingAmbiance(true)
    try {
      await supabase.from('users').update({ ambiance: val }).eq('id', userId)
      try { localStorage.setItem('mji_ambiance', val) } catch {}
      window.location.reload()
    } catch (e) { console.warn('[settings] ambiance', e); setSavingAmbiance(false) }
  }

  // ── Notifications ──
  const { isSupported: pushSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotification(userId)
  const [horaires,      setHoraires]      = useState(['soir'])
  const [savingHoraires,setSavingHoraires]= useState(false)
  const [savedHoraires, setSavedHoraires] = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(true)

  useEffect(() => {
    if (!userId || !isSubscribed) return
    const t = setTimeout(() => {
      supabase.from('push_subscriptions').select('horaires').eq('user_id', userId).limit(1).maybeSingle()
        .then(({ data }) => { if (data?.horaires?.length) setHoraires(data.horaires) })
    }, 100)
    return () => clearTimeout(t)
  }, [userId, isSubscribed])

  function toggleHoraire(id) {
    setHoraires(prev => prev.includes(id)
      ? prev.length > 1 ? prev.filter(h => h !== id) : prev
      : [...prev, id])
    setSavedHoraires(false)
  }

  async function saveHoraires() {
    setSavingHoraires(true)
    await supabase.from('push_subscriptions').update({ horaires }).eq('user_id', userId)
    setSavedHoraires(true)
    setTimeout(() => setSavedHoraires(false), 2000)
    setSavingHoraires(false)
  }

  // ── Installation PWA ──
  const [installPrompt,   setInstallPrompt]   = useState(window._installPrompt ?? null)
  const [installing,      setInstalling]      = useState(false)
  const [installDone,     setInstallDone]     = useState(false)
  const [pwaInstalledAt,  setPwaInstalledAt]  = useState(null)

  useEffect(() => {
    if (!userId) return
    const t = setTimeout(() => {
      supabase.from('users').select('pwa_installed_at').eq('id', userId).single()
        .then(({ data }) => { if (data?.pwa_installed_at) setPwaInstalledAt(data.pwa_installed_at) })
    }, 150)
    return () => clearTimeout(t)
  }, [userId])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); window._installPrompt = e }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    setInstalling(true)
    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      setInstallPrompt(null)
      window._installPrompt = null
      if (outcome === 'accepted') setInstallDone(true)
    } catch (e) {
      console.error('[install] prompt error:', e)
      setInstallPrompt(null)
      window._installPrompt = null
    }
    setInstalling(false)
  }

  useEffect(() => {
    if (!userId) return
    const t = setTimeout(() => {
      supabase.from('users').select('flower_name').eq('id', userId).single()
        .then(({ data }) => { if (data?.flower_name) setCurrentFlower(data.flower_name) })
    }, 200)
    return () => clearTimeout(t)
  }, [userId])

  async function handleSaveName() {
    if (!editName.trim() || editName.trim() === name) return
    setSaving(true)
    try {
      await supabase.from('users').update({ display_name: editName.trim() }).eq('id', userId)
      await supabase.from('profiles').update({ display_name: editName.trim() }).eq('id', userId)
      setSaved(true)
      onNameSaved?.(editName.trim())
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.warn('[settings] save name', e) }
    setSaving(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <div onClick={onBack} style={{ cursor:'pointer', fontSize:22, color:'rgba(30,20,8,.55)', lineHeight:1, padding:'4px 8px', borderRadius:8, transition:'background .15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>←</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:400, color:'#1a1208' }}>Paramètres</div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Nom affiché — éditable */}
        <div style={{ padding:'12px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)' }}>
          <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:8 }}>Nom affiché</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <input
              value={editName}
              onChange={e => { setEditName(e.target.value); setSaved(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(200,160,150,.30)', background:'rgba(255,255,255,.8)', fontSize:15, fontFamily:"'Jost',sans-serif", color:'#1a1208', outline:'none' }}
              placeholder="Votre nom…"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !editName.trim() || editName.trim() === name}
              style={{ width:'100%', padding:'10px 16px', borderRadius:8, border:'none', background: saved ? 'rgba(122,170,80,.85)' : 'rgba(200,160,150,.35)', color: saved ? '#fff' : 'rgba(30,20,8,.65)', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', transition:'all .2s' }}
            >
              {saved ? '✓ Sauvé' : saving ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Email — lecture seule */}
        <div style={{ padding:'12px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)' }}>
          <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:6 }}>Email</div>
          <div style={{ fontSize:15, color:'rgba(30,20,8,.72)', fontFamily:"'Jost',sans-serif" }}>{email}</div>
        </div>

        {/* Ma fleur — picker inline */}
        {!showFlower ? (
          <div style={{ padding:'12px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)' }}>
            <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:8 }}>Mon identité florale</div>
            {currentFlower ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:16, color:'#1a1208', fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic' }}>
                  🌸 Vous avez choisi · <strong style={{ fontStyle:'normal' }}>{currentFlower}</strong>
                </div>
                <div onClick={() => { setShowFlower(true); setSelFlower(currentFlower) }} style={{ padding:'6px 14px', borderRadius:100, border:'1px solid rgba(200,160,150,.30)', background:'transparent', fontSize:12, color:'rgba(30,20,8,.55)', cursor:'pointer', fontFamily:"'Jost',sans-serif", whiteSpace:'nowrap' }}>
                  Modifier
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:14, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", fontStyle:'italic' }}>Aucune fleur choisie</div>
                <div onClick={() => setShowFlower(true)} style={{ padding:'6px 14px', borderRadius:100, border:'1px solid rgba(200,160,150,.30)', background:'transparent', fontSize:12, color:'rgba(30,20,8,.55)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
                  Choisir
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding:'14px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.25)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif" }}>🌸 Choisir ma fleur</div>
              <div onClick={() => { setShowFlower(false); setSelFlower(null) }} style={{ fontSize:12, color:'rgba(30,20,8,.38)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>Annuler</div>
            </div>
            {selFlower && (
              <div style={{ textAlign:'center', fontSize:13, fontFamily:"'Cormorant Garamond',serif", color:'rgba(30,20,8,.55)', marginBottom:10 }}>
                🌸 Votre fleur · <span style={{ color:'#1a1208', fontWeight:500 }}>{selFlower}</span>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, maxHeight:180, overflowY:'auto', marginBottom:10 }}>
              {FLOWER_NAMES_LIST.map(n => (
                <div key={n} onClick={() => setSelFlower(n)} style={{ padding:'9px 4px', borderRadius:16, fontSize:12, textAlign:'center', cursor:'pointer', fontFamily:"'Jost',sans-serif", border: selFlower===n ? '1px solid rgba(90,154,40,.5)' : '1px solid rgba(0,0,0,.10)', background: selFlower===n ? 'rgba(90,154,40,.10)' : 'rgba(0,0,0,.03)', color: selFlower===n ? '#3a7a18' : 'rgba(30,20,8,.55)', transition:'all .15s' }}>{n}</div>
              ))}
            </div>
            <button
              disabled={!selFlower || savingFlower}
              onClick={async () => {
                if (!selFlower || savingFlower) return
                setSavingFlower(true)
                try {
                  await supabase.from('users').update({ flower_name: selFlower }).eq('id', userId)
                  setCurrentFlower(selFlower)
                  setSavedFlower(true)
                  onNameSaved?.()
                  setTimeout(() => { setShowFlower(false); setSelFlower(null); setSavedFlower(false) }, 1200)
                } catch(e) { console.warn(e) }
                setSavingFlower(false)
              }}
              style={{ width:'100%', padding:'11px', borderRadius:100, border:'none', background: savedFlower ? 'rgba(122,170,80,.85)' : 'linear-gradient(135deg,#c8a0b0,#a07888)', color:'#fff', fontSize:13, fontFamily:"'Jost',sans-serif", cursor: selFlower ? 'pointer' : 'default', opacity: selFlower ? 1 : 0.4, transition:'all .2s' }}
            >
              {savedFlower ? '✓ Sauvegardé !' : savingFlower ? '…' : selFlower ? `Choisir · ${selFlower}` : 'Sélectionnez un nom'}
            </button>
          </div>
        )}

        {/* ── Ambiance ── */}
        <div style={{ padding:'12px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)' }}>
          <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:8 }}>Ambiance</div>
          <div style={{ display:'flex', gap:8 }}>
            <div
              onClick={() => handleSetAmbiance('feerique')}
              style={{
                flex:1, padding:'10px 0', borderRadius:100, textAlign:'center',
                border: ambiance === 'feerique' ? '1px solid rgba(200,160,150,.5)' : '1px solid rgba(0,0,0,.10)',
                background: ambiance === 'feerique' ? 'rgba(200,160,150,.15)' : 'rgba(0,0,0,.03)',
                color: ambiance === 'feerique' ? '#a07888' : 'rgba(30,20,8,.55)',
                fontWeight: ambiance === 'feerique' ? 600 : 400,
                fontSize:13, fontFamily:"'Jost',sans-serif", cursor: savingAmbiance ? 'default' : 'pointer', transition:'all .15s',
              }}
            >
              ✨ Féérique
            </div>
            <div
              onClick={() => handleSetAmbiance('zen')}
              style={{
                flex:1, padding:'10px 0', borderRadius:100, textAlign:'center',
                border: ambiance === 'zen' ? '1px solid rgba(90,154,40,.5)' : '1px solid rgba(0,0,0,.10)',
                background: ambiance === 'zen' ? 'rgba(90,154,40,.10)' : 'rgba(0,0,0,.03)',
                color: ambiance === 'zen' ? '#3a7a18' : 'rgba(30,20,8,.55)',
                fontWeight: ambiance === 'zen' ? 600 : 400,
                fontSize:13, fontFamily:"'Jost',sans-serif", cursor: savingAmbiance ? 'default' : 'pointer', transition:'all .15s',
              }}
            >
              🌿 Zen
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={{ background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)', overflow:'hidden' }}>
          {/* Header cliquable */}
          <div
            onClick={() => setNotifOpen(v => !v)}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', cursor:'pointer' }}
          >
            <div>
              <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:3 }}>Notifications</div>
              <div style={{ fontSize:14, color:'#1a1208', fontFamily:"'Jost',sans-serif" }}>
                {isSubscribed ? '🔔 Activées' : '🔕 Désactivées'}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {pushSupported && (
                <button
                  onClick={e => { e.stopPropagation(); isSubscribed ? unsubscribe() : subscribe() }}
                  disabled={pushLoading}
                  style={{ padding:'7px 14px', borderRadius:20, border:'none', fontSize:12, fontFamily:"'Jost',sans-serif", cursor: pushLoading ? 'wait' : 'pointer', whiteSpace:'nowrap', opacity: pushLoading ? 0.6 : 1, transition:'all .2s',
                    background: isSubscribed ? 'rgba(200,80,80,.10)' : 'linear-gradient(135deg,#c8a0b0,#a07888)',
                    color: isSubscribed ? '#c85050' : '#fff',
                  }}>
                  {pushLoading ? '…' : isSubscribed ? 'Désactiver' : 'Activer'}
                </button>
              )}
              <div style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(30,20,8,.35)', transition:'transform .2s', transform: notifOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
          {/* Contenu repliable — horaires */}
          {notifOpen && isSubscribed && (
            <div style={{ padding:'0 16px 14px', borderTop:'1px solid rgba(200,160,150,.12)' }}>
              <div style={{ fontSize:11, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif", margin:'12px 0 8px' }}>Rappels à quel moment ?</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                {HORAIRES_SETTINGS.map(h => {
                  const sel = horaires.includes(h.id)
                  return (
                    <button key={h.id} onClick={() => toggleHoraire(h.id)} style={{
                      flex:1, padding:'10px 4px', borderRadius:10, border:'none',
                      background: sel ? 'linear-gradient(135deg,#c8a0b0,#a07888)' : 'rgba(0,0,0,.05)',
                      color: sel ? '#fff' : 'rgba(30,20,8,.55)',
                      fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight: sel ? 600 : 400,
                      cursor:'pointer', transition:'all .2s',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}>
                      <span style={{ fontSize:18 }}>{h.emoji}</span>
                      {h.label}
                    </button>
                  )
                })}
              </div>
              <button onClick={saveHoraires} disabled={savingHoraires} style={{
                width:'100%', padding:'9px', borderRadius:8, border:'none',
                background: savedHoraires ? 'rgba(122,170,80,.85)' : 'rgba(200,160,150,.25)',
                color: savedHoraires ? '#fff' : 'rgba(30,20,8,.65)',
                fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', transition:'all .2s',
              }}>
                {savedHoraires ? '✓ Sauvegardé' : savingHoraires ? '…' : 'Sauvegarder les horaires'}
              </button>
            </div>
          )}
        </div>

        {/* ── Installation PWA ── */}
        <div style={{ padding:'14px 16px', background:'rgba(255,255,255,.60)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)' }}>
          <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:6 }}>Application</div>
          {installPrompt ? (
            /* Le navigateur propose l'installation → l'app n'est pas installée, même si pwaInstalledAt est défini */
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:14, color:'rgba(30,20,8,.65)', fontFamily:"'Jost',sans-serif", fontStyle:'italic' }}>Non installée</div>
              <button onClick={handleInstall} disabled={installing} style={{ padding:'7px 14px', borderRadius:20, border:'none', background:'linear-gradient(135deg,#78c878,#4a9860)', color:'#fff', fontSize:12, fontFamily:"'Jost',sans-serif", cursor: installing ? 'wait' : 'pointer', whiteSpace:'nowrap', opacity: installing ? 0.7 : 1 }}>
                {installing ? '…' : '📲 Installer'}
              </button>
            </div>
          ) : _settingsIsStandalone || installDone || pwaInstalledAt ? (
            <div style={{ fontSize:14, color:'#5a9a28', fontFamily:"'Jost',sans-serif" }}>
              📲 Installée{pwaInstalledAt && !_settingsIsStandalone ? <span style={{ fontSize:11, color:'rgba(30,20,8,.40)', marginLeft:8 }}>· ouvrez depuis votre écran d'accueil</span> : ''}
            </div>
          ) : _settingsIsIOS ? (
            <div>
              <div style={{ fontSize:13, color:'rgba(30,20,8,.55)', fontFamily:"'Jost',sans-serif", fontStyle:'italic', marginBottom:10 }}>
                Pour installer sur iOS :
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  'Appuie sur Partager ⎙ en bas de Safari',
                  'Choisis "Sur l\'écran d\'accueil"',
                  'Appuie sur "Ajouter"',
                ].map((t, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(30,20,8,.65)', fontFamily:"'Jost',sans-serif" }}>
                    <span style={{ width:20, height:20, borderRadius:'50%', background:'rgba(122,170,80,.15)', border:'1px solid rgba(122,170,80,.30)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#5a9a28', flexShrink:0 }}>{i+1}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", fontStyle:'italic' }}>
              Installation non disponible sur ce navigateur
            </div>
          )}
        </div>

        {/* Abonnement — masqué pour les pros sauf admin (géré dans Compte Pro) */}
        {(!isPro || isAdmin) && (
        <div style={{ padding:'12px 16px', background: isPremium ? 'rgba(122,170,80,.08)' : 'rgba(0,0,0,.04)', borderRadius:12, border: isPremium ? '1px solid rgba(122,170,80,.25)' : '1px solid rgba(0,0,0,.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color: isPremium ? '#5a9a28' : 'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:5 }}>Abonnement</div>
            <div style={{ fontSize:15, fontWeight:500, color: isPremium ? '#3a7a18' : 'rgba(30,20,8,.80)', fontFamily:"'Jost',sans-serif" }}>
              {isTrial ? `🎁 Essai offert · ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''}` : isPremium ? '✦ Premium actif' : 'Version gratuite'}
            </div>
          </div>
          {isPremium && !isTrial && (
            <button onClick={openPortal} disabled={portalLoading} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid rgba(90,154,40,.35)', background:'rgba(90,154,40,.08)', color:'#5a9a28', fontSize:12, fontFamily:"'Jost',sans-serif", cursor: portalLoading ? 'wait' : 'pointer', opacity: portalLoading ? 0.6 : 1, whiteSpace:'nowrap' }}>
              {portalLoading ? '…' : 'Gérer'}
            </button>
          )}
          {!isPremium && (
            <button onClick={onUpgrade} style={{ padding:'8px 14px', borderRadius:20, border:'none', background:'linear-gradient(135deg,#5a9a28,#3a7a18)', color:'#fff', fontSize:12, fontFamily:"'Jost',sans-serif", cursor:'pointer', whiteSpace:'nowrap' }}>
              Passer Premium
            </button>
          )}
        </div>
        )}

        {/* Bouton essai offert — masqué après première ouverture */}
        {isTrial && !trialCardSeen && (
          <div onClick={onTrialInfo} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'13px 15px', borderRadius:14, marginTop:10, cursor:'pointer',
            background:'linear-gradient(135deg,rgba(210,168,60,.16),rgba(185,145,45,.10))',
            border:'1px solid rgba(200,158,55,.42)',
          }}>
            <div style={{
              width:38, height:38, borderRadius:11, flexShrink:0,
              background:'linear-gradient(135deg,#c8a040,#a07820)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
            }}>🎁</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#7a5c10', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>
                Votre mois Premium offert
              </div>
              <div style={{ fontSize:11, fontWeight:300, color:'rgba(130,95,18,.68)', fontFamily:"'Jost',sans-serif", lineHeight:1.5 }}>
                {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} d'accès complet · sans carte bancaire
              </div>
            </div>
            <span style={{ fontSize:16, color:'rgba(130,95,18,.40)' }}>›</span>
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  GUIDE PANEL — index des slides + checklist débutant
// ─────────────────────────────────────────────────────────────────────────────
const GuidePanel = memo(function GuidePanel({ slides, curIdx, onNavigate, onClose, onRitual, onBilan, bilanDoneToday, stats, joinedIds, achats }) {
  const isEvening = new Date().getHours() >= 18
  const steps = isEvening
    ? [
        { label: 'Déposer une intention ce soir', done: false, slideId: 'boite_graine' },
        { label: 'Faire un rituel rapidement',    done: false, slideId: 'jardin' },
      ]
    : [
        { label: 'Faire ton bilan du matin',      done: bilanDoneToday, slideId: 'bilan' },
        { label: 'Faire un rituel rapidement',    done: false, slideId: 'jardin' },
      ]
  const doneCount = steps.filter(s => s.done).length

  return (
    <>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.32)', backdropFilter:'blur(4px)', zIndex:98 }} onClick={onClose} />
      <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'min(360px,94vw)', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderLeft:'1px solid rgba(200,160,150,.25)', boxShadow:'-24px 0 60px rgba(0,0,0,.18)', display:'flex', flexDirection:'column', overflowY:'auto', zIndex:99 }}>

        {/* Header */}
        <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(200,160,150,.2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:500, color:'#0d0905', lineHeight:1 }}>Guide & Repérage</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1px solid rgba(200,160,150,.3)', background:'rgba(255,255,255,.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#0d0905', fontWeight:600, flexShrink:0 }}>✕</button>
        </div>

        {/* Checklist — en haut */}
        <div style={{ padding:'16px 16px 14px', flexShrink:0, borderBottom:'1px solid rgba(200,160,150,.15)' }}>
          <div style={{ fontSize:13, letterSpacing:'.04em', textTransform:'uppercase', color:'#0d0905', fontFamily:"'Jost',sans-serif", fontWeight:700, marginBottom:10 }}>Par où commencer · 2mn maximum</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:10, background: step.done ? 'rgba(90,154,40,.09)' : '#fff', border: step.done ? '1px solid rgba(90,154,40,.25)' : '1px solid rgba(200,160,150,.25)' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#f5c842,#c8960a)', boxShadow:'0 2px 8px rgba(200,150,10,.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', fontFamily:"'Jost',sans-serif" }}>{i + 1}</div>
                <span style={{ flex:1, fontSize:16, color: step.done ? '#3a7a18' : '#0d0905', fontFamily:"'Jost',sans-serif", fontWeight: step.done ? 700 : 600 }}>
                  {step.label}
                </span>
                <button
                  onClick={() => { if (step.slideId === 'jardin' && onRitual) { onRitual(); onClose() } else if (step.slideId === 'bilan' && onBilan) { onBilan(); onClose() } else { onNavigate(slides.findIndex(s => s.id === step.slideId)); onClose() } }}
                  style={{ flexShrink:0, padding:'6px 14px', borderRadius:100, border:'none', background:'linear-gradient(135deg,#4cd964,#28a745)', color:'#fff', fontSize:12, fontWeight:700, fontFamily:"'Jost',sans-serif", cursor:'pointer', letterSpacing:'.03em' }}
                >Action →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Carte des espaces */}
        <div style={{ padding:'16px 16px 28px', flexShrink:0 }}>
          <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontFamily:"'Jost',sans-serif", fontWeight:600, marginBottom:10 }}>Les espaces</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {slides.map((s, i) => s.id === 'cercle' ? null : (
              <div
                key={s.id}
                onClick={() => { onNavigate(i); onClose() }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background: i === curIdx ? `${s.color}18` : '#fff', border: i === curIdx ? `1.5px solid ${s.color}66` : '1px solid rgba(200,160,150,.25)', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e => { if (i !== curIdx) e.currentTarget.style.background='rgba(255,255,255,.85)' }}
                onMouseLeave={e => { if (i !== curIdx) e.currentTarget.style.background='#fff' }}
              >
                <div style={{ width:32, height:32, borderRadius:'50%', background: i === curIdx ? s.color : `${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{s.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight: i === curIdx ? 700 : 600, color: i === curIdx ? s.color : '#0d0905', fontFamily:"'Jost',sans-serif" }}>{s.badge}</div>
                  <div style={{ fontSize:13, color:'rgba(13,9,5,.75)', fontWeight:400, fontFamily:"'Jost',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.guideDesc ?? s.title}</div>
                </div>
                {i === curIdx && <div style={{ width:7, height:7, borderRadius:'50%', background:s.color, flexShrink:0 }}/>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
})

function OrientationModal({ visibleSlides, onNavigate, onBilan, onRituel, onClose }) {
  const CARDS = [
    {
      emoji: '🌿',
      title: "J'explore à mon rythme",
      sub: "Découvre les différents espaces du jardin",
      gradient: 'linear-gradient(135deg, #e8f5e4 0%, #d0eac8 100%)',
      border: '#a8d4a0',
      accent: '#4a8840',
      action: onClose,
    },
    {
      emoji: '🌅',
      title: "Je commence par un bilan",
      sub: "Mon bilan quotidien en 2 minutes",
      gradient: 'linear-gradient(135deg, #fdf0f0 0%, #f4d8d8 100%)',
      border: '#d4a0a0',
      accent: '#a05858',
      action: onBilan,
    },
    {
      emoji: '🕯️',
      title: "J'accède aux rituels selon mes besoins",
      sub: "Choisir une pratique selon mon besoin du moment",
      gradient: 'linear-gradient(135deg, #fdf6e8 0%, #f4e4c0 100%)',
      border: '#d4b878',
      accent: '#8a6828',
      action: onRituel,
    },
    {
      emoji: '🌸',
      title: "Je retrouve ma fleur",
      sub: "Observer et nourrir mon jardin intérieur",
      gradient: 'linear-gradient(135deg, #f8f0fc 0%, #ead8f4 100%)',
      border: '#c8a0d8',
      accent: '#8060a8',
      action: () => onNavigate('jardin'),
    },
    {
      emoji: '✨',
      title: "Je relève un défi",
      sub: "Un petit engagement pour avancer aujourd'hui",
      gradient: 'linear-gradient(135deg, #f4f0fc 0%, #dcd4f4 100%)',
      border: '#a898d8',
      accent: '#7060a8',
      action: () => onNavigate('defis'),
    },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(8,12,8,0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #fdfaf6 0%, #f8f4ee 100%)',
        borderRadius: 28, padding: '32px 24px 28px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 32px 80px rgba(0,0,0,0.38)',
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(11px, 3vw, 13px)',
          fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#9a7858', margin: '0 0 10px', textAlign: 'center',
        }}>Ton jardin t'attend</p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(22px, 6vw, 28px)',
          fontWeight: 400, fontStyle: 'italic',
          color: '#1a1208', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.3,
        }}>
          Par où veux-tu<br />commencer ?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CARDS.map((c, i) => (
            <button key={i} onClick={c.action} style={{
              background: c.gradient,
              border: `1.5px solid ${c.border}`,
              borderRadius: 16,
              padding: '14px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: 26, flexShrink: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(16px, 4.2vw, 18px)',
                  fontWeight: 600, fontStyle: 'italic',
                  color: '#1a1208', lineHeight: 1.2, marginBottom: 3,
                }}>{c.title}</div>
                <div style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 'clamp(10px, 2.8vw, 11px)',
                  color: c.accent, lineHeight: 1.4,
                }}>{c.sub}</div>
              </div>
              <div style={{ fontSize: 16, color: c.accent, opacity: 0.5, flexShrink: 0 }}>›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function UpgradeToProModal({ user, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ nom:'', prenom:'', entreprise:'', activite:'', adresse:'', cp:'', ville:'', telephone:'', siret:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('users').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data?.display_name) return
        const parts = data.display_name.trim().split(/\s+/)
        setForm(f => ({ ...f, prenom: parts[0] ?? '', nom: parts.slice(1).join(' ') }))
      })
  }, [user.id])

  const upd = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const { nom, prenom, telephone, siret } = form
    if (!nom.trim())       { setError('Le nom est obligatoire.'); return }
    if (!prenom.trim())    { setError('Le prénom est obligatoire.'); return }
    if (!telephone.trim()) { setError('Le téléphone est obligatoire.'); return }
    if (!siret.trim())     { setError('Le SIRET est obligatoire.'); return }
    if (!/^\d{14}$/.test(siret.replace(/\s/g, ''))) { setError('Le SIRET doit comporter 14 chiffres.'); return }
    setError(null); setLoading(true)
    try {
      const { error: roleErr } = await supabase.from('users').update({ role: 'pro' }).eq('id', user.id)
      if (roleErr) throw new Error(roleErr.message)

      const { error: proErr } = await supabase.from('users_pro').insert({
        user_id:    user.id,
        email:      user.email,
        nom:        nom.trim(),
        prenom:     prenom.trim(),
        entreprise: form.entreprise.trim() || null,
        activite:   form.activite.trim()   || null,
        adresse:    form.adresse.trim()    || null,
        cp:         form.cp.trim()         || null,
        ville:      form.ville.trim()      || null,
        telephone:  telephone.trim(),
        siret:      siret.replace(/\s/g, ''),
        pro_plan:   'free',
        created_at: new Date().toISOString(),
      })
      if (proErr) throw new Error(proErr.message)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.functions.invoke('register-to-systemeio', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { record: { email: user.email, prenom: prenom.trim(), nom: nom.trim(), role: 'pro' } },
          })
        }
      } catch(e) { console.warn('[upgrade-pro] systemeio:', e) }

      try {
        await supabase.functions.invoke('send-one-email', { body: { to: user.email } })
      } catch(e) { console.warn('[upgrade-pro] welcome email:', e) }

      setSuccess(true)
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const input = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,.75)', border:'1.5px solid rgba(200,160,150,.28)', borderRadius:12, fontSize:14, fontFamily:"'Jost',sans-serif", color:'#1a1208', outline:'none', boxSizing:'border-box' }
  const lbl   = { fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(30,20,8,.42)', marginBottom:6, display:'block' }
  const sec   = { fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(30,20,8,.30)', margin:'18px 0 10px', fontWeight:500, borderTop:'1px solid rgba(200,160,150,.18)', paddingTop:14 }
  const overlay = { position:'fixed', inset:0, zIndex:1200, background:'rgba(10,20,5,.55)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
  const modal   = { background:'rgba(252,248,242,.98)', borderRadius:24, width:'min(520px,100%)', maxHeight:'90vh', overflowY:'auto', padding:'36px 32px 28px', position:'relative', boxShadow:'0 20px 60px rgba(30,60,10,.22)', border:'1.5px solid rgba(180,210,140,.35)' }

  if (success) return (
    <div style={overlay}>
      <div style={{ ...modal, textAlign:'center', padding:'40px 32px' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🌿</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:'#2e6808', marginBottom:10 }}>Bienvenue dans votre espace professionnel(le) !</div>
        <div style={{ fontSize:14, color:'rgba(30,20,8,.60)', lineHeight:1.75, marginBottom:24 }}>
          Votre espace pro est activé.<br/>Vous avez désormais accès au badge <strong style={{color:'#2e6808'}}>✦ Pro</strong>.
        </div>
        <button onClick={onSuccess} style={{ padding:'14px 32px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#4a8a20,#2e6808)', color:'#fff', fontSize:15, fontWeight:600, fontFamily:"'Jost',sans-serif", cursor:'pointer', boxShadow:'0 5px 18px rgba(42,104,8,.28)' }}>
          Accéder à mon espace pro →
        </button>
      </div>
    </div>
  )

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', fontSize:20, cursor:'pointer', color:'rgba(30,20,8,.35)', lineHeight:1, padding:4 }}>✕</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, color:'#1a1208', marginBottom:4 }}>Espace Professionnel 🌱</div>
        <div style={{ fontSize:13, color:'rgba(30,20,8,.48)', marginBottom:22, lineHeight:1.6 }}>Complétez vos informations pour activer votre compte pro.</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label style={lbl}>Nom <span style={{color:'#c04040'}}>*</span></label><input style={input} type="text" placeholder="Dupont" value={form.nom} onChange={upd('nom')} required maxLength={80} autoFocus/></div>
            <div><label style={lbl}>Prénom <span style={{color:'#c04040'}}>*</span></label><input style={input} type="text" placeholder="Marie" value={form.prenom} onChange={upd('prenom')} required maxLength={80}/></div>
          </div>
          <div style={sec}>Entreprise &amp; localisation</div>
          <div style={{ marginBottom:14 }}><label style={lbl}>Nom de l'entreprise</label><input style={input} type="text" placeholder="Cabinet Marie Dupont" value={form.entreprise} onChange={upd('entreprise')} maxLength={120}/></div>
          <div style={{ marginBottom:14 }}><label style={lbl}>Nature de l'activité</label><input style={input} type="text" placeholder="Ex : hypnothérapeute, coach bien-être…" value={form.activite} onChange={upd('activite')} maxLength={160}/></div>
          <div style={{ marginBottom:14 }}><label style={lbl}>Adresse</label><input style={input} type="text" placeholder="12 rue des Lilas" value={form.adresse} onChange={upd('adresse')} maxLength={200}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={lbl}>Code postal</label><input style={input} type="text" placeholder="33000" value={form.cp} onChange={upd('cp')} maxLength={10}/></div>
            <div><label style={lbl}>Ville</label><input style={input} type="text" placeholder="Bordeaux" value={form.ville} onChange={upd('ville')} maxLength={80}/></div>
          </div>
          <div style={sec}>Contact &amp; identification</div>
          <div style={{ marginBottom:14 }}><label style={lbl}>Téléphone <span style={{color:'#c04040'}}>*</span></label><input style={input} type="tel" placeholder="06 12 34 56 78" value={form.telephone} onChange={upd('telephone')} required maxLength={20}/></div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>SIRET <span style={{color:'#c04040'}}>*</span></label>
            <input style={input} type="text" placeholder="362 521 879 00034" value={form.siret} onChange={upd('siret')} required maxLength={18}/>
            <div style={{ fontSize:11, color:'rgba(30,20,8,.38)', marginTop:4 }}>14 chiffres — visible uniquement par l'équipe MJI</div>
          </div>
          {error && <div style={{ fontSize:12, color:'rgba(180,60,60,.90)', padding:'10px 14px', background:'rgba(180,60,60,.07)', border:'1px solid rgba(180,60,60,.18)', borderRadius:10, marginBottom:12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:14, borderRadius:50, border:'none', background:'linear-gradient(135deg,#4a8a20,#2e6808)', color:'#fff', fontSize:15, fontWeight:600, fontFamily:"'Jost',sans-serif", cursor:'pointer', boxShadow:'0 5px 18px rgba(42,104,8,.28)', marginTop:6, opacity:loading?0.6:1 }}>
            {loading ? '…' : 'Activer mon compte professionnel'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  AppAvisModal — laisser un avis sur l'application
// ═══════════════════════════════════════════════════════════
const NIVEAU_VIP = {
  graine:    { label:'Un geste doux',      icon:'🌸', color:'#c07898' },
  ami:       { label:'Ami du Jardin',      icon:'🌱', color:'#7ea870' },
  compagnon: { label:'Compagnon de route', icon:'🌿', color:'#4a7c45' },
  fondateur: { label:'Fondateur',          icon:'🌳', color:'#2D5F3F' },
}

const AVANTAGES_VIP = {
  graine: [
    'Accès à l\'appli (plan Free)',
    '−50% de remise sur le Premium (12 mois)',
    'Accès au Jardin collectif',
    'Accès aux 120 rituels',
    'Nom dans les remerciements',
    'Badge "Soutien" dans le profil',
  ],
  ami: [
    'Accès Premium offert',
    'Nom dans le Cercle des Fondateurs',
    'Badge "Ami du Jardin" dans le profil',
  ],
  compagnon: [
    'Accès Premium offert',
    'Nom dans le Cercle des Fondateurs',
    'Citation gravée (message + nom)',
    '−50% sur tous les ateliers',
    'Accès anticipé aux nouvelles fonctionnalités',
    'Badge "Compagnon" dans le profil',
  ],
  fondateur: [
    'Accès Premium offert',
    'Nom dans le Cercle des Fondateurs',
    'Citation gravée (message + nom)',
    '−50% sur tous les ateliers et la jardinothèque',
    'Accès prioritaire au support',
    'Badge "Fondateur" exclusif dans le profil',
    'Participation exclusive aux évolutions à venir',
  ],
}

// Scan fleurs exemple (même glob que ScreenCercleFondateurs)
const _vipFleurGlob = import.meta.glob('/public/fondateurs/exemple/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' })
const VIP_FLEUR_CHOIX = Object.entries(_vipFleurGlob)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => (typeof url === 'string' && url.startsWith('/public') ? url.replace('/public', '') : url))

const UPGRADE_TIERS = [
  { niveau:'ami',       label:'Ami du Jardin',      icon:'🌱', color:'#7ea870', min:150, max:249, step:1, default:180 },
  { niveau:'compagnon', label:'Compagnon de route',  icon:'🌿', color:'#4a7c45', min:250, max:499, step:1, default:350 },
  { niveau:'fondateur', label:'Fondateur',            icon:'🌳', color:'#2D5F3F', min:500, max:2000, step:50, default:800 },
]
const NIVEAU_ORDER = ['graine','ami','compagnon','fondateur']

function CompteVipModal({ fondateur, isFondateurGraine, onClose }) {
  const niveau  = fondateur?.niveau ?? (isFondateurGraine ? 'graine' : 'ami')
  const cfg     = NIVEAU_VIP[niveau] ?? NIVEAU_VIP.ami
  const dateStr = fondateur?.date_contribution
    ? new Date(fondateur.date_contribution).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
    : null

  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeTier, setUpgradeTier] = useState(null)
  const [upgradeMontant, setUpgradeMontant] = useState(0)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [form, setForm] = useState({
    display_name: fondateur?.display_name ?? '',
    citation:     fondateur?.citation     ?? '',
    fleur_image:  fondateur?.fleur_image  ?? '',
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const availableUpgrades = UPGRADE_TIERS.filter(t => NIVEAU_ORDER.indexOf(t.niveau) > NIVEAU_ORDER.indexOf(niveau))

  const handleUpgrade = async () => {
    if (!upgradeTier || upgradeLoading || !fondateur?.email) return
    setUpgradeLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('cercle-checkout', {
        body: {
          prenom:    fondateur.display_name?.split(' ')[0] ?? '',
          nom:       fondateur.display_name?.split(' ').slice(1).join(' ') ?? '',
          email:     fondateur.email ?? '',
          montant:   upgradeMontant,
          niveau:    upgradeTier.niveau,
          label:     upgradeTier.label,
          upgrade:   true,
        },
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (e) {
      console.error('[upgrade]', e)
    }
    setUpgradeLoading(false)
  }

  const handleSave = async () => {
    if (!fondateur || saving) return
    setSaving(true)
    const { error } = await supabase.from('fondateurs').update({
      display_name: form.display_name.trim() || fondateur.display_name,
      citation:     form.citation.trim()     || null,
      fleur_image:  form.fleur_image         || null,
    }).eq('user_id', fondateur.user_id ?? '')
    if (!error) { setSaved(true); setTimeout(() => { setSaved(false); setEditing(false) }, 1400) }
    setSaving(false)
  }

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(200,178,168,.35)', background:'#fff', fontFamily:"'Jost',sans-serif", fontSize:15, color:'#1a1208', outline:'none', boxSizing:'border-box' }
  const labelStyle = { display:'block', fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:600, letterSpacing:'.05em', textTransform:'uppercase', color:'rgba(30,20,8,.50)', marginBottom:5 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(10,22,8,.60)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#faf8f4', borderRadius:26, width:'min(480px,100%)', maxHeight:'90vh', overflowY:'auto', padding:'36px 28px 32px', position:'relative', boxShadow:'0 24px 72px rgba(30,60,10,.30)', border:'1.5px solid rgba(180,210,140,.35)' }}>

        <button onClick={onClose} aria-label="Fermer"
          style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(200,160,150,.14)', cursor:'pointer', fontSize:13, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          {(editing ? form.fleur_image : fondateur?.fleur_image)
            ? <img src={editing ? form.fleur_image : fondateur.fleur_image} alt="" style={{ width:90, height:90, objectFit:'contain', display:'block', margin:'0 auto 12px', borderRadius:12 }}/>
            : <div style={{ fontSize:48, marginBottom:12 }}>{cfg.icon}</div>
          }
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#1a1208', marginBottom:6 }}>
            Mon compte VIP
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', borderRadius:100, background:`${cfg.color}12`, border:`1px solid ${cfg.color}30` }}>
            <span>{cfg.icon}</span>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12.5, fontWeight:600, color:cfg.color }}>{cfg.label}</span>
            {fondateur?.montant && <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:'#1a1208' }}>{fondateur.montant}€</span>}
          </div>
        </div>

        {!editing ? (
          <>
            {fondateur?.citation && (
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:16, color:'rgba(30,20,8,.75)', lineHeight:1.75, marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(74,124,69,.05)', border:'1px solid rgba(74,124,69,.12)', textAlign:'center' }}>
                "{fondateur.citation}"
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:20 }}>
              {(AVANTAGES_VIP[niveau] ?? []).map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(30,20,8,.78)', fontFamily:"'Jost',sans-serif", padding:'7px 14px', borderRadius:10, background:`${cfg.color}06`, border:`1px solid ${cfg.color}18` }}>
                  <span style={{ color:cfg.color, fontSize:11, flexShrink:0 }}>✦</span>
                  {a}
                </div>
              ))}
            </div>
            {/* ── Code remise fondateur ── */}
            {fondateur?.discount_code && (() => {
              const DISCOUNT_FOR = {
                graine:    '−50% sur le Premium (12 mois)',
                ami:       '−50% sur le Premium (12 mois)',
                compagnon: '−50% sur les Ateliers',
                fondateur: '−50% sur les Ateliers & la Jardinthèque',
              }
              const handleCopy = () => {
                navigator.clipboard.writeText(fondateur.discount_code)
                setCodeCopied(true)
                setTimeout(() => setCodeCopied(false), 2000)
              }
              return (
                <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:14, background:`${cfg.color}08`, border:`1.5px solid ${cfg.color}30` }}>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:cfg.color, marginBottom:6 }}>
                    🎟 Votre code remise
                  </div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'rgba(30,20,8,.55)', marginBottom:10 }}>
                    {DISCOUNT_FOR[niveau] ?? ''}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, padding:'9px 14px', borderRadius:10, background:'#fff', border:`1px solid ${cfg.color}25`, fontFamily:"'Jost',sans-serif", fontSize:16, fontWeight:700, letterSpacing:'.08em', color:'#1a1208' }}>
                      {fondateur.discount_code}
                    </div>
                    <button onClick={handleCopy} style={{ padding:'9px 14px', borderRadius:10, border:`1.5px solid ${cfg.color}40`, background: codeCopied ? cfg.color : 'transparent', color: codeCopied ? '#fff' : cfg.color, fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}>
                      {codeCopied ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
              )
            })()}

            {dateStr && <div style={{ textAlign:'center', fontSize:11.5, color:'rgba(30,20,8,.38)', fontFamily:"'Jost',sans-serif", marginBottom:18 }}>Membre depuis le {dateStr}</div>}

            {/* ── Section upgrade ── */}
            {availableUpgrades.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <button onClick={() => setUpgrading(v => !v)}
                  style={{ width:'100%', padding:'10px', borderRadius:12, border:'1.5px dashed rgba(74,124,69,.30)', background:'transparent', color:'#4a7c45', fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', letterSpacing:'.03em' }}>
                  {upgrading ? '▲ Fermer' : '⬆ Monter de niveau'}
                </button>
                {upgrading && (
                  <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                    {availableUpgrades.map(t => {
                      const selected = upgradeTier?.niveau === t.niveau
                      const montant  = selected ? upgradeMontant : t.default
                      const pct      = ((montant - t.min) / (t.max - t.min)) * 100
                      const trackBg  = `linear-gradient(to right,${t.color} 0%,${t.color} ${pct}%,#e0d8d0 ${pct}%,#e0d8d0 100%)`
                      return (
                        <div key={t.niveau} onClick={() => { setUpgradeTier(t); setUpgradeMontant(t.default) }}
                          style={{ padding:'12px 14px', borderRadius:14, border: selected ? `2px solid ${t.color}` : '1.5px solid rgba(200,190,175,.30)', background: selected ? `${t.color}08` : '#fff', cursor:'pointer', transition:'all .15s' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: selected ? 10 : 0 }}>
                            <span style={{ fontSize:20 }}>{t.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, color:t.color, letterSpacing:'.06em', textTransform:'uppercase' }}>{t.label}</div>
                              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:'#1a1208' }}>{t.min}€ – {t.max}€</div>
                            </div>
                            {selected && <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:'#1a1208' }}>{upgradeMontant}€</span>}
                          </div>
                          {selected && (
                            <input type="range" min={t.min} max={t.max} step={t.step} value={upgradeMontant}
                              onChange={e => setUpgradeMontant(Number(e.target.value))}
                              onClick={e => e.stopPropagation()}
                              style={{ width:'100%', accentColor:t.color, cursor:'pointer' }}
                            />
                          )}
                        </div>
                      )
                    })}
                    {upgradeTier && (
                      <button onClick={handleUpgrade} disabled={upgradeLoading}
                        style={{ width:'100%', padding:'12px', borderRadius:50, border:'none', background:`linear-gradient(135deg,${upgradeTier.color},${upgradeTier.color}cc)`, color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:`0 6px 20px ${upgradeTier.color}40` }}>
                        {upgradeLoading ? 'Redirection…' : `Passer ${upgradeTier.label} · ${upgradeMontant}€`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              {fondateur && (
                <button onClick={() => setEditing(true)} style={{ flex:1, padding:'11px', borderRadius:50, border:'1.5px solid rgba(74,124,69,.35)', background:'rgba(74,124,69,.06)', color:'#4a7c45', fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  ✎ Modifier
                </button>
              )}
              <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#5a9a2e,#3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={labelStyle}>Nom affiché</label>
              <input style={inputStyle} type="text" value={form.display_name} onChange={e => set('display_name', e.target.value)} maxLength={80}/>
            </div>
            {niveau !== 'graine' && (
              <div>
                <label style={labelStyle}>Citation florale <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>— 80 car. max</span></label>
                <div style={{ position:'relative' }}>
                  <textarea style={{ ...inputStyle, resize:'none', fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontStyle: form.citation ? 'italic' : 'normal' }}
                    rows={2} maxLength={80} placeholder='"Pour que la douceur ait sa place."'
                    value={form.citation} onChange={e => set('citation', e.target.value)}/>
                  <span style={{ position:'absolute', bottom:8, right:10, fontSize:11, color:'rgba(30,20,8,.28)', fontFamily:"'Jost',sans-serif" }}>{form.citation.length}/80</span>
                </div>
              </div>
            )}
            {niveau !== 'graine' && (
              <div>
                <label style={labelStyle}>Ma fleur</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, maxHeight:180, overflowY:'auto', padding:'4px 2px' }}>
                  {VIP_FLEUR_CHOIX.map((src, i) => {
                    const sel = form.fleur_image === src
                    return (
                      <div key={i} onClick={() => set('fleur_image', sel ? '' : src)}
                        style={{ width:72, height:72, borderRadius:10, overflow:'hidden', cursor:'pointer', border: sel ? `2.5px solid ${cfg.color}` : '2px solid rgba(200,178,148,.20)', boxShadow: sel ? `0 0 0 2px ${cfg.color}40` : 'none', background:'#faf8f4', transition:'all .14s', flexShrink:0 }}>
                        <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={() => setEditing(false)} style={{ flex:1, padding:'11px', borderRadius:50, border:'1.5px solid rgba(200,178,148,.40)', background:'transparent', color:'rgba(30,20,8,.55)', fontFamily:"'Jost',sans-serif", fontSize:14, cursor:'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, padding:'11px', borderRadius:50, border:'none', background: saved ? 'rgba(90,154,40,.85)' : 'linear-gradient(135deg,#5a9a2e,#3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {saved ? '✓ Sauvegardé' : saving ? '…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const ambiance = useAmbiance()
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
  const { todayPlant, stats: plantStats, reload: reloadPlant } = usePlant(user?.id)
  const { communityStats, defis, myDefis, joinedIds, isLoading: defisLoading } = useDefi(user?.id)
  const { achats } = useAchats(user?.id)
  const prefetchRunRef = useRef(false)
  const { stats, circleMembers, activeCircle } = useCircle(user?.id)
  const profile                                = useProfile(user?.id)
  const { lumens, award: awardLumens, refresh } = useLumens(user?.id)
  const { track }                              = useAnalytics(user?.id)

  const [isPro,               setIsPro]               = useState(false)
  const [premiumTrialUntil,   setPremiumTrialUntil]   = useState(null)
  const isAdmin = ADMIN_IDS.includes(user?.id)

  const isPaidPremium = isPro || (
    (profile?.plan === 'premium' || !!profile?.premium_until)
    && profile?.premium_until && new Date(profile.premium_until) > new Date()
  )
  const isTrialActive      = !!premiumTrialUntil && premiumTrialUntil > new Date()
  const isPremium          = isPaidPremium || isTrialActive
  const isFondateurGraine  = profile?.plan === 'fondateur_graine'
  const trialDaysLeft  = isTrialActive
    ? Math.ceil((premiumTrialUntil - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  // ── Modals & états ── (identique à DashboardPage)
  const [active,              setActive]              = useState('jardin')
  const [slideIdx,            setSlideIdx]            = useState(0)
  const [showBilanModal,      setShowBilanModal]      = useState(false)
  const [openRitualsModal,    setOpenRitualsModal]    = useState(false)
  const [bilanDoneToday,      setBilanDoneToday]      = useState(false)
  const [showWelcome,         setShowWelcome]         = useState(false)
  const [showVideoIntro,      setShowVideoIntro]      = useState(false)
  const [introVideo,          setIntroVideo]          = useState(null)
  const [introSoundUnlocked,  setIntroSoundUnlocked]  = useState(false)
  const preloadVideoRef   = useRef(null)
  const videoRetryRef     = useRef(0)
  const [prefetchDone,        setPrefetchDone]        = useState(false)
  const [isNewUser,           setIsNewUser]           = useState(false)
  const [welcomeReady,        setWelcomeReady]        = useState(false)
  const [showAccessModal,     setShowAccessModal]     = useState(false)
  const [showLumensModal,     setShowLumensModal]     = useState(false)
  const [showLumenInfo,       setShowLumenInfo]       = useState(false)
  const [showProfileModal,    setShowProfileModal]    = useState(false)
  const [userActionCount,     setUserActionCount]     = useState(null)
  const [userLevel,           setUserLevel]           = useState(1)
  const [showLevelInfo,       setShowLevelInfo]       = useState(false)
  const [levelInfoPerks,      setLevelInfoPerks]      = useState(null)
  const [levelInfoTab,        setLevelInfoTab]        = useState(1)

  useEffect(() => {
    if (!showLevelInfo) return
    setLevelInfoTab(userLevel)
    supabase.from('app_settings').select('value').eq('key', 'level_perks').maybeSingle()
      .then(({ data }) => { try { setLevelInfoPerks(JSON.parse(data?.value ?? '{}')) } catch {} })
  }, [showLevelInfo])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('level').eq('id', user.id).maybeSingle()
      .then(({ data }) => setUserLevel(data?.level ?? 1))
  }, [user?.id])

  useEffect(() => {
    if (!showProfileModal || !user?.id) return
    supabase.from('activity').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setUserActionCount(count ?? 0))
    supabase.from('fondateurs').select('user_id, display_name, email, niveau, montant, citation, fleur_image, date_contribution, discount_code')
      .eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setFondateurData(data ?? null))
  }, [showProfileModal, user?.id])
  const [showProProfileModal,    setShowProProfileModal]    = useState(false)
  const [showVipModal,           setShowVipModal]           = useState(false)
  const [showRituelCalendrier,   setShowRituelCalendrier]   = useState(false)
  const [fondateurData,       setFondateurData]       = useState(null)
  const [showPremiumModal,    setShowPremiumModal]    = useState(false)
  const [showPremiumTeaser,   setShowPremiumTeaser]   = useState(false)
  const [showTrialInfoModal,  setShowTrialInfoModal]  = useState(false)
  const [trialCardSeen,       setTrialCardSeen]       = useState(() => !!localStorage.getItem(`trial_card_seen_${user?.id}`))
  const [profileView,         setProfileView]         = useState('main') // 'main' | 'settings'
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
  const [postRitualSlide,     setPostRitualSlide]     = useState(false)  // true = slide ouvert après rituel → animations
  const [showNeedModal,       setShowNeedModal]       = useState(false)
  const [bilanDegradation,    setBilanDegradation]    = useState(null)
  const [showRitualSuggestion,setShowRitualSuggestion]= useState(false)
  const [selectedNeed,        setSelectedNeed]        = useState(null)
  const ritualCompleteCalledRef = useRef(false)
  const [bilanHistory,        setBilanHistory]        = useState([])
  const [showGuide,           setShowGuide]           = useState(false)
  const [showUpgradeToProModal, setShowUpgradeToProModal] = useState(false)
  const [showProLaunch,        setShowProLaunch]        = useState(() => localStorage.getItem('mji_show_pro_launch') === '1')
  const [showOrientationModal, setShowOrientationModal] = useState(false)
  const [showAvisModal,        setShowAvisModal]        = useState(false)
  const [ritualCelebration,    setRitualCelebration]    = useState(null) // {before, after, delta} — popup temporaire fleur qui évolue
  const [gardenSettings,       setGardenSettings]       = useState(DEFAULT_GARDEN_SETTINGS)

  // Mêmes réglages (couleurs/forme des pétales) que la vraie fleur affichée dans
  // ScreenMonJardin — sinon le popup de célébration montre une fleur différente.
  useEffect(() => {
    if (!user?.id) return
    supabase.from('garden_settings').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setGardenSettings({
          sunriseH: data.sunrise_h ?? 7,
          sunriseM: data.sunrise_m ?? 0,
          sunsetH:  data.sunset_h  ?? 20,
          sunsetM:  data.sunset_m  ?? 0,
          petalColor1: data.petal_color1 ?? 'var(--zone-flowers)',
          petalColor2: data.petal_color2 ?? 'var(--zone-flowers)',
          petalShape:  data.petal_shape  ?? 'round',
        })
      })
  }, [user?.id])

  // ── Slides visibles selon la plage horaire ──
  const visibleSlides = useMemo(() => {
    const visible = SLIDES_CONFIG.filter(s => !s.hiddenFromCarousel && (!s.devOnly || import.meta.env.DEV))
    const slot = getTimeSlot()
    if (slot === 'morning') return visible
    const withoutBilan = visible.filter(s => s.id !== 'bilan')
    if (slot === 'afternoon') return withoutBilan
    // soir : boite_graine en tête
    const boite = withoutBilan.find(s => s.id === 'boite_graine')
    const rest  = withoutBilan.filter(s => s.id !== 'boite_graine')
    return [boite, ...rest]
  }, [])

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

  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('premium_trial_until, quiz_completed_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.premium_trial_until) setPremiumTrialUntil(new Date(data.premium_trial_until))
        if (data?.quiz_completed_at)   setQuizCompleted(true)
      })
  }, [user?.id])

  async function activateTrialNow() {
    if (!user?.id || isTrialActive) return
    const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await supabase.from('profiles').update({ premium_trial_until: until.toISOString() }).eq('id', user.id)
    setPremiumTrialUntil(until)
  }

  useEffect(() => {
    if (!user?.id) return
    const key = `mji_orientation_${user.id}`
    if (localStorage.getItem(key) === '1') {
      localStorage.setItem(key, 'seen')
      setShowOrientationModal(true)
    }
  }, [user?.id])

  const isFirstToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const key   = `last_welcome_${user?.id}`
    const last  = localStorage.getItem(key)
    if (last !== today) { localStorage.setItem(key, today); return true }
    return false
  }, [user?.id])

  // ── WelcomeScreen — affiché à chaque connexion ──
  useEffect(() => {
    if (!user?.id || isStripeReturn) return
    const createdAt = user.created_at ? new Date(user.created_at) : null
    const isJustCreated = createdAt && (Date.now() - createdAt.getTime()) < 10 * 60 * 1000
    setIsNewUser(!!isJustCreated)
    setWelcomeReady(true)
    setShowWelcome(true)
    // Pré-sélectionne la vidéo et marque immédiatement comme vue (évite les répétitions si l'utilisateur recharge avant de cliquer)
    const today = new Date().toISOString().split('T')[0]
    const key   = `video_intro_last_seen__${user.id}`
    if (localStorage.getItem(key) !== today && ambiance !== 'zen') {
      localStorage.setItem(key, today)
      setIntroVideo(pickVideo(user.id))
    }
  }, [user?.id, ambiance])

  // Si l'ambiance bascule sur zen après que introVideo a été défini (race Supabase), on annule
  useEffect(() => {
    if (ambiance === 'zen') {
      setIntroVideo(null)
      setShowVideoIntro(false)
    }
  }, [ambiance])

  const refreshGardenCount = useCallback(() => {
    const since = new Date(); since.setDate(since.getDate() - 7)
    Promise.all([
      supabase.from('plants').select('user_id, health, date').gte('date', since.toISOString().split('T')[0]).order('date', { ascending: false }),
      supabase.from('privacy_settings').select('user_id').eq('show_health', false),
      supabase.from('garden_decor_flowers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]).then(([plantsRes, privacyRes, decorRes]) => {
      if (plantsRes.error) return
      const hidden = new Set((privacyRes.data || []).map(p => p.user_id))
      const byUser = {}
      for (const row of (plantsRes.data || [])) { if (!byUser[row.user_id]) byUser[row.user_id] = row }
      const realCount  = Object.values(byUser).filter(p => !hidden.has(p.user_id) && p.health > 0).length
      const decorCount = decorRes?.count ?? 0
      setGardenFlowerCount(realCount + decorCount)
    })
  }, [])

  useEffect(() => { refreshGardenCount() }, [])

  // Restaurer le tab après retour depuis Stripe
  useEffect(() => {
    const tab = sessionStorage.getItem('stripe_return_tab') ?? sessionStorage.getItem('pending_open_tab')
    if (!tab || !visibleSlides.length) return
    sessionStorage.removeItem('stripe_return_tab')
    sessionStorage.removeItem('pending_open_tab')
    const idx = visibleSlides.findIndex(s => s.id === tab)
    if (idx >= 0) { setSlideIdx(idx); setActive(tab) }
  }, [visibleSlides])

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


  // Rafraîchit l'historique bilan après un nouveau bilan
  useEffect(() => {
    if (!user?.id) return
    const handler = ({ detail: deg }) => {
      const today = new Date().toISOString().split('T')[0]
      setBilanHistory(prev => {
        const filtered = prev.filter(r => r.date !== today)
        return [...filtered, { date: today, degradation: deg }].sort((a, b) => a.date.localeCompare(b.date))
      })
    }
    window.addEventListener('bilanComplete', handler)
    return () => window.removeEventListener('bilanComplete', handler)
  }, [user?.id])

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
    if (!user?.id) return
    const since = new Date(); since.setDate(since.getDate() - 14)
    const sinceStr = since.toISOString().split('T')[0]
    supabase.from('daily_quiz').select('date, degradation').eq('user_id', user.id).gte('date', sinceStr).order('date', { ascending: true })
      .then(({ data }) => setBilanHistory(data ?? []))
  }, [user?.id])

  useEffect(() => {
    if (ADMIN_IDS.includes(user?.id)) {
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('resolved', false)
        .then(({ count }) => setPendingReports(count ?? 0))
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !awardLumens) return
    const today = new Date().toISOString().split('T')[0]
    const lsKey = `daily_login_awarded_${user.id}`
    // Vérification localStorage d'abord — évite toute requête si déjà fait aujourd'hui
    if (localStorage.getItem(lsKey) === today) return
    // Verrou mémoire pour éviter double-appel dans le même cycle React
    if (_dailyLoginAwarded.has(user.id)) return
    _dailyLoginAwarded.add(user.id)
    // Poser le verrou localStorage immédiatement avant la requête
    localStorage.setItem(lsKey, today)
    // Vérifier en base (cas où localStorage a été vidé)
    supabase.from('lumen_transactions').select('id').eq('user_id', user.id)
      .eq('reason', 'daily_login').gte('created_at', today + 'T00:00:00.000Z').maybeSingle()
      .then(({ data }) => {
        if (!data) awardLumens(1, 'daily_login', { date: today })
      })
  }, [user?.id])

  useEffect(() => {
    const handler = e => {
      const { event, props, page, cat } = e.detail ?? {}
      if (event) track(event, props ?? {}, page, cat)
    }
    window.addEventListener('analytics_track', handler)
    return () => window.removeEventListener('analytics_track', handler)
  }, [track])

  // ── Popup "fleur qui évolue" — montée globalement une seule fois, se déclenche
  // pour n'importe quel rituel complété (peu importe le modal emprunté), puisque
  // tous les chemins de complétion dispatchent déjà ritualCompleteSnapshot. ──
  useEffect(() => {
    const handler = e => {
      const d = e.detail
      if (!d || d.before == null || d.after == null) return
      setRitualCelebration(d)
    }
    window.addEventListener('ritualCompleteSnapshot', handler)
    return () => window.removeEventListener('ritualCompleteSnapshot', handler)
  }, [])

  useEffect(() => {
    if (!ritualCelebration) return
    const t = setTimeout(() => setRitualCelebration(null), 5000)
    return () => clearTimeout(t)
  }, [ritualCelebration])

  // window.openAccessModal (utilisé dans les sous-composants)
  useEffect(() => {
    window.openAccessModal = () => setShowPremiumModal(true)
    return () => { delete window.openAccessModal }
  }, [])

  // ── Popup Premium automatique — 20s après l'arrivée sur le dashboard, pour les comptes free ──
  // Une fois par jour maximum (localStorage), quel que soit le slide actif, et attend qu'aucun
  // autre écran (welcome, vidéo d'intro, bilan, besoin, etc.) ne soit ouvert avant de s'afficher.
  const dashboardBlockedRef  = useRef(false)
  const premiumPopupShownRef = useRef(false)
  useEffect(() => {
    dashboardBlockedRef.current = showWelcome || showVideoIntro || showBilanModal || showNeedModal
      || showRitualSuggestion || showOrientationModal || !!openModalId || showProfileModal
      || showAccessModal || showPremiumModal || showPremiumTeaser
  })

  useEffect(() => {
    if (!user?.id || isPremium || premiumPopupShownRef.current) return
    const today   = new Date().toISOString().split('T')[0]
    const lsKey   = `premium_popup_seen_${user.id}`
    if (localStorage.getItem(lsKey) === today) return
    let cancelled = false
    const tryShow = () => {
      if (cancelled || premiumPopupShownRef.current) return
      if (dashboardBlockedRef.current) { setTimeout(tryShow, 3000); return }
      premiumPopupShownRef.current = true
      localStorage.setItem(lsKey, today)
      setShowPremiumTeaser(true)
      track('premium_teaser_auto', {}, active, 'monetization')
    }
    const t = setTimeout(tryShow, 20000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [user?.id, isPremium])

  // ── Tracking : vue initiale du slide au chargement (une seule fois par session) ──
  const _initialSlideTracked = useRef(false)
  useEffect(() => {
    if (_initialSlideTracked.current || showWelcome || !user?.id || !visibleSlides.length) return
    _initialSlideTracked.current = true
    const s = visibleSlides[slideIdx]
    if (s) track('page_view', {}, s.id, 'navigation')
  }, [user?.id, showWelcome, visibleSlides.length])

  // ── Tracking : ouverture du bilan ──
  useEffect(() => {
    if (!showBilanModal || !user?.id) return
    track('page_view', {}, 'bilan', 'navigation')
  }, [showBilanModal])

  // ── Navigation slides ──
  const handleNav = useCallback((dir) => {
    setSlideIdx(prev => {
      const next = prev + dir
      if (next < 0 || next >= visibleSlides.length) return prev
      // Mettre à jour l'écran actif pour les effets analytics
      const nextSlide = visibleSlides[next]
      if (!nextSlide.isBilan) setActive(nextSlide.id)
      track('page_view', {}, nextSlide.id, 'navigation')
      return next
    })
  }, [track])

  // ── Props partagées transmises aux Screen components ──
  const screenProps = useMemo(() => ({
    user,
    userId:         user?.id,          // requis par tous les Screen components
    profile:        { ...profile, level: userLevel },
    userLevel,
    isPremium,
    isFondateurGraine,
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
    achats,
    unreadMessages: unreadCoeurs,
    pendingInvitations,
    onOpenBilan:    () => setShowBilanModal(true),
    onOpenLumens:   () => setShowLumensModal(true),
    onOpenAccess:   () => setShowAccessModal(true),
    onUpgrade:      () => setShowPremiumModal(true),
    onOpenProfile:  () => setShowProfileModal(true),
    onCoeurSeen:    () => setUnreadCoeurs(0),
    onOpenRituals:   () => setOpenRitualsModal(true),
    onOpenNeedModal: () => setShowNeedModal(true),
    onGoToBibliotheque: () => setOpenModalId('bibliotheque'),
    onGoToJardinotheque: () => setOpenModalId('jardinotheque'),
    isPostRitual:    postRitualSlide,
    openRitualsModal,
    onCloseRituals: () => setOpenRitualsModal(false),
    bilanDoneToday,
    track,
  }), [user, profile, userLevel, isPremium, isFondateurGraine, todayPlant, plantStats, stats, circleMembers, activeCircle, communityStats, lumens, awardLumens, refresh, gardenFlowerCount, defis, myDefis, joinedIds, achats, unreadCoeurs, pendingInvitations, bilanDoneToday, openRitualsModal, postRitualSlide, track])

  // ── Prefetch IA — tous les slides en parallèle dès que l'user est connu ──
  // Les résultats sont mis en cache sessionStorage (clé = userId + slideId + date).
  // Quand SlideInsightsAI monte, il lit le cache → zéro latence perçue.
  useEffect(() => {
    if (!user?.id || !screenProps) return
    if (defisLoading) return           // attendre que les défis soient chargés
    if (prefetchRunRef.current) return // une seule fois par session
    prefetchRunRef.current = true
    const payload = {
      streak:          screenProps.stats?.streak            ?? 0,
      ritualsMonth:    screenProps.stats?.ritualsThisMonth  ?? 0,
      favoriteZone:    screenProps.stats?.favoriteZone      ?? null,
      circleMembers:   screenProps.circleMembers?.length    ?? 0,
      circleName:      screenProps.activeCircle?.name       ?? null,
      defisJoined:     joinedIds?.size ?? myDefis?.length   ?? 0,
      defisDetails:    myDefis?.map(d => `${d.title} (${d.days_validated ?? 0}/${d.duration_days} jours validés)`) ?? [],
      achatCount:      achats?.length ?? 0,
      lumens:          screenProps.lumens?.available ?? 0,
      communityPeople: screenProps.communityStats?.totalParticipants ?? 0,
      gardenCount:     screenProps.gardenFlowerCount        ?? 0,
    }
    // Attendre la fin du prefetch IA + minimum 5s avant de fermer le WelcomeScreen
    Promise.all([
      prefetchAllSlideInsights({ userId: user.id, payload }),
      new Promise(r => setTimeout(r, 5000)),
    ]).then(() => setPrefetchDone(true))
  }, [user?.id, defisLoading])  // se déclenche quand les défis sont prêts, ref empêche le double run


  // Saut direct vers un slide (nav latérale desktop)
  const handleJump = useCallback((idx) => {
    if (idx === slideIdx) return
    const s = visibleSlides[idx]
    if (!s.isBilan) setActive(s.id)
    track('page_view', {}, s.id, 'navigation')
    setSlideIdx(idx)
  }, [slideIdx, track, visibleSlides])

  // ── Navigation clavier : slides (fond) et modal (si ouverte) ──
  useEffect(() => {
    if (isMobile) return
    const onKey = (e) => {
      if (openModalId) {
        const idx  = visibleSlides.findIndex(s => s.id === openModalId)
        if (e.key === 'ArrowRight' && idx < visibleSlides.length - 1) {
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
      const idx  = visibleSlides.findIndex(s => s.id === prev)
      const next = idx + dir
      if (next < 0 || next >= visibleSlides.length) return prev
      const s = visibleSlides[next]
      setSlideIdx(next)
      if (!s.isBilan) setActive(s.id)
      track('page_view', {}, s.id, 'navigation')
      return s.id
    })
  }, [track])

  // ── Overlays communs (desktop + mobile) ──
  // ── Identité utilisateur (utilisée dans commonOverlays et le header) ──
  // Charger le rôle pro
  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('role').eq('id', user.id).single()
      .then(({ data }) => { if (data?.role === 'pro') setIsPro(true) })
      .catch(() => {})
  }, [user?.id])

  const name    = profile?.display_name ?? user?.display_name ?? null
  const email   = user?.email ?? ''
  const initial = (name ?? email).charAt(0).toUpperCase()

  const commonOverlays = (
    <>
      {showOrientationModal && (
        <OrientationModal
          visibleSlides={visibleSlides}
          onNavigate={(id) => {
            const idx = visibleSlides.findIndex(s => s.id === id)
            if (idx >= 0) { setSlideIdx(idx); setActive(id) }
            setShowOrientationModal(false)
          }}
          onBilan={() => { setShowBilanModal(true); setShowOrientationModal(false) }}
          onRituel={() => { setShowNeedModal(true); setShowOrientationModal(false) }}
          onClose={() => setShowOrientationModal(false)}
        />
      )}
      {showNeedModal && (
        <NeedSelectionModal
          onSelectNeed={need => { setShowNeedModal(false); setSelectedNeed(need); ritualCompleteCalledRef.current = false; setShowRitualSuggestion(true) }}
          onClose={() => setShowNeedModal(false)}
          bilanDegradation={bilanDegradation}
          userId={user?.id}
          plantId={todayPlant?.id}
          plantHealth={todayPlant?.health}
          onHealthUpdate={() => reloadPlant()}
          isPremium={isPremium || isFondateurGraine}
          onUpgrade={() => { setShowNeedModal(false); window.openAccessModal?.() }}
          onSeeFlower={() => { setShowNeedModal(false); setPostRitualSlide(true); setOpenModalId('jardin') }}
        />
      )}
      {showRitualSuggestion && selectedNeed && (
    <RitualSuggestionModal
  need={selectedNeed}
  onBack={() => {
  setShowRitualSuggestion(false)
  setShowNeedModal(true)
}}
  onClose={() => { 
    setShowRitualSuggestion(false)
    setSelectedNeed(null) 
  }}
  onCompleteRitual={async (needId, isLiked, delta, mood) => {
  if (ritualCompleteCalledRef.current) return
  ritualCompleteCalledRef.current = true
  track('ritual_need_complete', { needId, liked: isLiked }, 'jardin', 'engagement')
  if (!isLiked || !todayPlant?.id) return
  // Zone principale associée à chaque besoin
  const NEED_TO_ZONE = {
    sleep:       'zone_souffle',
    stress:      'zone_racines',
    emotions:    'zone_fleurs',
    grounding:   'zone_racines',
    thoughts:    'zone_feuilles',
    energy:      'zone_tige',
    selfconnect: 'zone_fleurs',
    softness:    'zone_souffle',
  }
  const snapshot = { ...todayPlant }
  const zoneKey  = NEED_TO_ZONE[needId]
  const newHealth = Math.min(100, (snapshot.health ?? 5) + delta)
  const update    = { health: newHealth }
  if (zoneKey) update[zoneKey] = Math.min(100, (snapshot[zoneKey] ?? 0) + delta)
  const { error } = await supabase.from('plants').update(update).eq('id', snapshot.id)
  if (error) return
  const updatedPlant = { ...snapshot, ...update }
  usePlantStore.getState().setTodayPlant(updatedPlant)
  window.dispatchEvent(new CustomEvent('plantHealthPatched', { detail: { health: newHealth, plantId: snapshot.id } }))
  const snapDetail = { before: snapshot.health ?? 5, after: newHealth, delta, mood: mood ?? null }
  // Pas de dispatch ritualCompleteSnapshot ici : PhaseResult (écran suivant de
  // RitualSuggestionModal) affiche déjà "+delta de vitalité" — le popup global
  // ferait doublon avec ce message. On garde juste la trace pour l'anim "Ma Fleur".
  try { sessionStorage.setItem('mji_post_ritual', JSON.stringify({ ...snapDetail, ts: Date.now() })) } catch {}
  try {
    await supabase.from('network_activity').insert({ user_id: user?.id, action_type: 'ritual_complete' })
    if (snapshot.id) {
      const ZONE_NAMES = { zone_souffle:'Souffle', zone_racines:'Racines', zone_fleurs:'Fleurs', zone_feuilles:'Feuilles', zone_tige:'Tige' }
      await supabase.from('rituals').insert({ user_id: user?.id, plant_id: snapshot.id, name: needId, zone: ZONE_NAMES[zoneKey] ?? 'Racines', health_delta: delta, mood: mood ?? null })
    }
  } catch(e) {}
  window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId: user?.id } }))
}}
  onSeeFlower={() => {
    setShowRitualSuggestion(false)
    setSelectedNeed(null)
    setPostRitualSlide(true)
    setOpenModalId('jardin')
  }}
  plantHealth={todayPlant?.health ?? 5}
  plantId={todayPlant?.id}
/>    
      )}
      {showAccessModal && (<div style={{ position:'fixed', inset:0, zIndex:400 }}><AccessPage onActivateFree={() => setShowAccessModal(false)} onSuccess={() => { setShowAccessModal(false); clearProfileCache(user?.id) }} onBack={() => setShowAccessModal(false)} /></div>)}
      {/* Buffering anticipé pendant le WelcomeScreen */}
      {introVideo && !showVideoIntro && (
        <video ref={preloadVideoRef} src={introVideo.src} preload="auto" muted style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none', top:-9999, left:-9999 }} />
      )}
      {showVideoIntro && introVideo && (
        <VideoIntro
          key={introVideo.src}
          video={introVideo}
          withSound={introSoundUnlocked}
          onDone={() => { videoRetryRef.current = 0; setShowVideoIntro(false) }}
          onError={() => {
            if (videoRetryRef.current < 3) {
              videoRetryRef.current++
              setIntroVideo(pickVideo(user?.id))
            } else {
              videoRetryRef.current = 0
              setShowVideoIntro(false)
            }
          }}
        />
      )}
      {showWelcome && <WelcomeScreen profile={profile} isNewUser={isNewUser} prefetchDone={prefetchDone} onDone={() => {
        // Déverrouille l'audio page pendant le user gesture du bouton
        const pv = preloadVideoRef.current
        if (pv) { pv.muted = false; pv.play().catch(() => {}) }
        setIntroSoundUnlocked(true)
        setShowWelcome(false)
        // introVideo est défini seulement si la vidéo n'a pas encore été vue aujourd'hui (et ambiance ≠ zen)
        if (introVideo && ambiance !== 'zen') setShowVideoIntro(true)
      }} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showBilanModal && (
        <DailyQuizModal
          onComplete={async deg => {
            const today = new Date().toISOString().split('T')[0]
            const { error } = await supabase.from('daily_quiz').upsert({ user_id: user.id, date: today, degradation: deg }, { onConflict: 'user_id,date' })
            if (error) { console.error('[bilan] upsert failed:', error.message); return }
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
          onSoinDeMoi={async deg => {
            const today = new Date().toISOString().split('T')[0]
            const { error } = await supabase.from('daily_quiz').upsert({ user_id: user.id, date: today, degradation: deg }, { onConflict: 'user_id,date' })
            if (error) { console.error('[bilan] upsert failed:', error.message); return }
            setBilanDoneToday(true)
            setBilanDegradation(deg)
            track('bilan_complete', { degradation: deg }, 'jardin', 'engagement')
            logActivity({ userId: user?.id, action: 'bilan' })
            window.dispatchEvent(new CustomEvent('bilanComplete', { detail: deg }))
            setShowBilanModal(false)
            setShowNeedModal(true)
          }}
          onDismiss={() => setShowBilanModal(false)}
          onSkip={() => { setShowBilanModal(false); track('bilan_skip', {}, 'jardin', 'engagement') }}
        />
      )}
      {showLumensModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)' }} onClick={() => setShowLumensModal(false)} />
          <div style={{ position:'relative', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:460, border:'1px solid rgba(200,160,150,.25)', boxShadow:'0 24px 60px rgba(180,120,100,.2)' }}>
            <button onClick={() => setShowLumensModal(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,150,.3)', borderRadius:'50%', width:28, height:28, padding:0, cursor:'pointer', color:'rgba(30,20,8,.5)', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
            <LumensCard lumens={lumens} userId={user?.id} awardLumens={awardLumens} onRefresh={refresh} />
          </div>
        </div>
      )}
      {showPremiumModal && <PremiumModal onSuccess={() => { setShowPremiumModal(false); clearProfileCache(user?.id) }} onClose={() => setShowPremiumModal(false)} />}
      {showPremiumTeaser && (
        <PremiumTeaserModal
          onDiscover={() => { setShowPremiumTeaser(false); setShowPremiumModal(true); track('premium_teaser_cta', {}, active, 'monetization') }}
          onClose={() => { setShowPremiumTeaser(false); track('premium_teaser_dismiss', {}, active, 'monetization') }}
        />
      )}
      {ritualCelebration && (
        <RitualCelebrationModal
          before={ritualCelebration.before}
          after={ritualCelebration.after}
          delta={ritualCelebration.delta}
          gardenSettings={gardenSettings}
          onClose={() => setRitualCelebration(null)}
        />
      )}
      {showTrialInfoModal && <TrialInfoModal daysLeft={trialDaysLeft} trialActive={isTrialActive} onActivate={async () => { await activateTrialNow(); setShowTrialInfoModal(false) }} onClose={() => setShowTrialInfoModal(false)} onUpgrade={() => { setShowTrialInfoModal(false); setShowPremiumModal(true) }} />}
      {showAvisModal && <AppAvisModal userId={user?.id} displayName={profile?.display_name ?? ''} onClose={() => setShowAvisModal(false)} />}
      {showLevelInfo && (() => {
        const LEVELS = [
          { lvl:1, label:'Niveau 1', range:'0 – 100',  color:'rgba(30,20,8,.45)',  bg:'rgba(30,20,8,.06)',  border:'rgba(30,20,8,.14)',  activeBg:'rgba(30,20,8,.08)' },
          { lvl:2, label:'Niveau 2', range:'101 – 200', color:'#4a8820',            bg:'rgba(90,154,40,.06)',border:'rgba(90,154,40,.20)', activeBg:'rgba(90,154,40,.10)' },
          { lvl:3, label:'Niveau 3', range:'201 – 300', color:'#a06030',            bg:'rgba(200,137,74,.06)',border:'rgba(200,137,74,.20)',activeBg:'rgba(200,137,74,.10)' },
        ]
        const planKey = isPremium ? 'premium' : 'free'
        const active  = LEVELS.find(l => l.lvl === levelInfoTab) ?? LEVELS[0]
        const perks   = levelInfoPerks?.[planKey]?.[levelInfoTab]
        return (
          <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setShowLevelInfo(false)}>
            <div style={{ background:'#faf8f4', borderRadius:22, padding:'24px', width:'min(380px,100%)', boxShadow:'0 20px 60px rgba(30,20,8,.22)', border:'1px solid rgba(200,160,150,.25)', position:'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLevelInfo(false)} style={{ position:'absolute', top:12, right:12, background:'rgba(200,160,150,.15)', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', fontSize:12, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#000', marginBottom:4 }}>Les niveaux du Jardin</div>
              <div style={{ fontSize:11, color:'#000', fontFamily:"'Jost',sans-serif", marginBottom:18, lineHeight:1.5 }}>
                <strong>{userActionCount ?? '…'} action{userActionCount > 1 ? 's' : ''} cumulée{userActionCount > 1 ? 's' : ''}</strong> — Rituels, bouquets, mercis, bilans et défis font progresser votre niveau.
              </div>

              {/* 3 niveaux en ligne */}
              <div style={{ display:'flex', gap:8, marginBottom:18 }}>
                {LEVELS.map(({ lvl: l, label, range, color, bg, border, activeBg }) => {
                  const isCurrent = l === userLevel
                  const isSelected = l === levelInfoTab
                  return (
                    <div key={l} onClick={() => setLevelInfoTab(l)}
                      style={{ flex:1, padding:'10px 8px', borderRadius:14, textAlign:'center', cursor:'pointer', border:`1.5px solid ${isSelected ? color : 'rgba(200,160,150,.2)'}`, background: isSelected ? activeBg : 'rgba(255,255,255,.5)', transition:'all .18s' }}>
                      <div style={{ fontSize:11, fontWeight:700, color: isSelected ? color : '#000', fontFamily:"'Jost',sans-serif", letterSpacing:'.05em', marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:9, color:'#000', fontFamily:"'Jost',sans-serif" }}>{range}</div>
                    </div>
                  )
                })}
              </div>

              {/* Avantages du niveau sélectionné */}
              <div style={{ minHeight:90, padding:'14px 16px', borderRadius:14, background: active.activeBg, border:`1px solid ${active.border}` }}>
                {!levelInfoPerks ? (
                  <div style={{ fontSize:11, color:'rgba(30,20,8,.35)', fontFamily:"'Jost',sans-serif", fontStyle:'italic' }}>Chargement…</div>
                ) : perks?.perks?.length ? (
                  <>
                    {perks.title && <div style={{ fontSize:13, fontWeight:600, color: active.color, fontFamily:"'Cormorant Garamond',serif", marginBottom:10 }}>{perks.title}</div>}
                    <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
                      {perks.perks.map((p, i) => (
                        <li key={i} style={{ display:'flex', gap:8, fontSize:12, color:'#000', fontFamily:"'Jost',sans-serif", alignItems:'flex-start' }}>
                          <span style={{ color: active.color, flexShrink:0 }}>✦</span>{p}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:'#000', fontFamily:"'Jost',sans-serif", fontStyle:'italic', lineHeight:1.6 }}>Profitez d'une application riche de découvertes et d'apprentissages autour du mieux-être.</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
      {showProfileModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)' }} onClick={() => setShowProfileModal(false)} />
          <div style={{ position:'relative', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderRadius:24, width:'100%', maxWidth:420, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1px solid rgba(200,160,150,.25)', boxShadow:'0 24px 60px rgba(180,120,100,.2)', overflow:'hidden' }}>
            {/* Header fixe avec ✕ — toujours visible */}
            <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 14px 0', background:'linear-gradient(170deg,#f4ece6,#ede5de)' }}>
              <button onClick={() => { setShowProfileModal(false); setProfileView('main') }} style={{ background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,150,.3)', borderRadius:'50%', width:28, height:28, padding:0, cursor:'pointer', color:'rgba(30,20,8,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, lineHeight:1 }}>✕</button>
            </div>
            {/* Zone scrollable */}
            <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'4px 24px 24px' }}>
            {profileView === 'main' ? (<>
            {/* Titre */}
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, color:'#1a1208', marginBottom:20 }}>Mon profil</div>

            {/* Avatar + identité */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, padding:'14px 16px', background:'rgba(255,255,255,.60)', borderRadius:14, border:'1px solid rgba(200,160,150,.18)' }}>
              <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#c8a0b0,#a07888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:600, color:'#fff', flexShrink:0 }}>{initial}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>{name ?? 'Jardinier·ère'}</div>
                <div style={{ fontSize:11, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif" }}>{email}</div>
              </div>
              {/* Badge niveau + barre */}
              {(() => {
                const lvl = userLevel
                const isMax = lvl >= 3
                const cfg = lvl === 3
                  ? { label:'NIVEAU 3', bg:'rgba(200,137,74,0.14)', border:'rgba(200,137,74,0.38)', color:'#a06030' }
                  : lvl === 2
                  ? { label:'NIVEAU 2', bg:'rgba(90,154,40,0.12)', border:'rgba(90,154,40,0.35)', color:'#4a8820' }
                  : { label:'NIVEAU 1', bg:'rgba(30,20,8,0.06)', border:'rgba(30,20,8,0.14)', color:'rgba(30,20,8,0.40)' }
                const base = (lvl - 1) * 100
                const pct = userActionCount !== null ? Math.min(100, Math.max(2, Math.round(((userActionCount - base) / 100) * 100))) : 0
                const remaining = userActionCount !== null ? (lvl * 100) - userActionCount : null
                return (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:7, flexShrink:0 }}>
                    <span style={{ fontSize:15, padding:'6px 16px', borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, fontFamily:"'Jost',sans-serif", fontWeight:700, letterSpacing:'.10em' }}>{cfg.label}</span>
                    {!isMax && (
                      <div style={{ width:120 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:10, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(30,20,8,.40)' }}>Niv. {lvl}</span>
                          <span style={{ fontSize:10, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(90,154,40,.70)' }}>Niv. {lvl+1}</span>
                        </div>
                        <div style={{ height:7, borderRadius:4, background:'rgba(90,154,40,0.12)', overflow:'hidden', marginBottom:5 }}>
                          <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:'linear-gradient(90deg,#78c040,#4a8820)', transition:'width .6s ease' }} />
                        </div>
                        <button onClick={() => setShowLevelInfo(true)} style={{ width:'100%', padding:'3px 8px', background:'rgba(140,100,200,0.15)', border:'1px solid rgba(140,100,200,0.35)', borderRadius:20, fontSize:10, color:'rgba(120,80,180,0.9)', fontFamily:"'Jost',sans-serif", cursor:'pointer', fontWeight:600, letterSpacing:'.04em' }}>
                          En savoir +
                        </button>
                      </div>
                    )}
                    {isMax && <div style={{ fontSize:11, color:'#a06030', fontFamily:"'Jost',sans-serif", letterSpacing:'.06em' }}>Maximum ✦</div>}
                  </div>
                )
              })()}
            </div>

            {/* Abonnement — masqué pour les pros sauf admin (géré dans Compte Pro) */}
            {(!isPro || isAdmin) && <div style={{ padding:'12px 16px', background: isPremium ? 'rgba(122,170,80,.08)' : 'rgba(0,0,0,.04)', borderRadius:12, border: isPremium ? '1px solid rgba(122,170,80,.25)' : '1px solid rgba(0,0,0,.08)', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color: isPremium ? '#5a9a28' : 'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>Abonnement</div>
                <div style={{ fontSize:15, fontWeight:500, color: isPremium ? '#3a7a18' : 'rgba(30,20,8,.80)', fontFamily:"'Jost',sans-serif" }}>
                  {isTrialActive && !isPaidPremium ? `🎁 Essai offert · ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''}` : isPremium ? 'Premium actif' : 'Version gratuite'}
                </div>
              </div>
              {isPaidPremium && (
                <button onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('stripe-portal', { body: { returnUrl: window.location.origin } })
                    if (error || !data?.url) throw new Error()
                    window.location.href = data.url
                  } catch { alert("Impossible d'accéder au portail. Veuillez réessayer.") }
                }} style={{ marginTop:10, width:'100%', padding:'10px', borderRadius:20, border:'1px solid rgba(90,154,40,.35)', background:'rgba(90,154,40,.08)', color:'#5a9a28', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer' }}>
                  Gérer mon abonnement
                </button>
              )}
              {!isPremium && (
                <div onClick={() => { setShowProfileModal(false); setShowPremiumModal(true) }} style={{ padding:'5px 14px', borderRadius:100, background:'linear-gradient(135deg,#78c040,#4a8820)', color:'#fff', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
                  Passer Premium
                </div>
              )}
            </div>}

            {/* Bouton essai offert — visible si éligible (quiz fait) et pas encore vu */}
            {quizCompleted && !trialCardSeen && (
              <div onClick={() => { localStorage.setItem(`trial_card_seen_${user?.id}`, '1'); setTrialCardSeen(true); setShowProfileModal(false); setShowTrialInfoModal(true) }} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'13px 15px', borderRadius:14, marginBottom:16, cursor:'pointer',
                background:'linear-gradient(135deg,rgba(210,168,60,.16),rgba(185,145,45,.10))',
                border:'1px solid rgba(200,158,55,.42)',
              }}>
                <div style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background:'linear-gradient(135deg,#c8a040,#a07820)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                }}>🎁</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#7a5c10', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>
                    Votre mois Premium offert
                  </div>
                  <div style={{ fontSize:11, fontWeight:300, color:'rgba(130,95,18,.68)', fontFamily:"'Jost',sans-serif", lineHeight:1.5 }}>
                    {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} d'accès complet · sans carte bancaire
                  </div>
                </div>
                <span style={{ fontSize:16, color:'rgba(130,95,18,.40)' }}>›</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
              {(isFondateurGraine || fondateurData) && (
                <div onClick={() => { setShowProfileModal(false); setShowVipModal(true) }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'linear-gradient(135deg,rgba(74,124,69,.10),rgba(45,95,63,.07))', borderRadius:12, border:'1px solid rgba(74,124,69,.30)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(74,124,69,.18)'} onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(74,124,69,.10),rgba(45,95,63,.07))'}>
                  <span style={{ fontSize:16 }}>🌸</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#2D5F3F', fontFamily:"'Jost',sans-serif" }}>Mon compte VIP</div>
                    <div style={{ fontSize:10, color:'rgba(45,95,63,.55)', fontFamily:"'Jost',sans-serif" }}>Cercle des Fondateurs · avantages actifs</div>
                  </div>
                </div>
              )}
              {ADMIN_IDS.includes(user?.id) && (
                <div onClick={() => { setShowProfileModal(false); window.location.hash = 'admin' }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(210,80,80,.07)', borderRadius:12, border:'1px solid rgba(210,80,80,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(210,80,80,.13)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(210,80,80,.07)'}>
                  <span style={{ fontSize:16 }}>🛡️</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'rgba(180,60,60,.90)', fontFamily:"'Jost',sans-serif" }}>Interface admin</div>
                    <div style={{ fontSize:10, color:'rgba(180,60,60,.50)', fontFamily:"'Jost',sans-serif" }}>Accès réservé</div>
                  </div>
                </div>
              )}
              <div onClick={() => startTransition(() => setProfileView('settings'))} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,.55)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.55)'}>
                <span style={{ fontSize:16 }}>⚙️</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif" }}>Paramètres du compte</div>
                  <div style={{ fontSize:10, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif" }}>Nom, notifications, confidentialité</div>
                </div>
              </div>
              <div onClick={() => { setShowProfileModal(false); setShowRituelCalendrier(true) }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(125,155,134,.08)', borderRadius:12, border:'1px solid rgba(125,155,134,.25)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(125,155,134,.16)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(125,155,134,.08)'}>
                <span style={{ fontSize:16 }}>📅</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#5e7e69', fontFamily:"'Jost',sans-serif" }}>Programmer mon rappel quotidien</div>
                  <div style={{ fontSize:10, color:'rgba(94,126,105,.55)', fontFamily:"'Jost',sans-serif" }}>Ajouter au calendrier</div>
                </div>
              </div>
              <div onClick={() => { setShowProfileModal(false); setShowAvisModal(true) }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,.55)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.55)'}>
                <span style={{ fontSize:16 }}>⭐</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif" }}>Laisser votre avis</div>
                  <div style={{ fontSize:10, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif" }}>Votre avis sur l'application</div>
                </div>
              </div>
              <div onClick={() => { setShowProfileModal(false); setOpenModalId('cercle') }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(138,106,154,.06)', borderRadius:12, border:'1px solid rgba(138,106,154,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(138,106,154,.14)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(138,106,154,.06)'}>
                <span style={{ fontSize:16 }}>🌸</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#6a4a7a', fontFamily:"'Jost',sans-serif" }}>Le Cercle des Fondateurs</div>
                  <div style={{ fontSize:10, color:'rgba(106,74,122,.48)', fontFamily:"'Jost',sans-serif" }}>Ceux qui nous portent</div>
                </div>
              </div>
              {isPro && (
                <div onClick={() => { setShowProfileModal(false); setShowProProfileModal(true) }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'linear-gradient(135deg,rgba(122,64,16,.08),rgba(90,46,8,.05))', borderRadius:12, border:'1px solid rgba(122,64,16,.25)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(122,64,16,.14)'} onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(122,64,16,.08),rgba(90,46,8,.05))'}>
                  <span style={{ fontSize:16 }}>✦</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#7a4010', fontFamily:"'Jost',sans-serif" }}>Compte Pro</div>
                    <div style={{ fontSize:10, color:'rgba(122,64,16,.55)', fontFamily:"'Jost',sans-serif" }}>Ateliers, outils, identifiant partenaire</div>
                  </div>
                </div>
              )}
              {!isPro && (
                <div onClick={() => { setShowProfileModal(false); setShowUpgradeToProModal(true) }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,.45)', borderRadius:12, border:'1px solid rgba(200,190,180,.22)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.75)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.45)'}>
                  <span style={{ fontSize:15, opacity:.6 }}>🌿</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'rgba(30,20,8,.65)', fontFamily:"'Jost',sans-serif" }}>Espace professionnel</div>
                    <div style={{ fontSize:10, color:'rgba(30,20,8,.35)', fontFamily:"'Jost',sans-serif" }}>Ateliers, outils, partenariats</div>
                  </div>
                </div>
              )}
              <div onClick={() => { setShowProfileModal(false); setProfileView('main'); signOut() }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,.55)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.55)'}>
                <span style={{ fontSize:16 }}>🚪</span>
                <div><div style={{ fontSize:12, fontWeight:500, color:'rgba(30,20,8,.65)', fontFamily:"'Jost',sans-serif" }}>Se déconnecter</div></div>
              </div>
            </div>
            </>) : (
              <SettingsPanel
                name={name}
                email={email}
                isPremium={isPremium}
                isTrial={isTrialActive && !isPaidPremium}
                trialDaysLeft={trialDaysLeft}
                isPro={isPro}
                isAdmin={isAdmin}
                userId={user?.id}
                onBack={() => setProfileView('main')}
                onOpenFleur={() => { setShowProfileModal(false); setProfileView('main'); setOpenModalId('jardin') }}
                onUpgrade={() => { setShowProfileModal(false); setProfileView('main'); setShowPremiumModal(true) }}
                onTrialInfo={() => { localStorage.setItem(`trial_card_seen_${user?.id}`, '1'); setTrialCardSeen(true); setShowProfileModal(false); setShowTrialInfoModal(true) }}
                trialCardSeen={trialCardSeen}
                onNameSaved={() => clearProfileCache(user?.id)}
              />
            )}
          </div>
        </div>
      </div>
      )}
      {showProProfileModal && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.45)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ width:'100%', maxWidth:880, maxHeight:'92vh', overflowY:'auto', borderRadius:24, background:'linear-gradient(160deg,#f5f0e8,#dde8d0)', boxShadow:'0 16px 60px rgba(30,60,10,.22)', border:'1.5px solid rgba(180,210,140,.35)' }}>
            <ProProfile onBack={() => setShowProProfileModal(false)} />
          </div>
        </div>
      )}
      {showRituelCalendrier && (
        <RituelMieuxEtre onClose={() => setShowRituelCalendrier(false)} />
      )}
      {showVipModal && (
        <CompteVipModal
          fondateur={fondateurData}
          isFondateurGraine={isFondateurGraine}
          onClose={() => setShowVipModal(false)}
        />
      )}
      {showUpgradeToProModal && (
        <UpgradeToProModal
          user={user}
          onClose={() => setShowUpgradeToProModal(false)}
          onSuccess={() => {
            setShowUpgradeToProModal(false)
            setIsPro(true)
            setShowProProfileModal(true)
          }}
        />
      )}
      {showProLaunch && !showWelcome && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,20,5,.65)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'authFadeIn .3s ease both' }}>
          <style>{`@keyframes authFadeIn{from{opacity:0}to{opacity:1}}`}</style>
          <div style={{ background:'rgba(252,248,242,.98)', borderRadius:24, width:'min(480px,100%)', maxHeight:'90vh', overflowY:'auto', padding:'40px 32px 36px', position:'relative', boxShadow:'0 24px 70px rgba(30,60,10,.28)', border:'1.5px solid rgba(180,210,140,.40)' }}>
            <div style={{ textAlign:'center', fontSize:52, marginBottom:16 }}>🌱</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:400, color:'#1a1208', textAlign:'center', lineHeight:1.2, marginBottom:20 }}>
              Bienvenue dans l'aventure !<br/>
              <em style={{ fontStyle:'italic', color:'#5a8a30' }}>cher(e) thérapeute</em> 🎉
            </div>
            <div style={{ width:48, height:2, background:'linear-gradient(90deg,transparent,#8ab840,transparent)', margin:'0 auto 24px' }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:28 }}>
              <p style={{ fontSize:17, color:'#1a1208', lineHeight:1.8, margin:0 }}>
                Votre inscription est complète — vous êtes prêt(e) à entrer dans l'expérience <strong>Mon Jardin Intérieur</strong>.
              </p>
              <p style={{ fontSize:17, color:'#1a1208', lineHeight:1.8, margin:0 }}>
                Avant tout, nous vous invitons à <strong>vivre le même parcours initiatique que vos futurs clients</strong>. C'est en le traversant vous-même que vous pourrez en parler avec authenticité et guider vos accompagnés avec justesse.
              </p>
              <div style={{ padding:'16px 18px', borderRadius:14, background:'rgba(90,138,48,.07)', border:'1px solid rgba(90,138,48,.22)' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#5a8a30', marginBottom:8, letterSpacing:'.04em', textTransform:'uppercase' }}>✦ Votre espace Pro vous attend</div>
                <p style={{ fontSize:17, color:'#1a1208', lineHeight:1.75, margin:0 }}>
                  À l'issue de votre première étape, un bouton <strong>« Mon compte Pro »</strong> apparaîtra dans votre profil. Vous y trouverez votre tableau de bord, la possibilité de créer des <strong>ateliers</strong>, des <strong>séances en ligne</strong>, et de mettre en vente vos <strong>audios, e-books</strong> et autres contenus.
                </p>
              </div>
              <p style={{ fontSize:17, color:'#1a1208', lineHeight:1.8, margin:0, fontStyle:'italic', textAlign:'center' }}>
                À très bientôt, et belle continuation dans cette magnifique aventure 🌿
              </p>
            </div>
            <button
              onClick={() => { localStorage.removeItem('mji_show_pro_launch'); setShowProLaunch(false) }}
              style={{ width:'100%', padding:'16px 24px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:18, fontWeight:600, color:'#fff', background:'linear-gradient(135deg,#78c040,#4a8820)', boxShadow:'0 8px 24px rgba(90,138,48,.35)', letterSpacing:'.03em' }}
            >
              Commencer l'aventure
            </button>
            <div style={{ marginTop:14, fontSize:14, color:'rgba(30,20,8,.38)', textAlign:'center' }}>
              Votre compte Pro est actif · Profil modifiable dans vos paramètres
            </div>
          </div>
        </div>
      )}

      {openModalId && (
        <ScreenModal
          slideId={openModalId}
          slides={openModalId === 'cercle' ? SLIDES_CONFIG : visibleSlides}
          screenProps={screenProps}
          bilanDoneToday={bilanDoneToday}
          bilanHistory={bilanHistory}
          onBilan={() => setShowBilanModal(true)}
          onClose={() => { setOpenModalId(null); setPostRitualSlide(false) }}
          onNav={handleModalNav}
          onOpenSlide={(id) => setOpenModalId(id)}
        />
      )}


    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDU DESKTOP — carte preview centrée sur fond nature
  // ─────────────────────────────────────────────────────────────────────────
  if (!isMobile) {
    const slide  = visibleSlides[slideIdx]
    const isLast = slideIdx === visibleSlides.length - 1

    return (
      <>
        {commonOverlays}
        <style>{ONB_STYLES + `
          @keyframes dkIllusIn   { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
          @keyframes dkSlideIn   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes dkThumbIn   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
          @keyframes arrowBlink  { 0%,100%{transform:scale(1);box-shadow:0 4px 16px rgba(0,0,0,0.28),0 0 0 0 rgba(40,160,80,0.6)} 50%{transform:scale(1.10);box-shadow:0 6px 22px rgba(0,0,0,0.22),0 0 0 9px rgba(40,160,80,0)} }
          .nav-arrow { transition: transform .15s; }
          .nav-arrow:hover { transform:scale(1.1) !important; opacity:1 !important; }
          @keyframes ctaGlow { 0%,100%{filter:brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))} 50%{filter:brightness(1.18) drop-shadow(0 0 12px rgba(255,255,255,0.6))} }
          .cta-btn { animation: ctaGlow 2.4s ease-in-out infinite; }
          .cta-btn:hover { transform:translateY(-3px) scale(1.03) !important; filter:brightness(1.22) !important; }
          .cta-btn:active { transform:scale(0.97) !important; }
          @keyframes guidePulse { 0%,100%{box-shadow:0 0 0 0 rgba(80,200,80,.6),0 4px 16px rgba(60,160,60,.4)} 50%{box-shadow:0 0 0 8px rgba(80,200,80,0),0 4px 20px rgba(60,160,60,.6)} }
          .guide-btn { animation: guidePulse 2s ease-in-out infinite; }
          @keyframes pmPulse { 0%,100%{box-shadow:0 4px 16px rgba(0,0,0,.20),0 0 0 0 rgba(90,154,40,.55)} 50%{box-shadow:0 4px 16px rgba(0,0,0,.20),0 0 0 9px rgba(90,154,40,0)} }
          .pm-slide-btn { animation: pmPulse 2s ease-in-out infinite; transition: transform .15s; }
          .pm-slide-btn:hover { transform:translateY(-1px) scale(1.03); }
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
              width:'min(960px, 97vw)', height:'min(96vh, 960px)',
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
                  <div onClick={() => setShowProfileModal(true)} style={{ padding:'3px 12px', borderRadius:100, background:'rgba(200,160,150,.12)', border:'1px solid rgba(200,160,150,.28)', fontSize:10.5, fontWeight:500, color:'rgba(30,20,8,.65)', cursor:'pointer', transition:'background .12s', fontFamily:"'Jost',sans-serif", display:'flex', alignItems:'center', gap:5 }} onMouseEnter={e=>e.currentTarget.style.background='rgba(200,160,150,.22)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(200,160,150,.12)'}>
                    <span style={{ width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#c8a0b0,#a07888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600, color:'#fff', flexShrink:0 }}>{initial}</span>
                    Mon profil
                  </div>
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
              <div style={{ flexShrink:0, height: 460, position:'relative', overflow:'hidden' }}>
                <img key={`illus-${slideIdx}`} src={slideImage(slide, ambiance)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block', animation:'dkIllusIn .42s cubic-bezier(.4,0,.2,1) both' }}/>
                {ambiance !== 'zen' && (
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(250,245,242,0) 70%, rgba(250,245,242,1) 100%)' }}/>
                )}

                {/* Progress dots */}
                <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:4, alignItems:'center' }}>
                  {visibleSlides.map((s, i) => (
                    <div key={s.id} onClick={() => handleJump(i)} style={{ width: i === slideIdx ? 14 : 5, height:5, borderRadius:3, background: i <= slideIdx ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.32)', cursor:'pointer', transition:'all .3s' }}/>
                  ))}
                </div>

                {/* ── Flèches navigation ── */}
                {slideIdx > 0 && (
                  <button onClick={() => handleNav(-1)} className="nav-arrow" style={{ position:'absolute', bottom:20, left:20, width:62, height:62, borderRadius:'50%', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', border:'1.5px solid rgba(255,255,255,0.40)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.15)', animation:'arrowBlink 1.8s ease-in-out infinite' }}>
                    <svg width="50" height="50" viewBox="0 0 20 20" fill="none"><path d="M12 2L5 10L12 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 2L10 10L17 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
                {!isLast && (
                  <button onClick={() => handleNav(1)} className="nav-arrow" style={{ position:'absolute', bottom:20, right:20, width:62, height:62, borderRadius:'50%', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', border:'1.5px solid rgba(255,255,255,0.40)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.15)', animation:'arrowBlink 1.8s ease-in-out infinite .3s' }}>
                    <svg width="50" height="50" viewBox="0 0 20 20" fill="none"><path d="M8 2L15 10L8 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 2L10 10L3 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}

                {/* ── Bouton Passer Premium — comptes free uniquement ── */}
                {!isPremium && (
                  <button
                    onClick={() => { track('premium_button_slide', {}, slide.id, 'monetization'); setShowPremiumModal(true) }}
                    className="pm-slide-btn"
                    style={{ position:'absolute', bottom:92, right:20, padding:'10px 18px', borderRadius:100, border:'1px solid rgba(255,255,255,0.35)', background:'linear-gradient(135deg,#78c040,#4a8820)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600, letterSpacing:'.02em', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}
                  >✨ Passer Premium</button>
                )}

              </div>

              {/* ── Historique bilan 7 jours — juste sous l'image ── */}
              {slide.isBilan && (
                <div style={{ flexShrink:0, background:'linear-gradient(135deg,rgba(255,255,255,0.72),rgba(252,240,218,0.60))', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(160,100,30,0.10)', padding:'12px 24px 10px', boxShadow:'0 2px 10px rgba(160,100,30,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(160,100,30,0.15))' }}/>
                    <span style={{ fontSize:9, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(160,100,30,0.55)', letterSpacing:'.14em', textTransform:'uppercase' }}>Mon humeur · 15 jours</span>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(160,100,30,0.15),transparent)' }}/>
                  </div>
                  <BilanHistory7Days history={bilanHistory ?? []} maxDays={15} />
                </div>
              )}

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
                <div style={{ fontSize:15, fontWeight:300, color:'#1a1208', lineHeight:1.7, marginBottom:16 }}>
                  {slide.subtitle}
                </div>

                {/* Analyse IA */}
                <div style={{ flex:1, overflow:'auto' }}>
                  <SlideInsightsAI slideId={slide.id} screenProps={screenProps} color={slide.color} />
                </div>

              </div>

              {/* ── Bouton CTA centré ── */}
              <div style={{ flexShrink:0, textAlign:'center', padding:'10px 24px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <button
                  className="cta-btn"
                  onClick={() => {
                    if (slide.isBilan) { setShowBilanModal(true) }
                    else if (slide.id === 'jardin') { setShowNeedModal(true) }
                    else { setOpenModalId(slide.id) }
                  }}
                  style={{ padding:'18px 52px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:19, fontWeight:700, color:'#1a1208', letterSpacing:'.05em', background:slide.btnGrad, boxShadow:`0 10px 30px ${slide.btnShadow}`, whiteSpace:'nowrap', transition:'transform .18s ease, box-shadow .18s ease' }}
                >
                  {slide.isBilan && bilanDoneToday ? 'Refaire mon bilan ›' : slide.btnLabel}
                </button>

                {slide.id === 'jardin' && (
                  <button
                    onClick={() => setOpenModalId('jardin')}
                    style={{ padding:'10px 28px', borderRadius:100, border:'1px solid rgba(200,160,150,.3)', background:'rgba(255,255,255,.55)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:500, color:'rgba(30,20,8,.65)', letterSpacing:'.02em', transition:'background .15s, transform .15s', backdropFilter:'blur(4px)' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.85)'; e.currentTarget.style.transform='translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.55)'; e.currentTarget.style.transform='none' }}
                  >🌸 Voir ma fleur</button>
                )}
              </div>

              {/* Bouton ? bas-droite desktop */}
              <button
                onClick={() => setShowGuide(true)}
                title="Guide & Repérage"
                className="guide-btn"
                style={{ position:'absolute', bottom:20, right:20, width:52, height:52, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#4cd964,#28a745)', cursor:'pointer', fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}
                onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.15)'}
                onMouseLeave={e=>e.currentTarget.style.filter='none'}
              >?</button>

              {/* Guide panel desktop — à l'intérieur de la carte */}
              {showGuide && (
                <GuidePanel
                  slides={visibleSlides}
                  curIdx={slideIdx}
                  onNavigate={handleJump}
                  onClose={() => setShowGuide(false)}
                  onRitual={() => setShowNeedModal(true)}
                  onBilan={() => setShowBilanModal(true)}
                  bilanDoneToday={bilanDoneToday}
                  stats={plantStats}
                  joinedIds={joinedIds}
                  achats={achats}
                />
              )}

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
        slides={visibleSlides}
        curIdx={slideIdx}
        onNav={handleNav}
        onOpenModal={(id) => {
          if (visibleSlides.find(s => s.id === id)?.isBilan) setShowBilanModal(true)
          else setOpenModalId(id)
        }}
        bilanDoneToday={bilanDoneToday}
        bilanHistory={bilanHistory}
        screenProps={screenProps}
        initial={initial}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenNeedModal={() => setShowNeedModal(true)}
        onHelp={() => setShowHelp(true)}
        onSignOut={signOut}
        onGuide={() => setShowGuide(true)}
        showGuide={showGuide}
        guideProps={{ slides: visibleSlides, curIdx: slideIdx, onNavigate: handleJump, onClose: () => setShowGuide(false), onRitual: () => setShowNeedModal(true), onBilan: () => setShowBilanModal(true), bilanDoneToday, stats: plantStats, joinedIds, achats }}
      />
    </>
  )
}
