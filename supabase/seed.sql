-- =============================================================
-- My Life · Semilla del catálogo global de ejercicios
-- user_id = null → visibles para cualquier usuario, editables por nadie.
--
-- APLICAR CON service_role (editor SQL del panel de Supabase o
-- `supabase db reset`). Las políticas RLS impiden insertarlos desde
-- el cliente a propósito: el catálogo global no es del usuario.
--
-- IDEMPOTENTE: `exercises` no tiene restricción única sobre `name`, así
-- que un insert directo duplicaría el catálogo entero al ejecutarlo dos
-- veces. El `where not exists` de abajo lo hace repetible sin daño.
--
-- Los id salen de gen_random_uuid() (v4) y no de UUID v7, y es correcto:
-- la regla de los v7 aplica a lo que genera el cliente, donde hace falta
-- ordenar por id. Estas filas nacen en el servidor y de una sola vez.
-- =============================================================

insert into public.exercises (id, user_id, name, kind, muscle_group, equipment)
select gen_random_uuid(), null, v.name, v.kind, v.muscle_group, v.equipment
from (values
  -- Pecho
  ('Press banca plano',          'strength', 'pecho',   'barra'),
  ('Press banca inclinado',      'strength', 'pecho',   'barra'),
  ('Press mancuernas plano',     'strength', 'pecho',   'mancuerna'),
  ('Aperturas en polea',         'strength', 'pecho',   'polea'),
  ('Fondos en paralelas',        'strength', 'pecho',   'peso corporal'),
  -- Espalda
  ('Dominadas',                  'strength', 'espalda', 'peso corporal'),
  ('Jalón al pecho',             'strength', 'espalda', 'polea'),
  ('Remo con barra',             'strength', 'espalda', 'barra'),
  ('Remo en polea baja',         'strength', 'espalda', 'polea'),
  ('Remo con mancuerna',         'strength', 'espalda', 'mancuerna'),
  ('Pull-over en polea',         'strength', 'espalda', 'polea'),
  -- Pierna
  ('Sentadilla trasera',         'strength', 'pierna',  'barra'),
  ('Sentadilla frontal',         'strength', 'pierna',  'barra'),
  ('Prensa de piernas',          'strength', 'pierna',  'máquina'),
  ('Peso muerto',                'strength', 'pierna',  'barra'),
  ('Peso muerto rumano',         'strength', 'pierna',  'barra'),
  ('Zancadas',                   'strength', 'pierna',  'mancuerna'),
  ('Extensión de cuádriceps',    'strength', 'pierna',  'máquina'),
  ('Curl femoral tumbado',       'strength', 'pierna',  'máquina'),
  ('Hip thrust',                 'strength', 'pierna',  'barra'),
  ('Elevación de gemelos',       'strength', 'pierna',  'máquina'),
  -- Hombro
  ('Press militar',              'strength', 'hombro',  'barra'),
  ('Press hombro mancuernas',    'strength', 'hombro',  'mancuerna'),
  ('Elevaciones laterales',      'strength', 'hombro',  'mancuerna'),
  ('Pájaros',                    'strength', 'hombro',  'mancuerna'),
  ('Face pull',                  'strength', 'hombro',  'polea'),
  -- Brazo
  ('Curl con barra',             'strength', 'bíceps',  'barra'),
  ('Curl con mancuernas',        'strength', 'bíceps',  'mancuerna'),
  ('Curl martillo',              'strength', 'bíceps',  'mancuerna'),
  ('Extensión de tríceps polea', 'strength', 'tríceps', 'polea'),
  ('Press francés',              'strength', 'tríceps', 'barra'),
  -- Core
  ('Plancha',                    'time',     'core',    'peso corporal'),
  ('Elevación de piernas',       'strength', 'core',    'peso corporal'),
  ('Rueda abdominal',            'strength', 'core',    'otro'),
  -- Cardio
  ('Correr',                     'cardio',   'cardio',  'ninguno'),
  ('Bicicleta estática',         'cardio',   'cardio',  'máquina'),
  ('Cinta de correr',            'cardio',   'cardio',  'máquina'),
  ('Elíptica',                   'cardio',   'cardio',  'máquina'),
  ('Remo ergómetro',             'cardio',   'cardio',  'máquina'),
  ('Caminar',                    'distance', 'cardio',  'ninguno')
) as v(name, kind, muscle_group, equipment)
where not exists (
  select 1 from public.exercises e
  where e.user_id is null and e.name = v.name
);
