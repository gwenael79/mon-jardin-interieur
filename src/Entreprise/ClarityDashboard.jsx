import { useState, useEffect } from "react";
import { supabase } from "../core/supabaseClient";

// --- Palette Mon Jardin Intérieur ---
const C = {
  cream: "#f5f1e8",
  forest: "#4a6741",
  forestDark: "#3a5233",
  rose: "#c9a0a0",
  amber: "#d4a574",
  ink: "#2e2a24",
  muted: "#8a8275",
};

// Dimensions Clarity proposées (l'API en accepte 3 max)
const DIMENSIONS = ["URL", "Device", "Browser", "OS", "Country", "Source"];

export default function ClarityDashboard() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [numDays, setNumDays] = useState(1);
  const [selectedDims, setSelectedDims] = useState(["URL", "Device", "Country"]);
  const [current, setCurrent] = useState(null); // { clarity, report }
  const [analysis, setAnalysis] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // Charge l'historique des rapports
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("mji_clarity_reports")
      .select("id, created_at, report_date, num_days, ai_summary")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) setHistory(data);
  }

  function toggleDim(dim) {
    setSelectedDims((prev) =>
      prev.includes(dim)
        ? prev.filter((d) => d !== dim)
        : prev.length < 3
        ? [...prev, dim]
        : prev,
    );
  }

  // 1) Récupère les données Clarity via l'Edge Function
  async function fetchTraffic() {
    setError("");
    setAnalysis("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("clarity-proxy", {
        body: { numOfDays: numDays, dimensions: selectedDims },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCurrent(data);
      // Enchaîne sur l'analyse IA
      await analyze(data);
      loadHistory();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // 2) Envoie le brut à claude-proxy pour une analyse en français
  async function analyze(data) {
    setAnalyzing(true);
    try {
      const prompt = `Tu es analyste web pour "Mon Jardin Intérieur", une app de bien-être.
Voici les données de fréquentation issues de Microsoft Clarity (format JSON brut) sur ${numDays} jour(s) :

${JSON.stringify(data.clarity, null, 2)}

Rédige une analyse claire et bienveillante en français (200 mots max) :
- les chiffres clés de fréquentation (sessions, visiteurs, pages vues)
- ce qui ressort sur les appareils / pays / pages
- les signaux de frustration s'il y en a (rage clicks, dead clicks, scroll faible)
- 2 à 3 actions concrètes et prioritaires.
Réponds en texte simple, sans Markdown.`;

      // claude-proxy n'exige pas d'Authorization — on appelle via fetch nu
      // pour ne pas déclencher de preflight CORS sur un header qu'il n'autorise pas.
      const proxyRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );
      if (!proxyRes.ok) throw new Error(`claude-proxy ${proxyRes.status}`);
      const raw = await proxyRes.json();

      const text =
        raw?.content?.find?.((b) => b.type === "text")?.text ||
        raw?.completion ||
        raw?.text ||
        (typeof raw === "string" ? raw : JSON.stringify(raw));

      setAnalysis(text);

      // 3) Sauvegarde l'analyse dans le rapport stocké
      if (data?.report?.id) {
        await supabase
          .from("mji_clarity_reports")
          .update({ ai_summary: text })
          .eq("id", data.report.id);
      }
    } catch (e) {
      setError("Analyse IA : " + (e.message || String(e)));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, color: C.ink, fontFamily: "Georgia, serif" }}>
      <h2 style={{ color: C.forest, fontSize: 26, marginBottom: 4 }}>
        🌿 Suivi de fréquentation
      </h2>
      <p style={{ color: C.muted, marginTop: 0 }}>
        Analyse de ton trafic via Microsoft Clarity, racontée simplement.
      </p>

      {/* Réglages */}
      <div style={{ background: C.cream, borderRadius: 16, padding: 20, marginTop: 16 }}>
        <label style={{ fontWeight: 600, color: C.forestDark }}>Période</label>
        <div style={{ display: "flex", gap: 8, margin: "8px 0 16px" }}>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setNumDays(d)}
              style={pill(numDays === d)}
            >
              {d} jour{d > 1 ? "s" : ""}
            </button>
          ))}
        </div>

        <label style={{ fontWeight: 600, color: C.forestDark }}>
          Dimensions (3 max) — {selectedDims.length}/3 sélectionnées
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
          {DIMENSIONS.map((dim) => (
            <button key={dim} onClick={() => toggleDim(dim)} style={pill(selectedDims.includes(dim))}>
              {dim}
            </button>
          ))}
        </div>

        <button
          onClick={fetchTraffic}
          disabled={loading || analyzing}
          style={{
            background: C.forest, color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 22px", fontSize: 16, cursor: loading ? "wait" : "pointer",
            opacity: loading || analyzing ? 0.6 : 1,
          }}
        >
          {loading ? "Récolte des données…" : analyzing ? "Analyse en cours…" : "Analyser mon trafic"}
        </button>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 0 }}>
          ⚠️ L'API Clarity est limitée à 10 requêtes par jour — chaque clic en consomme une.
        </p>
      </div>

      {error && (
        <div style={{ background: "#f8e0e0", color: "#8a3a3a", padding: 14, borderRadius: 12, marginTop: 16 }}>
          {error}
        </div>
      )}

      {/* Analyse IA */}
      {analysis && (
        <div style={{ background: "#fff", border: `2px solid ${C.amber}`, borderRadius: 16, padding: 20, marginTop: 16 }}>
          <h3 style={{ color: C.forest, marginTop: 0 }}>🌸 Ce que disent tes données</h3>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{analysis}</p>
        </div>
      )}

      {/* Données brutes (repli) */}
      {current?.clarity && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", color: C.muted }}>Voir les données brutes Clarity</summary>
          <pre style={{ background: "#1e1c18", color: "#cfe3c4", padding: 16, borderRadius: 12, overflow: "auto", fontSize: 12 }}>
            {JSON.stringify(current.clarity, null, 2)}
          </pre>
        </details>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: C.forestDark }}>Rapports précédents</h3>
          {history.map((r) => (
            <div key={r.id} style={{ borderLeft: `3px solid ${C.rose}`, padding: "8px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                {new Date(r.created_at).toLocaleString("fr-FR")} · {r.num_days} j
              </div>
              {r.ai_summary && (
                <div style={{ fontSize: 14, marginTop: 4 }}>{r.ai_summary.slice(0, 220)}…</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function pill(active) {
  return {
    background: active ? "#4a6741" : "#fff",
    color: active ? "#fff" : "#4a6741",
    border: "1px solid #4a6741",
    borderRadius: 999,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 14,
  };
}
