// src/Entreprise/SeoStudio.jsx
import { useState, useCallback, useEffect } from "react";
import { sb }                               from "./config/supabase";
import { callClaude, MJI_SYS }             from "./services/claude";

const CLUSTERS = {
  tofu: { tx:"#633806", bg:"#FAEEDA", bd:"#EF9F27", label:"TOFU · Découverte", items:[
    { id:"neuro",   label:"Neuroscience", kw:"neuroscience et bien-être",           type:"article" },
    { id:"rituels", label:"Rituels",      kw:"rituel bien-être quotidien",           type:"guide" },
    { id:"slow",    label:"Ralentir",     kw:"comment ralentir son cerveau",         type:"article" },
    { id:"emotions",label:"Émotions",     kw:"gérer ses émotions au quotidien",      type:"article" },
  ]},
  mofu: { tx:"#3C3489", bg:"#EEEDFE", bd:"#AFA9EC", label:"MOFU · Considération", items:[
    { id:"app_fr",  label:"App bien-être",kw:"meilleure application bien-être française", type:"comparatif" },
    { id:"vs",      label:"Comparatifs",  kw:"alternative Headspace Petit Bambou",        type:"comparatif" },
    { id:"pros",    label:"Pour Pros",    kw:"application coaches thérapeutes",            type:"landing" },
  ]},
  bofu: { tx:"#27500A", bg:"#EAF3DE", bd:"#C0DD97", label:"BOFU · Conversion", items:[
    { id:"marque",  label:"MJI",    kw:"Mon Jardin Intérieur application bien-être",  type:"accueil" },
    { id:"abo",     label:"Tarifs", kw:"application bien-être abonnement prix",        type:"tarifs" },
    { id:"pro_pgm", label:"Pro",    kw:"partenariat bien-être professionnel coach",    type:"landing" },
  ]},
};

const PROXY = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/claude-proxy";

const S = {
  card: { background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" },
  lbl:  { fontSize:"10px", fontWeight:"500", letterSpacing:".08em", color:"#8a9e88", margin:"0 0 8px" },
  tag:  { display:"inline-block", background:"rgba(255,255,255,0.5)", fontSize:"11px", padding:"2px 8px", borderRadius:"20px", margin:"2px" },
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

/* ── BRIEF GENERATOR ─────────────────────────────────────────────────────── */
function BriefGenerator({ onBriefSaved }) {
  const [stage,    setStage]   = useState("tofu");
  const [clusterId,setCluster] = useState(null);
  const [loading,  setLoading] = useState(false);
  const [result,   setResult]  = useState(null);
  const [error,    setError]   = useState(null);
  const [copied,   setCopied]  = useState("");
  const [saved,    setSaved]   = useState(false);

  const sd      = CLUSTERS[stage];
  const cluster = sd.items.find(c => c.id === clusterId);

  const generate = async () => {
    if (!cluster) return;
    setLoading(true); setResult(null); setError(null); setSaved(false);
    try {
      const r = await callClaude(
        MJI_SYS("Référencement SEO"),
        `Brief SEO pour un ${cluster.type} sur "${cluster.label}" (mot-clé: "${cluster.kw}").\nJSON: {"primary_keyword":"...","intent":"informatif|commercial|transactionnel","secondary_keywords":["kw1","kw2","kw3","kw4","kw5"],"meta_title":"max 60 car.","meta_description":"max 155 car.","slug":"/url-tirets","h1":"H1 légèrement différent","outline":[{"h2":"...","h3s":["...","..."]}],"angle":"différenciation MJI 1-2 phrases","word_count":1200,"internal_links":["Page 1","Page 2","Page 3"]}`
      );
      setResult(r);
      await sb("mji_seo_briefs", { method:"POST", body:{
        stage, cluster:cluster.label, primary_keyword:r.primary_keyword,
        intent:r.intent, secondary_keywords:r.secondary_keywords||[],
        meta_title:r.meta_title, meta_description:r.meta_description,
        slug:r.slug, h1:r.h1, outline:r.outline||[],
        angle:r.angle, word_count:r.word_count, internal_links:r.internal_links||[],
      }});
      setSaved(true);
      onBriefSaved?.();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <p style={S.lbl}>FUNNEL SEO</p>
      <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
        {Object.entries(CLUSTERS).map(([k,v]) => (
          <button key={k} onClick={() => { setStage(k); setCluster(null); setResult(null); }}
            style={{ flex:1, padding:"8px 6px", borderRadius:"8px", cursor:"pointer",
              border: stage===k ? `.5px solid ${v.bd}`:".5px solid #dde8d8",
              background: stage===k ? v.bg:"#f3f5f1",
              color:      stage===k ? v.tx:"#6b7c69",
              fontSize:"11px", fontWeight: stage===k ? "500":"400", textAlign:"center" }}>
            {v.label}
          </button>
        ))}
      </div>

      <p style={S.lbl}>CLUSTER</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"6px", marginBottom:"12px" }}>
        {sd.items.map(c => (
          <div key={c.id} onClick={() => { setCluster(c.id); setResult(null); setSaved(false); }}
            style={{ border: `.5px solid ${clusterId===c.id ? sd.bd:"#d8e0d5"}`,
              background: clusterId===c.id ? sd.bg:"#f3f5f1",
              color:      clusterId===c.id ? sd.tx:"#3d4d3b",
              borderRadius:"8px", padding:"10px 12px", cursor:"pointer" }}>
            <div style={{ fontSize:"12px", fontWeight:"500" }}>{c.label}</div>
            <div style={{ fontSize:"10px", opacity:.75, marginTop:"2px" }}>{c.type}</div>
          </div>
        ))}
      </div>

      {cluster && (
        <div style={{ background:"#f3f5f1", borderRadius:"8px", padding:"7px 12px", marginBottom:"12px", fontSize:"12px", color:"#6b7c69" }}>
          <span style={{ fontWeight:"500", color:"#3d4d3b" }}>Mot-clé · </span>{cluster.kw}
        </div>
      )}

      <button onClick={generate} disabled={!cluster||loading}
        style={{ width:"100%", padding:"11px", borderRadius:"10px", border:"none", marginBottom:"12px",
          background: cluster&&!loading ? "#2d5a27":"#c8d5c5",
          color:      cluster&&!loading ? "#c8e6b0":"#8a9e88",
          cursor:     cluster&&!loading ? "pointer":"not-allowed",
          fontSize:"14px", fontWeight:"500", fontFamily:"Georgia,serif" }}>
        {loading ? "🌱 Génération du brief…" : cluster ? `Générer brief + sauvegarder · ${cluster.label} ↗` : "Sélectionne un cluster"}
      </button>

      {error && <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#993c1d", marginBottom:"10px" }}>{error}</div>}
      {saved  && <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#27500A", marginBottom:"10px" }}>✓ Brief sauvegardé — passe dans "Rédiger" pour l'article complet</div>}

      {result && (
        <div>
          <div style={{ background:sd.bg, border:`.5px solid ${sd.bd}`, borderRadius:"12px", padding:"14px 16px", marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:"10px", fontWeight:"500", color:sd.tx, marginBottom:"4px" }}>MOT-CLÉ PRINCIPAL</div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:"16px", fontWeight:"600", color:sd.tx }}>{result.primary_keyword}</div>
              </div>
              <span style={{ fontSize:"11px", fontWeight:"500", padding:"3px 9px", borderRadius:"20px", background:"rgba(255,255,255,0.6)", color:sd.tx }}>{result.intent}</span>
            </div>
            {result.secondary_keywords?.length > 0 && (
              <div style={{ marginTop:"8px", display:"flex", flexWrap:"wrap", gap:"4px" }}>
                {result.secondary_keywords.map((kw,i) => <span key={i} style={{ ...S.tag, color:sd.tx }}>{kw}</span>)}
              </div>
            )}
          </div>

          {[["META TITLE",result.meta_title,"mt"],["META DESCRIPTION",result.meta_description,"md"],["SLUG",result.slug,"slug"],["H1",result.h1,"h1"]].map(([l,v,id]) => (
            <div key={id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={S.lbl}>{l}</span>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  {v?.length > 0 && <span style={{ fontSize:"10px", color:(id==="mt"&&v.length>60)||(id==="md"&&v.length>155)?"#D85A30":"#8a9e88" }}>{v.length} car.</span>}
                  <CopyBtn text={v} id={id} copied={copied} setCopied={setCopied} />
                </div>
              </div>
              <div style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.5",
                fontFamily:id==="slug"?"monospace":"inherit",
                background:id==="slug"?"#f3f5f1":"transparent",
                padding:   id==="slug"?"6px 8px":0, borderRadius:id==="slug"?"6px":0 }}>{v}</div>
            </div>
          ))}

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
              <span style={S.lbl}>PLAN ÉDITORIAL · {result.word_count} mots</span>
              <CopyBtn text={result.outline?.map(s=>`## ${s.h2}\n${s.h3s?.map(h=>`### ${h}`).join("\n")}`).join("\n\n")} id="plan" copied={copied} setCopied={setCopied} />
            </div>
            {result.outline?.map((sec,i) => (
              <div key={i} style={{ marginBottom:"8px" }}>
                <div style={{ fontSize:"12px", fontWeight:"500", color:"#1a2e18", background:"#f3f5f1", padding:"5px 8px", borderRadius:"6px", marginBottom:"3px" }}>H2 · {sec.h2}</div>
                {sec.h3s?.map((h,j) => <div key={j} style={{ fontSize:"11px", color:"#6b7c69", padding:"3px 8px 3px 18px" }}>H3 · {h}</div>)}
              </div>
            ))}
          </div>

          {result.angle && (
            <div style={{ ...S.card, background:"#f3f5f1", border:".5px solid #e4ece0" }}>
              <div style={S.lbl}>ANGLE MJI</div>
              <div style={{ fontSize:"13px", color:"#1a2e18", lineHeight:"1.6", fontStyle:"italic" }}>{result.angle}</div>
              {result.internal_links?.length > 0 && (
                <div style={{ marginTop:"8px", paddingTop:"7px", borderTop:".5px solid #dde8d8" }}>
                  {result.internal_links.map((lk,i) => <div key={i} style={{ fontSize:"12px", color:"#3B6D11", padding:"2px 0" }}>→ {lk}</div>)}
                </div>
              )}
            </div>
          )}

          <button onClick={() => { setResult(null); generate(); }}
            style={{ width:"100%", padding:"9px", borderRadius:"10px", border:".5px solid #dde8d8", background:"#f3f5f1", color:"#6b7c69", cursor:"pointer", fontSize:"13px" }}>
            Regénérer ↻
          </button>
        </div>
      )}
    </>
  );
}

/* ── ARTICLE GENERATOR ───────────────────────────────────────────────────── */
function ArticleGenerator() {
  const [briefs,  setBriefs]  = useState(null);
  const [briefId, setBriefId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState("");
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    sb("mji_seo_briefs?select=id,cluster,primary_keyword,h1,outline,angle,word_count,meta_title,meta_description,slug,secondary_keywords,internal_links,article_content,created_at&order=created_at.desc&limit=30")
      .then(setBriefs)
      .catch(() => setBriefs([]));
  }, []);

  const brief = briefs?.find(b => b.id === briefId);

  const generate = async () => {
    if (!brief) return;
    setLoading(true); setArticle(null); setError(null); setSaved(false);

    const plan = brief.outline?.map(s =>
      `## ${s.h2}\n${s.h3s?.map(h => `### ${h}`).join("\n")}`
    ).join("\n\n");

    const prompt = `Rédige un article de blog complet pour Mon Jardin Intérieur.

MOT-CLÉ PRINCIPAL : ${brief.primary_keyword}
MOTS-CLÉS SECONDAIRES : ${brief.secondary_keywords?.join(", ")}
H1 : ${brief.h1}
ANGLE DIFFÉRENCIANT : ${brief.angle}
NOMBRE DE MOTS CIBLE : ${brief.word_count || 1200}
LIENS INTERNES À INTÉGRER : ${brief.internal_links?.join(", ")}

PLAN À RESPECTER :
${plan}

RÈGLES :
- Accroche émotionnelle forte (jamais "Dans cet article")
- Intègre naturellement le mot-clé dans les 100 premiers mots
- Chaque H2 : 150-250 mots · chaque H3 : 80-150 mots
- Phrases courtes, aérées, lisibles sur mobile
- Termine par un CTA doux vers Mon Jardin Intérieur
- Intègre les liens internes naturellement
- Respecte exactement l'ordre du plan

Réponds directement en Markdown — pas de JSON, pas d'intro, juste l'article.`;

    try {
      const res = await fetch(PROXY, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 4000,
          system:     `Tu es le rédacteur SEO de Mon Jardin Intérieur. Tu rédiges des articles de blog optimisés, dans un ton personnel, poétique et ancré. Tu réponds directement en Markdown — jamais en JSON.`,
          messages:   [{ role:"user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Erreur proxy ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      if (!text) throw new Error("Réponse vide");
      setArticle(text);

      await sb(`mji_seo_briefs?id=eq.${brief.id}`, {
        method: "PATCH",
        body:   { article_content: text, article_generated_at: new Date().toISOString() },
      });
      setSaved(true);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const wordCount = article ? article.split(/\s+/).filter(Boolean).length : 0;

  if (!briefs) return <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Chargement des briefs…</div>;

  if (briefs.length === 0) return (
    <div style={{ background:"#f3f5f1", borderRadius:"12px", padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:"32px", marginBottom:"10px" }}>📋</div>
      <div style={{ fontSize:"14px", fontWeight:"500", color:"#3d4d3b", marginBottom:"6px" }}>Aucun brief disponible</div>
      <div style={{ fontSize:"12px", color:"#8a9e88" }}>Génère d'abord un brief dans l'onglet "Brief"</div>
    </div>
  );

  return (
    <>
      <p style={S.lbl}>SÉLECTIONNE UN BRIEF</p>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"14px" }}>
        {briefs.map(b => (
          <div key={b.id} onClick={() => { setBriefId(b.id); setArticle(null); setSaved(false); setError(null); }}
            style={{ border: `.5px solid ${briefId===b.id ? "#C0DD97":"#d8e0d5"}`,
              background: briefId===b.id ? "#EAF3DE":"#f3f5f1",
              borderRadius:"10px", padding:"10px 14px", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:"500", color:briefId===b.id?"#27500A":"#1a2e18", marginBottom:"2px" }}>
                  {b.h1 || b.primary_keyword}
                </div>
                <div style={{ fontSize:"11px", color:"#8a9e88" }}>{b.cluster} · {b.word_count||1200} mots</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px", flexShrink:0 }}>
                {b.article_content && (
                  <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:"#EAF3DE", color:"#27500A" }}>✓ Rédigé</span>
                )}
                <span style={{ fontSize:"10px", color:"#b0bfae" }}>{dateStr(b.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {brief && (
        <div style={{ background:"#f3f5f1", border:".5px solid #e4ece0", borderRadius:"10px", padding:"10px 14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", fontWeight:"500", color:"#8a9e88", marginBottom:"6px" }}>BRIEF SÉLECTIONNÉ</div>
          <div style={{ fontSize:"12px", color:"#3d4d3b", lineHeight:"1.7" }}>
            <span style={{ fontWeight:"500" }}>Mot-clé · </span>{brief.primary_keyword}<br/>
            <span style={{ fontWeight:"500" }}>Angle · </span><span style={{ fontStyle:"italic" }}>{brief.angle}</span>
          </div>
        </div>
      )}

      <button onClick={generate} disabled={!brief||loading}
        style={{ width:"100%", padding:"11px", borderRadius:"10px", border:"none", marginBottom:"12px",
          background: brief&&!loading ? "#2d5a27":"#c8d5c5",
          color:      brief&&!loading ? "#c8e6b0":"#8a9e88",
          cursor:     brief&&!loading ? "pointer":"not-allowed",
          fontSize:"14px", fontWeight:"500", fontFamily:"Georgia,serif" }}>
        {loading ? "🌱 Rédaction en cours… (20-40 sec)" : brief ? "Rédiger l'article complet ↗" : "Sélectionne un brief"}
      </button>

      {loading && (
        <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"10px", padding:"12px 14px", marginBottom:"12px" }}>
          <div style={{ fontSize:"13px", color:"#27500A", fontFamily:"Georgia,serif", marginBottom:"3px" }}>L'IA rédige ton article…</div>
          <div style={{ fontSize:"12px", color:"#3B6D11" }}>Un article de {brief?.word_count||1200} mots prend 20 à 40 secondes. Ne ferme pas la page.</div>
        </div>
      )}

      {error && <div style={{ background:"#fff0ee", border:".5px solid #f0a090", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#993c1d", marginBottom:"10px" }}>{error}</div>}
      {saved  && <div style={{ background:"#EAF3DE", border:".5px solid #C0DD97", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#27500A", marginBottom:"10px" }}>✓ Article sauvegardé dans Supabase</div>}

      {article && (
        <div>
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div>
                <span style={S.lbl}>ARTICLE COMPLET</span>
                <span style={{ fontSize:"11px", color:"#8a9e88", marginLeft:"8px" }}>{wordCount} mots</span>
              </div>
              <CopyBtn text={article} id="article" copied={copied} setCopied={setCopied} />
            </div>
            <pre style={{ fontSize:"13px", color:"#1a2e18", margin:0, whiteSpace:"pre-wrap",
              lineHeight:"1.85", fontFamily:"inherit", maxHeight:"500px", overflowY:"auto" }}>
              {article}
            </pre>
          </div>

          <div style={{ ...S.card, background:"#f3f5f1", border:".5px solid #e4ece0" }}>
            <div style={{ ...S.lbl, marginBottom:"10px" }}>BLOC SEO — À COLLER DANS TON CMS</div>
            {[
              ["URL (slug)",   brief.slug,             "cms-slug"],
              ["Meta title",   brief.meta_title,       "cms-mt"],
              ["Meta desc.",   brief.meta_description, "cms-md"],
            ].map(([l,v,id]) => (
              <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                gap:"10px", padding:"7px 0", borderBottom:".5px solid #dde8d8" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"10px", color:"#8a9e88", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"12px", color:"#1a2e18", fontFamily:id==="cms-slug"?"monospace":"inherit" }}>{v}</div>
                </div>
                <CopyBtn text={v} id={id} copied={copied} setCopied={setCopied} />
              </div>
            ))}
          </div>

          <button onClick={() => { setArticle(null); generate(); }}
            style={{ width:"100%", padding:"9px", borderRadius:"10px", border:".5px solid #dde8d8", background:"#f3f5f1", color:"#6b7c69", cursor:"pointer", fontSize:"13px" }}>
            Regénérer une variante ↻
          </button>
        </div>
      )}
    </>
  );
}

/* ── HISTORIQUE ──────────────────────────────────────────────────────────── */
function BriefHistory() {
  const [history,  setHistory]  = useState(null);
  const [copied,   setCopied]   = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    sb("mji_seo_briefs?select=*&order=created_at.desc&limit=30")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  if (!history) return <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Chargement…</div>;
  if (history.length === 0) return <div style={{ textAlign:"center", padding:"24px", color:"#8a9e88" }}>Aucun brief généré.</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {history.map(b => {
        const c    = CLUSTERS[b.stage] || CLUSTERS.tofu;
        const open = expanded === b.id;
        return (
          <div key={b.id} style={{ background:"#fff", border:".5px solid #dde8d8", borderRadius:"12px", overflow:"hidden" }}>
            <div onClick={() => setExpanded(open ? null : b.id)}
              style={{ padding:"12px 14px", cursor:"pointer", display:"flex",
                justifyContent:"space-between", alignItems:"flex-start", gap:"8px" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:"5px", marginBottom:"5px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:c.bg, color:c.tx }}>{b.stage?.toUpperCase()}</span>
                  <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:"#f3f5f1", color:"#6b7c69" }}>{b.cluster}</span>
                  {b.article_content && <span style={{ fontSize:"10px", fontWeight:"500", padding:"2px 7px", borderRadius:"20px", background:"#EAF3DE", color:"#27500A" }}>✓ Article</span>}
                </div>
                <div style={{ fontSize:"13px", fontWeight:"500", color:"#1a2e18", marginBottom:"2px" }}>{b.primary_keyword}</div>
                {b.meta_title && <div style={{ fontSize:"11px", color:"#8a9e88" }}>{b.meta_title}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px", flexShrink:0 }}>
                <span style={{ fontSize:"10px", color:"#b0bfae" }}>{dateStr(b.created_at)}</span>
                <span style={{ fontSize:"12px", color:"#8a9e88" }}>{open ? "▲" : "▼"}</span>
              </div>
            </div>

            {open && (
              <div style={{ borderTop:".5px solid #f3f5f1", padding:"12px 14px", background:"#f9faf8" }}>
                {b.h1 && <div style={{ fontFamily:"Georgia,serif", fontSize:"15px", fontWeight:"600", color:"#1a2e18", marginBottom:"10px" }}>{b.h1}</div>}
                {b.outline?.length > 0 && (
                  <div style={{ marginBottom:"10px" }}>
                    <div style={S.lbl}>PLAN</div>
                    {b.outline.map((sec,i) => (
                      <div key={i} style={{ marginBottom:"6px" }}>
                        <div style={{ fontSize:"12px", fontWeight:"500", color:"#1a2e18" }}>H2 · {sec.h2}</div>
                        {sec.h3s?.map((h,j) => <div key={j} style={{ fontSize:"11px", color:"#6b7c69", paddingLeft:"12px" }}>H3 · {h}</div>)}
                      </div>
                    ))}
                  </div>
                )}
                {b.article_content && (
                  <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:".5px solid #dde8d8" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                      <span style={S.lbl}>ARTICLE</span>
                      <CopyBtn text={b.article_content} id={`art-${b.id}`} copied={copied} setCopied={setCopied} />
                    </div>
                    <pre style={{ fontSize:"12px", color:"#3d4d3b", whiteSpace:"pre-wrap",
                      lineHeight:"1.7", maxHeight:"300px", overflowY:"auto",
                      fontFamily:"inherit", margin:0 }}>
                      {b.article_content.substring(0, 800)}{b.article_content.length > 800 ? "…" : ""}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── ROOT ────────────────────────────────────────────────────────────────── */
export default function SeoStudio() {
  const [tab, setTab] = useState("brief");

  const TABS = [
    { id:"brief",   label:"Brief"      },
    { id:"rediger", label:"Rédiger"    },
    { id:"history", label:"Historique" },
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"8px", borderRadius:"8px", cursor:"pointer",
              border:  tab===t.id ? ".5px solid #EF9F27":".5px solid #dde8d8",
              background: tab===t.id ? "#FAEEDA":"#f3f5f1",
              color:      tab===t.id ? "#633806":"#6b7c69",
              fontSize:"12px", fontWeight: tab===t.id ? "500":"400" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="brief"   && <BriefGenerator onBriefSaved={() => {}} />}
      {tab==="rediger" && <ArticleGenerator />}
      {tab==="history" && <BriefHistory />}
    </div>
  );
}
