// src/constants/adminIds.js
// Extrait de AdminPage.jsx pour éviter que les modules qui n'ont besoin que de
// cette constante (ex. DashboardV2.jsx) n'entraînent tout AdminPage.jsx dans
// le bundle principal (celui-ci est chargé paresseusement, cf. App.jsx).

// ── IDs des administrateurs ─────────────────────────────────────────────────
// Ajoutez ici les UUIDs des utilisateurs ayant accès à l'interface admin.
// Ces IDs sont aussi exclus des statistiques pour ne pas fausser les données.
export const ADMIN_IDS = [
  'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7', // Gwenaël (fondateur)
  'fbcfb88f-0280-40ab-98d3-bcf750c5764d', // Co-admin
  'b6d0d66c-7b3c-4dec-be98-dbae3bef54e7', // Admin (bonjour@monjardininterieur.com)
  '504b3dfd-c23c-425c-9ce2-7f6cd7ba0679', // Gwenael JEAUNEAU (gwenael.jeauneau@monhypnotherapeute.com)
]
