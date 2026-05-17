// src/Entreprise/TodoPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../core/supabaseClient";

const AGENT_URL = "https://islnwrgghdjozbhvugan.supabase.co/functions/v1/entreprise-agent";

const STATUS_LABELS = {
  backlog:   { label: "Backlog",   color: "#8a9e88", bg: "#f3f5f1" },
  active:    { label: "En cours",  color: "#1a3a70", bg: "#EAF1FA" },
  done:      { label: "Terminé",   color: "#04342C", bg: "#E1F5EE" },
  validated: { label: "Validé ✓",  color: "#27500A", bg: "#EAF3DE" },
};

const PRIORITY_COLORS = ["", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#90a4ae"];
const PRIORITY_LABELS = ["", "Urgent", "Haute", "Normale", "Basse", "Un jour"];

const CATEGORIES = ["dev", "contenu", "business", "technique", "autre"];

function Badge({ status }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.backlog;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: s.bg, color: s.color, letterSpacing: ".04em" }}>
      {s.label}
    </span>
  );
}

function TodoItem({ item, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const cycleStatus = () => {
    const order = ["backlog", "active", "done", "validated"];
    const next  = order[(order.indexOf(item.status) + 1) % order.length];
    onUpdate(item.id, { status: next, validated_user: next === "validated" });
  };

  return (
    <div style={{
      background: "#fff", border: ".5px solid #dde8d8", borderRadius: 10,
      marginBottom: 6, overflow: "hidden",
      borderLeft: `3px solid ${PRIORITY_COLORS[item.priority] ?? "#dde8d8"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer" }}
           onClick={() => setExpanded(e => !e)}>
        {/* Checkbox statut */}
        <button onClick={e => { e.stopPropagation(); cycleStatus(); }}
          style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: "pointer",
            border: `1.5px solid ${item.status === "validated" ? "#3B6D11" : "#c8d5c5"}`,
            background: item.status === "validated" ? "#EAF3DE" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
          {item.status === "validated" ? "✓" : item.status === "done" ? "·" : ""}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: item.status === "validated" ? "#8a9e88" : "#1a2e18",
            textDecoration: item.status === "validated" ? "line-through" : "none",
            fontWeight: item.priority <= 2 ? 600 : 400, lineHeight: 1.4 }}>
            {item.title}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
            <Badge status={item.status} />
            <span style={{ fontSize: 10, color: "#8a9e88" }}>{item.category}</span>
            {item.target_date && (
              <span style={{ fontSize: 10, color: "#b0bfae" }}>
                → {new Date(item.target_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            {item.created_by === "max" && (
              <span style={{ fontSize: 10, color: "#3B6D11", fontWeight: 600 }}>MAX</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#c8d5c5" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: ".5px solid #f0f4ee" }}>
          {item.description && (
            <p style={{ fontSize: 12, color: "#6b7c69", lineHeight: 1.6, margin: "8px 0 6px" }}>
              {item.description}
            </p>
          )}
          {item.max_notes && (
            <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#3B6D11", marginBottom: 2 }}>Note MAX</div>
              <div style={{ fontSize: 12, color: "#27500A", lineHeight: 1.5 }}>{item.max_notes}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["backlog","active","done","validated"].map(s => (
              <button key={s} onClick={() => onUpdate(item.id, { status: s })}
                style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  border: `.5px solid ${STATUS_LABELS[s].color}40`,
                  background: item.status === s ? STATUS_LABELS[s].bg : "#f9faf8",
                  color: STATUS_LABELS[s].color, fontWeight: item.status === s ? 600 : 400 }}>
                {STATUS_LABELS[s].label}
              </button>
            ))}
            <button onClick={() => onDelete(item.id)}
              style={{ marginLeft: "auto", fontSize: 10, padding: "3px 10px", borderRadius: 20,
                border: ".5px solid #f0a090", background: "#fff0ee", color: "#c0604e", cursor: "pointer" }}>
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddForm({ onAdd, onClose }) {
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [cat,      setCat]      = useState("dev");
  const [priority, setPriority] = useState(3);
  const [date,     setDate]     = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: desc.trim() || null,
      category: cat, priority, target_date: date || null, created_by: "user", status: "backlog" });
    onClose();
  };

  return (
    <div style={{ background: "#f9faf8", border: ".5px solid #dde8d8", borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la tâche…"
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: ".5px solid #dde8d8",
          fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optionnel)…" rows={2}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: ".5px solid #dde8d8",
          fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", marginBottom: 6, boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: ".5px solid #dde8d8", fontSize: 12, fontFamily: "inherit" }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(Number(e.target.value))}
          style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: ".5px solid #dde8d8", fontSize: 12, fontFamily: "inherit" }}>
          {[1,2,3,4,5].map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: ".5px solid #dde8d8", fontSize: 12, fontFamily: "inherit" }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={submit} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none",
          background: "#2d5a27", color: "#c8e6b0", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          Ajouter
        </button>
        <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 8, border: ".5px solid #dde8d8",
          background: "#f3f5f1", color: "#8a9e88", cursor: "pointer", fontSize: 12 }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function TodoPanel({ onClose, sessionId }) {
  const [todos,      setTodos]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [revising,   setRevising]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [filter,     setFilter]     = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mji_todos")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    setTodos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateTodo = async (id, patch) => {
    await supabase.from("mji_todos").update(patch).eq("id", id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const deleteTodo = async (id) => {
    await supabase.from("mji_todos").delete().eq("id", id);
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const addTodo = async (item) => {
    const { data } = await supabase.from("mji_todos").insert(item).select().single();
    if (data) setTodos(prev => [data, ...prev]);
  };

  // Extrait les items même si le JSON est tronqué ou malformé
  const extractJson = (text) => {
    // Déplie les blocs markdown si présents
    const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const src = md ? md[1].trim() : text;

    // 1. JSON complet valide
    const full = src.match(/\{[\s\S]*\}/);
    if (full) {
      try { return JSON.parse(full[0]); } catch {}
    }

    // 2. JSON tronqué — on extrait chaque objet item individuellement
    const items = [];
    // Cherche tous les objets { "title": ... } complets dans le texte
    const re = /\{(?:[^{}]|"[^"\\]*(?:\\.[^"\\]*)*")*\}/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      try {
        const obj = JSON.parse(m[0]);
        if (obj.title) items.push(obj); // ne garder que les items de tâche
      } catch {}
    }
    if (items.length > 0) return { new_items: items };
    return null;
  };

  // MAX génère la trame en consultant SAM sur la stratégie
  const generateWithMax = useCallback(async () => {
    setGenerating(true);
    setGenError("");

    const call = async (agentId, content) => {
      const res = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          session_id: `${sessionId}_gen`,
          agent_id: agentId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.text ?? "";
    };

    try {
      // Étape 1 — SAM donne les priorités stratégiques actuelles
      setGenError("SAM analyse la stratégie…");
      const samResponse = await call(
        "stratege",
        `Quelles sont les 3 à 5 priorités stratégiques actuelles de Mon Jardin Intérieur pour les 30 prochains jours ? Réponds en 5 lignes max, de façon synthétique et factuelle.`
      );

      // Étape 2 — MAX crée la todo list en tenant compte de SAM
      setGenError("MAX construit la trame…");
      const maxPrompt = `SAM (stratège) a identifié ces priorités pour MJI :\n\n${samResponse}\n\nEn te basant sur ces priorités et sur les données réelles du projet (Supabase, n8n), crée une trame de développement opérationnelle.\n\nJSON UNIQUEMENT, sans texte autour :\n{"new_items":[{"title":"<5 mots max>","description":"<10 mots max>","category":"dev|contenu|business|technique","priority":1,"status":"active|backlog"}]}\n\nRègles strictes : 10 tâches maximum. Priorités 1=urgent→5=un jour. Titres courts. Descriptions courtes.`;

      const maxResponse = await call("maestro", maxPrompt);
      const parsed = extractJson(maxResponse);

      if (!parsed || !Array.isArray(parsed.new_items)) {
        setGenError("MAX n'a pas retourné de JSON valide. Réessaie.");
        console.warn("Réponse brute MAX :", maxResponse);
        return;
      }

      let inserted = 0;
      for (const n of parsed.new_items.slice(0, 10)) {
        if (!n.title?.trim()) continue;
        const { error } = await supabase.from("mji_todos").insert({ ...n, created_by: "max" });
        if (!error) inserted++;
      }

      if (inserted === 0) {
        setGenError("Aucune tâche insérée — vérifie les permissions Supabase.");
      } else {
        setGenError("");
        await load();
      }
    } catch (e) {
      setGenError(`Erreur : ${e.message}`);
      console.error("Erreur génération", e);
    }
    setGenerating(false);
  }, [sessionId, load]);

  // Demande à MAX de réviser la liste
  const askMax = useCallback(async () => {
    setRevising(true);
    const todosSummary = todos.map(t =>
      `- [${t.status}] ${t.title} (priorité ${t.priority}, catégorie: ${t.category})${t.description ? ` — ${t.description}` : ""}`
    ).join("\n");

    const prompt = `Voici l'état actuel de ma todo list de développement :\n\n${todosSummary}\n\n[INSTRUCTION]\nRévise cette liste en te basant sur les conversations récentes et l'avancement du projet. Retourne un JSON structuré de la forme :\n{"updates":[{"id":"...","status":"...","max_notes":"...","priority":N}],"new_items":[{"title":"...","description":"...","category":"...","priority":N,"status":"backlog"}]}\nSois concis dans les max_notes (1 ligne max). Ne modifie que ce qui a évolué.`;

    try {
      const res = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          session_id: sessionId,
          agent_id: "maestro",
        }),
      });
      const data = await res.json();
      const text = data.text ?? "";

      // Parser le JSON dans la réponse de MAX
      const match = text.match(/\{[\s\S]*"updates"[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);

        // Appliquer les mises à jour
        for (const u of parsed.updates ?? []) {
          const patch = {};
          if (u.status)    patch.status    = u.status;
          if (u.max_notes) patch.max_notes = u.max_notes;
          if (u.priority)  patch.priority  = u.priority;
          if (Object.keys(patch).length) {
            patch.validated_max = true;
            await supabase.from("mji_todos").update(patch).eq("id", u.id);
          }
        }

        // Ajouter les nouveaux items
        for (const n of parsed.new_items ?? []) {
          await supabase.from("mji_todos").insert({ ...n, created_by: "max" });
        }

        await load();
      }
    } catch (e) {
      console.error("Erreur révision MAX", e);
    }
    setRevising(false);
  }, [todos, sessionId, load]);

  const filtered = filter === "all"
    ? todos
    : todos.filter(t => t.status === filter);

  const counts = {
    backlog:   todos.filter(t => t.status === "backlog").length,
    active:    todos.filter(t => t.status === "active").length,
    done:      todos.filter(t => t.status === "done").length,
    validated: todos.filter(t => t.status === "validated").length,
  };

  return (
    <div style={{
      width: 340, flexShrink: 0,
      height: "100%",
      background: "#f9faf8",
      borderLeft: ".5px solid #dde8d8",
      display: "flex", flexDirection: "column",
      animation: "slide-in-right .25s ease",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: ".5px solid #dde8d8", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2e18", fontFamily: "Georgia,serif" }}>
              📋 ToDoListe
            </div>
            <div style={{ fontSize: 10, color: "#8a9e88", marginTop: 2 }}>
              Révisée par MAX chaque matin à 8h
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f5f1", border: "none", borderRadius: "50%",
            width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#8a9e88" }}>×</button>
        </div>

        {/* Compteurs statut */}
        <div style={{ display: "flex", gap: 4 }}>
          {[["all", "Tout", todos.length], ["active", "En cours", counts.active],
            ["backlog", "Backlog", counts.backlog], ["done", "Terminé", counts.done]].map(([k, lbl, n]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ flex: 1, padding: "4px 0", borderRadius: 8, border: "none",
                background: filter === k ? "#EAF3DE" : "transparent",
                color: filter === k ? "#27500A" : "#8a9e88",
                cursor: "pointer", fontSize: 10, fontWeight: filter === k ? 600 : 400 }}>
              {lbl} <span style={{ fontWeight: 700 }}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "8px 12px", display: "flex", gap: 6, borderBottom: ".5px solid #eef1eb" }}>
        <button onClick={() => setShowAdd(a => !a)}
          style={{ flex: 1, padding: "7px", borderRadius: 8, border: ".5px solid #C0DD97",
            background: "#EAF3DE", color: "#27500A", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
          + Ajouter
        </button>
        <button onClick={askMax} disabled={revising}
          style={{ flex: 1, padding: "7px", borderRadius: 8, border: ".5px solid #dde8d8",
            background: revising ? "#f3f5f1" : "#fff", color: revising ? "#b0bfae" : "#3B6D11",
            cursor: revising ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600 }}>
          {revising ? "MAX révise…" : "🤖 Réviser avec MAX"}
        </button>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {showAdd && <AddForm onAdd={addTodo} onClose={() => setShowAdd(false)} />}

        {loading ? (
          <div style={{ textAlign: "center", color: "#8a9e88", fontSize: 12, padding: 24 }}>
            Chargement…
          </div>
        ) : todos.length === 0 ? (
          // Écran vide — MAX génère la trame
          <div style={{ padding: "24px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="MAX"
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #C0DD97" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 600, color: "#1a2e18", marginBottom: 6 }}>
                Aucune trame définie
              </div>
              <div style={{ fontSize: 12, color: "#6b7c69", lineHeight: 1.7 }}>
                MAX peut analyser l'état du projet et créer une trame de développement stratégique sur les 30 prochains jours.
              </div>
            </div>
            <button onClick={generateWithMax} disabled={generating}
              style={{ width: "100%", padding: "12px", borderRadius: 10,
                border: "none", background: generating ? "#c8d5c5" : "#1c3818",
                color: generating ? "#8a9e88" : "#c8e6b0",
                cursor: generating ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              {generating ? "MAX analyse et construit la trame…" : "Demander à MAX de créer la trame"}
            </button>
            {generating && (
              <div style={{ fontSize: 11, color: "#6b7c69", textAlign: "center", lineHeight: 1.8, background: "#EAF3DE", padding: "8px 12px", borderRadius: 8, width: "100%" }}>
                {genError || "Initialisation…"}
              </div>
            )}
            {genError && (
              <div style={{ width: "100%", padding: "10px 12px", borderRadius: 8,
                background: "#fff0ee", border: ".5px solid #f0a090",
                fontSize: 11, color: "#c0604e", lineHeight: 1.6 }}>
                ⚠️ {genError}
              </div>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#b0bfae", fontSize: 12, padding: 24 }}>
            Aucune tâche dans ce filtre.
          </div>
        ) : (
          filtered.map(t => (
            <TodoItem key={t.id} item={t} onUpdate={updateTodo} onDelete={deleteTodo} />
          ))
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
