// src/Entreprise/CalendrierPub.jsx
import { useState, useEffect } from "react";
import { sb } from "./config/supabase";

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",  color: "#1877F2" },
  { key: "instagram", label: "Instagram", color: "#E1306C" },
  { key: "tiktok",    label: "TikTok",    color: "#010101" },
  { key: "pinterest", label: "Pinterest", color: "#E60023" },
];

// Jours planifiés par plateforme (0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam)
const SCHEDULE = {
  facebook:  [0, 1, 2, 3, 4, 5],
  instagram: [1, 2, 4, 6],
  tiktok:    [1, 2, 4, 6],
  pinterest: [0, 1, 3, 4, 5, 6],
};

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_NAMES = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

export default function CalendrierPub() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [logs,  setLogs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, [year, month]);

  async function loadLogs() {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to   = new Date(year, month + 1, 1).toISOString();
      const data = await sb(
        `workflow_logs?executed_at=gte.${from}&executed_at=lt.${to}&order=executed_at.asc&limit=500`
      );
      setLogs(data || []);
    } catch (e) { setLogs([]); }
    setLoading(false);
  }

  // Grouper logs par jour+plateforme : { "2024-06-09": { facebook: "success"|"error" } }
  const byDay = {};
  for (const log of logs) {
    const d = new Date(log.executed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!byDay[key]) byDay[key] = {};
    const p = log.platform.toLowerCase();
    if (!byDay[key][p] || log.status === "error") byDay[key][p] = log.status;
  }

  const daysInMonth   = getDaysInMonth(year, month);
  const firstDow      = getFirstDow(year, month);
  const todayStr      = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  function prevMonth() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  // Stats du mois
  const stats = {};
  for (const p of PLATFORMS) stats[p.key] = { success:0, error:0, planned:0 };
  for (const dayData of Object.values(byDay)) {
    for (const [pk, status] of Object.entries(dayData)) {
      if (stats[pk]) stats[pk][status]++;
    }
  }

  // Total succès et total prévu sur le mois (jours passés + aujourd'hui)
  const totalSuccess = Object.values(stats).reduce((s, p) => s + p.success, 0);
  const totalError   = Object.values(stats).reduce((s, p) => s + p.error,   0);

  // Compter tous les créneaux planifiés du mois (entier)
  let totalPlanned = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    for (const p of PLATFORMS) {
      if (SCHEDULE[p.key].includes(dow)) totalPlanned++;
    }
  }

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
        <div>
          <div style={{ fontSize:"16px", fontWeight:"600", color:"#1c3818" }}>Calendrier pub</div>
          <div style={{ fontSize:"12px", color:"#7ab36a", marginTop:"2px" }}>4 workflows · suivi automatique</div>
          <div style={{ marginTop:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ background:"#EAF3DE", border:".5px solid #5DCAA5", borderRadius:"10px",
              padding:"5px 14px", display:"flex", alignItems:"center", gap:"7px" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#5DCAA5" }} />
              <span style={{ fontSize:"15px", fontWeight:"700", color:"#1c3818" }}>{totalSuccess}</span>
              <span style={{ fontSize:"12px", color:"#3B6D11" }}>pub réussies</span>
            </div>
            {totalError > 0 && (
              <div style={{ background:"#fff0f0", border:".5px solid #e05252", borderRadius:"10px",
                padding:"5px 14px", display:"flex", alignItems:"center", gap:"7px" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#e05252" }} />
                <span style={{ fontSize:"15px", fontWeight:"700", color:"#c0392b" }}>{totalError}</span>
                <span style={{ fontSize:"12px", color:"#c0392b" }}>échec{totalError>1?"s":""}</span>
              </div>
            )}
            <span style={{ fontSize:"12px", color:"#aaa" }}>
              sur {totalPlanned} prévus
            </span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <button onClick={prevMonth} style={btnStyle}>‹</button>
          <span style={{ fontSize:"14px", fontWeight:"500", color:"#1c3818", minWidth:"130px", textAlign:"center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} style={btnStyle}>›</button>
        </div>
      </div>

      {/* Stats plateformes */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"14px" }}>
        {PLATFORMS.map(p => (
          <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"6px",
            background:"#f0f7ea", borderRadius:"20px", padding:"4px 12px",
            border:".5px solid #C0DD97" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }} />
            <span style={{ fontSize:"12px", color:"#1c3818", fontWeight:"500" }}>{p.label}</span>
            {stats[p.key].success > 0 &&
              <span style={{ fontSize:"11px", color:"#5DCAA5", fontWeight:"600" }}>
                {stats[p.key].success}✓
              </span>}
            {stats[p.key].error > 0 &&
              <span style={{ fontSize:"11px", color:"#e05252", fontWeight:"600", marginLeft:2 }}>
                {stats[p.key].error}✗
              </span>}
          </div>
        ))}
      </div>

      {/* Grille */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"50px", color:"#7ab36a", fontSize:"13px" }}>
          Chargement…
        </div>
      ) : (
        <div style={{ border:".5px solid #C0DD97", borderRadius:"12px", overflow:"hidden", background:"#fff" }}>
          {/* En-têtes */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
            background:"#EAF3DE", borderBottom:".5px solid #C0DD97" }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign:"center", padding:"10px 0",
                fontSize:"12px", fontWeight:"600", color:"#3B6D11" }}>{d}</div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} style={cellStyle(false, false)} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateKey = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayData = byDay[dateKey] || {};
              const isToday = dateKey === todayStr;
              const isPast  = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              // Jour de la semaine JS (0=dim..6=sam)
              const dow = new Date(year, month, day).getDay();

              return (
                <div key={day} style={cellStyle(isToday, false)}>
                  <div style={{ fontSize:"14px", fontWeight: isToday ? "700":"400",
                    color: isToday ? "#1c3818":"#888", marginBottom:"6px",
                    background: isToday ? "#c8e6b0":"transparent",
                    width:"22px", height:"22px", borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {day}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                    {PLATFORMS.map(p => {
                      const scheduled = SCHEDULE[p.key].includes(dow);
                      const status    = dayData[p.key];

                      if (status) {
                        // Log réel : vert ou rouge
                        return (
                          <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                            <div style={{ width:11, height:11, borderRadius:"50%", flexShrink:0,
                              background: status === "success" ? "#5DCAA5" : "#e05252" }} />
                            <span style={{ fontSize:"13px", color:"#333", lineHeight:1 }}>{p.label}</span>
                          </div>
                        );
                      }

                      if (scheduled) {
                        // Prévu mais pas encore de log : gris
                        return (
                          <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                            <div style={{ width:11, height:11, borderRadius:"50%", flexShrink:0,
                              background: "#ccc",
                              border: isPast ? "1.5px solid #e05252" : "none" }} />
                            <span style={{ fontSize:"13px", color:"#aaa", lineHeight:1 }}>{p.label}</span>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Légende */}
      <div style={{ display:"flex", gap:"16px", marginTop:"12px", flexWrap:"wrap" }}>
        {[
          { color:"#5DCAA5", label:"Succès" },
          { color:"#e05252", label:"Échec" },
          { color:"#ccc",    label:"Prévu", border:"none" },
          { color:"#ccc",    label:"Prévu (passé sans log)", border:"1.5px solid #e05252" },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <div style={{ width:9, height:9, borderRadius:"50%", background:color,
              border: border || "none", flexShrink:0 }} />
            <span style={{ fontSize:"11px", color:"#666" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle = {
  width:"30px", height:"30px", borderRadius:"50%",
  border:".5px solid #C0DD97", background:"#EAF3DE",
  color:"#1c3818", cursor:"pointer", fontSize:"18px",
  display:"flex", alignItems:"center", justifyContent:"center", padding:0,
};

function cellStyle(isToday) {
  return {
    minHeight: "90px",
    padding: "8px 7px",
    borderRight: ".5px solid #eee",
    borderBottom: ".5px solid #eee",
    background: isToday ? "#f5fbf0" : "transparent",
    boxSizing: "border-box",
    verticalAlign: "top",
  };
}
