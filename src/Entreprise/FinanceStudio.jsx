// src/Entreprise/FinanceStudio.jsx
import { useState, useMemo, useCallback, useEffect } from "react";
import { sb }                                         from "./config/supabase";
import { callClaude, MJI_SYS }                       from "./services/claude";

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const S = {
  card: { background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" },
  lbl:  { fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" },
};
const dateStr = d => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
const fmtEur  = (n,d=0) => !isFinite(n)||n===0 ? "—" : new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const fmtPct  = n => !isFinite(n)||n===0 ? "—" : n.toFixed(1)+"%";
const fmtRat  = n => !isFinite(n)||n===0 ? "—" : n.toFixed(1)+"×";

const health = s => s==="vert"
  ? { bg:"#EAF3DE", color:"#27500A", bd:"#C0DD97", label:"✓ Sain" }
  : s==="orange"
  ? { bg:"#FAEEDA", color:"#633806", bd:"#EF9F27", label:"⚠ Attention" }
  : { bg:"#FCEBEB", color:"#791F1F", bd:"#F09595", label:"✕ Critique" };

const INIT = { b2c_m:0, b2c_a:0, pro:0, ws:0, total:0, churned:0, new_u:0, acq:0, comm:0 };

function KCard({ l, v, accent }) {
  return (
    <div style={{ background:accent?"#EAF3DE":"#f3f5f1", border:accent?".5px solid #C0DD97":"none",
      borderRadius:"10px", padding:"9px 12px" }}>
      <div style={{ fontSize:"10px", color:accent?"#3B6D11":"#8a9e88", fontWeight:"500", marginBottom:"3px" }}>{l}</div>
      <div style={{ fontSize:"18px", fontWeight:"500", color:accent?"#27500A":"#1a2e18", fontFamily:"Georgia,serif" }}>{v}</div>
    </div>
  );
}

function InputRow({ l, s, k, m, set }) {
  return (
    <div style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:"10px", padding:"10px 12px" }}>
      <div style={{ fontSize:"11px", fontWeight:"500", color:"#8a9e88", marginBottom:"1px" }}>{l}</div>
      <div style={{ fontSize:"10px", color:"#b0bfae", marginBottom:"6px" }}>{s}</div>
      <input type="number" min="0" value={m[k]||""} placeholder="0"
        onChange={e => set(k, e.target.value)}
        style={{ width:"100%", padding:"7px 9px", borderRadius:"7px", border:".5px solid #dde8d8",
          background:"#fff", color:"#1a2e18", fontSize:"13px", textAlign:"right",
          boxSizing:"border-box", fontFamily:"inherit" }} />
    </div>
  );
}

export default function FinanceStudio() {
  const [tab,    setTab]    = useState("generate");
  const [m,      setM]      = useState(INIT);
  const [loading,setLoading]= useState(false);
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState(null);
  const [saved,  setSaved]  = useState(false);
  const [history,setHistory]= useState(null);

  const set = (k, v) => setM(p => ({ ...p, [k]: parseFloat(v)||0 }));
  const now = new Date();

  const k = useMemo(() => {
    const mrr     = m.b2c_m*13 + m.b2c_a*9 + m.pro*(50/12) + m.ws*0.15;
    const arr     = mrr*12;
    const subs    = m.b2c_m + m.b2c_a;
    const arpu    = subs>0 ? mrr/subs : 0;
    const churn   = m.total>0 ? (m.churned/m.total)*100 : 0;
    const ltv     = churn>0 ? arpu/(churn/100) : 0;
    const cac     = m.new_u>0 ? m.acq/m.new_u : 0;
    const ltv_cac = cac>0 ? ltv/cac : 0;
    return { mrr, arr, arpu, churn, ltv, cac, ltv_cac };
  }, [m]);

  const hasData = k.mrr > 0;

  const loadHistory = useCallback(async () => {
    try { setHistory(await sb("mji_financial_reports?select=*&order=period_year.desc,period_month.desc&limit=24")); }
    catch { setHistory([]); }
  }, []);

  useEffect(() => { if (tab==="history") loadHistory(); }, [tab, loadHistory]);

  const generate = async () => {
    setLoading(true); setResult(null); setError(null); setSaved(false);
    try {
      const r = await callClaude(
        MJI_SYS("Financier"),
        `Analyse mensuelle : MRR=${fmtEur(k.mrr)}, ARR=${fmtEur(k.arr)}, ARPU=${fmtEur(k.arpu,2)}, Churn=${fmtPct(k.churn)}, LTV=${fmtEur(k.ltv)}, CAC=${fmtEur(k.cac)}, LTV/CAC=${fmtRat(k.ltv_cac)}, Nouveaux=${m.new_u}, Churned=${m.churned}.\nJSON: {"bilan":"Synthèse 2-3 phrases directes","sante":"vert|orange|rouge","mrr_next":"estimation en €","alertes":["alerte1","alerte2"],"opportunites":["levier1","levier2"],"action_prioritaire":"1 action concrète urgente"}`
      );
      setResult(r);
      await sb("mji_financial_reports", {
        method:"POST",
        prefer:"return=representation,resolution=merge-duplicates",
        body:{
          period_month: now.getMonth()+1, period_year: now.getFullYear(),
          b2c_monthly:m.b2c_m, b2c_annual:m.b2c_a, pro_count:m.pro, workshop_sales:m.ws,
          mrr:+k.mrr.toFixed(2), arr:+k.arr.toFixed(2), arpu:+k.arpu.toFixed(2),
          churn_rate:+k.churn.toFixed(2), ltv:+k.ltv.toFixed(2), cac:+k.cac.toFixed(2),
          ltv_cac_ratio:+k.ltv_cac.toFixed(2),
          new_users:m.new_u, churned:m.churned, acq_cost:m.acq, commission_paid:m.comm,
          ia_bilan:r.bilan, ia_sante:r.sante,
          ia_alertes:r.alertes||[], ia_opportunites:r.opportunites||[], ia_action:r.action_prioritaire,
        },
      });
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
              border:  tab===t ? ".5px solid #5DCAA5":".5px solid #dde8d8",
              background: tab===t ? "#E1F5EE":"#f3f5f1",
              color:      tab===t ? "#04342C":"#6b7c69",
              fontSize:"12px", fontWeight: tab===t ? "500":"400" }}>
            {t==="generate" ? `Rapport ${MONTHS[now.getMonth()]} ${now.getFullYear()}` : `Historique ${history ? `(${history.length})`:""}` }
          </button>
        ))}
      </div>

      {tab==="generate" && (
        <>
          {hasData && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"14px" }}>
              <KCard l="MRR"     v={fmtEur(k.mrr)}    accent />
              <KCard l="ARR"     v={fmtEur(k.arr)} />
              <KCard l="ARPU"    v={fmtEur(k.arpu,2)} />
              <KCard l="Churn"   v={fmtPct(k.churn)} />
              <KCard l="LTV"     v={fmtEur(k.ltv)} />
              <KCard l="LTV/CAC" v={fmtRat(k.ltv_cac)} />
            </div>
          )}

          <p style={S.lbl}>REVENUS</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"7px", marginBottom:"12px" }}>
            <InputRow l="B2C mensuels"  s="13€/mois chacun"    k="b2c_m" m={m} set={set} />
            <InputRow l="B2C annuels"   s="9€/mois effectif"   k="b2c_a" m={m} set={set} />
            <InputRow l="Pros Premium"  s="4,17€/mois effectif" k="pro"  m={m} set={set} />
            <InputRow l="CA ateliers"   s="MJI touche 15%"     k="ws"    m={m} set={set} />
          </div>

          <p style={S.lbl}>RÉTENTION & ACQUISITION</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"7px", marginBottom:"12px" }}>
            <InputRow l="Total abonnés" s="base payante"    k="total"   m={m} set={set} />
            <InputRow l="Churned"       s="perdus ce mois"  k="churned" m={m} set={set} />
            <InputRow l="Nouveaux"      s="acquis ce mois"  k="new_u"   m={m} set={set} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"7px", marginBottom:"14px" }}>
            <InputRow l="Budget acquisition" s="ads, contenu…"  k="acq"  m={m} set={set} />
            <InputRow l="Commissions Pro"    s="10% versés"      k="comm" m={m} set={set} />
          </div>

          <button onClick={generate} disabled={!hasData||loading}
            style={{ width:"100%", padding:"11px", borderRadius:"10px", border:"none", marginBottom:"12px",
              background: hasData&&!loading ? "#2d5a27":"#c8d5c5",
              color:      hasData&&!loading ? "#c8e6b0":"#8a9e88",
              cursor:     hasData&&!loading ? "pointer":"not-allowed",
              fontSize:"14px", fontWeight:"500", fontFamily:"Georgia,serif" }}>
            {loading ? "🌱 Analyse en cours…" : hasData ? "Analyser + sauvegarder ↗" : "Saisis tes données"}
          </button>

          {error && <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#993c1d", marginBottom:"10px" }}>{error}</div>}
          {saved  && <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#27500A", marginBottom:"10px" }}>✓ Rapport sauvegardé dans Supabase</div>}

          {result && (() => {
            const h = health(result.sante);
            return (
              <div>
                <div style={{ background:h.bg, border:`.5px solid ${h.bd}`, borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:"12px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"10px", fontWeight:"500", color:h.color, marginBottom:"5px" }}>BILAN {MONTHS[now.getMonth()].toUpperCase()} {now.getFullYear()}</div>
                      <div style={{ fontSize:"13px", color:h.color, lineHeight:"1.65" }}>{result.bilan}</div>
                    </div>
                    <span style={{ fontSize:"11px", fontWeight:"500", padding:"4px 12px", borderRadius:"20px",
                      background:"rgba(255,255,255,0.55)", color:h.color, flexShrink:0 }}>{h.label}</span>
                  </div>
                  {result.mrr_next && (
                    <div style={{ marginTop:"9px", paddingTop:"9px", borderTop:`.5px solid ${h.bd}`, fontSize:"12px", color:h.color }}>
                      <span style={{ fontWeight:"500" }}>MRR projeté M+1 · </span>
                      {(parseInt(result.mrr_next)||0).toLocaleString("fr-FR")} €
                    </div>
                  )}
                </div>

                {result.alertes?.length > 0 && (
                  <div style={S.card}>
                    <div style={{ ...S.lbl, marginBottom:"8px" }}>POINTS DE VIGILANCE</div>
                    {result.alertes.map((a,i) => (
                      <div key={i} style={{ display:"flex", gap:"8px", padding:"5px 0", borderBottom: i<result.alertes.length-1?".5px solid #eef1eb":"none" }}>
                        <span style={{ color:"#D85A30", fontWeight:"500", flexShrink:0 }}>⚠</span>
                        <span style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.5" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.opportunites?.length > 0 && (
                  <div style={S.card}>
                    <div style={{ ...S.lbl, marginBottom:"8px" }}>LEVIERS DE CROISSANCE</div>
                    {result.opportunites.map((o,i) => (
                      <div key={i} style={{ display:"flex", gap:"8px", padding:"5px 0", borderBottom: i<result.opportunites.length-1?".5px solid #eef1eb":"none" }}>
                        <span style={{ color:"#3B6D11", fontWeight:"500", flexShrink:0 }}>→</span>
                        <span style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.5" }}>{o}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.action_prioritaire && (
                  <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"10px", padding:"12px 14px" }}>
                    <div style={{ ...S.lbl, color:"#3B6D11", marginBottom:"4px" }}>ACTION PRIORITAIRE</div>
                    <div style={{ fontSize:"14px", fontWeight:"500", color:"#27500A", fontFamily:"Georgia,serif", lineHeight:"1.4" }}>{result.action_prioritaire}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {tab==="history" && (
        !history
          ? <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Chargement…</div>
          : history.length===0
          ? <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Aucun rapport généré.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {history.map(r => {
                const h = health(r.ia_sante);
                return (
                  <div key={r.id} style={{ ...S.card, margin:0, borderLeft:`.3px solid ${h.bd}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                      <span style={{ fontSize:"13px", fontWeight:"500", color:"#1a2e18" }}>{MONTHS[r.period_month-1]} {r.period_year}</span>
                      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                        <span style={{ fontFamily:"Georgia,serif", fontSize:"15px", fontWeight:"600", color:"#27500A" }}>{fmtEur(r.mrr)}</span>
                        <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:h.bg, color:h.color }}>{h.label}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"12px", fontSize:"11px", color:"#8a9e88", marginBottom: r.ia_bilan?"6px":0 }}>
                      <span>ARR {fmtEur(r.arr)}</span>
                      <span>Churn {fmtPct(r.churn_rate)}</span>
                      <span>LTV/CAC {fmtRat(r.ltv_cac_ratio)}</span>
                    </div>
                    {r.ia_bilan && <div style={{ fontSize:"12px", color:"#6b7c69", lineHeight:"1.5" }}>{r.ia_bilan}</div>}
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}
