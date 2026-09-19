-- RPE y RIR son dos datos distintos, no dos nombres del mismo (D34).
--
-- `rir` responde a "cuantas repeticiones me he dejado" y es lo que pauta el
-- entrenador en el Excel (`routine_exercises.target_rir`). `rpe` responde a
-- "como de duro se me ha hecho" en la escala de Borg CR-10, que incluye la
-- fatiga acumulada, el sueno y el estado del dia: una serie a RIR 2 puede
-- salir a RPE 7 un lunes y a RPE 9,5 el viernes. Guardar solo uno de los dos
-- pierde justo la senal que hace util al otro.
--
-- Decimal con un solo decimal porque la escala de RPE se usa en pasos de 0,5
-- (7 - 7,5 - 8...). `rir` se queda como estaba: entero, y sigue siendo la
-- columna que leen `metricas.ts`, el exportador y la vista de resumen.
alter table public.set_logs
  add column rpe numeric(3,1) check (rpe between 0 and 10);

comment on column public.set_logs.rir is
  'Repeticiones en reserva (0-10). Lo que pauta el entrenador.';
comment on column public.set_logs.rpe is
  'Esfuerzo percibido, escala Borg CR-10 en pasos de 0,5. Como se sintio la serie.';

-- La vista de servidor gana la media de RPE al lado de la de RIR. Ninguna
-- grafica de la app la usa (D12: se agrega en cliente), pero el exportador y
-- el futuro agente entrenador leen de aqui.
create or replace view public.v_session_exercise_summary
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
      filter (where not sl.is_warmup)                            as e1rm,
  -- avg_rpe va AL FINAL a proposito: `create or replace view` no deja
  -- insertar una columna en medio de una vista que ya existe.
  round(avg(sl.rpe) filter (where not sl.is_warmup), 2)          as avg_rpe
from public.session_exercises se
join public.workout_sessions ws on ws.id = se.session_id
left join public.set_logs sl on sl.session_exercise_id = se.id
group by se.id, se.user_id, se.session_id, se.exercise_id, ws.started_at;
