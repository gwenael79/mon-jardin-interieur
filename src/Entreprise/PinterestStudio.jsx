// src/Entreprise/PinterestStudio.jsx
// Respecte fidèlement le HTML générateur d'épingles original.
import { useState, useRef, useEffect, useCallback } from "react";

const W = 1000, H = 1500;

const THEMES = [
  { id:"rituel",    label:"Rituel du jour",    hex:"#27500A", bg:"#EAF3DE", bd:"#C0DD97", tx:"#27500A", eyebrow:"Rituel du jour"    },
  { id:"neuro",     label:"Neuro & science",   hex:"#26215C", bg:"#EEEDFE", bd:"#AFA9EC", tx:"#26215C", eyebrow:"Neuro & science"   },
  { id:"fleur",     label:"Ma fleur & moi",    hex:"#4B1528", bg:"#FBEAF0", bd:"#ED93B1", tx:"#4B1528", eyebrow:"Ma fleur & moi"    },
  { id:"temoignage",label:"Témoignages",        hex:"#04342C", bg:"#E1F5EE", bd:"#5DCAA5", tx:"#04342C", eyebrow:"Témoignages"       },
  { id:"pratique",  label:"Bien-être pratique", hex:"#412402", bg:"#FAEEDA", bd:"#EF9F27", tx:"#412402", eyebrow:"Bien-être pratique"},
];

// Polyfill roundRect pour les navigateurs sans support natif
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y,     x+w, y+r,     r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h,   r);
    ctx.lineTo(x+r, y+h);   ctx.arcTo(x,   y+h, x,     y+h-r,  r);
    ctx.lineTo(x, y+r);      ctx.arcTo(x,   y,   x+r,   y,      r);
    ctx.closePath();
  }
}

// Dessine du texte centré avec retour à la ligne — retourne le nombre de lignes
function drawWrapped(ctx, text, cx, startY, maxW, lineH) {
  if (!text) return 0;
  const words = text.split(/\s+/);
  let line = "", lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineH));
  return lines.length;
}

export default function PinterestStudio() {
  const canvasRef  = useRef(null);
  const bgRef      = useRef(null);  // Image de fond
  const logoRef    = useRef(null);  // Image logo

  const [themeId,   setThemeId]   = useState(null);
  const [eyebrow,   setEyebrow]   = useState("Rituel du matin");
  const [title,     setTitle]     = useState("Le rituel du matin en 3 minutes pour un esprit apaisé");
  const [subtitle,  setSubtitle]  = useState("Respirer, s'ancrer, commencer en douceur");
  const [logoRound, setLogoRound] = useState(true);
  const [logoSrc,   setLogoSrc]   = useState(null);   // null = utilise icon-512.png par défaut
  const [bgReady,   setBgReady]   = useState(false);
  const [logoTick,  setLogoTick]  = useState(0);       // force redraw quand logo change
  const [fontsOk,   setFontsOk]   = useState(false);

  // ── Chargement des polices Google ──
  useEffect(() => {
    if (!document.getElementById("pin-fonts")) {
      const link    = document.createElement("link");
      link.id       = "pin-fonts";
      link.rel      = "stylesheet";
      link.href     = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600&family=Nunito+Sans:wght@400;600;700&display=swap";
      document.head.appendChild(link);
      link.onload   = () => document.fonts.ready.then(() => setFontsOk(true));
    } else {
      document.fonts.ready.then(() => setFontsOk(true));
    }
  }, []);

  // ── Image de fond (pinterest.png) ──
  useEffect(() => {
    const img    = new Image();
    img.onload   = () => { bgRef.current = img; setBgReady(true); };
    img.onerror  = () => { bgRef.current = null; setBgReady(true); };
    img.src      = "/pinterest.png";
  }, []);

  // ── Logo (défaut : icon-512.png, remplacé si l'utilisateur uploade) ──
  useEffect(() => {
    const src    = logoSrc ?? "/icons/icon-512.png";
    const img    = new Image();
    img.onload   = () => { logoRef.current = img; setLogoTick(n => n + 1); };
    img.onerror  = () => { logoRef.current = null; setLogoTick(n => n + 1); };
    img.src      = src;
  }, [logoSrc]);

  // ── Rendu canvas ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const th     = THEMES.find(t => t.id === themeId);
    const color  = th?.hex ?? "#9b6b42";
    const serif  = fontsOk ? "'Fraunces', Georgia, serif"           : "Georgia, serif";
    const sans   = fontsOk ? "'Nunito Sans', system-ui, sans-serif" : "system-ui, sans-serif";

    ctx.clearRect(0, 0, W, H);

    // 1 — Fond plein cadre (cover edge to edge)
    const bg = bgRef.current;
    if (bg) {
      const scale = Math.max(W / bg.width, H / bg.height);
      const sw = bg.width * scale, sh = bg.height * scale;
      ctx.drawImage(bg, (W - sw) / 2, (H - sh) / 2, sw, sh);
    } else {
      ctx.fillStyle = "#c8d8a0";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.textAlign    = "center";
    ctx.textBaseline = "top";

    // ── Pré-calcul des hauteurs de texte pour dimensionner la pill ──
    const TEXT_MAX_W = 730;
    const SUBTITLE_MAX_W = 640;

    const eyebrowY = 290;
    const dec1Y    = eyebrowY + 52;
    const titleY   = dec1Y + 36;

    // Compte les lignes du titre sans dessiner
    ctx.font = `600 66px ${serif}`;
    const tWords = (title || "").split(/\s+/);
    let tLine = "", tCount = [];
    for (const w of tWords) {
      const test = tLine ? `${tLine} ${w}` : w;
      if (ctx.measureText(test).width > TEXT_MAX_W && tLine) { tCount.push(tLine); tLine = w; }
      else tLine = test;
    }
    if (tLine) tCount.push(tLine);
    const titleLinesN = tCount.length || 1;
    const titleEndY   = titleY + titleLinesN * 84;

    const dec2Y     = titleEndY + 30;
    const subtitleY = dec2Y + 28;

    // Compte les lignes du sous-titre
    ctx.font = `italic 400 33px ${serif}`;
    let sLine = "", sCount = [];
    if (subtitle) {
      for (const w of subtitle.split(/\s+/)) {
        const test = sLine ? `${sLine} ${w}` : w;
        if (ctx.measureText(test).width > SUBTITLE_MAX_W && sLine) { sCount.push(sLine); sLine = w; }
        else sLine = test;
      }
      if (sLine) sCount.push(sLine);
    }
    const subtitleEndY = subtitle ? subtitleY + sCount.length * 50 : subtitleY;

    // 2 — Pill derrière le texte uniquement
    const pillPadX = 60, pillPadTop = 55, pillPadBot = 52;
    const pillX = W / 2 - TEXT_MAX_W / 2 - pillPadX;
    const pillY = eyebrowY - pillPadTop;
    const pillW = TEXT_MAX_W + pillPadX * 2;
    const pillH = subtitleEndY + pillPadBot - pillY;

    ctx.save();
    ctx.shadowColor   = "rgba(20,30,10,.18)";
    ctx.shadowBlur    = 32;
    ctx.shadowOffsetY = 8;
    rrPath(ctx, pillX, pillY, pillW, pillH, 28);
    ctx.fillStyle = "rgba(255,252,244,0.88)";
    ctx.fill();
    ctx.restore();

    // 3 — Eyebrow
    ctx.font = `700 25px ${sans}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
    ctx.fillStyle = color;
    ctx.fillText((eyebrow || "").toUpperCase(), W / 2, eyebrowY);

    // 4 — Ligne décorative 1
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.fillStyle = color;
    ctx.fillRect(W / 2 - 36, dec1Y, 72, 3);

    // 5 — Titre
    ctx.font      = `600 66px ${serif}`;
    ctx.fillStyle = "#252e20";
    drawWrapped(ctx, title || "", W / 2, titleY, TEXT_MAX_W, 84);

    // 6 — Ligne décorative 2
    ctx.fillStyle = color;
    ctx.fillRect(W / 2 - 26, dec2Y, 52, 2.5);

    // 7 — Sous-titre italic
    if (subtitle) {
      ctx.font      = `italic 400 33px ${serif}`;
      ctx.fillStyle = "#5e5448";
      drawWrapped(ctx, subtitle, W / 2, subtitleY, SUBTITLE_MAX_W, 50);
    }

    // 8 — Branding bas (directement sur le fond fleuri)
    const logo    = logoRef.current;
    const brandY  = H - 72;
    ctx.font      = `600 22px ${sans}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    const domainText = "monjardininterieur.com";
    const domainW    = ctx.measureText(domainText).width;
    const LR = 24;

    // halo blanc léger pour lisibilité sur fond fleuri
    ctx.save();
    ctx.shadowColor = "rgba(255,252,244,0.95)";
    ctx.shadowBlur  = 14;

    if (logo) {
      const gap    = 14;
      const totalW = LR * 2 + gap + domainW;
      const startX = W / 2 - totalW / 2;
      ctx.save();
      ctx.beginPath();
      if (logoRound) {
        ctx.arc(startX + LR, brandY, LR, 0, Math.PI * 2);
      } else {
        rrPath(ctx, startX, brandY - LR, LR * 2, LR * 2, 6);
      }
      ctx.clip();
      ctx.drawImage(logo, startX, brandY - LR, LR * 2, LR * 2);
      ctx.restore();
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "#3a3028";
      ctx.fillText(domainText, startX + LR * 2 + gap, brandY);
      ctx.textAlign    = "center";
    } else {
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "#3a3028";
      ctx.fillText(domainText, W / 2, brandY);
    }
    ctx.restore();

  }, [themeId, eyebrow, title, subtitle, logoRound, logoTick, bgReady, fontsOk]);

  useEffect(() => { draw(); }, [draw]);

  // ── Handlers ──
  const handleTheme = (t) => {
    setThemeId(t.id);
    setEyebrow(t.eyebrow);   // le thème pré-remplit le sur-titre
  };

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader    = new FileReader();
    reader.onload   = (ev) => setLogoSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a      = document.createElement("a");
    a.href       = canvas.toDataURL("image/png");
    a.download   = `pin-mji-${Date.now()}.png`;
    a.click();
  };

  // ── Styles (identiques au HTML d'origine) ──
  const V = {
    cream:"#fbf6ee", ink:"#3d4a3a", green:"#4a6741", greenSoft:"#6f8a64", line:"#e7ded0", card:"#fffdf9",
  };

  const S = {
    panel: {
      background:V.card, border:`1px solid ${V.line}`, borderRadius:20,
      padding:"26px", boxShadow:"0 18px 40px -28px rgba(74,103,65,.45)",
    },
    h2: {
      fontFamily:"'Fraunces', Georgia, serif", fontWeight:600, fontSize:19,
      margin:"0 0 18px", color:V.green,
    },
    lbl: {
      display:"block", fontSize:12, fontWeight:700, letterSpacing:".08em",
      textTransform:"uppercase", color:"#8a8275", margin:"18px 0 7px",
    },
    lblFirst: {
      display:"block", fontSize:12, fontWeight:700, letterSpacing:".08em",
      textTransform:"uppercase", color:"#8a8275", margin:"0 0 7px",
    },
    input: {
      width:"100%", border:`1px solid ${V.line}`, borderRadius:12, padding:"12px 14px",
      fontFamily:"inherit", fontSize:15, color:V.ink, background:"#fffefb",
      boxSizing:"border-box", outline:"none", resize:"vertical",
    },
    chip: (on, tx, bg, bd) => ({
      border:`1px solid ${on ? bd : V.line}`,
      background: on ? bg : "#fffefb",
      borderRadius:999, padding:"8px 13px", fontSize:13, fontWeight:600,
      cursor:"pointer", color: on ? tx : "#6b6256",
      display:"flex", alignItems:"center", gap:7, transition:".15s",
    }),
    hint: { fontSize:"12.5px", color:"#9a9082", marginTop:7, lineHeight:1.5 },
    btn: {
      marginTop:24, width:"100%", border:"none", borderRadius:13, cursor:"pointer",
      background:V.green, color:"#fff", fontFamily:"inherit", fontWeight:700,
      fontSize:15, letterSpacing:".02em", padding:15, transition:".15s",
    },
    stage: {
      background:"repeating-conic-gradient(#f3ede2 0% 25%,#efe7d8 0% 50%) 0/26px 26px",
      border:`1px solid ${V.line}`, borderRadius:20, padding:22, display:"flex", justifyContent:"center",
    },
  };

  return (
    <div style={{ background:V.cream, borderRadius:20, padding:"32px 24px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:13, letterSpacing:".22em", textTransform:"uppercase", color:V.greenSoft, fontWeight:700, margin:"0 0 8px" }}>
          Mon Jardin Intérieur
        </p>
        <h1 style={{ fontFamily:"'Fraunces', Georgia, serif", fontWeight:600, fontSize:"clamp(22px,3vw,36px)", lineHeight:1.1, margin:0, color:V.green }}>
          Générateur d'épingles Pinterest
        </h1>
        <p style={{ maxWidth:600, margin:"12px 0 0", fontSize:15, lineHeight:1.55, color:"#6b6256" }}>
          Fond fleuri intégré, logo en haut, zone claire au centre pour le texte. Tape ton contenu et télécharge en 1000 × 1500.
        </p>
      </div>

      {/* ── Layout ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 420px", gap:40, alignItems:"start" }}>

        {/* ── Panneau formulaire ── */}
        <div style={S.panel}>
          <h2 style={S.h2}>Ton contenu</h2>

          {/* Logo */}
          <label style={S.lblFirst}>
            Logo{" "}
            <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#9a9082" }}>
              (affiché en bas · défaut icon-512.png)
            </span>
          </label>
          <input type="file" accept="image/*" onChange={handleLogoFile}
            style={{ width:"100%", fontFamily:"inherit", fontSize:13, color:"#6b6256" }} />
          <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:7 }}>
            <input type="checkbox" id="pinLogoRound" checked={logoRound}
              onChange={e => setLogoRound(e.target.checked)} />
            <label htmlFor="pinLogoRound"
              style={{ fontSize:13, fontWeight:600, color:"#6b6256", cursor:"pointer" }}>
              Logo en cercle
            </label>
          </div>

          {/* Thèmes */}
          <label style={S.lbl}>
            Thème{" "}
            <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#9a9082" }}>
              (selon le tableau)
            </span>
          </label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
            {THEMES.map(t => (
              <div key={t.id} onClick={() => handleTheme(t)} style={S.chip(themeId === t.id, t.tx, t.bg, t.bd)}>
                <span style={{ width:11, height:11, borderRadius:"50%", background:t.hex, display:"inline-block", flexShrink:0 }} />
                {t.label}
              </div>
            ))}
          </div>

          {/* Eyebrow */}
          <label htmlFor="pinEyebrow" style={S.lbl}>Petit sur-titre</label>
          <input type="text" id="pinEyebrow" value={eyebrow} maxLength={34}
            onChange={e => setEyebrow(e.target.value)} style={S.input} />

          {/* Titre */}
          <label htmlFor="pinTitle" style={S.lbl}>Titre principal</label>
          <textarea id="pinTitle" rows={2} value={title} maxLength={90}
            onChange={e => setTitle(e.target.value)} style={S.input} />

          {/* Sous-titre */}
          <label htmlFor="pinSubtitle" style={S.lbl}>Sous-titre (optionnel)</label>
          <input type="text" id="pinSubtitle" value={subtitle} maxLength={70}
            onChange={e => setSubtitle(e.target.value)} style={S.input} />

          <p style={S.hint}>
            Cliquer sur un thème change la couleur et remplit le sur-titre — tu peux ensuite le modifier à la main.
            Le titre et le sous-titre, eux, restent ce que tu tapes.
          </p>

          <button style={S.btn} onClick={download}
            onMouseEnter={e => e.currentTarget.style.background = "#3c5635"}
            onMouseLeave={e => e.currentTarget.style.background = V.green}>
            ⤓ Télécharger l'épingle (PNG 1000×1500)
          </button>
        </div>

        {/* ── Prévisualisation ── */}
        <div style={{ position:"sticky", top:24 }}>
          <div style={S.stage}>
            <canvas ref={canvasRef} width={W} height={H}
              style={{ width:"100%", maxWidth:340, height:"auto", borderRadius:8,
                boxShadow:"0 22px 50px -20px rgba(60,50,30,.5)", background:"#fff" }} />
          </div>
          <p style={{ textAlign:"center", fontSize:"12.5px", color:"#9a9082", marginTop:14 }}>
            Aperçu en temps réel · format vertical 2:3
          </p>
        </div>

      </div>
    </div>
  );
}
