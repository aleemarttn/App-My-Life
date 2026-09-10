# My Life — Especificación técnica y plan de construcción

**Versión:** 0.4
**Fecha:** 09/09/2026
**Autor:** Alejandro Martín
**Estado:** **listo para arrancar la fase 0.** Todas las decisiones de alcance cerradas.

> **Cambios desde v0.3:** cuerpo y salud dejan de ser una pestaña y pasan a vivir dentro de **Perfil** (§5); nueva capa de visualización con el patrón único `DetailView` y gráficas de progresión en todos los módulos (§2.8, §4.9, §5.1, §6.3); **corregida** la regla de datos derivados: se agregan en cliente, no en vistas de Postgres, porque las gráficas deben funcionar sin cobertura.
>
> **Cambios desde v0.2:** dimensión de **semana** en las rutinas (el mesociclo progresa entre semanas, no solo entre días); plantilla de importación con columna `semana`; exportación con una hoja por semana; fotos de progreso en bucket privado de Supabase; integración de Salud de iOS con las cinco métricas.
>
> **Cambios desde v0.1:** comentarios de entrenamiento en tres capas (RIR + etiquetas + texto libre); módulo de entrenamiento generalizado a cualquier tipo de ejercicio; sustitución de ejercicios con trazabilidad; vídeo por ejercicio; exportación a Excel; control de combustible y consumo en el módulo coche; módulo de composición corporal; protocolo de CLAUDE.md.

---

## 0. Qué es esto y qué no es

My Life es una **PWA personal de registro y control** organizada en cinco dominios: entrenamiento, cuerpo, nutrición, economía y coche. No es una app de la App Store, no es (todavía) un producto para terceros, y no sustituye a Nutrigasto.

**Principio rector:** todos los módulos son el mismo patrón —*evento fechado → métricas → objetivo/umbral → alerta → análisis*—. La arquitectura debe hacer que el quinto módulo cueste el 20% del primero.

**Criterio de éxito del MVP:** que a las 6 semanas de usarlo Alejandro siga registrando sus entrenamientos sin obligarse. Nada más.

---

## 1. Decisiones cerradas

| # | Decisión | Elegido |
|---|---|---|
| D1 | Orden de construcción | Entrenamiento primero, luego coche, luego economía, luego nutrición |
| D2 | Captura de datos | Parser único (`parse-entry`), dos frontales: Telegram y PWA |
| D3 | Relación con Nutrigasto | Separados: se reutiliza código, no datos. Nutrición va a la fase 4, tras la entrega del TFG |
| D4 | Naturaleza del proyecto | Personal, con puerta abierta a producto. Multi-tenant en datos (`user_id` + RLS), single-user en UX |
| D5 | Comentarios de entrenamiento | Tres capas: RIR (número) + etiquetas (categoría) + nota libre (matiz). Ver §4.4 |
| D6 | Intercambio con el entrenador | Excel bidireccional como contrato de datos. Ver §4.6 |
| D7 | Navegación | Dashboard + 4 pestañas inferiores. Ver §2.7 |
| D8 | Jerarquía de la rutina | Rutina (mesociclo) → **semana** → día → ejercicio. Ver §4.3 |
| D9 | Fotos de progreso | Supabase Storage, bucket privado con URLs firmadas. Ver §5 |
| D10 | Salud de iOS | Vía Atajos, con las cinco métricas: peso, pasos, calorías activas, sueño y FC en reposo. Ver §9 |
| D11 | Cuerpo y salud | **No** es una pestaña propia: vive dentro de **Perfil**, en la cabecera. Ver §2.7 y §5 |
| D12 | Gráficas | Patrón único `DetailView` reutilizado por todos los módulos. Agregación en cliente, no en Postgres. Ver §2.8 |

### 1.1 Por qué el coche va en segunda posición

El módulo de coche es el más barato de construir (cuatro tablas, un cron, UI mínima) y valida la pieza de infraestructura más frágil del proyecto —las notificaciones programadas—, que después reutilizan todos los demás módulos. Además, el evento **repostaje** es simultáneamente un gasto y una lectura de odómetro, así que el módulo de coche prepara el terreno del módulo económico en lugar de competir con él.

---

## 2. Arquitectura

### 2.1 Stack

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | **Vite + React + TypeScript** | La app es 100% interactiva tras el login y no necesita SEO. Astro (usado en RPRE) brilla en contenido estático con islas; aquí solo añadiría fricción de enrutado y estado cliente. |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, service worker y precaché del app-shell sin escribir SW a mano. |
| Estilos | **Tailwind CSS** | Control fino de zonas táctiles, crítico en el modo entreno. |
| Estado servidor | **TanStack Query** | Caché, revalidación y estados de carga/error resueltos. |
| Persistencia local | **Dexie (IndexedDB)** | Obligatorio (§2.3). `localStorage` no sirve: síncrono, ~5 MB, sin índices. |
| Excel | **SheetJS (xlsx)** | Import y export en el navegador. El archivo nunca sale del dispositivo. |
| Backend | **Supabase** — Postgres, Auth, RLS, Storage, Edge Functions, `pg_cron` | Ya lo usas y cubre los cinco requisitos sin añadir proveedores. |
| Hosting | **Netlify** | Mantener el que ya usas. |
| Notificaciones | **Telegram Bot API** (principal) + Web Push (secundaria) | §2.4 |

### 2.2 Estructura del repositorio

```
my-life/
├── CLAUDE.md                  # contrato de trabajo — ver §7
├── docs/
│   ├── spec.md                # este documento
│   ├── decisiones.md          # log de decisiones (ADR ligero)
│   └── estado.md              # qué está hecho y qué no
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── parse-entry/       # parser híbrido compartido
│       ├── telegram-webhook/
│       ├── health-ingest/     # endpoint para Atajos de iOS (fase 3)
│       └── scheduler-tick/    # invocada por pg_cron
├── src/
│   ├── app/                   # shell, router, layout, nav
│   ├── modules/
│   │   ├── training/
│   │   ├── body/
│   │   ├── car/
│   │   ├── finance/
│   │   └── nutrition/
│   ├── core/
│   │   ├── db/                # Dexie, outbox, motor de sync
│   │   ├── supabase/          # cliente, tipos generados
│   │   ├── xlsx/              # import/export compartido
│   │   └── ui/                # design system compartido
│   └── main.tsx
```

**Regla de oro:** un módulo nunca importa de otro módulo. Si dos módulos necesitan lo mismo, sube a `core/`.

### 2.3 Offline-first (no negociable)

Los gimnasios son sótanos de hormigón. Si la app depende de la red durante un entrenamiento, el proyecto muere el primer día que falle la cobertura.

**Patrón: local-first con outbox.**

1. Toda escritura va **primero** a Dexie, con `id` generado en cliente (UUID v7, ordenable temporalmente).
2. La misma escritura se encola en `outbox`: `{id, tabla, operacion, payload, intentos, creado_en}`.
3. La UI lee **siempre** de Dexie. Nunca espera a la red para pintar.
4. Un worker vacía la `outbox` al recuperar conexión, con reintento exponencial.
5. Conflictos: *last-write-wins* por `updated_at`. Con un usuario y un dispositivo es suficiente.
6. La `outbox` **no borra** un registro hasta recibir confirmación del servidor.

**Consecuencia:** los `id` los genera el cliente. Nada de `serial`/`identity`.

### 2.4 Notificaciones programadas

Una PWA **no puede despertarse sola**: el service worker solo ejecuta cuando el navegador lo despierta, y Background Sync no existe en iOS. Todo recordatorio nace en el servidor.

```
pg_cron (cada hora)
   └─> Edge Function scheduler-tick
         ├─ consulta reglas vencidas (umbral de km, recordatorio quincenal, etc.)
         ├─ envía por Telegram Bot API   ← canal principal, fiable
         └─ envía por Web Push           ← secundario, best-effort
```

**Por qué Telegram como principal:** Web Push en iOS exige ≥16.4, la app instalada en pantalla de inicio, y la suscripción se pierde al desinstalar o limpiar datos. Telegram no tiene esas restricciones y ya está montado.

### 2.5 Parser único (D2)

Edge Function `parse-entry`. Entrada `{texto, canal, user_id}`, salida un evento tipado o una petición de aclaración.

1. **Capa determinista (regex + diccionario).** Cubre el 80–90% del uso real, que es repetitivo: `"gasolina 62 45.2 231450"`, `"aceite 231450"`. Coste y latencia cero, resultado predecible.
2. **Capa LLM (fallback).** Solo si la capa 1 no alcanza confianza. JSON estricto contra esquema. Se registra cada llamada para convertir después los patrones frecuentes en reglas de la capa 1.

**Anti-patrón:** mandar todo al LLM. Añade latencia a la acción más frecuente, cuesta dinero en cada gasto y falla de forma no reproducible.

### 2.6 Seguridad

- RLS en **todas** las tablas, política `auth.uid() = user_id`. Sin excepciones.
- La clave `anon` es pública por diseño: la seguridad vive en las políticas.
- Tokens de Telegram y claves de LLM **solo** en variables de entorno de Edge Functions. Nunca en el bundle.
- El webhook de Telegram valida el `secret_token` de cabecera y una lista blanca de `chat_id`.
- **Fotos de progreso**: bucket privado de Supabase Storage, políticas por `user_id`, acceso solo mediante URLs firmadas de caducidad corta. Nunca un bucket público.

### 2.7 Navegación (D7, D11)

Barra inferior de 5 elementos, ordenados por frecuencia de uso real:

```
[ Inicio ]  [ Entreno ]  [ Comida ]  [ Dinero ]  [ Coche ]
```

**Perfil** vive en la cabecera (avatar arriba a la derecha), **no en la barra inferior** (D11). Es el contenedor de todo lo que eres tú y no una actividad: cuerpo, salud, ajustes y datos de la cuenta. Ver §5.

**Por qué ahí y no como sexta pestaña:** las cinco pestañas inferiores son *acciones que haces a diario*; el perfil es *consulta y configuración*, que se abre una vez a la semana. Meterlo abajo le daría el mismo peso visual que a "Entreno" y competiría por el espacio del pulgar sin merecerlo. Además, seis elementos en una barra inferior ya rompen la zona táctil cómoda en pantallas de 6".

**Dashboard "Inicio"** — lo que ves al abrir la app:
- Entrenamiento de hoy (o botón de empezar / "descanso").
- Alertas activas del coche (próximo mantenimiento, km pendientes de actualizar).
- Gasto acumulado del mes vs. presupuesto.
- Macros del día vs. objetivo (fase 4).
- Peso actual y tendencia a 30 días (enlace al perfil).

Cada tarjeta es un acceso directo a su módulo. Tema oscuro por defecto.

### 2.8 Vistas de detalle y gráficas (D12)

Quieres poder pinchar en cualquier cosa con historial y ver su progresión. La forma correcta de resolverlo **no es diseñar doce pantallas**, sino un patrón único reutilizado por todos los módulos.

**Patrón `<DetailView>`** — idéntico para un ejercicio, tu peso, una medida corporal, una categoría de gasto o el consumo del coche:

```
┌────────────────────────────────┐
│  ← SENTADILLA                  │
│                                │
│  105 kg          ▲ +12,5 kg    │  ← valor actual + delta del periodo
│  e1RM estimado   últimos 90 d  │
│                                │
│  ╭──────────────────────────╮  │
│  │      [ gráfico ]         │  │  ← serie temporal
│  ╰──────────────────────────╯  │
│  [ 30 d ] [ 90 d ] [ 1 a ] [ ⌂ ]│ ← rango temporal
│  [ e1RM ▾ ]                    │  ← selector de métrica
│                                │
│  ── Registros ──────────────   │
│  12 sep · 4×8 · 100 kg · RIR 2 │  ← lista, la más reciente arriba
│  09 sep · 4×8 · 100 kg · RIR 1 │
└────────────────────────────────┘
```

Un solo componente, una sola implementación, y cada módulo solo aporta: qué métricas ofrece, cómo se calculan y cómo se formatea cada registro.

**Consecuencia técnica importante — corrige una regla de la v0.2.** En v0.2 dije que los datos derivados se calcularían en vistas de Postgres. Con gráficas en todas partes y la app siendo offline-first, eso **no vale**: en el gimnasio, sin cobertura, una vista de Postgres es inalcanzable. Regla corregida:

> Toda agregación que alimente una gráfica se calcula **en el cliente**, a partir de los datos de Dexie. Las vistas de Postgres se reservan para lo que ocurre en servidor: exportaciones, el `scheduler-tick` y el futuro acceso del agente entrenador.

Los volúmenes lo permiten de sobra: un año de entrenamientos son unos pocos miles de filas, nada para IndexedDB.

**Librería: Recharts**, con dos condiciones:
1. **Carga diferida** (`React.lazy`). El bundle de gráficas (~100 kB gzip con las dependencias de d3) no puede penalizar el arranque del modo entreno, que es la pantalla crítica.
2. Un único envoltorio `core/ui/MetricChart` con los ejes, colores, formatos y estados vacíos ya resueltos. Ningún módulo instancia Recharts directamente; así todas las gráficas de la app se ven igual y se cambian de librería en un solo sitio si algún día hace falta.

**Regla de contenido:** cada gráfica responde a **una** pregunta concreta. Si no sabes qué pregunta responde, no se construye. El fracaso típico de estas apps es llenarse de gráficos bonitos que nadie mira.

---

## 3. Modelo de datos — núcleo

> **Dos columnas que aparecen en casi todas las tablas y no son decorativas.**
> `updated_at`, mantenida por el trigger `set_updated_at()`, es la que resuelve
> los conflictos: el *last-write-wins* de §2.3 no tiene con qué comparar sin ella.
> `deleted_at` implementa el borrado lógico, porque un borrado real no se puede
> propagar entre dispositivos sin lápidas y además impide deshacer. Solo la llevan
> las entidades con vida propia; los hijos de una rutina o de una sesión
> desaparecen en cascada con su padre.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  telegram_chat_id bigint unique,
  timezone text not null default 'Atlantic/Canary',
  settings jsonb not null default '{}'::jsonb,  -- cronómetro on/off, unidades, tema
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Motor de recordatorios, compartido por todos los módulos.
create table reminder_rules (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,                 -- 'car' | 'training' | 'finance' | 'body' | 'nutrition'
  kind text not null,                   -- 'threshold' | 'schedule'
  config jsonb not null,
  channels text[] not null default '{telegram}',
  active boolean not null default true,
  last_fired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Solo escribe el servidor (service_role): no tiene política de insert.
-- Por eso tampoco lleva updated_at: una notificación no se modifica.
create table notifications_log (
  id uuid primary key,
  user_id uuid not null,
  rule_id uuid references reminder_rules(id) on delete set null,
  channel text not null,
  payload jsonb not null,
  status text not null,                 -- 'sent' | 'failed'
  error text,
  sent_at timestamptz not null default now()
);
```

---

## 4. Módulo entrenamiento (fase 1)

### 4.1 Alcance revisado

Tú lo has acotado y con razón. Lo que hace la fase 1:

1. **Importar** la rutina desde el Excel del entrenador.
2. **Mostrar** el entrenamiento del día de forma legible (`Sentadilla · 2×15 kg × 15 reps`).
3. **Registrar** en vivo, serie a serie, en modo secuencial bloqueante.
4. **Sustituir** un ejercicio si la máquina está ocupada, dejando constancia.
5. **Enlace de vídeo** de YouTube por ejercicio, visible durante el entreno.
6. **Historial** permanente en la app, independiente del Excel.
7. **Exportar** a Excel para el entrenador.
8. Funcionar **offline** de principio a fin.

**Fuera de la fase 1:** planificación automática de mesociclos, gráficas avanzadas, biblioteca de ejercicios con ilustraciones, compartir con terceros.

### 4.2 Cualquier tipo de ejercicio (asunción 5 confirmada)

El entrenador puede pautar gimnasio, carrera o trabajo en casa. El modelo no puede asumir "series × reps × peso".

```sql
create table exercises (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,  -- null = catálogo global
  name text not null,
  kind text not null,                   -- 'strength' | 'cardio' | 'time' | 'distance' | 'other'
  muscle_group text,
  equipment text,
  video_url text,                       -- enlace de YouTube (§4.5)
  is_unilateral boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

Según `kind`, la UI de registro cambia y los campos relevantes de `set_logs` varían:

| kind | Campos que se piden | Ejemplo |
|---|---|---|
| `strength` | peso, reps, RIR | Press banca 80 kg × 8 |
| `cardio` | distancia, duración, ritmo | Correr 5 km / 27:30 |
| `time` | duración | Plancha 60 s |
| `distance` | distancia | Paseo 3 km |

### 4.3 Rutinas y sesiones

```sql
create table routines (
  id uuid primary key,
  user_id uuid not null,
  name text not null,                   -- 'Mesociclo 3 - octubre'
  active boolean not null default false,
  source text,                          -- 'excel' | 'manual' | 'coach_api'
  starts_on date, ends_on date,
  imported_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- El mesociclo progresa ENTRE semanas: la semana 3 no lleva los mismos kilos
-- que la semana 1. Sin esta dimensión, importar un mesociclo de 4 semanas
-- machacaría los objetivos de la semana anterior.
create table routine_days (
  id uuid primary key,
  routine_id uuid not null references routines(id) on delete cascade,
  user_id uuid not null,
  week_number int not null default 1,   -- 1..N dentro del mesociclo
  label text not null,                  -- 'Lunes - Pierna'
  weekday int,                          -- 1..7, opcional
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, week_number, position)
);

create table routine_exercises (
  id uuid primary key,
  routine_day_id uuid not null references routine_days(id) on delete cascade,
  user_id uuid not null,
  exercise_id uuid not null references exercises(id),
  position int not null,
  target_sets int,
  target_reps_min int, target_reps_max int,
  target_weight numeric(6,2),
  target_rir int,
  target_duration_seconds int,
  target_distance_m int,
  rest_seconds int default 120,
  notes text,                           -- indicación del entrenador: 'tempo 3-1-1'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_day_id, position)
);

create table workout_sessions (
  id uuid primary key,
  user_id uuid not null,
  routine_day_id uuid references routine_days(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  perceived_effort int,                 -- RPE global 1..10
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- SNAPSHOT: al empezar la sesión se copian aquí los routine_exercises del día.
-- Esto es lo que permite sustituir un ejercicio sin corromper la rutina,
-- y que el historial siga siendo correcto aunque la rutina cambie después.
create table session_exercises (
  id uuid primary key,
  user_id uuid not null,
  session_id uuid not null references workout_sessions(id) on delete cascade,
  routine_exercise_id uuid references routine_exercises(id) on delete set null,
  exercise_id uuid not null references exercises(id),
  position int not null,
  planned jsonb not null,               -- copia de los objetivos en el momento de empezar
  substituted_from_exercise_id uuid references exercises(id),
  substitution_reason text,             -- 'máquina ocupada', 'molestia', ...
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, position)
);

create table set_logs (
  id uuid primary key,
  user_id uuid not null,
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  set_index int not null,
  is_warmup boolean not null default false,
  weight numeric(6,2),
  reps int,
  rir int,
  duration_seconds int,
  distance_m int,
  tags text[] not null default '{}',
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_exercise_id, set_index)
);
```

> Los bloques SQL de arriba son la referencia funcional. La forma exacta y
> ejecutable, con sus índices, triggers y políticas RLS, vive en
> `supabase/migrations/`, que es lo que manda si algún día discrepan.

**Por qué el snapshot (`session_exercises`) es importante:** sin él, si en enero hiciste sentadilla con 80 kg pautados y en marzo el entrenador cambia la rutina a 90 kg, tu historial de enero mostraría 90 kg como objetivo. El historial dejaría de ser auditable. Con snapshot, cada sesión conserva lo que estaba pautado *ese día*, y la sustitución de un ejercicio es simplemente un campo más de esa copia.

### 4.4 Los comentarios, en tres capas (D5)

Tenías razón: el texto libre es imprescindible porque su consumidor final es tu entrenador, no la app. Pero eso no es motivo para renunciar a lo estructurado. Cada capa tiene un consumidor distinto:

| Capa | Formato | Quién lo consume | Ejemplo |
|---|---|---|---|
| **RIR** | Entero 0–5 | La app, para sugerir progresión | 15 reps con RIR 4 ≠ 15 reps con RIR 0 |
| **Etiquetas** | Chips cerrados, multiselección | La app, para detectar patrones | `molestia` recurrente en press militar |
| **Nota libre** | Texto | Tu entrenador / tu IA | "me crujió el hombro en la tercera, cambié de agarre" |

Etiquetas disponibles: `facil` · `al_fallo` · `fallo_tecnico` · `molestia` · `sin_energia` · `buen_dia` · `ayuda`.

Tu ejemplo de "hice las 15 pautadas pero sobrado" queda resuelto por el RIR sin escribir nada. El texto libre es para lo que el número no captura. Las tres capas van al Excel exportado.

### 4.5 Vídeo por ejercicio

Campo `video_url` en `exercises` (por ejercicio, no por rutina: lo configuras una vez y sirve para siempre).

- En la ficha del ejercicio y en el modo entreno aparece un icono de vídeo.
- **No se reproduce embebido durante el entreno**: se abre en una hoja inferior con el reproductor de YouTube, para que un vídeo pesado no bloquee la pantalla de registro ni consuma datos sin querer.
- Se guarda también la miniatura cacheada para que el icono funcione offline; el vídeo en sí obviamente necesita red.

### 4.6 Intercambio con el entrenador (D6) — las dos opciones

Me pediste que planteara ambas.

**Opción A — Excel bidireccional (recomendada para empezar).**
El entrenador te pasa el Excel como hasta ahora; tú lo importas. Al acabar el mesociclo exportas otro Excel con todo el registro (incluidas las tres capas de comentarios) y se lo pasas.

- *Viabilidad:* alta. SheetJS resuelve import y export en el navegador, sin backend.
- *Coste:* ~4–5 días de trabajo, casi todo en el emparejamiento de nombres de ejercicios.
- *Ventaja:* el entrenador no cambia de herramienta ni aprende nada. Cero fricción para él, que es quien menos incentivo tiene para adaptarse.
- *Inconveniente:* paso manual al principio y al final de cada bloque.

**Opción B — El entrenador entra directamente en el sistema.**
Roles `coach` / `athlete`, invitaciones, una UI para que él construya rutinas.

- *Viabilidad:* técnicamente sí, pero es **construir el producto**, no la app personal. Auth con roles, políticas RLS cruzadas, pantallas de gestión, onboarding.
- *Coste:* multiplica por 3 o 4 el módulo de entrenamiento.
- *Cuándo tiene sentido:* si decides ir a por el mercado de entrenadores (§6). Hoy, no.

**El matiz que lo cambia todo:** dices que tu entrenador va a ser **una IA que tú mismo vas a construir**. Si es así, el Excel es un puente innecesario a medio plazo — un agente tuyo puede leer y escribir directamente en Supabase con una clave de servicio. Es decir: no construyas la opción B para un humano; construye la opción A ahora y deja la puerta abierta a que tu agente use la base de datos directamente después.

**Decisión:** Excel bidireccional en la fase 1. El diseño de la base de datos ya está preparado para que un agente escriba `routines` / `routine_days` / `routine_exercises` directamente (por eso `routines.source` contempla `'coach_api'`). La exportación a Excel se mantiene siempre como red de seguridad, aunque llegue el agente.

**Formato canónico de importación** (una fila por ejercicio):

| semana | dia | ejercicio | tipo | series | reps_min | reps_max | peso | rir | duracion_seg | distancia_m | descanso_seg | video_url | notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lunes - Pierna | Sentadilla | strength | 2 | 15 | 15 | 15 | 2 | | | 120 | https://... | subir si sobra |
| 1 | Miércoles - Cardio | Correr | cardio | | | | | | 1800 | 5000 | | | ritmo suave |
| 2 | Lunes - Pierna | Sentadilla | strength | 3 | 12 | 15 | 17.5 | 2 | | | 120 | | |

**Por qué este formato absorbe la variabilidad que te preocupa.** Que una semana tengas 3 días de gimnasio y 2 de cardio, y la siguiente 4 de gimnasio, **no es un cambio de formato**: son simplemente filas distintas con otro valor en `semana` y `dia`. Las columnas no se mueven. El importador no necesita saber cuántos días ni de qué tipo hay: lee filas, las agrupa por `semana` y `dia`, y crea la estructura que encuentre. Si un mes son 3 semanas y otro 5, da igual.

Lo único que sí rompería el importador es que cambien los **nombres o el orden de las columnas**. Por eso la plantilla se acuerda una vez con el entrenador y no se toca.

**Proceso de importación:**
1. Seleccionas el archivo (no sale del dispositivo, se parsea en el navegador con SheetJS).
2. **Validación**: columnas presentes, tipos correctos, valores coherentes. Errores señalados por fila antes de importar nada.
3. **Emparejamiento difuso** de nombres contra el catálogo (`sentadilla` → `Sentadilla trasera con barra`), con resolución manual de los no encontrados y creación de ejercicios nuevos sobre la marcha.
4. **Previsualización** de la estructura resultante: semanas, días y ejercicios, tal y como quedarán.
5. Confirmación e inserción.

**Formato de exportación** (una hoja por semana del mesociclo, según lo acordado):

```
Mesociclo_3_octubre.xlsx
├── Semana 1     ← una fila por serie registrada
├── Semana 2
├── Semana 3
├── Semana 4
└── Resumen      ← por ejercicio: series totales, tonelaje, RIR medio,
                   etiquetas acumuladas, sustituciones y cumplimiento
```

Cada fila de una hoja de semana lleva: `fecha`, `dia`, `ejercicio`, `sustituido_de`, `motivo_sustitucion`, `serie`, `peso_pautado`, `peso_real`, `reps_pautadas`, `reps_reales`, `rir`, `etiquetas`, `nota`.

**El detalle que hace útil la exportación:** cada fila lleva lo pautado *y* lo hecho, uno al lado del otro. Tu entrenador (o tu IA) ve la desviación de un vistazo, sin cruzar dos archivos. Eso es posible precisamente gracias al snapshot de `session_exercises` (§4.3).

### 4.7 Modo entreno — secuencial y bloqueante

La pantalla que decide el proyecto. Se usa de pie, sudando, con una mano.

**Comportamiento confirmado:** una sola serie visible. Hasta que no rellenes la serie 1 no aparece la 2. Sin listas de series ni tablas: un paso cada vez.

```
┌────────────────────────────────┐
│  SENTADILLA              [▶]   │  ← icono de vídeo
│  Serie 1 de 2                  │
│                                │
│      15 kg × 15 reps           │  ← objetivo, grande
│                                │
│        ┌──────────┐            │
│   [−]  │    15    │  [+]       │  ← reps hechas, stepper grande
│        └──────────┘            │
│        ┌──────────┐            │
│   [−]  │   15 kg  │  [+]       │  ← peso, prerrellenado
│        └──────────┘            │
│                                │
│  RIR:  0  1  2  3  4  5        │
│  [fácil] [al fallo] [molestia] │  ← chips opcionales
│  [ + nota ]                    │
│                                │
│  ╔══════════════════════════╗  │
│  ║     SERIE COMPLETADA     ║  │  ← zona del pulgar
│  ╚══════════════════════════╝  │
│  [ sustituir ]  [ saltar ]     │
└────────────────────────────────┘
```

**Reglas:**
- Peso y reps vienen prerrellenados con el objetivo. El 90% de las veces no se tocan.
- Steppers de botones grandes, no teclado del sistema. Registrar una serie: menos de 2 segundos, sin mirar.
- Todos los controles en el tercio inferior.
- Al confirmar: cronómetro de descanso a pantalla completa con aviso háptico. **Activable/desactivable en ajustes** (asunción 3).
- Pantalla siempre encendida durante la sesión (Screen Wake Lock API).
- `Sustituir` abre el buscador del catálogo y registra el motivo en `session_exercises`.
- La sesión se puede abandonar y retomar: el estado vive en Dexie.

### 4.8 Progresión

**Doble progresión, sugerida y confirmada a mano.** Si completaste el techo del rango de repeticiones en todas las series de trabajo con RIR ≥ 2, la app propone subir. Propone; no decide. Nunca ajustes automáticos silenciosos: destruyen la confianza en los datos y no puedes auditar por qué cambió el plan.

### 4.9 Gráficas de entrenamiento (D12)

Al pinchar en cualquier ejercicio del historial o del catálogo se abre su `DetailView` (§2.8) con estas métricas seleccionables:

| Métrica | Gráfico | Qué pregunta responde |
|---|---|---|
| **e1RM estimado** | Línea | *¿Estoy más fuerte que hace tres meses?* — **la métrica principal** |
| Peso máximo por sesión | Línea | ¿Cuánto muevo hoy en mi mejor serie? |
| Tonelaje (peso × reps, sumado) | Barras | ¿Cuánto trabajo total estoy haciendo? |
| RIR medio | Línea | ¿Me estoy exigiendo más o menos? |
| Reps totales por sesión | Barras | Útil en accesorios donde el peso apenas se mueve |

**Por qué el e1RM es la métrica principal y no el peso máximo.** El peso máximo miente cuando cambia el rango de repeticiones: 100 kg × 5 y 80 kg × 12 son esfuerzos casi equivalentes, pero el gráfico de "peso máximo" mostraría una caída del 20% que no existe. El **1RM estimado** normaliza ambas cosas en un solo número comparable a lo largo del tiempo. Fórmula de Epley, que es la estándar y basta de sobra:

```
e1RM = peso × (1 + reps / 30)
```

Se calcula en cliente, sobre la mejor serie de trabajo de cada sesión (excluyendo calentamientos). Es una estimación, no una medición: la app debe etiquetarla como "estimado" y no presentarla como un récord real.

**Marcadores sobre el eje temporal:** las sesiones con etiqueta `molestia` se marcan con un punto rojo, y las sustituciones con un punto hueco. Así, cuando veas un estancamiento en la curva, ves de un vistazo si coincide con molestias o con semanas en las que no pudiste hacer el ejercicio pautado. Esa correlación visual es justo lo que le sirve a tu entrenador.

**Vistas globales** (en la portada del módulo, no por ejercicio):
- **Volumen semanal por grupo muscular** — barras apiladas. Detecta desequilibrios.
- **Adherencia** — sesiones completadas vs. planificadas por semana.
- **Ejercicios con `molestia` recurrente** — lista, no gráfico. Un ranking se lee mejor que una curva.

---

## 5. Perfil: cuerpo y salud (D11)

**No es una pestaña de la barra inferior.** Se accede desde el avatar de la cabecera y agrupa todo lo que eres tú, no lo que haces: composición corporal, datos de Salud, ajustes y cuenta.

```
PERFIL
├── Cuerpo          peso · medidas · fotos · comparador
├── Salud           datos de Salud de iOS (§9)
├── Objetivos       peso objetivo, macros objetivo, RIR de referencia
├── Ajustes         cronómetro on/off, tema, unidades, Telegram
└── Datos           exportar todo a JSON · cerrar sesión
```

Zona de composición corporal: peso, medidas y fotos de progreso.

```sql
create table body_metrics (
  id uuid primary key,
  user_id uuid not null,
  measured_on date not null,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  measurements jsonb,     -- {"cintura": 82, "pecho": 104, "biceps_d": 38, ...}
  notes text,
  unique (user_id, measured_on)
);

create table body_photos (
  id uuid primary key,
  user_id uuid not null,
  taken_on date not null,
  pose text not null,     -- 'frontal' | 'lateral' | 'espalda'
  storage_path text not null,   -- bucket PRIVADO
  metric_id uuid references body_metrics(id) on delete set null
);
```

**Funcionalidad clave:** comparador lado a lado de dos fechas, misma pose. Es lo único que hace que las fotos merezcan la pena; una galería cronológica no aporta nada.

**Seguridad (D9 — decidido):** bucket **privado** de Supabase Storage, política RLS por `user_id`, acceso exclusivamente mediante URLs firmadas con caducidad de 60 segundos. Nunca un bucket público ni rutas adivinables. Las imágenes se redimensionan y comprimen en el cliente antes de subirlas (máx. 1600 px de lado largo, WebP), lo que reduce coste de almacenamiento y tiempo de subida.

**Verificación obligatoria antes de subir la primera foto:** probar con una sesión anónima que un `select` sobre el bucket devuelve vacío y que una URL de objeto sin firmar da 403. Es una comprobación de cinco minutos que evita el único riesgo grave de este módulo.

**Recordatorio:** una `reminder_rule` semanal o quincenal para pesarte y hacer fotos, con el mismo motor del módulo coche.

### 5.1 Gráficas de cuerpo y salud (D12)

| Métrica | Gráfico | Nota |
|---|---|---|
| **Peso** | Línea de puntos diarios + **media móvil de 7 días** superpuesta | Ver abajo |
| Cada medida corporal | Línea, medida seleccionable | Cintura y pecho son las que más dicen |
| % graso | Línea | Solo si lo mides con algo consistente |
| Pasos y kcal activas | Barras diarias + media semanal | Contexto de actividad |
| Sueño | Barras diarias + media de 7 días | Cruzable con las etiquetas `sin_energia` |
| FC en reposo | Línea con media móvil de 7 días | Sube antes de que notes fatiga acumulada |

**Por qué la media móvil no es un adorno en el peso.** El peso diario es en su mayoría ruido: agua, sodio, glucógeno y contenido intestinal mueven fácilmente ±1,5 kg de un día para otro, mucho más que la grasa que puedes ganar o perder en 24 horas. Mirar el dato crudo lleva a conclusiones falsas y a decisiones malas. **La señal es la media móvil de 7 días**; el punto diario solo se dibuja para dar contexto, más pequeño y en un color secundario. En el dashboard de Inicio se muestra únicamente la media, nunca el valor del día.

**Cruce con entrenamiento:** una vista que superpone la media de sueño de la semana con el número de series marcadas `sin_energia`. Es la correlación con más rendimiento práctico de toda la app y sale gratis en cuanto existan las dos series de datos.

---

## 6. Módulo coche (fase 2)

### 6.1 Vehículo, odómetro y mantenimientos

```sql
create table vehicles (
  id uuid primary key,
  user_id uuid not null,
  name text not null,                   -- 'Astra H'
  make text, model text, year int, engine text,
  plate text,
  fuel_type text,                       -- 'gasolina' | 'diesel'
  tank_capacity_l numeric(5,1),         -- 52 en el Astra H
  current_odometer int not null,
  odometer_updated_at timestamptz not null default now()
);

create table odometer_readings (
  id uuid primary key,
  user_id uuid not null,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  km int not null,
  read_at timestamptz not null default now(),
  source text not null                  -- 'manual' | 'refuel' | 'maintenance'
);

create table maintenance_items (
  id uuid primary key,
  user_id uuid not null,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  name text not null,                   -- 'Cambio de aceite y filtro', 'ITV', 'Seguro'
  interval_km int,                      -- null en los que solo son de calendario
  interval_months int,                  -- lo que venza antes manda
  alert_km_before int default 500,
  alert_days_before int default 15,
  active boolean not null default true
);

create table maintenance_logs (
  id uuid primary key,
  user_id uuid not null,
  vehicle_id uuid not null,
  item_id uuid references maintenance_items(id) on delete set null,
  performed_at date not null,
  odometer int not null,
  cost numeric(8,2),
  workshop text, parts text, notes text,
  expense_id uuid                       -- enlace con finanzas (fase 3)
);
```

ITV, seguro e impuestos entran como `maintenance_items` con `interval_months` y sin `interval_km` (asunción 7 confirmada). Los intervalos los defines tú; no se precarga plantilla del fabricante (asunción 8).

### 6.2 Combustible y consumo (nuevo)

```sql
create table fuel_logs (
  id uuid primary key,
  user_id uuid not null,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  filled_at timestamptz not null,
  odometer int not null,
  liters numeric(5,2) not null,
  price_per_liter numeric(5,3),
  total_cost numeric(7,2) not null,
  is_full_tank boolean not null default true,   -- CRÍTICO, ver abajo
  station text,
  expense_id uuid                       -- enlace con finanzas (fase 3)
);
```

**El detalle técnico que suele fallar:** el consumo real solo se puede calcular **de depósito lleno a depósito lleno**. Si repostas 20 € sin llenar, no sabes cuánto combustible había antes ni después, y el cálculo se corrompe. Por eso `is_full_tank` no es un adorno:

```
consumo (L/100km) = litros_de_este_repostaje / (odómetro_actual − odómetro_del_anterior_lleno) × 100
```
…y solo se calcula cuando **ambos** repostajes son a depósito lleno. Los repostajes parciales se registran igual (el gasto es real) pero se acumulan hasta el siguiente lleno, momento en el que se computa el tramo completo. La app debe mostrar el consumo del último tramo, la media móvil de los últimos 5 tramos y el histórico.

**Lo que esto te da, que era tu objetivo:**
- **€/100 km** reales, no estimados.
- **Coste por km** total (combustible + mantenimiento / km recorridos): el número que de verdad necesitas para presupuestar.
- **Proyección mensual**: con tu media de km/mes y tu consumo real, el gasto esperado en combustible del mes que viene. Esto entra directo en el módulo de presupuestos de la fase 3.
- **Detección de anomalías**: si el consumo sube un 15% de forma sostenida, hay algo mal (filtro, presión de neumáticos, sonda lambda). Una alerta ahí paga la app entera.

**Bonus:** el repostaje es el evento que mantiene fresco el odómetro. Si registras cada repostaje, el recordatorio quincenal de "añade tus km" casi nunca hará falta — pero se queda como red de seguridad.

### 6.3 Gráficas del coche (D12)

| Métrica | Gráfico | Qué pregunta responde |
|---|---|---|
| **Consumo L/100 km** | Línea por tramo + media móvil de 5 | ¿Está consumiendo más de lo normal? |
| Coste por km | Línea mensual | El número real para presupuestar |
| €/mes en combustible | Barras | Alimenta el presupuesto de la fase 3 |
| Km por mes | Barras | Base de la proyección de mantenimientos |
| Precio del litro pagado | Línea | Detecta si estás repostando siempre caro |

Sobre el gráfico de consumo se marcan los mantenimientos hechos (`maintenance_logs`), para que veas si un cambio de filtro o unos neumáticos nuevos movieron el consumo. Esa relación causa-efecto es imposible de ver en una hoja de cálculo y es lo que convierte el registro en algo accionable.

### 6.4 Proyección de mantenimientos

Con las dos últimas `odometer_readings` se obtiene la media de km/día; se proyecta la fecha estimada de alcanzar el umbral. `scheduler-tick` dispara cuando el odómetro estimado más el margen alcanza `último_mantenimiento.odometer + interval_km`, o cuando faltan `alert_days_before` para la fecha de calendario.

---

## 7. Protocolo de CLAUDE.md (D8)

Quieres que en cada sesión de trabajo se lea el contexto y no se trabaje en vano. Eso está bien planteado, pero con un matiz técnico importante:

**CLAUDE.md se carga en el contexto en cada turno de la conversación.** Si metes ahí "todo", estarás pagando ese peso en cada mensaje y, paradójicamente, empeorando la atención del modelo sobre lo que importa. La solución no es un archivo gigante, sino **un archivo pequeño que obliga a leer los grandes cuando toca**.

**Reparto:**

| Archivo | Qué contiene | Cuándo se lee |
|---|---|---|
| `CLAUDE.md` | Reglas de trabajo, stack, convenciones, índice de documentación y protocolo de arranque. Objetivo: **menos de 150 líneas**. | Automáticamente, siempre |
| `docs/spec.md` | Este documento. El detalle funcional y el modelo de datos. | Bajo demanda, al tocar un módulo |
| `docs/estado.md` | Qué está hecho, qué está en curso, qué falta. Se actualiza al cerrar cada sesión de trabajo. | Al arrancar cualquier sesión |
| `docs/decisiones.md` | Log de decisiones con fecha y motivo. Append-only. | Al cambiar de rumbo |

**Protocolo de arranque que irá dentro de CLAUDE.md:**

```markdown
## Protocolo obligatorio de inicio de sesión
Antes de escribir o modificar una sola línea de código:
1. Lee `docs/estado.md` para saber en qué punto está el proyecto.
2. Lee la sección de `docs/spec.md` correspondiente al módulo que se va a tocar.
3. Resume en dos frases qué vas a hacer y espera confirmación.

## Protocolo obligatorio de cierre de sesión
1. Actualiza `docs/estado.md` con lo hecho y lo que queda.
2. Si se ha tomado una decisión de diseño, añádela a `docs/decisiones.md` con fecha y motivo.

## Reglas innegociables
- Nunca escribir directamente a Supabase desde la UI: todo pasa por la capa `core/db` (Dexie + outbox).
- Nunca un módulo importa de otro módulo. Lo compartido vive en `core/`.
- Toda tabla nueva lleva `user_id` y política RLS en la misma migración.
- Ninguna clave secreta en el cliente.
- Los `id` se generan en cliente (UUID v7).
- Migraciones versionadas en `supabase/migrations/`. Nunca cambios a mano en el panel.
```

---

## 8. Decisiones de detalle cerradas

| Punto | Resolución |
|---|---|
| Formato del Excel del entrenador | Plantilla acordada del §4.6, con columna `semana`. La variabilidad de días por semana no afecta al formato. Sin pantalla de mapeo de columnas en la fase 1. |
| Exportación | Un archivo por mesociclo, una hoja por semana + hoja de resumen. Cada fila compara pautado vs. real. |
| Fotos de progreso | Supabase Storage, bucket privado, URLs firmadas de 60 s, compresión en cliente. |
| Datos de Salud de iOS | Las cinco métricas: peso, pasos, calorías activas, sueño y FC en reposo. Destino: Supabase propio, vía Atajos. |
| Cronómetro de descanso | Incluido, activable/desactivable en ajustes. |
| Tipos de ejercicio | Fuerza, cardio, tiempo y distancia. El entrenador puede pautar cualquiera. |
| Vehículos | Uno solo por ahora; el modelo ya soporta varios. |
| ITV, seguro e impuestos | `maintenance_items` con `interval_months`, sin `interval_km`. |
| Intervalos de mantenimiento | Los define el usuario. Sin plantilla precargada del fabricante. |
| Histórico del bot de finanzas | Se migra completo en la fase 3. |
| Cuentas | Un único "pozo" de dinero, sin cuentas ni tarjetas separadas. |
| Presupuestos | Por categoría con alerta de desvío, como el proyecto actual. |
| Idioma / tema | Español. Tema oscuro por defecto. |

---

## 9. Integración con Salud de iOS (fase 3)

**Lo que no se puede hacer:** una PWA no tiene acceso a HealthKit. No existe API web equivalente y no la va a haber. Cualquier app que lea Salud es nativa, sin excepción.

**Lo que sí se puede hacer — Atajos de iOS:**

**Métricas acordadas (D10):** peso, pasos, calorías activas, sueño y frecuencia cardíaca en reposo.

```
Automatización personal, diaria a las 23:00
  1. "Buscar muestras de salud"  → peso, pasos, kcal activas, sueño, FC reposo
  2. "Obtener contenido de URL"  → POST a tu Edge Function health-ingest
        Cabecera: Authorization: Bearer <token largo propio>
        Cuerpo:   JSON con las muestras
```

- Los datos van **de tu iPhone directamente a tu Supabase**. No pasan por ningún tercero, ningún servicio de sincronización, ninguna app de la App Store.
- El token es un secreto largo generado por ti, guardado en el Atajo y validado en la Edge Function. Si algún día quieres cortarlo, lo rotas y se acabó.
- Coste: una tarde. Sin dependencias.

Tabla destino:

```sql
create table health_samples (
  id uuid primary key,
  user_id uuid not null,
  sampled_on date not null,
  metric text not null,       -- 'weight' | 'steps' | 'sleep_minutes' | 'resting_hr' | 'active_kcal'
  value numeric not null,
  unit text not null,
  source text not null default 'ios_shortcuts',
  unique (user_id, sampled_on, metric)
);
```

El peso importado desde Salud alimenta automáticamente `body_metrics`, así no lo registras dos veces.

---

## 10. Roadmap

| Fase | Contenido | Estimación | Criterio de salida |
|---|---|---|---|
| **0 — Cimientos** | Repo, CLAUDE.md + docs, Vite+React+PWA, Supabase, Auth, RLS, Dexie + outbox, shell y navegación, deploy | ~1 semana | La app instala en el móvil, autentica y sincroniza un dato estando offline |
| **1 — Entrenamiento** | §4 completo: importador, modo entreno, sustituciones, vídeo, historial, exportador. Incluye `core/ui/MetricChart` y el patrón `DetailView` (§2.8), que después reutilizan todos los módulos | ~3,5 semanas | 4 semanas de entrenamientos reales registrados sin volver al Excel a mitad de bloque |
| **1.5 — Perfil** | §5: cuerpo, medidas, fotos, comparador y sus gráficas | ~5 días | Primera comparativa de fotos a 4 semanas y curva de peso con media móvil |
| **2 — Coche** | §6 completo, `pg_cron` + `scheduler-tick`, Telegram | ~1 semana | Llega una alerta real de umbral y el consumo L/100 km sale correcto |
| **3 — Economía** | `parse-entry`, webhook Telegram, quick-add en PWA, migración del histórico, presupuestos, enlace con repostajes y mantenimientos. Atajo de Salud | ~2–3 semanas | El bot antiguo se puede apagar |
| **4 — Nutrición** | Tras la entrega del TFG (octubre 2026) | por definir | — |

**Hito de decisión de producto:** al terminar la fase 1 y tras 4 semanas de uso real, se evalúa si el módulo de entrenamiento merece una versión para entrenadores. No antes.

---

## 11. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Abandono por sobrealcance | Alto | Fases cerradas. No se empieza la fase N+1 sin cumplir el criterio de salida de la N. |
| El modo entreno resulta incómodo en uso real | Crítico | Prototipar esa pantalla en la primera semana de la fase 1 y probarla en el gimnasio antes de construir el resto. |
| Colisión con la entrega del TFG (octubre 2026) | Alto | D3 y el aplazamiento de nutrición a la fase 4. Si el TFG se complica, se congela My Life. |
| Deriva a producto prematura | Medio | Multi-tenant solo a nivel de datos. Nada de UI de producto hasta el hito de la fase 1. |
| Pérdida de datos en sync offline | Alto | La `outbox` no borra hasta confirmación. Exportación manual a JSON desde ajustes. |
| Fuga de fotos de progreso | Alto | Bucket privado, RLS, URLs firmadas de caducidad corta. Auditar la política antes de subir la primera foto. |
| Formato de Excel cambiante | Medio | Plantilla acordada con el entrenador (§4.6). El importador valida las columnas y falla con un mensaje claro antes de insertar nada. Si algún día el formato cambia de verdad, se añade una pantalla de mapeo de columnas (~3 días). |
| Semanas del mesociclo mal modeladas | Alto | Resuelto en v0.3 con `routine_days.week_number`. Verificar en la fase 1 importando un mesociclo real de 4 semanas con progresión de cargas. |
