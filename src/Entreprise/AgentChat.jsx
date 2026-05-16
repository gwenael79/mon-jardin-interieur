// src/Entreprise/AgentChat.jsx
import { useState, useRef, useEffect } from "react";

const AGENT_URL = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/entreprise-agent";

const SUGGESTIONS = [
  "Donne-moi un état général de l'appli",
  "Combien d'abonnés premium actifs en ce moment ?",
  "Quelle a été l'activité des 7 derniers jours ?",
  "Montre-moi les derniers contenus générés",
];

const genSession = () => `s_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

export default function AgentChat() {
  const [msgs,     setMsgs]    = useState([]);
  const [input,    setInput]   = useState("");
  const [loading,  setLoading] = useState(false);
  const [sessionId]            = useState(genSession);
  const bottomRef              = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const next = [...msgs, { role:"user", content }];
    setMsgs(next);
    setLoading(true);

    try {
      const res = await fetch(AGENT_URL, {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify({ messages: next, session_id: sessionId }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMsgs(p => [...p, { role:"assistant", content: data.text }]);
    } catch (e) {
      setMsgs(p => [...p, { role:"assistant", content:`⚠️ ${e.message}`, err:true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 140px)", maxHeight:"680px" }}>

      {/* Zone messages */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:"12px" }}>

        {msgs.length === 0 && (
          <div>
            <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"12px",
              padding:"14px 16px", marginBottom:"16px" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:"15px", fontWeight:"600",
                color:"#1c3818", marginBottom:"4px" }}>MAESTRO · Orchestrateur IA</div>
              <div style={{ fontSize:"13px", color:"#3B6D11", lineHeight:"1.7" }}>
                Je connais tout l'écosystème Mon Jardin Intérieur — utilisateurs,
                contenus, métriques. Pose-moi n'importe quelle question.
              </div>
            </div>
            <p style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em",
              color:"#8a9e88", margin:"0 0 8px" }}>SUGGESTIONS</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ textAlign:"left", padding:"10px 14px", borderRadius:"10px",
                    border:".5px solid #dde8d8", background:"#f3f5f1", color:"#3d4d3b",
                    cursor:"pointer", fontSize:"13px", lineHeight:"1.4", fontFamily:"inherit" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom:"10px", display:"flex",
            justifyContent: m.role==="user" ? "flex-end":"flex-start" }}>
            <div style={{
              maxWidth:"85%", padding:"10px 14px",
              borderRadius: m.role==="user" ? "12px 12px 3px 12px":"12px 12px 12px 3px",
              background:   m.role==="user" ? "#1c3818" : m.err ? "#fff0ee":"#fff",
              border:       m.role==="user" ? "none":`.5px solid ${m.err?"#f0a090":"#dde8d8"}`,
              color:        m.role==="user" ? "#c8e6b0" : m.err ? "#993c1d":"#1a2e18",
              fontSize:"13px", lineHeight:"1.75", whiteSpace:"pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", marginBottom:"10px" }}>
            <div style={{ padding:"12px 16px", borderRadius:"12px 12px 12px 3px",
              background:"#fff", border:".5px solid #dde8d8", display:"flex", gap:"5px" }}>
              {[0,1,2].map(j => (
                <div key={j} style={{ width:"6px", height:"6px", borderRadius:"50%",
                  background:"#C0DD97",
                  animation:`mji-dot 1.2s ${j*0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Zone saisie */}
      <div style={{ borderTop:".5px solid #dde8d8", paddingTop:"12px" }}>
        <div style={{ display:"flex", gap:"8px" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pose une question à MAESTRO…"
            rows={2}
            style={{ flex:1, padding:"10px 12px", borderRadius:"10px",
              border:".5px solid #dde8d8", background:"#fff", color:"#1a2e18",
              fontSize:"13px", fontFamily:"inherit", resize:"none", outline:"none", lineHeight:"1.5" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ padding:"10px 18px", borderRadius:"10px", border:"none",
              background: input.trim() && !loading ? "#2d5a27":"#c8d5c5",
              color:      input.trim() && !loading ? "#c8e6b0":"#8a9e88",
              cursor:     input.trim() && !loading ? "pointer":"not-allowed",
              fontSize:"20px", flexShrink:0 }}>↑</button>
        </div>
        <div style={{ fontSize:"10px", color:"#b0bfae", marginTop:"6px", textAlign:"center" }}>
          Entrée · envoyer · Shift+Entrée · nouvelle ligne
        </div>
      </div>

      <style>{`
        @keyframes mji-dot {
          0%,100% { opacity:.25; transform:scale(.9); }
          50%      { opacity:1;   transform:scale(1.2); }
        }
      `}</style>
    </div>
  );
}
