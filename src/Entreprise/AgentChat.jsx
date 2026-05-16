// src/Entreprise/AgentChat.jsx
import { useState, useRef, useEffect, useCallback } from "react";

const AGENT_URL = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/entreprise-agent";

const SUGGESTIONS = [
  "Donne-moi un état général de l'appli",
  "Combien d'abonnés premium actifs en ce moment ?",
  "Quelle a été l'activité des 7 derniers jours ?",
  "Montre-moi les derniers contenus générés",
];

const genSession = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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

// ── Reconnaissance vocale ────────────────────────────────────────────────────
const SR = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// ── Composant mode vocal ─────────────────────────────────────────────────────
const STATES = {
  idle:     { label: "Toucher pour parler",  pulse: false, bg: "#f3f5f1", ring: "#dde8d8", icon: "🎙" },
  listening:{ label: "J'écoute…",            pulse: true,  bg: "#fff0ee", ring: "#f0a090", icon: "🎙" },
  thinking: { label: "MAESTRO réfléchit…",   pulse: true,  bg: "#EAF3DE", ring: "#C0DD97", icon: "⏳" },
  speaking: { label: "MAESTRO répond…",      pulse: true,  bg: "#EAF3DE", ring: "#3B6D11", icon: "🔊" },
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
export default function AgentChat() {
  const [msgs,       setMsgs]      = useState([]);
  const [input,      setInput]     = useState("");
  const [loading,    setLoading]   = useState(false);
  const [voiceMode,  setVoiceMode] = useState(false);
  const [voiceState, setVoiceState]= useState("idle");
  const [sessionId]                = useState(genSession);
  const bottomRef                  = useRef(null);
  const recRef                     = useRef(null);
  const loopRef                    = useRef(true); // contrôle la boucle vocale

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); stopRec(); }, []);

  // ── Envoi (texte ou voix) ──────────────────────────────────────────────────
  const send = useCallback(async (content, isVoice = false) => {
    if (!content?.trim() || loading) return;
    setInput("");
    if (isVoice) setVoiceState("thinking");

    const next = [...msgs, { role: "user", content: content.trim() }];
    setMsgs(next);
    setLoading(true);

    try {
      const res = await fetch(AGENT_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: next, session_id: sessionId }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMsgs(p => [...p, { role: "assistant", content: data.text }]);

      if (isVoice && loopRef.current) {
        setVoiceState("speaking");
        speakWithCallback(data.text, () => {
          // Après avoir parlé → réécouter si le mode est encore actif
          if (loopRef.current) {
            setVoiceState("listening");
            startRec(true);
          } else {
            setVoiceState("idle");
          }
        });
      }
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message}`, err: true }]);
      if (isVoice) setVoiceState("idle");
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, sessionId]);

  // ── Reconnaissance vocale ──────────────────────────────────────────────────
  const stopRec = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
  }, []);

  const startRec = useCallback((auto = false) => {
    if (!SR) return;
    stopRec();
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setVoiceState("listening");
    rec.onerror = () => {
      if (loopRef.current) {
        setVoiceState("listening");
        setTimeout(() => startRec(true), 800);
      }
    };
    rec.onend = () => {
      // Si aucun résultat et mode actif → réécouter
      if (loopRef.current && voiceState === "listening") {
        setTimeout(() => startRec(true), 400);
      }
    };
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) send(text, true);
    };

    recRef.current = rec;
    rec.start();
    if (!auto) setVoiceState("listening");
  }, [send, stopRec, voiceState]);

  // ── Activer / désactiver le mode vocal ────────────────────────────────────
  const enterVoiceMode = useCallback(() => {
    loopRef.current = true;
    setVoiceMode(true);
    setVoiceState("listening");
    startRec(false);
  }, [startRec]);

  const exitVoiceMode = useCallback(() => {
    loopRef.current = false;
    stopRec();
    window.speechSynthesis?.cancel();
    setVoiceMode(false);
    setVoiceState("idle");
  }, [stopRec]);

  const handleOrb = useCallback(() => {
    if (voiceState === "idle") startRec(false);
    else if (voiceState === "listening") stopRec(); // pause manuelle
    // en thinking/speaking : on ne coupe pas
  }, [voiceState, startRec, stopRec]);

  // ── Rendu mode vocal ───────────────────────────────────────────────────────
  if (voiceMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", height: "calc(100vh - 140px)", maxHeight: 680, padding: "32px 0 16px" }}>

        {/* Dernière réponse */}
        <div style={{ width: "100%", maxHeight: "40%", overflowY: "auto" }}>
          {msgs.filter(m => m.role === "assistant").slice(-1).map((m, i) => (
            <div key={i} style={{ background: "#fff", border: ".5px solid #dde8d8", borderRadius: "12px",
              padding: "12px 14px", fontSize: "13px", color: "#1a2e18", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
              {m.content}
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

  // ── Rendu mode texte ───────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", maxHeight: 680 }}>

      {/* Bouton mode vocal */}
      {SR && (
        <button onClick={enterVoiceMode}
          style={{ width: "100%", padding: "11px", borderRadius: "10px", border: ".5px solid #C0DD97",
            background: "#EAF3DE", color: "#27500A", cursor: "pointer", fontSize: "13px",
            fontWeight: "500", marginBottom: "12px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px" }}>
          🎙 Démarrer le mode vocal · dialogue continu
        </button>
      )}

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>

        {msgs.length === 0 && (
          <div>
            <div style={{ background: "#EAF3DE", border: ".5px solid #C0DD97", borderRadius: "12px",
              padding: "14px 16px", marginBottom: "16px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "15px", fontWeight: "600",
                color: "#1c3818", marginBottom: "4px" }}>MAESTRO · Orchestrateur IA</div>
              <div style={{ fontSize: "13px", color: "#3B6D11", lineHeight: "1.7" }}>
                Lance le mode vocal pour un dialogue continu, ou écris ci-dessous.
              </div>
            </div>
            <p style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em",
              color: "#8a9e88", margin: "0 0 8px" }}>SUGGESTIONS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ textAlign: "left", padding: "10px 14px", borderRadius: "10px",
                    border: ".5px solid #dde8d8", background: "#f3f5f1", color: "#3d4d3b",
                    cursor: "pointer", fontSize: "13px", lineHeight: "1.4", fontFamily: "inherit" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: "10px", display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
              background:   m.role === "user" ? "#1c3818" : m.err ? "#fff0ee" : "#fff",
              border:       m.role === "user" ? "none" : `.5px solid ${m.err ? "#f0a090" : "#dde8d8"}`,
              color:        m.role === "user" ? "#c8e6b0" : m.err ? "#993c1d" : "#1a2e18",
              fontSize: "13px", lineHeight: "1.75", whiteSpace: "pre-wrap",
            }}>
              {m.content}
              {m.role === "assistant" && !m.err && (
                <button onClick={() => speakWithCallback(m.content, () => {})}
                  style={{ display: "block", marginTop: "6px", background: "none", border: "none",
                    color: "#b0bfae", fontSize: "11px", cursor: "pointer", padding: 0 }}>
                  🔊 Réécouter
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "12px 12px 12px 3px",
              background: "#fff", border: ".5px solid #dde8d8", display: "flex", gap: "5px" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{ width: "6px", height: "6px", borderRadius: "50%",
                  background: "#C0DD97", animation: `mji-dot 1.2s ${j * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone saisie texte */}
      <div style={{ borderTop: ".5px solid #dde8d8", paddingTop: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ou écris ta question…"
            rows={2}
            style={{ flex: 1, padding: "10px 12px", borderRadius: "10px",
              border: ".5px solid #dde8d8", background: "#fff", color: "#1a2e18",
              fontSize: "13px", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: "1.5" }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            style={{ padding: "10px 18px", borderRadius: "10px", border: "none",
              background: input.trim() && !loading ? "#2d5a27" : "#c8d5c5",
              color:      input.trim() && !loading ? "#c8e6b0" : "#8a9e88",
              cursor:     input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: "20px", flexShrink: 0 }}>↑</button>
        </div>
      </div>

      <style>{`
        @keyframes mji-dot {
          0%,100% { opacity:.25; transform:scale(.9); }
          50%      { opacity:1;   transform:scale(1.2); }
        }
        @keyframes orb-pulse {
          0%,100% { opacity:.8; }
          50%      { opacity:1; }
        }
      `}</style>
    </div>
  );
}
