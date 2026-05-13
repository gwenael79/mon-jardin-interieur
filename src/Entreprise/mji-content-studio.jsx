import { useState, useEffect } from "react";

const PILLARS = [
  { id: "rituel",    label: "Rituel du jour",     bg: "#EAF3DE", border: "#C0DD97", text: "#27500A", sub: "#3B6D11" },
  { id: "neuro",     label: "Neuro & science",    bg: "#EEEDFE", border: "#AFA9EC", text: "#26215C", sub: "#534AB7" },
  { id: "fleur",     label: "Ma fleur & moi",     bg: "#FBEAF0", border: "#ED93B1", text: "#4B1528", sub: "#993556" },
  { id: "temoignage",label: "Témoignages",        bg: "#E1F5EE", border: "#5DCAA5", text: "#04342C", sub: "#0F6E56" },
  { id: "pratique",  label: "Bien-être pratique", bg: "#FAEEDA", border: "#EF9F27", text: "#412402", sub: "#854F0B" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok",   label: "TikTok"    },
  { id: "linkedin",  label: "LinkedIn"  },
];

const PIPELINE = [
  { n:"01", title:"Déclencheur cron",    desc:"n8n lance le workflow automatiquement — lundi 6h, mercredi 12h, vendredi 19h.", color:"#EAF3DE", border:"#C0DD97", text:"#27500A" },
  { n:"02", title:"Génération IA",       desc:"Appel Claude API avec le pilier du jour, le ton MJI et les instructions de format pour la plateforme cible.", color:"#EEEDFE", border:"#AFA9EC", text:"#26215C" },
  { n:"03", title:"Contrôle qualité",    desc:"Vérification automatique : longueur caption, nombre hashtags, présence de la question d'engagement.", color:"#FBEAF0", border:"#ED93B1", text:"#4B1528" },
  { n:"04", title:"Génération visuel",   desc:"Appel Canva API avec le template MJI et le hook généré. Visuel aux couleurs de la charte en 30 secondes.", color:"#E1F5EE", border:"#5DCAA5", text:"#04342C" },
  { n:"05", title:"Scheduling Buffer",   desc:"Envoi automatique à Buffer API avec l'heure optimale calculée par l'IA. Aucune action humaine requise.", color:"#FAEEDA", border:"#EF9F27", text:"#412402" },
  { n:"06", title:"Rapport hebdomadaire",desc:"Chaque dimanche soir, synthèse IA des performances : engagement, portée, ce qui s'ajuste la semaine suivante.", color:"#EAF3DE", border:"#C0DD97", text:"#27500A" },
];

const STACK = [
  ["Orchestration",     "n8n (self-hosted ou cloud)"],
  ["Génération texte",  "Claude API — claude-sonnet-4-20250514"],
  ["Génération visuel", "Canva API ou Bannerbear"],
  ["Scheduling",        "Buffer API ou Later API"],
  ["Community DM",      "ManyChat — réponses auto"],
  ["Monitoring",        "Alertes Slack si erreur n8n"],
];

const SYS = `Tu es le générateur de contenu IA de Mon Jardin Intérieur, une application de bien-être où l'utilisateur prend soin de sa "fleur intérieure", reflet de son état émotionnel.
Philosophie : ralentir permet au cortex de baisser en intensité, activant les zones antérieures du cerveau pour trier et libérer l'espace mental. Les rituels sont simples, accessibles, profonds.
Ton : personnel, poétique, ancré dans la réalité, jamais moralisateur. On commence toujours par l'émotion, jamais par le produit.
Réponds UNIQUEMENT avec du JSON valide, sans markdown ni explication.`;

const buildPrompt = (pillar, platform) => {
  const fmt = {
    instagram: "post Instagram Reel ou carousel. Caption aérée avec \\n.",
    tiktok:    "script TikTok court et dynamique, ton direct et énergique.",
    linkedin:  "post LinkedIn thought leadership pour professionnels du bien-être, ton analytique et inspirant.",
  };
  return `Génère un ${fmt[platform]} pour le pilier "${pillar.label}".

JSON :
{
  "hook": "Accroche 1-2 phrases, arrête le scroll",
  "caption": "Caption complète avec \\n, emojis naturels, question d'engagement finale",
  "hashtags": ["tag1","tag2",...] — exactement 25 hashtags sans #,
  "note_format": "Conseil format en 1 phrase",
  "note_heure": "Meilleure heure de publication en 1 phrase"
}`;
};

export default function ContentStudio() {
  const [view,     setView]     = useState("studio");
  const [pillarId, setPillarId] = useState(null);
  const [platform, setPlatform] = useState("instagram");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [copied,   setCopied]   = useState("");

  useEffect(() => {
    const lk = document.createElement("link");
    lk.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    lk.rel  = "stylesheet";
    document.head.appendChild(lk);
  }, []);

  const pillar = PILLARS.find(p => p.id === pillarId);

  const generate = async () => {
    if (!pillar) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:     SYS,
          messages:   [{ role: "user", content: buildPrompt(pillar, platform) }],
        }),
      });
      const data  = await res.json();
      const text  = data.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no json");
      setResult(JSON.parse(match[0]));
    } catch {
      setError("Erreur de génération. Réessaie dans quelques secondes.");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const s = {
    root:   { fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f9f7f2", minHeight:"100vh" },
    header: { background:"#1c3818", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" },
    label:  { fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" },
    card:   { background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", padding:"14px 16px", marginBottom:"12px" },
    tag:    { display:"inline-block", background:"#f3f5f1", color:"#6b7c69", fontSize:"11px", padding:"2px 8px", borderRadius:"20px", margin:"2px" },
  };

  const NavBtn = ({ id, label }) => (
    <button
      onClick={() => setView(id)}
      style={{ fontSize:"12px", fontWeight:"500", padding:"5px 13px", borderRadius:"20px", border:"none", cursor:"pointer",
        fontFamily:"'DM Sans',system-ui", background: view===id ? "#c8e6b0":"transparent", color: view===id ? "#1c3818":"#7ab36a" }}
    >{label}</button>
  );

  const PlatBtn = ({ p }) => (
    <button
      onClick={() => { setPlatform(p.id); setResult(null); }}
      style={{ flex:1, padding:"8px", borderRadius:"8px", border: platform===p.id ? "1.5px solid #3B6D11":".5px solid #dde8d8",
        background: platform===p.id ? "#EAF3DE":"#fff", color: platform===p.id ? "#27500A":"#6b7c69",
        cursor:"pointer", fontSize:"12px", fontWeight: platform===p.id ? "500":"400", fontFamily:"'DM Sans',system-ui" }}
    >{p.label}</button>
  );

  const CopyBtn = ({ text, id, color }) => (
    <button
      onClick={() => copy(text, id)}
      style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px",
        border:`.5px solid ${color||"#dde8d8"}`, background:"transparent",
        color: copied===id ? "#3B6D11" : (color||"#8a9e88"), cursor:"pointer", fontFamily:"'DM Sans',system-ui" }}
    >{copied===id ? "✓ Copié" : "Copier"}</button>
  );

  return (
    <div style={s.root}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>🌿</span>
          <div>
            <p style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"15px", fontWeight:"600", color:"#c8e6b0", margin:0 }}>
              Mon Jardin Intérieur
            </p>
            <p style={{ fontSize:"10px", color:"#7ab36a", margin:0, letterSpacing:".04em" }}>Content Studio IA · actif 24h/24</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          <NavBtn id="studio"   label="Studio" />
          <NavBtn id="pipeline" label="Pipeline" />
        </div>
      </div>

      <div style={{ padding:"20px" }}>

        {/* ══════════════════════════════════════════
            PIPELINE VIEW
        ══════════════════════════════════════════ */}
        {view === "pipeline" && (
          <div>
            <p style={{ ...s.label, marginBottom:"16px" }}>FLUX D'AUTOMATISATION — N8N + CLAUDE API + BUFFER</p>

            {PIPELINE.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:step.color,
                  border:`.5px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, fontSize:"10px", fontWeight:"500", color:step.text }}>
                  {step.n}
                </div>
                <div style={{ ...s.card, flex:1, margin:0 }}>
                  <div style={{ fontSize:"13px", fontWeight:"500", color:"#1a2e18", marginBottom:"3px" }}>{step.title}</div>
                  <div style={{ fontSize:"12px", color:"#6b7c69", lineHeight:"1.55" }}>{step.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ background:"#1c3818", borderRadius:"12px", padding:"16px", marginTop:"16px" }}>
              <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"13px", color:"#c8e6b0", fontWeight:"600", marginBottom:"12px" }}>
                Stack technique recommandée
              </div>
              {STACK.map(([k, v], i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
                  borderBottom: i < STACK.length-1 ? ".5px solid #2d5a27":"none", fontSize:"12px" }}>
                  <span style={{ color:"#7ab36a" }}>{k}</span>
                  <span style={{ color:"#c8e6b0", fontWeight:"500" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ ...s.card, marginTop:"12px", background:"#f3f5f1" }}>
              <div style={{ fontSize:"11px", fontWeight:"500", color:"#8a9e88", letterSpacing:".06em", marginBottom:"8px" }}>
                FRÉQUENCE PAR PLATEFORME
              </div>
              {[
                ["Instagram",  "Lun 7h · Mer 12h30 · Ven 19h · Dim 20h"],
                ["TikTok",     "Lun 7h30 · Mar 18h · Jeu 19h · Sam 10h · Dim 16h"],
                ["LinkedIn",   "Mar 8h · Jeu 12h"],
              ].map(([p, h], i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px",
                  padding:"5px 0", borderBottom: i<2 ? ".5px solid #dde8d8":"none" }}>
                  <span style={{ fontWeight:"500", color:"#3B6D11" }}>{p}</span>
                  <span style={{ color:"#6b7c69" }}>{h}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setView("studio")}
              style={{ width:"100%", marginTop:"4px", padding:"11px", borderRadius:"10px", border:".5px solid #dde8d8",
                background:"#fff", color:"#3B6D11", cursor:"pointer", fontSize:"13px", fontWeight:"500",
                fontFamily:"'DM Sans',system-ui" }}
            >
              Tester le générateur ↗
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STUDIO VIEW
        ══════════════════════════════════════════ */}
        {view === "studio" && (
          <>
            {/* Platform */}
            <p style={s.label}>PLATEFORME</p>
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
              {PLATFORMS.map(p => <PlatBtn key={p.id} p={p} />)}
            </div>

            {/* Pillar */}
            <p style={s.label}>PILIER ÉDITORIAL</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:"6px", marginBottom:"16px" }}>
              {PILLARS.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setPillarId(p.id); setResult(null); setError(null); }}
                  style={{ background: pillarId===p.id ? p.bg:"#f3f5f1",
                    border: `.5px solid ${pillarId===p.id ? p.border:"#d8e0d5"}`,
                    borderRadius:"8px", padding:"9px 10px", cursor:"pointer",
                    fontSize:"12px", fontWeight: pillarId===p.id ? "500":"400",
                    color: pillarId===p.id ? p.text:"#6b7c69", lineHeight:"1.35", transition:"all .15s" }}
                >{p.label}</div>
              ))}
            </div>

            {/* Generate */}
            <button
              onClick={generate}
              disabled={!pillar || loading}
              style={{ width:"100%", padding:"12px 16px", borderRadius:"10px", border:"none", marginBottom:"16px",
                background: pillar && !loading ? "#2d5a27":"#c8d5c5",
                color:      pillar && !loading ? "#c8e6b0":"#8a9e88",
                cursor:     pillar && !loading ? "pointer":"not-allowed",
                fontSize:"14px", fontWeight:"500", fontFamily:"'Lora',Georgia,serif", letterSpacing:".02em" }}
            >
              {loading ? "🌱 Génération en cours…" :
               pillar  ? `Générer · ${PLATFORMS.find(p=>p.id===platform)?.label} · ${pillar.label} ↗` :
                         "Sélectionne un pilier pour commencer"}
            </button>

            {error && (
              <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px",
                padding:"12px 14px", fontSize:"13px", color:"#993c1d", marginBottom:"12px" }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{ textAlign:"center", padding:"28px 0", color:"#8a9e88" }}>
                <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"16px", color:"#3B6D11", marginBottom:"6px" }}>
                  L'IA cultive ton contenu…
                </div>
                <div style={{ fontSize:"12px" }}>quelques secondes</div>
              </div>
            )}

            {result && (
              <div>

                {/* Hook */}
                <div style={{ background:pillar?.bg, border:`.5px solid ${pillar?.border}`,
                  borderRadius:"12px", padding:"14px 16px", marginBottom:"12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                    <span style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:pillar?.sub }}>ACCROCHE REEL</span>
                    <CopyBtn text={result.hook} id="hook" color={pillar?.sub} />
                  </div>
                  <p style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"18px", fontWeight:"600",
                    color:pillar?.text, lineHeight:"1.45", margin:0 }}>
                    {result.hook}
                  </p>
                </div>

                {/* Caption */}
                <div style={s.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                    <span style={s.label}>CAPTION</span>
                    <CopyBtn text={result.caption} id="caption" />
                  </div>
                  <pre style={{ fontSize:"13px", color:"#1a2e18", margin:0, whiteSpace:"pre-wrap",
                    fontFamily:"'DM Sans',system-ui", lineHeight:"1.8" }}>
                    {result.caption}
                  </pre>
                </div>

                {/* Hashtags */}
                <div style={s.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                    <span style={s.label}>HASHTAGS · {result.hashtags?.length}</span>
                    <CopyBtn text={result.hashtags?.map(h=>`#${h}`).join(" ")} id="tags" />
                  </div>
                  <div>{result.hashtags?.map((h,i) => <span key={i} style={s.tag}>#{h}</span>)}</div>
                </div>

                {/* Notes */}
                <div style={{ ...s.card, background:"#f3f5f1", border:".5px solid #e4ece0" }}>
                  {result.note_format && (
                    <div style={{ fontSize:"12px", color:"#6b7c69", padding:"5px 0",
                      borderBottom:".5px solid #dde8d8" }}>
                      <span style={{ fontWeight:"500", color:"#3B6D11" }}>Format · </span>
                      {result.note_format}
                    </div>
                  )}
                  {result.note_heure && (
                    <div style={{ fontSize:"12px", color:"#6b7c69", paddingTop:"7px" }}>
                      <span style={{ fontWeight:"500", color:"#3B6D11" }}>Publication · </span>
                      {result.note_heure}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setResult(null); generate(); }}
                  style={{ width:"100%", padding:"10px", borderRadius:"10px", border:".5px solid #dde8d8",
                    background:"#fff", color:"#3B6D11", cursor:"pointer", fontSize:"13px",
                    fontFamily:"'DM Sans',system-ui" }}
                >
                  Regénérer une variante ↻
                </button>

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
