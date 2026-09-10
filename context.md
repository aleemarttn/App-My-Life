# My Life — Contexto del proyecto

> **Qué es este archivo.** Una foto de conjunto: qué es el proyecto, por qué está
> construido así y en qué punto estaba el **10 de septiembre de 2026**. Sirve para
> ponerse al día de golpe —una persona nueva, otra máquina, otra herramienta— sin
> tener que leer cuatro documentos.
>
> **Qué NO es.** La fuente de verdad. Esa se reparte entre `docs/spec.md` (qué hace
> la app y su modelo de datos), `docs/estado.md` (dónde está hoy), `docs/decisiones.md`
> (por qué) y `CLAUDE.md` (cómo se trabaja). **Si algo aquí contradice a esos, mandan
> ellos.** Este archivo se queda desactualizado por naturaleza; los otros no, porque
> el protocolo de trabajo obliga a mantenerlos.

---

## 1. Qué es My Life

Una **PWA personal de registro y control**, organizada en cinco dominios:
entrenamiento, cuerpo, nutrición, economía y coche. Usuario único (Alejandro), sin
publicación en tiendas, en español y con tema oscuro por defecto.

**El principio rector manda sobre todo lo demás:** los cinco módulos son el mismo
patrón —*evento fechado → métricas → objetivo/umbral → alerta → análisis*— y la
arquitectura debe conseguir que **el quinto módulo cueste el 20% del primero**. De
ahí que `core/` (base de datos local, motor de recordatorios, sistema de diseño,
patrón `DetailView`) sea código compartido y no se duplique por módulo.

**El criterio de éxito no es técnico:** que a las seis semanas de usarlo Alejandro
siga registrando sus entrenamientos sin obligarse. Nada más. De ahí la regla de que,
ante la duda entre una función más y menos fricción al registrar, **gana menos
fricción**: la app muere el día que registrar cueste.

**Lo que no es:** no es una app de tienda, no es (todavía) un producto para
terceros, y no sustituye a Nutrigasto —el TFG, que se entrega en octubre de 2026 y
vive en un repositorio aparte a propósito—.

---

## 2. Las decisiones que explican la forma del proyecto

El detalle completo, con su motivo, está en `docs/decisiones.md` (D1–D20). Las que
más condicionan el código:

| | Decisión | Consecuencia práctica |
|---|---|---|
| **D1** | Orden: entrenamiento → coche → economía → nutrición | El coche va segundo por barato y porque valida las notificaciones programadas, de las que dependen los demás |
| **D4** | Personal, multi-tenant **solo en el modelo de datos** | Toda tabla lleva `user_id` y RLS, pero no hay UI de registro, roles ni facturación |
| **D7 / D11** | 5 pestañas abajo; Perfil en el avatar de la cabecera | Las pestañas son acciones diarias; el perfil es consulta semanal y no merece ese peso visual |
| **D8** | rutina → **semana** → día → ejercicio | Sin la dimensión de semana, importar un mesociclo de 4 semanas machacaría los objetivos de la anterior |
| **D12** | Toda agregación de gráficas **en cliente**, sobre Dexie | Corrige la v0.2 de la spec: una vista de Postgres es inalcanzable en el sótano de un gimnasio |
| **D13** | e1RM (Epley) como métrica principal de fuerza | El peso máximo miente al cambiar el rango de repeticiones |
| **D17** | La `outbox` separa fallo transitorio de permanente | Un rechazo por restricción no puede bloquear indefinidamente todo lo que venga detrás |
| **D18** | Al bajar, un cambio local sin subir gana al servidor | Es lo que impide que la sincronización borre lo que acabas de registrar |
| **D20** | Hosting en Vercel | Anula la elección previa de Netlify. Sin condicionante técnico: la app es estática |

---

## 3. Arquitectura en una página

**Stack:** Vite 8 + React 19 + TypeScript 6 estricto · Tailwind 4 · Dexie
(IndexedDB) · Supabase (Postgres, Auth, RLS, Storage, Edge Functions, `pg_cron`) ·
React Router 7 · Vercel · Recharts y SheetJS pendientes de la fase 1.

```
src/
├── app/        shell, router, sesión, dashboard, perfil
├── modules/    training · body · car · finance · nutrition
└── core/       db (Dexie + outbox) · supabase · ui · xlsx (pendiente)
supabase/
├── migrations/ versionadas, nunca cambios a mano en el panel
└── functions/  vacío todavía: parse-entry · telegram-webhook · health-ingest · scheduler-tick
```

**Las reglas que no se negocian** (versión corta; la larga en `CLAUDE.md`):

- Un módulo **nunca** importa de otro. Lo compartido sube a `core/`.
- La interfaz **nunca** escribe en Supabase. Todo pasa por `core/db`.
- La interfaz **siempre** lee de Dexie. Nunca espera a la red para pintar.
- Los `id` se generan en cliente (UUID v7). Nada de `serial`.
- Toda tabla nueva lleva `user_id` y su política RLS **en la misma migración**.
- Los datos derivados (tonelaje, e1RM, L/100 km, medias móviles) **no se almacenan**.
- Ninguna clave secreta en el bundle del cliente.

**Cómo funciona el offline** (`spec.md` §2.3), que es la pieza central:

1. Toda escritura va **primero** a Dexie, con id generado en cliente.
2. La misma escritura se encola en `outbox`, **en la misma transacción**. Si fueran
   dos pasos, cerrar la app entre ambos dejaría un registro que no se subiría jamás.
3. Un motor vacía la cola al recuperar red, con retroceso exponencial.
4. Conflictos: *last-write-wins* por `updated_at`.
5. **La `outbox` no borra una entrada hasta que el servidor confirma.**

---

## 4. Dónde está cada cosa

| | |
|---|---|
| Repositorio | `github.com/aleemarttn/App-My-Life` |
| Carpeta local | `Documents\Prueba claude\App-My-life` — repo propio **anidado** dentro de `Proyectos-Personales-prueba`, que lo ignora en su `.gitignore` |
| Producción | https://app-my-life.vercel.app |
| Supabase | proyecto `wcmtrjjalwbchrmlsvow` |
| Cuenta | `alejandromartin333@gmail.com` (usuario único) |

**Variables de entorno.** Solo dos, y ambas públicas por diseño: `VITE_SUPABASE_URL`
y `VITE_SUPABASE_ANON_KEY` (que hoy contiene una clave `sb_publishable_…`). Viven en
`.env` local —no versionado— y en Vercel marcadas como **Config**, no como Secret:
cualquier variable con prefijo `VITE_` acaba dentro del JavaScript del navegador, así
que llamarla secreta sería engañarse. La seguridad vive en las políticas RLS.

Todo lo demás —token de Telegram, clave del LLM, `HEALTH_INGEST_TOKEN`, claves de
servicio— va con `supabase secrets set` y **nunca** toca el cliente.

**Comandos:**

```
npm run dev      arranca en localhost:5173 (y en la red local, para el móvil)
npm run build    typecheck + build de producción
npm test         40 tests
npm run lint     oxlint
```

Aviso de Windows: `npm run build` falla con `EBUSY` si el servidor de desarrollo está
corriendo. No es un fallo de configuración; hay que pararlo antes.

---

## 5. En qué punto está (10/09/2026)

**Fase 0 — Cimientos: COMPLETADA.** Los once puntos, cerrados el 10/09/2026.

Funcionando y verificado contra la realidad, no sobre el papel:

- **Base de datos:** 10 tablas, todas con RLS y 14 políticas. Tres migraciones
  aplicadas. Catálogo global de 40 ejercicios sembrado.
- **Autenticación:** email y contraseña, sesión persistente. Verificada de extremo a
  extremo.
- **Offline:** 7 registros creados sin conexión llegaron a Supabase al recuperar la
  red, con los id v7 correctamente ordenados —incluidos dos creados en el mismo
  segundo, que es donde fallaría un generador mal hecho—.
- **Interfaz:** shell con barra de 5 pestañas, dashboard con las tarjetas definitivas
  en estado vacío, cuatro pantallas de módulo, Perfil con exportación a JSON.
- **Despliegue:** en producción, con reescritura de SPA, cabeceras de seguridad y una
  CSP que limita `connect-src` al proyecto de Supabase.
- **Bundle:** 7 kB gzip de código propio; librerías y módulos en trozos aparte.

- **Prueba de aceptación superada:** instalada en el iPhone, registros creados en
  modo avión, app cerrada del todo, red recuperada y todo llegó solo a Supabase. 29
  filas y **cero desordenadas**, repartidas en 17 segundos distintos: varias creadas
  dentro del mismo segundo mantuvieron el orden. Es el contador de secuencia del UUID
  v7 funcionando de verdad.

**Ahora:** fase 1, entrenamiento. Y lo primero de esa fase no es construir, sino
**prototipar la pantalla del modo entreno y probarla en el gimnasio**. Es la pantalla
que decide el proyecto: si registrar una serie no es cómodo con una mano y sin mirar,
se rehace antes de seguir.

**Provisional, se borra al cerrar la fase 0:** `src/app/DesignCheck.tsx` (hoja de
contraste de tokens) y `src/app/SyncPanel.tsx` (panel para probar la sincronización a
mano). Ambos viven dentro de Perfil.

---

## 6. Qué se hizo el 10 de septiembre de 2026

Sesión larga, de madrugada y mañana. En orden.

**Cimientos (puntos 1 a 7).** Migraciones aplicadas tras auditar las diez tablas.
Salieron dos avisos del linter de seguridad de Supabase que se cerraron con una
migración nueva, `harden_functions`: `search_path` fijo en `set_updated_at` y
revocado el `EXECUTE` de `handle_new_user`, que PostgREST exponía como endpoint. Un
tercer aviso se dejó a propósito: es de `rls_auto_enable()`, función de la plataforma.

Después el cliente de Supabase, la autenticación y **`core/db` entero**: UUID v7
propio —`crypto.randomUUID()` da v4, aleatorio, y el orden FIFO de la cola depende de
poder ordenar los id en el tiempo—, esquema de Dexie, escritura transaccional, subida
con clasificación de fallos y bajada incremental. Con tests, que es lo que
`CLAUDE.md` exige para esta carpeta.

**Shell y pantallas (puntos 8 y 9).** `AppShell`, `TabBar`, `Card`, `EmptyState`,
router con cada módulo en su propio trozo, dashboard y placeholders. Iconos dibujados
a mano para no traer una librería de 50 kB por cinco símbolos.

**Limpieza.** Se borró una copia duplicada de la especificación que había en la raíz
—idéntica byte a byte a `docs/spec.md`, y dos copias de la fuente de verdad acaban
divergiendo—, se puso al día el modelo de datos del documento (le faltaban
`updated_at` y `deleted_at`, que no son adorno: el primero es lo que hace posible el
*last-write-wins*) y se reescribió `seed.sql` para que sea idempotente, porque tal
como estaba ejecutarlo dos veces duplicaba el catálogo entero.

**Cambio a Vercel (D20)** y borrado de todo lo de Netlify.

**Correcciones de la interfaz.** Los textos habían perdido las tildes; se revisaron
todas las pantallas. Y se rehicieron dos iconos: el del coche parecía una impresora y
la mancuerna no se leía a 24 px.

### El incidente de seguridad

En el primer despliegue, las dos variables de entorno se pegaron **cruzadas**:
`VITE_SUPABASE_URL` recibió la clave anon y `VITE_SUPABASE_ANON_KEY` recibió la
**`service_role`**, que se salta todas las políticas RLS. Quedó publicada en un
archivo JavaScript descargable sin autenticación.

El síntoma visible era otro: **pantalla en negro**. `createClient` reventaba con la
URL inválida al importarse el módulo, antes de que React montara nada, y el `import()`
dinámico no tenía `.catch()`. Al investigar la pantalla negra apareció lo de verdad
grave.

**Cómo se cerró, y por qué así.** No rotando el secreto JWT: en el sistema legacy de
Supabase, `anon` y `service_role` están firmadas con el mismo secreto, así que rotar
una invalida las dos y deja la app caída hasta redesplegar, a ciegas. En su lugar se
migró a las claves nuevas, que son independientes: se cambió la app a
`sb_publishable_…`, se comprobó que entraba, y **solo entonces** se desactivaron las
legacy. Con red en todo momento. Verificado al final: la clave expuesta devuelve
**401** y la nueva responde 200.

**Lo que dejó de lección, y está en el código:**

- `src/app/revisarConfig.ts` ya no comprueba solo que las variables existan, sino que
  **sean lo que dicen ser**: decodifica los JWT y rechaza cualquier rol que no sea
  `anon`, y detecta las claves `sb_secret_` del formato nuevo, que no son JWT y por
  tanto se le habrían escapado. Con 9 tests, uno de los cuales reproduce el cruce
  exacto del incidente.
- Corregir el código **no retira una clave de un despliegue ya publicado**. Vite la
  incrusta al compilar; solo desaparece con un despliegue nuevo posterior al cambio.
- Con la reescritura de SPA activa, **cualquier ruta inexistente devuelve 200** con el
  `index.html`. Comprobar si un archivo sigue servido mirando solo el código de estado
  da un falso positivo: hay que mirar el `content-type`.

---

## 7. Cosas que conviene saber antes de tocar nada

- **Los colores siguen sin contrastar contra el lienzo de wireframes.** Están todos en
  `src/styles/tokens.css`, que es el único sitio donde viven, y se ven juntos en
  Perfil → Sistema de diseño.
- **`registerType: "autoUpdate"`** en `vite.config.ts` está sin revisar. Cuando exista
  el modo entreno hay que cambiarlo: una recarga automática a mitad de una serie
  perdería el registro en curso.
- **La base local no se borra al cerrar sesión**, y es deliberado: ahí puede haber
  registros sin subir. Consecuencia: otro usuario en el mismo dispositivo vería los
  datos del anterior. Irrelevante con un solo usuario, pero conviene saberlo.
- **Los tipos de `src/core/supabase/types.ts` se generaron con el MCP**, no con la CLI
  —que no está instalada—. Hay que **regenerarlos después de cada migración**.
- **La bajada trae 1000 filas por tabla y ciclo**, con cursor `updated_at` estricto.
  Si más de 1000 filas compartieran milisegundo se saltarían algunas: imposible con
  estos volúmenes, relevante si algún día se importa un histórico grande de golpe.
