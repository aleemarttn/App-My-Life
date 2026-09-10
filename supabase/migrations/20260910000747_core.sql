-- =============================================================
-- My Life · 0001 · Núcleo
-- Perfiles, motor de recordatorios y registro de notificaciones.
-- Ver docs/spec.md §3
-- =============================================================

-- -------------------------------------------------------------
-- Utilidades comunes
-- -------------------------------------------------------------

-- Mantiene updated_at al día. Es la base de la resolución de
-- conflictos (last-write-wins) del motor de sincronización.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Crea el perfil automáticamente al registrarse el usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  telegram_chat_id  bigint unique,
  timezone          text not null default 'Atlantic/Canary',
  settings          jsonb not null default '{}'::jsonb,  -- cronómetro on/off, unidades, tema
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- -------------------------------------------------------------
-- reminder_rules
-- Motor de recordatorios compartido por todos los módulos.
-- Lo consume la Edge Function scheduler-tick (pg_cron).
-- -------------------------------------------------------------
create table public.reminder_rules (
  id             uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  module         text not null check (module in ('training','body','car','finance','nutrition')),
  kind           text not null check (kind in ('threshold','schedule')),
  config         jsonb not null,   -- umbral, expresión de calendario, entidad objetivo
  channels       text[] not null default '{telegram}',
  active         boolean not null default true,
  last_fired_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index reminder_rules_user_active_idx
  on public.reminder_rules (user_id, active)
  where deleted_at is null;

create trigger reminder_rules_set_updated_at
  before update on public.reminder_rules
  for each row execute function public.set_updated_at();

alter table public.reminder_rules enable row level security;

create policy "reminder_rules_all_own" on public.reminder_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- notifications_log
-- Solo escribe el servidor (service_role). El cliente solo lee.
-- -------------------------------------------------------------
create table public.notifications_log (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rule_id     uuid references public.reminder_rules(id) on delete set null,
  channel     text not null,
  payload     jsonb not null,
  status      text not null check (status in ('sent','failed')),
  error       text,
  sent_at     timestamptz not null default now()
);

create index notifications_log_user_sent_idx
  on public.notifications_log (user_id, sent_at desc);

alter table public.notifications_log enable row level security;

create policy "notifications_log_select_own" on public.notifications_log
  for select using (auth.uid() = user_id);
-- Sin política de insert: solo el service_role escribe aquí.
