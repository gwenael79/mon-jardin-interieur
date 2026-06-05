-- Migration : table mji_clarity_reports
-- Stocke les appels à l'API Clarity + l'analyse IA associée.
-- L'insert se fait uniquement via l'Edge Function clarity-proxy (service_role).
-- Lecture et update ouverts aux utilisateurs authentifiés.

create table if not exists public.mji_clarity_reports (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  report_date date        not null default current_date,
  num_days    int         not null check (num_days between 1 and 3),
  dimensions  text[]      not null default '{}',
  raw_data    jsonb,
  ai_summary  text,
  metrics     jsonb
);

alter table public.mji_clarity_reports enable row level security;

create policy "clarity_read_authenticated"
  on public.mji_clarity_reports
  for select
  to authenticated
  using (true);

create policy "clarity_update_authenticated"
  on public.mji_clarity_reports
  for update
  to authenticated
  using (true)
  with check (true);

-- Pas de policy INSERT pour authenticated :
-- l'insert est réservé au service_role (Edge Function clarity-proxy).
