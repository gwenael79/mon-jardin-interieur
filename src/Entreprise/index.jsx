// src/Entreprise/index.jsx
// Point d'entrée du back-office — route /entreprise

import { useState, useEffect } from "react";
import ReseauxStudio    from "./ReseauxStudio";
import CommercialStudio from "./CommercialStudio";
import SeoStudio        from "./SeoStudio";
import FinanceStudio    from "./FinanceStudio";

const TABS = [
  { id:"hub",        icon:"🌿", label:"Hub"        },
  { id:"reseaux",    icon:"📱", label:"Réseaux"    },
  { id:"commercial", icon:"💌", label:"Commercial" },
  { id:"seo",        icon:"🔍", label:"SEO"        },
  { id:"finance",    icon:"📊", label:"Financier"  },
];

const HUB_CARDS = [
  { id:"reseaux",    icon:"📱", label:"Réseaux",    desc:"Posts Instagram · TikTok · LinkedIn",       color:"#27500A", bg:"#EAF3DE", bd:"#C0DD97" },
  { id:"commercial", icon:"💌", label:"Commercial",  desc:"Emails B2C & B2B · 11 étapes de parcours",  color:"#0C447C", bg:"#E6F1FB", bd:"#B5D4F4" },
  { id:"seo",        icon:"🔍", label:"SEO",         desc:"Briefs TOFU · MOFU · BOFU",                 color:"#412402", bg:"#FAEEDA", bd:"#EF9F27" },
  { id:"finance",    icon:"📊", label:"Financier",   desc:"MRR · Churn · LTV/CAC · rapport IA mensuel",color:"#04342C", bg:"#E1F5EE", bd:"#5DCAA5" },
];

const BRAND = { dark:"#1c3818", text:"#c8e6b0", sub:"#7ab36a" };

function Hub({ setActive }) {
  return (
    <div>
      <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"12px",
        padding:"14px 16px", marginBottom:"20px" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:"15px", fontWeight:"600",
          color:"#1c3818", marginBottom:"4px" }}>
          Écosystème IA · Mon Jardin Intérieur
        </div>
        <div style={{ fontSize:"13px", color:"#3B6D11", lineHeight:"1.7" }}>
          4 services IA · mémoire Supabase · actif 24h/24.
          Tout contenu généré est sauvegardé et consultable depuis l'historique de chaque service.
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {HUB_CARDS.map(c => (
          <div key={c.id} onClick={() => setActive(c.id)}
            style={{ background:c.bg, border:`.5px solid ${c.bd}`, borderRadius:"12px",
              padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px" }}>
            <span style={{ fontSize:"22px", flexShrink:0 }}>{c.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"14px", fontWeight:"500", color:c.color, marginBottom:"2px" }}>{c.label}</div>
              <div style={{ fontSize:"12px", color:c.color, opacity:.75, lineHeight:"1.4" }}>{c.desc}</div>
            </div>
            <span style={{ fontSize:"16px", color:c.color, opacity:.4 }}>↗</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Entreprise() {
  const [active, setActive] = useState("hub");

  useEffect(() => {
    document.title = "Back-office · Mon Jardin Intérieur";
  }, []);

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif",
      background:"#f9f7f2", minHeight:"100vh" }}>

      {/* ── Header ── */}
      <div style={{ background:BRAND.dark, padding:"12px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>🌿</span>
          <div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"14px", fontWeight:"600",
              color:BRAND.text, margin:0, lineHeight:1 }}>
              Mon Jardin Intérieur
            </p>
            <p style={{ fontSize:"10px", color:BRAND.sub, margin:0, letterSpacing:".04em" }}>
              Back-office IA · Supabase · 24h/24
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#5DCAA5" }}/>
          <span style={{ fontSize:"10px", color:BRAND.sub }}>Connecté</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ background:BRAND.dark, paddingBottom:"10px",
        paddingInline:"10px", display:"flex", gap:"4px", overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ flexShrink:0, padding:"6px 12px", borderRadius:"20px", border:"none",
              cursor:"pointer", fontFamily:"system-ui",
              background: active===t.id ? "rgba(200,230,176,0.18)":"transparent",
              color:       active===t.id ? BRAND.text:BRAND.sub,
              fontSize:"12px", fontWeight: active===t.id ? "500":"400",
              outline: active===t.id ? "1px solid rgba(200,230,176,0.25)":"none",
              display:"flex", alignItems:"center", gap:"5px" }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>
        {active==="hub"        && <Hub setActive={setActive} />}
        {active==="reseaux"    && <ReseauxStudio />}
        {active==="commercial" && <CommercialStudio />}
        {active==="seo"        && <SeoStudio />}
        {active==="finance"    && <FinanceStudio />}
      </div>

    </div>
  );
}
