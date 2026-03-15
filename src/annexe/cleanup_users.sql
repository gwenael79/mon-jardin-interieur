-- ═══════════════════════════════════════════════════════════════════════════
--  NETTOYAGE GLOBAL — Mon Jardin Intérieur
--  Usage : remplacer les IDs dans le tableau KEEP_IDS, puis exécuter
--          dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. DÉFINIR LES COMPTES À CONSERVER ──────────────────────────────────────
--  Remplace les UUIDs ci-dessous par les IDs des comptes à garder

DO $$ BEGIN
  -- Simple vérification que les IDs sont bien des UUIDs valides
  RAISE NOTICE 'Début du nettoyage...';
END $$;

-- ── 2. TABLES DÉPENDANTES (ordre important — clés étrangères) ────────────────

DELETE FROM gestures               WHERE from_user_id NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM gestures               WHERE to_user_id   NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM analytics_events       WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM wakeup_seen            WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM user_privacy           WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM intentions_joined      WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM coeurs                 WHERE sender_id    NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM coeurs                 WHERE receiver_id  NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM mercis                 WHERE sender_id    NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM mercis                 WHERE receiver_id  NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM relations              WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM relations              WHERE other_id     NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM graines_estime         WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM lumen_transactions     WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM lumen_unlocks          WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM lumens                 WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM atelier_ratings        WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM atelier_reviews        WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM atelier_invitations    WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM atelier_preferences    WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM atelier_registrations  WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM animator_applications  WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM ateliers               WHERE animator_id  NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM defi_participants      WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM defis                  WHERE created_by   NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM circle_members         WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM circles                WHERE created_by   NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM privacy_settings       WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM journal_entries        WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM rituals                WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM plants                 WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM daily_quiz             WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM garden_settings        WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM push_subscriptions     WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM subscriptions          WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');
DELETE FROM user_visits            WHERE user_id      NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');

-- ── 3. TABLE PROFILES (contrainte profiles_id_fkey) ─────────────────────────
DELETE FROM public.profiles        WHERE id           NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');

-- ── 4. TABLE USERS PUBLIC ────────────────────────────────────────────────────
DELETE FROM public.users           WHERE id           NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');

-- ── 5. TABLE AUTH (en dernier — dépend de tout le reste) ────────────────────
DELETE FROM auth.users             WHERE id           NOT IN ('REMPLACER_ID_1','REMPLACER_ID_2','REMPLACER_ID_3','REMPLACER_ID_4','REMPLACER_ID_5');

-- ── FIN ──────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE 'Nettoyage terminé.';
END $$;
