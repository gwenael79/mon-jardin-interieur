const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}

.cp-wrap {
  min-height: 100%;
  background: #faf8f4;
  font-family: 'Jost', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cp-header {
  width: 100%;
  background: rgba(252,250,244,.96);
  border-bottom: 1px solid rgba(200,190,175,.28);
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
}
.cp-header-logo {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid rgba(26,58,18,.18);
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cp-header-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px; font-weight: 600; color: #0f2a08;
}
.cp-header-back {
  margin-left: auto;
  background: none; border: none;
  font-size: 13px; color: rgba(30,20,8,.45);
  font-family: 'Jost', sans-serif;
  cursor: pointer; text-decoration: underline;
  text-underline-offset: 2px; transition: color .15s;
}
.cp-header-back:hover { color: rgba(30,20,8,.80); }

.cp-body {
  width: 100%;
  max-width: 680px;
  padding: 40px 24px 80px;
}
.cp-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 600; color: #1a1208;
  margin-bottom: 6px; letter-spacing: .01em;
}
.cp-updated {
  font-size: 12px; color: rgba(30,20,8,.38);
  margin-bottom: 32px;
}
.cp-body h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 600; color: #1a1208;
  margin: 28px 0 8px; letter-spacing: .01em;
}
.cp-body h3:first-of-type { margin-top: 0; }
.cp-body p {
  font-size: 14px; color: rgba(30,20,8,.75);
  line-height: 1.85; margin-bottom: 10px;
}
.cp-body ul {
  margin: 6px 0 12px 20px;
}
.cp-body li {
  font-size: 14px; color: rgba(30,20,8,.75);
  line-height: 1.85; margin-bottom: 5px;
}
.cp-body strong { color: #1a1208; font-weight: 600; }
.cp-body a { color: #4a8a20; }
.cp-sep {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(90,154,40,.20), transparent);
  margin: 32px 0;
}
.cp-footer {
  text-align: center;
  font-size: 12px; color: rgba(30,20,8,.35);
  margin-top: 8px;
}
@media(max-width:520px) {
  .cp-body { padding: 28px 18px 60px; }
  .cp-title { font-size: 26px; }
}
`

export function ConfidentialitePage() {
  return (
    <div className="cp-wrap">
      <style>{css}</style>

      <div className="cp-header">
        <div className="cp-header-logo">
          <img src="/icons/icon-512.png" alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
        </div>
        <div className="cp-header-name">Mon Jardin Intérieur</div>
        <button className="cp-header-back" onClick={() => window.history.back()}>
          ← Retour
        </button>
      </div>

      <div className="cp-body">
        <div className="cp-title">Politique de confidentialité</div>
        <div className="cp-updated">Dernière mise à jour : 16/05/2026</div>

        <h3>Responsable du traitement</h3>
        <p>
          Gwenael JEAUNEAU — Mon Jardin Intérieur — bonjour@monjardininterieur.com<br />
          95 boulevard de l'Atlantique, 79000 Niort
        </p>

        <div className="cp-sep" />

        <h3>Données collectées</h3>
        <ul>
          <li><strong>Données d'inscription :</strong> email, prénom/pseudo, date de naissance</li>
          <li><strong>Données de profil :</strong> fleur choisie, niveau, contenus créés (bilans émotionnels, rituels)</li>
          <li><strong>Données de navigation :</strong> logs de connexion, interactions dans l'application</li>
          <li><strong>Données de paiement :</strong> traitées par <strong>Stripe</strong> — non stockées chez l'éditeur</li>
        </ul>

        <div className="cp-sep" />

        <h3>Finalités et bases légales</h3>
        <ul>
          <li>Fourniture et gestion du service — <strong>Exécution du contrat</strong></li>
          <li>Amélioration de l'application — <strong>Intérêt légitime</strong></li>
          <li>Communications marketing — <strong>Consentement</strong></li>
          <li>Obligations comptables et légales — <strong>Obligation légale</strong></li>
        </ul>

        <div className="cp-sep" />

        <h3>Durée de conservation</h3>
        <p>
          Les données sont conservées pendant toute la durée du compte, puis 3 ans après sa suppression
          ou la résiliation définitive, sauf obligation légale contraire (ex : données comptables conservées 10 ans).
        </p>

        <div className="cp-sep" />

        <h3>Destinataires des données</h3>
        <p>Vos données sont traitées par les sous-traitants suivants :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement base de données (USA, clauses contractuelles types UE)</li>
          <li><strong>Vercel</strong> — hébergement application (USA, clauses contractuelles types UE)</li>
          <li><strong>Systeme.io</strong> — gestion des emails et automatisations marketing</li>
          <li><strong>Stripe</strong> — traitement sécurisé des paiements</li>
        </ul>

        <div className="cp-sep" />

        <h3>Vos droits (RGPD)</h3>
        <p>
          Vous disposez des droits suivants : accès, rectification, suppression, portabilité,
          opposition, limitation du traitement. Pour les exercer : rgpd@monjardininterieur.com.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> :{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>
        </p>

        <div className="cp-footer">
          © Mon Jardin Intérieur — Gwenael JEAUNEAU
        </div>
      </div>
    </div>
  )
}
