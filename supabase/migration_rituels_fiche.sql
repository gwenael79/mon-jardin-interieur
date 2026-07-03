-- Migration : enrichissement de la table rituels (nouvelle fiche rituel)
-- Ajoute les champs nécessaires à la fiche détaillée d'un rituel :
-- objectif, bénéfice émotionnel ("pourquoi"), étapes ("comment faire"),
-- bienfaits nourris, et question de réflexion finale.
-- Colonnes nullables + valeurs par défaut vides : rétro-compatible avec
-- les rituels existants (la fiche se dégrade proprement si absentes).

alter table public.rituels
  add column if not exists objective     text,
  add column if not exists why           text,
  add column if not exists steps         jsonb not null default '[]'::jsonb,
  add column if not exists benefits      jsonb not null default '[]'::jsonb,
  add column if not exists reflection    text,
  add column if not exists subtitle      text,
  add column if not exists image_url     text,
  add column if not exists audio_url     text,
  add column if not exists audio_duration text;

comment on column public.rituels.objective      is 'Phrase courte : ce que le rituel apporte';
comment on column public.rituels.why            is 'Bénéfice émotionnel, quelques lignes';
comment on column public.rituels.steps          is 'Étapes du "Comment faire ?" : [{icon, title, text}]';
comment on column public.rituels.benefits       is 'Bienfaits nourris par le rituel : [{icon, label, text}] (ou simples chaînes)';
comment on column public.rituels.reflection     is 'Question de réflexion affichée en fin de fiche';
comment on column public.rituels.subtitle       is 'Courte accroche affichée sous le titre, dans le hero de la fiche';
comment on column public.rituels.image_url      is 'Illustration hero de la fiche — si vide, repli sur l''illustration de la zone';
comment on column public.rituels.audio_url      is 'URL du rituel guidé en audio — si vide, la section audio ne s''affiche pas';
comment on column public.rituels.audio_duration is 'Durée affichée à côté du lecteur audio (ex: "1:00")';
