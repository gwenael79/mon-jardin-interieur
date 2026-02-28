import { useState, useEffect } from 'react'
import { DUR_LABELS, DUR_DAYS } from '../hooks/useSubscription'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Epilogue:wght@300;400;500;600&display=swap');

.sd-wrap { font-family: 'Epilogue', sans-serif; }

.sd-header { text-align:center; margin-bottom:28px; }
.sd-header h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px,4vw,36px); font-weight:300;
  color: #e2ddd3; margin-bottom:8px;
}
.sd-header p { font-size:13.5px; color:rgba(226,221,211,0.5); }
.sd-manage-btn {
  display:inline-flex; align-items:center; gap:8px;
  margin-top:14px; padding:10px 22px;
  border:1px solid rgba(255,255,255,0.12); border-radius:30px;
  background:none; color:#e2ddd3; font-family:'Epilogue',sans-serif;
  font-size:13px; font-weight:500; cursor:pointer; transition:all .25s;
}
.sd-manage-btn:hover { background:rgba(168,224,64,0.08); border-color:rgba(168,224,64,0.3); color:#a8e040; }

.sd-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:14px;
}

.sd-card {
  background: #0e1a0c;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius:14px; padding:20px;
  position:relative; transition:border-color .25s;
}
.sd-card:hover { border-color:rgba(255,255,255,0.12); }
.sd-card-free { border-color:rgba(168,224,64,0.14); background:rgba(168,224,64,0.04); }

.sd-tag {
  position:absolute; top:13px; right:13px;
  font-size:10px; letter-spacing:1px; text-transform:uppercase;
  font-weight:500; padding:3px 9px; border-radius:20px;
}
.sd-tag-active   { background:rgba(168,224,64,0.10); color:#a8e040; border:1px solid rgba(168,224,64,0.2); }
.sd-tag-expiring { background:rgba(212,169,78,0.10); color:#d4a94e; border:1px solid rgba(212,169,78,0.2); }
.sd-tag-expired  { background:rgba(224,96,96,0.10);  color:#e06060; border:1px solid rgba(224,96,96,0.2); }

.sd-icon  { font-size:22px; margin-bottom:12px; display:block; }
.sd-name  { font-size:14px; font-weight:500; color:#e2ddd3; display:block; margin-bottom:3px; }
.sd-dur   { font-size:12px; color:rgba(226,221,211,0.38); display:block; margin-bottom:16px; }

/* countdown */
.sd-countdown { display:flex; align-items:center; gap:10px; }
.sd-ring-wrap  { position:relative; width:44px; height:44px; flex-shrink:0; }
.sd-ring-wrap svg { transform:rotate(-90deg); width:44px; height:44px; }
.sd-ring-track    { fill:none; stroke:rgba(255,255,255,0.08); stroke-width:3; }
.sd-ring-prog     { fill:none; stroke:#a8e040; stroke-width:3; stroke-linecap:round; transition:stroke-dashoffset .5s; }
.sd-ring-expiring .sd-ring-prog { stroke:#d4a94e; }
.sd-ring-expired  .sd-ring-prog { stroke:#e06060; }
.sd-days-num {
  font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:600;
  color:#e2ddd3; display:block;
}
.sd-days-label { font-size:10px; color:rgba(226,221,211,0.35); text-transform:uppercase; letter-spacing:1px; }
.sd-inf { font-size:22px; color:#a8e040; }

/* renew button */
.sd-renew {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 16px; border-radius:30px;
  background:rgba(212,169,78,0.10); border:1px solid rgba(212,169,78,0.35);
  color:#d4a94e; font-family:'Epilogue',sans-serif;
  font-size:12.5px; font-weight:500; cursor:pointer; transition:all .25s;
  animation:sd-pulse 2.2s ease-in-out infinite;
}
@keyframes sd-pulse {
  0%,100% { box-shadow:0 0 0 0 rgba(212,169,78,0); }
  50%      { box-shadow:0 0 0 6px rgba(212,169,78,0.12); }
}
.sd-renew:hover { background:rgba(212,169,78,0.18); transform:translateY(-1px); }

/* loading skeleton */
.sd-skeleton {
  background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);
  background-size:200% 100%;
  animation:sd-shimmer 1.4s infinite;
  border-radius:10px; height:140px;
}
@keyframes sd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

@media(max-width:500px){ .sd-grid{grid-template-columns:1fr 1fr;} }
`

function CountdownRing({ daysLeft, totalDays }) {
  const r    = 18
  const circ = 2 * Math.PI * r
  const pct  = totalDays > 0 ? daysLeft / totalDays : 0
  const offset = circ * (1 - Math.min(1, Math.max(0, pct)))
  const cls  = daysLeft === 0 ? 'sd-ring-expired' : daysLeft <= 7 ? 'sd-ring-expiring' : ''

  return (
    <div className={`sd-ring-wrap ${cls}`}>
      <svg viewBox="0 0 44 44">
        <circle className="sd-ring-track" cx="22" cy="22" r={r}/>
        <circle className="sd-ring-prog" cx="22" cy="22" r={r}
          strokeDasharray={`${circ.toFixed(1)}`}
          strokeDashoffset={`${offset.toFixed(1)}`}
        />
      </svg>
    </div>
  )
}

export default function SubscriptionDashboard({ subscriptions, loading, onManage, onRenew }) {
  // Live countdown — refresh every minute
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()

  const enrich = (s) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(s.expires_at) - now) / 86_400_000))
    const totalDays = DUR_DAYS[String(s.months)] ?? 30
    const isExpired  = daysLeft === 0
    const isExpiring = daysLeft <= 7 && !isExpired
    return { ...s, daysLeft, totalDays, isExpired, isExpiring }
  }

  return (
    <>
      <style>{css}</style>
      <div className="sd-wrap">
        <div className="sd-header">
          <h2>Vos espaces actifs</h2>
          <p>Chaque accès dispose de son propre compteur de validité.</p>
          <button className="sd-manage-btn" onClick={onManage}>
            ✦ Gérer mes accès
          </button>
        </div>

        <div className="sd-grid">
          {/* Free card always shown */}
          <div className="sd-card sd-card-free">
            <span className="sd-tag sd-tag-active">Actif</span>
            <span className="sd-icon">🌱</span>
            <span className="sd-name">Ma Fleur</span>
            <span className="sd-dur">Gratuit · Illimité</span>
            <div className="sd-countdown">
              <span className="sd-inf">∞</span>
              <div>
                <span className="sd-days-num" style={{fontSize:16,color:'#a8e040'}}>Sans limite</span>
              </div>
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && [1,2,3].map(i => <div key={i} className="sd-skeleton"/>)}

          {/* Subscription cards */}
          {!loading && subscriptions.map(s => {
            const e = enrich(s)
            const tagCls   = e.isExpired ? 'sd-tag-expired' : e.isExpiring ? 'sd-tag-expiring' : 'sd-tag-active'
            const tagLabel = e.isExpired ? 'Expiré' : e.isExpiring ? 'Expire bientôt' : 'Actif'

            return (
              <div key={s.id} className="sd-card">
                <span className={`sd-tag ${tagCls}`}>{tagLabel}</span>
                <span className="sd-icon">{s.product_icon}</span>
                <span className="sd-name">{s.product_name}</span>
                <span className="sd-dur">{DUR_LABELS[String(s.months)]}</span>

                {e.isExpired ? (
                  <button className="sd-renew" onClick={() => onRenew?.(s.product_id)}>
                    🔄 Renouveler
                  </button>
                ) : (
                  <div className="sd-countdown">
                    <CountdownRing daysLeft={e.daysLeft} totalDays={e.totalDays}/>
                    <div>
                      <span className="sd-days-num">{e.daysLeft}</span>
                      <span className="sd-days-label">jours</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
