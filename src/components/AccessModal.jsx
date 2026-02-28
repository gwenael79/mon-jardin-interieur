import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'
import { PRODUCTS, DUR_LABELS, DUR_DAYS } from '../hooks/useSubscription'

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Epilogue:wght@300;400;500;600&display=swap');

.fi-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.80);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  z-index: 9999;
  animation: fi-fadeIn 0.3s ease both;
}
@keyframes fi-fadeIn { from { opacity:0 } to { opacity:1 } }

.fi-modal {
  display: grid;
  grid-template-columns: 290px 1fr;
  width: 100%; max-width: 840px;
  max-height: 92vh;
  background: #0e1a0c;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 20px;
  overflow: hidden;
  animation: fi-slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes fi-slideUp { from { transform:scale(0.94) translateY(24px); opacity:0 } to { transform:scale(1) translateY(0); opacity:1 } }

/* ── LEFT ── */
.fi-left {
  background: #132010;
  border-right: 1px solid rgba(255,255,255,0.07);
  display: flex; flex-direction: column;
  padding: 32px 24px 24px;
  overflow-y: auto;
}
.fi-logo {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 28px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px; font-weight: 400;
  color: #e2ddd3;
}
.fi-section-label {
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  color: rgba(226,221,211,0.35); font-weight: 500;
  margin-bottom: 12px;
}
.fi-free-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 13px;
  background: rgba(168,224,64,0.08);
  border: 1px solid rgba(168,224,64,0.18);
  border-radius: 10px;
  font-size: 12.5px; color: #a8e040;
  margin-bottom: 16px;
}
.fi-cart-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; gap: 10px;
}
.fi-cart-empty-ring {
  width: 46px; height: 46px;
  border: 1px dashed rgba(255,255,255,0.12);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: rgba(226,221,211,0.25);
}
.fi-cart-empty p { font-size: 12px; color: rgba(226,221,211,0.3); line-height: 1.6; }

.fi-cart-item {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 8px; padding: 11px 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  animation: fi-fadeSlide 0.25s ease both;
}
@keyframes fi-fadeSlide { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:translateX(0) } }
.fi-cart-item:last-child { border-bottom: none; }
.fi-cart-item-info { flex: 1; }
.fi-cart-item-name { display: block; font-size: 13px; font-weight: 500; color: #e2ddd3; margin-bottom: 3px; }
.fi-cart-item-dur {
  display: inline-block; font-size: 11px; color: rgba(226,221,211,0.4);
  background: rgba(255,255,255,0.05); border-radius: 4px; padding: 2px 7px;
}
.fi-cart-item-price { font-size: 13px; font-weight: 600; color: #a8e040; white-space: nowrap; }
.fi-cart-item-rm {
  background: none; border: none; color: rgba(226,221,211,0.3);
  cursor: pointer; font-size: 13px; padding: 2px; transition: color .2s;
  line-height: 1;
}
.fi-cart-item-rm:hover { color: #e06060; }

.fi-total {
  margin-top: 18px; padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.fi-total-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: rgba(226,221,211,0.5); margin-bottom: 6px;
}
.fi-total-amount {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px; font-weight: 600; color: #e2ddd3; margin: 6px 0 18px;
}
.fi-total-amount span { font-size: 16px; font-weight: 300; color: rgba(226,221,211,0.5); }
.fi-btn-pay {
  width: 100%; padding: 13px; border: none; border-radius: 30px;
  background: #a8e040; color: #0c1a05;
  font-family: 'Epilogue', sans-serif; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .25s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  overflow: hidden; position: relative;
}
.fi-btn-pay:hover:not(:disabled) { background: #bff055; box-shadow: 0 8px 28px rgba(168,224,64,0.25); }
.fi-btn-pay:disabled { opacity: .35; cursor: not-allowed; }
.fi-secure-note {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 11px; color: rgba(226,221,211,0.28); margin-top: 10px;
}
.fi-btn-free {
  width: 100%; padding: 12px; border-radius: 30px;
  background: transparent; border: 1px solid rgba(168,224,64,0.25);
  color: #a8e040; font-family: 'Epilogue', sans-serif; font-size: 13px;
  font-weight: 500; cursor: pointer; transition: all .25s;
  margin-top: 10px;
}
.fi-btn-free:hover { background: rgba(168,224,64,0.08); }

/* ── RIGHT ── */
.fi-right { display: flex; flex-direction: column; overflow: hidden; }
.fi-right-head {
  padding: 26px 28px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  flex-shrink: 0;
}
.fi-right-head h2 {
  font-family: 'Cormorant Garamond', serif; font-size: 25px; font-weight: 400;
  color: #e2ddd3; margin-bottom: 4px; letter-spacing: -.3px;
}
.fi-right-head p { font-size: 13px; color: rgba(226,221,211,0.55); line-height: 1.5; }
.fi-close-btn {
  flex-shrink: 0; width: 32px; height: 32px;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 50%;
  background: none; color: rgba(226,221,211,0.5); font-size: 15px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.fi-close-btn:hover { background: rgba(255,255,255,0.06); color: #e2ddd3; }

.fi-products-scroll {
  flex: 1; overflow-y: auto; padding: 16px 28px 28px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.fi-products-scroll::-webkit-scrollbar { width: 4px; }
.fi-products-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.fi-tier-label {
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  color: rgba(226,221,211,0.3); font-weight: 500;
  margin: 16px 0 10px;
  display: flex; align-items: center; gap: 10px;
}
.fi-tier-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }

/* free row */
.fi-free-row {
  background: #132010;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 10px;
}
.fi-prod-left { display:flex; align-items:center; gap:11px; }
.fi-prod-icon {
  width:34px; height:34px; border-radius:8px;
  background: rgba(168,224,64,0.10);
  display:flex; align-items:center; justify-content:center; font-size:17px;
  flex-shrink:0;
}
.fi-prod-title { display:block; font-size:13.5px; font-weight:500; color:#e2ddd3; margin-bottom:2px; }
.fi-prod-desc  { font-size:12px; color:rgba(226,221,211,0.42); }
.fi-free-check {
  width:26px; height:26px; background:#a8e040; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; color:#0c1a05; font-weight:700; flex-shrink:0;
}

/* product card */
.fi-product {
  background: #132010;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; overflow: hidden; margin-bottom: 10px;
  transition: border-color .25s;
}
.fi-product.fi-active { border-color: rgba(168,224,64,0.28); }
.fi-product-head {
  padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; gap: 10px; user-select: none;
  transition: background .2s;
}
.fi-product-head:hover { background: rgba(168,224,64,0.04); }
.fi-product-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.fi-dot {
  width:7px; height:7px; border-radius:50%; background:#a8e040;
  box-shadow: 0 0 6px rgba(168,224,64,0.5);
  opacity:0; transition:opacity .2s;
}
.fi-active .fi-dot { opacity:1; }
.fi-rm-btn {
  background:none; border:none; color:rgba(226,221,211,0.3);
  cursor:pointer; font-size:12px; padding:2px; transition:color .2s; line-height:1;
}
.fi-rm-btn:hover { color:#e06060; }
.fi-chevron {
  width:16px; height:16px; color:rgba(226,221,211,0.3);
  transition: transform .25s cubic-bezier(.4,0,.2,1), color .2s;
}
.fi-product.fi-expanded .fi-chevron { transform:rotate(180deg); color:rgba(226,221,211,0.6); }

/* duration panel */
.fi-dur-panel {
  max-height: 0; overflow: hidden;
  transition: max-height .35s cubic-bezier(.4,0,.2,1);
}
.fi-product.fi-expanded .fi-dur-panel { max-height: 160px; }
.fi-dur-grid {
  padding: 0 16px 14px;
  display: grid; grid-template-columns: repeat(4,1fr); gap: 7px;
}
.fi-dur-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 9px 4px; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; background: none; cursor: pointer;
  transition: all .2s; font-family: 'Epilogue', sans-serif;
  position: relative; overflow: hidden;
}
.fi-dur-btn:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
.fi-dur-btn.fi-sel { border-color: #a8e040; background: rgba(168,224,64,0.10); }
.fi-dur-btn.fi-sel::after {
  content:'✓'; position:absolute; top:3px; right:4px;
  font-size:8px; color:#a8e040; font-weight:700;
}
.fi-dur-label { font-size:11.5px; font-weight:600; color:#e2ddd3; margin-bottom:2px; }
.fi-dur-price { font-size:10.5px; color:rgba(226,221,211,0.5); }
.fi-dur-save  { font-size:10px; color:#a8e040; margin-top:2px; font-weight:500; }

/* ── RESPONSIVE ── */
@media (max-width:640px) {
  .fi-modal { grid-template-columns:1fr; grid-template-rows:auto 1fr; }
  .fi-left { border-right:none; border-bottom:1px solid rgba(255,255,255,0.07); max-height:260px; padding:20px 18px; }
  .fi-right-head { padding:18px 18px 14px; }
  .fi-products-scroll { padding:12px 18px 20px; }
  .fi-dur-grid { grid-template-columns:repeat(2,1fr); }
}
`

/* ══════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════ */

function FleurLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      {[0,60,120,180,240,300].map((deg, i) => (
        <ellipse key={deg} cx="26" cy="14" rx="5" ry="11"
          fill={i < 3 ? "rgba(168,224,64,0.15)" : "rgba(168,224,64,0.08)"}
          stroke={i < 3 ? "#a8e040" : "rgba(168,224,64,0.4)"}
          strokeWidth="1"
          transform={deg ? `rotate(${deg} 26 26)` : undefined}
        />
      ))}
      <circle cx="26" cy="26" r="5.5" fill="#a8e040"/>
      <line x1="26" y1="31.5" x2="26" y2="46" stroke="#a8e040" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="26" y1="40" x2="20" y2="35" stroke="#a8e040" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="fi-chevron" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

/* ── ProductCard ── */
function ProductCard({ product, cartItem, expanded, onToggle, onSelect, onRemove }) {
  return (
    <div className={`fi-product${cartItem ? ' fi-active' : ''}${expanded ? ' fi-expanded' : ''}`}>
      <div className="fi-product-head" onClick={onToggle}>
        <div className="fi-prod-left">
          <div className="fi-prod-icon">{product.icon}</div>
          <div>
            <span className="fi-prod-title">{product.name}</span>
            <span className="fi-prod-desc">
              {cartItem
                ? `${DUR_LABELS[cartItem.months]} · ${cartItem.price.toFixed(2).replace('.', ',')} €`
                : product.desc}
            </span>
          </div>
        </div>
        <div className="fi-product-right">
          <div className="fi-dot"/>
          {cartItem && (
            <button className="fi-rm-btn" onClick={e => { e.stopPropagation(); onRemove() }}>✕</button>
          )}
          <ChevronIcon/>
        </div>
      </div>

      <div className="fi-dur-panel">
        <div className="fi-dur-grid">
          {Object.entries(DUR_LABELS).map(([months, label]) => (
            <button
              key={months}
              className={`fi-dur-btn${cartItem?.months === months ? ' fi-sel' : ''}`}
              onClick={e => { e.stopPropagation(); onSelect(months, product.prices[months]) }}
            >
              <span className="fi-dur-label">{label}</span>
              <span className="fi-dur-price">{product.prices[months].toFixed(2).replace('.', ',')} €</span>
              {product.savings[months]
                ? <span className="fi-dur-save">{product.savings[months]}</span>
                : <span/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AccessModal({ isOpen, onClose, onSuccess, preOpenProduct = null }) {
  const [cart, setCart]         = useState({})   // { productId: { months, price, name, icon } }
  const [expanded, setExpanded] = useState(preOpenProduct)
  const [paying, setPaying]     = useState(false)

  // Sync pre-open product when modal opens
  useEffect(() => {
    if (isOpen && preOpenProduct) setExpanded(preOpenProduct)
  }, [isOpen, preOpenProduct])

  // Reset on close
  useEffect(() => {
    if (!isOpen) { setCart({}); setExpanded(null); setPaying(false) }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const total    = Object.values(cart).reduce((s, v) => s + v.price, 0)
  const hasItems = Object.keys(cart).length > 0

  const selectDuration = useCallback((productId, months, price) => {
    const p = PRODUCTS.find(x => x.id === productId)
    setCart(prev => ({
      ...prev,
      [productId]: { months, price, name: p.name, icon: p.icon, stripePriceId: p.stripePrices[months] }
    }))
    setExpanded(null)
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prev => { const next = { ...prev }; delete next[productId]; return next })
  }, [])

  const handlePay = async () => {
    if (!hasItems) return
    setPaying(true)

    try {
      // ── Récupérer le token Supabase ───────────────────
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // ── Appel backend Stripe ──────────────────────────
      // const res = await fetch('/api/create-checkout', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     items: Object.entries(cart).map(([id, v]) => ({
      //       id, name: v.name, icon: v.icon,
      //       months: v.months, price: v.price,
      //       stripePriceId: v.stripePriceId
      //     })),
      //     successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      //     cancelUrl: window.location.href
      //   })
      // })
      // const { url } = await res.json()
      // window.location.href = url

      // ── SIMULATION (à retirer en prod) ───────────────
      await new Promise(r => setTimeout(r, 1200))
      const items = Object.entries(cart).map(([id, v]) => ({ id, ...v }))
      onSuccess?.(items)
      onClose()

    } catch (err) {
      console.error('Erreur paiement:', err)
    } finally {
      setPaying(false)
    }
  }

  const handleFreeOnly = () => {
    onSuccess?.(null) // null = free only
    onClose()
  }

  if (!isOpen) return null

  const cartEntries = Object.entries(cart)

  return (
    <>
      <style>{css}</style>
      <div className="fi-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="fi-modal" role="dialog" aria-modal="true" aria-label="Choisissez votre accès">

          {/* ── LEFT — récapitulatif ── */}
          <div className="fi-left">
            <div className="fi-logo">
              <FleurLogo size={24}/>
              Fleur Intérieure
            </div>

            <div className="fi-section-label">Ma sélection</div>
            <div className="fi-free-badge">
              <span>✓</span> Ma Fleur inclus gratuitement
            </div>

            {cartEntries.length === 0 ? (
              <div className="fi-cart-empty">
                <div className="fi-cart-empty-ring">🛒</div>
                <p>Sélectionnez les espaces qui vous inspirent</p>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                {cartEntries.map(([id, v]) => (
                  <div key={id} className="fi-cart-item">
                    <div className="fi-cart-item-info">
                      <span className="fi-cart-item-name">{v.icon} {v.name}</span>
                      <span className="fi-cart-item-dur">{DUR_LABELS[v.months]}</span>
                    </div>
                    <span className="fi-cart-item-price">{v.price.toFixed(2).replace('.', ',')} €</span>
                    <button className="fi-cart-item-rm" onClick={() => removeFromCart(id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {hasItems ? (
              <div className="fi-total">
                <div className="fi-total-row">
                  <span>{cartEntries.length} module{cartEntries.length > 1 ? 's' : ''}</span>
                  <span>Total</span>
                </div>
                <div className="fi-total-amount">
                  {total.toFixed(2).replace('.', ',')} <span>€</span>
                </div>
                <button className="fi-btn-pay" onClick={handlePay} disabled={paying}>
                  {paying ? 'Redirection…' : `Valider · ${total.toFixed(2).replace('.', ',')} €`}
                  {!paying && <span>→</span>}
                </button>
                <p className="fi-secure-note">🔒 Paiement sécurisé via Stripe</p>
              </div>
            ) : (
              <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button className="fi-btn-free" onClick={handleFreeOnly}>
                  Continuer gratuitement
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT — produits ── */}
          <div className="fi-right">
            <div className="fi-right-head">
              <div>
                <h2>Composez votre accès</h2>
                <p>Choisissez librement. Chaque espace a sa propre durée.</p>
              </div>
              <button className="fi-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
            </div>

            <div className="fi-products-scroll">
              <div className="fi-tier-label">Accès gratuit</div>
              <div className="fi-free-row">
                <div className="fi-prod-left">
                  <div className="fi-prod-icon">🌱</div>
                  <div>
                    <span className="fi-prod-title">Ma Fleur</span>
                    <span className="fi-prod-desc">Suivi personnel, journal, tableau de bord quotidien</span>
                  </div>
                </div>
                <div className="fi-free-check">✓</div>
              </div>

              <div className="fi-tier-label">Espaces premium — à la carte</div>

              {PRODUCTS.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  cartItem={cart[p.id]}
                  expanded={expanded === p.id}
                  onToggle={() => setExpanded(prev => prev === p.id ? null : p.id)}
                  onSelect={(months, price) => selectDuration(p.id, months, price)}
                  onRemove={() => removeFromCart(p.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
