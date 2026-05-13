import { useState, useEffect, useMemo } from "react";

const SYS = `Tu es le service IA Financier de Mon Jardin Intérieur, une application de bien-être avec 4 flux de revenus : abonnements B2C mensuels (13€), B2C annuels (108€/an), Pro Premium (50€/an), et commissions ateliers (15% du CA). Tu analyses les métriques financières mensuelles et génères des insights directs, précis et actionnables. Sois bienveillant mais ne minimise pas les problèmes. Réponds UNIQUEMENT en JSON valide.`;

const buildPrompt = (m, k) => `Analyse financière mensuelle de Mon Jardin Intérieur :

REVENUS
- Abonnés B2C mensuels : ${m.b2c_monthly} × 13€ = ${(m.b2c_monthly * 13).toFixed(0)}€
- Abonnés B2C annuels  : ${m.b2c_annual} × 9€/mois = ${(m.b2c_annual * 9).toFixed(0)}€
- Pros Premium         : ${m.pro_count} × 4,17€/mois = ${(m.pro_count * 4.17).toFixed(0)}€
- Ateliers & contenus  : ${m.workshop_sales}€ CA × 15% = ${(m.workshop_sales * 0.15).toFixed(0)}€
MRR TOTAL : ${k.mrr.toFixed(0)}€
ARR projeté : ${k.arr.toFixed(0)}€

MÉTRIQUES CLÉS
- ARPU         : ${k.arpu.toFixed(2)}€/mois
- Churn rate   : ${k.churn_rate.toFixed(2)}%/mois
- LTV estimée  : ${k.ltv > 0 ? k.ltv.toFixed(0) : "N/A"}€
- CAC          : ${k.cac > 0 ? k.cac.toFixed(0) : "N/A"}€
- Ratio LTV/CAC: ${k.ltv_cac > 0 ? k.ltv_cac.toFixed(1) : "N/A"}×
- Nouveaux ce mois : ${m.new_users} abonnés
- Commission Pro payée : ${(m.commission_paid || 0).toFixed(0)}€

JSON attendu :
{
  "bilan": "Synthèse financière directe en 2-3 phrases",
  "sante": "vert | orange | rouge",
  "mrr_next": "Estimation MRR mois prochain en €, juste le chiffre",
  "alertes": ["Point de vigilance 1", "Point de vigilance 2"],
  "opportunites": ["Levier de croissance 1", "Levier 2"],
  "action_prioritaire": "Action financière la plus urgente, 1 phrase concrète"
}`;

const fmt = (n, dec = 0) => {
  if (!isFinite(n) || isNaN(n) || n === 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR",
    minimumFractionDigits: dec, maximumFractionDigits: dec,
  }).format(n);
};

const pct = (n) => (!isFinite(n) || isNaN(n) || n === 0) ? "—" : n.toFixed(1) + "%";
const ratio = (n) => (!isFinite(n) || isNaN(n) || n === 0) ? "—" : n.toFixed(1) + "×";

const INIT = {
  b2c_monthly: 0, b2c_annual: 0, pro_count: 0, workshop_sales: 0,
  total_users: 0, churned: 0, new_users: 0, acq_cost: 0, commission_paid: 0,
};

const lbl = { fontSize:"10px",fontWeight:"500",letterSpacing:".08em",color:"#8a9e88",margin:"0 0 8px" };

export default function FinancialStudio() {
  const [m, setM]          = useState(INIT);
  const [loading, setLoad] = useState(false);
  const [result, setRes]   = useState(null);
  const [error, setErr]    = useState(null);
  const [copied, setCopied]= useState("");

  useEffect(() => {
    const lk = document.createElement("link");
    lk.href = "https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap";
    lk.rel = "stylesheet";
    document.head.appendChild(lk);
  }, []);

  const set = (k, v) => setM(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const k = useMemo(() => {
    const mrr_b2c_m   = m.b2c_monthly * 13;
    const mrr_b2c_a   = m.b2c_annual * 9;
    const mrr_pro     = m.pro_count * (50 / 12);
    const mrr_ws      = m.workshop_sales * 0.15;
    const mrr         = mrr_b2c_m + mrr_b2c_a + mrr_pro + mrr_ws;
    const arr         = mrr * 12;
    const total_subs  = m.b2c_monthly + m.b2c_annual;
    const arpu        = total_subs > 0 ? mrr / total_subs : 0;
    const churn_rate  = m.total_users > 0 ? (m.churned / m.total_users) * 100 : 0;
    const ltv         = churn_rate > 0 ? arpu / (churn_rate / 100) : 0;
    const cac         = m.new_users > 0 ? m.acq_cost / m.new_users : 0;
    const ltv_cac     = cac > 0 ? ltv / cac : 0;
    return { mrr, arr, arpu, churn_rate, ltv, cac, ltv_cac, mrr_b2c_m, mrr_b2c_a, mrr_pro, mrr_ws };
  }, [m]);

  const hasData = k.mrr > 0;

  const generate = async () => {
    if (!hasData) return;
    setLoad(true); setRes(null); setErr(null);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYS,
          messages: [{ role: "user", content: buildPrompt(m, k) }],
        }),
      });
      const data  = await res.json();
      const text  = data.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no json");
      setRes(JSON.parse(match[0]));
    } catch {
      setErr("Erreur de génération. Vérifie tes données et réessaie.");
    } finally {
      setLoad(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const health = result?.sante === "vert"
    ? { bg:"#EAF3DE", color:"#27500A", border:"#C0DD97", label:"✓ Sain" }
    : result?.sante === "orange"
    ? { bg:"#FAEEDA", color:"#633806", border:"#EF9F27", label:"⚠ Attention" }
    : result?.sante === "rouge"
    ? { bg:"#FCEBEB", color:"#791F1F", border:"#F09595", label:"✕ Critique" }
    : null;

  const inp = { width:"100%", padding:"8px 10px", borderRadius:"8px", border:".5px solid #dde8d8",
    background:"#fff", color:"#1a2e18", fontSize:"14px", fontFamily:"'DM Sans',system-ui",
    textAlign:"right", boxSizing:"border-box" };

  const InputCard = ({ label, sub, k: key, unit }) => (
    <div style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:"10px", padding:"12px 14px" }}>
      <div style={{ fontSize:"11px",fontWeight:"500",color:"#8a9e88",marginBottom:"2px" }}>{label}</div>
      <div style={{ fontSize:"10px",color:"#b0bfae",marginBottom:"8px" }}>{sub}</div>
      <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
        <input type="number" min="0" value={m[key] || ""} placeholder="0"
          onChange={e => set(key, e.target.value)} style={inp} />
        {unit && <span style={{ fontSize:"11px",color:"#8a9e88",flexShrink:0 }}>{unit}</span>}
      </div>
    </div>
  );

  const KpiCard = ({ label, value, sub, accent }) => (
    <div style={{ background: accent ? "#EAF3DE" : "var(--color-background-secondary)",
      border: accent ? ".5px solid #C0DD97" : "none",
      borderRadius:"var(--border-radius-md)", padding:"10px 12px" }}>
      <div style={{ fontSize:"10px",color: accent ? "#3B6D11":"#8a9e88",fontWeight:"500",marginBottom:"4px" }}>{label}</div>
      <div style={{ fontSize:"20px",fontWeight:"500",color: accent ? "#27500A":"#1a2e18",
        fontFamily:"'Lora',Georgia,serif",lineHeight:"1.2" }}>{value}</div>
      {sub && <div style={{ fontSize:"10px",color: accent ? "#3B6D11":"#8a9e88",marginTop:"3px" }}>{sub}</div>}
    </div>
  );

  const reportText = result ? `RAPPORT FINANCIER — Mon Jardin Intérieur\n\nMRR: ${fmt(k.mrr)}\nARR: ${fmt(k.arr)}\nARPU: ${fmt(k.arpu,2)}\nChurn: ${pct(k.churn_rate)}\nLTV: ${fmt(k.ltv)}\nCAC: ${fmt(k.cac)}\nLTV/CAC: ${ratio(k.ltv_cac)}\n\nBILAN: ${result.bilan}\n\nALERTES:\n${result.alertes?.map(a=>`- ${a}`).join("\n")}\n\nOPPORTUNITÉS:\n${result.opportunites?.map(o=>`- ${o}`).join("\n")}\n\nACTION PRIORITAIRE: ${result.action_prioritaire}` : "";

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f9f7f2", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ background:"#1c3818", padding:"14px 20px", display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"20px" }}>🌿</span>
        <div>
          <p style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"15px", fontWeight:"600", color:"#c8e6b0", margin:0 }}>
            Mon Jardin Intérieur
          </p>
          <p style={{ fontSize:"10px", color:"#7ab36a", margin:0, letterSpacing:".04em" }}>
            Financial Studio IA · rapport mensuel
          </p>
        </div>
        {hasData && (
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ fontSize:"20px", fontWeight:"500", color:"#c8e6b0", fontFamily:"'Lora',Georgia,serif" }}>
              {fmt(k.mrr)}
            </div>
            <div style={{ fontSize:"10px", color:"#7ab36a" }}>MRR ce mois</div>
          </div>
        )}
      </div>

      <div style={{ padding:"20px" }}>

        {/* Revenue breakdown (shown when data entered) */}
        {hasData && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px", marginBottom:"18px" }}>
            {[
              ["B2C mensuel", fmt(k.mrr_b2c_m)],
              ["B2C annuel",  fmt(k.mrr_b2c_a)],
              ["Pro",         fmt(k.mrr_pro)],
              ["Ateliers",    fmt(k.mrr_ws)],
            ].map(([l, v]) => (
              <div key={l} style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)",
                padding:"8px 10px", textAlign:"center" }}>
                <div style={{ fontSize:"10px", color:"#8a9e88", marginBottom:"4px" }}>{l}</div>
                <div style={{ fontSize:"14px", fontWeight:"500", color:"#1a2e18", fontFamily:"'Lora',Georgia,serif" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Revenue inputs */}
        <p style={lbl}>REVENUS — SAISIE MENSUELLE</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px", marginBottom:"16px" }}>
          <InputCard label="Abonnés B2C mensuels"     sub="13€/mois chacun"        k="b2c_monthly"  unit="abonnés" />
          <InputCard label="Abonnés B2C annuels"      sub="108€/an = 9€/mois"      k="b2c_annual"   unit="abonnés" />
          <InputCard label="Pros Premium actifs"      sub="50€/an = 4,17€/mois"    k="pro_count"    unit="pros" />
          <InputCard label="CA ateliers & contenus"   sub="MJI touche 15% du CA"   k="workshop_sales" unit="€" />
        </div>

        {/* Retention + acquisition */}
        <p style={lbl}>RÉTENTION & ACQUISITION</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"16px" }}>
          <InputCard label="Total abonnés actifs"   sub="base payante totale"    k="total_users" />
          <InputCard label="Churned ce mois"        sub="abonnés perdus"         k="churned" />
          <InputCard label="Nouveaux ce mois"       sub="abonnés payants acquis" k="new_users" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px", marginBottom:"20px" }}>
          <InputCard label="Budget acquisition"     sub="ads, contenu, events…"  k="acq_cost"         unit="€" />
          <InputCard label="Commissions Pro payées" sub="10% des abos générés"   k="commission_paid"  unit="€" />
        </div>

        {/* Computed KPIs */}
        {hasData && (
          <>
            <p style={lbl}>KPIs CALCULÉS</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"20px" }}>
              <KpiCard label="MRR"         value={fmt(k.mrr)}            sub="revenus récurrents"    accent />
              <KpiCard label="ARR"         value={fmt(k.arr)}            sub="projection annuelle" />
              <KpiCard label="ARPU"        value={fmt(k.arpu,2)}         sub="revenu moyen/abonné" />
              <KpiCard label="Churn"       value={pct(k.churn_rate)}     sub="attrition mensuelle" />
              <KpiCard label="LTV"         value={fmt(k.ltv)}            sub="valeur vie client" />
              <KpiCard label="LTV / CAC"   value={ratio(k.ltv_cac)}      sub="rentabilité acquisition" />
            </div>
          </>
        )}

        {/* Generate */}
        <button onClick={generate} disabled={!hasData || loading}
          style={{ width:"100%", padding:"12px", borderRadius:"10px", border:"none", marginBottom:"16px",
            background: hasData && !loading ? "#2d5a27" : "#c8d5c5",
            color:      hasData && !loading ? "#c8e6b0" : "#8a9e88",
            cursor:     hasData && !loading ? "pointer" : "not-allowed",
            fontSize:"14px", fontWeight:"500", fontFamily:"'Lora',Georgia,serif" }}
        >
          {loading ? "🌱 Analyse financière en cours…"
            : hasData ? "Générer l'analyse IA ↗"
            : "Saisis tes données pour analyser"}
        </button>

        {error && (
          <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px",
            padding:"12px 14px", fontSize:"13px", color:"#993c1d", marginBottom:"12px" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"16px", color:"#3B6D11", marginBottom:"6px" }}>
              Analyse de tes indicateurs…
            </div>
            <div style={{ fontSize:"12px", color:"#8a9e88" }}>quelques secondes</div>
          </div>
        )}

        {result && health && (
          <div>

            {/* Bilan */}
            <div style={{ background:health.bg, border:`.5px solid ${health.border}`,
              borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em",
                    color:health.color, marginBottom:"6px" }}>BILAN CE MOIS</div>
                  <div style={{ fontSize:"14px", color:health.color, lineHeight:"1.65" }}>{result.bilan}</div>
                </div>
                <span style={{ fontSize:"11px", fontWeight:"500", padding:"4px 12px", borderRadius:"20px",
                  background:"rgba(255,255,255,0.55)", color:health.color, flexShrink:0 }}>
                  {health.label}
                </span>
              </div>
              {result.mrr_next && (
                <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:`.5px solid ${health.border}`,
                  fontSize:"13px", color:health.color }}>
                  <span style={{ fontWeight:"500" }}>MRR projeté M+1 · </span>
                  {new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(parseInt(result.mrr_next)||0)}
                </div>
              )}
            </div>

            {/* Alertes */}
            {result.alertes?.length > 0 && (
              <div style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px",
                padding:"14px 16px", marginBottom:"10px" }}>
                <div style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", marginBottom:"10px" }}>
                  POINTS DE VIGILANCE
                </div>
                {result.alertes.map((a, i) => (
                  <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start",
                    padding:"6px 0", borderBottom: i < result.alertes.length-1 ? ".5px solid #eef1eb":"none" }}>
                    <span style={{ color:"#D85A30", flexShrink:0, fontWeight:"500" }}>⚠</span>
                    <span style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.5" }}>{a}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Opportunités */}
            {result.opportunites?.length > 0 && (
              <div style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px",
                padding:"14px 16px", marginBottom:"10px" }}>
                <div style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", marginBottom:"10px" }}>
                  LEVIERS DE CROISSANCE
                </div>
                {result.opportunites.map((o, i) => (
                  <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start",
                    padding:"6px 0", borderBottom: i < result.opportunites.length-1 ? ".5px solid #eef1eb":"none" }}>
                    <span style={{ color:"#3B6D11", flexShrink:0, fontWeight:"500" }}>→</span>
                    <span style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.5" }}>{o}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action prioritaire */}
            {result.action_prioritaire && (
              <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"10px",
                padding:"12px 16px", marginBottom:"10px" }}>
                <div style={{ fontSize:"10px", fontWeight:"500", letterSpacing:".08em",
                  color:"#3B6D11", marginBottom:"5px" }}>ACTION PRIORITAIRE</div>
                <div style={{ fontSize:"14px", fontWeight:"500", color:"#27500A",
                  fontFamily:"'Lora',Georgia,serif", lineHeight:"1.4" }}>
                  {result.action_prioritaire}
                </div>
              </div>
            )}

            {/* Export */}
            <button onClick={() => copy(reportText, "report")}
              style={{ width:"100%", padding:"10px", borderRadius:"10px", border:".5px solid #c0dd97",
                background:"#EAF3DE", color:"#27500A", cursor:"pointer", fontSize:"13px",
                fontFamily:"'DM Sans',system-ui", fontWeight:"500" }}
            >
              {copied === "report" ? "✓ Rapport copié" : "Copier le rapport complet"}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
