// src/Entreprise/AgentChat.jsx
import { useState, useRef, useEffect, useCallback } from "react";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

// ── Renderer markdown léger ──────────────────────────────────────────────────
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} style={{ fontWeight: 600, color: "#1a2e18" }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*"))
      return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} style={{ background: "#f0f4ee", padding: "1px 5px", borderRadius: 4, fontSize: "12px", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

function Markdown({ text }) {
  const lines = (text ?? "").split("\n");
  const out   = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table markdown
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[-| :]+\|/)) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      i += 2; // skip separator
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()));
        i++;
      }
      out.push(
        <div key={i} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>{headers.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1.5px solid #dde8d8", color: "#3B6D11", fontWeight: 600, whiteSpace: "nowrap" }}>{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, j) => <tr key={j} style={{ borderBottom: ".5px solid #eef1eb" }}>
                {row.map((cell, k) => <td key={k} style={{ padding: "6px 10px", verticalAlign: "top" }}>{renderInline(cell)}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      out.push(<div key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#27500A", letterSpacing: ".06em", textTransform: "uppercase", margin: "14px 0 4px" }}>{renderInline(line.slice(4))}</div>);
    } else if (line.startsWith("## ")) {
      out.push(<div key={i} style={{ fontSize: "14px", fontWeight: 600, color: "#1a2e18", margin: "16px 0 6px", fontFamily: "Georgia,serif" }}>{renderInline(line.slice(3))}</div>);
    } else if (line.startsWith("# ")) {
      out.push(<div key={i} style={{ fontSize: "16px", fontWeight: 600, color: "#1a2e18", margin: "16px 0 8px", fontFamily: "Georgia,serif" }}>{renderInline(line.slice(2))}</div>);
    } else if (line === "---" || line === "***") {
      out.push(<hr key={i} style={{ border: "none", borderTop: ".5px solid #dde8d8", margin: "12px 0" }} />);
    } else if (line.match(/^[-*] /)) {
      out.push(
        <div key={i} style={{ display: "flex", gap: "8px", padding: "2px 0" }}>
          <span style={{ color: "#3B6D11", flexShrink: 0, marginTop: 1 }}>·</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1];
      out.push(
        <div key={i} style={{ display: "flex", gap: "8px", padding: "2px 0" }}>
          <span style={{ color: "#3B6D11", flexShrink: 0, minWidth: 16, fontWeight: 600 }}>{num}.</span>
          <span>{renderInline(line.replace(/^\d+\. /, ""))}</span>
        </div>
      );
    } else if (line === "") {
      out.push(<div key={i} style={{ height: "8px" }} />);
    } else {
      out.push(<div key={i} style={{ lineHeight: "1.7" }}>{renderInline(line)}</div>);
    }
    i++;
  }
  return <div style={{ fontSize: "13px", color: "#2a3d28" }}>{out}</div>;
}

const AGENT_URL = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/entreprise-agent";

const SUGGESTIONS = [
  "Donne-moi un état général de l'appli",
  "Combien d'abonnés premium actifs en ce moment ?",
  "Quelle a été l'activité des 7 derniers jours ?",
  "Montre-moi les derniers contenus générés",
];

// ── Persistance localStorage par agent ──────────────────────────────────────
const storageKey  = (id) => `mji_chat_msgs_${id}`;
const sessionKey  = (id) => `mji_chat_session_${id}`;

const loadMsgs    = (id) => { try { return JSON.parse(localStorage.getItem(storageKey(id))) ?? []; } catch { return []; } };
const saveMsgs    = (id, msgs) => { try { localStorage.setItem(storageKey(id), JSON.stringify(msgs)); } catch {} };
const getSession  = (id) => {
  let s = localStorage.getItem(sessionKey(id));
  if (!s) { s = `${id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; localStorage.setItem(sessionKey(id), s); }
  return s;
};

// ── TTS : parle phrase par phrase, appelle onDone quand terminé ──────────────
function speakWithCallback(text, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  window.speechSynthesis.cancel();

  const fire = (voices) => {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
    let i = 0;
    const next = () => {
      if (i >= sentences.length) { onDone?.(); return; }
      const utt   = new SpeechSynthesisUtterance(sentences[i++]);
      utt.lang    = "fr-FR";
      utt.rate    = 1.08;
      utt.pitch   = 1;
      const fr    = voices.find(v => v.lang.startsWith("fr")) ?? voices[0];
      if (fr) utt.voice = fr;
      utt.onend   = next;
      utt.onerror = next;
      window.speechSynthesis.speak(utt);
    };
    next();
  };

  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) fire(v);
  else window.speechSynthesis.addEventListener("voiceschanged",
    () => fire(window.speechSynthesis.getVoices()), { once: true });
}

// ── Config modals par agent ──────────────────────────────────────────────────
const AGENT_HELP = {
  maestro: {
    role: "MAX est ton assistant de direction. Il a accès en temps réel à toutes tes données Supabase et à tes workflows n8n. C'est le seul qui peut déclencher des actions concrètes.",
    quand: "Quand tu veux savoir ce qui se passe dans l'appli, ou déclencher une action directement.",
    exemples: [
      "Combien d'utilisateurs actifs cette semaine ?",
      "Liste mes workflows n8n et dis-moi lesquels tournent",
      "Déclenche le workflow de génération de contenu",
      "Cherche l'utilisateur avec l'email X",
    ],
    tips: "Sois direct et précis. MAX aime les questions avec un objectif clair. Si tu veux une action, dis-le explicitement.",
  },
  stratege: {
    role: "SAM est ton consultant commercial. Il connaît les stratégies d'acquisition, de conversion freemium→premium, le pricing, les benchmarks du secteur bien-être (Headspace, Petit Bambou...) et les plateformes (App Store, Stripe, Systeme.io).",
    quand: "Quand tu as un problème business à résoudre ou une décision stratégique à prendre.",
    exemples: [
      "J'ai 61 users et 0 abonnements payants, qu'est-ce que je fais ?",
      "Comment je convertis mes pros en ambassadeurs payants ?",
      "Quel prix mettre pour maximiser les conversions ?",
      "Comment je devrais structurer mon onboarding pour réduire le churn ?",
    ],
    tips: "Donne-lui du contexte. Plus tu lui expliques ta situation, plus ses recommandations sont précises. Demande-lui toujours les 3 options (rapide / moyen terme / long terme).",
  },
  growth: {
    role: "LÉO est ton analyste data. Il lit tes chiffres, cherche les anomalies, les opportunités cachées et traduit les métriques SaaS (MRR, churn, LTV, CAC) en décisions actionnables. Il est factuel — il ne te rassure pas.",
    quand: "Quand tu veux comprendre ce qui se passe vraiment dans tes chiffres ou identifier un levier de croissance.",
    exemples: [
      "Analyse mon activation — est-ce que les users terminent l'onboarding ?",
      "Quel est mon vrai taux de churn sur les 30 derniers jours ?",
      "Où est-ce que je perds le plus d'utilisateurs dans le funnel ?",
      "Montre-moi les dernières exécutions n8n — est-ce que le contenu tourne bien ?",
    ],
    tips: "Laisse LÉO interroger les données avant de conclure. S'il dit que les chiffres sont mauvais, c'est qu'ils le sont — c'est sa valeur. Demande-lui toujours '1 action prioritaire'.",
  },
  contenu: {
    role: "LUCIE est ta directrice éditoriale. Elle planifie, structure et repurpose ton contenu sur tous les canaux. Elle connaît les algorithmes Instagram, TikTok, LinkedIn et le ton de MJI : poétique, ancré, humain.",
    quand: "Quand tu veux produire du contenu, planifier ta semaine éditoriale ou repurposer une idée sur plusieurs formats.",
    exemples: [
      "Génère un planning éditorial pour la semaine prochaine",
      "J'ai une idée sur les rituels du matin — transforme-la en 5 formats différents",
      "Écris un hook Instagram qui arrête le scroll sur le thème de la fleur intérieure",
      "Quelle stratégie de contenu pour attirer des coachs professionnels ?",
    ],
    tips: "Donne-lui une idée brute, même imparfaite. LUCIE sait la structurer. Précise le réseau cible si tu en as un. Demande-lui toujours le repurposing pour maximiser chaque idée.",
  },
};

function AgentModal({ agentId, agentName, agentFullName, agentColor, agentBg, onClose, onAsk }) {
  const help = AGENT_HELP[agentId] ?? AGENT_HELP.maestro;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0 0" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600,
          maxHeight: "85vh", overflowY: "auto", padding: "24px 20px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ background: agentBg, border: `.5px solid ${agentColor}30`,
            borderRadius: 12, padding: "10px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: agentColor, fontFamily: "Georgia,serif" }}>{agentFullName}</div>
            <div style={{ fontSize: 11, color: agentColor, opacity: .7, marginTop: 2 }}>Agent IA · Back-office MJI</div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f5f1", border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#8a9e88" }}>✕</button>
        </div>

        {/* Rôle */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", color: "#8a9e88", marginBottom: 6 }}>RÔLE</div>
          <div style={{ fontSize: 13, color: "#2a3d28", lineHeight: 1.75 }}>{help.role}</div>
        </div>

        {/* Quand l'utiliser */}
        <div style={{ background: agentBg, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", color: agentColor, marginBottom: 4 }}>QUAND L'UTILISER</div>
          <div style={{ fontSize: 13, color: agentColor, lineHeight: 1.65 }}>{help.quand}</div>
        </div>

        {/* Exemples */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", color: "#8a9e88", marginBottom: 8 }}>EXEMPLES DE QUESTIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {help.exemples.map((ex, i) => (
              <button key={i} onClick={() => { onAsk(ex); onClose(); }}
                style={{ textAlign: "left", padding: "9px 13px", borderRadius: 10,
                  border: `.5px solid ${agentColor}25`, background: "#f9faf8",
                  color: "#2a3d28", fontSize: 13, cursor: "pointer", lineHeight: 1.5, fontFamily: "inherit" }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{ background: "#f3f5f1", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", color: "#8a9e88", marginBottom: 4 }}>💡 CONSEIL</div>
          <div style={{ fontSize: 12, color: "#6b7c69", lineHeight: 1.65, fontStyle: "italic" }}>{help.tips}</div>
        </div>
      </div>
    </div>
  );
}

// ── Reconnaissance vocale ────────────────────────────────────────────────────
const SR = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// ── Composant mode vocal ─────────────────────────────────────────────────────
const STATES = {
  idle:     { label: "Toucher pour parler",  pulse: false, bg: "#f3f5f1", ring: "#dde8d8", icon: "🎙" },
  listening:{ label: "J'écoute…",            pulse: true,  bg: "#fff0ee", ring: "#f0a090", icon: "🎙" },
  thinking: { label: "Max réfléchit…",   pulse: true,  bg: "#EAF3DE", ring: "#C0DD97", icon: "⏳" },
  speaking: { label: "Max répond…",      pulse: true,  bg: "#EAF3DE", ring: "#3B6D11", icon: "🔊" },
};

function VoiceOrb({ state, onClick }) {
  const s = STATES[state];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <button onClick={onClick}
        style={{ width: 96, height: 96, borderRadius: "50%", border: `3px solid ${s.ring}`,
          background: s.bg, cursor: "pointer", fontSize: 36,
          boxShadow: s.pulse ? `0 0 0 12px ${s.ring}40, 0 0 0 24px ${s.ring}18` : "none",
          transition: "all .3s",
          animation: s.pulse ? "orb-pulse 1.6s ease-in-out infinite" : "none" }}>
        {s.icon}
      </button>
      <span style={{ fontSize: 13, color: "#6b7c69", letterSpacing: ".04em" }}>{s.label}</span>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function AgentChat({ agentId = "maestro", agentName = "MAX", agentFullName = "MAX · MAESTRO", agentDesc = "Orchestrateur IA · données temps réel · actions", agentColor = "#1c3818", agentBg = "#EAF3DE", agentPhoto = "" }) {
  const [msgs,        setMsgs]       = useState(() => loadMsgs(agentId));
  const [input,       setInput]      = useState("");
  const [loading,     setLoading]    = useState(false);
  const [showHelp,    setShowHelp]   = useState(false);
  const [voiceMode,   setVoiceMode]  = useState(false);
  const [voiceState,  _setVoiceState]= useState("idle");
  const [sessionId]                  = useState(() => getSession(agentId));

  // Wrapper setMsgs qui persiste aussi dans localStorage
  const setAndSaveMsgs = useCallback((updater) => {
    setMsgs(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveMsgs(agentId, next);
      return next;
    });
  }, [agentId]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(storageKey(agentId));
    localStorage.removeItem(sessionKey(agentId));
    setMsgs([]);
  }, [agentId]);
  const isMobile    = useIsMobile();
  const bottomRef   = useRef(null);
  const recRef      = useRef(null);
  const loopRef     = useRef(false);
  const vsRef       = useRef("idle"); // ref synchrone — évite les closures périmées

  // Setter qui maintient ref + state en sync
  const setVoiceState = (s) => { vsRef.current = s; _setVoiceState(s); };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); stopRec(); }, []);

  // ── Arrêt micro ────────────────────────────────────────────────────────────
  const stopRec = useCallback(() => {
    try { recRef.current?.abort(); } catch {}
    recRef.current = null;
  }, []);

  // ── Démarrage micro ────────────────────────────────────────────────────────
  const startRec = useCallback(() => {
    if (!SR || !loopRef.current) return;
    stopRec();
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setVoiceState("listening");

    rec.onerror = (e) => {
      // "no-speech" = silence normal, on relance
      if (loopRef.current && vsRef.current === "listening") {
        setTimeout(startRec, 600);
      }
    };

    rec.onend = () => {
      // Ne relancer que si on est bien en écoute (pas en train de parler ou de penser)
      if (loopRef.current && vsRef.current === "listening") {
        setTimeout(startRec, 400);
      }
    };

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) {
        stopRec(); // couper le micro AVANT d'envoyer
        sendVoice(text);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch {}
  }, [stopRec]);

  // ── Envoi vocal (séparé pour éviter les dépendances circulaires) ───────────
  const sendVoice = useCallback(async (content) => {
    if (!content || !loopRef.current) return;
    setVoiceState("thinking");
    setLoading(true);

    setAndSaveMsgs(prev => {
      const next = [...prev, { role: "user", content }];

      fetch(AGENT_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: next, session_id: sessionId, agent_id: agentId }),
      })
        .then(r => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json(); })
        .then(data => {
          if (data.error) throw new Error(data.error);
          setAndSaveMsgs(p => [...p, { role: "assistant", content: data.text }]);

          if (loopRef.current) {
            setVoiceState("speaking");
            stopRec(); // s'assurer que le micro est bien coupé pendant le TTS
            speakWithCallback(data.text, () => {
              setLoading(false);
              if (loopRef.current) {
                // Tampon 800ms après la fin du TTS avant de réécouter
                setTimeout(() => {
                  setVoiceState("listening");
                  startRec();
                }, 800);
              } else {
                setVoiceState("idle");
              }
            });
          } else {
            setLoading(false);
          }
        })
        .catch(e => {
          setAndSaveMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message}`, err: true }]);
          setVoiceState("idle");
          setLoading(false);
        });

      return next;
    });
  }, [sessionId, stopRec, startRec]);

  // ── Envoi texte ────────────────────────────────────────────────────────────
  const send = useCallback(async (content) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;
    setInput("");

    const next = [...msgs, { role: "user", content: text }];
    setAndSaveMsgs(next);
    setLoading(true);

    try {
      const res = await fetch(AGENT_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: next, session_id: sessionId, agent_id: agentId }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAndSaveMsgs(p => [...p, { role: "assistant", content: data.text }]);
    } catch (e) {
      setAndSaveMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message}`, err: true }]);
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, input, sessionId]);

  // ── Activer / désactiver le mode vocal ────────────────────────────────────
  const enterVoiceMode = useCallback(() => {
    loopRef.current = true;
    setVoiceMode(true);
    setVoiceState("listening");
    startRec();
  }, [startRec]);

  const exitVoiceMode = useCallback(() => {
    loopRef.current = false;
    stopRec();
    window.speechSynthesis?.cancel();
    setVoiceMode(false);
    setVoiceState("idle");
  }, [stopRec]);

  const handleOrb = useCallback(() => {
    if (vsRef.current === "idle") startRec();
    else if (vsRef.current === "listening") {
      stopRec();
      setVoiceState("idle");
    }
    // en thinking/speaking : on ne coupe pas
  }, [startRec, stopRec]);

  // ── Rendu mode vocal ───────────────────────────────────────────────────────
  if (voiceMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", height: "calc(100vh - 140px)", maxHeight: 680, padding: "32px 0 16px" }}>

        {/* Dernière réponse */}
        <div style={{ width: "100%", maxHeight: "40%", overflowY: "auto" }}>
          {msgs.filter(m => m.role === "assistant").slice(-1).map((m, i) => (
            <div key={i} style={{ background: "#fff", border: ".5px solid #dde8d8", borderRadius: "12px",
              padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <Markdown text={m.content} />
            </div>
          ))}
        </div>

        {/* Orbe vocal */}
        <VoiceOrb state={voiceState} onClick={handleOrb} />

        {/* Bouton quitter */}
        <button onClick={exitVoiceMode}
          style={{ padding: "10px 28px", borderRadius: "20px", border: ".5px solid #dde8d8",
            background: "#f3f5f1", color: "#6b7c69", cursor: "pointer", fontSize: "13px" }}>
          ✕ Terminer la conversation
        </button>

        <style>{`
          @keyframes orb-pulse {
            0%,100% { box-shadow: 0 0 0 4px var(--ring,#dde8d8)40; }
            50%      { box-shadow: 0 0 0 18px transparent; }
          }
        `}</style>
      </div>
    );
  }

  // ── JSX partagés (inlinés pour éviter le remontage sur chaque frappe) ────────
  const headerJSX = (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      paddingBottom:12, marginBottom:12, borderBottom:`.5px solid ${agentColor}20` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {agentPhoto && <img src={agentPhoto} alt={agentName} style={{ width:isMobile?36:44, height:isMobile?36:44, borderRadius:"50%", objectFit:"cover", border:`2px solid ${agentColor}30`, flexShrink:0 }} />}
        <div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?13:16, fontWeight:600, color:agentColor }}>{agentFullName}</div>
          {!isMobile && <div style={{ fontSize:11, color:agentColor, opacity:.6, marginTop:2 }}>{agentDesc}</div>}
        </div>
      </div>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        {SR && !isMobile && (
          <button onClick={enterVoiceMode} style={{ padding:"5px 12px", borderRadius:20, border:".5px solid #C0DD97", background:"#EAF3DE", color:"#27500A", cursor:"pointer", fontSize:11, fontWeight:500 }}>
            🎙 Vocal
          </button>
        )}
        <button onClick={clearHistory} style={{ padding:"4px 10px", borderRadius:20, border:".5px solid #dde8d8", background:"#f3f5f1", color:"#8a9e88", cursor:"pointer", fontSize:11 }}>↺ Nouveau</button>
        <button onClick={() => setShowHelp(true)} style={{ width:26, height:26, borderRadius:"50%", border:`.5px solid ${agentColor}40`, background:agentBg, color:agentColor, cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>?</button>
      </div>
    </div>
  );

  const welcomeJSX = (
    <div>
      <div style={{ background:agentBg, border:`.5px solid ${agentColor}30`, borderRadius:12, padding:"16px 18px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {agentPhoto && <img src={agentPhoto} alt={agentName} style={{ width:isMobile?56:72, height:isMobile?56:72, borderRadius:"50%", objectFit:"cover", border:`2.5px solid ${agentColor}30`, flexShrink:0 }} />}
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:isMobile?15:18, fontWeight:600, color:agentColor, marginBottom:4 }}>{agentFullName}</div>
            <div style={{ fontSize:isMobile?12:13, color:agentColor, opacity:.75, lineHeight:1.6 }}>{agentDesc}</div>
          </div>
        </div>
        <button onClick={() => setShowHelp(true)} style={{ width:28, height:28, borderRadius:"50%", border:`.5px solid ${agentColor}40`, background:"rgba(255,255,255,.6)", color:agentColor, cursor:"pointer", fontSize:13, fontWeight:700, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>?</button>
      </div>
      {SR && isMobile && (
        <button onClick={enterVoiceMode} style={{ width:"100%", padding:10, borderRadius:10, border:".5px solid #C0DD97", background:"#EAF3DE", color:"#27500A", cursor:"pointer", fontSize:13, fontWeight:500, marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          🎙 Démarrer le mode vocal
        </button>
      )}
      <p style={{ fontSize:10, fontWeight:500, letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" }}>SUGGESTIONS</p>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:6 }}>
        {SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={() => send(s)} style={{ textAlign:"left", padding:"10px 14px", borderRadius:10, border:".5px solid #dde8d8", background:"#f3f5f1", color:"#3d4d3b", cursor:"pointer", fontSize:13, lineHeight:1.4, fontFamily:"inherit" }}>{s}</button>
        ))}
      </div>
    </div>
  );

  const messagesJSX = (
    <div style={{ flex:1, overflowY:"auto", paddingBottom:12 }}>
      {msgs.length === 0 ? welcomeJSX : msgs.map((m,i) => (
        <div key={i} style={{ marginBottom:10, display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
          <div style={{ maxWidth:isMobile?"88%":"72%", padding:m.role==="user"?"10px 14px":"12px 16px", borderRadius:m.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px", background:m.role==="user"?"#1c3818":m.err?"#fff0ee":"#fff", border:m.role==="user"?"none":`.5px solid ${m.err?"#f0a090":"#dde8d8"}`, boxShadow:m.role==="assistant"?"0 1px 4px rgba(0,0,0,.04)":"none" }}>
            {m.role==="user"
              ? <span style={{ fontSize:isMobile?13:14, color:"#c8e6b0", lineHeight:1.65 }}>{m.content}</span>
              : <Markdown text={m.content} />}
            {m.role==="assistant" && !m.err && (
              <button onClick={() => speakWithCallback(m.content,()=>{})} style={{ display:"block", marginTop:8, background:"none", border:"none", color:"#c8d5c5", fontSize:11, cursor:"pointer", padding:0 }}>🔊 Réécouter</button>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display:"flex", marginBottom:10 }}>
          <div style={{ padding:"12px 16px", borderRadius:"14px 14px 14px 3px", background:"#fff", border:".5px solid #dde8d8", display:"flex", gap:5 }}>
            {[0,1,2].map(j => <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:"#C0DD97", animation:`mji-dot 1.2s ${j*.2}s ease-in-out infinite` }} />)}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );

  const inputJSX = (
    <div style={{ borderTop:".5px solid #dde8d8", paddingTop:12 }}>
      <div style={{ display:"flex", gap:8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(input); } }}
          placeholder="Écris ta question…"
          rows={isMobile?2:3}
          style={{ flex:1, padding:"10px 14px", borderRadius:10, border:".5px solid #dde8d8", background:"#fff", color:"#1a2e18", fontSize:isMobile?13:14, fontFamily:"inherit", resize:"none", outline:"none", lineHeight:1.55 }}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:input.trim()&&!loading?"#2d5a27":"#c8d5c5", color:input.trim()&&!loading?"#c8e6b0":"#8a9e88", cursor:input.trim()&&!loading?"pointer":"not-allowed", fontSize:22, flexShrink:0 }}>↑</button>
      </div>
      {!isMobile && <div style={{ fontSize:10, color:"#b0bfae", marginTop:5 }}>Entrée · envoyer · Shift+Entrée · nouvelle ligne</div>}
    </div>
  );

  const modalJSX = showHelp && <AgentModal agentId={agentId} agentName={agentName} agentFullName={agentFullName} agentColor={agentColor} agentBg={agentBg} onClose={() => setShowHelp(false)} onAsk={q => send(q)} />;
  const styleJSX = <style>{`@keyframes mji-dot{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:1;transform:scale(1.2)}}@keyframes orb-pulse{0%,100%{opacity:.8}50%{opacity:1}}`}</style>;

  // ── Rendu PC ────────────────────────────────────────────────────────────────
  if (!isMobile) return (
    <div style={{ display:"flex", gap:20, height:"calc(100vh - 130px)" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {headerJSX}
        {messagesJSX}
        {inputJSX}
      </div>
      <div style={{ width:260, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background:agentBg, border:`.5px solid ${agentColor}30`, borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:".1em", color:agentColor, marginBottom:10 }}>AGENT</div>
          {agentPhoto && (
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <img src={agentPhoto} alt={agentName} style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover", border:`2px solid ${agentColor}25`, flexShrink:0 }} />
              <div style={{ fontSize:14, fontWeight:600, color:agentColor, fontFamily:"Georgia,serif" }}>{agentFullName}</div>
            </div>
          )}
          <div style={{ fontSize:11, color:agentColor, opacity:.7, lineHeight:1.6 }}>{AGENT_HELP[agentId]?.quand}</div>
          <button onClick={() => setShowHelp(true)} style={{ marginTop:10, width:"100%", padding:"7px", borderRadius:8, border:`.5px solid ${agentColor}30`, background:"rgba(255,255,255,.5)", color:agentColor, cursor:"pointer", fontSize:11, fontWeight:500 }}>Voir les exemples →</button>
        </div>
        {SR && <button onClick={enterVoiceMode} style={{ padding:"10px", borderRadius:10, border:".5px solid #C0DD97", background:"#EAF3DE", color:"#27500A", cursor:"pointer", fontSize:12, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>🎙 Mode vocal · dialogue continu</button>}
        <div style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:12, padding:"14px 16px", flex:1 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:".1em", color:"#8a9e88", marginBottom:8 }}>ACCÈS RAPIDE</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {SUGGESTIONS.map((s,i) => <button key={i} onClick={() => send(s)} style={{ textAlign:"left", padding:"8px 10px", borderRadius:8, border:".5px solid #eef1eb", background:"#f9faf8", color:"#3d4d3b", cursor:"pointer", fontSize:11, lineHeight:1.4, fontFamily:"inherit" }}>{s}</button>)}
          </div>
        </div>
      </div>
      {modalJSX}{styleJSX}
    </div>
  );

  // ── Rendu Mobile ────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 130px)" }}>
      {msgs.length > 0 && headerJSX}
      {messagesJSX}
      {inputJSX}
      {modalJSX}{styleJSX}
    </div>
  );
}
