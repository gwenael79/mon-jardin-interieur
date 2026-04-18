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
import { usePlantStore } from '../store/plant.store'
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
import { ScreenMonJardin, DailyQuizModal, BoiteAGraines } from './ScreenMonJardin'
import { WelcomeScreen }             from './WelcomeScreen'
import { ScreenJardinCollectif, ScreenDefis } from './ScreenDefis'
import { ScreenClubJardiniers }      from './ScreenClubJardiniers'
import { ScreenAteliers }            from './ScreenAteliers'
import { MaBibliotheque, useAchats } from './MaBibliotheque'
import { ScreenJardinotheque }       from './ScreenJardinotheque'
import { HelpModal }                 from './HelpModal'
import AccessPage, { PremiumModal }  from './AccessPage'
import { ONB_STYLES, NatureBg }      from './OnboardingScreen'
import { useSlideInsight, prefetchAllSlideInsights } from '../hooks/useSlideInsight'
import NeedSelectionModal   from '../components/NeedSelectionModal'
import RitualSuggestionModal from '../components/RitualSuggestionModal'
// Verrou anti-double award (React Strict Mode)
const _dailyLoginAwarded = new Set()


// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DES SLIDES
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES_CONFIG = [
  {
    id:        'bilan',     illusKey: 'bilan',
    badge:     'Chaque matin',      icon: '🌅',
    title:     'Comment te sens-tu aujourd\'hui ?',
    subtitle:  'Ton bilan quotidien en 2 minutes — humeur, énergie, intention.',
    guideDesc: 'Ton bilan en 2 minutes',
    color:     '#c87878',
    btnLabel:  'Commencer le bilan',
    btnGrad:   'linear-gradient(135deg, #c87878, #a05858)',
    btnShadow: 'rgba(180,80,80,.38)',
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
function ScreenBoiteAGraine({ userId }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'8px 4px 16px' }}>
      <BoiteAGraines userId={userId} inline />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAGE HORAIRE — détermine quel slide est affiché en premier
//  matin   00:00–11:59 → bilan
//  après-m 12:00–17:59 → ma fleur
//  soir    18:00–23:59 → boite à graines
// ─────────────────────────────────────────────────────────────────────────────
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
function SlideInsightsAI({ slideId, screenProps, color }) {
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
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT MOBILE — slides preview plein écran, swipeable
// ─────────────────────────────────────────────────────────────────────────────
function MobileSlideFlow({ slides, curIdx, onNav, onOpenModal, onOpenNeedModal, bilanDoneToday, bilanHistory, screenProps, initial, onOpenProfile, onHelp, onSignOut, onGuide, showGuide, guideProps }) {
  const slide  = slides[curIdx]
  const isLast = curIdx === slides.length - 1
  const swipe  = useSwipe(() => onNav(1), () => onNav(-1))

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
      `}</style>
      {/* ── Bandeau titre mobile ── */}
      <div style={{ flexShrink:0, height:48, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', background:'rgba(200,230,200,.35)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(96,160,100,.2)', zIndex:20 }}>
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
      <div style={{ position:'absolute', top:48, left:14, right:14, display:'flex', gap:4, zIndex:20 }}>
        {slides.map((s, i) => (
          <div key={s.id} style={{ flex:1, height:2.5, background:'rgba(160,100,90,.18)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:s.color, width: i < curIdx ? '100%' : i === curIdx ? '60%' : '0%', transition: i === curIdx ? 'none' : 'width .3s' }}/>
          </div>
        ))}
      </div>

      {/* ── Illustration — zone de swipe horizontal ── */}
      <div style={{ flexShrink:0, height:200, position:'relative', overflow:'hidden', touchAction:'pan-y' }} {...swipe}>
        <img src={slide.image ?? '/champs.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(248,240,236,0) 70%, rgba(237,229,222,1) 100%)' }}/>

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

      </div>

      {/* ── Historique bilan 7 jours — juste sous l'image ── */}
      {slide.isBilan && (
        <div style={{ flexShrink:0, background:'linear-gradient(135deg,rgba(255,255,255,0.72),rgba(232,245,232,0.60))', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(26,74,40,0.10)', padding:'12px 16px 10px', boxShadow:'0 2px 10px rgba(26,74,40,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(26,74,40,0.15))' }}/>
            <span style={{ fontSize:9, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(26,74,40,0.45)', letterSpacing:'.14em', textTransform:'uppercase' }}>Mon humeur · 7 jours</span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(26,74,40,0.15),transparent)' }}/>
          </div>
          <BilanHistory7Days history={bilanHistory ?? []} maxDays={7} />
        </div>
      )}

      {/* ── Preview texte — scroll vertical natif ── */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'16px 20px 80px', display:'flex', flexDirection:'column', gap:8, position:'relative', zIndex:1 }}>

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
            {slide.isBilan && bilanDoneToday ? 'Revoir mon bilan ›' : slide.btnLabel}
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
        style={{ position:'absolute', bottom:20, right:16, width:48, height:48, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#4cd964,#28a745)', cursor:'pointer', fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, touchAction:'manipulation' }}
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

function BilanHistory7Days({ history, maxDays = 7 }) {
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
}

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
          flexShrink:0, height:52, display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'0 18px',
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
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, padding:'28px 24px' }}>
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
              onClick={() => onOpenSlide?.('champ')}
              style={{ flex:1, padding:'10px 20px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:20, fontWeight:600, color:'#1a1208', background:'linear-gradient(135deg,#d4b050,#a87c28)', boxShadow:'0 4px 16px rgba(180,140,40,.3)', transition:'transform .15s, box-shadow .15s', letterSpacing:'.02em' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(180,140,40,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(180,140,40,.3)' }}
            >🌻 Voir ma fleur dans le jardin collectif</button>
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

function SettingsPanel({ name, email, isPremium, userId, onBack, onOpenFleur, onUpgrade, onNameSaved }) {
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

  useEffect(() => {
    if (!userId) return
    supabase.from('users').select('flower_name').eq('id', userId).single()
      .then(({ data }) => { if (data?.flower_name) setCurrentFlower(data.flower_name) })
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
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={editName}
              onChange={e => { setEditName(e.target.value); setSaved(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              style={{ flex:1, padding:'10px 14px', borderRadius:8, border:'1px solid rgba(200,160,150,.30)', background:'rgba(255,255,255,.8)', fontSize:15, fontFamily:"'Jost',sans-serif", color:'#1a1208', outline:'none' }}
              placeholder="Votre nom…"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !editName.trim() || editName.trim() === name}
              style={{ padding:'10px 16px', borderRadius:8, border:'none', background: saved ? 'rgba(122,170,80,.85)' : 'rgba(200,160,150,.35)', color: saved ? '#fff' : 'rgba(30,20,8,.65)', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}
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

        {/* Abonnement */}
        <div style={{ padding:'12px 16px', background: isPremium ? 'rgba(122,170,80,.08)' : 'rgba(0,0,0,.04)', borderRadius:12, border: isPremium ? '1px solid rgba(122,170,80,.25)' : '1px solid rgba(0,0,0,.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color: isPremium ? '#5a9a28' : 'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", marginBottom:5 }}>Abonnement</div>
            <div style={{ fontSize:15, fontWeight:500, color: isPremium ? '#3a7a18' : 'rgba(30,20,8,.80)', fontFamily:"'Jost',sans-serif" }}>{isPremium ? '✦ Premium actif' : 'Version gratuite'}</div>
          </div>
          {isPremium && (
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

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  GUIDE PANEL — index des slides + checklist débutant
// ─────────────────────────────────────────────────────────────────────────────
function GuidePanel({ slides, curIdx, onNavigate, onClose, onRitual, onBilan, bilanDoneToday, stats, joinedIds, achats }) {
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
          <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(30,20,8,.55)', fontFamily:"'Jost',sans-serif", fontWeight:600, marginBottom:10 }}>Les 9 espaces</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {slides.map((s, i) => (
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
}

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
  const { todayPlant, stats: plantStats, reload: reloadPlant } = usePlant(user?.id)
  const { communityStats, defis, myDefis, joinedIds, isLoading: defisLoading } = useDefi(user?.id)
  const { achats } = useAchats(user?.id)
  const prefetchRunRef = useRef(false)
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
  const [prefetchDone,        setPrefetchDone]        = useState(false)
  const [isNewUser,           setIsNewUser]           = useState(false)
  const [welcomeReady,        setWelcomeReady]        = useState(false)
  const [showAccessModal,     setShowAccessModal]     = useState(false)
  const [showLumensModal,     setShowLumensModal]     = useState(false)
  const [showLumenInfo,       setShowLumenInfo]       = useState(false)
  const [showProfileModal,    setShowProfileModal]    = useState(false)
  const [showPremiumModal,    setShowPremiumModal]    = useState(false)
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
  const [showRitualSuggestion,setShowRitualSuggestion]= useState(false)
  const [selectedNeed,        setSelectedNeed]        = useState(null)
  const ritualCompleteCalledRef = useRef(false)
  const [bilanHistory,        setBilanHistory]        = useState([])
  const [showGuide,           setShowGuide]           = useState(false)

  // ── Slides visibles selon la plage horaire ──
  const visibleSlides = useMemo(() => {
    const slot = getTimeSlot()
    if (slot === 'morning') return SLIDES_CONFIG
    const withoutBilan = SLIDES_CONFIG.filter(s => s.id !== 'bilan')
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

  // window.openAccessModal (utilisé dans les sous-composants)
  useEffect(() => {
    window.openAccessModal = () => setShowPremiumModal(true)
    return () => { delete window.openAccessModal }
  }, [])

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
    isPostRitual:    postRitualSlide,
    openRitualsModal,
    onCloseRituals: () => setOpenRitualsModal(false),
    bilanDoneToday,
    track,
  }), [user, profile, isPremium, todayPlant, plantStats, stats, circleMembers, activeCircle, communityStats, lumens, awardLumens, refresh, gardenFlowerCount, defis, myDefis, joinedIds, achats, unreadCoeurs, pendingInvitations, bilanDoneToday, openRitualsModal, postRitualSlide, track])

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
  const name    = profile?.display_name ?? user?.display_name ?? null
  const email   = user?.email ?? ''
  const initial = (name ?? email).charAt(0).toUpperCase()

  const commonOverlays = (
    <>
      {showNeedModal && (
        <NeedSelectionModal
          onSelectNeed={need => { setShowNeedModal(false); setSelectedNeed(need); ritualCompleteCalledRef.current = false; setShowRitualSuggestion(true) }}
          onClose={() => setShowNeedModal(false)}
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
  onCompleteRitual={async (needId, isLiked, delta) => {
  if (ritualCompleteCalledRef.current) return
  ritualCompleteCalledRef.current = true
  console.log('[onCompleteRitual DashV2] called', { needId, isLiked, delta, plantId: todayPlant?.id, health: todayPlant?.health })
  track('ritual_need_complete', { needId, liked: isLiked }, 'jardin', 'engagement')
  if (!isLiked || !todayPlant?.id) return
  const snapshot = { ...todayPlant }
  const newHealth = Math.min(100, (snapshot.health ?? 5) + delta)
  const { error } = await supabase.from('plants').update({ health: newHealth }).eq('id', snapshot.id)
  if (error) { console.error('[onCompleteRitual DashV2] update failed:', error.message); return }
  console.log('[onCompleteRitual DashV2] success → health:', newHealth)
  usePlantStore.getState().setTodayPlant({ ...snapshot, health: newHealth })
  window.dispatchEvent(new CustomEvent('plantHealthPatched', { detail: { health: newHealth, plantId: snapshot.id } }))
  // Illumine la fleur dans le jardin collectif
  try { await supabase.from('network_activity').insert({ user_id: user?.id, action_type: 'ritual_complete' }) } catch(e) {}
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
      {showWelcome && <WelcomeScreen profile={profile} isNewUser={isNewUser} prefetchDone={prefetchDone} onDone={() => setShowWelcome(false)} />}
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
      {showProfileModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)' }} onClick={() => setShowProfileModal(false)} />
          <div style={{ position:'relative', background:'linear-gradient(170deg,#f4ece6,#ede5de)', borderRadius:24, padding:'24px', width:'100%', maxWidth:420, border:'1px solid rgba(200,160,150,.25)', boxShadow:'0 24px 60px rgba(180,120,100,.2)' }}>
            <button onClick={() => { setShowProfileModal(false); setProfileView('main') }} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.6)', border:'1px solid rgba(200,160,150,.3)', borderRadius:'50%', width:28, height:28, padding:0, cursor:'pointer', color:'rgba(30,20,8,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, lineHeight:1 }}>✕</button>
            {profileView === 'main' ? (<>
            {/* Titre */}
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, color:'#1a1208', marginBottom:20 }}>Mon profil</div>

            {/* Avatar + identité */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, padding:'14px 16px', background:'rgba(255,255,255,.60)', borderRadius:14, border:'1px solid rgba(200,160,150,.18)' }}>
              <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#c8a0b0,#a07888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:600, color:'#fff', flexShrink:0 }}>{initial}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>{name ?? 'Jardinier·ère'}</div>
                <div style={{ fontSize:11, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif" }}>{email}</div>
              </div>
            </div>

            {/* Abonnement */}
            <div style={{ padding:'12px 16px', background: isPremium ? 'rgba(122,170,80,.08)' : 'rgba(0,0,0,.04)', borderRadius:12, border: isPremium ? '1px solid rgba(122,170,80,.25)' : '1px solid rgba(0,0,0,.08)', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color: isPremium ? '#5a9a28' : 'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif", marginBottom:2 }}>Abonnement</div>
                <div style={{ fontSize:15, fontWeight:500, color: isPremium ? '#3a7a18' : 'rgba(30,20,8,.80)', fontFamily:"'Jost',sans-serif" }}>{isPremium ? 'Premium actif' : 'Version gratuite'}</div>
              </div>
              {isPremium && (
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

            </div>

            {/* Actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
              <div onClick={() => setProfileView('settings')} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,.55)', borderRadius:12, border:'1px solid rgba(200,160,150,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.85)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.55)'}>
                <span style={{ fontSize:16 }}>⚙️</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a1208', fontFamily:"'Jost',sans-serif" }}>Paramètres du compte</div>
                  <div style={{ fontSize:10, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif" }}>Nom, notifications, confidentialité</div>
                </div>
              </div>
              {ADMIN_IDS.includes(user?.id) && (
                <div onClick={() => { setShowProfileModal(false); window.location.hash = 'admin' }} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(210,80,80,.07)', borderRadius:12, border:'1px solid rgba(210,80,80,.18)', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(210,80,80,.13)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(210,80,80,.07)'}>
                  <span style={{ fontSize:16 }}>🛡️</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'rgba(180,60,60,.90)', fontFamily:"'Jost',sans-serif" }}>Interface admin</div>
                    <div style={{ fontSize:10, color:'rgba(180,60,60,.50)', fontFamily:"'Jost',sans-serif" }}>Accès réservé</div>
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
                userId={user?.id}
                onBack={() => setProfileView('main')}
                onOpenFleur={() => { setShowProfileModal(false); setProfileView('main'); setOpenModalId('jardin') }}
                onUpgrade={() => { setShowProfileModal(false); setProfileView('main'); setShowPremiumModal(true) }}
                onNameSaved={() => clearProfileCache(user?.id)}
              />
            )}
          </div>
        </div>
      )}
      {openModalId && (
        <ScreenModal
          slideId={openModalId}
          slides={visibleSlides}
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
              <div style={{ flexShrink:0, height:360, position:'relative', overflow:'hidden' }}>
                <img key={`illus-${slideIdx}`} src={slide.image ?? '/champs.png'} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block', animation:'dkIllusIn .42s cubic-bezier(.4,0,.2,1) both' }}/>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(250,245,242,0) 70%, rgba(250,245,242,1) 100%)' }}/>

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

              </div>

              {/* ── Historique bilan 7 jours — juste sous l'image ── */}
              {slide.isBilan && (
                <div style={{ flexShrink:0, background:'linear-gradient(135deg,rgba(255,255,255,0.72),rgba(232,245,232,0.60))', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(26,74,40,0.10)', padding:'12px 24px 10px', boxShadow:'0 2px 10px rgba(26,74,40,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(26,74,40,0.15))' }}/>
                    <span style={{ fontSize:9, fontFamily:"'Jost',sans-serif", fontWeight:600, color:'rgba(26,74,40,0.45)', letterSpacing:'.14em', textTransform:'uppercase' }}>Mon humeur · 15 jours</span>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(26,74,40,0.15),transparent)' }}/>
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
                  {slide.isBilan && bilanDoneToday ? 'Revoir mon bilan ›' : slide.btnLabel}
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
