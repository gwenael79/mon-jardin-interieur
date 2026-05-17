// src/Entreprise/MeetingRoom.jsx
import { useState, useRef, useEffect, useCallback } from "react";

// ── Markdown léger (partagé avec AgentChat) ───────────────────────────────────
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
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[-| :]+\|/)) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()));
        i++;
      }
      out.push(
        <div key={i} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>{headers.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1.5px solid #dde8d8", color: "#3B6D11", fontWeight: 600 }}>{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} style={{ borderBottom: ".5px solid #eef1eb" }}>
                  {row.map((cell, k) => <td key={k} style={{ padding: "6px 10px", verticalAlign: "top" }}>{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    if (line.startsWith("### "))
      out.push(<div key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#27500A", letterSpacing: ".06em", textTransform: "uppercase", margin: "14px 0 4px" }}>{renderInline(line.slice(4))}</div>);
    else if (line.startsWith("## "))
      out.push(<div key={i} style={{ fontSize: "14px", fontWeight: 600, color: "#1a2e18", margin: "16px 0 6px", fontFamily: "Georgia,serif" }}>{renderInline(line.slice(3))}</div>);
    else if (line.startsWith("# "))
      out.push(<div key={i} style={{ fontSize: "16px", fontWeight: 600, color: "#1a2e18", margin: "16px 0 8px", fontFamily: "Georgia,serif" }}>{renderInline(line.slice(2))}</div>);
    else if (line === "---")
      out.push(<hr key={i} style={{ border: "none", borderTop: ".5px solid #dde8d8", margin: "12px 0" }} />);
    else if (line.match(/^[-*] /))
      out.push(<div key={i} style={{ display: "flex", gap: "8px", padding: "2px 0" }}><span style={{ color: "#3B6D11", flexShrink: 0, marginTop: 1 }}>·</span><span>{renderInline(line.slice(2))}</span></div>);
    else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1];
      out.push(<div key={i} style={{ display: "flex", gap: "8px", padding: "2px 0" }}><span style={{ color: "#3B6D11", flexShrink: 0, minWidth: 16, fontWeight: 600 }}>{num}.</span><span>{renderInline(line.replace(/^\d+\. /, ""))}</span></div>);
    } else if (line === "")
      out.push(<div key={i} style={{ height: "8px" }} />);
    else
      out.push(<div key={i} style={{ lineHeight: "1.7" }}>{renderInline(line)}</div>);
    i++;
  }
  return <div style={{ fontSize: "13px", color: "#2a3d28" }}>{out}</div>;
}

// ── Config agents ─────────────────────────────────────────────────────────────
const AGENTS = [
  { id: "maestro",  name: "MAX",   fullName: "MAX · MAESTRO",   role: "Données temps réel",  color: "#1c4818", bg: "#EAF3DE", accent: "#3B6D11" },
  { id: "stratege", name: "SAM",   fullName: "SAM · STRATÈGE",  role: "Stratégie business",  color: "#3d1870", bg: "#F0EAFA", accent: "#7C3AED" },
  { id: "growth",   name: "LÉO",   fullName: "LÉO · GROWTH",    role: "Data & croissance",   color: "#1a3a70", bg: "#EAF1FA", accent: "#2563EB" },
  { id: "contenu",  name: "LUCIE", fullName: "LUCIE · CONTENU", role: "Éditorial & social",  color: "#701838", bg: "#FAEAEE", accent: "#DB2777" },
];

const AGENT_URL = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/entreprise-agent";

const STARTERS = [
  "Faites le point complet sur l'état de l'appli",
  "Quelles sont nos 3 priorités pour ce mois ?",
  "Analysez nos points forts et faiblesses actuels",
  "Comment accélérer la conversion freemium → premium ?",
];

// ── Composant principal ───────────────────────────────────────────────────────
export default function MeetingRoom() {
  const [msgs,       setMsgs]      = useState([]);
  const [input,      setInput]     = useState("");
  const [activeIds,  setActiveIds] = useState(() => new Set(AGENTS.map(a => a.id)));
  const [thinkingId, setThinkingId]= useState(null);
  const [loading,    setLoading]   = useState(false);
  const [isMobile,   setIsMobile]  = useState(() => window.innerWidth < 768);
  const bottomRef = useRef(null);
  const sessionId = useRef(`meeting_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).current;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, thinkingId]);

  const toggleAgent = (id) => {
    setActiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = useCallback(async (override) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    // Snapshot avant la mise à jour d'état
    const snapshot = msgs;
    setMsgs(prev => [...prev, { role: "user", content: text }]);

    // Historique API aplati (les réponses agents sont préfixées par leur nom)
    const baseHistory = snapshot.map(m => ({
      role: m.role,
      content: m.agentName ? `[${m.agentName}] ${m.content}` : m.content,
    }));

    const orderedAgents = AGENTS.filter(a => activeIds.has(a.id));
    // Accumulateur du tour courant : chaque agent voit les réponses de ses prédécesseurs
    const roundAcc = [];

    for (const agent of orderedAgents) {
      setThinkingId(agent.id);
      try {
        const res = await fetch(AGENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...baseHistory,
              { role: "user", content: text },
              ...roundAcc,
            ],
            session_id: sessionId,
            agent_id:   agent.id,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Injecter dans l'accumulateur pour le prochain agent
        roundAcc.push({
          role:    "assistant",
          content: `[${agent.name} — ${agent.fullName}] ${data.text}`,
        });

        setMsgs(prev => [...prev, {
          role:          "assistant",
          agentId:       agent.id,
          agentName:     agent.name,
          agentFullName: agent.fullName,
          content:       data.text,
        }]);
      } catch (e) {
        roundAcc.push({ role: "assistant", content: `[${agent.name}] Erreur` });
        setMsgs(prev => [...prev, {
          role:          "assistant",
          agentId:       agent.id,
          agentName:     agent.name,
          agentFullName: agent.fullName,
          content:       `⚠️ ${e.message}`,
          err:           true,
        }]);
      }
    }

    setThinkingId(null);
    setLoading(false);
  }, [input, loading, msgs, activeIds, sessionId]);

  const agentOf = (id) => AGENTS.find(a => a.id === id);
  const thinkingAgent = agentOf(thinkingId);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>

      {/* ── En-tête + barre agents ── */}
      <div style={{ borderBottom: ".5px solid #dde8d8", paddingBottom: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: isMobile ? 14 : 17, fontWeight: 600, color: "#1a2e18" }}>
              Salle de Réunion
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11, color: "#8a9e88", marginTop: 2 }}>
                Tous vos agents · dialogue croisé · vision à 360°
              </div>
            )}
          </div>
          <button
            onClick={() => setMsgs([])}
            style={{ padding: "4px 12px", borderRadius: 20, border: ".5px solid #dde8d8", background: "#f3f5f1", color: "#8a9e88", cursor: "pointer", fontSize: 11 }}
          >
            ↺ Nouveau
          </button>
        </div>

        {/* Cartes agents cliquables */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {AGENTS.map(agent => {
            const active   = activeIds.has(agent.id);
            const thinking = thinkingId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                title={active ? "Cliquer pour désactiver" : "Cliquer pour activer"}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                  padding:    isMobile ? "6px 11px" : "7px 14px",
                  borderRadius: 20,
                  border:     `1.5px solid ${active ? agent.accent : "#dde8d8"}`,
                  background: active ? agent.bg : "#f3f5f1",
                  color:      active ? agent.color : "#aab8a8",
                  cursor:     "pointer", fontSize: 12, fontWeight: 600,
                  transition: "all .2s",
                  opacity:    active ? 1 : 0.55,
                }}
              >
                {/* Point de statut */}
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background:  active ? agent.accent : "#c8d5c5",
                  flexShrink:  0,
                  animation:   thinking ? "mr-pulse 1s ease-in-out infinite" : "none",
                  transition:  "background .2s",
                }} />
                {agent.name}
                {thinking && <span style={{ fontSize: 10, fontWeight: 400, opacity: .8 }}>réfléchit…</span>}
                {!isMobile && !thinking && (
                  <span style={{ fontSize: 10, fontWeight: 400, opacity: .6 }}>{agent.role}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Zone messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0 8px" }}>
        {msgs.length === 0 ? (
          // Écran d'accueil
          <div style={{ padding: isMobile ? "8px 0" : "16px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🪑</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 16, color: "#1a2e18", fontWeight: 600, marginBottom: 6 }}>
                La salle de réunion est prête
              </div>
              <div style={{ fontSize: 13, color: "#8a9e88", lineHeight: 1.7 }}>
                Posez une question — chaque agent actif répond à son tour,<br />
                en tenant compte des réponses précédentes.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  style={{
                    textAlign: "left", padding: "12px 16px", borderRadius: 12,
                    border: ".5px solid #dde8d8", background: "#fff",
                    color: "#3d4d3b", cursor: "pointer", fontSize: 13,
                    lineHeight: 1.5, fontFamily: "inherit",
                    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i}>
                  {/* Séparateur entre les tours */}
                  {i > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 14px" }}>
                      <div style={{ flex: 1, height: ".5px", background: "#dde8d8" }} />
                      <div style={{ fontSize: 10, color: "#b0bfae", letterSpacing: ".06em", whiteSpace: "nowrap" }}>
                        NOUVELLE QUESTION
                      </div>
                      <div style={{ flex: 1, height: ".5px", background: "#dde8d8" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                    <div style={{
                      maxWidth: isMobile ? "85%" : "65%",
                      padding: "10px 14px",
                      borderRadius: "14px 14px 3px 14px",
                      background: "#1c3818",
                    }}>
                      <span style={{ fontSize: 13, color: "#c8e6b0", lineHeight: 1.65 }}>{m.content}</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Réponse d'un agent
            const agent = agentOf(m.agentId) ?? AGENTS[0];
            return (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                {/* Avatar */}
                <div style={{
                  flexShrink: 0,
                  width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
                  borderRadius: "50%",
                  background: agent.bg,
                  border: `1.5px solid ${agent.accent}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: agent.color }}>
                    {agent.name[0]}
                  </span>
                </div>

                {/* Bulle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: agent.accent, marginBottom: 4, letterSpacing: ".04em" }}>
                    {agent.fullName}
                  </div>
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "3px 14px 14px 14px",
                    background: m.err ? "#fff0ee" : "#fff",
                    border: `.5px solid ${m.err ? "#f0a090" : agent.accent + "25"}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                  }}>
                    <Markdown text={m.content} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Indicateur de réflexion */}
        {thinkingAgent && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{
              flexShrink: 0,
              width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
              borderRadius: "50%",
              background: thinkingAgent.bg,
              border: `1.5px solid ${thinkingAgent.accent}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: thinkingAgent.color }}>
                {thinkingAgent.name[0]}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: thinkingAgent.accent, marginBottom: 4 }}>
                {thinkingAgent.fullName}
              </div>
              <div style={{
                padding: "12px 16px",
                borderRadius: "3px 14px 14px 14px",
                background: "#fff",
                border: `.5px solid ${thinkingAgent.accent}25`,
                display: "flex", gap: 5,
              }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: thinkingAgent.accent,
                    animation: `mr-dot 1.2s ${j * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Zone de saisie ── */}
      <div style={{ borderTop: ".5px solid #dde8d8", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Posez une question à tous les agents…"
            rows={isMobile ? 2 : 3}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: ".5px solid #dde8d8",
              background: loading ? "#f9faf8" : "#fff",
              color: "#1a2e18", fontSize: isMobile ? 13 : 14,
              fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.55,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: input.trim() && !loading ? "#2d5a27" : "#c8d5c5",
              color:      input.trim() && !loading ? "#c8e6b0" : "#8a9e88",
              cursor:     input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: 22, flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
        {!isMobile && (
          <div style={{ fontSize: 10, color: "#b0bfae", marginTop: 5 }}>
            Entrée · envoyer · Shift+Entrée · nouvelle ligne
          </div>
        )}
      </div>

      <style>{`
        @keyframes mr-dot {
          0%,100% { opacity: .25; transform: scale(.9); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes mr-pulse {
          0%,100% { transform: scale(1);   opacity: .8; }
          50%      { transform: scale(1.6); opacity: 1;  }
        }
      `}</style>
    </div>
  );
}
