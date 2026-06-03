import { useState, useRef } from "react";

const TITRE = "🌿 Votre rituel mieux-être vous attend";
const DUREE_MINUTES = 15;

const pad = (n) => String(n).padStart(2, "0");
const formatLocal = (d) =>
  d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" +
  pad(d.getHours()) + pad(d.getMinutes()) + "00";
const formatUTC = (d) =>
  d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
  pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";

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
  const fin   = new Date(debut.getTime() + DUREE_MINUTES * 60000);
  const appUrl = window.location.origin;
  const description =
    "C'est l'heure de prendre soin de vous ✨\\n\\n" +
    "🌸 Votre jardin intérieur vous attend.\\n" +
    "Prenez 15 minutes pour vous recentrer.\\n\\n" +
    "🌿 Ouvrir l'application :\\n" + appUrl;
  return [
    "BEGIN:VEVENT",
    "UID:rituel-" + heureStr.replace(":", "") + "-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 7) + "@monjardininterieur",
    "DTSTAMP:" + formatUTC(new Date()),
    "DTSTART:" + formatLocal(debut),
    "DTEND:"   + formatLocal(fin),
    regleRecurrence(frequence),
    "SUMMARY:" + TITRE,
    "DESCRIPTION:" + description,
    "URL:" + appUrl,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + TITRE,
    "END:VALARM",
    "END:VEVENT",
  ];
}

function genererICS(heures, frequence) {
  let lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MonJardinInterieur//FR",
    "CALSCALE:GREGORIAN",
  ];
  heures.forEach((h) => { lignes = lignes.concat(blocVEVENT(h, frequence)); });
  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}

const estIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const estAndroid = () => /Android/i.test(navigator.userAgent);

function googleCalendarUrl(heureStr, frequence) {
  const debut = prochaineOccurrence(heureStr, frequence);
  const fin   = new Date(debut.getTime() + DUREE_MINUTES * 60000);
  const fmt   = (d) =>
    d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" +
    pad(d.getHours()) + pad(d.getMinutes()) + "00";
  const rrule = frequence === "weekdays"
    ? "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
    : "RRULE:FREQ=DAILY";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITRE,
    dates: fmt(debut) + "/" + fmt(fin),
    recur: rrule,
    details:
      "C'est l'heure de prendre soin de vous ✨\n\n" +
      "🌸 Votre jardin intérieur vous attend.\n" +
      "Ouvrir l'application : " + window.location.origin,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

// ── Carillon zen ──────────────────────────────────────────────────────────────
function frapper(ctx, dest, freq, when) {
  const niveau  = 0.7 + Math.random() * 0.3;
  const partiels = [
    { ratio: 1.00, gain: 0.50, decay: 3.6 },
    { ratio: 2.76, gain: 0.14, decay: 2.2 },
    { ratio: 5.40, gain: 0.05, decay: 1.3 },
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
  } catch (e) {}
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function RituelMieuxEtre({ onClose }) {
  const [heures,    setHeures]    = useState(["08:00"]);
  const [frequence, setFrequence] = useState("daily");
  const audioCtxRef = useRef(null);

  const propres = heures.filter(Boolean);
  const libelles = {
    daily:    "Rappel tous les jours à ",
    weekdays: "Rappel du lundi au vendredi à ",
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

  function initAudio() {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current) jouerCarillonZen(audioCtxRef.current);
  }

  function telechargerICS() {
    const contenu = genererICS(propres, frequence);
    const blob = new Blob([contenu], { type: "text/calendar;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "rituel-mieux-etre.ics";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function programmer() {
    if (propres.length === 0) return;
    initAudio();
    if (estIOS()) {
      window.location.href =
        "data:text/calendar;charset=utf-8," + encodeURIComponent(genererICS(propres, frequence));
      return;
    }
    if (estAndroid()) {
      propres.forEach((h) => window.open(googleCalendarUrl(h, frequence), "_blank", "noopener"));
      return;
    }
    telechargerICS();
  }

  return (
    <div className="rmi-wrap">
      <style>{rmiStyles}</style>
      <div className="rmi-card">
        {onClose && (
          <button type="button" className="rmi-close" aria-label="Fermer" onClick={onClose}>✕</button>
        )}
        <div className="rmi-brand">
          <span>🌿</span>
          <span className="rmi-brand-name">Mon jardin intérieur</span>
        </div>
        <div className="rmi-kicker">Votre moment</div>
        <h1 className="rmi-title">Votre rituel mieux-être vous attend</h1>
        <p className="rmi-intro">
          Choisissez l'heure à laquelle vous souhaitez prendre soin de vous chaque jour.
          Un rappel s'ajoutera à votre calendrier pour vous inviter doucement à revenir.
        </p>

        <label className="rmi-label">Vos heures de rappel</label>
        <div className="rmi-times">
          {heures.map((h, i) => (
            <div className="rmi-time-row" key={i}>
              <input
                type="time" value={h}
                onChange={(e) => changerHeure(i, e.target.value)}
              />
              {heures.length > 1 && (
                <button type="button" className="rmi-remove" onClick={() => retirerHeure(i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="rmi-add" onClick={ajouterHeure}>+ Ajouter une heure</button>

        <label className="rmi-label">Fréquence</label>
        <div className="rmi-pills">
          <button type="button" className={"rmi-pill" + (frequence === "daily"    ? " active" : "")} onClick={() => setFrequence("daily")}>Tous les jours</button>
          <button type="button" className={"rmi-pill" + (frequence === "weekdays" ? " active" : "")} onClick={() => setFrequence("weekdays")}>En semaine</button>
        </div>

        <div className="rmi-preview">{preview}</div>

        {estAndroid() ? (
          <>
            <button type="button" className="rmi-cta" onClick={programmer}>
              <CalIcon /> Ajouter à Google Agenda
            </button>
            <button type="button" className="rmi-cta-alt" onClick={() => { initAudio(); telechargerICS(); }}>
              Autre agenda (.ics)
            </button>
            <p className="rmi-hint">Google Agenda s'ouvrira — ou ouvrez le fichier .ics avec votre application Agenda.</p>
          </>
        ) : (
          <>
            <button type="button" className="rmi-cta" onClick={programmer}>
              <CalIcon /> Programmer mon rappel
            </button>
            <p className="rmi-hint">Le calendrier de votre téléphone s'ouvrira pour confirmer.</p>
          </>
        )}
      </div>
    </div>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:18, height:18 }}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
    </svg>
  );
}

const rmiStyles = `
.rmi-wrap {
  --ink:#2c3a33; --sage:#7d9b86; --sage-deep:#5e7e69;
  --gold:#c89b5a; --card:#fffefb; --muted:#8a958d; --line:#e6e1d4;
  font-family:'Jost',sans-serif; color:var(--ink); line-height:1.55;
  position:fixed; inset:0; z-index:99999;
  display:flex; align-items:center; justify-content:center;
  padding:24px; overflow-y:auto;
  background:rgba(10,5,2,0.72); backdrop-filter:blur(6px);
}
.rmi-wrap *, .rmi-wrap *::before, .rmi-wrap *::after { box-sizing:border-box; }
.rmi-card {
  background:var(--card); border:1px solid var(--line); border-radius:26px;
  padding:40px 32px 34px; max-width:400px; width:100%;
  box-shadow:0 30px 60px -20px rgba(44,58,51,.35);
  position:relative; overflow:hidden;
}
.rmi-card::before {
  content:""; position:absolute; inset:0 0 auto 0; height:5px;
  background:linear-gradient(90deg,var(--sage),var(--gold));
}
.rmi-brand { display:flex; align-items:center; gap:10px; margin-bottom:16px; font-size:22px; }
.rmi-brand-name {
  font-family:'Cormorant Garamond',serif; font-size:22px; font-style:italic;
  font-weight:600; color:var(--sage-deep);
}
.rmi-kicker {
  font-size:11px; letter-spacing:.22em; text-transform:uppercase;
  color:var(--gold); font-weight:700; margin-bottom:12px;
}
.rmi-title {
  font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:600;
  line-height:1.15; margin:0 0 20px;
}
.rmi-intro { font-size:13.5px; color:var(--muted); line-height:1.65; margin:0 0 22px; }
.rmi-label {
  display:block; font-size:11px; font-weight:700; letter-spacing:.08em;
  text-transform:uppercase; color:var(--muted); margin-bottom:8px;
}
.rmi-times { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
.rmi-time-row { display:flex; align-items:center; gap:8px; }
.rmi-time-row input[type="time"] {
  flex:1; font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:600;
  color:var(--ink); padding:8px 14px; border:1.5px solid var(--line);
  border-radius:14px; background:#fdfcf8;
}
.rmi-time-row input[type="time"]:focus { outline:none; border-color:var(--sage); }
.rmi-remove {
  width:40px; height:40px; border:1.5px solid var(--line); border-radius:11px;
  background:#fdfcf8; color:var(--muted); font-size:14px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .15s;
}
.rmi-remove:hover { border-color:#d98a78; color:#c0563f; background:#fcf2ee; }
.rmi-add {
  width:100%; font-family:inherit; font-size:13px; font-weight:700;
  color:var(--sage-deep); background:transparent; border:1.5px dashed var(--sage);
  border-radius:12px; padding:11px; cursor:pointer; margin-bottom:24px;
  transition:background .15s;
}
.rmi-add:hover { background:#eef3ec; }
.rmi-pills { display:flex; gap:8px; margin-bottom:24px; }
.rmi-pill {
  flex:1; font-family:inherit; font-size:13px; font-weight:600;
  padding:11px 6px; border:1.5px solid var(--line); border-radius:11px;
  background:#fdfcf8; color:var(--muted); cursor:pointer; transition:all .15s;
}
.rmi-pill.active { background:var(--sage); border-color:var(--sage); color:#fff; }
.rmi-preview {
  background:#f1f5ef; border-radius:12px; padding:12px 14px;
  font-size:13px; color:var(--sage-deep); text-align:center; margin-bottom:22px;
}
.rmi-cta {
  width:100%; border:none; background:var(--sage-deep); color:#fff;
  font-family:inherit; font-size:15px; font-weight:700;
  padding:16px; border-radius:14px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:background .18s, transform .12s;
}
.rmi-cta:hover { background:#4f6c5a; }
.rmi-cta:active { transform:scale(.985); }
.rmi-cta-alt {
  width:100%; border:1.5px solid var(--line); background:#fdfcf8; color:var(--muted);
  font-family:inherit; font-size:13px; font-weight:600;
  padding:12px; border-radius:14px; cursor:pointer; margin-top:10px;
  transition:background .15s;
}
.rmi-cta-alt:hover { background:#f1f5ef; color:var(--sage-deep); border-color:var(--sage); }
.rmi-hint { font-size:12px; color:var(--muted); text-align:center; margin-top:14px; }
.rmi-close {
  position:absolute; top:14px; right:14px; width:34px; height:34px;
  border-radius:50%; border:1.5px solid var(--line); background:#fdfcf8;
  color:var(--muted); font-size:14px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .15s; z-index:1;
}
.rmi-close:hover { border-color:#d98a78; color:#c0563f; background:#fcf2ee; }
`;
