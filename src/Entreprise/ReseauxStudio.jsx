// src/Entreprise/ReseauxStudio.jsx
import { useState, useCallback, useEffect } from "react";
import { sb }           from "./config/supabase";
import { callClaude, MJI_SYS } from "./services/claude";

const PILLARS = [
  { id:"rituel",    label:"Rituel du jour",     bg:"#EAF3DE", bd:"#C0DD97", tx:"#27500A" },
  { id:"neuro",     label:"Neuro & science",    bg:"#EEEDFE", bd:"#AFA9EC", tx:"#26215C" },
  { id:"fleur",     label:"Ma fleur & moi",     bg:"#FBEAF0", bd:"#ED93B1", tx:"#4B1528" },
  { id:"temoignage",label:"Témoignages",         bg:"#E1F5EE", bd:"#5DCAA5", tx:"#04342C" },
  { id:"pratique",  label:"Bien-être pratique",  bg:"#FAEEDA", bd:"#EF9F27", tx:"#412402" },
];

const PLATFORMS = ["instagram","tiktok","linkedin"];
const PLAT_LABEL = { instagram:"Instagram", tiktok:"TikTok", linkedin:"LinkedIn" };
const PLAT_ICON  = { instagram:"IG", tiktok:"TK", linkedin:"LI" };

const S = {
  card:  { background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" },
  lbl:   { fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" },
  tag:   { display:"inline-block", background:"#f3f5f1", color:"#6b7c69", fontSize:"11px", padding:"2px 8px", borderRadius:"20px", margin:"2px" },
  chip:  (on, tx, bg, bd) => ({ border:`.5px solid ${on ? bd:"#d8e0d5"}`, background:on ? bg:"#f3f5f1", color:on ? tx:"#6b7c69", borderRadius:"8px", padding:"9px 11px", cursor:"pointer", fontSize:"11px", fontWeight:on?"500":"400", lineHeight:"1.3", textAlign:"left" }),
};

const dateStr = d => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

function CopyBtn({ text, id, copied, setCopied }) {
  return (
    <button onClick={() => { navigator.clipboard.writeText(text||"").catch(()=>{}); setCopied(id); setTimeout(()=>setCopied(""),2000); }}
      style={{ fontSize:"11px", padding:"3px 9px", borderRadius:"20px", border:".5px solid #dde8d8",
        background:"transparent", color: copied===id ? "#3B6D11":"#8a9e88",
        cursor:"pointer", flexShrink:0 }}>
      {copied===id ? "✓" : "Copier"}
    </button>
  );
}

export default function ReseauxStudio() {
  const [tab,    setTab]    = useState("generate");
  const [plat,   setPlat]   = useState("instagram");
  const [pillId, setPillId] = useState(null);
  const [loading,setLoading]= useState(false);
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState(null);
  const [copied, setCopied] = useState("");
  const [saved,  setSaved]  = useState(false);
  const [history,setHistory]= useState(null);

  const pillar = PILLARS.find(p => p.id === pillId);

  const loadHistory = useCallback(async () => {
    try { setHistory(await sb("mji_posts?select=*&order=created_at.desc&limit=30")); }
    catch { setHistory([]); }
  }, []);

  useEffect(() => { if (tab==="history") loadHistory(); }, [tab, loadHistory]);

  const generate = async () => {
    if (!pillar) return;
    setLoading(true); setResult(null); setError(null); setSaved(false);
    const fmt = { instagram:"post Instagram Reel/carousel, caption aérée avec \\n", tiktok:"script TikTok dynamique et direct", linkedin:"post LinkedIn thought leadership pour professionnels du bien-être" };
    try {
      const r = await callClaude(
        MJI_SYS("Réseaux sociaux"),
        `Génère un ${fmt[plat]} pour le pilier "${pillar.label}".\nJSON: {"hook":"Accroche 1-2 phrases","caption":"Caption complète avec \\n et emojis, question d'engagement finale","hashtags":["tag1",...] 25 hashtags sans #,"note_format":"conseil format 1 phrase","note_heure":"meilleure heure de publication"}`
      );
      setResult(r);
      await sb("mji_posts", { method:"POST", body:{ platform:plat, pillar:pillar.label, hook:r.hook, caption:r.caption, hashtags:r.hashtags||[], note_format:r.note_format, note_heure:r.note_heure } });
      setSaved(true);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
        {["generate","history"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:"8px", borderRadius:"8px", cursor:"pointer",
              border:  tab===t ? ".5px solid #C0DD97":".5px solid #dde8d8",
              background: tab===t ? "#EAF3DE":"#f3f5f1",
              color:      tab===t ? "#27500A":"#6b7c69",
              fontSize:"12px", fontWeight: tab===t ? "500":"400" }}>
            {t==="generate" ? "Générer" : `Historique ${history ? `(${history.length})`:""}` }
          </button>
        ))}
      </div>

      {tab==="generate" && (
        <>
          <p style={S.lbl}>PLATEFORME</p>
          <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => { setPlat(p); setResult(null); }}
                style={{ ...S.chip(plat===p,"#27500A","#EAF3DE","#C0DD97"), flex:1, textAlign:"center" }}>
                {PLAT_LABEL[p]}
              </button>
            ))}
          </div>

          <p style={S.lbl}>PILIER ÉDITORIAL</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px", marginBottom:"14px" }}>
            {PILLARS.map(p => (
              <div key={p.id} onClick={() => { setPillId(p.id); setResult(null); setSaved(false); }}
                style={S.chip(pillId===p.id,p.tx,p.bg,p.bd)}>
                {p.label}
              </div>
            ))}
          </div>

          <button onClick={generate} disabled={!pillar||loading}
            style={{ width:"100%", padding:"11px", borderRadius:"10px", border:"none", marginBottom:"12px",
              background: pillar&&!loading ? "#2d5a27":"#c8d5c5",
              color:      pillar&&!loading ? "#c8e6b0":"#8a9e88",
              cursor:     pillar&&!loading ? "pointer":"not-allowed",
              fontSize:"14px", fontWeight:"500", fontFamily:"Georgia,serif" }}>
            {loading ? "🌱 Génération…" : pillar ? `Générer + sauvegarder · ${PLAT_LABEL[plat]} · ${pillar.label} ↗` : "Sélectionne un pilier"}
          </button>

          {error && <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#993c1d", marginBottom:"10px" }}>{error}</div>}
          {saved  && <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#27500A", marginBottom:"10px" }}>✓ Sauvegardé dans Supabase</div>}

          {result && (
            <div>
              <div style={{ background:pillar?.bg, border:`.5px solid ${pillar?.bd}`, borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={S.lbl}>ACCROCHE</span>
                  <CopyBtn text={result.hook} id="hook" copied={copied} setCopied={setCopied} />
                </div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:"18px", fontWeight:"600", color:pillar?.tx, lineHeight:"1.4" }}>{result.hook}</div>
              </div>
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={S.lbl}>CAPTION</span>
                  <CopyBtn text={result.caption} id="cap" copied={copied} setCopied={setCopied} />
                </div>
                <pre style={{ fontSize:"13px", color:"#1a2e18", margin:0, whiteSpace:"pre-wrap", lineHeight:"1.8" }}>{result.caption}</pre>
              </div>
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={S.lbl}>HASHTAGS · {result.hashtags?.length}</span>
                  <CopyBtn text={result.hashtags?.map(h=>`#${h}`).join(" ")} id="tags" copied={copied} setCopied={setCopied} />
                </div>
                <div>{result.hashtags?.map((h,i) => <span key={i} style={S.tag}>#{h}</span>)}</div>
              </div>
              {(result.note_format||result.note_heure) && (
                <div style={{ ...S.card, background:"#f3f5f1", border:".5px solid #e4ece0" }}>
                  {result.note_format && <div style={{ fontSize:"12px", color:"#6b7c69", paddingBottom:"5px", borderBottom:".5px solid #dde8d8", marginBottom:"5px" }}><span style={{ fontWeight:"500", color:"#3B6D11" }}>Format · </span>{result.note_format}</div>}
                  {result.note_heure  && <div style={{ fontSize:"12px", color:"#6b7c69" }}><span style={{ fontWeight:"500", color:"#3B6D11" }}>Publication · </span>{result.note_heure}</div>}
                </div>
              )}
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
          : history.length === 0
          ? <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Aucun post généré pour l'instant.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {history.map(p => (
                <div key={p.id} style={{ ...S.card, margin:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:"8px", marginBottom:"8px" }}>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:"#f3f5f1", color:"#6b7c69" }}>{PLAT_ICON[p.platform]||p.platform}</span>
                      <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:"#EAF3DE", color:"#27500A" }}>{p.pillar}</span>
                    </div>
                    <span style={{ fontSize:"10px", color:"#b0bfae", flexShrink:0 }}>{dateStr(p.created_at)}</span>
                  </div>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:"14px", fontWeight:"600", color:"#1a2e18", lineHeight:"1.3", marginBottom:"5px" }}>{p.hook}</div>
                  <div style={{ fontSize:"12px", color:"#6b7c69", lineHeight:"1.5", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.caption}</div>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
