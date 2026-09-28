// Nettoyage du bucket n8n-images (Supabase Storage) sur mon-jardin-interieur.
// Supprime les fichiers des dossiers "posts" et "stories" plus vieux que CUTOFF_DAYS.
// A executer localement avec Node.js (npm i @supabase/supabase-js avant si besoin).
//
// Usage (PowerShell) :
//   $env:SUPABASE_SERVICE_ROLE_KEY = "..."   (a copier depuis Dashboard > Project Settings > API > service_role)
//   node cleanup-n8n-images.mjs            -> dry-run (liste seulement, ne supprime rien)
//   node cleanup-n8n-images.mjs --delete   -> supprime pour de vrai
//
// Ne jamais coller la service_role key dans le chat / un fichier commite.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://islnwrgghdjozbhvugan.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'n8n-images';
const FOLDERS = ['posts', 'stories'];
const CUTOFF_DAYS = 30;
const DO_DELETE = process.argv.includes('--delete');

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante. Definissez la variable d\'environnement avant de lancer le script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const cutoff = new Date(Date.now() - CUTOFF_DAYS * 24 * 60 * 60 * 1000);
console.log(`Suppression des fichiers crees avant ${cutoff.toISOString()} (${CUTOFF_DAYS} jours)`);
console.log(DO_DELETE ? 'Mode: SUPPRESSION REELLE' : 'Mode: DRY-RUN (aucune suppression)');

let totalBytes = 0;
let totalFiles = 0;

for (const folder of FOLDERS) {
  let offset = 0;
  const pageSize = 100;
  const toDelete = [];

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: pageSize, offset, sortBy: { column: 'created_at', order: 'asc' } });

    if (error) {
      console.error(`Erreur list ${folder}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const obj of data) {
      if (!obj.created_at) continue;
      const createdAt = new Date(obj.created_at);
      if (createdAt < cutoff) {
        toDelete.push(`${folder}/${obj.name}`);
        totalBytes += obj.metadata?.size ?? 0;
        totalFiles += 1;
      }
    }

    offset += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`${folder}: ${toDelete.length} fichiers a supprimer`);

  if (DO_DELETE && toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error: delError } = await supabase.storage.from(BUCKET).remove(batch);
      if (delError) {
        console.error(`Erreur suppression batch ${folder}:`, delError.message);
      } else {
        console.log(`  -> ${batch.length} fichiers supprimes (batch ${i / 100 + 1})`);
      }
    }
  }
}

console.log(`Total: ${totalFiles} fichiers, ${(totalBytes / 1024 / 1024).toFixed(1)} MB ${DO_DELETE ? 'supprimes' : 'a supprimer (dry-run)'}`);
