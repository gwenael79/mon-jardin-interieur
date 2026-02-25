import { useState, useCallback } from "react"
import { useAuth }     from '../hooks/useAuth'
import { usePlant }    from '../hooks/usePlant'
import { useCircle }   from '../hooks/useCircle'
import { usePrivacy }  from '../hooks/usePrivacy'
import { useGestures } from '../hooks/useGestures'
import { useJournal }  from '../hooks/useJournal'
import { RITUAL_CATALOG } from '../services/ritual.service'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#090c08;--bg2:#0e1209;--bg3:#131810;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.04);
  --text:#e8e0d0;--text2:rgba(232,224,208,0.55);--text3:rgba(232,224,208,0.28);
  --green:#7aad6e;--green2:rgba(122,173,110,0.15);--green3:rgba(122,173,110,0.08);--greenT:rgba(122,173,110,0.35);
  --gold:#c8b89a;
}
body{background:var(--bg)}
.root{font-family:'Jost',sans-serif;background:var(--bg);min-height:100vh;color:var(--text)}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--greenT);border-radius:100px}
.shell{max-width:1100px;margin:0 auto;padding:32px 24px 48px;display:flex;flex-direction:column;gap:20px}
.shell-title{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:300;letter-spacing:0.3em;text-transform:uppercase;color:var(--text3);text-align:center}
.browser{background:var(--bg2);border-radius:18px;border:1.5px solid var(--border);overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.5),0 40px 100px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05)}
.browser-bar{display:flex;align-items:center;gap:14px;padding:11px 18px;background:var(--bg);border-bottom:1px solid var(--border2);flex-shrink:0}
.bdots{display:flex;gap:6px}.bdot{width:10px;height:10px;border-radius:50%}
.browser-url{flex:1;background:rgba(255,255,255,.03);border:1px solid var(--border2);border-radius:100px;padding:4px 14px;font-size:10px;color:var(--text3);letter-spacing:.05em}
.browser-user{display:flex;align-items:center;gap:7px;font-size:10px;color:var(--text3)}
.buser-av{width:22px;height:22px;border-radius:50%;background:var(--green2);border:1px solid var(--greenT);display:flex;align-items:center;justify-content:center;font-size:11px}
.app-layout{display:flex;height:640px}
.sidebar{width:210px;flex-shrink:0;border-right:1px solid var(--border2);background:rgba(0,0,0,.25);display:flex;flex-direction:column;padding:22px 0 18px}
.sb-logo{padding:0 22px 18px;font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:300;color:var(--gold);border-bottom:1px solid var(--border2);margin-bottom:14px;letter-spacing:.02em;line-height:1.4}
.sb-logo em{font-style:italic;color:var(--green)}
.sb-section{padding:0 14px 6px;font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--text3)}
.sb-item{display:flex;align-items:center;gap:10px;padding:9px 22px;font-size:11px;font-weight:300;letter-spacing:.05em;color:var(--text3);cursor:pointer;transition:all .2s;border-left:2px solid transparent;user-select:none}
.sb-item:hover{color:var(--text2);background:rgba(255,255,255,.02)}
.sb-item.active{color:#a8d4a0;background:var(--green3);border-left-color:var(--green)}
.sb-icon{font-size:14px;flex-shrink:0}
.sb-badge{margin-left:auto;min-width:16px;height:16px;background:var(--green2);border:1px solid var(--greenT);border-radius:100px;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--green);padding:0 4px}
.sb-divider{height:1px;background:var(--border2);margin:10px 22px}
.sb-plant-card{margin:8px 16px;padding:14px 12px;background:var(--green3);border:1px solid rgba(122,173,110,.12);border-radius:14px;text-align:center;cursor:pointer;transition:all .2s}
.sb-plant-card:hover{background:var(--green2)}
.spc-emoji{font-size:30px;margin-bottom:6px;display:block}
.spc-val{font-family:'Cormorant Garamond',serif;font-size:22px;color:#a8d4a0;line-height:1}
.spc-label{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-top:3px}
.sb-footer{margin-top:auto;padding:12px 22px 0;font-size:9px;color:var(--text3);line-height:1.7;letter-spacing:.04em}
.main{flex:1;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.topbar{display:flex;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid var(--border2);flex-shrink:0;background:rgba(0,0,0,.1)}
.tb-title{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:300;color:var(--gold)}
.tb-title em{font-style:italic;color:var(--green)}
.tb-subtitle{font-size:10px;color:var(--text3);letter-spacing:.06em;margin-left:10px;margin-top:2px;align-self:flex-end;padding-bottom:2px}
.tb-btn{padding:6px 16px;border-radius:100px;font-size:10px;letter-spacing:.08em;cursor:pointer;transition:all .2s;border:1px solid var(--greenT);background:var(--green2);color:#a8d4a0}
.tb-btn:hover{background:rgba(122,173,110,.25)}
.tb-btn.ghost{background:transparent;color:var(--text2);border-color:var(--border)}
.tb-notif{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;position:relative;cursor:pointer}
.notif-dot{position:absolute;top:-1px;right:-1px;width:8px;height:8px;background:var(--green);border-radius:50%;border:1.5px solid var(--bg2)}
.content{flex:1;overflow:hidden;display:flex}
.col{overflow-y:auto;padding:20px 22px;display:flex;flex-direction:column;gap:16px}
.slabel{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--text3);padding-bottom:10px;border-bottom:1px solid var(--border2)}
.rpanel{width:256px;flex-shrink:0;border-left:1px solid var(--border2);overflow-y:auto}
.rp-section{padding:18px 18px 0}
.rp-slabel{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--text3);padding-bottom:10px;border-bottom:1px solid var(--border2);margin-bottom:10px}
/* Gardens grid */
.gardens-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.gcard{background:rgba(255,255,255,.025);border:1px solid var(--border);border-radius:14px;padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:all .2s}
.gcard:hover{background:var(--green3);border-color:rgba(122,173,110,.2)}
.gcard-emoji{font-size:26px}.gcard-name{font-size:9px;letter-spacing:.08em;color:var(--text3)}
.gcard-bar{width:100%;height:2px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden}
.gcard-fill{height:100%;background:linear-gradient(90deg,#3a6a32,var(--green));border-radius:100px}
.gcard-n{font-size:8px;color:rgba(122,173,110,.6);letter-spacing:.05em}
.gcard-absent{opacity:.4}
/* Collective banner */
.collective-banner{background:rgba(170,140,210,.07);border:1px solid rgba(170,140,210,.2);border-radius:14px;padding:14px 16px}
.cb-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.cb-badge{font-size:8px;letter-spacing:.12em;text-transform:uppercase;padding:3px 9px;background:rgba(170,140,210,.15);border:1px solid rgba(170,140,210,.3);border-radius:100px;color:rgba(200,180,230,.8)}
.cb-timer{font-size:10px;color:var(--text3)}
.cb-title{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:300;color:#e0d8f0;margin-bottom:4px}
.cb-desc{font-size:10px;font-weight:300;color:var(--text2);margin-bottom:10px;line-height:1.5}
.cb-foot{display:flex;align-items:center;gap:8px}
.cb-avatars{display:flex}
.cb-av{width:20px;height:20px;border-radius:50%;background:rgba(170,140,210,.2);border:1px solid rgba(170,140,210,.3);display:flex;align-items:center;justify-content:center;font-size:10px;margin-left:-5px}
.cb-av:first-child{margin-left:0}
.cb-count{font-size:9px;color:var(--text3);margin-left:6px;flex:1}
.cb-join{padding:5px 14px;background:rgba(170,140,210,.15);border:1px solid rgba(170,140,210,.3);border-radius:100px;font-size:9px;letter-spacing:.08em;color:rgba(200,180,230,.8);cursor:pointer}
/* Activity */
.act-item{display:flex;align-items:flex-start;gap:10px}
.act-av{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--green3);border:1px solid rgba(122,173,110,.2);display:flex;align-items:center;justify-content:center;font-size:13px}
.act-body{flex:1}
.act-text{font-size:10px;font-weight:300;color:var(--text2);line-height:1.5}
.act-text b{color:var(--text);font-weight:400}
.act-time{font-size:8px;color:var(--text3);margin-top:2px;letter-spacing:.04em}
.act-zone{font-size:8px;letter-spacing:.08em;padding:2px 8px;background:var(--green3);border:1px solid rgba(122,173,110,.2);border-radius:100px;color:rgba(122,173,110,.8);flex-shrink:0;align-self:flex-start}
/* Members */
.member-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.mr-av{width:24px;height:24px;border-radius:50%;flex-shrink:0;background:var(--green3);border:1px solid rgba(122,173,110,.2);display:flex;align-items:center;justify-content:center;font-size:12px}
.mr-name{flex:1;font-size:10px;font-weight:300;color:var(--text2)}
.mr-bar{width:40px;height:2px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;flex-shrink:0}
.mr-fill{height:100%;background:var(--green);border-radius:100px}
.mr-pct{font-size:9px;color:rgba(122,173,110,.6);width:26px;text-align:right;flex-shrink:0}
.gesture-item{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:7px 10px;background:rgba(255,255,255,.02);border-radius:9px;border:1px solid var(--border2)}
.gi-emoji{font-size:14px}.gi-text{flex:1;font-size:9px;font-weight:300;color:var(--text2);line-height:1.4}
.gi-text b{color:var(--text);font-weight:400}.gi-time{font-size:8px;color:var(--text3)}
/* Mon Jardin */
.mj-layout{display:flex;flex:1;overflow:hidden}
.mj-left{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:16px}
.mj-right{width:250px;flex-shrink:0;border-left:1px solid var(--border2);overflow-y:auto;padding:20px 18px;display:flex;flex-direction:column;gap:16px}
.plant-hero{background:linear-gradient(160deg,rgba(20,30,15,.8),rgba(10,18,8,.9));border:1px solid rgba(122,173,110,.15);border-radius:18px;padding:24px;display:flex;align-items:center;gap:28px;position:relative;overflow:hidden}
.ph-glow{position:absolute;width:200px;height:200px;background:radial-gradient(circle,rgba(122,173,110,.1),transparent 70%);left:20px;top:50%;transform:translateY(-50%);pointer-events:none}
.ph-plant{position:relative;z-index:2;flex-shrink:0}
.ph-info{flex:1;z-index:2}
.ph-health{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:300;color:#a8d4a0;line-height:1;margin-bottom:2px}
.ph-health span{font-size:22px;color:var(--text3)}
.ph-label{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--text3);margin-bottom:14px}
.ph-zones{display:flex;flex-direction:column;gap:6px}
.ph-zone-row{display:flex;align-items:center;gap:8px}
.pzr-icon{font-size:11px;width:16px}.pzr-name{font-size:9px;color:var(--text3);width:56px;letter-spacing:.04em}
.pzr-bar{flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden}
.pzr-fill{height:100%;border-radius:100px;transition:width .6s ease}
.pzr-val{font-size:9px;color:var(--text3);width:28px;text-align:right}
/* Rituals */
.ritual-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ritual-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:14px;border:1px solid;cursor:pointer;transition:all .2s;user-select:none}
.ritual-btn.positive{border-color:rgba(122,173,110,.15);background:rgba(122,173,110,.05)}
.ritual-btn.positive:hover{background:rgba(122,173,110,.12);border-color:rgba(122,173,110,.3)}
.ritual-btn.negative{border-color:rgba(210,110,110,.15);background:rgba(210,110,110,.04)}
.ritual-btn.negative:hover{background:rgba(210,110,110,.1)}
.ritual-btn.done{opacity:.5;cursor:default}
.rb-emoji{font-size:20px}
.rb-name{font-size:8px;font-weight:400;color:var(--text2);text-align:center;line-height:1.3}
.rb-delta{font-size:8px;font-weight:500;margin-top:2px}
.rb-delta.pos{color:rgba(122,173,110,.8)}
.rb-delta.neg{color:rgba(210,110,110,.7)}
/* History chart */
.history-chart{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;padding:16px}
.hc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.hc-title{font-size:11px;color:var(--text2);font-weight:300;letter-spacing:.05em}
.hc-period{font-size:9px;color:var(--text3);letter-spacing:.08em}
.hc-graph{display:flex;align-items:flex-end;gap:3px;height:60px}
.hc-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end}
.hc-bar{width:100%;border-radius:3px 3px 0 0;background:rgba(122,173,110,.35);min-height:4px;transition:height .4s ease}
.hc-bar:hover{background:rgba(122,173,110,.65)}
.hc-bar.today{background:rgba(122,173,110,.7)}
.hc-day{font-size:7px;color:var(--text3)}
/* Week grid */
.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.wday{display:flex;flex-direction:column;align-items:center;gap:3px}
.wd-label{font-size:7px;color:var(--text3);letter-spacing:.06em}
.wd-dot{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:400}
.wd-dot.full{background:rgba(122,173,110,.25);color:#a8d4a0}.wd-dot.partial{background:rgba(122,173,110,.1);color:rgba(122,173,110,.5)}
.wd-dot.empty{background:rgba(255,255,255,.03);color:var(--text3)}.wd-dot.today{border:1px solid rgba(122,173,110,.4)}
/* Journal */
.journal-entry{padding:12px 14px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s}
.journal-entry:hover{background:rgba(255,255,255,.04)}
.je-date{font-size:8px;letter-spacing:.1em;color:var(--text3);text-transform:uppercase;margin-bottom:5px}
.je-text{font-size:10px;font-weight:300;color:var(--text2);line-height:1.6;font-style:italic}
.je-rituals{display:flex;gap:4px;margin-top:8px;flex-wrap:wrap}
.je-tag{font-size:8px;padding:2px 7px;border-radius:100px;background:var(--green3);border:1px solid rgba(122,173,110,.15);color:rgba(122,173,110,.7);letter-spacing:.05em}
/* Privacy */
.privacy-item{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.priv-icon{font-size:13px;flex-shrink:0}.priv-label{flex:1;font-size:10px;font-weight:300;color:var(--text2)}
.priv-toggle{width:30px;height:16px;border-radius:100px;border:1px solid;position:relative;cursor:pointer;transition:all .2s}
.priv-toggle.on{background:rgba(122,173,110,.2);border-color:var(--greenT)}.priv-toggle.off{background:rgba(255,255,255,.04);border-color:var(--border)}
.pt-knob{position:absolute;width:10px;height:10px;border-radius:50%;top:50%;transform:translateY(-50%);transition:all .2s}
.priv-toggle.on .pt-knob{right:3px;background:var(--green)}.priv-toggle.off .pt-knob{left:3px;background:rgba(255,255,255,.2)}
/* Circles */
.circles-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.circle-card-big{background:rgba(255,255,255,.025);border:1px solid var(--border);border-radius:16px;padding:16px;cursor:pointer;transition:all .2s}
.circle-card-big:hover{border-color:rgba(255,255,255,.14)}
.circle-card-big.active-circle{background:var(--green3);border-color:rgba(122,173,110,.25)}
.ccb-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
.ccb-name{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:300;color:var(--gold)}
.ccb-badge{font-size:8px;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid}
.ccb-badge.admin{color:rgba(200,180,100,.8);border-color:rgba(200,180,100,.3);background:rgba(200,180,100,.08)}
.ccb-badge.member{color:var(--text3);border-color:var(--border);background:transparent}
.ccb-theme{font-size:9px;color:var(--text3);margin-bottom:10px;font-style:italic;letter-spacing:.04em}
.ccb-members{display:flex;margin-bottom:10px}
.ccb-member-av{width:24px;height:24px;border-radius:50%;flex-shrink:0;background:var(--green3);border:1.5px solid var(--bg3);display:flex;align-items:center;justify-content:center;font-size:12px;margin-left:-6px}
.ccb-member-av:first-child{margin-left:0}
.ccb-member-count{font-size:9px;color:var(--text3);margin-left:8px;align-self:center}
.ccb-stats{display:flex;gap:12px}
.ccbs-item{display:flex;flex-direction:column;gap:2px}
.ccbs-val{font-size:14px;font-family:'Cormorant Garamond',serif;color:var(--text)}
.ccbs-lbl{font-size:8px;color:var(--text3);letter-spacing:.06em}
.create-circle-card{background:rgba(255,255,255,.015);border:1px dashed rgba(255,255,255,.1);border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:all .2s;min-height:140px}
.create-circle-card:hover{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.18)}
.ccc-icon{font-size:24px;color:var(--text3)}.ccc-text{font-size:10px;color:var(--text3);letter-spacing:.06em;text-align:center;line-height:1.5}
.circle-detail{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.cd-header{padding:14px 16px;background:rgba(122,173,110,.06);border-bottom:1px solid var(--border2)}
.cd-title{font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--gold);margin-bottom:3px}
.cd-meta{font-size:9px;color:var(--text3);letter-spacing:.05em}
.cd-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.cd-invite{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:10px;border:1px solid var(--border)}
.cdi-code{flex:1;font-size:13px;letter-spacing:.2em;color:var(--text2);font-family:monospace}
.cdi-copy{font-size:9px;letter-spacing:.08em;padding:4px 10px;border-radius:100px;background:var(--green2);border:1px solid var(--greenT);color:#a8d4a0;cursor:pointer}
.cd-setting{display:flex;align-items:center;justify-content:space-between}
.cds-label{font-size:10px;font-weight:300;color:var(--text2)}.cds-val{font-size:10px;color:var(--text3)}
/* Defis */
.defi-featured{background:linear-gradient(135deg,rgba(80,50,120,.2),rgba(30,60,40,.3));border:1px solid rgba(150,120,200,.2);border-radius:18px;padding:22px 24px;position:relative;overflow:hidden}
.df-glow{position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(150,120,200,.1),transparent 60%);right:-50px;top:-80px;pointer-events:none}
.df-tag{font-size:8px;letter-spacing:.18em;text-transform:uppercase;padding:3px 10px;border-radius:100px;background:rgba(150,120,200,.15);border:1px solid rgba(150,120,200,.3);color:rgba(190,170,230,.8);display:inline-block;margin-bottom:10px}
.df-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;color:#e8e0f8;margin-bottom:6px;line-height:1.2}
.df-desc{font-size:11px;font-weight:300;color:var(--text2);margin-bottom:16px;line-height:1.6;max-width:400px}
.df-meta{display:flex;align-items:center;gap:16px;margin-bottom:16px}
.dfm-item{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text3)}
.df-progress{height:4px;background:rgba(255,255,255,.07);border-radius:100px;overflow:hidden;margin-bottom:10px;width:100%}
.dfp-fill{height:100%;background:linear-gradient(90deg,rgba(100,70,160,.8),rgba(150,120,200,.8));border-radius:100px}
.df-progress-label{font-size:9px;color:var(--text3);display:flex;justify-content:space-between}
.df-actions{display:flex;gap:10px;margin-top:14px}
.df-join{padding:9px 24px;background:rgba(150,120,200,.2);border:1px solid rgba(150,120,200,.4);border-radius:100px;font-size:11px;letter-spacing:.08em;color:rgba(200,180,230,.9);cursor:pointer}
.df-learn{padding:9px 20px;border:1px solid var(--border);border-radius:100px;font-size:11px;letter-spacing:.08em;color:var(--text3);cursor:pointer}
.defis-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.defi-card{background:rgba(255,255,255,.025);border:1px solid var(--border);border-radius:14px;padding:14px 14px 12px;cursor:pointer;transition:all .2s}
.defi-card:hover{border-color:rgba(255,255,255,.14)}
.dc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.dc-emoji{font-size:22px;flex-shrink:0}.dc-info{flex:1}
.dc-title{font-size:12px;font-weight:400;color:var(--text);margin-bottom:3px}
.dc-zone{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.dc-dur{font-size:9px;color:var(--text3);flex-shrink:0}
.dc-desc{font-size:9px;font-weight:300;color:var(--text2);line-height:1.5;margin-bottom:10px}
.dc-foot{display:flex;align-items:center;justify-content:space-between}
.dc-participants{font-size:9px;color:rgba(122,173,110,.6)}
.dc-bar{flex:1;height:2px;background:rgba(255,255,255,.05);border-radius:100px;overflow:hidden;margin:0 10px}
.dc-bar-fill{height:100%;border-radius:100px}
.dc-joined{font-size:8px;padding:2px 8px;border-radius:100px;border:1px solid rgba(122,173,110,.3);color:rgba(122,173,110,.8);background:var(--green3)}
.dc-join-btn{font-size:8px;padding:2px 8px;border-radius:100px;border:1px solid var(--border);color:var(--text3);cursor:pointer}
.cat-filter{display:flex;gap:6px;flex-wrap:wrap}
.cat-btn{padding:5px 14px;border-radius:100px;font-size:9px;letter-spacing:.08em;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text3);transition:all .2s}
.cat-btn.active{background:var(--green2);border-color:var(--greenT);color:#a8d4a0}
.community-pulse{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;padding:14px}
.cp-title{font-size:10px;color:var(--text2);margin-bottom:12px;font-weight:300}
.cp-stat{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.cps-icon{font-size:16px}.cps-info{flex:1}
.cps-val{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--text);line-height:1}
.cps-lbl{font-size:8px;color:var(--text3);letter-spacing:.06em;margin-top:1px}
`;

// ─── PLANT SVG ────────────────────────────────────────────
function PlantSVG({ health = 72, w = 90, h = 100 }) {
  const r = health / 100;
  return (
    <svg width={w} height={h} viewBox="0 0 90 100" fill="none">
      <ellipse cx="45" cy="93" rx="18" ry="4" fill="rgba(100,60,30,0.25)" />
      <path d="M29 93 Q27 81 30 79 H60 Q63 81 61 93 Z" fill="#7a4a2a" opacity="0.7" />
      <rect x="28" y="76" width="34" height="5" rx="1.5" fill="#8a5535" />
      <ellipse cx="45" cy="80" rx="15" ry="4" fill="#2d1f12" opacity={0.9 * r + 0.1} />
      <path d={`M45 ${79 - 32 * r} Q42 ${68 - 18 * r} 45 ${79 - 6 * r}`}
        stroke={`rgba(60,${100 + 40 * r},40,${0.4 + 0.6 * r})`}
        strokeWidth={1.5 + r} strokeLinecap="round" fill="none" />
      {r > 0.2 && <ellipse cx="37" cy={68 - 12 * r} rx={9 * r} ry={4.5 * r}
        fill={`rgba(35,${70 + 70 * r},25,${0.55 + 0.35 * r})`}
        transform={`rotate(-30,37,${68 - 12 * r})`} />}
      {r > 0.3 && <ellipse cx="53" cy={62 - 16 * r} rx={10 * r} ry={5 * r}
        fill={`rgba(40,${75 + 65 * r},30,${0.55 + 0.35 * r})`}
        transform={`rotate(25,53,${62 - 16 * r})`} />}
      {r > 0.45 && [0,60,120,180,240,300].map((a, i) => (
        <ellipse key={i}
          cx={45 + Math.cos(a * Math.PI / 180) * (5 * r)}
          cy={(79 - 32 * r) + Math.sin(a * Math.PI / 180) * (5 * r)}
          rx={3.5 * r} ry={2 * r}
          fill={`rgba(${190 - 30 * r},${70 + 70 * r},${90 + 50 * r},${0.5 + 0.4 * r})`}
          transform={`rotate(${a},${45 + Math.cos(a * Math.PI / 180) * 5 * r},${(79 - 32 * r) + Math.sin(a * Math.PI / 180) * 5 * r})`}
        />
      ))}
      {r > 0.45 && <circle cx="45" cy={79 - 32 * r} r={3 * r} fill={`rgba(240,${170 + 50 * r},90,${0.7 + 0.3 * r})`} />}
      {r > 0.65 && <circle cx="45" cy={79 - 32 * r} r={14 * r} fill={`rgba(122,173,110,${0.05 * r})`} />}
    </svg>
  );
}

// ─── HELPERS ──────────────────────────────────────────────
const MEMBER_EMOJIS = { Marie:'🌸', Lucas:'🌿', Sofia:'🌾', Paul:'🌱', Léa:'🌺', Tom:'🍃' }
const memberEmoji = (name) => MEMBER_EMOJIS[name] ?? '🌿'

const GESTURE_EMOJI = { water:'💧', sun:'☀️', seed:'🌱' }
const GESTURE_LABEL = { water:'une goutte', sun:'un rayon', seed:'une graine' }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  if (m < 1440) return `il y a ${Math.floor(m / 60)}h`
  return 'hier'
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { weekday:'short', day:'numeric', month:'short' }).format(new Date(iso))
}

// ─── ZONE CONFIG ──────────────────────────────────────────
const ZONES = [
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'#7aad6e' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'#6aad74' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'#5ab468' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'#d07090' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'#80a8d0' },
]

// ─── SCREEN 1 — CERCLE DU MATIN ───────────────────────────
function ScreenCercle({ userId }) {
  const { circleMembers, activeCircle } = useCircle(userId)
  const { received } = useGestures(userId)

  const ACTIVITY = [
    { name:'Léa',   action:'a complété',          ritual:'Respiration consciente', zone:'Souffle', t: new Date(Date.now()-480000).toISOString() },
    { name:'Marie', action:'a envoyé ☀️ à Lucas', ritual:'',                       zone:'',        t: new Date(Date.now()-1320000).toISOString() },
    { name:'Lucas', action:'a complété',           ritual:'Bouger mon corps',       zone:'Tige',    t: new Date(Date.now()-2400000).toISOString() },
    { name:'Paul',  action:'a complété',           ritual:'5 min de centrage',      zone:'Racines', t: new Date(Date.now()-3600000).toISOString() },
  ]

  const UPCOMING = [
    { e:'🌬️', t:'Silence partagé',    d:'Ce soir 21h',    n:14 },
    { e:'🌱',  t:'Semaine Racines',    d:'Lun. – 7 jours', n:8  },
    { e:'🍃',  t:'5 min d\'étirements',d:'Demain 7h30',    n:5  },
  ]

  return (
    <div className="content">
      <div className="col" style={{ flex:1 }}>
        <div className="slabel">
          Jardins du cercle — {activeCircle?.name ?? 'Cercle'} · Aujourd'hui
        </div>

        {/* Grille jardins — données réelles via circleMembers */}
        <div className="gardens-grid">
          {circleMembers.map(m => {
            const name  = m.user?.display_name ?? m.user?.email ?? '?'
            const plant = m.todayPlant
            const ritualCount = 0 // à brancher sur rituels réels
            return (
              <div key={m.userId} className={`gcard${!plant ? ' gcard-absent' : ''}`}>
                <div className="gcard-emoji">{memberEmoji(name)}</div>
                <div className="gcard-name">{name}</div>
                <div className="gcard-bar">
                  <div className="gcard-fill" style={{ width:`${plant?.health ?? 0}%` }} />
                </div>
                <div className="gcard-n">
                  {plant ? `${plant.health}%` : 'Pas encore là'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Collectif */}
        <div className="collective-banner">
          <div className="cb-top">
            <span className="cb-badge">Collectif · Ce soir</span>
            <span className="cb-timer">dans 3h 42min</span>
          </div>
          <div className="cb-title">Instant de silence partagé — 21h</div>
          <div className="cb-desc">5 minutes de silence conscient, ensemble à distance. Chacun dans son jardin, chacun présent.</div>
          <div className="cb-foot">
            <div className="cb-avatars">
              {['🌸','🌿','🌾','🌱'].map((e,i) => <div key={i} className="cb-av">{e}</div>)}
            </div>
            <span className="cb-count">14 participants inscrits</span>
            <div className="cb-join">Rejoindre</div>
          </div>
        </div>

        {/* Activité */}
        <div className="slabel">Activité récente</div>
        {ACTIVITY.map((a, i) => (
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

      {/* Panel droit */}
      <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Membres · {circleMembers.length}</div>
          {circleMembers.map(m => {
            const name = m.user?.display_name ?? '?'
            const h    = m.todayPlant?.health ?? 0
            return (
              <div key={m.userId} className="member-row">
                <div className="mr-av">{memberEmoji(name)}</div>
                <div className="mr-name">{name}</div>
                <div className="mr-bar"><div className="mr-fill" style={{ width:`${h}%` }} /></div>
                <div className="mr-pct">{h}%</div>
              </div>
            )
          })}
        </div>

        {/* Gestes reçus — données réelles */}
        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Gestes reçus</div>
          {received.map(g => (
            <div key={g.id} className="gesture-item">
              <div className="gi-emoji">{GESTURE_EMOJI[g.type]}</div>
              <div className="gi-text">
                <b>{g.users?.display_name ?? '?'}</b> t'a envoyé {GESTURE_LABEL[g.type]}
              </div>
              <div className="gi-time">{timeAgo(g.created_at)}</div>
            </div>
          ))}
        </div>

        <div className="rp-section" style={{ marginTop:16 }}>
          <div className="rp-slabel">Prochains collectifs</div>
          {UPCOMING.map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 8px', background:'rgba(255,255,255,.02)', borderRadius:9, border:'1px solid var(--border2)' }}>
              <span style={{ fontSize:14 }}>{r.e}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'var(--text2)' }}>{r.t}</div>
                <div style={{ fontSize:8, color:'var(--text3)', marginTop:1 }}>{r.d} · {r.n} pers.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 — MON JARDIN ────────────────────────────────
function ScreenMonJardin({ userId }) {
  const { todayPlant, history, weekGrid, stats, todayRituals, isLoading, error, completeRitual } = usePlant(userId)
  const { settings, toggle } = usePrivacy(userId)
  const { entries } = useJournal(userId)

  const PRIVACY_FIELDS = [
    { field:'show_health',      icon:'💚', label:'Vitalité globale' },
    { field:'show_rituals',     icon:'🌿', label:'Rituels complétés' },
    { field:'show_zone_scores', icon:'📊', label:'Scores par zone' },
    { field:'show_quiz_answers',icon:'📝', label:'Réponses au quiz' },
    { field:'show_journal',     icon:'📓', label:'Journal personnel' },
  ]

  const doneRitualIds = new Set(todayRituals.map(r => {
    const cat = RITUAL_CATALOG.find(c => c.name === r.name)
    return cat?.id
  }))

  if (isLoading) return (
    <div className="mj-layout" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'.1em' }}>Votre jardin se réveille…</div>
    </div>
  )

  if (error) return (
    <div className="mj-layout" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:11, color:'rgba(210,110,110,.7)' }}>{error}</div>
    </div>
  )

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long' }).format(new Date())

  return (
    <div className="mj-layout">
      <div className="mj-left">

        {/* Hero plante — données réelles */}
        <div className="plant-hero">
          <div className="ph-glow" />
          <div className="ph-plant">
            <PlantSVG health={todayPlant?.health ?? 50} w={90} h={100} />
          </div>
          <div className="ph-info">
            <div className="ph-health">
              {todayPlant?.health ?? '—'} <span>%</span>
            </div>
            <div className="ph-label">Vitalité · {todayLabel}</div>
            <div className="ph-zones">
              {ZONES.map(z => {
                const val = todayPlant?.[z.key] ?? 50
                return (
                  <div key={z.key} className="ph-zone-row">
                    <div className="pzr-icon">{z.icon}</div>
                    <div className="pzr-name">{z.name}</div>
                    <div className="pzr-bar">
                      <div className="pzr-fill" style={{ width:`${val}%`, background: z.color + '99' }} />
                    </div>
                    <div className="pzr-val">{val}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rituels interactifs — branchés sur completeRitual */}
        <div className="slabel">Rituels du jour</div>
        <div className="ritual-grid">
          {RITUAL_CATALOG.map(r => {
            const done = doneRitualIds.has(r.id)
            return (
              <div
                key={r.id}
                className={`ritual-btn ${r.delta > 0 ? 'positive' : 'negative'}${done ? ' done' : ''}`}
                onClick={() => !done && completeRitual(r.id)}
                title={done ? 'Déjà complété aujourd\'hui' : ''}
              >
                <span className="rb-emoji">{done ? '✅' : r.emoji}</span>
                <span className="rb-name">{r.name}</span>
                <span className={`rb-delta ${r.delta > 0 ? 'pos' : 'neg'}`}>
                  {r.delta > 0 ? `+${r.delta}` : r.delta}
                </span>
              </div>
            )
          })}
        </div>

        {/* Graphe historique — données réelles */}
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
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'short' }).slice(0,1).toUpperCase()
              return (
                <div key={i} className="hc-bar-wrap">
                  <div className={`hc-bar${isToday ? ' today' : ''}`} style={{ height:`${d.health}%` }} />
                  <div className="hc-day">{dayLabel}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grille rituelle hebdomadaire — données réelles */}
        <div className="slabel">Rituels cette semaine</div>
        <div className="week-grid">
          {weekGrid.map((d, i) => (
            <div key={i} className="wday">
              <div className={`wd-dot ${d.status}${d.isToday ? ' today' : ''}`}>
                {d.count || '–'}
              </div>
              <div className="wd-label">{d.label}</div>
            </div>
          ))}
        </div>

        {/* Journal — données réelles */}
        <div className="slabel">Journal personnel</div>
        {entries.map(e => (
          <div key={e.id} className="journal-entry">
            <div className="je-date">{formatDate(e.created_at)}</div>
            <div className="je-text">"{e.content}"</div>
            <div className="je-rituals">
              {(e.zone_tags ?? []).map(t => <div key={t} className="je-tag">{t}</div>)}
            </div>
          </div>
        ))}
      </div>

      {/* Panel droit */}
      <div className="mj-right">
        <div className="slabel">Confidentialité</div>
        <div style={{ fontSize:9, color:'var(--text3)', lineHeight:1.6, marginBottom:10 }}>
          Ce que vos cercles peuvent voir de vous.
        </div>

        {/* Toggles — branchés sur usePrivacy */}
        {PRIVACY_FIELDS.map(p => (
          <div key={p.field} className="privacy-item">
            <div className="priv-icon">{p.icon}</div>
            <div className="priv-label">{p.label}</div>
            <div
              className={`priv-toggle ${settings?.[p.field] ? 'on' : 'off'}`}
              onClick={() => toggle(p.field)}
            >
              <div className="pt-knob" />
            </div>
          </div>
        ))}

        {/* Stats — données réelles */}
        <div className="slabel" style={{ marginTop:8 }}>Statistiques</div>
        {[
          { label:'Jours consécutifs',   val: stats ? `${stats.streak} 🔥` : '—' },
          { label:'Rituels ce mois',     val: stats?.ritualsThisMonth ?? '—'   },
          { label:'Zone la plus active', val: stats?.favoriteZone ?? '—'       },
          { label:'Cercles actifs',      val: '2'                               },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:10, color:'var(--text2)', fontWeight:300 }}>{s.label}</div>
            <div style={{ fontSize:12, color:'var(--text)', fontFamily:"'Cormorant Garamond', serif" }}>{s.val}</div>
          </div>
        ))}

        <div className="slabel" style={{ marginTop:8 }}>Exporter</div>
        {['Journal PDF','Données CSV','Partager le bilan'].map((e, i) => (
          <div key={i} style={{ padding:'7px 12px', background:'rgba(255,255,255,.02)', border:'1px solid var(--border)', borderRadius:9, fontSize:10, color:'var(--text2)', cursor:'pointer', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12 }}>📄</span>{e}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 3 — CERCLES ───────────────────────────────────
function ScreenCercles({ userId }) {
  const { circles, activeCircle, isLoading } = useCircle(userId)
  const [joinCode, setJoinCode] = useState('')

  const CIRCLE_EMOJIS = ['🌸','🌿','🌾','🌱','🌺','🍃','🌼','🌷','🌻']

  return (
    <div className="content">
      <div className="col" style={{ flex:1 }}>
        <div className="slabel">Mes cercles · {circles.length} actifs</div>

        {/* Grille cercles — données réelles */}
        <div className="circles-grid">
          {circles.map((c, ci) => (
            <div key={c.id} className={`circle-card-big${c.id === activeCircle?.id ? ' active-circle' : ''}`}>
              <div className="ccb-top">
                <div className="ccb-name">{c.name}</div>
                <div className={`ccb-badge ${c.isAdmin ? 'admin' : 'member'}`}>
                  {c.isAdmin ? 'Admin' : 'Membre'}
                </div>
              </div>
              <div className="ccb-theme">{c.theme}</div>
              <div className="ccb-members">
                {CIRCLE_EMOJIS.slice(0, c.memberCount).map((e, i) => (
                  <div key={i} className="ccb-member-av">{e}</div>
                ))}
                <div className="ccb-member-count">{c.memberCount} membres</div>
              </div>
              <div className="ccb-stats">
                <div className="ccbs-item">
                  <div className="ccbs-val">—</div>
                  <div className="ccbs-lbl">rituels ce mois</div>
                </div>
                <div className="ccbs-item">
                  <div className="ccbs-val">
                    {Math.floor((Date.now() - new Date(c.created_at ?? Date.now()).getTime()) / 86400000)}
                  </div>
                  <div className="ccbs-lbl">jours ensemble</div>
                </div>
              </div>
            </div>
          ))}
          <div className="create-circle-card">
            <div className="ccc-icon">＋</div>
            <div className="ccc-text">Créer un cercle<br />ou rejoindre via code</div>
          </div>
        </div>

        {/* Détail cercle actif */}
        {activeCircle && (
          <>
            <div className="slabel" style={{ marginTop:4 }}>Détail — {activeCircle.name}</div>
            <div className="circle-detail">
              <div className="cd-header">
                <div className="cd-title">{activeCircle.name} · {activeCircle.isAdmin ? 'Admin' : 'Membre'}</div>
                <div className="cd-meta">
                  {activeCircle.memberCount} membres · {activeCircle.theme}
                </div>
              </div>
              <div className="cd-body">
                {activeCircle.isAdmin && (
                  <>
                    <div style={{ fontSize:8, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>
                      Code d'invitation
                    </div>
                    <div className="cd-invite">
                      <div className="cdi-code">{activeCircle.invite_code ?? '——'}</div>
                      <div className="cdi-copy" onClick={() => navigator.clipboard?.writeText(activeCircle.invite_code ?? '')}>
                        Copier
                      </div>
                    </div>
                    <div style={{ height:1, background:'var(--border2)', margin:'8px 0' }} />
                  </>
                )}
                {[
                  { l:'Thème',        v: activeCircle.theme ?? '—'        },
                  { l:'Visibilité',   v: activeCircle.is_open ? 'Public' : 'Sur invitation' },
                  { l:'Capacité',     v: `${activeCircle.memberCount}/${activeCircle.max_members ?? 8}` },
                ].map((s, i) => (
                  <div key={i} className="cd-setting">
                    <div className="cds-label">{s.l}</div>
                    <div className="cds-val">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Rejoindre via code</div>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CODE…"
              style={{ flex:1, padding:'7px 12px', background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:9, fontSize:10, color:'var(--text2)', letterSpacing:'.1em', outline:'none' }}
            />
            <div style={{ padding:'7px 14px', background:'var(--green2)', border:'1px solid var(--greenT)', borderRadius:9, fontSize:10, color:'#a8d4a0', cursor:'pointer' }}>→</div>
          </div>
          <div className="rp-slabel">Découvrir</div>
          {[
            { e:'🌙', n:'Rituels du Soir',  m:5, theme:'Décompression & sommeil', open:true  },
            { e:'🧘', n:'Mindful & Souffle', m:7, theme:'Méditation profonde',    open:false },
            { e:'🌿', n:'Nature & Corps',    m:4, theme:'Plein air & mouvement',  open:true  },
          ].map((c, i) => (
            <div key={i} style={{ marginBottom:10, padding:'10px 12px', background:'rgba(255,255,255,.02)', border:'1px solid var(--border)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <span style={{ fontSize:16 }}>{c.e}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--text)' }}>{c.n}</div>
                  <div style={{ fontSize:8, color:'var(--text3)', marginTop:1 }}>{c.theme}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:9, color:'var(--text3)' }}>{c.m} membres</div>
                {c.open
                  ? <div style={{ fontSize:8, padding:'2px 8px', borderRadius:100, border:'1px solid var(--greenT)', color:'#a8d4a0', background:'var(--green3)', cursor:'pointer' }}>Rejoindre</div>
                  : <div style={{ fontSize:8, padding:'2px 8px', borderRadius:100, border:'1px solid var(--border)', color:'var(--text3)' }}>Sur invitation</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 4 — DÉFIS ─────────────────────────────────────
const DEFIS_DATA = [
  { e:'🌬️', t:'7 jours de silence matinal',  zone:'Souffle',  dur:'7 jours',  desc:'5 min de silence conscient chaque matin, avant tout écran.',             p:1847, joined:true,  fill:72, color:'#80a8d0' },
  { e:'🌱',  t:'Semaine Racines',              zone:'Racines',  dur:'7 jours',  desc:'Centrage quotidien, repas conscient, coucher avant minuit.',              p:934,  joined:false, fill:45, color:'#7aad6e' },
  { e:'💧',  t:'21 jours de gratitude',        zone:'Feuilles', dur:'21 jours', desc:'3 nouvelles gratitudes spécifiques chaque soir.',                        p:3201, joined:false, fill:58, color:'#90c890' },
  { e:'🌸',  t:'Mois sans réseaux le matin',   zone:'Souffle',  dur:'30 jours', desc:'Pas de réseaux sociaux dans la première heure du matin.',                p:612,  joined:true,  fill:81, color:'#d07090' },
  { e:'🧘',  t:'14 jours de respiration',      zone:'Tige',     dur:'14 jours', desc:'Cohérence cardiaque 5 min, chaque matin et chaque soir.',                p:1103, joined:false, fill:33, color:'#a8c8a0' },
  { e:'🌙',  t:'Rituel du coucher — 30 jours', zone:'Racines',  dur:'30 jours', desc:'Téléphone coupé à 22h, décompression avant minuit.',                    p:788,  joined:false, fill:19, color:'#8890d0' },
]

function ScreenDefis({ userId }) {
  const [cat, setCat] = useState('Tous')
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const filtered = cat === 'Tous' ? DEFIS_DATA : DEFIS_DATA.filter(d => d.zone === cat)

  return (
    <div className="content">
      <div className="col" style={{ flex:1 }}>
        <div className="defi-featured">
          <div className="df-glow" />
          <div className="df-tag">Défi communauté · En cours</div>
          <div className="df-title">30 jours pour se retrouver</div>
          <div className="df-desc">Un rituel par jour, choisi librement dans l'une des 5 zones. Pas de classement. Pas de pression. Juste la régularité et la présence à soi.</div>
          <div className="df-meta">
            <div className="dfm-item"><span>📅</span> 30 jours</div>
            <div className="dfm-item"><span>🌿</span> Toutes zones</div>
            <div className="dfm-item"><span>👥</span> 8 432 participants</div>
          </div>
          <div className="df-progress"><div className="dfp-fill" style={{ width:'61%' }} /></div>
          <div className="df-progress-label"><span>Démarré le 1er fév.</span><span>61% · Jour 18/30</span></div>
          <div className="df-actions">
            <div className="df-join">Je rejoins</div>
            <div className="df-learn">En savoir plus</div>
          </div>
        </div>

        <div className="cat-filter">
          {cats.map(c => (
            <div key={c} className={`cat-btn${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</div>
          ))}
        </div>

        <div className="slabel">{cat === 'Tous' ? 'Tous les défis' : `Zone ${cat}`} · {filtered.length} disponibles</div>

        <div className="defis-grid">
          {filtered.map((d, i) => (
            <div key={i} className="defi-card">
              <div className="dc-top">
                <div className="dc-emoji">{d.e}</div>
                <div className="dc-info">
                  <div className="dc-title">{d.t}</div>
                  <div className="dc-zone">{d.zone}</div>
                </div>
                <div className="dc-dur">{d.dur}</div>
              </div>
              <div className="dc-desc">{d.desc}</div>
              <div className="dc-foot">
                <div className="dc-participants">{d.p.toLocaleString()} pers.</div>
                <div className="dc-bar"><div className="dc-bar-fill" style={{ width:`${d.fill}%`, background:d.color+'88' }} /></div>
                {d.joined
                  ? <div className="dc-joined">✓ En cours</div>
                  : <div className="dc-join-btn">Rejoindre</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rpanel">
        <div className="rp-section">
          <div className="rp-slabel">Mes défis actifs</div>
          {DEFIS_DATA.filter(d => d.joined).map((d, i) => (
            <div key={i} style={{ marginBottom:10, padding:'10px 12px', background:'var(--green3)', border:'1px solid rgba(122,173,110,.15)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{d.e}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'var(--text)' }}>{d.t}</div>
                  <div style={{ fontSize:8, color:'var(--text3)', marginTop:1 }}>{d.zone} · {d.dur}</div>
                </div>
              </div>
              <div style={{ height:2, background:'rgba(255,255,255,.06)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${d.fill}%`, background:d.color+'aa', borderRadius:100 }} />
              </div>
              <div style={{ fontSize:8, color:'var(--text3)', marginTop:4, display:'flex', justifyContent:'space-between' }}>
                <span>Progression</span><span>{d.fill}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rp-section" style={{ marginTop:8 }}>
          <div className="rp-slabel">Pouls de la communauté</div>
          <div className="community-pulse">
            <div className="cp-title">Ce dimanche dans Mon Jardin</div>
            {[
              { icon:'🌿', val:'12 483', lbl:'jardins actifs' },
              { icon:'✅', val:'47 291', lbl:'rituels complétés' },
              { icon:'💧', val:'8 904',  lbl:'gestes de soin' },
              { icon:'✨', val:'341',    lbl:'nouveaux défis' },
            ].map((s, i) => (
              <div key={i} className="cp-stat">
                <div className="cps-icon">{s.icon}</div>
                <div className="cps-info">
                  <div className="cps-val">{s.val}</div>
                  <div className="cps-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
const SCREENS = [
  { id:'cercle',  icon:'🏠', label:'Cercle',     badge:null, Component: ScreenCercle    },
  { id:'jardin',  icon:'🌿', label:'Mon Jardin', badge:null, Component: ScreenMonJardin },
  { id:'cercles', icon:'👥', label:'Cercles',    badge:'3',  Component: ScreenCercles   },
  { id:'defis',   icon:'✨', label:'Défis',      badge:'2',  Component: ScreenDefis     },
]

export default function DashboardPage() {
  const [active, setActive] = useState('cercle')
 const { user } = useAuth()  // → remplacer par: const { user } = useAuth()
  const { todayPlant } = usePlant(user?.id)

  const { Component } = SCREENS.find(s => s.id === active)

  const topbar = {
    cercle:  { title: <>Cercle <em>du Matin</em></>,     sub:`6 membres · ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'})}`, btn:'+ Inviter' },
    jardin:  { title: <>Mon <em>Jardin</em></>,           sub:`${todayPlant?.health ?? '—'}% · 12 jours consécutifs`, btn:'Exporter'  },
    cercles: { title: <>Mes <em>Cercles</em></>,          sub:'3 actifs · 13 membres au total',   btn:'Créer'     },
    defis:   { title: <>Défis & <em>Challenges</em></>,   sub:'2 en cours · 8 432 participants',  btn:'Proposer'  },
  }[active]

  return (
    <div className="root">
      <style>{css}</style>
      <div className="shell">
        <div className="shell-title">Mon Jardin Intérieur — Live · Supabase</div>
        <div className="browser">
          <div className="browser-bar">
            <div className="bdots">
              <div className="bdot" style={{ background:'#ff5f57' }} />
              <div className="bdot" style={{ background:'#febc2e' }} />
              <div className="bdot" style={{ background:'#28c840' }} />
            </div>
            <div className="browser-url">jardininterieur.app / {active}</div>
            <div className="browser-user">
              <div className="buser-av">🌸</div>
              {user?.display_name ?? 'Emma'}
            </div>
          </div>

          <div className="app-layout">
            <div className="sidebar">
              <div className="sb-logo">Mon <em>Jardin</em><br />Intérieur</div>
              <div className="sb-section" style={{ marginBottom:4 }}>Navigation</div>
              {SCREENS.map(s => (
                <div key={s.id}
                  className={`sb-item${active === s.id ? ' active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <span className="sb-icon">{s.icon}</span>
                  {s.label}
                  {s.badge && <div className="sb-badge">{s.badge}</div>}
                </div>
              ))}
              <div className="sb-divider" />
              <div className="sb-plant-card" onClick={() => setActive('jardin')}>
                <span className="spc-emoji">🌸</span>
                <div className="spc-val">{todayPlant?.health ?? '—'}%</div>
                <div className="spc-label">Mon jardin · aujourd'hui</div>
              </div>
              <div className="sb-footer">
                {user?.display_name ?? 'Emma'}<br />
                Niveau 2 · 18 rituels / semaine
              </div>
            </div>

            <div className="main">
              <div className="topbar">
                <div className="tb-title">{topbar.title}</div>
                <div className="tb-subtitle">{topbar.sub}</div>
                <div style={{ flex:1 }} />
                <div className="tb-btn ghost" style={{ marginRight:4 }}>Aide</div>
                <div className="tb-btn">{topbar.btn}</div>
                <div className="tb-notif">🔔<div className="notif-dot" /></div>
              </div>
              <Component userId={user?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
