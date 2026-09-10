-- =============================================================
-- My Life · 0002 · Módulo de entrenamiento
-- Ver docs/spec.md §4
--
-- Notas de diseño que NO deben perderse:
--  · Los id los genera el cliente (UUID v7). Nada de identity.
--  · session_exercises es un SNAPSHOT de lo pautado el día de la
--    sesión. Sin él, cambiar la rutina corrompería el historial.
--  · Tonelaje, volumen y e1RM NO se almacenan. Se calculan en
--    cliente para las gráficas; la vista de abajo es solo para
--    servidor (exportaciones y futuro agente entrenador).
-- =============================================================

-- -------------------------------------------------------------
-- exercises
-- user_id null = ejercicio del catálogo global (semilla).
-- Es la ÚNICA tabla del proyecto que permite filas sin dueño.
-- -------------------------------------------------------------
create table public.exercises (
  id             uuid primary key,
  user_id        uuid references auth.users(id) on delete cascade,
  name           text not null,
  kind           text not null default 'strength'
                 check (kind in ('strength','cardio','time','distance','other')),
  muscle_group   text,
  equipment      text,
  video_url      text,
  is_unilateral  boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index exercises_user_idx on public.exercises (user_id);
create index exercises_name_idx on public.exercises (lower(name));

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;

-- Lectura: los propios y los globales. Escritura: solo los propios.
create policy "exercises_select" on public.exercises
  for select using (user_id is null or auth.uid() = user_id);
create policy "exercises_insert_own" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "exercises_update_own" on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercises_delete_own" on public.exercises
  for delete using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- routines · routine_days · routine_exercises
-- Jerarquía: rutina (mesociclo) → semana → día → ejercicio (D8)
-- -------------------------------------------------------------
create table public.routines (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  active             boolean not null default false,
  source             text check (source in ('excel','manual','coach_api')),
  starts_on          date,
  ends_on            date,
  imported_file_name text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index routines_user_active_idx on public.routines (user_id, active);

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

alter table public.routines enable row level security;
create policy "routines_all_own" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_days (
  id           uuid primary key,
  routine_id   uuid not null references public.routines(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_number  int not null default 1 check (week_number between 1 and 52),
  label        text not null,
  weekday      int check (weekday between 1 and 7),
  position     int not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (routine_id, week_number, position)
);

create index routine_days_routine_idx on public.routine_days (routine_id, week_number);

create trigger routine_days_set_updated_at
  before update on public.routine_days
  for each row execute function public.set_updated_at();

alter table public.routine_days enable row level security;
create policy "routine_days_all_own" on public.routine_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_exercises (
  id                      uuid primary key,
  routine_day_id          uuid not null references public.routine_days(id) on delete cascade,
  user_id                 uuid not null references auth.users(id) on delete cascade,
  exercise_id             uuid not null references public.exercises(id),
  position                int not null,
  target_sets             int,
  target_reps_min         int,
  target_reps_max         int,
  target_weight           numeric(6,2),
  target_rir              int check (target_rir between 0 and 10),
  target_duration_seconds int,
  target_distance_m       int,
  rest_seconds            int default 120,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (routine_day_id, position)
);

create index routine_exercises_day_idx on public.routine_exercises (routine_day_id, position);

create trigger routine_exercises_set_updated_at
  before update on public.routine_exercises
  for each row execute function public.set_updated_at();

alter table public.routine_exercises enable row level security;
create policy "routine_exercises_all_own" on public.routine_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- workout_sessions · session_exercises · set_logs
-- -------------------------------------------------------------
create table public.workout_sessions (
  id               uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  routine_day_id   uuid references public.routine_days(id) on delete set null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  perceived_effort int check (perceived_effort between 1 and 10),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index workout_sessions_user_started_idx
  on public.workout_sessions (user_id, started_at desc);

create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;
create policy "workout_sessions_all_own" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SNAPSHOT de lo pautado ese día. planned guarda una copia de los
-- objetivos en el momento de empezar: si la rutina cambia después,
-- el historial sigue siendo fiel a lo que tocaba entonces.
create table public.session_exercises (
  id                           uuid primary key,
  user_id                      uuid not null references auth.users(id) on delete cascade,
  session_id                   uuid not null references public.workout_sessions(id) on delete cascade,
  routine_exercise_id          uuid references public.routine_exercises(id) on delete set null,
  exercise_id                  uuid not null references public.exercises(id),
  position                     int not null,
  planned                      jsonb not null default '{}'::jsonb,
  substituted_from_exercise_id uuid references public.exercises(id),
  substitution_reason          text,
  skipped                      boolean not null default false,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  unique (session_id, position)
);

create index session_exercises_session_idx on public.session_exercises (session_id, position);
create index session_exercises_exercise_idx on public.session_exercises (user_id, exercise_id);

create trigger session_exercises_set_updated_at
  before update on public.session_exercises
  for each row execute function public.set_updated_at();

alter table public.session_exercises enable row level security;
create policy "session_exercises_all_own" on public.session_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.set_logs (
  id                  uuid primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_index           int not null,
  is_warmup           boolean not null default false,
  weight              numeric(6,2),
  reps                int,
  rir                 int check (rir between 0 and 10),
  duration_seconds    int,
  distance_m          int,
  tags                text[] not null default '{}',
  note                text,
  logged_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (session_exercise_id, set_index)
);

create index set_logs_session_exercise_idx on public.set_logs (session_exercise_id, set_index);
create index set_logs_user_logged_idx on public.set_logs (user_id, logged_at desc);
-- Para la consulta "ejercicios con molestia recurrente" (docs/spec.md §4.9)
create index set_logs_tags_idx on public.set_logs using gin (tags);

create trigger set_logs_set_updated_at
  before update on public.set_logs
  for each row execute function public.set_updated_at();

alter table public.set_logs enable row level security;
create policy "set_logs_all_own" on public.set_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Vista de SERVIDOR (exportaciones y agente entrenador).
-- Las gráficas de la app NO la usan: agregan en cliente (D12).
-- -------------------------------------------------------------
create view public.v_session_exercise_summary
with (security_invoker = true) as
select
  se.id                                   as session_exercise_id,
  se.user_id,
  se.session_id,
  se.exercise_id,
  ws.started_at,
  count(*) filter (where not sl.is_warmup)                       as work_sets,
  sum(sl.weight * sl.reps) filter (where not sl.is_warmup)       as tonnage,
  max(sl.weight) filter (where not sl.is_warmup)                 as top_weight,
  round(avg(sl.rir) filter (where not sl.is_warmup), 2)          as avg_rir,
  -- 1RM estimado (Epley) sobre la mejor serie de trabajo
  max(sl.weight * (1 + sl.reps::numeric / 30))
      filter (where not sl.is_warmup)                            as e1rm
from public.session_exercises se
join public.workout_sessions ws on ws.id = se.session_id
left join public.set_logs sl on sl.session_exercise_id = se.id
group by se.id, se.user_id, se.session_id, se.exercise_id, ws.started_at;
