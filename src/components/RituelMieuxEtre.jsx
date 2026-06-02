import { useState, useRef } from "react";

// ====================================================================
//  RituelMieuxEtre.jsx
//  Composant autonome : bouton "Ajouter au calendrier" pour le rituel
//  quotidien "Votre rituel mieux-être vous attend".
//  - Heures multiples
//  - Récurrence : tous les jours / en semaine
//  - Génère un .ics côté client (pas de backend)
//  - Carillon zen au clic (Web Audio API)
//  - Gestion spécifique iOS (Safari) pour ouvrir le Calendrier
// ====================================================================

// ---------- Réglages du rituel (modifiables) ----------
const TITRE = "Votre rituel mieux-être vous attend";
const DESCRIPTION = "C'est l'heure de prendre soin de vous. 🌿";
const DUREE_MINUTES = 15;

// ---------- Helpers ICS ----------
const pad = (n) => String(n).padStart(2, "0");
const formatUTC = (d) =>
  d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T"
  + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
const formatLocal = (d) =>
  d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T"
  + pad(d.getHours()) + pad(d.getMinutes()) + "00";

function prochaineOccurrence(heureStr, frequence) {
  const [h, m] = heureStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  if (frequence === "weekdays") {
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  }
  return d;
}

const regleRecurrence = (frequence) =>
  frequence === "weekdays"
    ? "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
    : "RRULE:FREQ=DAILY";

function blocVEVENT(heureStr, frequence) {
  const debut = prochaineOccurrence(heureStr, frequence);
  const fin = new Date(debut.getTime() + DUREE_MINUTES * 60000);
  return [
    "BEGIN:VEVENT",
    "UID:rituel-" + heureStr.replace(":", "") + "-" + Date.now()
      + "-" + Math.random().toString(36).slice(2, 7) + "@monjardininterieur",
    "DTSTAMP:" + formatUTC(new Date()),
    "DTSTART:" + formatLocal(debut),
    "DTEND:" + formatLocal(fin),
    regleRecurrence(frequence),
    "SUMMARY:" + TITRE,
    "DESCRIPTION:" + DESCRIPTION,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + TITRE,
    "END:VALARM",
    "END:VEVENT"
  ];
}

function genererICS(heures, frequence) {
  let lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MonJardinInterieur//FR",
    "CALSCALE:GREGORIAN"
  ];
  heures.forEach((h) => { lignes = lignes.concat(blocVEVENT(h, frequence)); });
  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}

const estIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const estMobile = () =>
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  || window.matchMedia("(max-width:639px)").matches;

// ---------- Audio : carillon zen (version douce) ----------
function frapper(ctx, dest, freq, when) {
  const niveau = 0.7 + Math.random() * 0.3;
  const partiels = [
    { ratio: 1.00, gain: 0.50, decay: 3.6 },
    { ratio: 2.76, gain: 0.14, decay: 2.2 },
    { ratio: 5.40, gain: 0.05, decay: 1.3 }
  ];
  partiels.forEach((p) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(p.gain * niveau, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + p.decay);
    g.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * p.ratio;
    osc.connect(g);
    osc.start(when);
    osc.stop(when + p.decay + 0.1);
  });
}

function jouerCarillonZen(ctx) {
  try {
    if (ctx.state === "suspended") ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    const filtre = ctx.createBiquadFilter();
    filtre.type = "lowpass";
    filtre.frequency.value = 3800;
    filtre.connect(master);
    master.connect(ctx.destination);
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    let t = ctx.currentTime;
    let derniere = -1;
    for (let i = 0; i < 6; i++) {
      let idx;
      do { idx = Math.floor(Math.random() * notes.length); }
      while (idx === derniere && notes.length > 1);
      derniere = idx;
      frapper(ctx, filtre, notes[idx], t);
      t += 0.18 + Math.random() * 0.32;
    }
  } catch (e) { /* audio indisponible */ }
}

// ---------- Composant ----------
export default function RituelMieuxEtre({ onClose }) {
  const [heures, setHeures] = useState(["08:00"]);
  const [frequence, setFrequence] = useState("daily");
  const audioCtxRef = useRef(null);

  const propres = heures.filter(Boolean);
  const libelles = {
    daily: "Rappel tous les jours à ",
    weekdays: "Rappel du lundi au vendredi à "
  };
  const formaterListe = (arr) =>
    arr.length <= 1
      ? arr.join("")
      : arr.slice(0, -1).join(", ") + " et " + arr[arr.length - 1];
  const preview = propres.length
    ? libelles[frequence] + formaterListe(propres)
    : "Ajoutez au moins une heure";

  const ajouterHeure = () => setHeures([...heures, "18:00"]);
  const retirerHeure = (i) => setHeures(heures.filter((_, j) => j !== i));
  const changerHeure = (i, v) => setHeures(heures.map((h, j) => (j === i ? v : h)));

  function programmer() {
    if (propres.length === 0) return;
    // Création/réutilisation du contexte audio sur geste utilisateur
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current) jouerCarillonZen(audioCtxRef.current);

    const contenu = genererICS(propres, frequence);

    if (estIOS()) {
      window.location.href =
        "data:text/calendar;charset=utf-8," + encodeURIComponent(contenu);
      return;
    }
    const blob = new Blob([contenu], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rituel-mieux-etre.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!estMobile()) return null;

  return (
    <div className="rmi-wrap">
      <style>{rmiStyles}</style>
      <div className="rmi-card">
        {onClose && (
          <button type="button" className="rmi-close" aria-label="Fermer" onClick={onClose}>×</button>
        )}
        <div className="rmi-brand">
          <span className="rmi-leaf">❀</span>
          <span className="rmi-brand-name">Mon jardin intérieur</span>
        </div>
        <div className="rmi-kicker">Votre moment</div>
        <h1 className="rmi-title">Votre rituel mieux-être vous attend</h1>

        <label className="rmi-label">Vos heures de rappel</label>
        <div className="rmi-times">
          {heures.map((h, i) => (
            <div className="rmi-time-row" key={i}>
              <input
                type="time"
                value={h}
                onChange={(e) => changerHeure(i, e.target.value)}
              />
              {heures.length > 1 && (
                <button
                  type="button"
                  className="rmi-remove"
                  aria-label="Retirer cette heure"
                  onClick={() => retirerHeure(i)}
                >×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="rmi-add" onClick={ajouterHeure}>
          + Ajouter une heure
        </button>

        <label className="rmi-label">Fréquence</label>
        <div className="rmi-pills">
          <button
            type="button"
            className={"rmi-pill" + (frequence === "daily" ? " active" : "")}
            onClick={() => setFrequence("daily")}
          >Tous les jours</button>
          <button
            type="button"
            className={"rmi-pill" + (frequence === "weekdays" ? " active" : "")}
            onClick={() => setFrequence("weekdays")}
          >En semaine</button>
        </div>

        <div className="rmi-preview">{preview}</div>

        <button type="button" className="rmi-cta" onClick={programmer}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="12" y1="14" x2="12" y2="18"/>
            <line x1="10" y1="16" x2="14" y2="16"/>
          </svg>
          Programmer mon rappel
        </button>
        <p className="rmi-hint">Le calendrier de votre téléphone s'ouvrira pour confirmer.</p>
      </div>
    </div>
  );
}

// ---------- Styles (scopés via le préfixe rmi-) ----------
const rmiStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Nunito+Sans:wght@400;600;700&display=swap');

.rmi-wrap {
  --ink:#2c3a33; --sage:#7d9b86; --sage-deep:#5e7e69;
  --gold:#c89b5a; --cream:#f6f2e9; --card:#fffefb; --muted:#8a958d; --line:#e6e1d4;
  font-family:'Nunito Sans',sans-serif; color:var(--ink); line-height:1.55;
  display:flex; align-items:center; justify-content:center;
  padding:24px; min-height:100%;
  background:
    radial-gradient(circle at 78% 12%, #eef3ec 0%, transparent 55%),
    radial-gradient(circle at 15% 85%, #f3ecdd 0%, transparent 50%),
    var(--cream);
}
.rmi-wrap *, .rmi-wrap *::before, .rmi-wrap *::after { box-sizing:border-box; }
.rmi-card {
  background:var(--card); border:1px solid var(--line); border-radius:26px;
  padding:40px 32px 34px; max-width:400px; width:100%;
  box-shadow:0 30px 60px -30px rgba(44,58,51,.3);
  position:relative; overflow:hidden;
}
.rmi-card::before {
  content:""; position:absolute; inset:0 0 auto 0; height:5px;
  background:linear-gradient(90deg, var(--sage), var(--gold));
}
.rmi-brand { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.rmi-leaf { font-size:28px; color:var(--sage); line-height:1; }
.rmi-brand-name {
  font-family:'Cormorant Garamond',serif; font-size:22px; font-style:italic;
  font-weight:600; color:var(--sage-deep); letter-spacing:.3px;
}
.rmi-kicker {
  font-size:11px; letter-spacing:.22em; text-transform:uppercase;
  color:var(--gold); font-weight:700; margin-bottom:12px;
}
.rmi-title {
  font-family:'Cormorant Garamond',serif; font-size:33px; font-weight:600;
  line-height:1.1; letter-spacing:.2px; margin:0 0 22px;
}
.rmi-label {
  display:block; font-size:12px; font-weight:700; letter-spacing:.05em;
  text-transform:uppercase; color:var(--muted); margin-bottom:8px;
}
.rmi-times { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
.rmi-time-row { display:flex; align-items:center; gap:8px; }
.rmi-time-row input[type="time"] {
  flex:1; font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:600;
  color:var(--ink); padding:8px 14px; border:1.5px solid var(--line);
  border-radius:14px; background:#fdfcf8;
}
.rmi-time-row input[type="time"]:focus { outline:none; border-color:var(--sage); }
.rmi-remove {
  flex:0 0 auto; width:40px; height:40px; border:1.5px solid var(--line);
  border-radius:11px; background:#fdfcf8; color:var(--muted);
  font-size:22px; line-height:1; cursor:pointer; transition:all .15s ease;
}
.rmi-remove:hover { border-color:#d98a78; color:#c0563f; background:#fcf2ee; }
.rmi-add {
  width:100%; font-family:inherit; font-size:13.5px; font-weight:700;
  color:var(--sage-deep); background:transparent; border:1.5px dashed var(--sage);
  border-radius:12px; padding:11px; cursor:pointer; margin-bottom:24px;
  transition:background .15s ease;
}
.rmi-add:hover { background:#eef3ec; }
.rmi-pills { display:flex; gap:8px; margin-bottom:26px; }
.rmi-pill {
  flex:1; font-family:inherit; font-size:13px; font-weight:600;
  padding:11px 6px; border:1.5px solid var(--line); border-radius:11px;
  background:#fdfcf8; color:var(--muted); cursor:pointer;
  transition:all .15s ease;
}
.rmi-pill.active { background:var(--sage); border-color:var(--sage); color:#fff; }
.rmi-preview {
  background:#f1f5ef; border-radius:12px; padding:12px 14px;
  font-size:13.5px; color:var(--sage-deep); text-align:center; margin-bottom:22px;
}
.rmi-cta {
  width:100%; border:none; background:var(--sage-deep); color:#fff;
  font-family:inherit; font-size:15px; font-weight:700; letter-spacing:.02em;
  padding:16px; border-radius:14px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:background .18s ease, transform .12s ease;
}
.rmi-cta:hover { background:#4f6c5a; }
.rmi-cta:active { transform:scale(.985); }
.rmi-cta svg { width:18px; height:18px; }
.rmi-hint { font-size:12px; color:var(--muted); text-align:center; margin-top:14px; }
.rmi-close {
  position:absolute; top:14px; right:14px;
  width:34px; height:34px; border-radius:50%;
  border:1.5px solid var(--line); background:#fdfcf8;
  color:var(--muted); font-size:20px; line-height:1;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all .15s ease; z-index:1;
}
.rmi-close:hover { border-color:#d98a78; color:#c0563f; background:#fcf2ee; }
`;
