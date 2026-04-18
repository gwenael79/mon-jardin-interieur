-- ══════════════════════════════════════════════════════
--  SIMULATION VENTES  ·  Mon Jardin Intérieur
--  Données de démo — 3 mois (fév · mars · avr 2026)
--  → Colle ce script dans Supabase › SQL Editor › Run
-- ══════════════════════════════════════════════════════

DO $$
DECLARE
  v_uid     uuid;
  v_atel    uuid[];
  v_atel_px numeric[];
  v_cli     uuid[];
  v_part    uuid;
  v_prod    uuid[];
  v_prod_px numeric[];
  p1 numeric; p2 numeric; p3 numeric;
BEGIN

  -- ── Pro user ────────────────────────────────────────────
  SELECT user_id INTO v_uid FROM users_pro LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION '❌ Aucun compte users_pro trouvé';
  END IF;
  RAISE NOTICE '👤 Pro user_id = %', v_uid;

  -- ── Ateliers du pro (jusqu'à 3) ─────────────────────────
  SELECT ARRAY_AGG(id ORDER BY created_at DESC),
         ARRAY_AGG(COALESCE(price, 35) ORDER BY created_at DESC)
  INTO   v_atel, v_atel_px
  FROM   (SELECT id, price, created_at
          FROM   ateliers
          WHERE  animator_id = v_uid
          ORDER  BY created_at DESC
          LIMIT  3) x;

  RAISE NOTICE '🌿 Ateliers trouvés : %', COALESCE(array_length(v_atel, 1), 0);

  -- ── Clients (autres users, jusqu'à 6) ───────────────────
  SELECT ARRAY_AGG(id ORDER BY created_at DESC)
  INTO   v_cli
  FROM   (SELECT id, created_at
          FROM   users
          WHERE  id != v_uid
          ORDER  BY created_at DESC
          LIMIT  6) x;

  RAISE NOTICE '👥 Clients disponibles : %', COALESCE(array_length(v_cli, 1), 0);

  -- ── Partenaire du pro ────────────────────────────────────
  SELECT id INTO v_part FROM partenaires WHERE user_id = v_uid LIMIT 1;
  RAISE NOTICE '🏪 Partenaire id = %', v_part;

  -- ── Produits du partenaire (jusqu'à 3) ──────────────────
  IF v_part IS NOT NULL THEN
    SELECT ARRAY_AGG(id ORDER BY created_at DESC),
           ARRAY_AGG(COALESCE(prix, 12) ORDER BY created_at DESC)
    INTO   v_prod, v_prod_px
    FROM   (SELECT id, prix, created_at
            FROM   produits
            WHERE  partenaire_id = v_part
            ORDER  BY created_at DESC
            LIMIT  3) x;

    RAISE NOTICE '🛍️ Produits trouvés : %', COALESCE(array_length(v_prod, 1), 0);
  END IF;

  -- ════════════════════════════════════════════════════════
  --  INSCRIPTIONS ATELIERS
  -- ════════════════════════════════════════════════════════
  IF v_atel IS NOT NULL AND v_cli IS NOT NULL THEN
    INSERT INTO atelier_registrations (atelier_id, user_id, registered_at)
    VALUES
      -- ── Avril 2026 ──
      (v_atel[1],                       v_cli[1], '2026-04-15 10:30:00+00'),
      (v_atel[1],                       v_cli[2], '2026-04-08 14:00:00+00'),
      (COALESCE(v_atel[2], v_atel[1]),  v_cli[3], '2026-04-03 09:15:00+00'),
      (COALESCE(v_atel[2], v_atel[1]),  v_cli[4], '2026-04-01 11:45:00+00'),
      -- ── Mars 2026 ──
      (v_atel[1],                       v_cli[5], '2026-03-25 11:00:00+00'),
      (COALESCE(v_atel[2], v_atel[1]),  v_cli[6], '2026-03-18 16:30:00+00'),
      (COALESCE(v_atel[3], v_atel[1]),  v_cli[1], '2026-03-12 10:00:00+00'),
      (v_atel[1],                       v_cli[2], '2026-03-05 09:00:00+00'),
      -- ── Février 2026 ──
      (COALESCE(v_atel[2], v_atel[1]),  v_cli[3], '2026-02-28 14:00:00+00'),
      (v_atel[1],                       v_cli[4], '2026-02-14 09:00:00+00'),
      (COALESCE(v_atel[3], v_atel[1]),  v_cli[5], '2026-02-05 11:30:00+00')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Inscriptions ateliers insérées';
  ELSE
    RAISE NOTICE '⚠️  Aucun atelier ou client trouvé — inscriptions ignorées';
  END IF;

  -- ════════════════════════════════════════════════════════
  --  VENTES PRODUITS NUMÉRIQUES
  -- ════════════════════════════════════════════════════════
  IF v_part IS NOT NULL AND v_prod IS NOT NULL THEN
    p1 := COALESCE(v_prod_px[1], 12);
    p2 := COALESCE(v_prod_px[2], 29);
    p3 := COALESCE(v_prod_px[3], 19);

    INSERT INTO ventes_partenaires
      (produit_id, partenaire_id, montant_brut, taux_commission,
       commission, montant_net, mois_facturation, statut, created_at)
    VALUES
      -- ── Avril 2026 ──
      (v_prod[1],
       v_part, p1, 15, ROUND(p1*0.15,2), ROUND(p1*0.85,2), '2026-04', 'en_attente', '2026-04-16 14:00:00+00'),
      (COALESCE(v_prod[2], v_prod[1]),
       v_part, p2, 15, ROUND(p2*0.15,2), ROUND(p2*0.85,2), '2026-04', 'en_attente', '2026-04-09 11:00:00+00'),
      (COALESCE(v_prod[3], v_prod[1]),
       v_part, p3, 15, ROUND(p3*0.15,2), ROUND(p3*0.85,2), '2026-04', 'en_attente', '2026-04-02 09:30:00+00'),
      -- ── Mars 2026 ──
      (v_prod[1],
       v_part, p1, 15, ROUND(p1*0.15,2), ROUND(p1*0.85,2), '2026-03', 'versé', '2026-03-22 10:00:00+00'),
      (COALESCE(v_prod[2], v_prod[1]),
       v_part, p2, 15, ROUND(p2*0.15,2), ROUND(p2*0.85,2), '2026-03', 'versé', '2026-03-15 14:30:00+00'),
      (COALESCE(v_prod[3], v_prod[1]),
       v_part, p3, 15, ROUND(p3*0.15,2), ROUND(p3*0.85,2), '2026-03', 'versé', '2026-03-08 09:00:00+00'),
      (v_prod[1],
       v_part, p1, 15, ROUND(p1*0.15,2), ROUND(p1*0.85,2), '2026-03', 'versé', '2026-03-03 16:00:00+00'),
      -- ── Février 2026 ──
      (v_prod[1],
       v_part, p1, 15, ROUND(p1*0.15,2), ROUND(p1*0.85,2), '2026-02', 'versé', '2026-02-20 10:00:00+00'),
      (COALESCE(v_prod[2], v_prod[1]),
       v_part, p2, 15, ROUND(p2*0.15,2), ROUND(p2*0.85,2), '2026-02', 'versé', '2026-02-12 13:00:00+00'),
      (COALESCE(v_prod[3], v_prod[1]),
       v_part, p3, 15, ROUND(p3*0.15,2), ROUND(p3*0.85,2), '2026-02', 'versé', '2026-02-04 09:00:00+00')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Ventes produits insérées';
  ELSE
    RAISE NOTICE '⚠️  Aucun partenaire ou produit trouvé — ventes ignorées';
  END IF;

  RAISE NOTICE '🎉 Simulation terminée pour pro user_id = %', v_uid;
END $$;


-- ══════════════════════════════════════════════════════
--  NETTOYAGE (dé-commenter pour supprimer les données)
-- ══════════════════════════════════════════════════════

-- DELETE FROM atelier_registrations
--   WHERE registered_at IN (
--     '2026-04-15 10:30:00+00','2026-04-08 14:00:00+00','2026-04-03 09:15:00+00',
--     '2026-04-01 11:45:00+00','2026-03-25 11:00:00+00','2026-03-18 16:30:00+00',
--     '2026-03-12 10:00:00+00','2026-03-05 09:00:00+00','2026-02-28 14:00:00+00',
--     '2026-02-14 09:00:00+00','2026-02-05 11:30:00+00'
--   );

-- DELETE FROM ventes_partenaires
--   WHERE mois_facturation IN ('2026-04','2026-03','2026-02')
--   AND created_at >= '2026-02-01';
