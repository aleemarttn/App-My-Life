-- =============================================================
-- My Life · Semilla del catálogo global de ejercicios
-- user_id = null → visibles para cualquier usuario, editables por nadie.
--
-- APLICAR CON service_role (editor SQL del panel de Supabase o
-- `supabase db reset`). Las políticas RLS impiden insertarlos desde
-- el cliente a propósito: el catálogo global no es del usuario.
-- =============================================================

insert into public.exercises (id, user_id, name, kind, muscle_group, equipment) values
  -- Pecho
  (gen_random_uuid(), null, 'Press banca plano',          'strength', 'pecho',      'barra'),
  (gen_random_uuid(), null, 'Press banca inclinado',      'strength', 'pecho',      'barra'),
  (gen_random_uuid(), null, 'Press mancuernas plano',     'strength', 'pecho',      'mancuerna'),
  (gen_random_uuid(), null, 'Aperturas en polea',         'strength', 'pecho',      'polea'),
  (gen_random_uuid(), null, 'Fondos en paralelas',        'strength', 'pecho',      'peso corporal'),
  -- Espalda
  (gen_random_uuid(), null, 'Dominadas',                  'strength', 'espalda',    'peso corporal'),
  (gen_random_uuid(), null, 'Jalón al pecho',             'strength', 'espalda',    'polea'),
  (gen_random_uuid(), null, 'Remo con barra',             'strength', 'espalda',    'barra'),
  (gen_random_uuid(), null, 'Remo en polea baja',         'strength', 'espalda',    'polea'),
  (gen_random_uuid(), null, 'Remo con mancuerna',         'strength', 'espalda',    'mancuerna'),
  (gen_random_uuid(), null, 'Pull-over en polea',         'strength', 'espalda',    'polea'),
  -- Pierna
  (gen_random_uuid(), null, 'Sentadilla trasera',         'strength', 'pierna',     'barra'),
  (gen_random_uuid(), null, 'Sentadilla frontal',         'strength', 'pierna',     'barra'),
  (gen_random_uuid(), null, 'Prensa de piernas',          'strength', 'pierna',     'máquina'),
  (gen_random_uuid(), null, 'Peso muerto',                'strength', 'pierna',     'barra'),
  (gen_random_uuid(), null, 'Peso muerto rumano',         'strength', 'pierna',     'barra'),
  (gen_random_uuid(), null, 'Zancadas',                   'strength', 'pierna',     'mancuerna'),
  (gen_random_uuid(), null, 'Extensión de cuádriceps',    'strength', 'pierna',     'máquina'),
  (gen_random_uuid(), null, 'Curl femoral tumbado',       'strength', 'pierna',     'máquina'),
  (gen_random_uuid(), null, 'Hip thrust',                 'strength', 'pierna',     'barra'),
  (gen_random_uuid(), null, 'Elevación de gemelos',       'strength', 'pierna',     'máquina'),
  -- Hombro
  (gen_random_uuid(), null, 'Press militar',              'strength', 'hombro',     'barra'),
  (gen_random_uuid(), null, 'Press hombro mancuernas',    'strength', 'hombro',     'mancuerna'),
  (gen_random_uuid(), null, 'Elevaciones laterales',      'strength', 'hombro',     'mancuerna'),
  (gen_random_uuid(), null, 'Pájaros',                    'strength', 'hombro',     'mancuerna'),
  (gen_random_uuid(), null, 'Face pull',                  'strength', 'hombro',     'polea'),
  -- Brazo
  (gen_random_uuid(), null, 'Curl con barra',             'strength', 'bíceps',     'barra'),
  (gen_random_uuid(), null, 'Curl con mancuernas',        'strength', 'bíceps',     'mancuerna'),
  (gen_random_uuid(), null, 'Curl martillo',              'strength', 'bíceps',     'mancuerna'),
  (gen_random_uuid(), null, 'Extensión de tríceps polea', 'strength', 'tríceps',    'polea'),
  (gen_random_uuid(), null, 'Press francés',              'strength', 'tríceps',    'barra'),
  -- Core
  (gen_random_uuid(), null, 'Plancha',                    'time',     'core',       'peso corporal'),
  (gen_random_uuid(), null, 'Elevación de piernas',       'strength', 'core',       'peso corporal'),
  (gen_random_uuid(), null, 'Rueda abdominal',            'strength', 'core',       'otro'),
  -- Cardio
  (gen_random_uuid(), null, 'Correr',                     'cardio',   'cardio',     'ninguno'),
  (gen_random_uuid(), null, 'Bicicleta estática',         'cardio',   'cardio',     'máquina'),
  (gen_random_uuid(), null, 'Cinta de correr',            'cardio',   'cardio',     'máquina'),
  (gen_random_uuid(), null, 'Elíptica',                   'cardio',   'cardio',     'máquina'),
  (gen_random_uuid(), null, 'Remo ergómetro',             'cardio',   'cardio',     'máquina'),
  (gen_random_uuid(), null, 'Caminar',                    'distance', 'cardio',     'ninguno');
