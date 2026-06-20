// src/Entreprise/index.jsx
// Point d'entrée du back-office — route /entreprise

import { useState, useEffect } from "react";
import ReseauxStudio    from "./ReseauxStudio";
import CommercialStudio from "./CommercialStudio";
import SeoStudio        from "./SeoStudio";
import FinanceStudio    from "./FinanceStudio";
import AgentChat        from "./AgentChat";
import MeetingRoom      from "./MeetingRoom";
import ClarityDashboard from "./ClarityDashboard";
import PinterestStudio  from "./PinterestStudio";
import TikTokStudio     from "./TikTokStudio";
import CalendrierPub    from "./CalendrierPub";

const TABS = [
  { id:"hub",        icon:"🌿", label:"Hub"        },
  { id:"reseaux",    icon:"📱", label:"Réseaux"    },
  { id:"commercial", icon:"💌", label:"Commercial" },
  { id:"seo",        icon:"🔍", label:"SEO"        },
  { id:"finance",    icon:"📊", label:"Financier"  },
  { id:"maestro",    photo:"https://randomuser.me/api/portraits/men/32.jpg",   label:"MAX" },
  { id:"stratege",   photo:"https://randomuser.me/api/portraits/men/75.jpg",   label:"SAM"     },
  { id:"growth",     photo:"https://randomuser.me/api/portraits/men/22.jpg",   label:"LÉO"     },
  { id:"contenu",    photo:"https://randomuser.me/api/portraits/women/44.jpg", label:"LUCIE"   },
  { id:"meeting",    icon:"🪑",  label:"Réunion" },
  { id:"clarity",    icon:"📡", label:"Trafic"  },
  { id:"pinterest",  icon:"📌", label:"Pinterest" },
  { id:"tiktok",     icon:"🎬", label:"TikTok Studio" },
  { id:"calendrier", icon:"📅", label:"Calendrier pub" },
];

const HUB_CARDS = [
  { id:"maestro",  icon:"🤖", label:"Pilotage",   desc:"Données temps réel · pilotage · actions",                        color:"#1c3818", bg:"#1c3818", bd:"#3B6D11", dark:true },
  { id:"stratege", icon:"🎯", label:"Stratège",  desc:"Acquisition · conversion · pricing · plateformes",               color:"#0C447C", bg:"#E6F1FB", bd:"#B5D4F4" },
  { id:"growth",   icon:"📈", label:"LÉO · Développement", desc:"Analyse cohortes · métriques SaaS · recommandations", color:"#412402", bg:"#FAEEDA", bd:"#EF9F27" },
  { id:"contenu",  icon:"✍️",  label:"Contenu",   desc:"Planning éditorial · repurposing · stratégie cross-canal",      color:"#04342C", bg:"#E1F5EE", bd:"#5DCAA5" },
  { id:"reseaux",    icon:"📱", label:"Réseaux",    desc:"Posts Instagram · TikTok · LinkedIn",                          color:"#27500A", bg:"#EAF3DE", bd:"#C0DD97" },
  { id:"commercial", icon:"💌", label:"Commercial",  desc:"Emails B2C & B2B · 11 étapes de parcours",                   color:"#0C447C", bg:"#E6F1FB", bd:"#B5D4F4" },
  { id:"seo",        icon:"🔍", label:"SEO",         desc:"Briefs TOFU · MOFU · BOFU",                                  color:"#412402", bg:"#FAEEDA", bd:"#EF9F27" },
  { id:"finance",    icon:"📊", label:"Financier",   desc:"MRR · Churn · LTV/CAC · rapport IA mensuel",                 color:"#04342C", bg:"#E1F5EE", bd:"#5DCAA5" },
  { id:"meeting",    icon:"🪑", label:"Salle de Réunion", desc:"Pilotage · SAM · LÉO · LUCIE · dialogue croisé · vision à 360°", color:"#2a1f00", bg:"#FDF6E3", bd:"#D4B97A" },
  { id:"clarity",    icon:"📡", label:"Trafic Clarity",  desc:"Fréquentation · appareils · sources · analyse IA en français",   color:"#04342C", bg:"#E1F5EE", bd:"#5DCAA5" },
  { id:"pinterest",  icon:"📌", label:"Épingles Pinterest", desc:"Générateur d'épingles 1000×1500 · fond fleuri · 5 teintes · export PNG", color:"#412402", bg:"#FAEEDA", bd:"#EF9F27" },
];

const BRAND = { dark:"#1c3818", text:"#c8e6b0", sub:"#7ab36a" };

const TIKTOK_TEST_WEBHOOK = "https://n8n.srv1667605.hstgr.cloud/webhook/tiktok-test-manuel";

function TikTokTestButton() {
  const [status, setStatus] = useState(null); // null | "running" | "ok" | "error"
  const trigger = async () => {
    if (status === "running") return;
    setStatus("running");
    try {
      const res = await fetch(TIKTOK_TEST_WEBHOOK, { method: "POST" });
      setStatus(res.ok ? "ok" : "error");
    } catch { setStatus("error"); }
    setTimeout(() => setStatus(null), 5000);
  };
  const colors = { running:"#ff9f43", ok:"#5DCAA5", error:"#ff6b6b", null:"#ff2d55" };
  const labels = { running:"⏳ Lancé — ~60s", ok:"✓ Pipeline lancé", error:"✗ Erreur", null:"▶ Tester TikTok Auto" };
  return (
    <div style={{ background:"#1a0a0e", border:`.5px solid ${colors[status]||colors.null}30`,
      borderRadius:"12px", padding:"14px 16px", cursor: status==="running"?"not-allowed":"pointer",
      display:"flex", alignItems:"center", gap:"14px" }}
      onClick={trigger}>
      <span style={{ fontSize:"22px", flexShrink:0 }}>🎬</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"14px", fontWeight:"500", color: colors[status]||colors.null, marginBottom:"2px" }}>
          {labels[status]}
        </div>
        <div style={{ fontSize:"12px", color:"#ff6b6b", opacity:.7, lineHeight:"1.4" }}>
          Circuit automatique · slideshow 30s · citations
        </div>
      </div>
      <span style={{ fontSize:"16px", color: colors[status]||colors.null, opacity:.5 }}>↗</span>
    </div>
  );
}

function Hub({ setActive }) {
  return (
    <div>
      <TikTokTestButton />
      <div style={{ height:"12px" }} />
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
        {HUB_CARDS.map(c => {
          const lbl = c.dark ? "#c8e6b0" : c.color;
          const sub = c.dark ? "#7ab36a"  : c.color;
          return (
            <div key={c.id} onClick={() => setActive(c.id)}
              style={{ background:c.bg, border:`.5px solid ${c.bd}`, borderRadius:"12px",
                padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px" }}>
              <span style={{ fontSize:"22px", flexShrink:0 }}>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:"500", color:lbl, marginBottom:"2px" }}>{c.label}</div>
                <div style={{ fontSize:"12px", color:sub, opacity:.85, lineHeight:"1.4" }}>{c.desc}</div>
              </div>
              <span style={{ fontSize:"16px", color:lbl, opacity:.5 }}>↗</span>
            </div>
          );
        })}
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
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#5DCAA5" }}/>
            <span style={{ fontSize:"10px", color:BRAND.sub }}>Connecté</span>
          </div>
          <button
            onClick={() => { window.location.hash = "#admin"; }}
            style={{ padding:"5px 12px", borderRadius:"20px", border:".5px solid rgba(200,230,176,0.25)",
              background:"rgba(200,230,176,0.10)", color:BRAND.sub,
              cursor:"pointer", fontSize:"11px", fontFamily:"system-ui" }}>
            ← Admin
          </button>
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
              display:"flex", alignItems:"center", gap:"6px" }}>
            {t.photo
              ? <img src={t.photo} alt={t.label} style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", border: active===t.id ? "1.5px solid rgba(200,230,176,0.6)" : "1.5px solid rgba(200,230,176,0.2)", flexShrink:0 }} />
              : <span>{t.icon}</span>
            }
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {(() => {
        const isAgent    = ["maestro","stratege","growth","contenu","meeting"].includes(active);
        const isWide     = ["pinterest"].includes(active);
        const isFullWide = ["calendrier","tiktok"].includes(active);
        return (
          <div style={{ padding: isAgent ? "20px 4%" : isFullWide ? "16px 2%" : "16px",
            maxWidth: isAgent || isFullWide ? "none" : isWide ? "900px" : "600px",
            width: isAgent || isFullWide ? "100%" : "auto",
            margin: "0 auto",
            boxSizing: "border-box" }}>
            {active==="hub"        && <Hub setActive={setActive} />}
            {active==="reseaux"    && <ReseauxStudio />}
            {active==="commercial" && <CommercialStudio />}
            {active==="seo"        && <SeoStudio />}
            {active==="finance"    && <FinanceStudio />}
            {active==="maestro"  && <AgentChat agentId="maestro"  agentName="Max" agentFullName="Max · Pilotage" agentDesc="Données temps réel · actions directes sur Supabase et n8n" agentColor="#1c3818" agentBg="#EAF3DE" agentPhoto="https://randomuser.me/api/portraits/men/32.jpg" />}
            {active==="stratege" && <AgentChat agentId="stratege" agentName="SAM"   agentFullName="SAM · STRATÈGE" agentDesc="Acquisition · conversion · pricing · plateformes" agentColor="#0C447C" agentBg="#E6F1FB" agentPhoto="https://randomuser.me/api/portraits/men/75.jpg" />}
            {active==="growth"   && <AgentChat agentId="growth"   agentName="LÉO"   agentFullName="LÉO · Développement"   agentDesc="Métriques SaaS · cohortes · leviers cachés" agentColor="#412402" agentBg="#FAEEDA" agentPhoto="https://randomuser.me/api/portraits/men/22.jpg" />}
            {active==="contenu"  && <AgentChat agentId="contenu"  agentName="LUCIE" agentFullName="LUCIE · CONTENU" agentDesc="Planning éditorial · repurposing · stratégie cross-canal" agentColor="#04342C" agentBg="#E1F5EE" agentPhoto="https://randomuser.me/api/portraits/women/44.jpg" />}
            {active==="meeting"  && <MeetingRoom />}
            {active==="clarity"    && <ClarityDashboard />}
            {active==="pinterest"  && <PinterestStudio />}
            {active==="tiktok"     && <TikTokStudio />}
            {active==="calendrier" && <CalendrierPub />}
          </div>
        );
      })()}

    </div>
  );
}
