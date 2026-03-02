import { useState, useEffect, useCallback } from "react"
import { useDefi } from '../hooks/useDefi'
import { useAuth }     from '../hooks/useAuth'
import { usePlant }    from '../hooks/usePlant'
import { useCircle }   from '../hooks/useCircle'
import { usePrivacy }  from '../hooks/usePrivacy'
import { useGestures } from '../hooks/useGestures'
import { useJournal }  from '../hooks/useJournal'
import { RITUAL_CATALOG } from '../services/ritual.service'
import { supabase } from '../core/supabaseClient'

// ── Appel Edge Function Supabase ─────────────────────────────
async function callModerateCircle(payload) {
  console.log('[moderate-circle] appel:', payload)
  const { data, error } = await supabase.functions.invoke('Moderate-circle', { body: payload })
  console.log('[moderate-circle] réponse:', data, 'erreur:', error)
  if (error) throw new Error(error.message)
  return data
}

import CommunityGarden from '../components/CommunityGarden'

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }

:root {
  --bg:      #1a2e1a;
  --bg2:     #213d21;
  --bg3:     #274827;
  --border:  rgba(255,255,255,0.14);
  --border2: rgba(255,255,255,0.08);
  --text:    #f2ede0;
  --text2:   rgba(242,237,224,0.85);
  --text3:   rgba(242,237,224,0.55);
  --green:   #96d485;
  --green2:  rgba(150,212,133,0.22);
  --green3:  rgba(150,212,133,0.11);
  --greenT:  rgba(150,212,133,0.48);
  --gold:    #e8d4a8;
  --rose:    rgba(210,130,130,0.7);
  --blue:    rgba(130,170,210,0.7);
  --amber:   rgba(220,180,100,0.7);
}

body { background: var(--bg); }

.root {
  font-family: 'Jost', sans-serif;
  background: var(--bg);
  height: 100vh;
  width: 100vw;
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--greenT); border-radius: 100px; }

/* ── APP LAYOUT ── */
.app-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── SIDEBAR ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border2);
  background: rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  padding: 22px 0 18px;
  overflow-y: auto;
}

.sb-logo {
  padding: 0 22px 18px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 300;
  color: var(--gold);
  border-bottom: 1px solid var(--border2);
  margin-bottom: 14px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}
.sb-logo em { font-style: italic; color: var(--green); }

.sb-section {
  padding: 0 14px 6px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.04em;
  color: var(--text3);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid transparent;
  user-select: none;
}
.sb-item:hover { color: var(--text2); background: rgba(255,255,255,0.04); }
.sb-item.active {
  color: #c8f0b8;
  background: var(--green3);
  border-left-color: var(--green);
}
.sb-icon { font-size: 15px; flex-shrink: 0; }
.sb-badge {
  margin-left: auto;
  min-width: 18px; height: 18px;
  background: var(--green2);
  border: 1px solid var(--greenT);
  border-radius: 100px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
  color: var(--green);
  padding: 0 4px;
}

.sb-divider { height: 1px; background: var(--border2); margin: 10px 22px; }

.sb-plant-card {
  margin: 8px 16px;
  padding: 14px 12px;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.15);
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.sb-plant-card:hover { background: var(--green2); }
.spc-emoji { font-size: 30px; margin-bottom: 6px; display: block; }
.spc-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  color: #c8f0b8;
  line-height: 1;
}
.spc-label {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  margin-top: 4px;
}

.sb-footer {
  margin-top: auto;
  padding: 14px 22px 0;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.7;
  letter-spacing: 0.03em;
}
.sb-logout {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(210,110,110,0.4);
  transition: all 0.2s;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid rgba(210,110,110,0.12);
  background: rgba(210,110,110,0.04);
}
.sb-logout:hover { color: rgba(210,110,110,0.9); border-color: rgba(210,110,110,0.35); background: rgba(210,110,110,0.09); }
.sb-user-card {
  margin: 10px 14px 0;
  padding: 12px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
}
.sb-user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(150,212,133,0.25), rgba(150,212,133,0.10));
  border: 1px solid rgba(150,212,133,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
  color: #c8f0b8; font-family: 'Cormorant Garamond', serif;
  font-weight: 400; text-transform: uppercase;
}
.sb-user-info { flex: 1; min-width: 0; }
.sb-user-name {
  font-size: 12px; font-weight: 400; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 1px;
}
.sb-user-email {
  font-size: 9.5px; color: var(--text3); letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sb-user-level {
  margin-top: 10px; padding-top: 9px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between;
}
.sb-user-level-label {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text3);
}
.sb-user-level-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px; color: #c8f0b8; font-weight: 400;
}
.sb-user-xp-bar {
  margin-top: 6px; height: 2px;
  background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden;
}
.sb-user-xp-fill {
  height: 100%; border-radius: 100px;
  background: linear-gradient(90deg, rgba(150,212,133,0.5), #96d485);
  transition: width 0.6s ease;
}
.sb-footer-btns {
  display: flex; flex-direction: column; gap: 6px;
  padding: 10px 14px 14px;
}
/* Modal profil */
.profile-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: profileFadeIn 0.25s ease;
}
@keyframes profileFadeIn { from { opacity:0 } to { opacity:1 } }
.profile-modal {
  background: #132010;
  border: 1px solid rgba(150,212,133,0.15);
  border-radius: 20px; width: 100%; max-width: 360px;
  padding: 32px 30px 28px; position: relative;
  animation: profileSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes profileSlideUp { from { opacity:0; transform:scale(0.94) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
.profile-modal-close {
  position: absolute; top: 14px; right: 16px;
  width: 30px; height: 30px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.08); background: none;
  color: rgba(242,237,224,0.35); cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.profile-modal-close:hover { border-color: rgba(150,212,133,0.3); color: #c8f0b8; }
.profile-modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 300; color: var(--gold);
  margin-bottom: 4px;
}
.profile-modal-sub { font-size: 11px; color: var(--text3); margin-bottom: 24px; }
.profile-field { margin-bottom: 18px; }
.profile-label {
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text3); margin-bottom: 7px; display: block;
}
.profile-input {
  width: 100%; padding: 11px 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; font-size: 13px;
  font-family: 'Jost', sans-serif; color: var(--text);
  outline: none; transition: border-color 0.2s;
}
.profile-input:focus { border-color: var(--greenT); background: rgba(150,212,133,0.04); }
.profile-input::placeholder { color: var(--text3); }
.profile-error {
  font-size: 11px; color: rgba(210,110,110,0.85);
  padding: 7px 11px; background: rgba(210,110,110,0.07);
  border: 1px solid rgba(210,110,110,0.18); border-radius: 8px; margin-bottom: 14px;
}
.profile-save {
  width: 100%; padding: 12px;
  background: var(--green2); border: 1px solid var(--greenT);
  border-radius: 30px; font-family: 'Jost', sans-serif;
  font-size: 12px; letter-spacing: 0.08em; color: #c8f0b8;
  cursor: pointer; transition: all 0.2s;
}
.profile-save:hover:not(:disabled) { background: rgba(150,212,133,0.32); }
.profile-save:disabled { opacity: 0.45; cursor: default; }
.profile-saved {
  text-align: center; font-size: 12px;
  color: rgba(150,212,133,0.8); margin-top: 10px;
  letter-spacing: 0.05em;
}
/* rendre la user-card cliquable */
.sb-user-card { cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.sb-user-card:hover { border-color: rgba(150,212,133,0.2); background: rgba(150,212,133,0.06); }
.sb-subscribe {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(150,212,133,0.55);
  transition: all 0.2s;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid rgba(150,212,133,0.15);
  background: rgba(150,212,133,0.05);
}
.sb-subscribe:hover { color: #c8f0b8; border-color: rgba(150,212,133,0.4); background: rgba(150,212,133,0.10); }

/* ── MAIN ── */
.main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
  background: rgba(0,0,0,0.08);
}
.tb-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 300;
  color: var(--gold);
  flex: 1;
}
.tb-title em { font-style: italic; color: var(--green); }
.tb-subtitle {
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.05em;
  align-self: flex-end;
  padding-bottom: 2px;
}
.tb-btn {
  padding: 7px 18px;
  border-radius: 100px;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--greenT);
  background: var(--green2);
  color: #c8f0b8;
}
.tb-btn:hover { background: rgba(150,212,133,0.32); }
.tb-btn.ghost { background: transparent; color: var(--text2); border-color: var(--border); }
.tb-notif {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  position: relative;
  cursor: pointer;
}
.notif-dot {
  position: absolute; top: -1px; right: -1px;
  width: 8px; height: 8px;
  background: var(--green);
  border-radius: 50%;
  border: 1.5px solid var(--bg2);
}

/* ── CONTENT AREAS ── */
.content { flex: 1; overflow: hidden; display: flex; min-height: 0; }
.col { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; min-height: 0; }

.slabel {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border2);
}

/* ── CARDS ── */
.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s;
}
.card:hover { border-color: rgba(255,255,255,0.18); }
.card.green { background: var(--green3); border-color: rgba(150,212,133,0.18); }

/* ─────────────────────────────────────────
   MODAL INVITATION
───────────────────────────────────────── */
function InviteModal({ circle, onClose, onCopied }) {
  const [copied, setCopied] = useState(false)
  const code = circle?.invite_code ?? '——'
  const shareText = 'Rejoins mon cercle "' + (circle?.name ?? '') + '" sur Mon Jardin Intérieur 🌿 - Code : ' + code

  function handleCopy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShareText() {
    navigator.clipboard?.writeText(shareText).then(() => {
      onCopied?.()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Inviter dans {circle?.name} 🌿</div>

        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>
          Partagez ce code avec les personnes que vous souhaitez inviter dans votre cercle.
        </div>

        <div style={{ background:'rgba(150,212,133,0.08)', border:'1px solid var(--greenT)', borderRadius:14, padding:'18px 20px', textAlign:'center' }}>
          <div style={{ fontSize:9, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Code d'invitation</div>
          <div style={{ fontFamily:'monospace', fontSize:28, letterSpacing:'.3em', color:'var(--text)', fontWeight:300 }}>{code}</div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="modal-submit" style={{ flex:1 }} onClick={handleCopy}>
            {copied ? '✓ Copié !' : '📋 Copier le code'}
          </button>
          <button className="modal-cancel" onClick={handleShareText} title="Copier un message complet">
            ✉️ Copier message
          </button>
        </div>

        <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>
          {circle?.memberCount ?? 0}/{circle?.max_members ?? 8} membres · {circle?.is_open ? 'Cercle ouvert' : 'Sur invitation uniquement'}
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 1 — CERCLE
───────────────────────────────────────── */
.gardens-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.gcard {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 10px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: all 0.2s;
}
.gcard:hover { background: var(--green3); border-color: rgba(150,212,133,0.25); }
.gcard-emoji { font-size: 26px; }
.gcard-name { font-size: 11px; letter-spacing: 0.06em; color: var(--text2); }
.gcard-bar { width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
.gcard-fill { height: 100%; background: linear-gradient(90deg, #3a7a32, var(--green)); border-radius: 100px; }
.gcard-n { font-size: 10px; color: rgba(150,212,133,0.7); letter-spacing: 0.05em; }
.gcard-absent { opacity: 0.45; }

.collective-banner {
  background: rgba(170,140,210,0.09);
  border: 1px solid rgba(170,140,210,0.25);
  border-radius: 14px;
  padding: 14px 16px;
}
.cb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.cb-badge {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 10px;
  background: rgba(170,140,210,0.18);
  border: 1px solid rgba(170,140,210,0.35);
  border-radius: 100px;
  color: rgba(210,190,240,0.9);
}
.cb-timer { font-size: 11px; color: var(--text3); }
.cb-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 300; color: #e8e0f8; margin-bottom: 5px; }
.cb-desc { font-size: 12px; font-weight: 300; color: var(--text2); margin-bottom: 10px; line-height: 1.6; }
.cb-foot { display: flex; align-items: center; gap: 8px; }
.cb-avatars { display: flex; }
.cb-av {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(170,140,210,0.22);
  border: 1px solid rgba(170,140,210,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; margin-left: -5px;
}
.cb-av:first-child { margin-left: 0; }
.cb-count { font-size: 10px; color: var(--text3); margin-left: 6px; flex: 1; }
.cb-join {
  padding: 5px 16px;
  background: rgba(170,140,210,0.18);
  border: 1px solid rgba(170,140,210,0.35);
  border-radius: 100px;
  font-size: 10px; letter-spacing: 0.08em;
  color: rgba(210,190,240,0.9);
  cursor: pointer;
}

.act-item { display: flex; align-items: flex-start; gap: 10px; }
.act-av {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.22);
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.act-body { flex: 1; }
.act-text { font-size: 12px; font-weight: 300; color: var(--text2); line-height: 1.5; }
.act-text b { color: var(--text); font-weight: 400; }
.act-time { font-size: 10px; color: var(--text3); margin-top: 2px; }
.act-zone {
  font-size: 9px; letter-spacing: 0.08em;
  padding: 3px 10px;
  background: var(--green3);
  border: 1px solid rgba(150,212,133,0.22);
  border-radius: 100px;
  color: rgba(150,212,133,0.9);
  flex-shrink: 0; align-self: flex-start;
}

.rpanel { width: 260px; flex-shrink: 0; border-left: 1px solid var(--border2); overflow-y: auto; scroll-behavior: smooth; }
.rp-section { padding: 18px 18px 0; }
.rp-slabel {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text3); padding-bottom: 10px;
  border-bottom: 1px solid var(--border2);
  margin-bottom: 12px;
}

.member-row { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; flex-wrap: wrap; }
.mr-av {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--green3); border: 1px solid rgba(150,212,133,0.22);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.mr-name { flex: 1; font-size: 12px; font-weight: 300; color: var(--text2); }
.mr-bar { width: 44px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; flex-shrink: 0; }
.mr-fill { height: 100%; background: var(--green); border-radius: 100px; }
.mr-pct { font-size: 10px; color: rgba(150,212,133,0.7); width: 28px; text-align: right; flex-shrink: 0; }
.mr-gestures { display: flex; gap: 4px; width: 100%; padding-left: 35px; margin-top: -4px; margin-bottom: 4px; }
.mr-gesture-btn {
  font-size: 13px; padding: 2px 7px; border-radius: 100px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border2);
  cursor: pointer; transition: all .2s; line-height: 1.6;
  user-select: none;
}
.mr-gesture-btn:hover { background: rgba(255,255,255,0.12); transform: scale(1.1); }
.mr-gesture-btn.sent { opacity: 0.4; cursor: default; transform: none; }

.gesture-item {
  display: flex; align-items: center; gap: 9px; margin-bottom: 9px;
  padding: 8px 11px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px; border: 1px solid var(--border2);
}
.gi-emoji { font-size: 15px; }
.gi-text { flex: 1; font-size: 11px; font-weight: 300; color: var(--text2); line-height: 1.4; }
.gi-text b { color: var(--text); font-weight: 400; }
.gi-time { font-size: 10px; color: var(--text3); }
/* ── MON JARDIN ── */
.mj-layout { display: flex; gap: 18px; flex: 1; overflow: hidden; min-height: 0; }
.mj-left  { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; overflow-y: auto; padding: 20px 22px; }
.mj-right { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; padding: 20px 18px; border-left: 1px solid var(--border2); }
.ph-cards-row { display: flex; gap: 12px; }
.plant-hero { border-radius: 20px; padding: 22px; background: linear-gradient(160deg, rgba(30,55,30,0.85), rgba(20,40,20,0.90)); border: 1px solid var(--border); position: relative; overflow: hidden; }
.ph-card-flower { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 180px; }
.ph-card-zones  { flex: 1; display: flex; flex-direction: column; justify-content: center; }

/* ── Carte jardin pleine largeur ── */
.ph-card-fullwidth { padding: 0; display: flex; flex-direction: column; }
.ph-scene { width: 100%; height: 260px; overflow: hidden; border-radius: 20px 20px 0 0; }
.ph-scene svg { display: block; width: 100%; height: 100%; }
/* ── Carte 2 colonnes ── */
.ph-2col { display: flex; flex-direction: row; padding: 0; overflow: hidden; flex-shrink: 0; min-height: 240px; }
.ph-col-flower { flex: 1; overflow: hidden; border-radius: 20px 0 0 20px; background: rgba(14,28,14,0.95); display: flex; }
.ph-col-flower svg { display: block; width: 100%; height: 100%; }
.ph-col-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 20px 22px 16px; background: linear-gradient(160deg, rgba(22,42,22,0.97), rgba(14,28,18,0.99)); border-left: 1px solid rgba(150,212,133,0.10); border-radius: 0 20px 20px 0; position: relative; overflow: hidden; }
.ph-col-info::before { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; border-radius:50%; background: radial-gradient(circle, rgba(150,212,133,0.07), transparent 70%); pointer-events:none; }
.ph-vitality-score { display: flex; flex-direction: column; gap: 2px; }
.ph-score-number { display: flex; align-items: baseline; gap: 3px; line-height: 1; }
.ph-score-digits { font-family: 'Cormorant Garamond', serif; font-size: 58px; font-weight: 300; color: #e8f5e0; letter-spacing: -2px; line-height: 1; }
.ph-score-pct { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; color: rgba(150,212,133,0.80); margin-bottom: 4px; }
.ph-score-label { font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(150,212,133,0.55); font-weight: 500; }
.ph-score-date { font-size: 9px; letter-spacing: 0.08em; color: rgba(255,255,255,0.28); text-transform: capitalize; margin-top: 4px; }
.ph-zones-list { display: flex; flex-direction: column; gap: 8px; flex: 1; justify-content: center; }
.ph-zone-row-new { display: flex; align-items: center; gap: 8px; animation: zoneSlideIn 0.4s ease both; }
@keyframes zoneSlideIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
.ph-zone-icon-new { font-size: 11px; width: 16px; text-align: center; flex-shrink: 0; }
.ph-zone-track { flex: 1; height: 3px; background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden; }
.ph-zone-fill-new { height: 100%; width: var(--zone-val); background: var(--zone-color); border-radius: 100px; opacity: 0.80; box-shadow: 0 0 6px var(--zone-color); transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }
.ph-zone-pct-new { font-family: 'Cormorant Garamond', serif; font-size: 12px; color: rgba(255,255,255,0.40); width: 24px; text-align: right; flex-shrink: 0; }
.ph-overlay-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: linear-gradient(135deg, rgba(18,36,18,0.96), rgba(14,28,14,0.98)); border-top: 1px solid rgba(150,212,133,0.12); border-radius: 0 0 20px 20px; flex-shrink: 0; }
.ph-overlay-left { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }
.ph-health-sm { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: var(--text); line-height: 1; }
.ph-health-sm span { font-size: 16px; }
.ph-label-sm { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--text3); }
.ph-overlay-zones { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.ph-zone-mini { display: flex; align-items: center; gap: 6px; }
.pzm-icon { font-size: 10px; width: 14px; text-align: center; flex-shrink: 0; }
.pzm-bar  { flex: 1; height: 2.5px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden; }
.pzm-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }
.pzm-val  { font-size: 9px; color: var(--text3); width: 26px; text-align: right; flex-shrink: 0; }
.ph-settings-btn { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer; color: var(--text3); background: rgba(255,255,255,0.06); border: 1px solid var(--border); transition: all .2s; user-select: none; }
.ph-settings-btn:hover { background: rgba(150,212,133,0.15); color: #c8f0b8; border-color: rgba(150,212,133,0.48); }
.ph-glow { position: absolute; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(150,212,133,0.12), transparent 70%); top: -40px; right: -20px; pointer-events: none; }
.ph-plant-centered { display: flex; align-items: center; justify-content: center; }
.ph-health-block { text-align: center; }
.ph-plant { flex-shrink: 0; }
.ph-info  { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.ph-health { font-family: 'Cormorant Garamond', serif; font-size: 54px; font-weight: 300; color: var(--text); line-height: 1; }
.ph-label  { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--text3); margin-top: 4px; }
.ph-zones  { display: flex; flex-direction: column; gap: 8px; }
.ph-zone-row { display: flex; align-items: center; gap: 8px; }
.pzr-icon { font-size: 11px; width: 16px; text-align: center; }
.pzr-name { font-size: 10px; color: var(--text3); width: 52px; }
.pzr-bar  { flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden; }
.pzr-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }
.pzr-val  { font-size: 10px; color: var(--text3); width: 28px; text-align: right; }
.ritual-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ritual-btn { border-radius: 14px; padding: 13px 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 7px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); transition: all .2s; text-align: center; }
.ritual-btn.positive { border-color: rgba(150,212,133,0.3); background: rgba(150,212,133,0.06); }
.ritual-btn.negative { border-color: rgba(210,110,110,0.25); background: rgba(210,110,110,0.04); }
.ritual-btn.done { opacity: 0.55; }
.ritual-btn:hover:not(.done) { background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.rb-emoji { font-size: 20px; }
.rb-name  { font-size: 10px; color: var(--text2); line-height: 1.4; font-weight: 300; }
.rb-delta { font-size: 9px; font-weight: 500; letter-spacing: .04em; }
.rb-delta.pos { color: #96d485; }
.rb-delta.neg { color: rgba(210,110,110,0.8); }
.history-chart { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 16px; padding: 16px; }
.hc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.hc-title  { font-size: 12px; color: var(--text2); }
.hc-period { font-size: 10px; color: var(--text3); }
.hc-graph  { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
.hc-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
.hc-bar { width: 100%; border-radius: 4px 4px 0 0; background: rgba(150,212,133,0.25); transition: height .4s ease; cursor: pointer; min-height: 3px; }
.hc-bar.today { background: var(--green); }
.hc-bar:hover { background: rgba(150,212,133,0.45); }
.hc-day { font-size: 9px; color: var(--text3); letter-spacing: .04em; }
.week-grid { display: flex; gap: 6px; }
.wday { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.wd-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all .2s; }
.wd-dot.full    { background: var(--green2); border: 1px solid var(--greenT); color: #c8f0b8; }
.wd-dot.partial { background: rgba(150,212,133,0.12); border: 1px solid rgba(150,212,133,0.2); color: var(--text3); }
.wd-dot.empty   { background: rgba(255,255,255,0.04); border: 1px solid var(--border2); color: var(--text3); }
.wd-dot.today   { border-color: var(--green); box-shadow: 0 0 0 2px rgba(150,212,133,0.2); }
.wd-label { font-size: 9px; color: var(--text3); letter-spacing: .05em; }
.journal-composer { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.jc-textarea { width: 100%; min-height: 90px; background: rgba(255,255,255,0.04); border: 1px solid var(--border2); border-radius: 10px; padding: 11px 13px; font-size: 13px; font-family: 'Jost', sans-serif; font-weight: 300; color: var(--text2); outline: none; resize: vertical; transition: border-color .2s; line-height: 1.6; }
.jc-textarea:focus { border-color: var(--greenT); }
.jc-textarea::placeholder { color: var(--text3); }
.jc-zones { display: flex; gap: 6px; flex-wrap: wrap; }
.jc-zone { padding: 4px 12px; border-radius: 100px; font-size: 10px; letter-spacing: .06em; border: 1px solid var(--border); color: var(--text3); cursor: pointer; transition: all .2s; }
.jc-zone:hover { border-color: var(--greenT); color: #c8f0b8; }
.jc-zone.selected { background: var(--green2); border-color: var(--greenT); color: #c8f0b8; }
.jc-foot { display: flex; align-items: center; justify-content: space-between; }
.jc-hint { font-size: 10px; color: var(--text3); letter-spacing: .03em; }
.jc-save { padding: 7px 18px; border-radius: 100px; font-size: 11px; letter-spacing: .08em; background: var(--green2); border: 1px solid var(--greenT); color: #c8f0b8; cursor: pointer; transition: all .2s; font-family: 'Jost', sans-serif; }
.jc-save:hover:not(:disabled) { background: rgba(150,212,133,.32); }
.jc-save:disabled { opacity: .45; cursor: default; }
.journal-entry { padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border2); border-radius: 13px; transition: all .2s; }
.journal-entry:hover { background: rgba(255,255,255,0.07); }
.je-date    { font-size: 10px; letter-spacing: .1em; color: var(--text3); text-transform: uppercase; margin-bottom: 6px; }
.je-text    { font-size: 13px; color: var(--text2); font-weight: 300; line-height: 1.6; font-style: italic; }
.je-rituals { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
.je-tag     { font-size: 9px; padding: 2px 9px; border-radius: 100px; background: var(--green2); border: 1px solid var(--greenT); color: #c8f0b8; letter-spacing: .06em; }
.privacy-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border2); }
.priv-icon  { font-size: 15px; flex-shrink: 0; }
.priv-label { flex: 1; font-size: 12px; color: var(--text2); font-weight: 300; }
.priv-toggle { width: 34px; height: 19px; border-radius: 100px; cursor: pointer; position: relative; transition: background .2s; flex-shrink: 0; }
.priv-toggle.on  { background: var(--green); }
.priv-toggle.off { background: rgba(255,255,255,0.15); }
.pt-knob { position: absolute; top: 2px; width: 15px; height: 15px; border-radius: 50%; background: white; transition: left .2s; }
.priv-toggle.on  .pt-knob { left: 17px; }
.priv-toggle.off .pt-knob { left: 2px; }
/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 28px 30px; width: 420px; box-shadow: 0 40px 80px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 18px; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; color: var(--gold); }
.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-label { font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: var(--text3); }
.modal-input { padding: 11px 14px; background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 11px; font-size: 13px; font-family: 'Jost',sans-serif; color: var(--text); outline: none; transition: border-color .2s; }
.modal-input:focus { border-color: var(--greenT); }
.modal-input::placeholder { color: var(--text3); }
.modal-row { display: flex; align-items: center; justify-content: space-between; }
.modal-toggle-lbl { font-size: 12px; font-weight: 300; color: var(--text2); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.modal-cancel { padding: 10px 20px; border: 1px solid var(--border); border-radius: 100px; font-size: 12px; color: var(--text3); cursor: pointer; background: transparent; }
.modal-submit { padding: 10px 24px; border: 1px solid var(--greenT); border-radius: 100px; font-size: 12px; letter-spacing: .06em; color: #c8f0b8; background: var(--green2); cursor: pointer; transition: all .2s; }
.modal-submit:hover { background: rgba(150,212,133,.32); }
.modal-submit:disabled { opacity: .5; cursor: default; }
.modal-error { font-size: 11px; color: rgba(210,110,110,.85); padding: 8px 12px; background: rgba(210,110,110,.07); border: 1px solid rgba(210,110,110,.2); border-radius: 9px; }
/* ── TOAST ── */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--bg3); border: 1px solid var(--border); border-radius: 100px; padding: 10px 22px; font-size: 12px; color: var(--text2); letter-spacing: .04em; box-shadow: 0 8px 32px rgba(0,0,0,.4); z-index: 200; pointer-events: none; animation: toastIn .2s ease; }
@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
/* ── DÉFIS ── */
.cat-filter { display: flex; gap: 7px; flex-wrap: wrap; }
.cat-btn { padding: 5px 14px; border-radius: 100px; font-size: 11px; border: 1px solid var(--border); color: var(--text3); cursor: pointer; transition: all .2s; background: transparent; }
.cat-btn.active { background: var(--green2); border-color: var(--greenT); color: #c8f0b8; }
.defi-featured { border-radius: 18px; padding: 22px; position: relative; overflow: visible; background: linear-gradient(135deg, rgba(80,50,120,0.35), rgba(40,30,80,0.5)); border: 1px solid rgba(130,100,200,0.25); flex-shrink: 0; }
.df-glow { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(150,100,220,0.15), transparent 70%); top: -30px; right: -20px; pointer-events: none; z-index: 0; overflow: hidden; border-radius: 18px; }
.defi-featured > *:not(.df-glow) { position: relative; z-index: 1; }
.df-tag { font-size: 9px; letter-spacing: .15em; text-transform: uppercase; color: rgba(180,150,240,0.8); margin-bottom: 8px; }
.df-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; color: var(--text); margin-bottom: 6px; }
.df-desc { font-size: 12px; color: var(--text3); line-height: 1.6; margin-bottom: 14px; }
.df-meta { display: flex; gap: 14px; margin-bottom: 16px; }
.dfm-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text3); }
.df-progress { background: rgba(255,255,255,0.08); border-radius: 100px; height: 4px; margin-bottom: 6px; overflow: hidden; }
.dfp-fill { height: 100%; background: linear-gradient(90deg, rgba(130,100,200,0.6), rgba(180,150,240,0.8)); border-radius: 100px; transition: width .6s ease; }
.df-progress-label { font-size: 10px; color: var(--text3); margin-bottom: 14px; display: flex; justify-content: space-between; }
.df-actions { display: flex; gap: 10px; }
.df-join  { padding: 9px 22px; border-radius: 100px; font-size: 11px; letter-spacing: .08em; background: rgba(130,100,200,0.25); border: 1px solid rgba(130,100,200,0.4); color: rgba(200,180,255,0.9); cursor: pointer; transition: all .2s; }
.df-join:hover { background: rgba(130,100,200,0.4); }
.df-learn { padding: 9px 18px; border-radius: 100px; font-size: 11px; border: 1px solid var(--border); color: var(--text3); cursor: pointer; background: transparent; transition: all .2s; }
.defis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.defi-card { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 14px; padding: 14px; cursor: pointer; transition: all .2s; display: flex; flex-direction: column; gap: 8px; }
.defi-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.dc-top  { display: flex; align-items: flex-start; gap: 10px; }
.dc-emoji { font-size: 22px; flex-shrink: 0; }
.dc-info  { flex: 1; }
.dc-title { font-size: 13px; color: var(--text); font-weight: 300; margin-bottom: 3px; }
.dc-desc  { font-size: 10px; color: var(--text3); line-height: 1.5; }
.dc-foot  { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.dc-bar   { flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 100px; margin: 0 10px; overflow: hidden; }
.dc-bar-fill { height: 100%; background: var(--green); border-radius: 100px; }
.dc-participants { font-size: 9px; color: var(--text3); }
.dc-dur   { font-size: 9px; color: var(--text3); }
.dc-zone  { font-size: 9px; padding: 2px 8px; border-radius: 100px; background: var(--green2); border: 1px solid var(--greenT); color: #c8f0b8; }
.dc-join-btn { font-size: 10px; padding: 4px 12px; border-radius: 100px; border: 1px solid var(--greenT); color: #c8f0b8; background: var(--green2); cursor: pointer; transition: all .2s; white-space: nowrap; }
.dc-join-btn:hover { background: rgba(150,212,133,0.3); }
.dc-joined { font-size: 10px; padding: 4px 12px; border-radius: 100px; border: 1px solid var(--border); color: var(--text3); white-space: nowrap; }
.community-pulse { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.cp-title { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--text3); margin-bottom: 12px; }
.cp-stat  { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.cps-icon { font-size: 18px; flex-shrink: 0; }
.cps-info { flex: 1; }
.cps-val  { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: var(--text); line-height: 1; }
.cps-lbl  { font-size: 9px; color: var(--text3); margin-top: 1px; }
/* ── CERCLES ── */
.circles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.circle-card-big {
  background: rgba(255,255,255,0.05); border: 1px solid var(--border);
  border-radius: 16px; padding: 16px; cursor: pointer;
  transition: all 0.2s; display: flex; flex-direction: column; gap: 10px;
}
.circle-card-big:hover { background: rgba(255,255,255,0.08); }
.circle-card-big.active-circle { background: rgba(150,212,133,0.11); border-color: var(--greenT); }
.ccb-top { display: flex; align-items: center; justify-content: space-between; }
.ccb-name { font-size: 14px; font-weight: 400; color: var(--text); }
.ccb-badge { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; }
.ccb-badge.admin { background: rgba(150,212,133,0.18); border: 1px solid var(--greenT); color: #c8f0b8; }
.ccb-badge.member { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text3); }
.ccb-theme { font-size: 11px; color: var(--text3); font-style: italic; line-height: 1.5; }
.ccb-members { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.ccb-member-av { width: 24px; height: 24px; border-radius: 50%; background: var(--bg3); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; }
.ccb-member-count { font-size: 10px; color: var(--text3); margin-left: 4px; }
.ccb-stats { display: flex; gap: 12px; border-top: 1px solid var(--border2); padding-top: 10px; }
.ccbs-item { display: flex; flex-direction: column; gap: 2px; }
.ccbs-val { font-size: 16px; font-family: 'Cormorant Garamond', serif; color: var(--text); font-weight: 300; }
.ccbs-lbl { font-size: 9px; color: var(--text3); letter-spacing: .05em; }
.create-circle-card {
  background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.14);
  border-radius: 16px; padding: 16px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px; cursor: pointer;
  transition: all 0.2s; min-height: 140px;
}
.create-circle-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.22); }
.ccc-icon { font-size: 26px; color: var(--text3); }
.ccc-text { font-size: 12px; color: var(--text3); letter-spacing: 0.05em; text-align: center; line-height: 1.6; }
.circle-detail { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.cd-header { padding: 14px 16px; background: rgba(150,212,133,0.07); border-bottom: 1px solid var(--border2); }
.cd-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--gold); margin-bottom: 3px; }
.cd-meta { font-size: 10px; color: var(--text3); letter-spacing: 0.04em; }
.cd-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.cd-invite { display: flex; align-items: center; gap: 9px; padding: 9px 13px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid var(--border); }
.cdi-code { flex: 1; font-size: 14px; letter-spacing: 0.2em; color: var(--text2); font-family: monospace; }
.cdi-copy { font-size: 10px; letter-spacing: 0.07em; padding: 5px 12px; border-radius: 100px; background: var(--green2); border: 1px solid var(--greenT); color: #c8f0b8; cursor: pointer; }
.cd-setting { display: flex; align-items: center; justify-content: space-between; }
.cds-label { font-size: 12px; font-weight: 300; color: var(--text2); }
.cds-val { font-size: 12px; color: var(--text3); }

`

/* ─────────────────────────────────────────
   PLANT SVG
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   GARDEN SETTINGS (stored in memory)
───────────────────────────────────────── */
const DEFAULT_GARDEN_SETTINGS = {
  sunriseH: 7, sunriseM: 0,
  sunsetH: 20, sunsetM: 0,
  petalColor1: '#e8789a',
  petalColor2: '#f0a8be',
  petalShape: 'round',
}

/* ─────────────────────────────────────────
   MODAL RÉGLAGES JARDIN
───────────────────────────────────────── */
function GardenSettingsModal({ settings, onSave, onClose }) {
  const [s, setS] = useState({ ...settings })
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }))

  const PETAL_SHAPES = [
    { id:'round',   label:'Ronde',   desc:'Pétales ovales doux' },
    { id:'pointed', label:'Étoilée', desc:'Pétales effilés' },
    { id:'wide',    label:'Large',   desc:'Pétales étalés' },
  ]
  const PRESET_COLORS = [
    { c1:'#e8789a', c2:'#f0a8be', name:'Rose' },
    { c1:'#8878e8', c2:'#b0a8f8', name:'Lilas' },
    { c1:'#e89038', c2:'#f8c068', name:'Soleil' },
    { c1:'#48c878', c2:'#88e8a8', name:'Émeraude' },
    { c1:'#e84848', c2:'#f88888', name:'Corail' },
    { c1:'#48b8e8', c2:'#88d8f8', name:'Azur' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width:480, maxWidth:'95vw' }}>
        <div className="modal-title">🌸 Personnaliser mon jardin</div>

        <div className="modal-field">
          <label className="modal-label">Couleur de la fleur</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
            {PRESET_COLORS.map(p => (
              <div key={p.name} onClick={() => { set('petalColor1',p.c1); set('petalColor2',p.c2) }}
                style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${p.c1},${p.c2})`,
                  border: s.petalColor1===p.c1 ? '2px solid #c8f0b8' : '2px solid transparent',
                  cursor:'pointer', transition:'all .2s', position:'relative',
                  boxShadow: s.petalColor1===p.c1 ? '0 0 0 3px rgba(150,212,133,0.4)' : 'none' }}
                title={p.name}>
                {s.petalColor1===p.c1 && <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>✓</div>}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            <div className="modal-field" style={{ flex:1 }}>
              <label className="modal-label" style={{ fontSize:9 }}>Couleur principale</label>
              <input type="color" value={s.petalColor1} onChange={e => set('petalColor1',e.target.value)}
                style={{ width:'100%', height:32, borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', padding:2 }}/>
            </div>
            <div className="modal-field" style={{ flex:1 }}>
              <label className="modal-label" style={{ fontSize:9 }}>Couleur secondaire</label>
              <input type="color" value={s.petalColor2} onChange={e => set('petalColor2',e.target.value)}
                style={{ width:'100%', height:32, borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', padding:2 }}/>
            </div>
          </div>
        </div>

        <div className="modal-field">
          <label className="modal-label">Forme des pétales</label>
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            {PETAL_SHAPES.map(ps => (
              <div key={ps.id} onClick={() => set('petalShape',ps.id)}
                style={{ flex:1, padding:'10px 8px', borderRadius:12, cursor:'pointer', textAlign:'center',
                  border: s.petalShape===ps.id ? '1px solid var(--greenT)' : '1px solid var(--border)',
                  background: s.petalShape===ps.id ? 'var(--green2)' : 'rgba(255,255,255,0.04)',
                  transition:'all .2s' }}>
                <div style={{ fontSize:10, color: s.petalShape===ps.id ? '#c8f0b8' : 'var(--text2)', fontWeight: s.petalShape===ps.id ? 400 : 300 }}>{ps.label}</div>
                <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>{ps.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-field">
          <label className="modal-label">Lever & coucher du soleil</label>
          <div style={{ display:'flex', gap:12, marginTop:6 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>🌅 Lever</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="number" min={4} max={11} value={s.sunriseH} onChange={e => set('sunriseH',+e.target.value)} className="modal-input" style={{ width:56, textAlign:'center', padding:'8px 6px' }}/>
                <span style={{ color:'var(--text3)' }}>h</span>
                <input type="number" min={0} max={59} value={s.sunriseM} onChange={e => set('sunriseM',+e.target.value)} className="modal-input" style={{ width:56, textAlign:'center', padding:'8px 6px' }}/>
                <span style={{ color:'var(--text3)' }}>min</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>🌇 Coucher</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="number" min={15} max={23} value={s.sunsetH} onChange={e => set('sunsetH',+e.target.value)} className="modal-input" style={{ width:56, textAlign:'center', padding:'8px 6px' }}/>
                <span style={{ color:'var(--text3)' }}>h</span>
                <input type="number" min={0} max={59} value={s.sunsetM} onChange={e => set('sunsetM',+e.target.value)} className="modal-input" style={{ width:56, textAlign:'center', padding:'8px 6px' }}/>
                <span style={{ color:'var(--text3)' }}>min</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid var(--border2)' }}>
            <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6, letterSpacing:'.08em' }}>Aperçu de la journée</div>
            <div style={{ position:'relative', height:28 }}>
              <div style={{ position:'absolute', left:0, right:0, top:'50%', height:1, background:'var(--border)' }}/>
              {(() => {
                const now = new Date(); const h = now.getHours() + now.getMinutes()/60
                const rise = s.sunriseH + s.sunriseM/60; const set2 = s.sunsetH + s.sunsetM/60
                const pct = Math.max(0,Math.min(1,(h-rise)/(set2-rise)))
                const isD = h>=rise && h<=set2
                return <>
                  <div style={{ position:'absolute', left:'2%', top:'50%', transform:'translateY(-50%)', fontSize:9, color:'var(--text3)' }}>{s.sunriseH}h{String(s.sunriseM).padStart(2,'0')}</div>
                  <div style={{ position:'absolute', right:'2%', top:'50%', transform:'translateY(-50%)', fontSize:9, color:'var(--text3)' }}>{s.sunsetH}h{String(s.sunsetM).padStart(2,'0')}</div>
                  <div style={{ position:'absolute', left:`${pct*76+12}%`, top:'50%', transform:'translate(-50%,-50%)', fontSize:18, filter:isD?'none':'grayscale(1) opacity(0.4)' }}>☀️</div>
                </>
              })()}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" onClick={() => { onSave(s); onClose() }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   PLANT SVG — Scène de jardin complète
───────────────────────────────────────── */
let _svgN = 0
function PlantSVG({ health = 72, gardenSettings = DEFAULT_GARDEN_SETTINGS }) {
  const r   = Math.max(0, Math.min(1, (health ?? 50) / 100))
  const gs  = gardenSettings || DEFAULT_GARDEN_SETTINGS
  const W = 400, H = 260, cx = 200, gY = 188   // gY = groundY
  const id  = 'g' + (++_svgN)   // unique prefix per instance, no hooks needed

  /* ── Soleil ── */
  const now   = new Date()
  const nowH  = now.getHours() + now.getMinutes() / 60
  const riseH = (gs.sunriseH || 7)  + (gs.sunriseM || 0) / 60
  const setH  = (gs.sunsetH  || 20) + (gs.sunsetM  || 0) / 60
  const dp    = Math.max(0, Math.min(1, (nowH - riseH) / (setH - riseH)))
  const isDay = nowH >= riseH && nowH <= setH
  const isG   = isDay && (Math.abs(nowH - riseH) < 1.2 || Math.abs(nowH - setH) < 1.2)
  const sunX  = 30 + dp * (W - 60)
  const sunY  = 18 + 58 * (1 - Math.sin(dp * Math.PI))

  /* ── Couleurs pétales personnalisées ── */
  const h2r = h => { const v = parseInt((h || '#e8789a').replace('#',''), 16); return [(v>>16)&255,(v>>8)&255,v&255] }
  const [r1,g1,b1]  = h2r(gs.petalColor1)
  const [r2,g2,b2]  = h2r(gs.petalColor2)
  const pC1   = `rgba(${r1},${g1},${b1},${0.78+0.18*r})`
  const pC2   = `rgba(${r2},${g2},${b2},${0.60+0.28*r})`
  const pInr  = `rgba(${Math.min(255,r2+28)},${Math.min(255,g2+28)},${Math.min(255,b2+28)},${0.45+0.22*r})`
  const pBk1  = `rgba(${Math.round(r1*.72)},${Math.round(g1*.72)},${Math.round(b1*.72)},0.48)`
  const pBk2  = `rgba(${Math.round(r1*.55)},${Math.round(g1*.55)},${Math.round(b1*.55)},0.30)`

  /* ── Forme pétales ── */
  const ps   = gs.petalShape || 'round'
  const pRx  = ps==='wide'?8+14*r : ps==='pointed'?4+7*r  : 6+10*r
  const pRy  = ps==='wide'?9+13*r : ps==='pointed'?14+22*r: 12+18*r
  const pD   = 8+11*r

  /* ── Tige ── */
  const sH   = 32 + 100*r
  const sTY  = gY - sH
  const sMY  = gY - sH * 0.5
  const flwY = sTY

  /* ── Couleurs végétales ── */
  const stemC = `rgba(${45+25*r},${115+65*r},${32+22*r},${0.55+0.45*r})`
  const stemH2= `rgba(${70+30*r},${162+50*r},${50+20*r},0.28)`
  const lC1   = `rgba(${32+22*r},${105+85*r},${28+18*r},${0.65+0.3*r})`
  const lC2   = `rgba(${38+18*r},${115+72*r},${32+22*r},${0.6+0.35*r})`
  const lV    = `rgba(${55+35*r},${152+55*r},${44+22*r},0.32)`
  const rootC = `rgba(${112+28*r},${72+26*r},${38+12*r},${0.28+0.32*r})`

  /* ── Ciel / Sol ── */
  const skyT  = isDay ? (isG ? `rgba(255,${Math.round(100+70*dp)},${Math.round(10+50*dp)},0.32)` : `rgba(${28+Math.round(18*r)},${52+Math.round(28*r)},${78+Math.round(18*r)},0.14)`) : 'rgba(8,12,28,0.22)'
  const soilT = `rgba(${55+Math.round(15*r)},${36+Math.round(10*r)},${18+Math.round(5*r)},0.94)`
  const soilB = `rgba(${26+Math.round(8*r)},${16+Math.round(5*r)},${8+Math.round(2*r)},0.98)`
  const sunC  = isG ? `rgba(255,${Math.round(145+50*dp)},${Math.round(30+50*dp)},1)` : 'rgba(255,218,88,1)'

  /* ── Herbe ── */
  const blades = [
    {x:18,h:15,l:-2},{x:28,h:19,l:1},{x:38,h:14,l:-1},{x:50,h:18,l:2},
    {x:62,h:16,l:-1},{x:74,h:20,l:1},{x:86,h:14,l:-2},{x:98,h:19,l:2},
    {x:110,h:16,l:-1},{x:122,h:13,l:1},{x:134,h:17,l:-2},{x:146,h:21,l:1},
    {x:158,h:15,l:-1},{x:168,h:19,l:2},{x:178,h:17,l:-1},{x:188,h:22,l:1},
    {x:196,h:16,l:2},{x:212,h:18,l:-1},{x:220,h:22,l:2},{x:228,h:16,l:-2},
    {x:236,h:20,l:1},{x:246,h:14,l:-1},{x:258,h:18,l:2},{x:270,h:15,l:-1},
    {x:282,h:21,l:1},{x:294,h:16,l:-2},{x:306,h:19,l:2},{x:318,h:14,l:-1},
    {x:330,h:17,l:1},{x:342,h:20,l:-2},{x:354,h:15,l:2},{x:366,h:18,l:-1},
    {x:378,h:16,l:1},{x:390,h:19,l:-1},
  ]
  const gC = i => i%3===0 ? `rgba(${46+Math.round(32*r)},${118+Math.round(82*r)},${32+Math.round(22*r)},${0.62+0.3*r})` : i%3===1 ? `rgba(${36+Math.round(28*r)},${106+Math.round(88*r)},${26+Math.round(18*r)},${0.55+0.35*r})` : `rgba(${54+Math.round(24*r)},${130+Math.round(68*r)},${38+Math.round(20*r)},${0.52+0.36*r})`
  const gHL  = `rgba(${68+Math.round(28*r)},${155+Math.round(60*r)},${48+Math.round(20*r)},${0.36+0.22*r})`

  /* ── Petites fleurs au sol ── */
  const gF = [
    {x:35, y:gY-4, c1:'rgba(228,108,148,0.85)',c2:'rgba(252,176,198,0.70)',n:5,s:2.8,min:0.15},
    {x:78, y:gY-3, c1:'rgba(178,152,238,0.80)',c2:'rgba(218,198,255,0.65)',n:6,s:2.4,min:0.25},
    {x:128,y:gY-5, c1:'rgba(252,172,58,0.85)', c2:'rgba(255,208,108,0.70)',n:5,s:2.5,min:0.30},
    {x:158,y:gY-3, c1:'rgba(198,218,128,0.80)',c2:'rgba(228,245,168,0.65)',n:6,s:2.2,min:0.10},
    {x:248,y:gY-4, c1:'rgba(232,102,142,0.85)',c2:'rgba(252,168,192,0.70)',n:5,s:2.5,min:0.20},
    {x:292,y:gY-5, c1:'rgba(108,188,238,0.80)',c2:'rgba(162,218,255,0.65)',n:6,s:2.8,min:0.35},
    {x:336,y:gY-4, c1:'rgba(252,142,78,0.85)', c2:'rgba(255,192,128,0.70)',n:5,s:2.4,min:0.28},
    {x:374,y:gY-3, c1:'rgba(208,128,218,0.80)',c2:'rgba(238,178,248,0.65)',n:6,s:2.6,min:0.22},
  ]

  /* ── Animations inline ── */
  const swA = (dur, delay='0s') => ({ animation: `svgSway ${dur}s ease-in-out infinite ${delay}`, transformOrigin: 'center bottom' })
  const plantSway = { animation: `svgPlant ${(3.5-r*0.8).toFixed(2)}s ease-in-out infinite`, transformOrigin: `${cx}px ${gY}px` }
  const breathe1  = { animation: 'svgBreath 2.6s ease-in-out infinite' }
  const breathe2  = { animation: 'svgBreath 3.1s ease-in-out infinite 0.5s' }
  const rayAnim   = { animation: 'svgRay 2.8s ease-in-out infinite' }

  const p1 = [0,45,90,135,180,225,270,315]
  const p2 = [22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5]

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" fill="none" style={{display:'block'}}>
      <defs>
        <style>{`
          @keyframes svgSway   { 0%,100%{ transform:rotate(0deg) } 35%{ transform:rotate(2deg) } 70%{ transform:rotate(-1.5deg) } }
          @keyframes svgPlant  { 0%,100%{ transform:rotate(-1deg) } 50%{ transform:rotate(1.2deg) } }
          @keyframes svgBreath { 0%,100%{ opacity:1 } 50%{ opacity:0.82 } }
          @keyframes svgPollen { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-2px) } }
          @keyframes svgRay    { 0%,100%{ opacity:0.7 } 50%{ opacity:0.3 } }
          @keyframes svgWind   { 0%{ transform:translateX(-8px); opacity:0 } 40%{ opacity:0.22 } 100%{ transform:translateX(28px); opacity:0 } }
        `}</style>
        <linearGradient id={id+'sk'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyT}/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <linearGradient id={id+'so'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={soilT}/>
          <stop offset="100%" stopColor={soilB}/>
        </linearGradient>
        <linearGradient id={id+'ss'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(20,11,5,0.94)"/>
          <stop offset="100%" stopColor="rgba(10,5,2,0.98)"/>
        </linearGradient>
        <radialGradient id={id+'sh'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={isG ? 'rgba(255,128,18,0.45)' : 'rgba(255,218,78,0.32)'}/>
          <stop offset="100%" stopColor="rgba(255,190,60,0)"/>
        </radialGradient>
        <radialGradient id={id+'pi'} cx="40%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="rgba(255,242,98,1)"/>
          <stop offset="100%" stopColor="rgba(218,146,46,0.92)"/>
        </radialGradient>
        <radialGradient id={id+'p1'} cx="50%" cy="78%" r="62%">
          <stop offset="0%"   stopColor={pInr}/>
          <stop offset="55%"  stopColor={pC2}/>
          <stop offset="100%" stopColor={pC1}/>
        </radialGradient>
        <radialGradient id={id+'p2'} cx="50%" cy="78%" r="62%">
          <stop offset="0%"   stopColor={pBk2}/>
          <stop offset="100%" stopColor={pBk1}/>
        </radialGradient>
        <radialGradient id={id+'fg'} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={`rgba(${r1},${g1},${b1},${0.16+0.14*r})`}/>
          <stop offset="100%" stopColor={`rgba(${r1},${g1},${b1},0)`}/>
        </radialGradient>
        <filter id={id+'f1'}><feGaussianBlur stdDeviation="0.9"/></filter>
        <filter id={id+'f2'}><feGaussianBlur stdDeviation="2.4"/></filter>
        <filter id={id+'f3'}><feGaussianBlur stdDeviation="5"/></filter>
        <clipPath id={id+'cl'}><rect width={W} height={H}/></clipPath>
      </defs>

      <g clipPath={`url(#${id}cl)`}>

        {/* CIEL */}
        <rect width={W} height={gY} fill={`url(#${id}sk)`}/>

        {/* SOLEIL */}
        {isDay && (
          <g>
            <circle cx={sunX} cy={sunY} r={isG?52:40} fill={`url(#${id}sh)`} filter={`url(#${id}f3)`}/>
            <circle cx={sunX} cy={sunY} r={isG?13:9.5} fill={sunC} filter={`url(#${id}f1)`}/>
            <circle cx={sunX} cy={sunY} r={isG?8.5:6} fill="rgba(255,252,222,0.95)"/>
            <g style={rayAnim}>
              {(isG?[0,30,60,90,120,150,180,210,240,270,300,330]:[0,45,90,135,180,225,270,315]).map((a,i) => {
                const rad=a*Math.PI/180, ra1=isG?15:11, ra2=isG?24:17
                return <line key={i}
                  x1={sunX+Math.cos(rad)*ra1} y1={sunY+Math.sin(rad)*ra1}
                  x2={sunX+Math.cos(rad)*ra2} y2={sunY+Math.sin(rad)*ra2}
                  stroke={isG?'rgba(255,152,28,0.62)':'rgba(255,222,78,0.52)'}
                  strokeWidth={isG?1.5:1.1} strokeLinecap="round"/>
              })}
            </g>
          </g>
        )}

        {/* VENT */}
        {r > 0.35 && (
          <g>
            <path d={`M14,${Math.round(gY*0.28)} Q38,${Math.round(gY*0.26)} 56,${Math.round(gY*0.30)}`} stroke="rgba(175,222,242,0.22)" strokeWidth={1.3} strokeLinecap="round" fill="none" style={{animation:`svgWind ${(2.0+r*0.7).toFixed(2)}s ease-in-out infinite`}}/>
            <path d={`M8,${Math.round(gY*0.40)} Q32,${Math.round(gY*0.38)} 50,${Math.round(gY*0.42)}`}  stroke="rgba(175,222,242,0.16)" strokeWidth={1.0} strokeLinecap="round" fill="none" style={{animation:`svgWind ${(2.5+r*0.5).toFixed(2)}s ease-in-out infinite 0.7s`}}/>
          </g>
        )}

        {/* SOL */}
        <rect x={0} y={gY} width={W} height={H-gY} fill={`url(#${id}ss)`}/>
        <path d={`M0,${gY} Q60,${gY-4} 120,${gY+2} Q200,${gY+6} 260,${gY+2} Q328,${gY-3} 400,${gY+1} L400,${gY+24} Q280,${gY+22} 160,${gY+26} L0,${gY+22} Z`} fill={`url(#${id}so)`}/>
        {[[22,8,2.8],[60,12,1.7],[92,7,2.2],[138,10,1.5],[180,9,2.4],[224,11,1.8],[268,8,2.1],[310,13,1.6],[350,9,2.5],[386,7,1.8]].map(([dx,dy,rx],i) => (
          <ellipse key={i} cx={dx} cy={gY+dy} rx={rx} ry={rx*0.5} fill="rgba(82,52,26,0.3)"/>
        ))}

        {/* RACINES */}
        {r > 0.05 && (
          <g opacity={0.55+0.25*r}>
            <path d={`M${cx},${gY+2} C${cx-3},${gY+20} ${cx+2},${gY+34} ${cx},${gY+52}`} stroke={rootC} strokeWidth={3.2+2*r} strokeLinecap="round" fill="none"/>
            {r > 0.18 && <path d={`M${cx},${gY+11} C${cx-22},${gY+20} ${cx-32},${gY+34} ${cx-22},${gY+48}`} stroke={rootC} strokeWidth={2.1+1.4*r} strokeLinecap="round" fill="none"/>}
            {r > 0.24 && <path d={`M${cx},${gY+13} C${cx+20},${gY+22} ${cx+30},${gY+37} ${cx+20},${gY+50}`} stroke={rootC} strokeWidth={1.9+1.2*r} strokeLinecap="round" fill="none"/>}
          </g>
        )}

        {/* HERBE */}
        {blades.map((b, i) => {
          const dur   = (i%2===0 ? 2.8+r*0.8 : 3.2+r*0.6).toFixed(2)
          const delay = ((i*0.08)%1.5).toFixed(2) + 's'
          return (
            <g key={i} style={{animation:`svgSway ${dur}s ease-in-out infinite ${delay}`, transformOrigin:`${b.x}px ${gY}px`}}>
              <path d={`M${b.x},${gY} Q${b.x+b.l*0.5},${gY-Math.round(b.h*0.58)} ${b.x+b.l-1},${gY-b.h}`}
                stroke={gC(i)} strokeWidth={1.3} strokeLinecap="round" fill="none"/>
              <path d={`M${b.x+1},${gY} Q${b.x+b.l*0.4+1},${gY-Math.round(b.h*0.52)} ${b.x+b.l+1},${gY-Math.round(b.h*0.84)}`}
                stroke={gHL} strokeWidth={0.8} strokeLinecap="round" fill="none"/>
            </g>
          )
        })}

        {/* PETITES FLEURS */}
        {gF.filter(f => r >= f.min).map((f, i) => {
          const step = 360/f.n
          return (
            <g key={i}>
              {Array.from({length:f.n}, (_,pi) => {
                const a = pi*step*Math.PI/180
                return <ellipse key={pi}
                  cx={f.x + Math.cos(a)*f.s*1.3} cy={f.y + Math.sin(a)*f.s*0.9}
                  rx={f.s} ry={f.s*0.6}
                  fill={pi%2===0 ? f.c1 : f.c2}
                  transform={`rotate(${pi*step},${f.x},${f.y})`}/>
              })}
              <circle cx={f.x} cy={f.y} r={f.s*0.52} fill="rgba(255,230,78,0.94)"/>
            </g>
          )
        })}

        {/* PLANTE */}
        <g style={plantSway}>

          {/* Tige */}
          <path d={`M${cx},${gY} C${cx-6},${Math.round(sMY+14)} ${cx+7},${Math.round(sMY-14)} ${cx},${sTY}`}
            stroke={stemC} strokeWidth={3.4+2.2*r} strokeLinecap="round" fill="none"/>
          {r > 0.2 && <path d={`M${cx-1},${gY} C${cx-5},${Math.round(sMY+12)} ${cx+6},${Math.round(sMY-16)} ${cx-1},${sTY}`}
            stroke={stemH2} strokeWidth={1.2} strokeLinecap="round" fill="none"/>}

          {/* Feuille gauche */}
          {r > 0.12 && (
            <g>
              <path d={`M${cx-1},${Math.round(sMY+18)} C${cx-24},${Math.round(sMY+8)} ${cx-28},${Math.round(sMY-8)} ${cx-10},${Math.round(sMY-9)} C${cx-4},${Math.round(sMY-8)} ${cx-5},${Math.round(sMY+6)} ${cx-1},${Math.round(sMY+18)} Z`} fill={lC1}/>
              <path d={`M${cx-1},${Math.round(sMY+18)} Q${cx-16},${Math.round(sMY+5)} ${cx-10},${Math.round(sMY-9)}`} stroke={lV} strokeWidth={1.0} fill="none"/>
            </g>
          )}

          {/* Feuille droite */}
          {r > 0.22 && (
            <g>
              <path d={`M${cx+1},${Math.round(sMY-8)} C${cx+26},${Math.round(sMY-18)} ${cx+30},${Math.round(sMY-36)} ${cx+12},${Math.round(sMY-37)} C${cx+2},${Math.round(sMY-38)} ${cx+4},${Math.round(sMY-22)} ${cx+1},${Math.round(sMY-8)} Z`} fill={lC2}/>
              <path d={`M${cx+1},${Math.round(sMY-8)} Q${cx+18},${Math.round(sMY-20)} ${cx+12},${Math.round(sMY-37)}`} stroke={lV} strokeWidth={1.0} fill="none"/>
            </g>
          )}

          {/* Petite feuille haute */}
          {r > 0.5 && (
            <path d={`M${cx-1},${Math.round(flwY+26)} C${cx-18},${Math.round(flwY+18)} ${cx-19},${Math.round(flwY+5)} ${cx-6},${Math.round(flwY+9)} C${cx-1},${Math.round(flwY+14)} ${cx-1},${Math.round(flwY+20)} ${cx-1},${Math.round(flwY+26)} Z`}
              fill={`rgba(${40+Math.round(22*r)},${122+Math.round(72*r)},${36+Math.round(22*r)},${0.54+0.28*r})`}/>
          )}

          {/* FLEUR */}
          {r > 0.38 && (
            <g>
              <circle cx={cx} cy={flwY} r={pD*3.4} fill={`url(#${id}fg)`} filter={`url(#${id}f3)`}/>
              {/* Calice */}
              {[-28,0,28].map((a,i) => {
                const rad=(a-90)*Math.PI/180
                return <path key={i} d={`M${cx},${Math.round(flwY+pRy*0.55)} Q${cx+Math.round(Math.cos(rad)*9)},${Math.round(flwY+pRy*0.55+12)} ${cx},${Math.round(flwY+pRy*0.55+14)}`} fill={lC2} opacity={0.65}/>
              })}
              {/* Pétales arrière */}
              <g style={breathe2}>
                {p2.map((angle,i) => {
                  const rad=angle*Math.PI/180
                  const px=cx+Math.cos(rad)*pD*0.8, py=flwY+Math.sin(rad)*pD*0.8
                  return <ellipse key={i} cx={px} cy={py} rx={pRx*0.68} ry={pRy*0.68}
                    fill={`url(#${id}p2)`} transform={`rotate(${angle+90},${px},${py})`} filter={`url(#${id}f1)`}/>
                })}
              </g>
              {/* Pétales avant */}
              <g style={breathe1}>
                {p1.map((angle,i) => {
                  const rad=angle*Math.PI/180
                  const px=cx+Math.cos(rad)*pD, py=flwY+Math.sin(rad)*pD
                  return <ellipse key={i} cx={px} cy={py} rx={pRx} ry={pRy}
                    fill={`url(#${id}p1)`} transform={`rotate(${angle+90},${px},${py})`}/>
                })}
              </g>
              {/* Pistil */}
              <circle cx={cx} cy={flwY} r={7.5+5.5*r} fill={`rgba(${Math.round(r1*.80)},${Math.round(g1*.48+52)},${Math.round(b1*.58+32)},0.88)`}/>
              <circle cx={cx} cy={flwY} r={4+3.5*r} fill={`url(#${id}pi)`}/>
              {/* Pollen */}
              {r > 0.52 && [0,51,103,154,205,257,308].map((a,i) => {
                const rp=5.5+3.5*r, rad=a*Math.PI/180
                return <circle key={i}
                  cx={cx+Math.cos(rad)*rp} cy={flwY+Math.sin(rad)*rp}
                  r={1.1} fill={`rgba(255,232,72,${0.68+0.24*r})`}
                  style={{animation:`svgPollen 2.2s ease-in-out infinite ${(i*0.18).toFixed(2)}s`}}/>
              })}
            </g>
          )}

          {/* BOURGEON */}
          {r <= 0.38 && r > 0.08 && (
            <g>
              {[-24,0,24].map((a,i) => (
                <path key={i} d={`M${cx},${Math.round(flwY+6+8*r)} Q${cx+Math.round(Math.sin(a*Math.PI/180)*8)},${Math.round(flwY+8*r)} ${cx},${Math.round(flwY+7*r)}`} fill={lC2} opacity={0.7}/>
              ))}
              <ellipse cx={cx} cy={flwY} rx={4+6*r} ry={8+9*r} fill={`rgba(${r1},${g1},${b1},${0.52+0.36*r})`}/>
              <ellipse cx={cx-1} cy={flwY-1} rx={2.5+4*r} ry={5+7*r} fill={`rgba(${r2},${g2},${b2},0.42)`}/>
            </g>
          )}

          {/* GRAINE */}
          {r <= 0.08 && (
            <g>
              <ellipse cx={cx} cy={flwY+5} rx={5} ry={3} fill="rgba(118,78,36,0.52)"/>
              <path d={`M${cx},${flwY+3} Q${cx+3},${flwY-5} ${cx+1},${flwY-10}`} stroke="rgba(78,138,48,0.62)" strokeWidth={1.4} strokeLinecap="round" fill="none"/>
            </g>
          )}

        </g>
      </g>
    </svg>
  )
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const MEMBER_EMOJIS = { Marie:'🌸', Lucas:'🌿', Sofia:'🌾', Paul:'🌱', Léa:'🌺', Tom:'🍃' }
const memberEmoji = n => MEMBER_EMOJIS[n] ?? '🌿'
const GESTURE_EMOJI = { water:'💧', sun:'☀️', seed:'🌱' }
const GESTURE_LABEL = { water:'une goutte', sun:'un rayon', seed:'une graine' }

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  if (m < 1440) return `il y a ${Math.floor(m/60)}h`
  return 'hier'
}
function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { weekday:'short', day:'numeric', month:'short' }).format(new Date(iso))
}

const ZONES = [
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'#96d485' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'#7ad490' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'#60d475' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'#e088a8' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'#88b8e8' },
]

/* ─────────────────────────────────────────
   MODAL INVITATION
───────────────────────────────────────── */
function InviteModal({ circle, onClose, onCopied }) {
  const [copied, setCopied] = useState(false)
  const code = circle?.invite_code ?? '——'
  const shareText = 'Rejoins mon cercle "' + (circle?.name ?? '') + '" sur Mon Jardin Intérieur 🌿 - Code : ' + code

  function handleCopy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShareText() {
    navigator.clipboard?.writeText(shareText).then(() => {
      onCopied?.()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Inviter dans {circle?.name} 🌿</div>

        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>
          Partagez ce code avec les personnes que vous souhaitez inviter dans votre cercle.
        </div>

        <div style={{ background:'rgba(150,212,133,0.08)', border:'1px solid var(--greenT)', borderRadius:14, padding:'18px 20px', textAlign:'center' }}>
          <div style={{ fontSize:9, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Code d'invitation</div>
          <div style={{ fontFamily:'monospace', fontSize:28, letterSpacing:'.3em', color:'var(--text)', fontWeight:300 }}>{code}</div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="modal-submit" style={{ flex:1 }} onClick={handleCopy}>
            {copied ? '✓ Copié !' : '📋 Copier le code'}
          </button>
          <button className="modal-cancel" onClick={handleShareText} title="Copier un message complet">
            ✉️ Copier message
          </button>
        </div>

        <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>
          {circle?.memberCount ?? 0}/{circle?.max_members ?? 8} membres · {circle?.is_open ? 'Cercle ouvert' : 'Sur invitation uniquement'}
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 1 — CERCLE
───────────────────────────────────────── */
function useCollectifs(userId) {
  const [collectifs, setCollectifs] = useState([])
  const [joinedIds, setJoinedIds]   = useState(new Set())

  async function fetchCollectifs() {
    const { data } = await supabase
      .from('collectifs')
      .select(`id, emoji, title, description, starts_at, duration_min, collectif_participants(count)`)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5)
    setCollectifs(data ?? [])
  }

  async function fetchJoined() {
    if (!userId) return
    const { data } = await supabase
      .from('collectif_participants')
      .select('collectif_id')
      .eq('user_id', userId)
    setJoinedIds(new Set(data?.map(d => d.collectif_id) ?? []))
  }

  useEffect(() => { fetchCollectifs() }, [])
  useEffect(() => { fetchJoined() }, [userId])

  async function rejoindre(collectifId) {
    await supabase
      .from('collectif_participants')
      .upsert({ collectif_id: collectifId, user_id: userId }, { onConflict: 'collectif_id,user_id' })
    await Promise.all([fetchCollectifs(), fetchJoined()])
  }

  async function quitter(collectifId) {
    await supabase
      .from('collectif_participants')
      .delete()
      .eq('collectif_id', collectifId)
      .eq('user_id', userId)
    await Promise.all([fetchCollectifs(), fetchJoined()])
  }

  return { collectifs, joinedIds, rejoindre, quitter }
}

function useRecentActivity(circleId) {
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!circleId) { setLoading(false); return }

    async function load() {
      setLoading(true)

      // Récupérer les membres du cercle
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId)

      if (!members?.length) { setLoading(false); return }
      const userIds = members.map(m => m.user_id)

      // Rituels complétés récemment (48h)
      const since = new Date(Date.now() - 48 * 3600000).toISOString()

      const [{ data: rituals }, { data: gestures }] = await Promise.all([
        supabase
          .from('rituals')
          .select('user_id, name, zone, completed_at, users:user_id(display_name, email)')
          .in('user_id', userIds)
          .gte('completed_at', since)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('gestures')
          .select('from_user_id, to_user_id, type, created_at, sender:from_user_id(display_name, email), receiver:to_user_id(display_name, email)')
          .in('from_user_id', userIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Fusionner et trier par date
      const items = [
        ...(rituals ?? []).map(r => ({
          type:   'ritual',
          name:   r.users?.display_name ?? r.users?.email ?? '?',
          action: 'a complété',
          ritual: r.name,
          zone:   r.zone,
          t:      r.completed_at
        })),
        ...(gestures ?? []).map(g => {
          const to = g.receiver?.display_name ?? g.receiver?.email ?? '?'
          return {
            type:   'gesture',
            name:   g.sender?.display_name ?? g.sender?.email ?? '?',
            action: `a envoyé ${g.type} à ${to}`,
            ritual: '',
            zone:   '',
            t:      g.created_at
          }
        })
      ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8)

      setActivity(items)
      setLoading(false)
    }

    load()
  }, [circleId])

  return { activity, loading }
}

/* ─────────────────────────────────────────
   HOOK — MEMBRES PAR PROXIMITÉ (30 jours)
   Scores :
     geste envoyé/reçu   → +3 pts
     même cercle actif   → +2 pts
     même collectif      → +2 pts
     commentaire/réaction→ +4 pts
   Niveaux dynamiques :
     top 10%  → 🌳 Famille
     top 35%  → 🌿 Amis
     reste    → 🌱 Relations
───────────────────────────────────────── */
function useProximityMembers(userId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const since = new Date(Date.now() - 30 * 86400000).toISOString()
      const scores = {}

      const ensure = (id, name, email, avatar) => {
        if (!scores[id]) scores[id] = { userId: id, name: name ?? email ?? '?', score: 0 }
      }

      // 1. Gestes envoyés/reçus (+3 pts chacun)
      const [{ data: sent }, { data: recv }] = await Promise.all([
        supabase.from('gestures')
          .select('to_user_id, receiver:to_user_id(display_name, email)')
          .eq('from_user_id', userId)
          .gte('created_at', since),
        supabase.from('gestures')
          .select('from_user_id, sender:from_user_id(display_name, email)')
          .eq('to_user_id', userId)
          .gte('created_at', since)
      ])
      ;(sent ?? []).forEach(g => {
        const id = g.to_user_id
        ensure(id, g.receiver?.display_name, g.receiver?.email)
        scores[id].score += 3
      })
      ;(recv ?? []).forEach(g => {
        const id = g.from_user_id
        ensure(id, g.sender?.display_name, g.sender?.email)
        scores[id].score += 3
      })

      // 2. Même cercle actif (+2 pts par cercle partagé)
      const { data: myCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)
      const circleIds = (myCircles ?? []).map(c => c.circle_id)
      if (circleIds.length > 0) {
        const { data: coMembers } = await supabase
          .from('circle_members')
          .select('user_id, users:user_id(display_name, email)')
          .in('circle_id', circleIds)
          .neq('user_id', userId)
        ;(coMembers ?? []).forEach(m => {
          ensure(m.user_id, m.users?.display_name, m.users?.email)
          scores[m.user_id].score += 2
        })
      }

      // 3. Même collectif rejoint (+2 pts)
      const { data: myCollectifs } = await supabase
        .from('collectif_participants')
        .select('collectif_id')
        .eq('user_id', userId)
        .gte('created_at', since)
      const collectifIds = (myCollectifs ?? []).map(c => c.collectif_id)
      if (collectifIds.length > 0) {
        const { data: coParticipants } = await supabase
          .from('collectif_participants')
          .select('user_id, users:user_id(display_name, email)')
          .in('collectif_id', collectifIds)
          .neq('user_id', userId)
          .gte('created_at', since)
        ;(coParticipants ?? []).forEach(p => {
          ensure(p.user_id, p.users?.display_name, p.users?.email)
          scores[p.user_id].score += 2
        })
      }

      // Trier par score décroissant, garder les 50 premiers
      const sorted = Object.values(scores)
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)

      setMembers(sorted)
      setLoading(false)
    }

    load()
  }, [userId])

  return { members, loading }
}

function ScreenCercle({ userId, openCreate, onCreateClose, openInvite, onInviteClose }) {
  const { circleMembers, activeCircle } = useCircle(userId)
  const { received, send } = useGestures(userId)
  const { activity } = useRecentActivity(activeCircle?.id)
  const { collectifs, joinedIds, rejoindre, quitter } = useCollectifs(userId)
  const { members: proximityMembers, loading: proximityLoading } = useProximityMembers(userId)
  const [sentGestures, setSentGestures] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // Topbar "+ Inviter" ouvre le modal
  const isInviteOpen = showInvite || openInvite

  async function handleSendGesture(toUserId, type) {
    const key = `${toUserId}-${type}`
    if (sentGestures.has(key)) return
    setSentGestures(prev => new Set([...prev, key]))
    try {
      await send(toUserId, activeCircle?.id, type)
      const labels = { '💧':'une goutte', '☀️':'un rayon', '🌱':'une graine' }
      showToast(`${type} ${labels[type]} envoyé${type==='☀️'?'':' !'} ✨`)
    } catch {
      setSentGestures(prev => { const s = new Set(prev); s.delete(key); return s })
      showToast("Erreur lors de l'envoi")
    }
  }



  return (
    <>
      <Toast msg={toast} />
      {isInviteOpen && activeCircle && (
        <InviteModal
          circle={activeCircle}
          onClose={() => { setShowInvite(false); onInviteClose?.() }}
          onCopied={() => showToast('🌿 Code copié !')}
        />
      )}
      <div className="content">
        <div className="col" style={{ flex:1 }}>
        {collectifs[0] && (() => {
          const c = collectifs[0]
          const diff = new Date(c.starts_at) - Date.now()
          const h = Math.floor(diff / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          const heure = new Date(c.starts_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
          const nbPart = c.collectif_participants?.[0]?.count ?? 0
          const timer = diff > 0 ? (h > 0 ? `dans ${h}h ${m}min` : `dans ${m} min`) : 'En cours'
          return (
            <div className="collective-banner">
              <div className="cb-top">
                <span className="cb-badge">{c.emoji} Collectif · {heure}</span>
                <span className="cb-timer">{timer}</span>
              </div>
              <div className="cb-title">{c.title} — {heure}</div>
              {c.description && <div className="cb-desc">{c.description}</div>}
              <div className="cb-foot">
                <div className="cb-avatars">
                  {['🌸','🌿','🌾','🌱'].map((e,i) => <div key={i} className="cb-av">{e}</div>)}
                </div>
                <span className="cb-count">{nbPart} participants inscrits</span>
                <div style={{ display:'flex', gap:6 }}>
                  <div
                    className="cb-join"
                    onClick={() => !joinedIds.has(c.id) && rejoindre(c.id)}
                    style={{ opacity: joinedIds.has(c.id) ? 0.5 : 1, cursor: joinedIds.has(c.id) ? 'default' : 'pointer' }}
                  >
                    {joinedIds.has(c.id) ? '✓ Inscrit' : 'Rejoindre'}
                  </div>
                  {joinedIds.has(c.id) && (
                    <div
                      className="cb-join"
                      onClick={() => quitter(c.id)}
                      style={{ background:'rgba(210,110,110,0.12)', border:'1px solid rgba(210,110,110,0.3)', color:'rgba(210,110,110,0.85)', cursor:'pointer' }}
                    >
                      Se désinscrire
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <div className="slabel">Activité récente</div>
        {activity.length === 0 ? (
          <div style={{ fontSize:12, color:'var(--text3)', padding:'12px 0', fontStyle:'italic' }}>
            Aucune activité récente dans ce cercle.
          </div>
        ) : activity.map((a, i) => (
          <div key={i} className="act-item">
            <div className="act-av">{memberEmoji(a.name)}</div>
            <div className="act-body">
              <div className="act-text"><b>{a.name}</b> {a.action} {a.ritual && <b>{a.ritual}</b>}</div>
              <div className="act-time">{timeAgo(a.t)}</div>
            </div>
            {a.zone && <div className="act-zone">{a.zone}</div>}
          </div>
        ))}
        </div>

        <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Ma communauté · {proximityMembers.length}</div>

          {proximityLoading && (
            <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>Calcul des proximités…</div>
          )}

          {!proximityLoading && proximityMembers.length === 0 && (
            <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>
              Pas encore d'interactions ce mois-ci.
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {proximityMembers.slice(0, 50).map((m, i) => (
              <div key={m.userId} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:10 }}>
                <div style={{ fontSize:9, color:'var(--text3)', width:16, textAlign:'right', flexShrink:0 }}>{i+1}</div>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(150,212,133,0.12)', border:'1px solid rgba(150,212,133,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>
                  {memberEmoji(m.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize:9, color:'var(--text3)', marginTop:1 }}>{m.score} interactions</div>
                </div>
                {m.userId !== userId && (
                  <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                    {['💧','☀️','🌱'].map(type => (
                      <div key={type}
                        className={'mr-gesture-btn' + (sentGestures.has(`${m.userId}-${type}`) ? ' sent' : '')}
                        onClick={() => !sentGestures.has(`${m.userId}-${type}`) && handleSendGesture(m.userId, type)}
                        title={`Envoyer ${type}`}
                        style={{ fontSize:11, padding:'2px 5px' }}
                      >{type}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Gestes reçus</div>
          {received.map(g => (
            <div key={g.id} className="gesture-item">
              <div className="gi-emoji">{GESTURE_EMOJI[g.type]}</div>
              <div className="gi-text"><b>{g.users?.display_name ?? '?'}</b> t'a envoyé {GESTURE_LABEL[g.type]}</div>
              <div className="gi-time">{timeAgo(g.created_at)}</div>
            </div>
          ))}
        </div>
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Prochains collectifs</div>
          {collectifs.slice(0, 4).map((c, i) => {
            const d = new Date(c.starts_at)
            const now = new Date()
            const isToday = d.toDateString() === now.toDateString()
            const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
            const heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
            const label = isToday ? `Ce soir ${heure}` : isTomorrow ? `Demain ${heure}` : d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric' }) + ` ${heure}`
            const nbPart = c.collectif_participants?.[0]?.count ?? 0
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9, padding:'8px 10px', background:'rgba(255,255,255,0.05)', borderRadius:10, border:'1px solid var(--border2)' }}>
                <span style={{ fontSize:15 }}>{c.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{c.title}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{label} · {nbPart} pers.</div>
                </div>
              </div>
            )
          })}
          {collectifs.length === 0 && (
            <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>Aucun collectif prévu.</div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

/* ─────────────────────────────────────────
   JOURNAL COMPOSER
───────────────────────────────────────── */
function JournalComposer({ userId, plantId, onSaved }) {
  const { create } = useJournal(userId)
  const [text, setText]         = useState('')
  const [zones, setZones]       = useState([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const ZONE_LABELS = ['Racines','Tige','Feuilles','Fleurs','Souffle']

  function toggleZone(z) {
    setZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z])
  }

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const entry = await create(plantId ?? null, text.trim(), zones)
      onSaved?.(entry)
      setText(''); setZones([])
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="journal-composer">
      <textarea
        className="jc-textarea"
        placeholder="Comment s'est passée votre journée ? Qu'avez-vous remarqué en vous ?"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="jc-zones">
        {ZONE_LABELS.map(z => (
          <div key={z} className={'jc-zone' + (zones.includes(z) ? ' selected' : '')} onClick={() => toggleZone(z)}>
            {z}
          </div>
        ))}
      </div>
      <div className="jc-foot">
        <span className="jc-hint">{text.length > 0 ? `${text.length} caractères` : 'Votre journal est privé par défaut'}</span>
        <button className="jc-save" disabled={!text.trim() || saving} onClick={handleSave}>
          {saved ? '✓ Sauvegardé' : saving ? '…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SCREEN 2 — MON JARDIN
───────────────────────────────────────── */
function ScreenMonJardin({ userId, openCreate, onCreateClose }) {
  const { todayPlant, history, weekGrid, stats, todayRituals, isLoading, error, completeRitual } = usePlant(userId)
  const { settings, toggle } = usePrivacy(userId)
  const { entries } = useJournal(userId)

  const PRIVACY_FIELDS = [
    { field:'show_health',       icon:'💚', label:'Vitalité globale' },
    { field:'show_rituals',      icon:'🌿', label:'Rituels complétés' },
    { field:'show_zone_scores',  icon:'📊', label:'Scores par zone' },
    { field:'show_quiz_answers', icon:'📝', label:'Réponses au quiz' },
    { field:'show_journal',      icon:'📓', label:'Journal personnel' },
  ]

  const [gardenSettings, setGardenSettings] = useState(DEFAULT_GARDEN_SETTINGS)
  const [showGardenSettings, setShowGardenSettings] = useState(false)

  // Charger les settings depuis Supabase
  useEffect(() => {
    if (!userId) return
    supabase
      .from('garden_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGardenSettings({
          sunriseH: data.sunrise_h ?? 7,
          sunriseM: data.sunrise_m ?? 0,
          sunsetH:  data.sunset_h  ?? 20,
          sunsetM:  data.sunset_m  ?? 0,
          petalColor1: data.petal_color1 ?? '#e8789a',
          petalColor2: data.petal_color2 ?? '#f0a8be',
          petalShape:  data.petal_shape  ?? 'round',
        })
      })
  }, [userId])

  const doneIds = new Set(todayRituals.map(r => RITUAL_CATALOG.find(c => c.name === r.name)?.id))
  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())

  if (isLoading) return (
    <div className="content">
    <div className="mj-layout" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:13, color:'var(--text3)', letterSpacing:'.1em' }}>Votre jardin se réveille…</div>
    </div>
    </div>
  )

  return (
    <>
    {showGardenSettings && (
      <GardenSettingsModal
        settings={gardenSettings}
        onSave={async s => {
          setGardenSettings(s)
          // Persiste dans Supabase
          await supabase.from('garden_settings').upsert({
            user_id:      userId,
            sunrise_h:    s.sunriseH,
            sunrise_m:    s.sunriseM,
            sunset_h:     s.sunsetH,
            sunset_m:     s.sunsetM,
            petal_color1: s.petalColor1,
            petal_color2: s.petalColor2,
            petal_shape:  s.petalShape,
          }, { onConflict: 'user_id' })
        }}
        onClose={() => setShowGardenSettings(false)}
      />
    )}
    <div className="content">
    <div className="mj-layout">
      <div className="mj-left">
        {/* Carte jardin 2 colonnes */}
        <div className="plant-hero ph-2col">
          <div className="ph-col-flower">
            <PlantSVG health={todayPlant?.health ?? 50} gardenSettings={gardenSettings} />
          </div>
          <div className="ph-col-info">
            <div className="ph-vitality-score">
              <div className="ph-score-number">
                <span className="ph-score-digits">{todayPlant?.health ?? '—'}</span>
                <span className="ph-score-pct">%</span>
              </div>
              <div className="ph-score-label">Vitalité</div>
              <div className="ph-score-date">{todayLabel}</div>
            </div>
            <div className="ph-zones-list">
              {ZONES.map((z, i) => {
                const val = todayPlant?.[z.key] ?? 50
                return (
                  <div key={z.key} className="ph-zone-row-new" style={{ '--zone-color': z.color, '--zone-val': val + '%', animationDelay: (i * 0.08) + 's' }}>
                    <span className="ph-zone-icon-new">{z.icon}</span>
                    <div className="ph-zone-track">
                      <div className="ph-zone-fill-new" />
                    </div>
                    <span className="ph-zone-pct-new">{val}</span>
                  </div>
                )
              })}
            </div>
            <div className="ph-settings-btn" onClick={() => setShowGardenSettings(true)}>⚙</div>
          </div>
        </div>

        <div className="slabel">Rituels du jour</div>
        <div className="ritual-grid">
          {RITUAL_CATALOG.map(r => {
            const done = doneIds.has(r.id)
            return (
              <div key={r.id}
                className={'ritual-btn ' + (r.delta > 0 ? 'positive' : 'negative') + (done ? ' done' : '')}
                onClick={() => !done && completeRitual(r.id)}
              >
                <span className="rb-emoji">{done ? '✅' : r.emoji}</span>
                <span className="rb-name">{r.name}</span>
                <span className={'rb-delta ' + (r.delta > 0 ? 'pos' : 'neg')}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>
              </div>
            )
          })}
        </div>

        <div className="history-chart">
          <div className="hc-header">
            <div className="hc-title">Évolution sur 7 jours</div>
            <div className="hc-period">
              {history.length >= 2
                ? `${history[0]?.date?.slice(5).replace('-','/')} – ${history.at(-1)?.date?.slice(5).replace('-','/')}`
                : '7 derniers jours'}
            </div>
          </div>
          <div className="hc-graph">
            {history.map((d, i) => {
              const isToday = d.date === today
              const lbl = new Date(d.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,1).toUpperCase()
              return (
                <div key={i} className="hc-bar-wrap">
                  <div className={'hc-bar' + (isToday ? ' today' : '')} style={{ height:`${d.health}%` }} />
                  <div className="hc-day">{lbl}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="slabel">Rituels cette semaine</div>
        <div className="week-grid">
          {weekGrid.map((d, i) => (
            <div key={i} className="wday">
              <div className={'wd-dot ' + d.status + (d.isToday ? ' today' : '')}>{d.count||'–'}</div>
              <div className="wd-label">{d.label}</div>
            </div>
          ))}
        </div>

        <div className="slabel">Journal personnel</div>
        <JournalComposer userId={userId} plantId={todayPlant?.id} onSaved={entry => {}} />
        {entries.map(e => (
          <div key={e.id} className="journal-entry">
            <div className="je-date">{formatDate(e.created_at)}</div>
            <div className="je-text">"{e.content}"</div>
            <div className="je-rituals">{(e.zone_tags??[]).map(t => <div key={t} className="je-tag">{t}</div>)}</div>
          </div>
        ))}
      </div>

      <div className="mj-right">
        <div className="slabel">Confidentialité</div>
        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, marginBottom:10 }}>
          Ce que vos cercles peuvent voir de vous.
        </div>
        {PRIVACY_FIELDS.map(p => (
          <div key={p.field} className="privacy-item">
            <div className="priv-icon">{p.icon}</div>
            <div className="priv-label">{p.label}</div>
            <div className={'priv-toggle ' + (settings?.[p.field] ? 'on' : 'off')} onClick={() => toggle(p.field)}>
              <div className="pt-knob" />
            </div>
          </div>
        ))}

        <div className="slabel" style={{ marginTop:8 }}>Statistiques</div>
        {[
          { label:'Jours consécutifs',   val: stats ? `${stats.streak} 🔥` : '—' },
          { label:'Rituels ce mois',     val: stats?.ritualsThisMonth ?? '—'      },
          { label:'Zone la plus active', val: stats?.favoriteZone ?? '—'          },
          { label:'Cercles actifs',      val: '2'                                 },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:12, color:'var(--text2)', fontWeight:300 }}>{s.label}</div>
            <div style={{ fontSize:14, color:'var(--text)', fontFamily:"'Cormorant Garamond',serif" }}>{s.val}</div>
          </div>
        ))}

        <div className="slabel" style={{ marginTop:8 }}>Exporter</div>
        {[
          { label:'Journal PDF',    icon:'📄', action:() => exportPDF(history, entries, user?.display_name ?? user?.email) },
          { label:'Vitalité CSV',   icon:'📊', action:() => exportPlantCSV(history) },
          { label:'Journal CSV',    icon:'📝', action:() => exportJournalCSV(entries) },
        ].map((e, i) => (
          <div key={i}
            onClick={e.action}
            style={{ padding:'9px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text2)', cursor:'pointer', marginBottom:7, display:'flex', alignItems:'center', gap:9, transition:'all .2s' }}
            onMouseEnter={ev => ev.currentTarget.style.background='rgba(255,255,255,0.09)'}
            onMouseLeave={ev => ev.currentTarget.style.background='rgba(255,255,255,0.05)'}
          >
            <span style={{ fontSize:14 }}>{e.icon}</span>{e.label}
          </div>
        ))}
      </div>
    </div>
    </div>
    </>
  )
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null
  return <div className="toast">{msg}</div>
}

const THEMES_LIST = [
  ['🧘', 'Méditation & Souffle'],
  ['🏃', 'Mouvement & Corps'],
  ['🌙', 'Sommeil & Décompression'],
  ['📓', 'Gratitude & Journaling'],
  ['🥗', 'Alimentation consciente'],
  ['🌿', 'Nature & Plein air'],
  ['🎨', 'Créativité & Expression'],
  ['🌸', 'Bien-être général'],
]

function getThemeEmoji(theme) {
  const found = THEMES_LIST.find(([, label]) => label === theme)
  return found ? found[0] : '🌱'
}

/* ─────────────────────────────────────────
   MODAL MODIFIER UNE GRAINE
───────────────────────────────────────── */
function EditCircleModal({ circle, onClose, onSave }) {
  const [name,        setName]       = useState(circle.name ?? '')
  const [theme,       setTheme]      = useState(circle.theme ?? '')
  const [description, setDescription] = useState(circle.description ?? '')
  const [isOpen,      setIsOpen]     = useState(circle.is_open ?? false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est requis.'); return }
    setLoading(true); setError(null)
    try { await onSave(name.trim(), theme.trim() || 'Bien-être général', isOpen, description.trim()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Modifier la graine ✏️</div>
        <div className="modal-field">
          <label className="modal-label">Nom de la graine</label>
          <input className="modal-input" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-field">
          <label className="modal-label">Thème</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}
            style={{ width:'100%', padding:'9px 13px', background:'#1e2e1e', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color: theme ? 'var(--text2)' : 'var(--text3)', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
            <option value="">— Choisir un thème —</option>
            {THEMES_LIST.map(([emoji, label]) => (
              <option key={label} value={label}>{emoji} {label}</option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label">Intention / Description</label>
          <textarea className="modal-input" value={description} onChange={e => setDescription(e.target.value)}
            style={{ resize:'vertical', minHeight:70, lineHeight:1.6 }} />
        </div>
        <div className="modal-row" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <span className="modal-toggle-lbl" style={{ fontWeight: isOpen ? 500 : 400, color: isOpen ? 'var(--text)' : 'var(--text3)' }}>
              {isOpen ? '🌍 Graine publique' : '🔒 Sur invitation uniquement'}
            </span>
            <div className={'priv-toggle ' + (isOpen ? 'on' : 'off')} onClick={() => setIsOpen(v => !v)}>
              <div className="pt-knob" />
            </div>
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
            {isOpen
              ? "Visible dans Découvrir — n'importe qui peut rejoindre sans code"
              : "Invisible publiquement — accès uniquement via code d'invitation"}
          </div>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MODAL CRÉER UN CERCLE
───────────────────────────────────────── */
function CreateCircleModal({ onClose, onCreate }) {
  const [name,        setName]       = useState('')
  const [theme,       setTheme]      = useState('')
  const [isOpen,      setIsOpen]      = useState(false)
  const [duration,    setDuration]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiDesc,      setAiDesc]      = useState('')
  const [error,       setError]       = useState(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom de la graine est requis.'); return }
    setLoading(true); setError(null)
    try {
      await onCreate(name.trim(), theme.trim() || 'Bien-être général', isOpen, duration, aiDesc)
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const durations = [
    { label:'1 jour',    value:1  },
    { label:'1 semaine', value:7  },
    { label:'15 jours',  value:15 },
  ]

  async function generateDescription() {
    if (!name.trim() && !theme) return
    setAiLoading(true)
    try {
      const data = await callModerateCircle({ action: 'generate', name: name.trim(), theme })
      setAiDesc(data.description ?? '')
    } catch(e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Nouvelle Graine 🌱</div>
        <div className="modal-field">
          <label className="modal-label">Nom de la graine</label>
          <input className="modal-input" placeholder="ex. Rituels du Matin" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-field">
          <label className="modal-label">Thème</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}
            style={{ width:'100%', padding:'9px 13px', background:'#1e2e1e', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color: theme ? 'var(--text2)' : 'var(--text3)', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
            <option value="">— Choisir un thème —</option>
            {THEMES_LIST.map(([emoji, label]) => (
              <option key={label} value={label}>{emoji} {label}</option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Description générée par IA</span>
            {(name.trim() || theme) && (
              <div onClick={generateDescription}
                style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--greenT)', color:'#c8f0b8', background:'var(--green3)', cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? .5 : 1 }}>
                {aiLoading ? '✨ Génération…' : '✨ Générer'}
              </div>
            )}
          </label>
          {aiDesc
            ? <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8, fontStyle:'italic', padding:'10px 13px', background:'rgba(150,212,133,0.05)', borderRadius:10, border:'1px solid rgba(150,212,133,0.15)' }}>
                "{aiDesc}"
                <span onClick={() => setAiDesc('')} style={{ marginLeft:8, fontSize:10, color:'var(--text3)', cursor:'pointer', fontStyle:'normal' }}>✕</span>
              </div>
            : <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>
                {name.trim() || theme ? "Cliquez sur ✨ Générer pour créer une description." : "Renseignez d'abord le nom et le thème."}
              </div>
          }
        </div>
        <div className="modal-field">
          <label className="modal-label">Durée de vie</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
            {durations.map(opt => (
              <div key={String(opt.value)}
                onClick={() => setDuration(opt.value)}
                style={{
                  padding:'6px 14px', borderRadius:100, fontSize:11, cursor:'pointer',
                  border: duration === opt.value ? '1px solid var(--greenT)' : '1px solid var(--border)',
                  background: duration === opt.value ? 'rgba(150,212,133,0.12)' : 'rgba(255,255,255,0.04)',
                  color: duration === opt.value ? '#c8f0b8' : 'var(--text3)',
                  transition:'all .15s'
                }}
              >{opt.label}</div>
            ))}
          </div>
        </div>
        <div className="modal-row" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <span className="modal-toggle-lbl" style={{ fontWeight: isOpen ? 500 : 400, color: isOpen ? 'var(--text)' : 'var(--text3)' }}>
              {isOpen ? '🌍 Graine publique' : '🔒 Sur invitation uniquement'}
            </span>
            <div className={'priv-toggle ' + (isOpen ? 'on' : 'off')} onClick={() => setIsOpen(v => !v)}>
              <div className="pt-knob" />
            </div>
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
            {isOpen
              ? "Visible dans \"Découvrir\" — n'importe qui peut rejoindre sans code"
              : "Invisible publiquement — accès uniquement via code d'invitation"}
          </div>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? '…' : 'Créer la graine'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   EXPORT HELPERS
───────────────────────────────────────── */
function downloadCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = filename; a.click(); URL.revokeObjectURL(a.href)
}

function exportPlantCSV(history) {
  downloadCSV((history ?? []).map(p => ({
    Date: p.date,
    'Vitalité (%)': p.health,
    'Racines (%)': p.zone_racines ?? '',
    'Tige (%)': p.zone_tige ?? '',
    'Feuilles (%)': p.zone_feuilles ?? '',
    'Fleurs (%)': p.zone_fleurs ?? '',
    'Souffle (%)': p.zone_souffle ?? '',
  })), `jardin-vitalite-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportJournalCSV(entries) {
  downloadCSV((entries ?? []).map(e => ({
    Date: new Date(e.created_at).toLocaleDateString('fr-FR'),
    Contenu: e.content,
    Zones: (e.zone_tags ?? []).join(' | '),
  })), `jardin-journal-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportPDF(history, entries, userName) {
  const w = window.open('', '_blank')
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const plantRows = (history ?? []).map(p =>
    `<tr><td>${p.date}</td><td>${p.health}%</td><td>${p.zone_racines??'—'}%</td><td>${p.zone_tige??'—'}%</td><td>${p.zone_feuilles??'—'}%</td><td>${p.zone_fleurs??'—'}%</td><td>${p.zone_souffle??'—'}%</td></tr>`
  ).join('')
  const journalRows = (entries ?? []).map(e =>
    `<tr><td>${new Date(e.created_at).toLocaleDateString('fr-FR')}</td><td>${e.content ?? ''}</td><td>${(e.zone_tags??[]).join(', ')}</td></tr>`
  ).join('')
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Mon Jardin Intérieur — Bilan</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,serif;color:#1a1a1a;padding:40px 48px;max-width:860px;margin:0 auto}
h1{font-size:26px;font-weight:300;color:#2d5a27;margin-bottom:4px}
.sub{font-size:12px;color:#888;margin-bottom:28px}
h2{font-size:14px;font-weight:500;color:#2d5a27;border-bottom:1px solid #ddd;padding-bottom:6px;margin:24px 0 12px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f0f7ee;text-align:left;padding:7px 9px;color:#2d5a27;font-weight:500}
td{padding:6px 9px;border-bottom:1px solid #eee;color:#333;vertical-align:top;line-height:1.5}
@media print{body{padding:20px}}
</style></head><body>
<h1>Mon Jardin Intérieur</h1>
<div class="sub">Bilan de ${userName ?? 'votre jardin'} — ${today}</div>
<h2>Historique de vitalité</h2>
<table><thead><tr><th>Date</th><th>Vitalité</th><th>Racines</th><th>Tige</th><th>Feuilles</th><th>Fleurs</th><th>Souffle</th></tr></thead>
<tbody>${plantRows || '<tr><td colspan="7" style="color:#999;font-style:italic">Aucune donnée</td></tr>'}</tbody></table>
<h2>Journal personnel</h2>
<table><thead><tr><th>Date</th><th>Entrée</th><th>Zones</th></tr></thead>
<tbody>${journalRows || '<tr><td colspan="3" style="color:#999;font-style:italic">Aucune entrée</td></tr>'}</tbody></table>
<script>window.onload=()=>window.print()<\/script>
</body></html>`)
  w.document.close()
}

/* ─────────────────────────────────────────
   SCREEN 3 — CERCLES
───────────────────────────────────────── */
function ScreenCercles({ userId, openCreate, onCreateClose, onReport }) {
  const { circles, activeCircle, createCircle, joinByCode, loadCircles, selectCircle } = useCircle(userId)
  const [joinCode, setJoinCode]           = useState('')
  const [joinError, setJoinError]         = useState(null)
  const [joinLoading, setJoinLoading]     = useState(false)
  const [copied, setCopied]               = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [toast, setToast]                 = useState(null)
  const [publicCircles, setPublicCircles]   = useState([])
  const [editCircle, setEditCircle]         = useState(null)  // graine en cours d'édition
  const [deleteConfirm, setDeleteConfirm]   = useState(null)  // graine à supprimer
  const [showDetail, setShowDetail]         = useState(false) // modale détail
  const [creatorNames, setCreatorNames]     = useState({})    // circleId → display_name du jardinier

  // Charger le nom du jardinier via created_by sur circles
  useEffect(() => {
    if (!circles.length) return
    const memberCircles = circles.filter(c => !c.isAdmin)
    if (!memberCircles.length) return
    // Récupérer created_by depuis circles
    supabase
      .from('circles')
      .select('id, created_by')
      .in('id', memberCircles.map(c => c.id))
      .then(async ({ data: circleData }) => {
        if (!circleData?.length) return
        const creatorIds = [...new Set(circleData.map(r => r.created_by).filter(Boolean))]
        if (!creatorIds.length) return
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', creatorIds)
        const userMap = {}
        ;(usersData ?? []).forEach(u => { userMap[u.id] = u.display_name ?? u.email ?? 'Jardinier(e)' })
        const map = {}
        circleData.forEach(r => { if (r.created_by) map[r.id] = userMap[r.created_by] ?? 'Jardinier(e)' })
        setCreatorNames(map)
      })
  }, [circles])

  async function fetchPublicCircles() {
    const { data } = await supabase
      .from('circles')
      .select('id, name, theme, is_open, invite_code, expires_at, max_members, circle_members(count)')
      .eq('is_open', true)
      .order('created_at', { ascending: false })
      .limit(100)
    const mapped = (data ?? []).map(r => ({
      ...r,
      memberCount: r.circle_members?.[0]?.count ?? 0
    }))
    // Masquer les graines pleines et expirées
    const filtered = mapped.filter(r => {
      const full = r.memberCount >= (r.max_members ?? 8)
      const expired = r.expires_at && new Date(r.expires_at) < new Date()
      return !full && !expired
    }).sort(() => Math.random() - 0.5).slice(0, 10)
    setPublicCircles(filtered)
  }

  useEffect(() => { fetchPublicCircles() }, [])
  // Topbar "Créer" button also opens the modal
  const isCreateOpen = showCreate || openCreate
  const EMOJIS = ['🌸','🌿','🌾','🌱','🌺','🍃','🌼','🌷','🌻']

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoinLoading(true); setJoinError(null)
    try {
      const circle = await joinByCode(joinCode.trim())
      setJoinCode(''); showToast(`✅ Vous avez rejoint la graine "${circle.name}"`)
    } catch (e) { setJoinError(e.message) }
    finally { setJoinLoading(false) }
  }

  async function handleJoinPublic(code) {
    if (!code) return
    try {
      const circle = await joinByCode(code)
      showToast(`✅ Vous avez rejoint la graine "${circle.name}"`)
      const { data } = await supabase.from('circles')
        .select('id, name, theme, is_open, invite_code, expires_at, circle_members(count)')
        .eq('is_open', true).limit(10)
      setPublicCircles((data ?? []).map(r => ({ ...r, memberCount: r.circle_members?.[0]?.count ?? 0 })))
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  function handleCopyCode(code) {
    navigator.clipboard?.writeText(code ?? '').then(() => {
      setCopied(true); showToast('🌿 Code copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCreate(name, theme, isOpen, duration, description) {
    const myOwnGraines = circles.filter(c => c.isAdmin || c.created_by === userId)
    if (myOwnGraines.length >= 6) {
      showToast("🌱 Maximum 6 graines actives — supprimez-en une avant d'en créer une nouvelle.")
      return
    }
    // Validation IA du titre via Edge Function
    try {
      const modResult = await callModerateCircle({ action: 'moderate', name })
      if (!modResult.ok) {
        showToast('❌ Titre refusé : ' + (modResult.reason ?? 'contenu inapproprié'))
        return
      }
    } catch(e) { /* si Edge Function indisponible, on laisse passer */ }
    const circle = await createCircle(name, theme, isOpen)
    const updates = {}
    if (duration != null) updates.expires_at = new Date(Date.now() + duration * 86400000).toISOString()
    if (description) updates.description = description
    if (Object.keys(updates).length) await supabase.from('circles').update(updates).eq('id', circle.id)
    await loadCircles?.()
    fetchPublicCircles()
    showToast(`🌱 Graine "${circle.name}" créée !`)
  }

  async function handleUpdate(id, name, theme, isOpen, description) {
    try {
      await supabase.from('circles').update({ name, theme, is_open: isOpen, description }).eq('id', id)
      setEditCircle(null)
      showToast('✅ Graine mise à jour')
      loadCircles?.()
      fetchPublicCircles()
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  async function handleSignaler(circleId) {
    try {
      await supabase.from('reports').insert({ circle_id: circleId, reported_by: userId, reason: 'user_report' })
      showToast('🚩 Signalement envoyé — merci !')
      setShowDetail(false)
      onReport?.()
    } catch(e) { showToast("❌ Impossible d'envoyer le signalement") }
  }

  async function handleDelete(id) {
    try {
      await supabase.from('circle_members').delete().eq('circle_id', id)
      await supabase.from('circles').delete().eq('id', id)
      setDeleteConfirm(null)
      showToast('🗑️ Graine supprimée')
      loadCircles?.()
      fetchPublicCircles()
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  return (
    <>
      {isCreateOpen && <CreateCircleModal onClose={() => { setShowCreate(false); onCreateClose?.() }} onCreate={handleCreate} />}
      {editCircle && (
        <EditCircleModal
          circle={editCircle}
          onClose={() => setEditCircle(null)}
          onSave={(name, theme, isOpen, description) => handleUpdate(editCircle.id, name, theme, isOpen, description)}
        />
      )}
      {showDetail && activeCircle && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom:4 }}>{activeCircle.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  {getThemeEmoji(activeCircle.theme)} {activeCircle.theme} · {activeCircle.memberCount} membre{activeCircle.memberCount > 1 ? 's' : ''}
                </div>
              </div>
              <div onClick={() => setShowDetail(false)} style={{ cursor:'pointer', fontSize:18, opacity:.5, marginTop:2 }}>✕</div>
            </div>

            {/* Description */}
            {activeCircle.description && (
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8, fontStyle:'italic', marginBottom:16, padding:'10px 14px', background:'rgba(150,212,133,0.05)', borderRadius:10, border:'1px solid rgba(150,212,133,0.1)' }}>
                "{activeCircle.description}"
              </div>
            )}



            {/* Code invitation si privée et jardinier */}
            {(activeCircle.isAdmin || activeCircle.created_by === userId) && !activeCircle.is_open && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Code d'invitation</div>
                <div className="cd-invite">
                  <div className="cdi-code">{activeCircle.invite_code ?? '——'}</div>
                  <div className="cdi-copy" onClick={() => handleCopyCode(activeCircle.invite_code)}>
                    {copied ? '✓ Copié' : 'Copier'}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop:20, justifyContent:'space-between' }}>
              <button onClick={() => handleSignaler(activeCircle.id)}
                style={{ padding:'8px 14px', borderRadius:10, border:'1px solid rgba(210,80,80,0.3)', background:'rgba(210,80,80,0.08)', color:'rgba(255,140,140,0.8)', fontSize:11, cursor:'pointer' }}>
                🚩 Signaler
              </button>
              <div style={{ display:'flex', gap:8 }}>
                <button className="modal-cancel" onClick={() => setShowDetail(false)}>Fermer</button>
                {(activeCircle.isAdmin || activeCircle.created_by === userId) && (
                  <button className="modal-submit" onClick={() => { setShowDetail(false); setEditCircle(activeCircle) }}>Modifier</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Supprimer la graine 🗑️</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20, lineHeight:1.6 }}>
              Voulez-vous vraiment supprimer <b>{deleteConfirm.name}</b> ? Cette action est irréversible et supprimera tous les membres.
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="modal-submit" style={{ background:'rgba(210,80,80,0.18)', borderColor:'rgba(210,80,80,0.4)', color:'rgba(255,160,160,0.9)' }}
                onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      <Toast msg={toast} />
      <div className="content">
        <div className="col" style={{ flex:1 }}>
          <div className="slabel">Mes graines · {circles.length} actives</div>
          <div className="circles-grid">
            {circles.map(c => { const creatorName = creatorNames[c.id] ?? null; const isMine = c.isAdmin || c.created_by === userId; return (
              <div key={c.id} className={'circle-card-big' + (c.id===activeCircle?.id ? ' active-circle' : '')}
                style={{ position:'relative', padding:'14px', gap:6 }}
                onClick={() => { selectCircle(c.id); setShowDetail(true) }}>

                {/* LIGNE 1 — 7j haut gauche + badge haut droite */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  {c.expires_at ? (() => {
                    const remaining = Math.ceil((new Date(c.expires_at) - Date.now()) / 86400000)
                    return remaining > 0
                      ? <div style={{ fontSize:10, color: remaining <= 2 ? 'rgba(255,140,100,0.85)' : 'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color: remaining <= 2 ? 'rgba(255,140,100,0.9)' : 'var(--text2)' }}>{remaining}j</span>
                          Profitez-en !
                        </div>
                      : <div style={{ fontSize:10, color:'rgba(200,100,100,0.7)' }}>Expirée</div>
                  })() : <div />}
                  {isMine
                    ? <div className="ccb-badge admin">Jardinier(e)</div>
                    : <div className="ccb-badge member">🌱 {creatorName ?? '…'}</div>
                  }
                </div>

                {/* LIGNE 2 — Nom */}
                <div className="ccb-name">{c.name}</div>
                <div className="ccb-theme">{getThemeEmoji(c.theme)} {c.theme}</div>

                {/* LIGNE 3 — Membres + boutons bas droite */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {Array.from({ length: Math.min(c.memberCount, 5) }).map((_, i) => (
                      <div key={i} className="ccb-member-av" style={{ fontSize:12 }}>👤</div>
                    ))}
                    {c.memberCount > 5 && <div className="ccb-member-count">+{c.memberCount - 5}</div>}
                    <div className="ccb-member-count">{c.memberCount} membre{c.memberCount > 1 ? 's' : ''}</div>
                  </div>
                  {isMine && (
                    <div style={{ display:'flex', gap:10 }}>
                      <div title="Modifier" onClick={e => { e.stopPropagation(); setEditCircle(c) }}
                        style={{ cursor:'pointer', fontSize:13, opacity:.5, transition:'opacity .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity=1}
                        onMouseLeave={e=>e.currentTarget.style.opacity=.5}>✏️</div>
                      <div title="Supprimer" onClick={e => { e.stopPropagation(); setDeleteConfirm(c) }}
                        style={{ cursor:'pointer', fontSize:13, opacity:.4, transition:'opacity .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity=1}
                        onMouseLeave={e=>e.currentTarget.style.opacity=.4}>🗑️</div>
                    </div>
                  )}
                </div>
              </div>
            )})}
            <div className="create-circle-card" onClick={() => setShowCreate(true)}>
              <div className="ccc-icon">＋</div>
              <div className="ccc-text">Créer une graine</div>
            </div>
          </div>


        </div>

        <div className="rpanel">
          <div className="rp-section">
            <div className="rp-slabel">Rejoindre via code</div>
            <div style={{ display:'flex', gap:7, marginBottom:6 }}>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="CODE…"
                style={{ flex:1, padding:'9px 13px', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text2)', letterSpacing:'.1em', outline:'none' }}
              />
              <div
                onClick={handleJoin}
                style={{ padding:'9px 16px', background: joinLoading?'transparent':'var(--green2)', border:'1px solid var(--greenT)', borderRadius:10, fontSize:14, color:'#c8f0b8', cursor:'pointer', opacity: joinLoading?.6:1, transition:'all .2s' }}
              >{joinLoading ? '…' : '→'}</div>
            </div>
            {joinError && <div style={{ fontSize:10, color:'rgba(210,110,110,.85)', marginBottom:12, padding:'6px 10px', background:'rgba(210,110,110,.07)', borderRadius:8, border:'1px solid rgba(210,110,110,.2)' }}>{joinError}</div>}

            <div className="rp-slabel" style={{ marginTop:14 }}>Découvrir les Graines publiques</div>
            {publicCircles.length === 0
              ? <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'6px 0' }}>Aucune graine publique pour l'instant.</div>
              : publicCircles.map((c, i) => (
              <div key={c.id ?? i} style={{ marginBottom:11, padding:'11px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                  <span style={{ fontSize:17 }}>{c.emoji ?? '🌱'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'var(--text)' }}>{c.name}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{getThemeEmoji(c.theme)} {c.theme ?? '—'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{c.memberCount ?? '?'} membre{(c.memberCount ?? 0) > 1 ? 's' : ''}</div>
                  {c.is_open
                    ? <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--greenT)', color:'#c8f0b8', background:'var(--green3)', cursor:'pointer' }}
                        onClick={() => handleJoinPublic(c.invite_code)}>Rejoindre</div>
                    : <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--border)', color:'var(--text3)' }}>Sur invitation</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────
   SCREEN 4 — DÉFIS
───────────────────────────────────────── */
// DEFIS_DATA → now in Supabase via useDefi

function ProposeModal({ onClose, onSubmit }) {
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [zone, setZone]     = useState('Souffle')
  const [dur, setDur]       = useState(7)
  const [emoji, setEmoji]   = useState('🌿')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const zones = ['Souffle','Racines','Feuilles','Tige','Fleurs','Toutes']
  const durs  = [7,14,21,30]

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)
    try { await onSubmit({ title, description:desc, zone, duration_days:dur, emoji }); setSent(true); setTimeout(onClose,1800) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Proposer un défi ✨</div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🌿</div>
            <div style={{ fontSize:13, color:'rgba(150,212,133,0.9)', letterSpacing:'.04em' }}>Proposition envoyée !</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>Elle sera examinée par notre équipe.</div>
          </div>
        ) : (
          <>
            {/* Emoji picker + titre */}
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Emoji</div>
                <div
                  style={{ width:54, height:46, borderRadius:11, border:'1px solid var(--border)', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, cursor:'text', position:'relative' }}
                  onClick={() => document.getElementById('pm-emoji').focus()}
                >
                  {emoji || '🌿'}
                  <input
                    id="pm-emoji"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    style={{ position:'absolute', inset:0, opacity:0, width:'100%', cursor:'text' }}
                  />
                </div>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Nom du défi</div>
                <input
                  className="modal-input"
                  placeholder="Ex: 5 min de marche chaque matin"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width:'100%' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div className="modal-label">Description</div>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="Décris l'intention du défi…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                style={{ resize:'none', width:'100%' }}
              />
            </div>

            {/* Zone + Durée */}
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Zone</div>
                <select className="modal-input" value={zone} onChange={e => setZone(e.target.value)} style={{ width:'100%' }}>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Durée</div>
                <select className="modal-input" value={dur} onChange={e => setDur(Number(e.target.value))} style={{ width:'100%' }}>
                  {durs.map(d => <option key={d} value={d}>{d} jours</option>)}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose}>Annuler</button>
              <button className="modal-submit" onClick={handleSubmit} disabled={!title.trim() || loading}>
                {loading ? 'Envoi…' : 'Envoyer la proposition'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ZONE_COLORS = { Souffle:'#88b8e8', Racines:'#96d485', Feuilles:'#90d890', Tige:'#a8c8a0', Fleurs:'#e088a8', Toutes:'#c8a8e8' }

function ScreenDefis({ userId }) {
  const [cat, setCat] = useState('Tous')
  const [showPropose, setShowPropose] = useState(false)
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const { defis, featured, myDefis, joinedIds, communityStats, isLoading, toggleJoin, proposeDefi } = useDefi(userId)
  const filtered = cat === 'Tous'
  ? defis.filter(d => !d.is_featured)
  : defis.filter(d => d.zone === cat && !d.is_featured)
  const featuredJoined = featured ? joinedIds.has(featured.id) : false

  useEffect(() => {
    const handler = () => setShowPropose(true)
    document.addEventListener('openPropose', handler)
    return () => document.removeEventListener('openPropose', handler)
  }, [])

  return (
    <div className="content">
      {showPropose && <ProposeModal onClose={() => setShowPropose(false)} onSubmit={proposeDefi} />}
      <div className="col" style={{ flex:1 }}>
        <div className="defi-featured">
          <div className="df-glow" />
          {featured ? (
  <>
    <div className="df-tag">
      Défi communauté · {featuredJoined ? '✓ En cours' : 'Rejoins-nous'}
    </div>

    <div className="df-title">{featured.title}</div>

    <div className="df-desc">{featured.description}</div>

    <div className="df-meta">
      <div className="dfm-item"><span>📅</span> {featured.duration_days} jours</div>
      <div className="dfm-item"><span>🌿</span> {featured.zone}</div>
      <div className="dfm-item">
        <span>👥</span> {(featured.participantCount ?? 0).toLocaleString()} participants
      </div>
    </div>

    {featuredJoined && (
      <>
        <div className="df-progress">
          <div className="dfp-fill" style={{ width:(featured.progress ?? 0) + '%' }} />
        </div>
        <div className="df-progress-label">
          <span>Progression</span>
          <span>{featured.progress ?? 0}%</span>
        </div>
      </>
    )}

    <div className="df-actions">
      <div
        className={featuredJoined ? 'df-join df-join-active' : 'df-join'}
        onClick={() => toggleJoin(featured.id)}
      >
        {featuredJoined ? '✓ En cours' : 'Je rejoins'}
      </div>

      <div className="df-learn" onClick={() => setShowPropose(true)}>
        Proposer un défi
      </div>
    </div>
  </>
) : (
  <>
    {/* 🌿 CARTE INSPIRATIONNELLE */}

    <div className="df-tag">
      Inspiration du moment
    </div>

    <div className="df-title">
      🌸 Le Rituel des 5 Minutes
    </div>

    <div className="df-desc">
      Même sans défi officiel, votre jardin peut évoluer.
      Aujourd’hui, prenez 5 minutes pour respirer,
      écrire une gratitude ou simplement marcher en conscience.
    </div>

    <div className="df-meta">
      <div className="dfm-item"><span>✨</span> Micro-rituel libre</div>
      <div className="dfm-item"><span>🌿</span> Toutes zones</div>
      <div className="dfm-item"><span>🕊</span> Sans engagement</div>
    </div>

    <div className="df-actions">
      <div
  className="df-join"
  onClick={() => {
    document.querySelector('.defis-grid')?.scrollIntoView({ behavior: 'smooth' })
  }}
>
  🌱 Trouvez votre défi du jour
</div>

      <div className="df-learn" onClick={() => setShowPropose(true)}>
        Proposer un défi à la communauté
      </div>
    </div>
  </>
)}
        </div>
        {isLoading && <div style={{ fontSize:13, color:'var(--text3)', padding:'20px 0' }}>Chargement des défis…</div>}
        <div className="cat-filter">
          {cats.map(c => <div key={c} className={'cat-btn'+(cat===c?' active':'')} onClick={() => setCat(c)}>{c}</div>)}
        </div>
        <div className="slabel">{cat==='Tous'?'Tous les défis':`Zone ${cat}`} · {filtered.length} disponibles</div>
        <div className="defis-grid">
          {filtered.map((d,i) => {
            const isJoined = joinedIds.has(d.id)
            const color = ZONE_COLORS[d.zone] ?? '#96d485'
            return (
              <div key={d.id??i} className="defi-card">
                <div className="dc-top">
                  <div className="dc-emoji">{d.emoji}</div>
                  <div className="dc-info">
                    <div className="dc-title">{d.title}</div>
                    <div className="dc-zone">{d.zone}</div>
                  </div>
                  <div className="dc-dur">{d.duration_days} j</div>
                </div>
                <div className="dc-desc">{d.description}</div>
                <div className="dc-foot">
                  <div className="dc-participants">{(d.participantCount??0).toLocaleString()} pers.</div>
                  <div className="dc-bar"><div className="dc-bar-fill" style={{ width:`${d.progress??0}%`, background:color+'88' }} /></div>
                  {isJoined
                    ? <div className="dc-joined" onClick={() => toggleJoin(d.id)} style={{ cursor:'pointer' }}>✓ En cours</div>
                    : <div className="dc-join-btn" onClick={() => toggleJoin(d.id)}>Rejoindre</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Mes défis actifs</div>
          {myDefis.length === 0 && <div style={{ fontSize:12, color:'var(--text3)', padding:'8px 0' }}>Aucun défi en cours</div>}
          {myDefis.map((d,i) => (
            <div key={i} style={{ marginBottom:11, padding:'11px 13px', background:'var(--green3)', border:'1px solid rgba(150,212,133,0.18)', borderRadius:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <span style={{ fontSize:17 }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{d.title}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{d.zone} · {d.duration_days} j</div>
                </div>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.09)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${d.progress??0}%`, background:(ZONE_COLORS[d.zone]??'#96d485')+'aa', borderRadius:100 }} />
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:5, display:'flex', justifyContent:'space-between' }}>
                <span>Progression</span><span>{d.progress??0}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rp-section">
          <div className="rp-slabel">Pouls de la communauté</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>🌿</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.activeGardens}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>jardins actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✅</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.completedRituals}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>rituels complétés</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✨</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.totalDefis}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>défis actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>👥</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.totalParticipants.toLocaleString()}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>participations</div></div>
            </div>
          </div>
        </div>
        <div className="rp-section" style={{ marginTop:'auto' }}>
          <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, fontStyle:'italic' }}>
            "Ce dimanche dans mon jardin" · données en temps réel
          </div>
        </div>
      </div>
    </div>
  )
}


function ScreenJardinCollectif({ userId }) {
  return (
    <div className="content" style={{ flex:1, overflow:'hidden' }}>
      <CommunityGarden currentUserId={userId} embedded />
    </div>
  )
}

const SCREENS = [
  { id:'jardin',  icon:'🌸', label:'Ma Fleur',           badge:null, Component:ScreenMonJardin       },
  { id:'champ',   icon:'🌻', label:'Jardin Collectif',   badge:null, Component:ScreenJardinCollectif  },
  { id:'cercles', icon:'🌱', label:'Graines de vie', badge:'3',  Component:ScreenCercles          },
  { id:'cercle',  icon:'🌿', label:'Ateliers',       badge:null, Component:ScreenCercle           },
  { id:'defis',   icon:'✨', label:'Défis',          badge:null, Component:ScreenDefis            },
]

function ProfileModal({ user, onClose }) {
  const [name,    setName]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [saved,   setSaved]   = useState(false)

  // Charger le display_name depuis Supabase à l'ouverture
  useEffect(() => {
    supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name ?? '')
        setLoading(false)
      })
  }, [user.id])

  async function handleSave() {
    if (!name.trim()) { setError('Le prénom ou pseudo ne peut pas être vide.'); return }
    setSaving(true); setError(null)
    const { error: err } = await supabase
      .from('users')
      .update({ display_name: name.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        <button className="profile-modal-close" onClick={onClose}>✕</button>
        <div className="profile-modal-title">Mon profil</div>
        <div className="profile-modal-sub">Votre prénom ou pseudo visible dans les cercles.</div>
        <div className="profile-field">
          <label className="profile-label">Prénom ou pseudo</label>
          <input
            className="profile-input"
            type="text"
            value={loading ? '' : name}
            onChange={e => { setName(e.target.value); setError(null) }}
            placeholder={loading ? 'Chargement…' : 'Votre prénom ou pseudo'}
            maxLength={40}
            autoFocus={!loading}
            disabled={loading}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSave()}
          />
        </div>
        {error && <div className="profile-error">{error}</div>}
        <button className="profile-save" onClick={handleSave} disabled={saving || loading || !name.trim()}>
          {saving ? '…' : 'Sauvegarder'}
        </button>
        {saved && <div className="profile-saved">✓ Profil mis à jour</div>}
      </div>
    </div>
  )
}

function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('users')
      .select('display_name, level, xp, xp_next_level, plan, email')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('useProfile error:', error.message)
        else setProfile(data)
      })
  }, [userId])
  return profile
}

export default function DashboardPage() {
  const [pendingReports, setPendingReports] = useState(0)
  const [active, setActive] = useState('jardin')
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id)) {
      supabase.from('reports').select('*', { count:'exact', head:true }).eq('resolved', false)
        .then(({ count }) => setPendingReports(count ?? 0))
    }
  }, [user?.id])

  function refreshPendingReports() {
    supabase.from('reports').select('*', { count:'exact', head:true }).eq('resolved', false)
      .then(({ count }) => setPendingReports(count ?? 0))
  }
  const { todayPlant } = usePlant(user?.id)
  const { communityStats } = useDefi(user?.id)
  const { stats } = useCircle(user?.id)

  const profile = useProfile(user?.id)
  const { Component } = SCREENS.find(s => s.id === active)
  const { circleMembers, activeCircle } = useCircle(user?.id)

  const [showCreateCircle, setShowCreateCircle] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const topbar = {
  jardin: {
    title: <>Ma <em>Fleur</em></>,
    sub: `${todayPlant?.health ?? '—'}% · 12 jours consécutifs`,
    btn: null
  },

  champ: {
    title: <>Jardin <em>Collectif</em></>,
    sub: `${communityStats?.activeGardens?.toLocaleString() ?? '—'} jardins actifs`,
    btn: null
  },

  cercles: {
    title: <>Graines <em>de vie</em></>,
    sub: `${stats?.myCircleCount ?? 0} actifs · ${stats?.totalMembers ?? 0} membres au total`,
    btn: '+ Créer',
    onBtn: () => setShowCreateCircle(true)
  },

  cercle: {
    title: <><em>Ateliers</em></>,
    sub: `${circleMembers.length} membre${circleMembers.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'})}`,
    btn: '+ Inviter',
    onBtn: () => setShowInviteModal(true)
  },

  defis: {
    title: <><em>Défis</em></>,
    sub: `${communityStats?.totalParticipants?.toLocaleString() ?? '—'} participants`,
    btn: 'Proposer',
    onBtn: () => document.dispatchEvent(new CustomEvent('openPropose'))
  },

}[active]

  return (
    <div className="root">
      <style>{css}</style>
      <div className="app-layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sb-logo">Mon <em>Jardin</em><br />Intérieur</div>
          <div className="sb-section" style={{ marginBottom:4 }}>Navigation</div>
          {SCREENS.map(s => {
            let badgeVal = null
            if (s.id === 'jardin')  badgeVal = todayPlant?.health != null ? `${todayPlant.health}%` : null
            if (s.id === 'champ')   badgeVal = communityStats?.activeGardens != null ? communityStats.activeGardens + 1 : null
            if (s.id === 'cercles') badgeVal = stats?.myCircleCount > 0 ? stats.myCircleCount : null
            if (s.id === 'cercle')  badgeVal = circleMembers?.length > 0 ? circleMembers.length : null
            if (s.id === 'defis')   badgeVal = communityStats?.totalDefis > 0 ? communityStats.totalDefis : null
            return (
              <div key={s.id} className={'sb-item' + (active===s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
                <span className="sb-icon">{s.icon}</span>
                {s.label}
                {badgeVal != null && <div className="sb-badge">{badgeVal}</div>}
              </div>
            )
          })}
          <div className="sb-divider" />
          {/* USER CARD — cliquer pour modifier */}
          {showProfileModal && (
            <ProfileModal
              user={user}
              onClose={() => setShowProfileModal(false)}
            />
          )}
          {(() => {
            const name    = profile?.display_name ?? user?.display_name ?? null
            const email   = user?.email ?? ''
            const initial = (name ?? email).charAt(0).toUpperCase()
            const level   = profile?.level ?? 1
            const xp      = profile?.xp ?? 0
            const xpNext  = profile?.xp_next_level ?? 100
            const xpPct   = Math.min(100, Math.round((xp / xpNext) * 100))
            const plan    = profile?.plan ?? 'free'
            return (
              <div className="sb-user-card" onClick={() => setShowProfileModal(true)} title="Modifier mon profil">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="sb-user-avatar">{initial}</div>
                  <div className="sb-user-info">
                    <div className="sb-user-name">{name ?? email}</div>
                    {name && <div className="sb-user-email">{email}</div>}
                  </div>
                </div>
                <div className="sb-user-level">
                  <span className="sb-user-level-label">Niveau</span>
                  <span className="sb-user-level-val">{level}</span>
                </div>
                <div className="sb-user-xp-bar">
                  <div className="sb-user-xp-fill" style={{ width: xpPct + '%' }}/>
                </div>
              </div>
            )
          })()}
          {/* BOUTONS FOOTER */}
          <div className="sb-footer-btns">
            <div className="sb-subscribe" onClick={() => window.openAccessModal?.()}>
              <span>🌸</span> Abonnement
            </div>
            {['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id) && (
              <div className="sb-logout" style={{ color:'rgba(255,200,100,0.7)', borderColor:'rgba(255,200,100,0.2)', position:'relative' }}
                onClick={() => window.location.hash = 'admin'}>
                <span>⚙️</span> Admin
                {pendingReports > 0 && (
                  <div style={{ position:'absolute', top:-6, right:-6, background:'rgba(210,80,80,0.9)', color:'#fff', fontSize:9, fontWeight:600, minWidth:16, height:16, borderRadius:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                    {pendingReports}
                  </div>
                )}
              </div>
            )}
            <div className="sb-logout" onClick={signOut}>
              <span>⎋</span> Se déconnecter
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="tb-title">{topbar.title}</div>
            <div className="tb-subtitle">{topbar.sub}</div>
            <div style={{ flex:1 }} />
            <div className="tb-btn ghost" style={{ marginRight:5 }}>Aide</div>
            {topbar.btn && <div className="tb-btn" onClick={topbar.onBtn ?? undefined}>{topbar.btn}</div>}
            <div className="tb-notif">🔔<div className="notif-dot" /></div>
          </div>
          <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>
            <Component userId={user?.id} openCreate={showCreateCircle} onCreateClose={() => setShowCreateCircle(false)} openInvite={showInviteModal} onInviteClose={() => setShowInviteModal(false)} onReport={refreshPendingReports} />
          </div>
        </div>
      </div>
    </div>
  )
}
