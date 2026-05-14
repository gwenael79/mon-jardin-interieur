// src/Entreprise/CommercialStudio.jsx
import { useState, useCallback, useEffect } from "react";
import { sb }                               from "./config/supabase";
import { callClaude, MJI_SYS }             from "./services/claude";

const STAGES = {
  b2c: {
    color:"#27500A", bg:"#EAF3DE", bd:"#C0DD97",
    items:[
      { id:"welcome",   label:"Bienvenue J0",    sub:"Premier contact app" },
      { id:"ob_j3",     label:"Onboarding J3",   sub:"Rituel qui s'ancre" },
      { id:"ob_j7",     label:"Onboarding J7",   sub:"Première semaine" },
      { id:"conv_j14",  label:"Conversion J14",  sub:"Vers Premium" },
      { id:"conv_j21",  label:"Conversion J21",  sub:"Dernière fenêtre" },
      { id:"fidelite",  label:"Fidélisation M1", sub:"Abonné actif" },
    ],
  },
  b2b: {
    color:"#0C447C", bg:"#E6F1FB", bd:"#B5D4F4",
    items:[
      { id:"intro",     label:"Premier contact", sub:"Découverte Pro" },
      { id:"pf_j1",     label:"Pro Free J1",     sub:"Guide démarrage" },
      { id:"pf_j7",     label:"Pro Free J7",     sub:"1ère utilisation" },
      { id:"commission",label:"1ère commission", sub:"Activation" },
      { id:"upgrade",   label:"Upgrade Premium", sub:"50€/an" },
      { id:"rapport_q", label:"Rapport trim.",   sub:"Fidélisation Pro" },
    ],
  },
};

const S = {
  card: { background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" },
  lbl:  { fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" },
};
const dateStr = d => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

function CopyBtn({ text, id, copied, setCopied }) {
  return (
    <button onClick={() => { navigator.clipboard.writeText(text||"").catch(()=>{}); setCopied(id); setTimeout(()=>setCopied(""),2000); }}
      style={{ fontSize:"11px", padding:"3px 9px", borderRadius:"20px", border:".5px solid #dde8d8",
        background:"transparent", color: copied===id ? "#3B6D11":"#8a9e88", cursor:"pointer", flexShrink:0 }}>
      {copied===id ? "✓" : "Copier"}
    </button>
  );
}

export default function CommercialStudio() {
  const [tab,     setTab]    = useState("generate");
  const [funnel,  setFunnel] = useState("b2c");
  const [stageId, setStage]  = useState(null);
  const [loading, setLoading]= useState(false);
  const [result,  setResult] = useState(null);
  const [error,   setError]  = useState(null);
  const [copied,  setCopied] = useState("");
  const [saved,   setSaved]  = useState(false);
  const [history, setHistory]= useState(null);

  const fd    = STAGES[funnel];
  const stage = fd.items.find(s => s.id === stageId);

  const loadHistory = useCallback(async () => {
    try { setHistory(await sb("mji_emails?select=*&order=created_at.desc&limit=40")); }
    catch { setHistory([]); }
  }, []);

  useEffect(() => { if (tab==="history") loadHistory(); }, [tab, loadHistory]);

  const generate = async () => {
    if (!stage) return;
    setLoading(true); setResult(null); setError(null); setSaved(false);
    const ctx = funnel==="b2c"
      ? `Email utilisateur individuel à l'étape "${stage.label}" (${stage.sub}).`
      : `Email professionnel (coach/thérapeute) à l'étape "${stage.label}" (${stage.sub}). Rappelle : 10% remise clients, 10% commission abonnements, 85% ventes ateliers.`;
    try {
      const r = await callClaude(
        MJI_SYS("Commercial"),
        `${ctx}\nJSON: {"subject":"Objet max 50 car.","preview":"Aperçu max 90 car.","body":"Corps max 180 mots avec \\n, CTA clair, signe L'équipe Mon Jardin Intérieur 🌿"}`
      );
      setResult(r);
      await sb("mji_emails", { method:"POST", body:{ funnel, stage:stage.label, subject:r.subject, preview:r.preview, body:r.body } });
      setSaved(true);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
        {["generate","history"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:"8px", borderRadius:"8px", cursor:"pointer",
              border:  tab===t ? `.5px solid ${fd.bd}`:".5px solid #dde8d8",
              background: tab===t ? fd.bg:"#f3f5f1",
              color:      tab===t ? fd.color:"#6b7c69",
              fontSize:"12px", fontWeight: tab===t ? "500":"400" }}>
            {t==="generate" ? "Générer" : `Historique ${history ? `(${history.length})`:""}` }
          </button>
        ))}
      </div>

      {tab==="generate" && (
        <>
          <p style={S.lbl}>AUDIENCE</p>
          <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
            {["b2c","b2b"].map(f => {
              const c = STAGES[f];
              return (
                <button key={f} onClick={() => { setFunnel(f); setStage(null); setResult(null); }}
                  style={{ flex:1, padding:"9px", borderRadius:"8px", cursor:"pointer",
                    border: funnel===f ? `.5px solid ${c.bd}`:".5px solid #dde8d8",
                    background: funnel===f ? c.bg:"#f3f5f1",
                    color:      funnel===f ? c.color:"#6b7c69",
                    fontSize:"12px", fontWeight: funnel===f ? "500":"400" }}>
                  {f==="b2c" ? "B2C · Utilisateurs" : "B2B · Professionnels"}
                </button>
              );
            })}
          </div>

          <p style={S.lbl}>ÉTAPE DU PARCOURS</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"6px", marginBottom:"14px" }}>
            {fd.items.map(s => (
              <div key={s.id} onClick={() => { setStage(s.id); setResult(null); setSaved(false); }}
                style={{ border: `.5px solid ${stageId===s.id ? fd.bd:"#d8e0d5"}`,
                  background: stageId===s.id ? fd.bg:"#f3f5f1",
                  color:      stageId===s.id ? fd.color:"#3d4d3b",
                  borderRadius:"8px", padding:"10px 12px", cursor:"pointer" }}>
                <div style={{ fontSize:"12px", fontWeight:"500" }}>{s.label}</div>
                <div style={{ fontSize:"10px", opacity:.75, marginTop:"2px" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <button onClick={generate} disabled={!stage||loading}
            style={{ width:"100%", padding:"11px", borderRadius:"10px", border:"none", marginBottom:"12px",
              background: stage&&!loading ? "#2d5a27":"#c8d5c5",
              color:      stage&&!loading ? "#c8e6b0":"#8a9e88",
              cursor:     stage&&!loading ? "pointer":"not-allowed",
              fontSize:"14px", fontWeight:"500", fontFamily:"Georgia,serif" }}>
            {loading ? "🌱 Rédaction…" : stage ? `Générer + sauvegarder · ${stage.label} ↗` : "Sélectionne une étape"}
          </button>

          {error && <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#993c1d", marginBottom:"10px" }}>{error}</div>}
          {saved  && <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#27500A", marginBottom:"10px" }}>✓ Sauvegardé dans Supabase</div>}

          {result && (
            <div>
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={S.lbl}>OBJET</span>
                  <CopyBtn text={result.subject} id="subj" copied={copied} setCopied={setCopied} />
                </div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:"15px", fontWeight:"600", color:"#1a2e18", marginBottom: result.preview?"4px":0 }}>{result.subject}</div>
                {result.preview && <div style={{ fontSize:"11px", color:"#8a9e88", fontStyle:"italic" }}>{result.preview}</div>}
              </div>
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={S.lbl}>CORPS DE L'EMAIL</span>
                  <CopyBtn text={result.body} id="body" copied={copied} setCopied={setCopied} />
                </div>
                <pre style={{ fontSize:"13px", color:"#1a2e18", margin:0, whiteSpace:"pre-wrap", lineHeight:"1.85" }}>{result.body}</pre>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`OBJET: ${result.subject}\n\n${result.preview||""}\n\n${result.body}`).catch(()=>{}); setCopied("all"); setTimeout(()=>setCopied(""),2000); }}
                style={{ width:"100%", padding:"9px", borderRadius:"10px", border:`.5px solid ${fd.bd}`,
                  background:fd.bg, color:fd.color, cursor:"pointer", fontSize:"13px", fontWeight:"500", marginBottom:"8px" }}>
                {copied==="all" ? "✓ Email complet copié" : "Copier l'email complet"}
              </button>
              <button onClick={() => { setResult(null); generate(); }}
                style={{ width:"100%", padding:"9px", borderRadius:"10px", border:".5px solid #dde8d8", background:"#f3f5f1", color:"#6b7c69", cursor:"pointer", fontSize:"13px" }}>
                Regénérer ↻
              </button>
            </div>
          )}
        </>
      )}

      {tab==="history" && (
        !history
          ? <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Chargement…</div>
          : history.length===0
          ? <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Aucun email généré.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {history.map(e => (
                <div key={e.id} style={{ ...S.card, margin:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:"8px", marginBottom:"6px" }}>
                    <div style={{ display:"flex", gap:"5px" }}>
                      <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px",
                        background: e.funnel==="b2c"?"#EAF3DE":"#E6F1FB",
                        color:      e.funnel==="b2c"?"#27500A":"#0C447C" }}>
                        {e.funnel.toUpperCase()}
                      </span>
                      <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:"#f3f5f1", color:"#6b7c69" }}>{e.stage}</span>
                    </div>
                    <span style={{ fontSize:"10px", color:"#b0bfae", flexShrink:0 }}>{dateStr(e.created_at)}</span>
                  </div>
                  <div style={{ fontSize:"13px", fontWeight:"500", color:"#1a2e18", marginBottom:"3px" }}>{e.subject}</div>
                  {e.preview && <div style={{ fontSize:"11px", color:"#8a9e88", fontStyle:"italic" }}>{e.preview}</div>}
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
