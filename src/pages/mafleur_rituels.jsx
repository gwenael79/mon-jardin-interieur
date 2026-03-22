// @refresh reset
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../core/supabaseClient";

// mafleur_rituels.data.js
// Données pures — pas de JSX, compatible Fast Refresh

// ═══════════════════════════════════════════════════════════
//  DONNÉES — Zones, Rituels, Questions
// ═══════════════════════════════════════════════════════════

export const PLANT_ZONES = {
  roots:   { name: "Racines",  subtitle: "Ancrage & Énergie",    color: "var(--zone-roots)", accent: "var(--gold-warm)", bg: "#120A03" },
  stem:    { name: "Tige",     subtitle: "Flexibilité & Corps",  color: "var(--zone-stem)", accent: "#9DDBB4", bg: "#060F08" },
  leaves:  { name: "Feuilles", subtitle: "Liens & Humeur",       color: "var(--zone-leaves)", accent: "var(--green)", bg: "#060C08" },
  flowers: { name: "Fleurs",   subtitle: "Soin de Soi",          color: "var(--zone-flowers)", accent: "var(--zone-flowers)", bg: "#0E0508" },
  breath:  { name: "Souffle",  subtitle: "Présence & Sérénité",  color: "var(--zone-breath)", accent: "var(--zone-breath)", bg: "#03090E" },
};

// PLANT_RITUALS est chargé dynamiquement depuis Supabase via useRituels()
// Structure reconstruite : { roots: [...], stem: [...], leaves: [...], flowers: [...], breath: [...] }
export const PLANT_RITUALS_EMPTY = { roots:[], stem:[], leaves:[], flowers:[], breath:[] }


// ─── QUESTIONS QUIZ ──────────────────────────────────────
export const PLANT_QUESTIONS = [
  { id: "q1", zone: "roots",   theme: "Énergie vitale",  icon: "⚡", text: "Comment est votre énergie physique en ce moment ?", sub: "Fermez les yeux. Scannez votre corps de la tête aux pieds.", answers: [{ label: "Vidé·e", emoji: "🪫", stress: 95 }, { label: "Épuisé·e", emoji: "😴", stress: 72 }, { label: "Passable", emoji: "😐", stress: 48 }, { label: "Bien", emoji: "🌱", stress: 20 }, { label: "Plein·e d'élan", emoji: "✨", stress: 0 }] },
  { id: "q2", zone: "roots",   theme: "Sommeil",         icon: "🌙", text: "Quelle qualité avait votre sommeil cette nuit ?", sub: "Nuit agitée, fragments de rêves, réveil difficile…", answers: [{ label: "Cauchemardesque", emoji: "😩", stress: 95 }, { label: "Agité·e", emoji: "😣", stress: 72 }, { label: "Moyen", emoji: "😶", stress: 45 }, { label: "Reposant", emoji: "😌", stress: 15 }, { label: "Profond & doux", emoji: "🌟", stress: 0 }] },
  { id: "q3", zone: "stem",    theme: "Corps",           icon: "🤸", text: "Où en est votre corps en ce début de journée ?", sub: "Tensions, lourdeurs, contractures… ou légèreté.", answers: [{ label: "Douloureux", emoji: "😖", stress: 95 }, { label: "Contracté", emoji: "😬", stress: 70 }, { label: "Neutre", emoji: "😑", stress: 45 }, { label: "Détendu", emoji: "😊", stress: 18 }, { label: "Léger & libre", emoji: "🕊️", stress: 0 }] },
  { id: "q4", zone: "stem",    theme: "Flexibilité",     icon: "🌊", text: "Face à un imprévu, votre posture intérieure est…", sub: "Ce que vous portez avant même qu'il arrive.", answers: [{ label: "Effondrement", emoji: "😤", stress: 95 }, { label: "Résistance", emoji: "😰", stress: 70 }, { label: "Hésitation", emoji: "🤔", stress: 48 }, { label: "Adaptation", emoji: "🙆", stress: 20 }, { label: "Fluidité totale", emoji: "🌿", stress: 0 }] },
  { id: "q5", zone: "leaves",  theme: "Lien aux autres", icon: "🤝", text: "Votre désir de connexion avec les autres ce matin ?", sub: "Envie de partager, d'échanger, de rire ensemble…", answers: [{ label: "Retrait total", emoji: "🙈", stress: 95 }, { label: "Isolé·e", emoji: "🫥", stress: 72 }, { label: "Neutre", emoji: "🙂", stress: 48 }, { label: "Présent·e", emoji: "😄", stress: 20 }, { label: "Rayonnant·e", emoji: "🌞", stress: 0 }] },
  { id: "q6", zone: "leaves",  theme: "Humeur",          icon: "🎨", text: "Quelle couleur peindrait votre humeur en ce moment ?", sub: "Une teinte émotionnelle, pas un jugement.", answers: [{ label: "Noir profond", emoji: "🌑", stress: 95 }, { label: "Gris lourd", emoji: "🌥️", stress: 72 }, { label: "Beige terne", emoji: "🌤️", stress: 48 }, { label: "Jaune doux", emoji: "🌼", stress: 18 }, { label: "Or lumineux", emoji: "☀️", stress: 0 }] },
  { id: "q7", zone: "flowers", theme: "Rapport à soi",   icon: "💆", text: "Comment vous sentez-vous vis-à-vis de vous-même ?", sub: "Bienveillance, indifférence, critique intérieure…", answers: [{ label: "Très dur·e", emoji: "😞", stress: 95 }, { label: "Déconnecté·e", emoji: "😕", stress: 70 }, { label: "Neutre", emoji: "😌", stress: 45 }, { label: "Avec douceur", emoji: "🌸", stress: 18 }, { label: "Avec amour", emoji: "💖", stress: 0 }] },
  { id: "q8", zone: "flowers", theme: "Anticipation",    icon: "🌅", text: "Face à la journée qui s'ouvre, votre ressenti est…", sub: "Ce que vous portez avant même qu'elle commence.", answers: [{ label: "Angoisse", emoji: "😨", stress: 95 }, { label: "Préoccupation", emoji: "😟", stress: 70 }, { label: "Neutralité", emoji: "😐", stress: 45 }, { label: "Sérénité", emoji: "🙂", stress: 18 }, { label: "Joie anticipée", emoji: "🌟", stress: 0 }] },
  { id: "q9", zone: "breath",  theme: "Stress intérieur",icon: "🌀", text: "Quel est le niveau de tension que vous portez là, maintenant ?", sub: "Pas dans les idées — dans le ventre, la gorge, les épaules.", answers: [{ label: "Insupportable", emoji: "🔥", stress: 100 }, { label: "Élevé", emoji: "⚠️", stress: 75 }, { label: "Gérable", emoji: "💛", stress: 48 }, { label: "Faible", emoji: "💚", stress: 18 }, { label: "Absent", emoji: "🌬️", stress: 0 }] },
  { id: "q10",zone: "breath",  theme: "Présence",        icon: "🔮", text: "Êtes-vous dans votre corps, ou perdu·e dans vos pensées ?", sub: "Le fil entre le mental et le vivant.", answers: [{ label: "Tourbillon mental", emoji: "🌪️", stress: 95 }, { label: "Plutôt dans la tête", emoji: "💭", stress: 70 }, { label: "Entre les deux", emoji: "⚖️", stress: 45 }, { label: "Ancré·e", emoji: "🌱", stress: 15 }, { label: "Pleinement ici", emoji: "🧘", stress: 0 }] },
];

// ─── FONCTIONS DE CALCUL ─────────────────────────────────
export function computeDegradation(answers) {
  const acc = {};
  Object.keys(PLANT_ZONES).forEach(z => { acc[z] = { w: 0, s: 0 }; });
  PLANT_QUESTIONS.forEach(q => {
    if (answers[q.id] === undefined) return;
    acc[q.zone].s += q.answers[answers[q.id]].stress;
    acc[q.zone].w += 1;
  });
  const deg = {};
  Object.keys(PLANT_ZONES).forEach(z => {
    deg[z] = acc[z].w > 0 ? Math.round(acc[z].s / acc[z].w) : 50;
  });
  return deg;
}

export function computePlantHealth(degradation, completed, previousHealth, plantRituals) {
  const health = {};
  Object.keys(PLANT_ZONES).forEach(z => {
    const prev = previousHealth?.[z] ?? 72;
    const floor = Math.max(5, 100 - degradation[z]);
    const baseline = Math.round(prev * 0.25 + floor * 0.75);
    const rituals = Object.values((plantRituals || {})[z] || []);
    const done = rituals.filter(r => completed[r.id]).length;
    const healPct = rituals.length > 0 ? done / rituals.length : 0;
    health[z] = Math.round(baseline + (Math.min(100, baseline + 45) - baseline) * healPct);
  });
  return health;
}


// ═══════════════════════════════════════════════════════════
//  HOOK : useRituels
//  Charge PLANT_RITUALS depuis Supabase et reconstruit la structure
// ═══════════════════════════════════════════════════════════
export function useRituels() {
  const [rituals, setRituals] = useState(PLANT_RITUALS_EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('rituels')
      .select('*')
      .order('n', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return }
        // Reconstruit la structure { zone: [ { id, text, icon, quick:[], deep:[] } ] }
        const map = {}
        for (const row of data) {
          if (!map[row.zone]) map[row.zone] = {}
          if (!map[row.zone][row.rituel]) {
            // Génère un id stable depuis le rituel
            const id = row.zone[0] + Object.keys(map[row.zone]).length
            map[row.zone][row.rituel] = { id, text: row.rituel, icon: '', quick: [], deep: [] }
          }
          const ex = {
            id:   `${row.zone}_${row.n}`,
            title: row.title,
            dur:   row.dur,
            icon:  row.icon,
            desc:  row.desc,
            tool:  row.tool ?? undefined,
          }
          map[row.zone][row.rituel][row.mode].push(ex)
        }
        // Convertit en tableau par zone
        const result = {}
        for (const zone of Object.keys(PLANT_RITUALS_EMPTY)) {
          result[zone] = Object.values(map[zone] || {})
        }
        window.__PLANT_RITUALS_CACHE__ = result
        setRituals(result)
        setLoading(false)
      })
  }, [])

  return { rituals, loading }
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : DailyQuizModal
//  Quiz de dégradation quotidien (10 questions)
//  Props : onComplete(degradation) | onSkip()
// ═══════════════════════════════════════════════════════════
export function DailyQuizModal({ onComplete, onSkip }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [visible, setVisible] = useState(true);

  const startQuiz = () => {
    setVisible(false);
    setTimeout(() => { setStep(0); setVisible(true); }, 250);
  };

  const choose = (idx) => {
    if (!transitioning) setSelected(idx);
  };

  const next = () => {
    if (selected === null || transitioning) return;
    setTransitioning(true);
    setVisible(false);
    const q = PLANT_QUESTIONS[step];
    const newAnswers = { ...answers, [q.id]: selected };
    setTimeout(() => {
      if (step < PLANT_QUESTIONS.length - 1) {
        setStep(step + 1);
        setAnswers(newAnswers);
        setSelected(null);
        setTransitioning(false);
        setVisible(true);
      } else {
        const deg = computeDegradation(newAnswers);
        onComplete(deg, newAnswers);
      }
    }, 280);
  };

  // Écran d'accueil du quiz
  if (step === -1) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "var(--quiz-modal-bg, rgba(6,14,7,0.96))", backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 28px",
    }}>
      <button onClick={onSkip} style={{ position:'absolute', top:16, right:16, background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--quiz-modal-text-rgb),0.55)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1 }}>✕</button>
      <div style={{
        textAlign: "center", maxWidth: 340,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <div style={{ fontSize:'var(--fs-emoji-lg, 52px)', marginBottom: 24, display: "inline-block", animation: "pulse 3s ease-in-out infinite" }}>🌹</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", fontSize:'var(--fs-h1, 36px)', color: "var(--quiz-modal-text)", fontWeight: 300, lineHeight: 1.1, marginBottom: 12 }}>
          Comment vous<br /><em style={{ fontStyle: "italic", color: "var(--gold-warm)" }}>sentez-vous</em> aujourd'hui ?
        </h2>
        <div style={{ width: 40, height: 1, background: "rgba(var(--gold-warm-rgb),0.3)", margin: "16px auto" }} />
        <p style={{ color: "rgba(var(--quiz-modal-text-rgb),0.5)", fontSize:'var(--fs-h4, 13px)', lineHeight: 1.7, marginBottom: 6 }}>
          Dix questions pour prendre votre pouls intérieur.
        </p>
        <p style={{ color: "rgba(var(--quiz-modal-text-rgb),0.3)", fontSize:'var(--fs-h5, 11px)', lineHeight: 1.7, marginBottom: 32 }}>
          Votre plante reflétera votre état et vous révèlera les zones à soigner en priorité.
        </p>
        <button
          onClick={startQuiz}
          style={{ padding: "13px 40px", borderRadius: 50, border: "1px solid rgba(var(--gold-warm-rgb),0.35)", background: "rgba(var(--gold-warm-rgb),0.1)", color: "var(--gold-warm)", fontSize:'var(--fs-h4, 13px)', cursor: "pointer", letterSpacing: "0.08em", display: "block", width: "100%", marginBottom: 10 }}
        >
          Commencer le bilan
        </button>
        <button
          onClick={onSkip}
          style={{ padding: "10px", borderRadius: 50, border: "none", background: "none", color: "rgba(var(--quiz-modal-text-rgb),0.3)", fontSize:'var(--fs-h5, 12px)', cursor: "pointer", letterSpacing: "0.05em", width: "100%" }}
        >
          Passer pour aujourd'hui
        </button>
        <p style={{ color: "rgba(var(--quiz-modal-text-rgb),0.2)", fontSize:'var(--fs-h5, 10px)', marginTop: 12 }}>Environ 2 minutes · Confidentiel</p>
      </div>
    </div>
  );

  const q = PLANT_QUESTIONS[step];
  const zone = PLANT_ZONES[q.zone];
  const progress = (step + 1) / PLANT_QUESTIONS.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background:'var(--quiz-modal-bg, var(--overlay-dark))',
      display: "flex", flexDirection: "column",
    }}>
      {/* Barre de progression */}
      <div style={{ height: 2, background: "var(--surface-2)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: `linear-gradient(90deg, ${zone.color}, ${zone.accent})`, borderRadius: "0 1px 1px 0", transition: "width 0.5s ease" }} />
      </div>

      {/* Header zone */}
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize:'var(--fs-h5, 10px)', textTransform: "uppercase", letterSpacing: "0.12em", color: zone.color, opacity: 0.8, fontWeight: 500 }}>
          {zone.name} · {q.theme}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--quiz-modal-text-rgb),0.3)" }}>
          {step + 1} <span style={{ opacity: 0.4 }}>/ 10</span>
        </span>
        <button onClick={onSkip} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--quiz-modal-text-rgb),0.55)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
        </div>
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 24px", maxWidth: 440, width: "100%", margin: "0 auto",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
      }}>
        <div style={{ fontSize:'var(--fs-emoji-lg, 36px)', marginBottom: 12 }}>{q.icon}</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", fontSize:'var(--fs-h2, 24px)', color: "var(--quiz-modal-text)", fontWeight: 400, lineHeight: 1.25, marginBottom: 6 }}>{q.text}</h3>
        <p style={{ fontSize:'var(--fs-h5, 12px)', color: "rgba(var(--quiz-modal-text-rgb),0.4)", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>{q.sub}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.answers.map((ans, i) => {
            const sel = selected === i;
            return (
              <button key={i} onClick={() => choose(i)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                border: `1px solid ${sel ? `${zone.color}55` : "var(--track)"}`,
                background: sel ? "rgba(var(--green-rgb),0.08)" : "var(--surface-1)",
                boxShadow: sel ? `0 0 0 1px ${zone.color}30` : "none",
                transition: "all 0.18s ease",
              }}>
                <span style={{ fontSize:'var(--fs-emoji-sm, 18px)' }}>{ans.emoji}</span>
                <span style={{ flex: 1, fontSize:'var(--fs-h4, 13px)', color: sel ? "var(--quiz-modal-text)" : "rgba(var(--quiz-modal-text-rgb),0.6)", fontWeight: sel ? 500 : 300 }}>{ans.label}</span>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${sel ? zone.color : "var(--separator)"}`, background: sel ? `${zone.color}30` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", flexShrink: 0 }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: zone.accent }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton suivant */}
      <div style={{ padding: "0 24px 40px", maxWidth: 440, width: "100%", margin: "0 auto" }}>
        <button onClick={next} disabled={selected === null} style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${selected !== null ? `${zone.color}40` : "var(--surface-2)"}`,
          background: selected !== null ? "rgba(var(--green-rgb),0.12)" : "var(--surface-1)",
          color: selected !== null ? zone.accent : "var(--separator)",
          fontSize:'var(--fs-h4, 13px)', cursor: selected !== null ? "pointer" : "not-allowed",
          fontWeight: 500, letterSpacing: "0.06em", transition: "all 0.25s",
        }}>
          {step === PLANT_QUESTIONS.length - 1 ? "Voir mes rituels →" : "Suivant →"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : ExerciseDetail
//  Sous-vue du modal rituel : détail d'un exercice
// ═══════════════════════════════════════════════════════════
// ── Détection du type d'exercice ─────────────────────────────
function detectExerciseType(exercise) {
  // Le champ tool.type (depuis Supabase) est la seule source de vérité.
  // Pour activer un tool sur un exercice : ajoutez tool: { type: "breath" }
  // Pour le désactiver : supprimez le champ tool.
  return exercise.tool?.type ?? null
}

function BreathingTool({ exercise, color, accent }) {
  const [phase, setPhase]   = useState('ready')
  const [cycles, setCycles] = useState(0)
  const cyclesRef = useRef(0)

  // ── Timings — tirés directement du champ tool ───────────────
  const timings = useMemo(() => {
    // 1. Champ tool.type === 'breath' avec valeurs explicites
    if (exercise.tool?.type === 'breath') {
      return {
        inhale:    exercise.tool.inhale    ?? 5,
        hold:      exercise.tool.hold      ?? 0,
        exhale:    exercise.tool.exhale    ?? 5,
        holdEmpty: exercise.tool.holdEmpty ?? 0,
      }
    }
    // 2. Détection par le titre (pattern N-M-P ou N-M-P-Q)
    const text = (exercise.title ?? '') + ' ' + (exercise.desc ?? '')
    const dashMatch = text.match(/(\d+)-(\d+)-(\d+)-(\d+)/)
    if (dashMatch) return { inhale: +dashMatch[1], hold: +dashMatch[2], exhale: +dashMatch[3], holdEmpty: +dashMatch[4] }
    const dash3 = text.match(/(\d+)-(\d+)-(\d+)/)
    if (dash3) return { inhale: +dash3[1], hold: +dash3[2], exhale: +dash3[3], holdEmpty: 0 }
    // 3. Cohérence cardiaque — "comptant jusqu'à N"
    const countMatch = text.match(/comptant[^\d]*(\d+)[^.]*\.\s*Expirez[^.]*comptant[^\d]*(\d+)/)
    if (countMatch) return { inhale: +countMatch[1], hold: 0, exhale: +countMatch[2], holdEmpty: 0 }
    // 4. Fallback 5-0-5
    return { inhale: 5, hold: 0, exhale: 5, holdEmpty: 0 }
  }, [exercise])

  const totalCycles = exercise.tool?.cycles
    ?? (() => {
      const m = (exercise.desc ?? '').match(/[Rr]épétez\s+(\d+)\s+fois/)
      return m ? +m[1] : 6
    })()

  // ── Machine à états : ancrage performance.now() — zéro dérive ─
  const phaseStartRef = useRef(null)
  const rafRef        = useRef(null)

  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return
    const durMs = ({ inhale: timings.inhale, hold: timings.hold, exhale: timings.exhale, holdEmpty: timings.holdEmpty }[phase] ?? 5) * 1000
    phaseStartRef.current = performance.now()

    const tick = (now) => {
      if (now - phaseStartRef.current < durMs) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      if (phase === 'inhale') {
        setPhase(timings.hold > 0 ? 'hold' : 'exhale')
      } else if (phase === 'hold') {
        setPhase('exhale')
      } else if (phase === 'exhale') {
        if (timings.holdEmpty > 0) { setPhase('holdEmpty'); return }
        cyclesRef.current += 1
        setCycles(cyclesRef.current)
        setPhase(cyclesRef.current >= totalCycles ? 'done' : 'inhale')
      } else if (phase === 'holdEmpty') {
        cyclesRef.current += 1
        setCycles(cyclesRef.current)
        setPhase(cyclesRef.current >= totalCycles ? 'done' : 'inhale')
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  // ── Géométrie de l'orbe ─────────────────────────────────────
  // La durée de transition CSS est calée exactement sur la phase en cours.
  // hold / holdEmpty → transition quasi-instantanée (orbe figée).
  const isExpanding  = phase === 'inhale' || phase === 'hold'
  const isActive     = phase !== 'ready' && phase !== 'done'
  const transDur     = phase === 'inhale' ? timings.inhale
                     : phase === 'exhale' ? timings.exhale
                     : 0.08  // hold / holdEmpty : pas de mouvement visible
  const easing       = phase === 'inhale' ? 'ease-in' : 'ease-out'
  const ORB_MAX      = 156
  const ORB_MIN      = 72
  const orbSize      = phase === 'ready' ? ORB_MIN + 20
                     : isExpanding       ? ORB_MAX
                     : ORB_MIN

  const LABELS = { ready:'', inhale:'INSPIREZ', hold:'RETENEZ', exhale:'EXPIREZ', holdEmpty:'POUMONS VIDES', done:'Terminé' }

  // ── Keyframes (labelFade, holdPulse) ────────────────────────
  const css = `
    @keyframes labelFade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes holdPulse { 0%,100%{opacity:.55} 50%{opacity:.85} }
  `

  // ── Arc SVG de progression de phase ─────────────────────────
  // L'arc se remplit sur toute la durée de la phase via CSS transition.
  // Quand la phase change, on repart de 0 immédiatement.
  const R    = 92, CIRC = 2 * Math.PI * R
  // phasePct passe de 0 → 1 sur toute la durée de la phase.
  // On déclenche la transition en passant de strokeDashoffset=CIRC (vide) à 0 (plein).
  // On utilise un key sur le svg pour forcer le remount à chaque changement de phase.
  const arcColor = isExpanding ? color : accent

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0 8px', gap:18 }}>
      <style>{css}</style>

      {/* ── Conteneur orbe + arc ── */}
      <div style={{ position:'relative', width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>

        {/* Arc SVG — se remplit sur la durée exacte de la phase */}
        <svg
          key={`${phase}-${cycles}`}
          width={220} height={220}
          style={{ position:'absolute', inset:0, transform:'rotate(-90deg)', overflow:'visible' }}
        >
          {/* Piste grise */}
          <circle cx={110} cy={110} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={2}/>
          {/* Arc animé */}
          {isActive && (
            <circle
              cx={110} cy={110} r={R} fill="none"
              stroke={arcColor} strokeWidth={2}
              strokeDasharray={CIRC}
              strokeDashoffset={0}
              strokeLinecap="round"
              style={{
                strokeDashoffset: CIRC,
                animation: `arcFill_${phase}_${cycles} ${transDur}s linear forwards`,
              }}
            />
          )}
          <style>{`
            @keyframes arcFill_${phase}_${cycles} {
              from { stroke-dashoffset: ${CIRC}; }
              to   { stroke-dashoffset: 0; }
            }
          `}</style>
        </svg>

        {/* Halo diffus — taille synchronisée avec l'orbe */}
        {isActive && (
          <div style={{
            position:'absolute', borderRadius:'50%',
            width:  orbSize + 48,
            height: orbSize + 48,
            background:`radial-gradient(circle, ${color}12 0%, transparent 70%)`,
            transition:`width ${transDur}s ${easing}, height ${transDur}s ${easing}`,
            pointerEvents:'none',
          }}/>
        )}

        {/* Orbe principale */}
        <div style={{
          width:  orbSize,
          height: orbSize,
          borderRadius:'50%',
          background: `radial-gradient(circle at 36% 32%, ${color}65 0%, ${color}22 50%, transparent 76%)`,
          border: `1px solid ${color}${phase === 'ready' ? '28' : isExpanding ? '70' : '42'}`,
          boxShadow: isExpanding && isActive
            ? `0 0 52px ${color}48, 0 0 22px ${color}28, inset 0 1px 0 var(--separator)`
            : isActive
              ? `0 0 18px ${color}18, inset 0 1px 0 var(--surface-3)`
              : `0 0 12px ${color}12`,
          // Transition calée sur la phase (≠ 1s figé de l'ancienne version)
          transition: `width ${transDur}s ${easing}, height ${transDur}s ${easing}, box-shadow ${transDur}s ${easing}, border-color 0.4s ease`,
          animation: (phase === 'hold' || phase === 'holdEmpty') ? 'holdPulse 2.4s ease-in-out infinite' : 'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          {phase === 'done' && <span style={{ fontSize:'var(--fs-emoji-lg, 28px)', opacity:.9 }}>✓</span>}
        </div>
      </div>

      {/* ── Label de phase ── */}
      <div
        key={phase}
        style={{
          fontSize:'var(--fs-h4, 13px)', fontWeight:500, letterSpacing:'0.20em',
          fontFamily:"'Jost',sans-serif", minHeight:20,
          color: phase === 'done' ? 'var(--green)'
               : isExpanding      ? 'rgba(var(--ritual-modal-text-rgb),0.88)'
               :                    'rgba(var(--ritual-modal-text-rgb),0.70)',
          animation: isActive ? 'labelFade .35s ease both' : 'none',
          transition:'color .4s ease',
        }}
      >
        {LABELS[phase]}
      </div>

      {/* ── Durée de la phase en cours ── */}
      {isActive && (() => {
        const d = { inhale: timings.inhale, hold: timings.hold, exhale: timings.exhale, holdEmpty: timings.holdEmpty }[phase]
        return d > 0 ? (
          <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--separator)', letterSpacing:'0.05em' }}>{d}s</div>
        ) : null
      })()}

      {/* ── Dots de cycles ── */}
      {isActive && totalCycles <= 24 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center', maxWidth:200 }}>
          {Array.from({length: Math.min(totalCycles, 20)}).map((_,i) => (
            <div key={i} style={{
              width:  i === cycles ? 8 : 5,
              height: i === cycles ? 8 : 5,
              borderRadius:'50%',
              background: i < cycles  ? `${color}55`
                        : i === cycles ? color
                        : 'var(--surface-3)',
              boxShadow: i === cycles ? `0 0 8px ${color}99` : 'none',
              transition:'all .45s ease',
              flexShrink:0,
            }}/>
          ))}
        </div>
      )}

      {/* ── Phase ready : résumé rythme + bouton ── */}
      {phase === 'ready' && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.22)', marginBottom:16, letterSpacing:'.07em', lineHeight:1.8 }}>
            {[
              `${timings.inhale}s inspire`,
              timings.hold      > 0 ? `${timings.hold}s retenir`      : null,
              `${timings.exhale}s expirer`,
              timings.holdEmpty > 0 ? `${timings.holdEmpty}s poumons vides` : null,
            ].filter(Boolean).join(' · ')}
            <br/>{totalCycles} cycles
          </div>
          <button
            onClick={() => { cyclesRef.current = 0; setCycles(0); setPhase('inhale') }}
            style={{
              padding:'11px 32px', borderRadius:100,
              border:`1px solid ${color}50`, background:`${color}16`,
              color, fontSize:'var(--fs-h4, 13px)', fontWeight:500, cursor:'pointer',
              fontFamily:"'Jost',sans-serif", letterSpacing:'.05em',
              transition:'all .2s',
            }}
          >▶ Commencer</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--green)', fontWeight:400, letterSpacing:'.07em' }}>
          Session terminée 🌿
        </div>
      )}
    </div>
  )
}

function TimerTool({ exercise, color, accent }) {
  const [seconds, setSeconds] = useState(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const totalSeconds = useMemo(() => { const m = (exercise.dur ?? '').match(/(\d+)/); return m ? parseInt(m[1]) * 60 : 180 }, [exercise.dur])
  useEffect(() => { setSeconds(totalSeconds) }, [totalSeconds])
  useEffect(() => {
    if (!running) return
    if (seconds <= 0) { setRunning(false); setDone(true); return }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, seconds])
  const pct = seconds !== null ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0
  const mins = Math.floor((seconds ?? 0) / 60)
  const secs = (seconds ?? 0) % 60
  const r = 52, circ = 2 * Math.PI * r
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0 8px', gap:12 }}>
      <div style={{ position:'relative', width:136, height:136 }}>
        <svg width={136} height={136} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={68} cy={68} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={6} />
          <circle cx={68} cy={68} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'var(--fs-h2, 26px)', fontWeight:300, color, fontFamily:"'Cormorant Garamond',serif" }}>{mins}:{String(secs).padStart(2,'0')}</span>
          {done && <span style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--green)', marginTop:2 }}>✓</span>}
        </div>
      </div>
      {!done
        ? <button onClick={() => setRunning(r => !r)} style={{ padding:'10px 24px', borderRadius:100, border:`1px solid ${color}50`, background:`${color}18`, color, fontSize:'var(--fs-h4, 13px)', fontWeight:500, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>{running ? '⏸ Pause' : seconds === totalSeconds ? '▶ Commencer' : '▶ Reprendre'}</button>
        : <div style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--green)', fontWeight:500 }}>Méditation terminée ✓</div>
      }
    </div>
  )
}

function GratitudeTool({ exercise, color, accent }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  // Utilise la description de l'exercice comme prompt contextualisé
  const prompt = exercise.desc ?? "Écrivez librement, sans filtre…"
  const placeholder = exercise.title ? `Répondez à ${exercise.title.toLowerCase()}…` : "Écrivez librement, sans filtre…"
  return (
    <div style={{ padding:'8px 0' }}>
      <div style={{ fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--ritual-modal-text-rgb),0.60)', lineHeight:1.7, marginBottom:12, fontStyle:'italic' }}>{prompt}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} style={{ width:'100%', minHeight:88, padding:'12px 14px', borderRadius:12, border:`1px solid ${color}25`, background:'var(--surface-2)', color:'rgba(var(--ritual-modal-text-rgb),0.85)', fontSize:'var(--fs-h4, 13px)', lineHeight:1.7, resize:'vertical', fontFamily:"'Jost',sans-serif", outline:'none', boxSizing:'border-box' }} />
      {text.length > 10 && !saved && <button onClick={() => setSaved(true)} style={{ marginTop:8, padding:'8px 20px', borderRadius:100, border:`1px solid ${color}40`, background:`${color}18`, color, fontSize:'var(--fs-h5, 11px)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>✓ Noté ✓</button>}
      {saved && <div style={{ marginTop:8, fontSize:'var(--fs-h5, 12px)', color:'var(--green)' }}>✓ C'est fait 🌱</div>}
    </div>
  )
}

function MovementTool({ exercise, color, accent }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const steps = useMemo(() => (exercise.desc ?? '').split(/\. (?=[A-ZÀ-ÿ0-9])/).filter(s => s.trim().length > 8).slice(0, 6), [exercise.desc])
  // Si une seule étape, afficher le texte complet avec bouton "Fait"
  if (steps.length < 2) return (
    <div style={{ padding:'8px 0' }}>
      <p style={{ fontSize:'var(--fs-h4, 13px)', color:'rgba(var(--ritual-modal-text-rgb),0.85)', lineHeight:1.8, fontWeight:300, marginBottom:14 }}>{exercise.desc}</p>
      {!done
        ? <button onClick={() => setDone(true)} style={{ padding:'9px 20px', borderRadius:100, border:`1px solid ${color}40`, background:`${color}18`, color, fontSize:'var(--fs-h5, 12px)', cursor:'pointer', fontWeight:500, fontFamily:"'Jost',sans-serif" }}>✓ C'est fait</button>
        : <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--green)' }}>✓ Mouvement accompli 🌿</div>
      }
    </div>
  )
  return (
    <div style={{ padding:'8px 0' }}>
      <div style={{ display:'flex', gap:4, marginBottom:12 }}>{steps.map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= step ? color : 'var(--surface-3)', transition:'background .3s' }} />)}</div>
      <div style={{ fontSize:'var(--fs-h5, 10px)', color:'rgba(var(--ritual-modal-text-rgb),0.30)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Étape {step+1} / {steps.length}</div>
      <p style={{ fontSize:'var(--fs-h4, 13px)', color:'rgba(var(--ritual-modal-text-rgb),0.85)', lineHeight:1.8, minHeight:60, fontWeight:300, marginBottom:14 }}>{steps[step]}</p>
      <div style={{ display:'flex', gap:8 }}>
        {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ padding:'9px 16px', borderRadius:100, border:'1px solid var(--surface-3)', background:'transparent', color:'rgba(var(--ritual-modal-text-rgb),0.40)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>← Préc.</button>}
        {step < steps.length-1
          ? <button onClick={() => setStep(s => s+1)} style={{ flex:1, padding:'9px 16px', borderRadius:100, border:`1px solid ${color}40`, background:`${color}18`, color, fontSize:'var(--fs-h5, 12px)', cursor:'pointer', fontWeight:500, fontFamily:"'Jost',sans-serif" }}>Suivant →</button>
          : <button onClick={() => setDone(true)} style={{ flex:1, padding:'9px 16px', borderRadius:100, border:`1px solid ${color}50`, background:`${color}25`, color, fontSize:'var(--fs-h5, 12px)', cursor:'pointer', fontWeight:500, fontFamily:"'Jost',sans-serif" }}>✓ Terminé</button>
        }
      </div>
      {done && <div style={{ marginTop:8, fontSize:'var(--fs-h5, 12px)', color:'var(--green)' }}>✓ Mouvement accompli 🌿</div>}
    </div>
  )
}

function VisualisationTool({ exercise, color, accent }) {
  const [wordIdx, setWordIdx] = useState(-1)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const words = useMemo(() => (exercise.desc ?? '').split(' '), [exercise.desc])
  function start() { setStarted(true); setWordIdx(0) }
  useEffect(() => {
    if (!started || done) return
    if (wordIdx >= words.length) { setDone(true); return }
    const t = setTimeout(() => setWordIdx(i => i+1), 1400)
    return () => clearTimeout(t)
  }, [started, wordIdx])
  return (
    <div style={{ padding:'8px 0' }}>
      {!started ? (
        <div style={{ textAlign:'center', paddingTop:8 }}>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--ritual-modal-text-rgb),0.30)', marginBottom:12, fontStyle:'italic' }}>Le texte va se dérouler doucement…</div>
          <button onClick={start} style={{ padding:'10px 24px', borderRadius:100, border:`1px solid ${color}50`, background:`${color}18`, color, fontSize:'var(--fs-h4, 13px)', fontWeight:500, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>▶ Commencer</button>
        </div>
      ) : (
        <p style={{ fontSize:'var(--fs-h4, 13px)', color:'rgba(var(--ritual-modal-text-rgb),0.80)', lineHeight:1.9, minHeight:80, fontWeight:300, fontStyle:'italic' }}>
          {words.slice(0, wordIdx).join(' ')}{!done && <span style={{ opacity:0.4 }}>|</span>}
          {done && <div style={{ marginTop:8, fontSize:'var(--fs-h5, 12px)', color:'var(--green)' }}>✓ Visualisation complète 🌿</div>}
        </p>
      )}
    </div>
  )
}

export function ExerciseDetail({ exercise, zone, onDone, onBack }) {
  const [marked,  setMarked]  = useState(false)
  const [started, setStarted] = useState(false)

  // ScreenMonJardin peut passer un exercice sans champ tool.
  // On cherche la version complète dans PLANT_RITUALS par titre.
  const fullExercise = useMemo(() => {
    // tool déjà présent sur l'objet — pas besoin de chercher
    if (exercise.tool !== undefined) return exercise
    // Cherche dans le cache global des rituels (chargé par useRituels)
    const cache = window.__PLANT_RITUALS_CACHE__
    if (cache) {
      for (const zone of Object.values(cache)) {
        for (const ritual of zone) {
          for (const ex of [...(ritual.quick ?? []), ...(ritual.deep ?? [])]) {
            if (ex.title === exercise.title) return ex
          }
        }
      }
    }
    return exercise
  }, [exercise])

  const type  = detectExerciseType(fullExercise)
  const toolEnabled = type === 'breath'
  const color  = zone?.color  ?? 'var(--green)'
  const accent = zone?.accent ?? 'var(--badge-lvl1)'
  const handleMark = () => { setMarked(true); setTimeout(onDone, 600) }

  return (
    <div style={{ animation:'fadeUp 0.28s ease both' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'rgba(var(--ritual-modal-text-rgb),0.45)', fontSize:'var(--fs-h5, 12px)', cursor:'pointer', marginBottom:16, padding:0, letterSpacing:'0.05em' }}>← Retour</button>

      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <span style={{ fontSize:'var(--fs-emoji-md, 24px)' }}>{exercise.icon}</span>
        <div>
          <h3 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h3, 19px)', color:'var(--ritual-modal-text)', fontWeight:400, lineHeight:1.15 }}>{exercise.title}</h3>
          <span style={{ fontSize:'var(--fs-h5, 10px)', color:accent, fontWeight:500, letterSpacing:'0.06em' }}>⏱ {exercise.dur}</span>
        </div>
      </div>
      <div style={{ height:1, background:'var(--track)', margin:'10px 0' }} />

      {/* Description — toujours visible */}
      <p style={{ fontSize:'var(--fs-h4, 13px)', color:'var(--ritual-modal-text)', lineHeight:1.85, margin:'0 0 16px', fontWeight:300 }}>{exercise.desc}</p>

      {/* Outil interactif — affiché après clic sur Commencer */}
      {toolEnabled && !started && (
        <button onClick={() => setStarted(true)} style={{
          width:'100%', padding:'12px', borderRadius:12, marginBottom:12,
          border:`1px solid ${color}40`, background:`${color}12`,
          color, fontSize:'var(--fs-h4, 13px)', fontWeight:500, cursor:'pointer',
          letterSpacing:'.04em', fontFamily:"'Jost',sans-serif",
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          ▶ Commencer l'exercice
        </button>
      )}

      {toolEnabled && started && (
        <div style={{ animation:'fadeUp 0.3s ease both' }}>
          <div style={{ height:1, background:'var(--surface-2)', margin:'0 0 4px' }} />
          {type === 'breath'        && <BreathingTool     exercise={fullExercise} color={color} accent={accent} />}
          {type === 'timer'         && <TimerTool          exercise={exercise} color={color} accent={accent} />}
          {type === 'gratitude'     && <GratitudeTool      exercise={exercise} color={color} accent={accent} />}
          {type === 'movement'      && <MovementTool       exercise={exercise} color={color} accent={accent} />}
          {type === 'visualisation' && <VisualisationTool  exercise={exercise} color={color} accent={accent} />}
        </div>
      )}

      <div style={{ height:1, background:'var(--surface-2)', margin:'12px 0' }} />

      {/* Bouton valider */}
      <button onClick={handleMark} style={{
        width:'100%', padding:14, borderRadius:12, border:'none',
        background: marked ? 'rgba(var(--green-rgb),0.25)' : `linear-gradient(135deg,${color}28,${accent}18)`,
        color: marked ? 'var(--green)' : accent,
        fontSize:'var(--fs-h4, 13px)', cursor:'pointer', fontWeight:500, letterSpacing:'0.06em',
        boxShadow:`0 0 0 1px ${marked ? 'rgba(var(--green-rgb),0.4)' : color+'35'}`,
        transition:'all 0.3s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        fontFamily:"'Jost',sans-serif",
      }}>
        {marked ? '✓ Rituel accompli !' : "✓ J'ai fait cet exercice"}
      </button>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualExercises
//  Choix quick/deep + liste des exercices
// ═══════════════════════════════════════════════════════════
function RitualExercises({ ritual, zone, onComplete, onBack }) {
  const [mode, setMode] = useState(null); // null | "quick" | "deep"
  const [activeEx, setActiveEx] = useState(null);

  if (activeEx) return (
    <ExerciseDetail
      exercise={activeEx}
      zone={zone}
      onDone={onComplete}
      onBack={() => setActiveEx(null)}
    />
  );

  // Choix du mode
  if (!mode) return (
    <div style={{ animation: "fadeUp 0.3s ease both" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", color:"rgba(var(--ritual-modal-text-rgb),0.45)", fontSize:'var(--fs-h5, 12px)', cursor:"pointer", padding:0, letterSpacing:"0.05em" }}>
          ← Retour
        </button>
        <button onClick={onBack} style={{ background:'var(--track)', border:'1px solid var(--surface-3)', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(var(--ritual-modal-text-rgb),0.55)', fontSize:'var(--fs-h4, 13px)', cursor:'pointer', lineHeight:1, flexShrink:0 }}>✕</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize:'var(--fs-emoji-md, 26px)' }}>{ritual.icon}</span>
        <h3 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h2, 20px)', color: "var(--ritual-modal-text)", fontWeight: 400, lineHeight: 1.1 }}>{ritual.text}</h3>
      </div>
      <p style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--ritual-modal-text-rgb),0.35)", fontStyle: "italic", marginBottom: 22, lineHeight: 1.5 }}>
        Comment souhaitez-vous aborder ce rituel aujourd'hui ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {/* Je sais quoi faire */}
        <button onClick={onComplete} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: `1px solid ${zone.color}35`, background: `${zone.color}0C`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink: 0 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color: zone.accent, fontWeight: 500, marginBottom: 2 }}>Je sais quoi faire</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--ritual-modal-text-rgb),0.4)" }}>Je le marque comme accompli directement.</div>
          </div>
          <span style={{ color: "rgba(var(--ritual-modal-text-rgb),0.25)", fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>

        {/* Coup de pouce */}
        <button onClick={() => setMode("quick")} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid var(--surface-3)", background: "var(--surface-1)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color: "var(--ritual-modal-text)", fontWeight: 500, marginBottom: 2 }}>J'ai besoin d'un coup de pouce</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--ritual-modal-text-rgb),0.4)" }}>3 exercices rapides · 1 à 3 minutes</div>
          </div>
          <span style={{ color: "rgba(var(--ritual-modal-text-rgb),0.25)", fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>

        {/* Je prends du temps */}
        <button onClick={() => setMode("deep")} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid var(--surface-3)", background: "var(--surface-1)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink: 0 }}>🌿</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:'var(--fs-h4, 13px)', color: "var(--ritual-modal-text)", fontWeight: 500, marginBottom: 2 }}>Je prends du temps pour ça</div>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--ritual-modal-text-rgb),0.4)" }}>3 pratiques profondes · 10 à 30 minutes</div>
          </div>
          <span style={{ color: "rgba(var(--ritual-modal-text-rgb),0.25)", fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
        </button>
      </div>
    </div>
  );

  // Liste des exercices
  const exercises = mode === "quick" ? ritual.quick : ritual.deep;
  const modeLabel = mode === "quick" ? "Coup de pouce · 1–3 min" : "Pratique profonde · 10–30 min";
  const modeColor = mode === "quick" ? "var(--gold)" : "var(--zone-breath)";

  return (
    <div style={{ animation: "fadeUp 0.28s ease both" }}>
      <button onClick={() => setMode(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(var(--ritual-modal-text-rgb),0.45)", fontSize:'var(--fs-h5, 12px)', cursor: "pointer", marginBottom: 20, padding: 0, letterSpacing: "0.05em" }}>
        ← Retour
      </button>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize:'var(--fs-h5, 10px)', textTransform: "uppercase", letterSpacing: "0.12em", color: modeColor, fontWeight: 500 }}>{modeLabel}</span>
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize:'var(--fs-h3, 18px)', color: "var(--ritual-modal-text)", fontWeight: 400, marginBottom: 18, lineHeight: 1.2 }}>Choisissez un exercice</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {exercises.map((ex, i) => (
          <button key={i} onClick={() => setActiveEx(ex)} style={{
            padding: "14px 15px", borderRadius: 12, textAlign: "left", cursor: "pointer",
            border: "1px solid var(--surface-3)", background: "var(--surface-1)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink: 0 }}>{ex.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize:'var(--fs-h4, 13px)', color: "var(--ritual-modal-text)", fontWeight: 500, marginBottom: 2 }}>{ex.title}</div>
              <span style={{ fontSize:'var(--fs-h5, 10px)', color: modeColor, fontWeight: 500, background: `${modeColor}18`, padding: "2px 8px", borderRadius: 10 }}>⏱ {ex.dur}</span>
            </div>
            <span style={{ color: "rgba(var(--ritual-modal-text-rgb),0.25)", fontSize:'var(--fs-emoji-sm, 14px)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualZoneModal
//  Modal d'une zone (liste des rituels + exercices)
//  Props : zoneId | completed | onToggle(ritualId) | onClose
// ═══════════════════════════════════════════════════════════
export function RitualZoneModal({ zoneId, completed, onToggle, onClose, plantRituals = {} }) {
  const zone = PLANT_ZONES[zoneId];
  const rituals = (plantRituals || {})[zoneId] || [];
  const done = rituals.filter(r => completed[r.id]).length;
  const pct = done / rituals.length * 100;
  const [activeRitual, setActiveRitual] = useState(null);

  const handleComplete = (ritualId) => {
    track('ritual_complete', { ritual_id: ritualId }, 'jardin', 'engagement')
    onToggle(ritualId);
    setActiveRitual(null);
  };

  return (
    <div
      className="ritual-modal-backdrop"
      onClick={!activeRitual ? onClose : undefined}
    >
      <div
        className="ritual-modal-sheet"
        style={{ background: `linear-gradient(175deg, var(--ritual-modal-bg-start, #06100A) 0%, var(--ritual-modal-bg-end, #030808) 100%)`, borderColor: zone.color + '20' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Lueur de zone en haut */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:120, background:`radial-gradient(ellipse at 50% 0%, ${zone.color}18 0%, transparent 70%)`, pointerEvents:'none', borderRadius:'22px 22px 0 0' }} />

        {activeRitual ? (
          <RitualExercises
            ritual={activeRitual}
            zone={zone}
            onComplete={() => handleComplete(activeRitual.id)}
            onBack={() => setActiveRitual(null)}
          />
        ) : (
          <>
            {/* Header zone */}
            <div className="ritual-modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                <div className="ritual-modal-zone-icon" style={{ background:`${zone.color}18`, borderColor:`${zone.color}30`, color:zone.color }}>
                  {{ roots:'🌱', stem:'🌿', leaves:'🍃', flowers:'🌸', breath:'🌬️' }[zoneId] ?? '🌿'}
                </div>
                <div>
                  <span className="ritual-modal-subtitle" style={{ color:zone.color }}>{zone.subtitle}</span>
                  <h2 className="ritual-modal-title">{zone.name}</h2>
                </div>
              </div>
              <div className="ritual-modal-pct">
                <span className="ritual-modal-pct-count" style={{ color:zone.accent }}>{Math.round(pct)}<span className="ritual-modal-pct-sign">%</span></span>
                <span className="ritual-modal-pct-label">{done}/{rituals.length} rituels</span>
              </div>
              <button onClick={onClose} className="ritual-modal-close">✕</button>
            </div>

            {/* Progress bar */}
            <div className="ritual-modal-bar">
              <div className="ritual-modal-bar-fill" style={{ background:`linear-gradient(90deg, ${zone.color}, ${zone.accent})`, width:`${pct}%` }} />
            </div>

            {/* Liste des rituels */}
            <div className="ritual-modal-list">
              {rituals.map(r => {
                const isDone = !!completed[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => { if (!isDone) setActiveRitual(r); else onToggle(r.id); }}
                    className={"ritual-item" + (isDone ? " done" : "")}
                    style={{
                      borderColor: isDone ? zone.color + '45' : 'var(--ritual-item-border, var(--surface-2))',
                      background: isDone ? zone.color + '14' : 'var(--ritual-item-bg, var(--surface-1))',
                    }}
                  >
                    <span className="ritual-item-icon">{r.icon}</span>
                    <div className="ritual-item-body">
                      <div className="ritual-item-text" style={{ color: isDone ? 'var(--ritual-modal-text)' : 'var(--ritual-modal-text)', fontWeight: isDone ? 500 : 300 }}>{r.text}</div>
                      {!isDone && <div className="ritual-item-hint">Explorer →</div>}
                      {isDone && <div className="ritual-item-done-label" style={{ color:zone.color }}>✓ Complété</div>}
                    </div>
                    <div className="ritual-item-check" style={{ borderColor: isDone ? zone.color : 'var(--separator)', background: isDone ? zone.color + '30' : 'transparent' }}>
                      {isDone && <span style={{ fontSize:'var(--fs-h5, 9px)', color:zone.accent, fontWeight:700 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualsSection
//  Section "Rituels du jour" complète
//  À insérer dans ScreenMonJardin à la place de l'ancienne section
//
//  Props :
//    degradation       : { roots, stem, leaves, flowers, breath } | null
//    completedRituals  : { [ritualId]: boolean }
//    onToggleRitual    : (ritualId) => void
//    onQuizComplete    : (degradation) => void  (appelé après quiz)
// ═══════════════════════════════════════════════════════════
export function RitualsSection({ degradation, completedRituals, onToggleRitual, onQuizComplete, plantRituals = {} }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeZone, setActiveZone] = useState(null);

  // Si pas encore de dégradation, proposer le quiz
  const hasDegradation = degradation !== null && degradation !== undefined;

  // Trier les zones par dégradation décroissante (prioritaire en premier)
  const sortedZones = Object.keys(PLANT_ZONES).sort((a, b) => {
    if (!hasDegradation) return 0;
    return (degradation[b] ?? 50) - (degradation[a] ?? 50);
  });

  const handleQuizComplete = (deg) => {
    setShowQuiz(false);
    onQuizComplete(deg);
  };

  const handleQuizSkip = () => {
    setShowQuiz(false);
    // Dégradation par défaut à 50 pour toutes les zones
    onQuizComplete({ roots: 50, stem: 50, leaves: 50, flowers: 50, breath: 50 });
  };

  return (
    <>
      {/* ── Quiz modal si besoin ── */}
      {showQuiz && (
        <DailyQuizModal
          onComplete={handleQuizComplete}
          onSkip={handleQuizSkip}
        />
      )}

      {/* ── Modal zone active ── */}
      {activeZone && (
        <RitualZoneModal
          zoneId={activeZone}
          completed={completedRituals}
          onToggle={onToggleRitual}
          onClose={() => setActiveZone(null)}
        />
      )}

      {/* ── Section principale ── */}
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Titre section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize:'var(--fs-h5, 10px)', textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--ritual-modal-text-rgb),0.3)", marginBottom: 3 }}>Rituels du jour</p>
            <p style={{ fontSize:'var(--fs-h5, 12px)', color: "rgba(var(--ritual-modal-text-rgb),0.45)", lineHeight: 1.4 }}>
              {hasDegradation ? "Zones triées par priorité" : "Prenez votre bilan intérieur"}
            </p>
          </div>
          {hasDegradation && (
            <button
              onClick={() => setShowQuiz(true)}
              style={{ fontSize:'var(--fs-h5, 10px)', color: "rgba(var(--ritual-modal-text-rgb),0.3)", background: "none", border: "1px solid var(--surface-3)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.05em" }}
            >
              ↺ Refaire le bilan
            </button>
          )}
        </div>

        {/* Bouton quiz si pas encore fait */}
        {!hasDegradation && (
          <button
            onClick={() => setShowQuiz(true)}
            style={{
              width: "100%", padding: "18px 20px", borderRadius: 16, marginBottom: 16,
              border: "1px solid rgba(var(--gold-warm-rgb),0.25)", background: "rgba(var(--gold-warm-rgb),0.07)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
            }}
          >
            <span style={{ fontSize:'var(--fs-emoji-lg, 28px)' }}>🌹</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize:'var(--fs-h4, 13px)', color: "var(--gold-warm)", fontWeight: 500, marginBottom: 3 }}>Prendre mon bilan du jour</div>
              <div style={{ fontSize:'var(--fs-h5, 11px)', color: "rgba(var(--ritual-modal-text-rgb),0.4)" }}>10 questions · 2 minutes · révèle vos zones prioritaires</div>
            </div>
            <span style={{ color: "rgba(var(--gold-warm-rgb),0.4)", fontSize:'var(--fs-emoji-sm, 16px)' }}>→</span>
          </button>
        )}

        {/* Grille des zones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {sortedZones.map((zoneId, index) => {
            const zone = PLANT_ZONES[zoneId];
            const rituals = (plantRituals || {})[zoneId] || [];
            const doneCount = rituals.filter(r => completedRituals[r.id]).length;
            const deg = hasDegradation ? (degradation[zoneId] ?? 50) : 50;
            const health = Math.max(5, 100 - deg);
            const isPriority = hasDegradation && deg >= 65 && doneCount === 0;
            const isFirst = hasDegradation && index === 0 && deg >= 60;

            return (
              <button
                key={zoneId}
                onClick={() => setActiveZone(zoneId)}
                style={{
                  padding: "13px 14px", borderRadius: 13, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${doneCount > 0 ? `${zone.color}35` : isPriority ? `${zone.color}40` : "var(--surface-2)"}`,
                  background: doneCount > 0 ? `${zone.color}08` : isPriority ? `${zone.color}06` : "var(--surface-1)",
                  transition: "all 0.25s ease",
                  gridColumn: isFirst ? "1 / -1" : "auto", // zone la plus urgente en pleine largeur
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize:'var(--fs-h5, 11px)', color: zone.color, fontWeight: 500, letterSpacing: "0.03em" }}>{zone.name}</span>
                  <span style={{ fontSize:'var(--fs-h5, 12px)', color: zone.accent, fontWeight: 500 }}>{health}%</span>
                </div>
                <div style={{ height: 2.5, borderRadius: 2, background: "var(--surface-2)", marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${health}%`, background: `linear-gradient(90deg, ${zone.color}, ${zone.accent})`, borderRadius: 2, transition: "width 1.2s ease" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize:'var(--fs-h5, 10px)', color: "rgba(var(--ritual-modal-text-rgb),0.28)" }}>
                    {doneCount}/{rituals.length} rituel{doneCount !== 1 ? "s" : ""}
                    {isPriority && !isFirst ? " · prioritaire" : ""}
                  </span>
                  {isPriority && (
                    <span style={{ fontSize:'var(--fs-h5, 9px)', color: zone.color, background: `${zone.color}20`, padding: "2px 7px", borderRadius: 8, fontWeight: 500 }}>
                      {isFirst ? "🔴 Prioritaire" : "⚡"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  HOOK : useRitualsState
//  Gère le state rituals + persistence localStorage
//  À utiliser dans ScreenMonJardin
// ═══════════════════════════════════════════════════════════
export function useRitualsState() {
  const [degradation, setDegradation] = useState(null);
  const [completedRituals, setCompletedRituals] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);

  const STORAGE_KEY = "mafleur-rituels-v1";
  const todayKey = new Date().toISOString().slice(0, 10);

  // Chargement au mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === todayKey) {
          if (data.degradation) setDegradation(data.degradation);
          if (data.completed) setCompletedRituals(data.completed);
          return; // données d'aujourd'hui trouvées, pas de quiz
        }
      }
      // Pas de données ou date différente → quiz à faire
      setShowQuiz(true);
    } catch (e) {
      setShowQuiz(true);
    }
  }, []);

  const handleQuizComplete = (deg) => {
    setDegradation(deg);
    setShowQuiz(false);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, date: todayKey, degradation: deg }));
    } catch (e) {}
  };

  const handleToggleRitual = (ritualId) => {
    const updated = { ...completedRituals, [ritualId]: !completedRituals[ritualId] };
    setCompletedRituals(updated);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, completed: updated }));
    } catch (e) {}
  };

  return {
    degradation,
    completedRituals,
    showQuiz,
    handleQuizComplete,
    handleToggleRitual,
  };
}

// ═══════════════════════════════════════════════════════════
//  EXEMPLE D'UTILISATION dans ScreenMonJardin
//  (copier dans votre composant existant)
// ═══════════════════════════════════════════════════════════
/*

function ScreenMonJardin() {
  const {
    degradation,
    completedRituals,
    showQuiz,
    handleQuizComplete,
    handleToggleRitual,
  } = useRitualsState();

  return (
    <div>
      // ... reste de votre ScreenMonJardin

      // Remplacez votre section "Rituels du jour" par :
      <RitualsSection
        degradation={degradation}
        completedRituals={completedRituals}
        onToggleRitual={handleToggleRitual}
        onQuizComplete={handleQuizComplete}
      />

      // Le quiz s'affiche automatiquement si showQuiz === true
      // (géré en interne par RitualsSection)
    </div>
  );
}

*/
