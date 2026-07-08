import { useEffect, useRef, useState } from 'react'

// Charge la police 'Cormorant Garamond' de façon autonome : la fiche est
// utilisée depuis plusieurs écrans (Ma Fleur, Jardin, Onboarding, admin…)
// et certains ne l'importent pas globalement — sans ce chargement, le
// titre retombe silencieusement sur la police système par défaut.
const FONT_LINK_ID = 'ritual-card-font-cormorant'
function useRitualCardFont() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return
    const link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualCard
//  Fiche détaillée d'un rituel — réutilisable, 100% pilotée par un objet
//  JSON. Aucun texte de contenu n'est codé en dur : si un champ est absent,
//  la section correspondante ne s'affiche simplement pas.
//
//  Parti pris : une expérience émotionnelle, pas un formulaire d'infos.
//  Hero immersif (image + titre superposé) → bouton d'écoute → puis,
//  seulement ensuite, les explications qui flottent en typographie pure,
//  sans cartes ni aplats de couleur — la couleur ne sert qu'à guider l'œil
//  (libellés, puces, le bouton final).
//
//  Props :
//    ritual : {
//      image, icon, categoryIcon, title, category, duration, subtitle,
//      audioUrl, audioDuration,
//      objective, why,
//      steps:    [{ icon, title, text }],
//      benefits: [{ icon, label, text }]  (ou simples chaînes),
//      reflection,
//    }
//    color : couleur de zone — utilisée uniquement par l'outil interactif
//            (respiration, minuteur…), le reste de la fiche a sa palette
//            éditoriale fixe (mauve / vert), indépendante du thème global
//            de l'app (qui n'est pas fiable sur tous les écrans).
//    variant : 'standard' | 'premium'  (défaut 'premium' — ajoute une
//              entrée en fondu échelonnée et de très légères touches
//              décoratives ; la structure est identique dans les deux cas)
//    layout  : 'mobile' | 'desktop'  (défaut 'mobile' — 'desktop' donne un
//              hero pleine largeur et deux colonnes pour Objectif/Pourquoi
//              et les étapes, pensé pour un cadre large type PC)
//    marked  : bool — le rituel vient d'être validé
//    onBack, onComplete, onMore (optionnel)
//    practice : { started, onStart, content } | null — outil interactif
// ═══════════════════════════════════════════════════════════

const MAUVE      = '#7D4368'
const FOREST     = '#33502F'
const TEXT       = '#2A2018'
const TEXT_MUTED = '#6B5D52'
const TEXT_FAINT = '#A8988B'

const DOT_PALETTE = [
  { bg: 'rgba(90,130,80,0.16)',   fg: '#3E6B3A' },
  { bg: 'rgba(200,137,74,0.18)',  fg: '#96682E' },
  { bg: 'rgba(212,119,154,0.18)', fg: '#B24E77' },
  { bg: 'rgba(125,67,104,0.16)',  fg: '#7D4368' },
]

function fadeIn(index, premium) {
  if (!premium) return {}
  return { animation: 'fadeUp .5s ease both', animationDelay: `${Math.min(index, 6) * 0.07}s` }
}

function normalizeBenefit(b) {
  return typeof b === 'string' ? { label: b } : b
}

function SectionLabel({ icon, children, color, center }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 700, color }}>{children}</span>
    </div>
  )
}

export function RitualCard({
  ritual,
  color = 'var(--green)',
  variant = 'premium',
  layout = 'mobile',
  marked = false,
  onBack,
  onMore,
  onComplete,
  practice = null,
}) {
  useRitualCardFont()
  const premium = variant === 'premium'
  const desktop = layout === 'desktop'
  const {
    image, icon, categoryIcon, title, category, duration, subtitle,
    audioUrl, audioDuration,
    objective, why,
    steps = [], benefits: rawBenefits = [], reflection,
    stepsIllustration,
  } = ritual
  const benefits = rawBenefits.map(normalizeBenefit).filter(b => b?.label)

  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [showIllustration, setShowIllustration] = useState(false)
  const toggleAudio = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) el.pause(); else el.play()
  }

  // ── Bouton d'écoute — sous le sous-titre en desktop (dans la colonne du
  // titre), sous le hero entier en mobile (image + titre trop étroits pour
  // l'accueillir à côté) ──
  const audioBlock = audioUrl && (
    <>
      <audio ref={audioRef} src={audioUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button onClick={toggleAudio} style={{
        width: desktop ? 300 : '100%', maxWidth: '100%', margin: desktop ? '20px 0 0' : 0, padding: desktop ? '15px 20px' : 16,
        borderRadius: 100, border: 'none', cursor: 'pointer',
        background: MAUVE, color: '#fff', fontSize: desktop ? 14 : 14, fontWeight: 500, letterSpacing: '0.03em',
        boxShadow: '0 10px 26px rgba(125,67,104,0.30)', marginBottom: desktop ? 0 : 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'Jost',sans-serif",
      }}>
        {playing ? '❚❚ Écoute en cours…' : `▶ Écouter le rituel${audioDuration ? ` · ${audioDuration}` : ''}`}
      </button>
    </>
  )

  return (
    <div style={{ animation: 'fadeUp 0.3s ease both' }}>

      {/* ── BARRE HAUTE ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(50,40,30,0.05)', border: `1px solid ${'rgba(50,40,30,0.10)'}`,
          color: TEXT_MUTED, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        {onMore && (
          <button onClick={onMore} style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(50,40,30,0.05)', border: `1px solid ${'rgba(50,40,30,0.10)'}`,
            color: TEXT_MUTED, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⋯</button>
        )}
      </div>

      {/* ── HERO ── */}
      {desktop ? (
        <div style={{
          display: 'flex', gap: 36, marginBottom: 40, alignItems: 'center', padding: '8px 8px 8px 0',
        }}>
          {image ? (
            <img src={image} alt="" style={{
              width: 'auto', height: 'auto', maxWidth: 320, maxHeight: 380, flexShrink: 0,
              borderRadius: 26, display: 'block', objectFit: 'contain',
              boxShadow: premium ? '0 24px 48px rgba(40,20,10,0.22)' : '0 6px 16px rgba(40,20,10,0.10)',
            }} />
          ) : (
            <div style={{
              width: 320, height: 320, flexShrink: 0, borderRadius: 26,
              background: `linear-gradient(160deg, ${MAUVE}25, ${FOREST}1c)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: premium ? '0 24px 48px rgba(40,20,10,0.22)' : '0 6px 16px rgba(40,20,10,0.10)',
            }}>
              <span style={{ fontSize: 96 }}>{icon || '🌿'}</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {(category || duration) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {category && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: MAUVE }}>
                    {categoryIcon && <span style={{ fontSize: 15 }}>{categoryIcon}</span>}{category}
                  </span>
                )}
                {category && duration && <span style={{ color: TEXT_FAINT, fontSize: 12 }}>•</span>}
                {duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: TEXT_MUTED }}>⏱ {duration}</span>
                )}
              </div>
            )}
            <h1 style={{
              fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 'clamp(34px, 3.8vw, 46px)',
              color: FOREST, fontWeight: 700, lineHeight: 1.08, margin: '0 0 16px', maxWidth: 560,
            }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 19, color: TEXT_MUTED, lineHeight: 1.55, margin: 0, fontWeight: 400, maxWidth: 480 }}>{subtitle}</p>}
            {audioBlock}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 18, marginBottom: 22, alignItems: 'flex-start' }}>
          <div style={{
            width: 168, height: 204, borderRadius: 22, flexShrink: 0, overflow: 'hidden', position: 'relative',
            background: image ? undefined : `linear-gradient(160deg, ${MAUVE}25, ${FOREST}1c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: premium ? '0 14px 30px rgba(40,20,10,0.18)' : '0 3px 10px rgba(40,20,10,0.09)',
          }}>
            {image
              ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 60 }}>{icon || '🌿'}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
            {(category || duration) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {category && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: MAUVE }}>
                    {categoryIcon && <span style={{ fontSize: 13 }}>{categoryIcon}</span>}{category}
                  </span>
                )}
                {category && duration && <span style={{ color: TEXT_FAINT, fontSize: 11 }}>•</span>}
                {duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT_MUTED }}>⏱ {duration}</span>
                )}
              </div>
            )}
            <h1 style={{
              fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 'clamp(22px, 6.5vw, 28px)',
              color: FOREST, fontWeight: 700, lineHeight: 1.12, margin: '0 0 10px',
            }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 18, color: TEXT_MUTED, lineHeight: 1.5, margin: 0, fontWeight: 400 }}>{subtitle}</p>}
          </div>
        </div>
      )}

      {/* ── ÉCOUTER — en desktop, déjà placé sous le sous-titre dans le hero ── */}
      {!desktop && audioBlock}

      {/* ── OBJECTIF + POURQUOI CE RITUEL — une seule colonne ── */}
      {(objective || why) && (
        <div style={{ marginBottom: desktop ? 44 : 32, padding: '0 10px' }}>
          {objective && (
            <div style={{ marginBottom: 32, ...fadeIn(0, premium) }}>
              <SectionLabel icon="🎯" color={MAUVE}>Objectif</SectionLabel>
              <p style={{ fontSize: desktop ? 16 : 14, color: TEXT, lineHeight: 1.75, margin: 0, fontWeight: 400 }}>{objective}</p>
            </div>
          )}
          {why && (
            <div style={{ ...fadeIn(1, premium) }}>
              <SectionLabel icon="🌼" color={FOREST}>Pourquoi ce rituel ?</SectionLabel>
              <p style={{ fontSize: desktop ? 16 : 14, color: TEXT, lineHeight: 1.75, margin: 0, fontWeight: 400 }}>{why}</p>
            </div>
          )}
        </div>
      )}

      {/* ── COMMENT FAIRE ── */}
      {steps.length > 0 && (
        <div style={{ marginBottom: desktop ? 44 : 32, ...fadeIn(2, premium) }}>
          <SectionLabel icon="✨" color={FOREST}>Comment faire ?</SectionLabel>
          <div style={desktop
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px 40px', marginTop: 8 }
            : { display: 'flex', flexDirection: 'column', gap: 22, marginTop: 4 }
          }>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: desktop ? 16 : 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: desktop ? 48 : 42, height: desktop ? 48 : 42, borderRadius: '50%', flexShrink: 0,
                  background: DOT_PALETTE[i % DOT_PALETTE.length].bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: desktop ? 20 : 18,
                }}>{s.icon || '•'}</div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: desktop ? 7 : 5 }}>
                  {s.title && (
                    <div style={{ fontSize: desktop ? 15 : 13.5, fontWeight: 600, color: FOREST, marginBottom: 4 }}>
                      {s.title}
                    </div>
                  )}
                  {s.text && <div style={{ fontSize: desktop ? 13.5 : 12.5, color: TEXT_MUTED, lineHeight: 1.65 }}>{s.text}</div>}
                </div>
              </div>
            ))}
          </div>
          {stepsIllustration && (
            <div style={{ marginTop: 18 }}>
              <button onClick={() => setShowIllustration(v => !v)} style={{
                width: desktop ? 340 : '100%', maxWidth: '100%', margin: desktop ? '0 auto' : 0, padding: '12px',
                borderRadius: 100,
                border: `1px solid ${FOREST}40`, background: `${FOREST}0c`,
                color: FOREST, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                letterSpacing: '.04em', fontFamily: "'Jost',sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>🖼 {showIllustration ? 'Masquer l’illustration' : 'Illustration du rituel'}</button>
              {showIllustration && (
                <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', animation: 'fadeUp 0.3s ease both' }}>
                  <img src={stepsIllustration} alt="" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PRATIQUE GUIDÉE (outil interactif) ── */}
      {practice && (
        <div style={{ marginBottom: desktop ? 44 : 32, ...fadeIn(3, premium) }}>
          <SectionLabel icon="🧘" color={color}>Pratique guidée</SectionLabel>
          {!practice.started ? (
            <button onClick={practice.onStart} style={{
              width: desktop ? 340 : '100%', maxWidth: '100%', margin: desktop ? '0 auto' : 0, padding: '12px',
              borderRadius: 100,
              border: `1px solid ${color}40`, background: `${color}12`,
              color, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              letterSpacing: '.04em', fontFamily: "'Jost',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>▶ Commencer l'exercice</button>
          ) : (
            <div style={{ animation: 'fadeUp 0.3s ease both' }}>{practice.content}</div>
          )}
        </div>
      )}

      {/* ── CE QUE NOURRIT CE RITUEL ── */}
      {benefits.length > 0 && (
        <div style={{ marginBottom: desktop ? 44 : 32, ...fadeIn(4, premium) }}>
          <SectionLabel icon="🌱" color={FOREST}>Ce que nourrit ce rituel</SectionLabel>
          <div style={desktop
            ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 32px', marginTop: 10 }
            : { display: 'flex', flexWrap: 'wrap', gap: '14px 22px', marginTop: 6 }
          }>
            {benefits.map((b, i) => {
              const pal = DOT_PALETTE[i % DOT_PALETTE.length]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: desktop ? 12 : 8, minWidth: 0 }}>
                  <div style={{ width: desktop ? 32 : 26, height: desktop ? 32 : 26, borderRadius: '50%', flexShrink: 0, background: pal.bg, color: pal.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: desktop ? 14 : 12 }}>{b.icon || '✓'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: desktop ? 14.5 : 12.5, fontWeight: 600, color: TEXT, lineHeight: 1.25 }}>{b.label}</div>
                    {b.text && <div style={{ fontSize: desktop ? 12.5 : 10.5, color: TEXT_MUTED, lineHeight: 1.35 }}>{b.text}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── POUR TERMINER ── */}
      {reflection && (
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: desktop ? 44 : 36, padding: '0 10px', ...fadeIn(5, premium) }}>
          {premium && <span aria-hidden style={{ position: 'absolute', top: -14, right: desktop ? 40 : 2, fontSize: desktop ? 56 : 44, opacity: 0.10, pointerEvents: 'none' }}>🌸</span>}
          <SectionLabel icon="💚" color={MAUVE} center>Pour terminer</SectionLabel>
          <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 24, color: MAUVE, opacity: 0.35, lineHeight: 1 }}>«</div>
          <p style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: desktop ? 21 : 19, fontStyle: 'italic', color: TEXT, lineHeight: 1.5, margin: desktop ? '4px auto 0' : '2px 0 0', fontWeight: 400, maxWidth: desktop ? 560 : 'none' }}>{reflection}</p>
        </div>
      )}

      {/* ── CTA — le seul aplat de couleur franc de la fiche ── */}
      <button onClick={onComplete} style={{
        width: desktop ? 380 : '100%', maxWidth: '100%', margin: desktop ? '0 auto' : 0, display: 'flex',
        padding: desktop ? 18 : 17, borderRadius: 100, border: 'none',
        background: marked ? 'rgba(90,130,80,0.85)' : MAUVE,
        color: '#fff',
        fontSize: desktop ? 15 : 14, cursor: 'pointer', fontWeight: 500, letterSpacing: '0.04em',
        boxShadow: '0 10px 26px rgba(125,67,104,0.32)',
        transition: 'all 0.3s', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'Jost',sans-serif",
      }}>
        {marked ? '✓ Rituel accompli !' : "✓ J'ai fait ce rituel"}
      </button>

      {/* ── SIGNATURE ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        <span style={{ color: MAUVE, opacity: 0.6, fontSize: 12 }}>♡</span>
        <span style={{ fontSize: 11, color: MAUVE, opacity: 0.7, fontStyle: 'italic' }}>Chaque petit rituel est une graine pour votre jardin intérieur</span>
      </div>
    </div>
  )
}
