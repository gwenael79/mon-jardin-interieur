import { useState, useEffect } from "react";

const STAGES = {
  tofu: {
    label: "TOFU · Découverte",
    badge: { bg: "#FAEEDA", color: "#633806" },
    desc: "Articles informatifs · guides · vulgarisation",
    clusters: [
      { id: "neuro",    label: "Neuroscience & bien-être",  kw: "neuroscience et bien-être",     type: "article de blog" },
      { id: "rituels",  label: "Rituels & habitudes",       kw: "rituel bien-être quotidien",    type: "guide pratique" },
      { id: "ralentir", label: "Ralentir son cerveau",      kw: "comment ralentir son cerveau",  type: "article de blog" },
      { id: "emotions", label: "Émotions & équilibre",      kw: "gérer ses émotions quotidien",  type: "article de blog" },
    ],
  },
  mofu: {
    label: "MOFU · Considération",
    badge: { bg: "#EEEDFE", color: "#3C3489" },
    desc: "Comparatifs · pages de choix · guides produit",
    clusters: [
      { id: "app_fr",  label: "App bien-être française",    kw: "meilleure application bien-être française", type: "comparatif" },
      { id: "vs",      label: "Comparatifs concurrents",    kw: "alternative Headspace Petit Bambou",        type: "page comparatif" },
      { id: "pros",    label: "Outil pour professionnels",  kw: "application coaches et thérapeutes",        type: "landing page B2B" },
    ],
  },
  bofu: {
    label: "BOFU · Conversion",
    badge: { bg: "#EAF3DE", color: "#27500A" },
    desc: "Pages de destination · pages produit · tarifs",
    clusters: [
      { id: "marque",  label: "Mon Jardin Intérieur",       kw: "Mon Jardin Intérieur application bien-être", type: "page d'accueil" },
      { id: "abo",     label: "Abonnement & tarifs",        kw: "application bien-être prix abonnement",      type: "page tarifaire" },
      { id: "pro_pgm", label: "Programme Pro",              kw: "partenariat bien-être professionnel coach",  type: "landing page Pro" },
    ],
  },
};

const SYS = `Tu es le service IA Référencement de Mon Jardin Intérieur, une application de bien-être où l'utilisateur prend soin de sa "fleur intérieure", reflet de son état émotionnel.

ADN de MJI à refléter dans chaque brief :
- Approche neuroscientifique : ralentir active les zones antérieures du cerveau, libère l'espace mental
- Bien-être sans injonctions — poétique, ancré, jamais moralisateur
- La fleur intérieure comme métaphore de l'état émotionnel
- Différenciation vs Headspace/Petit Bambou : plus personnel, plus symbolique, lien pro-client

Réponds UNIQUEMENT en JSON valide sans markdown ni explication.`;

const buildPrompt = (cluster) =>
  `Génère un brief SEO complet pour un ${cluster.type} sur le cluster "${cluster.label}" (mot-clé cible : "${cluster.kw}").

JSON attendu :
{
  "primary_keyword": "...",
  "intent": "informatif | commercial | transactionnel",
  "secondary_keywords": ["kw1","kw2","kw3","kw4","kw5"],
  "meta_title": "Titre SEO max 60 caractères avec le mot-clé",
  "meta_description": "Description max 155 caractères avec CTA doux",
  "slug": "/url-sans-accents-tirets",
  "h1": "Titre H1 légèrement différent du meta_title",
  "outline": [
    { "h2": "Titre de section", "h3s": ["Sous-section 1", "Sous-section 2"] }
  ],
  "angle": "Angle différenciant MJI en 1-2 phrases",
  "word_count": 1200,
  "internal_links": ["Page MJI à lier 1", "Page 2", "Page 3"]
}`;

const lbl = {
  fontSize: "10px", fontWeight: "500",
  letterSpacing: ".08em", color: "#8a9e88", margin: "0 0 8px",
};

const card = {
  background: "#fff",
  border: ".5px solid #dde8d8",
  borderRadius: "12px",
  padding: "14px 16px",
  marginBottom: "10px",
};

export default function SeoStudio() {
  const [stage,    setStage]    = useState("tofu");
  const [clusterId,setCluster]  = useState(null);
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

  const sd      = STAGES[stage];
  const cluster = sd.clusters.find(c => c.id === clusterId);

  const generate = async () => {
    if (!cluster) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res   = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:     "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system:    SYS,
          messages:  [{ role: "user", content: buildPrompt(cluster) }],
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

  const CopyBtn = ({ text, id, sm }) => (
    <button
      onClick={() => copy(text, id)}
      style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px",
        border: ".5px solid #dde8d8", background: "transparent",
        color: copied === id ? "#3B6D11" : "#8a9e88",
        cursor: "pointer", fontFamily: "'DM Sans',system-ui", flexShrink: 0,
        ...(sm ? {} : {}) }}
    >{copied === id ? "✓" : "Copier"}</button>
  );

  const Field = ({ label, value, id, mono }) => (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88" }}>{label}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: value?.length > 0 ? (value.length > (id === "meta_title" ? 60 : 155) ? "#D85A30" : "#3B6D11") : "#8a9e88" }}>
            {value?.length || 0} car.
          </span>
          <CopyBtn text={value} id={id} />
        </div>
      </div>
      <div style={{ fontSize: "13px", color: "#1a2e18", lineHeight: "1.5",
        fontFamily: mono ? "'DM Mono',monospace" : "'DM Sans',system-ui",
        background: mono ? "#f3f5f1" : "transparent",
        padding: mono ? "6px 8px" : 0, borderRadius: mono ? "6px" : 0 }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#f9f7f2", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "#1c3818", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>🌿</span>
        <div>
          <p style={{ fontFamily: "'Lora',Georgia,serif", fontSize: "15px", fontWeight: "600", color: "#c8e6b0", margin: 0 }}>
            Mon Jardin Intérieur
          </p>
          <p style={{ fontSize: "10px", color: "#7ab36a", margin: 0, letterSpacing: ".04em" }}>
            SEO Studio IA · briefs de contenu
          </p>
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* Stage selector */}
        <p style={lbl}>ÉTAPE DU FUNNEL SEO</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          {Object.entries(STAGES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { setStage(key); setCluster(null); setResult(null); setError(null); }}
              style={{ flex: 1, padding: "9px 10px", borderRadius: "10px", cursor: "pointer",
                border: stage === key ? `1.5px solid ${s.badge.color}` : ".5px solid #dde8d8",
                background: stage === key ? s.badge.bg : "#fff",
                color: stage === key ? s.badge.color : "#6b7c69",
                fontSize: "12px", fontWeight: stage === key ? "500" : "400",
                fontFamily: "'DM Sans',system-ui", lineHeight: "1.3" }}
            >
              <div>{s.label}</div>
              <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "2px" }}>{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Cluster selector */}
        <p style={lbl}>CLUSTER DE MOTS-CLÉS</p>
        <div style={{ display: "grid", gridTemplateColumns: sd.clusters.length === 4 ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: "6px", marginBottom: "18px" }}>
          {sd.clusters.map(c => (
            <div
              key={c.id}
              onClick={() => { setCluster(c.id); setResult(null); setError(null); }}
              style={{ background: clusterId === c.id ? sd.badge.bg : "#f3f5f1",
                border: `.5px solid ${clusterId === c.id ? sd.badge.color : "#d8e0d5"}`,
                borderRadius: "8px", padding: "10px 12px", cursor: "pointer" }}
            >
              <div style={{ fontSize: "12px", fontWeight: "500", lineHeight: "1.3",
                color: clusterId === c.id ? sd.badge.color : "#3d4d3b", marginBottom: "3px" }}>
                {c.label}
              </div>
              <div style={{ fontSize: "11px", color: clusterId === c.id ? sd.badge.color : "#8a9e88",
                opacity: clusterId === c.id ? 0.85 : 1, lineHeight: "1.3" }}>
                {c.type}
              </div>
            </div>
          ))}
        </div>

        {cluster && (
          <div style={{ background: "#f3f5f1", border: ".5px solid #d8e0d5", borderRadius: "8px",
            padding: "8px 12px", marginBottom: "14px", fontSize: "12px", color: "#6b7c69" }}>
            <span style={{ fontWeight: "500", color: "#3d4d3b" }}>Mot-clé cible · </span>
            {cluster.kw}
          </div>
        )}

        {/* Generate */}
        <button
          onClick={generate}
          disabled={!cluster || loading}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", marginBottom: "16px",
            background: cluster && !loading ? "#2d5a27" : "#c8d5c5",
            color:      cluster && !loading ? "#c8e6b0" : "#8a9e88",
            cursor:     cluster && !loading ? "pointer" : "not-allowed",
            fontSize: "14px", fontWeight: "500", fontFamily: "'Lora',Georgia,serif" }}
        >
          {loading ? "🌱 Génération du brief…"
            : cluster ? `Générer brief SEO · ${cluster.label} ↗`
            : "Sélectionne un cluster"}
        </button>

        {error && (
          <div style={{ background: "#fff0ee", border: ".5px solid #f0a090", borderRadius: "10px",
            padding: "12px 14px", fontSize: "13px", color: "#993c1d", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontFamily: "'Lora',Georgia,serif", fontSize: "16px", color: "#3B6D11", marginBottom: "6px" }}>
              Analyse du cluster en cours…
            </div>
            <div style={{ fontSize: "12px", color: "#8a9e88" }}>généralement moins de 15 secondes</div>
          </div>
        )}

        {result && (
          <div>

            {/* Header summary */}
            <div style={{ ...card, background: sd.badge.bg, border: `.5px solid ${sd.badge.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em",
                    color: sd.badge.color, marginBottom: "4px" }}>MOT-CLÉ PRINCIPAL</div>
                  <div style={{ fontFamily: "'Lora',Georgia,serif", fontSize: "17px", fontWeight: "600",
                    color: sd.badge.color, lineHeight: "1.3" }}>{result.primary_keyword}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "500", padding: "3px 10px", borderRadius: "20px",
                  background: "rgba(255,255,255,0.6)", color: sd.badge.color }}>
                  {result.intent}
                </span>
              </div>
              {result.secondary_keywords?.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {result.secondary_keywords.map((kw, i) => (
                    <span key={i} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                      background: "rgba(255,255,255,0.5)", color: sd.badge.color }}>{kw}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Meta section */}
            <div style={card}>
              <div style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em",
                color: "#8a9e88", marginBottom: "12px" }}>BALISES META</div>
              <Field label="META TITLE" value={result.meta_title} id="mt" />
              <Field label="META DESCRIPTION" value={result.meta_description} id="md" />
              <Field label="URL SLUG" value={result.slug} id="slug" mono />
            </div>

            {/* H1 */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88" }}>H1</span>
                <CopyBtn text={result.h1} id="h1" />
              </div>
              <div style={{ fontFamily: "'Lora',Georgia,serif", fontSize: "16px", fontWeight: "600",
                color: "#1a2e18", lineHeight: "1.4" }}>{result.h1}</div>
            </div>

            {/* Outline */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88" }}>PLAN ÉDITORIAL</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#8a9e88" }}>{result.word_count} mots</span>
                  <CopyBtn id="outline" text={result.outline?.map(s => `## ${s.h2}\n${s.h3s?.map(h => `### ${h}`).join("\n")}`).join("\n\n")} />
                </div>
              </div>
              {result.outline?.map((section, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "#1a2e18",
                    padding: "6px 10px", background: "#f3f5f1", borderRadius: "6px", marginBottom: "4px" }}>
                    H2 · {section.h2}
                  </div>
                  {section.h3s?.map((h3, j) => (
                    <div key={j} style={{ fontSize: "12px", color: "#6b7c69", padding: "4px 10px 4px 20px" }}>
                      H3 · {h3}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Angle + internal links */}
            <div style={{ ...card, background: "#f3f5f1", border: ".5px solid #e4ece0" }}>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em",
                  color: "#8a9e88", marginBottom: "4px" }}>ANGLE MJI</div>
                <div style={{ fontSize: "13px", color: "#1a2e18", lineHeight: "1.6",
                  fontStyle: "italic" }}>{result.angle}</div>
              </div>
              {result.internal_links?.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em",
                    color: "#8a9e88", marginBottom: "6px" }}>LIENS INTERNES SUGGÉRÉS</div>
                  {result.internal_links.map((lk, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#3B6D11", padding: "2px 0" }}>
                      → {lk}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => copy(
                `# Brief SEO — ${result.primary_keyword}\n\nMETA TITLE: ${result.meta_title}\nMETA DESC: ${result.meta_description}\nSLUG: ${result.slug}\nH1: ${result.h1}\n\nPLAN:\n${result.outline?.map(s => `## ${s.h2}\n${s.h3s?.map(h => `### ${h}`).join("\n")}`).join("\n\n")}\n\nANGLE: ${result.angle}\nMOTS: ${result.word_count}`,
                "all"
              )}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: ".5px solid #c0dd97",
                background: "#EAF3DE", color: "#27500A", cursor: "pointer", fontSize: "13px",
                fontFamily: "'DM Sans',system-ui", marginBottom: "8px", fontWeight: "500" }}
            >
              {copied === "all" ? "✓ Brief complet copié" : "Copier le brief complet"}
            </button>

            <button
              onClick={() => { setResult(null); generate(); }}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: ".5px solid #dde8d8",
                background: "#f3f5f1", color: "#6b7c69", cursor: "pointer", fontSize: "13px",
                fontFamily: "'DM Sans',system-ui" }}
            >
              Regénérer une variante ↻
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
