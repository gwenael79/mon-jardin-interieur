// src/Entreprise/TikTokStudio.jsx
// Studio TikTok manuel : clip + musique + voix + textes → Buffer
import { useState, useRef, useCallback, useEffect } from "react";

const SUPA_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY;
const WEBHOOK     = "https://n8n.srv1667605.hstgr.cloud/webhook/tiktok-studio";
const SUPA_VIDEO_BASE = `${SUPA_URL}/storage/v1/object/public/n8n-images/posts`;
const AGENT_URL   = `${SUPA_URL}/functions/v1/entreprise-agent`;

// Clips disponibles dans /public/reseaux/
const CLIPS = [
  { id:"MJI1" }, { id:"MJI2" }, { id:"MJI3" }, { id:"MJI4" },
  { id:"MJI5" }, { id:"MJI6" }, { id:"MJI7" },
];

// Pistes disponibles dans /public/musique/ (servies comme fichiers statiques)
const MUSIC_TRACKS = [
  { id:"music_prog",  label:"Music Prog",    src:"/musique/Music prog.mp3" },
  { id:"clair_lune",  label:"Clair de Lune", src:"/musique/Clair de Lune.mp3" },
  { id:"music2",      label:"Piste 2",        src:"/musique/music2.mp3" },
  { id:"music3",      label:"Piste 3",        src:"/musique/music3.mp3" },
  { id:"music4",      label:"Piste 4",        src:"/musique/music4.mp3" },
  { id:"music5",      label:"Piste 5",        src:"/musique/music5.mp3" },
  { id:"music6",      label:"Piste 6",        src:"/musique/music6.mp3" },
];
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

const V = {
  bg:"#0e0e0e", card:"#1a1a1a", border:"#2a2a2a",
  accent:"#ff2d55", accentSoft:"rgba(255,45,85,0.12)",
  green:"#00f5a0", text:"#f0f0f0", sub:"#888", hint:"#555",
};

const S = {
  section: {
    background:V.card, border:`1px solid ${V.border}`,
    borderRadius:16, padding:"20px 22px", marginBottom:16,
  },
  label: {
    display:"block", fontSize:11, fontWeight:700,
    letterSpacing:".1em", textTransform:"uppercase",
    color:V.sub, marginBottom:10,
  },
  input: {
    width:"100%", background:"#111", border:`1px solid ${V.border}`,
    borderRadius:10, padding:"11px 14px", fontFamily:"inherit",
    fontSize:14, color:V.text, boxSizing:"border-box",
    outline:"none", resize:"vertical",
  },
  chip: (on) => ({
    border:`1px solid ${on ? V.accent : V.border}`,
    background: on ? V.accentSoft : "#111",
    borderRadius:999, padding:"6px 13px", fontSize:12,
    fontWeight:600, cursor:"pointer",
    color: on ? V.accent : V.sub,
    transition:".15s", whiteSpace:"nowrap",
  }),
  btn: (color="#ff2d55", bg=V.accentSoft) => ({
    border:`1px solid ${color}`, borderRadius:12, padding:"11px 18px",
    background:bg, color:color, fontFamily:"inherit",
    fontWeight:700, fontSize:13, cursor:"pointer", transition:".15s",
  }),
};

async function uploadToSupabase(file, folder) {
  const name = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const res = await fetch(
    `${SUPA_URL}/storage/v1/object/tiktok-studio/${name}`,
    {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": `Bearer ${SUPA_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    }
  );
  if (!res.ok) throw new Error(`Upload échoué (${res.status})`);
  return `${SUPA_URL}/storage/v1/object/public/tiktok-studio/${name}`;
}

function Section({ title, icon, children }) {
  return (
    <div style={S.section}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em",
        textTransform:"uppercase", color:V.sub, marginBottom:14,
        display:"flex", alignItems:"center", gap:8 }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

function UploadZone({ label, accept, onFile, file, uploading }) {
  const ref = useRef();
  // Réinitialise l'input DOM quand le fichier est effacé,
  // sinon onChange ne se redéclenche pas si on resélectionne le même fichier
  useEffect(() => {
    if (!file && ref.current) ref.current.value = '';
  }, [file]);
  return (
    <div>
      <div onClick={() => ref.current?.click()}
        style={{ border:`1.5px dashed ${file ? V.accent : V.border}`,
          borderRadius:10, padding:"12px 14px", cursor:"pointer",
          background: file ? V.accentSoft : "#111",
          display:"flex", alignItems:"center", gap:10, transition:".15s" }}>
        <span style={{ fontSize:18 }}>{file ? "✓" : "⬆"}</span>
        <div>
          <div style={{ fontSize:12, color: file ? V.accent : V.sub, fontWeight:600 }}>
            {uploading ? "Envoi en cours…" : file ? file.name : label}
          </div>
          {file && <div style={{ fontSize:11, color:V.hint, marginTop:2 }}>
            {(file.size/1024/1024).toFixed(1)} Mo
          </div>}
        </div>
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display:"none" }}
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

// ── Panneau Lucie ─────────────────────────────────────────────────────────────
function LuciePanel({ onApply }) {
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed,  setParsed]  = useState(null);
  const [sessionId]           = useState(() => 'lucie-tiktok-' + Date.now());
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = useCallback(async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next = [...msgs, { role:"user", content }];
    setMsgs(next);
    setLoading(true);
    setParsed(null);
    try {
      const res = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, session_id: sessionId, agent_id: "contenu" }),
      });
      const data = await res.json();
      const reply = data.text || data.error || "Pas de réponse";
      const updated = [...next, { role:"assistant", content: reply }];
      setMsgs(updated);
      // Essayer de parser un JSON dans la réponse
      const m = reply.match(/\{[\s\S]*\}/);
      if (m) {
        try { setParsed(JSON.parse(m[0])); } catch {}
      }
    } catch(e) {
      setMsgs(p => [...p, { role:"assistant", content:"⚠️ " + e.message, err:true }]);
    } finally { setLoading(false); }
  }, [msgs, input, loading, sessionId]);

  const PROMPT_SUGGESTION = "Génère pour une vidéo TikTok 30s. Retourne un JSON avec : prompt_video (en anglais, ambiance clip), hook (5-9 mots, accroche), message (2-3 phrases, valeur concrète, dicible en 15s), cta (4-8 mots, ressenti), prompt_voix (script voix off 25-28s, chaleureux, tutoiement). JSON uniquement.";

  const FIELDS = [
    { key:"prompt_video", label:"🎬 Prompt vidéo", apply: v => onApply("prompt_video", v) },
    { key:"hook",         label:"🪝 Hook",          apply: v => onApply("hook", v) },
    { key:"message",      label:"💬 Message",       apply: v => onApply("message", v) },
    { key:"cta",          label:"📣 CTA",           apply: v => onApply("cta", v) },
    { key:"prompt_voix",  label:"🎙 Voix off",      apply: v => onApply("prompt_voix", v) },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:10 }}>
      {/* Header */}
      <div style={{ background:"#1a1a2e", border:"1px solid #2a2a4a",
        borderRadius:12, padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <img src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Lucie" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} />
          <span style={{ fontSize:13, fontWeight:700, color:"#a29bfe" }}>LUCIE</span>
          <span style={{ fontSize:10, color:"#666", background:"#111",
            padding:"1px 6px", borderRadius:4 }}>Contenu</span>
        </div>
        <div style={{ fontSize:11, color:"#555", lineHeight:1.4 }}>
          Décris ton thème → Lucie génère les textes + prompts
        </div>
      </div>

      {/* Zone de saisie thème */}
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em",
        textTransform:"uppercase", color:"#666", marginBottom:6 }}>
        Thème de la vidéo
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={"Ex : La fatigue mentale du dimanche soir\nEx : Quand les pensées ne s'arrêtent pas\nEx : Rituel de respiration pour les moments d'anxiété…"}
        rows={4}
        style={{ background:"#111", border:"1px solid #a29bfe44", borderRadius:10,
          padding:"10px 12px", color:"#f0f0f0", fontFamily:"inherit",
          fontSize:12, outline:"none", resize:"vertical", lineHeight:1.6,
          width:"100%", boxSizing:"border-box" }}
      />

      {/* Bouton générer */}
      <button onClick={() => {
          const theme = input.trim() || "bien-être mental, fatigue, retour à soi";
          send(PROMPT_SUGGESTION + "\n\nThème : " + theme);
        }}
        disabled={loading || !input.trim()}
        style={{ border:"none", borderRadius:10, padding:"11px 14px",
          background: input.trim() && !loading
            ? "linear-gradient(135deg,#a29bfe,#6c5ce7)"
            : "#1a1a2e",
          color: input.trim() && !loading ? "#fff" : "#444",
          cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          fontFamily:"inherit", fontWeight:700, fontSize:13,
          boxShadow: input.trim() && !loading ? "0 4px 16px rgba(162,155,254,0.3)" : "none",
          transition:".2s" }}>
        {loading ? "⏳ Lucie développe…" : "✨ Développer avec Lucie"}
      </button>

      {/* Suggestions parsées */}
      {parsed && (
        <div style={{ background:"#111", border:"1px solid #2a2a4a",
          borderRadius:10, padding:"10px 12px" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em",
            textTransform:"uppercase", color:"#a29bfe", marginBottom:10 }}>
            Suggestions
          </div>
          {FIELDS.map(f => parsed[f.key] ? (
            <div key={f.key} style={{ marginBottom:8, paddingBottom:8,
              borderBottom:"1px solid #1a1a2e" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#555" }}>{f.label}</span>
                <button onClick={() => f.apply(parsed[f.key])}
                  style={{ fontSize:10, border:"1px solid #a29bfe", borderRadius:4,
                    padding:"2px 7px", background:"rgba(162,155,254,0.1)",
                    color:"#a29bfe", cursor:"pointer", fontFamily:"inherit",
                    fontWeight:700 }}>
                  Appliquer →
                </button>
              </div>
              <div style={{ fontSize:11, color:"#888", lineHeight:1.4,
                maxHeight:52, overflow:"hidden", textOverflow:"ellipsis" }}>
                {parsed[f.key].substring(0, 120)}{parsed[f.key].length > 120 ? "…" : ""}
              </div>
            </div>
          ) : null)}
        </div>
      )}

      {/* Historique conversation */}
      <div style={{ flex:1, overflowY:"auto", display:"flex",
        flexDirection:"column", gap:6, minHeight:0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            background: m.role === "user" ? "rgba(162,155,254,0.1)" : "#1a1a1a",
            border: `1px solid ${m.role === "user" ? "#2a2a4a" : "#222"}`,
            borderRadius:8, padding:"8px 10px",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth:"90%",
          }}>
            <div style={{ fontSize:11, color: m.err ? "#ff6b6b" : m.role==="user" ? "#a29bfe" : "#888",
              lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {m.content.length > 300 ? m.content.substring(0, 300) + "…" : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ background:"#1a1a1a", border:"1px solid #222",
            borderRadius:8, padding:"8px 10px", alignSelf:"flex-start" }}>
            <div style={{ fontSize:11, color:"#555" }}>Lucie réfléchit…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Bouton reformulation IA ───────────────────────────────────────────────────
function AiBtn({ field, text, reformulating, onReformulate }) {
  const loading = reformulating === field;
  const disabled = !text.trim() || reformulating !== null;
  return (
    <button
      onClick={() => onReformulate(field, text)}
      disabled={disabled}
      title="Reformuler avec l'IA"
      style={{ flexShrink:0, border:`1px solid ${disabled ? "#333" : "#a29bfe"}`,
        borderRadius:8, padding:"3px 9px", background: disabled ? "#111" : "rgba(162,155,254,0.12)",
        color: disabled ? "#444" : "#a29bfe", cursor: disabled ? "not-allowed" : "pointer",
        fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:4,
        transition:".15s", whiteSpace:"nowrap" }}>
      {loading ? "⏳" : "✨"} IA
    </button>
  );
}

// ── Aperçu vidéo avec overlay texte ──────────────────────────────────────────
function VideoPreview({ clipSrc, musicSrc, voiceSrc, musicVol, voiceVol, hook, message, cta, generatedUrl, polling, pollElapsed }) {
  const videoRef = useRef();
  const musicRef = useRef();
  const voiceRef = useRef();
  const [muted, setMuted] = useState(true);

  // Appliquer les volumes dès que les refs ou valeurs changent
  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = musicVol ?? 0.6;
  }, [musicVol]);
  useEffect(() => {
    if (voiceRef.current) voiceRef.current.volume = voiceVol ?? 1.0;
  }, [voiceVol]);

  const applyMute = useCallback((m) => {
    if (musicRef.current) {
      musicRef.current.muted = m;
      if (!m) { musicRef.current.volume = musicVol ?? 0.6; musicRef.current.play().catch(() => {}); }
      else musicRef.current.pause();
    }
    if (voiceRef.current) {
      voiceRef.current.muted = m;
      if (!m) { voiceRef.current.volume = voiceVol ?? 1.0; voiceRef.current.play().catch(() => {}); }
      else voiceRef.current.pause();
    }
    if (videoRef.current && generatedUrl) videoRef.current.muted = m;
  }, [generatedUrl, musicVol, voiceVol]);

  // Quand la source clip change, relance la vidéo
  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [clipSrc]);

  // Appliquer mute quand ça change
  useEffect(() => { applyMute(muted); }, [muted, applyMute]);

  // Relancer musique si src change
  useEffect(() => {
    if (musicRef.current && !muted) { musicRef.current.load(); musicRef.current.play().catch(() => {}); }
  }, [musicSrc]);

  // Relancer voix si src change
  useEffect(() => {
    if (voiceRef.current && !muted) { voiceRef.current.load(); voiceRef.current.play().catch(() => {}); }
  }, [voiceSrc]);

  const src = generatedUrl || clipSrc;
  const isGenerated = !!generatedUrl;

  return (
    <div style={{ position:"relative", width:"100%", aspectRatio:"9/16",
      borderRadius:14, overflow:"hidden", background:"#000",
      boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>

      {/* Vidéo clip (toujours muette — le son vient de l'audio séparé ou de la vidéo générée) */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop
        muted={!isGenerated || muted}
        playsInline
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover" }}
      />

      {/* Musique — avant génération */}
      {musicSrc && !isGenerated && (
        <audio ref={musicRef} src={musicSrc} loop muted={muted} />
      )}

      {/* Voix off — avant génération */}
      {voiceSrc && !isGenerated && (
        <audio ref={voiceRef} src={voiceSrc} muted={muted} />
      )}

      {/* Bouton son */}
      <button
        onClick={() => setMuted(m => !m)}
        style={{ position:"absolute", bottom:44, right:10, zIndex:10,
          width:34, height:34, borderRadius:"50%", border:"none",
          background:"rgba(0,0,0,0.55)", color:"#fff", cursor:"pointer",
          fontSize:15, display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(4px)", transition:".15s" }}
        title={muted ? "Activer le son" : "Couper le son"}>
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Spinner pendant le polling */}
      {polling && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)",
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:12 }}>
          <div style={{ width:40, height:40, border:`3px solid rgba(0,245,160,0.3)`,
            borderTopColor:V.green, borderRadius:"50%",
            animation:"spin 1s linear infinite" }} />
          <div style={{ fontSize:12, color:V.green, textAlign:"center", lineHeight:1.6 }}>
            Génération en cours…<br/>
            <span style={{ fontSize:18, fontWeight:700 }}>{pollElapsed || 0}s</span><br/>
            <span style={{ opacity:.5, fontSize:11 }}>~80s attendues</span>
          </div>
        </div>
      )}

      {/* Logo MJI — uniquement en aperçu (la vidéo générée l'a déjà intégré) */}
      {!polling && !isGenerated && (
        <div style={{ position:"absolute", top:8, left:"50%",
          transform:"translateX(-50%)", zIndex:5,
          width:80, height:80, borderRadius:16, overflow:"hidden",
          boxShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>
          <img src="/icons/logo.png" alt="MJI"
            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
      )}

      {/* Overlay texte — visible uniquement avant génération */}
      {!generatedUrl && !polling && (
        <>
          {/* Hook — bandeau haut */}
          {hook && (
            <div style={{ position:"absolute", top:"4%", left:"4%", right:"4%",
              background:"rgba(0,0,0,0.7)", borderRadius:9, padding:"9px 12px",
              backdropFilter:"blur(2px)" }}>
              <div style={{ fontSize:"clamp(12px,3.5vw,16px)", fontWeight:800,
                color:"#fff", lineHeight:1.3, textAlign:"center" }}>{hook}</div>
            </div>
          )}
          {/* Message — bandeau milieu haut */}
          {message && (
            <div style={{ position:"absolute", top:"27%", left:"4%", right:"4%",
              background:"rgba(0,0,0,0.6)", borderRadius:9, padding:"9px 12px",
              backdropFilter:"blur(2px)" }}>
              <div style={{ fontSize:"clamp(10px,3vw,13px)", color:"rgba(255,255,255,0.9)",
                lineHeight:1.5, textAlign:"center" }}>{message}</div>
            </div>
          )}
          {/* CTA — bandeau bas */}
          {cta && (
            <div style={{ position:"absolute", bottom:"4%", left:"4%", right:"4%",
              background:"rgba(255,45,85,0.8)", borderRadius:9, padding:"9px 12px",
              backdropFilter:"blur(2px)" }}>
              <div style={{ fontSize:"clamp(11px,3.2vw,14px)", fontWeight:700,
                color:"#fff", textAlign:"center" }}>{cta}</div>
            </div>
          )}
        </>
      )}

      {/* Badge "Généré ✓" */}
      {isGenerated && (
        <div style={{ position:"absolute", top:10, left:10,
          background:"rgba(0,245,160,0.9)", borderRadius:6,
          padding:"4px 10px", fontSize:11, fontWeight:700, color:"#000" }}>
          ✓ Généré
        </div>
      )}

      {/* Durée */}
      <div style={{ position:"absolute", top:10, right:10,
        fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:600 }}>
        30s · 1080×1920
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function TikTokStudio() {
  const [mode,      setMode]      = useState("clip"); // "clip" | "slideshow"
  const [clipId,    setClipId]    = useState("MJI1");
  const [clipFile,  setClipFile]  = useState(null);
  const [clipUrl,   setClipUrl]   = useState(null);
  const [clipUploading, setClipUploading] = useState(false);

  // Piste sélectionnée pour la preview (locale) + piste custom uploadée
  const [selectedTrack,  setSelectedTrack]  = useState(() => pickRandom(MUSIC_TRACKS));
  const [musicFile,      setMusicFile]      = useState(null);
  const [musicUrl,       setMusicUrl]       = useState(null);  // URL Supabase si custom
  const [musicUploading, setMusicUploading] = useState(false);

  // Src de musique pour la preview : custom uploadé > piste locale sélectionnée
  const previewMusicSrc = musicUrl || selectedTrack.src;

  const [voiceFile,       setVoiceFile]       = useState(null);
  const [voiceUrl,        setVoiceUrl]        = useState(null);  // URL Supabase (pour le VPS)
  const [voiceLocalUrl,   setVoiceLocalUrl]   = useState(null);  // objectURL (preview immédiate)
  const [voiceUploading,  setVoiceUploading]  = useState(false);
  const [recording,       setRecording]       = useState(false);
  const [recCountdown,    setRecCountdown]     = useState(30);
  const countdownRef = useRef(null);
  const mediaRecRef  = useRef(null);
  const chunksRef    = useRef([]);
  const localUrlRef = useRef(null); // pour révoquer l'objectURL précédent

  const [hook,    setHook]    = useState("");
  const [message, setMessage] = useState("");
  const [cta,     setCta]     = useState("Enregistre-le pour ce soir.");

  const [musicVol, setMusicVol] = useState(0.6);
  const [voiceVol, setVoiceVol] = useState(1.0);

  const [reformulating, setReformulating] = useState(null); // "hook"|"message"|"cta"|null

  const reformulate = useCallback(async (field, text) => {
    if (!text.trim() || reformulating) return;
    setReformulating(field);
    try {
      const res = await fetch('https://n8n.srv1667605.hstgr.cloud/webhook/tiktok-reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, text }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.text) {
        if (field === 'hook')    setHook(json.text);
        if (field === 'message') setMessage(json.text);
        if (field === 'cta')     setCta(json.text);
      }
    } catch {}
    finally { setReformulating(null); }
  }, [reformulating]);

  const [generating,    setGenerating]    = useState(false);
  const [polling,       setPolling]       = useState(false);
  const [generatedUrl,  setGeneratedUrl]  = useState(null);
  const [statusMsg,     setStatusMsg]     = useState(null);
  const [error,         setError]         = useState(null);

  const pollRef = useRef(null);

  // Nettoyage au démontage
  useEffect(() => () => {
    clearInterval(pollRef.current);
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
  }, []);

  const handleClipFile = useCallback(async (file) => {
    setClipFile(file); setClipUploading(true);
    try { const url = await uploadToSupabase(file, "clips"); setClipUrl(url); }
    catch(e) { alert("Erreur upload clip : " + e.message); }
    finally { setClipUploading(false); }
  }, []);

  const handleMusicFile = useCallback(async (file) => {
    setMusicFile(file); setMusicUploading(true);
    try {
      const url = await uploadToSupabase(file, "musique");
      setMusicUrl(url);
      // Crée une entrée temporaire dans MUSIC_TRACKS pour l'affichage
      setSelectedTrack({ id:"custom", label: file.name, src: url });
    }
    catch(e) { alert("Erreur upload musique : " + e.message); }
    finally { setMusicUploading(false); }
  }, []);

  const handleVoiceFile = useCallback(async (file) => {
    // URL locale immédiate pour la preview
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    const localUrl = URL.createObjectURL(file);
    localUrlRef.current = localUrl;
    setVoiceLocalUrl(localUrl);

    setVoiceFile(file); setVoiceUploading(true);
    try { const url = await uploadToSupabase(file, "voix"); setVoiceUrl(url); }
    catch(e) { alert("Erreur upload voix : " + e.message); }
    finally { setVoiceUploading(false); }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // URL locale immédiate → preview sans attendre l'upload
        if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
        const localUrl = URL.createObjectURL(blob);
        localUrlRef.current = localUrl;
        setVoiceLocalUrl(localUrl);

        // Upload en parallèle
        const file = new File([blob], `voix_${Date.now()}.webm`, { type: "audio/webm" });
        setVoiceFile(file); setVoiceUploading(true);
        try { const url = await uploadToSupabase(file, "voix"); setVoiceUrl(url); }
        catch(e) { alert("Erreur upload voix : " + e.message); }
        finally { setVoiceUploading(false); }
      };
      mr.start(); mediaRecRef.current = mr; setRecording(true);
      // Décompte 30 → 0
      setRecCountdown(30);
      countdownRef.current = setInterval(() => {
        setRecCountdown(n => {
          if (n <= 1) {
            clearInterval(countdownRef.current);
            mediaRecRef.current?.stop();
            setRecording(false);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    } catch(e) { alert("Micro non disponible : " + e.message); }
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(countdownRef.current);
    setRecCountdown(30);
    mediaRecRef.current?.stop();
    setRecording(false);
  }, []);

  // Polling Supabase pour détecter la vidéo générée
  const [pollElapsed, setPollElapsed] = useState(0);

  const startPolling = useCallback((jobId) => {
    const videoUrl = `${SUPA_VIDEO_BASE}/studio_${jobId}.mp4`;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes
    const startTime = Date.now();

    setPolling(true);
    setGeneratedUrl(null);
    setPollElapsed(0);

    pollRef.current = setInterval(async () => {
      attempts++;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setPollElapsed(elapsed);
      try {
        // GET + abort immédiat (plus fiable que HEAD pour Supabase)
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        let ok = false;
        try {
          const res = await fetch(videoUrl + '?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Range': 'bytes=0-0' },
            signal: ctrl.signal,
          });
          ok = res.ok || res.status === 206;
        } catch {} finally { clearTimeout(timer); }

        if (ok) {
          clearInterval(pollRef.current);
          setPolling(false);
          setGeneratedUrl(videoUrl);
          setStatusMsg("✓ Vidéo prête — programmée dans Buffer");
          return;
        }
      } catch {}
      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        setPolling(false);
        setStatusMsg("⏱ Timeout — vérifie Buffer manuellement");
      }
    }, 10000);
  }, []);

  const generate = useCallback(async () => {
    if (!hook.trim())    { alert("Le hook est obligatoire."); return; }
    if (!message.trim()) { alert("Le message est obligatoire."); return; }
    if (!cta.trim())     { alert("Le CTA est obligatoire."); return; }

    const b64 = (s) => { try { return btoa(unescape(encodeURIComponent(s))); } catch { return btoa(s); } };

    // jobId unique → permet de savoir où sera la vidéo dans Supabase
    const jobId = Date.now();

    setGenerating(true);
    setError(null);
    setStatusMsg(null);
    setGeneratedUrl(null);
    clearInterval(pollRef.current);

    try {
      const payload = {
        job_id:      String(jobId),
        mode,
        clip:        clipUrl || clipId,
        music:       musicUrl || "random",
        music_vol:   musicVol,
        voice_vol:   voiceVol,
        hook_b64:    b64(hook),
        message_b64: b64(message),
        cta_b64:     b64(cta),
      };
      if (voiceUrl) payload.voice_url = voiceUrl;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(WEBHOOK, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } finally { clearTimeout(timer); }

      // Pipeline lancé → commencer le polling
      startPolling(jobId);
    } catch(e) {
      if (e.name === "AbortError") {
        // Proxy a coupé mais le pipeline tourne peut-être
        startPolling(jobId);
      } else {
        setError(e.message);
      }
    } finally {
      setGenerating(false);
    }
  }, [clipId, clipUrl, musicUrl, voiceUrl, hook, message, cta, startPolling]);

  const canGenerate = hook.trim() && message.trim() && cta.trim()
    && !generating && !polling && !clipUploading && !musicUploading && !voiceUploading;

  const resetGenerated = () => {
    setGeneratedUrl(null); setStatusMsg(null); setPolling(false);
    clearInterval(pollRef.current);
  };

  return (
    <div style={{ background:V.bg, borderRadius:20, padding:"24px 20px",
      fontFamily:"system-ui,-apple-system,sans-serif", color:V.text }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, letterSpacing:".2em", textTransform:"uppercase",
          color:V.sub, fontWeight:700, marginBottom:6 }}>Mon Jardin Intérieur</div>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(20px,4vw,28px)",
          fontWeight:600, color:"#fff", margin:"0 0 8px", lineHeight:1.1 }}>
          Studio TikTok
        </h1>
        <p style={{ fontSize:13, color:V.sub, margin:0 }}>
          Clip · musique · voix · textes → Buffer
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"380px minmax(260px,1fr) 260px",
        gap:16, alignItems:"start" }}>

        {/* ── Colonne Lucie ── */}
        <div style={{ background:V.card, border:`1px solid #2a2a4a`,
          borderRadius:16, padding:"16px 14px", height:640,
          display:"flex", flexDirection:"column" }}>
          <LuciePanel onApply={(field, value) => {
            if (field === "hook")    setHook(value);
            if (field === "message") setMessage(value);
            if (field === "cta")     setCta(value);
            // prompt_video et prompt_voix : copier dans le clipboard
            if (field === "prompt_video" || field === "prompt_voix") {
              navigator.clipboard?.writeText(value).catch(()=>{});
              alert('Copié dans le presse-papier : ' + value.substring(0,60) + '…');
            }
          }} />
        </div>

        {/* ── Formulaire 2 sous-colonnes ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, alignItems:"start" }}>

        {/* ── Sous-colonne gauche : médias ── */}
        <div>

          {/* Mode */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[
              { id:"clip",      label:"🎬 Clips MJI",  desc:"Vidéo animée + textes" },
              { id:"slideshow", label:"🖼 Slideshow",   desc:"2 images + citation" },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ flex:1, border:`1.5px solid ${mode===m.id ? V.accent : V.border}`,
                  background: mode===m.id ? V.accentSoft : "#111",
                  borderRadius:12, padding:"10px 12px", cursor:"pointer",
                  fontFamily:"inherit", transition:".15s", textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700,
                  color: mode===m.id ? V.accent : V.text }}>{m.label}</div>
                <div style={{ fontSize:11, color:V.hint, marginTop:2 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Clip — masqué en mode slideshow */}
          {mode === "clip" && <Section title="Clip de fond" icon="🎬">
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {CLIPS.map(c => (
                <button key={c.id}
                  onClick={() => { setClipId(c.id); setClipUrl(null); setClipFile(null); resetGenerated(); }}
                  style={S.chip(!clipFile && clipId === c.id)}>
                  {c.id}
                </button>
              ))}
            </div>
            <UploadZone label="Importer un clip MP4 custom"
              accept="video/mp4,video/*" onFile={handleClipFile}
              file={clipFile} uploading={clipUploading} />
          </Section>}

          {/* Musique */}
          <Section title="Musique" icon="🎵">
            <div style={{ fontSize:12, color:V.hint, marginBottom:10 }}>
              Choisir une piste · audible dans l'aperçu
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {MUSIC_TRACKS.map(t => (
                <button key={t.id}
                  onClick={() => { setSelectedTrack(t); setMusicUrl(null); setMusicFile(null); }}
                  style={S.chip(!musicFile && selectedTrack.id === t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <UploadZone label="Importer ta propre piste (MP3, M4A…)" accept="audio/*"
              onFile={handleMusicFile} file={musicFile} uploading={musicUploading} />
            {musicFile && (
              <button onClick={() => {
                  setMusicFile(null); setMusicUrl(null);
                  setSelectedTrack(pickRandom(MUSIC_TRACKS));
                }}
                style={{ marginTop:8, ...S.btn("#ff6b6b","rgba(255,107,107,0.08)"),
                  fontSize:12, padding:"7px 14px" }}>
                ✕ Supprimer la musique importée
              </button>
            )}
          </Section>}

          {/* Message slideshow */}
          {mode === "slideshow" && (
            <div style={{ background:"rgba(162,155,254,0.08)", border:"1px solid #a29bfe44",
              borderRadius:12, padding:"14px 16px", marginBottom:16, fontSize:12, color:"#a29bfe",
              lineHeight:1.6 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>🖼 Mode Slideshow</div>
              <div style={{ color:V.hint }}>
                Carte 1 : <strong style={{color:V.text}}>mieuxetre.png</strong> · 15s<br/>
                Carte 2 : <strong style={{color:V.text}}>fond.png</strong> + citation aléatoire · 15s<br/>
                Musique : Terracotta Throb (ou dossier reseaux/musique)
              </div>
            </div>
          )}

          {/* Voix */}
          <Section title="Voix off (optionnel)" icon="🎙">
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12, alignItems:"center" }}>
              {!recording
                ? <button style={S.btn(V.green,"rgba(0,245,160,0.1)")} onClick={startRecording}>● Enregistrer</button>
                : <button style={S.btn("#ff6b6b","rgba(255,107,107,0.1)")} onClick={stopRecording}>■ Arrêter</button>}
              {/* Compteur décompte */}
              {recording && (
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ position:"relative", width:44, height:44 }}>
                    <svg width="44" height="44" style={{ transform:"rotate(-90deg)" }}>
                      <circle cx="22" cy="22" r="18" fill="none"
                        stroke="rgba(255,107,107,0.2)" strokeWidth="3" />
                      <circle cx="22" cy="22" r="18" fill="none"
                        stroke="#ff6b6b" strokeWidth="3"
                        strokeDasharray={`${2*Math.PI*18}`}
                        strokeDashoffset={`${2*Math.PI*18*(1 - recCountdown/30)}`}
                        strokeLinecap="round"
                        style={{ transition:"stroke-dashoffset 1s linear" }} />
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center",
                      fontSize:13, fontWeight:800, color:"#ff6b6b",
                      fontVariantNumeric:"tabular-nums" }}>
                      {recCountdown}
                    </div>
                  </div>
                </div>
              )}
              {voiceLocalUrl && !recording && (
                <span style={{ fontSize:12, color:V.green, alignSelf:"center" }}>
                  {voiceUrl ? "✓ Prête" : "⏳ Upload…"}
                </span>
              )}
            </div>
            <UploadZone label="Importer MP3 / WAV / M4A" accept="audio/*"
              onFile={handleVoiceFile}
              file={voiceFile && !chunksRef.current.length ? voiceFile : null}
              uploading={voiceUploading} />
            {voiceLocalUrl && !recording && (
              <button onClick={() => {
                  if (localUrlRef.current) { URL.revokeObjectURL(localUrlRef.current); localUrlRef.current = null; }
                  setVoiceLocalUrl(null); setVoiceUrl(null); setVoiceFile(null);
                  chunksRef.current = [];
                }}
                style={{ marginTop:8, ...S.btn("#ff6b6b","rgba(255,107,107,0.08)"),
                  fontSize:12, padding:"7px 14px" }}>
                ✕ Supprimer la voix off
              </button>
            )}

          </Section>

        </div>{/* fin sous-colonne gauche */}

        {/* ── Sous-colonne droite : textes + action ── */}
        <div>

          {/* Textes */}
          <Section title="Textes" icon="✍️">
            {/* Hook */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ ...S.label, marginBottom:0 }}>Hook · 5-9 mots</span>
              <AiBtn field="hook" text={hook} reformulating={reformulating} onReformulate={reformulate} />
            </div>
            <input type="text" value={hook} maxLength={60}
              onChange={e => setHook(e.target.value)}
              placeholder="Ton mental ne s'éteint pas le soir ?"
              style={S.input} />
            <div style={{ fontSize:11, color:V.hint, marginTop:3, marginBottom:12 }}>{hook.length}/60</div>

            {/* Message */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ ...S.label, marginBottom:0 }}>Message · valeur concrète · dicible en 8s</span>
              <AiBtn field="message" text={message} reformulating={reformulating} onReformulate={reformulate} />
            </div>
            <textarea rows={3} value={message} maxLength={200}
              onChange={e => setMessage(e.target.value)}
              placeholder="Pose une main sur ta poitrine. Inspire 4 secondes, souffle 6."
              style={S.input} />
            <div style={{ fontSize:11, color:V.hint, marginTop:3, marginBottom:12 }}>{message.length}/200</div>

            {/* CTA */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ ...S.label, marginBottom:0 }}>CTA · 4-8 mots</span>
              <AiBtn field="cta" text={cta} reformulating={reformulating} onReformulate={reformulate} />
            </div>
            <input type="text" value={cta} maxLength={50}
              onChange={e => setCta(e.target.value)}
              placeholder="Enregistre-le pour ce soir."
              style={S.input} />
          </Section>

          {/* Bouton */}
          <button onClick={generate} disabled={!canGenerate}
            style={{ width:"100%", border:"none", borderRadius:14, padding:16,
              background: canGenerate ? "linear-gradient(135deg,#ff2d55,#ff6b35)" : "#2a2a2a",
              color: canGenerate ? "#fff" : V.hint, fontFamily:"inherit",
              fontWeight:800, fontSize:15, cursor: canGenerate ? "pointer" : "not-allowed",
              boxShadow: canGenerate ? "0 8px 28px rgba(255,45,85,0.3)" : "none",
              transition:".2s" }}>
            {generating ? "⏳ Lancement…" : polling ? "⏳ Génération en cours…" : "▶ Générer & Publier"}
          </button>

          {/* Statut */}
          {statusMsg && (
            <div style={{ marginTop:12, background:"rgba(0,245,160,0.08)",
              border:`1px solid ${V.green}`, borderRadius:10,
              padding:"12px 14px", fontSize:13, color:V.green }}>
              {statusMsg}
            </div>
          )}
          {error && (
            <div style={{ marginTop:12, background:"rgba(255,45,85,0.08)",
              border:`1px solid ${V.accent}`, borderRadius:10,
              padding:"12px 14px", fontSize:13, color:V.accent }}>
              ✗ {error}
            </div>
          )}

        </div>{/* fin sous-colonne droite */}
        </div>{/* fin grille 2 sous-colonnes */}

        {/* ── Aperçu vidéo ── */}
        <div style={{ position:"sticky", top:24 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em",
            textTransform:"uppercase", color:V.sub, marginBottom:10,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>Aperçu</span>
            {generatedUrl && (
              <button onClick={resetGenerated}
                style={{ fontSize:11, color:V.sub, background:"none",
                  border:"none", cursor:"pointer" }}>
                ↺ Réinitialiser
              </button>
            )}
          </div>

          <VideoPreview
            clipSrc={clipUrl || `/reseaux/${clipId}.mp4`}
            musicSrc={previewMusicSrc}
            voiceSrc={voiceLocalUrl}
            musicVol={musicVol}
            voiceVol={voiceVol}
            hook={hook} message={message} cta={cta}
            generatedUrl={generatedUrl}
            polling={polling}
            pollElapsed={pollElapsed}
          />

          <p style={{ textAlign:"center", fontSize:11, color:V.hint, marginTop:10 }}>
            {generatedUrl
              ? "Vidéo générée 30s · avec son"
              : "Clip de fond en direct · textes en simulation"}
          </p>

          {/* Sélection récap */}
          <div style={{ marginTop:14, background:V.card, border:`1px solid ${V.border}`,
            borderRadius:12, padding:"12px 14px", fontSize:12 }}>
            {[
              ["🎬 Clip",    clipFile ? clipFile.name : `${clipId}.mp4`],
              ["🎵 Musique", musicFile ? musicFile.name : selectedTrack.label],
              ["🎙 Voix",    voiceLocalUrl ? (voiceUrl ? "✓ Prête" : "⏳ Upload…") : "Aucune"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                marginBottom:5, color:V.text }}>
                <span style={{ color:V.sub }}>{k}</span>
                <span style={{ maxWidth:"55%", textAlign:"right", overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Réglages volume */}
          <div style={{ marginTop:10, background:V.card, border:`1px solid ${V.border}`,
            borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em",
              textTransform:"uppercase", color:V.sub, marginBottom:14 }}>
              Volumes (aperçu)
            </div>
            {[
              { label:"🎵 Musique", val:musicVol, set:setMusicVol, color:"#00f5a0" },
              { label:"🎙 Voix",    val:voiceVol, set:setVoiceVol, color:"#ff9f43" },
            ].map(({ label, val, set, color }) => (
              <div key={label} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", fontSize:12, marginBottom:6 }}>
                  <span style={{ color:V.sub }}>{label}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {val === 0 && (
                      <span style={{ fontSize:10, color:"#ff6b6b", fontWeight:700 }}>
                        ⚠ muet
                      </span>
                    )}
                    <span style={{ color: val === 0 ? "#ff6b6b" : color,
                      fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01} value={val}
                  onChange={e => set(parseFloat(e.target.value))}
                  style={{ width:"100%", accentColor: val === 0 ? "#ff6b6b" : color,
                    cursor:"pointer", height:4, borderRadius:2 }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
