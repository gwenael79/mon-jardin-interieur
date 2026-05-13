import { useState, useEffect } from "react";

const FUNNELS = {
  b2c: {
    label: "B2C · Utilisateurs",
    color: "#27500A", bg: "#EAF3DE", border: "#C0DD97",
    stages: [
      { id: "welcome",      label: "Bienvenue J0",       sub: "Premier contact app",      color: "#412402", bg: "#FAEEDA", border: "#EF9F27" },
      { id: "onboard_j3",   label: "Onboarding J3",      sub: "Rituel en train de s'ancrer", color: "#26215C", bg: "#EEEDFE", border: "#AFA9EC" },
      { id: "onboard_j7",   label: "Onboarding J7",      sub: "Première semaine réussie",  color: "#26215C", bg: "#EEEDFE", border: "#AFA9EC" },
      { id: "convert_j14",  label: "Conversion J14",     sub: "Pousser vers Premium",      color: "#04342C", bg: "#E1F5EE", border: "#5DCAA5" },
      { id: "convert_j21",  label: "Conversion J21",     sub: "Dernière fenêtre",          color: "#04342C", bg: "#E1F5EE", border: "#5DCAA5" },
      { id: "retention_m1", label: "Fidélisation M1",    sub: "Abonné Premium actif",      color: "#27500A", bg: "#EAF3DE", border: "#C0DD97" },
    ],
  },
  b2b: {
    label: "B2B · Professionnels",
    color: "#0C447C", bg: "#E6F1FB", border: "#B5D4F4",
    stages: [
      { id: "intro",        label: "Premier contact",    sub: "Découverte du programme",   color: "#412402", bg: "#FAEEDA", border: "#EF9F27" },
      { id: "profree_j1",   label: "Pro Free J1",        sub: "Bienvenue + guide démarrage", color: "#26215C", bg: "#EEEDFE", border: "#AFA9EC" },
      { id: "profree_j7",   label: "Pro Free J7",        sub: "Première utilisation client", color: "#26215C", bg: "#EEEDFE", border: "#AFA9EC" },
      { id: "commission",   label: "1ʳᵉ commission",     sub: "Activation prescription",   color: "#04342C", bg: "#E1F5EE", border: "#5DCAA5" },
      { id: "upgrade_pro",  label: "Upgrade Premium",    sub: "50€/an · ateliers illimités", color: "#0C447C", bg: "#E6F1FB", border: "#B5D4F4" },
      { id: "rapport_q",    label: "Rapport trimestriel", sub: "Performance & fidélisation", color: "#27500A", bg: "#EAF3DE", border: "#C0DD97" },
    ],
  },
};

const SYS = `Tu es le service IA Commercial de Mon Jardin Intérieur, une application de bien-être où l'utilisateur prend soin de sa "fleur intérieure", reflet de son état émotionnel.

Règles absolues pour chaque email :
- Ton chaleureux, humain, jamais commercial ni pushy
- Commence toujours par une valeur ou une observation juste — jamais par la vente
- Phrases courtes, aérées, lisibles sur mobile
- Maximum 180 mots dans le corps
- Signe toujours "L'équipe Mon Jardin Intérieur 🌿"
- Réponds UNIQUEMENT en JSON valide sans markdown ni explication.`;

const buildPrompt = (funnel, stage) => {
  const ctx = funnel === "b2c"
    ? `Email automatisé pour un utilisateur individuel de l'app à l'étape "${stage.label}" — ${stage.sub}.`
    : `Email automatisé pour un professionnel du bien-être (coach ou thérapeute) à l'étape "${stage.label}" — ${stage.sub}. Rappelle les avantages : 10% remise pour ses clients, 10% commission sur abonnements, 85% sur ventes d'ateliers.`;

  return `${ctx}

JSON attendu (sans aucun texte autour) :
{
  "subject": "Objet accrocheur et personnel, max 50 caractères",
  "preview": "Texte d'aperçu email client, max 90 caractères",
  "body": "Corps complet avec \\n pour sauts de ligne. CTA clair à la fin. Max 180 mots."
}`;
};

const lbl = { fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88", margin: "0 0 8px" };

export default function CommercialStudio() {
  const [funnel,   setFunnel]   = useState("b2c");
  const [stageId,  setStageId]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [copied,   setCopied]   = useState("");

  useEffect(() => {
    const lk = document.createElement("link");
    lk.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    lk.rel = "stylesheet";
    document.head.appendChild(lk);
  }, []);

  const fd    = FUNNELS[funnel];
  const stage = fd.stages.find(s => s.id === stageId);

  const generate = async () => {
    if (!stage) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYS,
          messages: [{ role: "user", content: buildPrompt(funnel, stage) }],
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

  const CopyBtn = ({ text, id, color }) => (
    <button
      onClick={() => copy(text, id)}
      style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
        border: `.5px solid ${color || "#dde8d8"}`, background: "transparent",
        color: copied === id ? "#3B6D11" : (color || "#8a9e88"),
        cursor: "pointer", fontFamily: "'DM Sans',system-ui", flexShrink: 0 }}
    >{copied === id ? "✓ Copié" : "Copier"}</button>
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
            Commercial Studio IA · emails automatisés
          </p>
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* Audience */}
        <p style={lbl}>AUDIENCE</p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          {Object.entries(FUNNELS).map(([key, f]) => (
            <button
              key={key}
              onClick={() => { setFunnel(key); setStageId(null); setResult(null); setError(null); }}
              style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                border: funnel === key ? `1.5px solid ${f.border}` : ".5px solid #dde8d8",
                background: funnel === key ? f.bg : "#fff",
                color: funnel === key ? f.color : "#6b7c69",
                fontSize: "13px", fontWeight: funnel === key ? "500" : "400",
                fontFamily: "'DM Sans',system-ui" }}
            >{f.label}</button>
          ))}
        </div>

        {/* Stage */}
        <p style={lbl}>ÉTAPE DU PARCOURS</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "6px", marginBottom: "18px" }}>
          {fd.stages.map(s => (
            <div
              key={s.id}
              onClick={() => { setStageId(s.id); setResult(null); setError(null); }}
              style={{ background: stageId === s.id ? s.bg : "#f3f5f1",
                border: `.5px solid ${stageId === s.id ? s.border : "#d8e0d5"}`,
                borderRadius: "8px", padding: "10px 12px", cursor: "pointer" }}
            >
              <div style={{ fontSize: "12px", fontWeight: "500", lineHeight: "1.3",
                color: stageId === s.id ? s.color : "#3d4d3b" }}>{s.label}</div>
              <div style={{ fontSize: "11px", lineHeight: "1.3", marginTop: "2px",
                color: stageId === s.id ? s.color : "#8a9e88", opacity: stageId === s.id ? 0.85 : 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Generate */}
        <button
          onClick={generate}
          disabled={!stage || loading}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", marginBottom: "16px",
            background: stage && !loading ? "#2d5a27" : "#c8d5c5",
            color:      stage && !loading ? "#c8e6b0" : "#8a9e88",
            cursor:     stage && !loading ? "pointer" : "not-allowed",
            fontSize: "14px", fontWeight: "500", fontFamily: "'Lora',Georgia,serif" }}
        >
          {loading ? "🌱 Rédaction en cours…"
            : stage ? `Générer · ${stage.label} ↗`
            : "Sélectionne une étape"}
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
              L'IA rédige ton email…
            </div>
            <div style={{ fontSize: "12px", color: "#8a9e88" }}>quelques secondes</div>
          </div>
        )}

        {result && (
          <div>
            {/* Email preview */}
            <div style={{ background: "#fff", border: ".5px solid #dde8d8", borderRadius: "12px", overflow: "hidden", marginBottom: "10px" }}>

              {/* Subject */}
              <div style={{ padding: "14px 16px", borderBottom: ".5px solid #eef1eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: result.preview ? "8px" : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88", marginBottom: "4px" }}>OBJET</div>
                    <div style={{ fontFamily: "'Lora',Georgia,serif", fontSize: "16px", fontWeight: "600", color: "#1a2e18", lineHeight: "1.35" }}>
                      {result.subject}
                    </div>
                  </div>
                  <CopyBtn text={result.subject} id="subj" />
                </div>
                {result.preview && (
                  <div style={{ fontSize: "12px", color: "#8a9e88", fontStyle: "italic" }}>
                    {result.preview}
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "500", letterSpacing: ".08em", color: "#8a9e88" }}>CORPS</span>
                  <CopyBtn text={result.body} id="body" />
                </div>
                <pre style={{ fontSize: "13px", color: "#1a2e18", margin: 0, whiteSpace: "pre-wrap",
                  fontFamily: "'DM Sans',system-ui", lineHeight: "1.85" }}>
                  {result.body}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => copy(`OBJET : ${result.subject}\n\n${result.preview ? `APERÇU : ${result.preview}\n\n` : ""}${result.body}`, "all")}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: ".5px solid #c0dd97",
                background: "#EAF3DE", color: "#27500A", cursor: "pointer", fontSize: "13px",
                fontFamily: "'DM Sans',system-ui", marginBottom: "8px", fontWeight: "500" }}
            >
              {copied === "all" ? "✓ Email complet copié" : "Copier l'email complet"}
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
