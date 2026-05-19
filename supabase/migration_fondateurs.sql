-- ─────────────────────────────────────────────────────────────────────────────
--  migration_fondateurs.sql — Le Cercle qui nous porte
--  À appliquer via : Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.fondateurs (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references public.users(id) on delete set null,
  display_name     text        not null,
  citation         text        check (char_length(citation) <= 80),
  niveau           text        not null check (niveau in ('ami', 'compagnon', 'fondateur')),
  montant          numeric(10,2) not null,
  devise           text        not null default 'EUR',
  paiement_method  text        check (paiement_method in ('virement', 'stripe', 'autre')),
  paiement_ref     text,
  date_contribution timestamptz not null default now(),
  affichage_public boolean     not null default true,
  ordre_affichage  int,
  fleur_variant    int         not null default 1 check (fleur_variant between 1 and 12),
  couleur_petale   text,
  message_prive    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Index pour la page publique (tri par date, filtre affichage_public)
create index if not exists idx_fondateurs_public
  on public.fondateurs(affichage_public, date_contribution);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.fondateurs enable row level security;

-- SELECT : tout le monde peut lire les fondateurs publics
create policy "fondateurs_select_public"
  on public.fondateurs
  for select
  using (affichage_public = true);

-- ALL : service_role uniquement (admin via Supabase dashboard)
create policy "fondateurs_admin_all"
  on public.fondateurs
  for all
  using (auth.role() = 'service_role');

-- ── Trigger updated_at ────────────────────────────────────────────────────────
create or replace function public.fondateurs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fondateurs_updated_at on public.fondateurs;
create trigger fondateurs_updated_at
  before update on public.fondateurs
  for each row execute procedure public.fondateurs_set_updated_at();

-- ── Données de test (à supprimer avant prod) ─────────────────────────────────
-- insert into public.fondateurs (display_name, citation, niveau, montant, fleur_variant)
-- values
--   ('Marie L.',    'Pour que la douceur ait sa place.',         'compagnon', 250, 3),
--   ('Jean-Pierre D.', null,                                     'ami',       80,  1),
--   ('Sophie B.',   'Ce jardin méritait d''exister.',            'fondateur', 600, 7);
