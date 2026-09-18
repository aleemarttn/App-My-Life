# Estado del proyecto

> **Este archivo se lee al empezar cada sesión de trabajo y se actualiza al terminarla.**
> Es la memoria del proyecto entre sesiones. Si está desactualizado, la siguiente sesión trabaja a ciegas.

**Última actualización:** 18/09/2026
**Fase actual:** ✅ **0 — Cimientos, COMPLETADA.** En curso: fase 1 — entrenamiento
**Siguiente hito:** probar en el gimnasio el circuito completo — importar rutina, entrenarla y ver que sube

---

## Fase 0 — Cimientos

### Hecho
- [x] Especificación funcional completa (`docs/spec.md` v0.4)
- [x] Decisiones de alcance cerradas (`docs/decisiones.md`, D1–D19)
- [x] Sistema de diseño definido (`docs/design.md`)
- [x] **Punto 1** — Proyecto `wcmtrjjalwbchrmlsvow` con las **tres** migraciones aplicadas (10/09/2026)
- [x] **Punto 2** — Vite 8 + React 19 + TS 6 (`react-ts`). `strict` activado a mano: la plantilla ya no lo trae
- [x] **Punto 3** — Tailwind 4.3 con todos los tokens de `design.md` §2–§5 en `src/styles/tokens.css` (D15)
- [x] **Punto 4** — `vite-plugin-pwa`: manifest en español, iconos generados, service worker con precaché del app-shell
- [x] **Punto 5** — Cliente de Supabase, `AuthProvider`, `AuthGate` y pantalla de acceso con email y contraseña
- [x] Repositorio propio en `aleemarttn/App-My-Life` (10/09/2026), anidado dentro de `Proyectos-Personales-prueba`, que lo ignora
- [x] **Punto 7** — `core/db` completo: esquema de Dexie con las diez tablas, `outbox`, motor de subida y bajada. **Verificado contra el servidor real**: 7 registros creados sin conexión llegaron a Supabase al recuperar la red, con id v7 correctamente ordenados
- [x] **Punto 8** — `AppShell`, `TabBar` de 5 pestañas, router con división por rutas y avatar de Perfil en la cabecera (D19)
- [x] **Punto 9** — Dashboard de §2.7 y las cuatro pantallas de módulo, todas en estado vacío
- [x] `core/ui`: `Button`, `Card`, `EmptyState`, `TabBar`, `AppShell`, `SyncBadge` e iconos propios. Los cuatro que `design.md` §6 pide para la fase 0, hechos
- [x] Exportación completa a JSON desde Perfil → Datos, que `spec.md` §11 pide como red de seguridad
- [x] Catálogo global sembrado: 40 ejercicios con `user_id = null`. `seed.sql` reescrito para ser idempotente
- [x] **Punto 10** — Desplegada en Vercel: **https://app-my-life.vercel.app** (D20). Verificado el 10/09/2026 contra el sitio en producción: la URL correcta va incrustada, no hay ninguna `service_role` en ningún trozo, las ocho rutas cargan por la reescritura de SPA, las cuatro cabeceras de seguridad llegan, la CSP permite la conexión con Supabase, el cacheado es inmutable en assets y nulo en `sw.js`, y la clave anon responde 200 contra la API

### En curso
- [ ] **Punto 6 — a medias.** `src/core/supabase/types.ts` ya está generado y el cliente va tipado, pero se generó desde el MCP de Supabase, no con la CLI. Hay que rehacerlo con la CLI en cuanto esté instalada, y **regenerarlo después de cada migración**.
- [ ] Recomendable: **borrar los despliegues antiguos de Vercel**. Ya no contienen nada aprovechable —la clave que llevaban está muerta—, pero cada uno conserva una URL propia y permanente y no aportan nada.

- [x] **Punto 11 — PRUEBA DE ACEPTACIÓN SUPERADA (10/09/2026).** Instalada en el iPhone desde la URL de producción. Registros creados en modo avión, app cerrada del todo, red recuperada, y todo llegó a Supabase solo. **29 filas subidas y cero desordenadas**, repartidas en solo 17 segundos distintos: varias creadas dentro del mismo segundo mantuvieron el orden correcto, que es el contador de secuencia del UUID v7 haciendo su trabajo en condiciones reales. Registros de prueba borrados del servidor después.

### Pendiente (fase 1)
1. [ ] **Prototipar el modo entreno** (`spec.md` §4.7, pantalla 3 del wireframe) — **código listo, falta probarlo en el gimnasio.** Ver nota de la sesión 16/09/2026 más abajo. `design.md` §7 y el registro de riesgos son tajantes: es la pantalla que decide el proyecto. Si registrar una serie no es cómodo con una mano y sin mirar, se rehace.
2. [x] **Importador de Excel (§4.6) — hecho el 17/09/2026.** Parseo y emparejamiento verificados contra `docs/plantillas/rutina-ejemplo.xlsx`; falta ejecutarlo contra la base real con sesión iniciada.
3. [ ] **Aparcado a propósito (18/09/2026): capa LLM para leer cualquier formato de Excel.** El importador de hoy exige el formato canónico de columnas de §4.6, no un Excel "como lo mandaría un entrenador de verdad" (bloques de día, notación combinada "4x8-10", descanso en texto). Encaja exactamente con el patrón que §2.5/D2 ya describe para `parse-entry` —capa determinista primero, capa LLM solo de fallback, JSON estricto contra esquema— aplicado aquí a la Edge Function que traduciría el Excel libre al formato canónico antes de pasar por la validación y el emparejamiento ya construidos, que no cambiarían. Se decidió no construirla todavía: primero consolidar el formato fijo (hecho), luego la capa de IA. Falta elegir proveedor (Gemini/Claude/OpenAI) y el usuario tiene que poner la clave en secretos de Supabase —no se puede hacer desde aquí—.
4. [x] **Calendario de la semana y detalle de ejercicio — hecho el 18/09/2026.** Ver nota de la sesión más abajo. Queda: vídeo en hoja inferior (hoy abre en pestaña nueva) y el exportador a Excel.
5. [x] **`core/ui/MetricChart` y el patrón `DetailView` (§2.8) — hechos el 18/09/2026.** Los reutilizan todos los módulos siguientes (peso en Perfil, categoría de gasto en Dinero, consumo en Coche).
6. [ ] **Pendiente de probar con el dedo**, igual que el importador: el calendario y el detalle de ejercicio nunca se han visto contra datos reales de Supabase, solo compilan y pasan sus tests con datos inventados.

**Criterio de salida de la fase 1:** 4 semanas de entrenamientos reales registrados sin volver al Excel a mitad de bloque.

---

## Notas para la siguiente sesión

- **18/09/2026 — Calendario de la semana y detalle de ejercicio (`DetailView`), con datos reales de principio a fin.**
  Petición de la sesión: terminar la portada de Entreno con un "calendario" de la semana y poder entrar en cada
  ejercicio a ver su progreso. Sin tocar el modo entreno.
  - **`proximoEntreno.ts` se parte en dos funciones sobre un contexto compartido** (`cargarContexto`): la ya
    existente `calcularProximoEntreno` y la nueva `calcularSemanaActual`, que devuelve los días de la semana
    lógica del mesociclo en curso (misma `week_number` que el día que toca) con su estado —`hecho` /
    `proximo` / `pendiente`— y sus ejercicios. No son fechas de calendario real: es la aplicación directa de
    D23 a la portada, tal y como pedía la spec §4.9 ("vistas globales de la portada").
  - **`CalendarioSemana.tsx`** pinta esos días como una lista con marcador de estado; cada ejercicio es un
    botón que navega a su detalle. `formato.ts` saca `objetivoCorto()` de `TrainingScreen.tsx` para no
    duplicarlo entre los dos.
  - **El patrón `DetailView` (spec §2.8, D12) existe por primera vez**: `core/ui/DetailView.tsx` (cabecera +
    valor/delta + gráfico + selectores + lista de registros) y `core/ui/MetricChart.tsx` (envoltorio único de
    Recharts, con los marcadores de `molestia` en rojo y de sustitución huecos que pide spec §4.9).
    `core/ui/SegmentedControl.tsx` es el componente que le faltaba al inventario de `design.md` §6 para los
    selectores de rango y métrica.
  - **Se instaló `recharts`** (39 paquetes, sin vulnerabilidades): es la librería que `CLAUDE.md` y `spec.md`
    §2.8 ya daban por elegida, solo que hasta hoy no hacía falta ninguna gráfica.
  - **`metricas.ts`** (módulo sin UI, con 15 tests en `metricas.test.ts`) calcula las cinco métricas de fuerza
    de spec §4.9 —e1RM por Epley, peso máximo, tonelaje, RIR medio, reps totales— más duración/distancia para
    cardio, tiempo y distancia. `useHistorialEjercicio.ts` es el hook que junta esto con Dexie: agrupa
    `set_logs` por sesión, decide qué metricas ofrece según `exercises.kind`, filtra por rango (30 d/90 d/1
    a/todo) y arma la lista de registros. **Toda la agregación es en cliente**, como exige spec §2.8: nunca
    una vista de Postgres, porque tiene que funcionar sin cobertura.
  - **Detalle importante para no confundir "sin datos todavía" con "saltado":** un `session_exercise` recién
    creado por el snapshot de una sesión en curso no tiene series todavía porque no se ha llegado a él, no
    porque se haya saltado. El hook lo distingue por `session_exercises.skipped`, no por si hay o no
    `set_logs`; si no, cualquier ejercicio pendiente de una sesión a medias aparecería como "Saltado" en el
    historial de otro día.
  - **Ruta `/entreno/ejercicio/:exerciseId`, perezosa y FUERA de `AppLayout`** (D24): como `/entreno/modo`,
    con su propia cabecera y sin barra de pestañas, para no apilar dos cabeceras. Recharts (~110 kB gzip)
    queda excluido del precaché del service worker igual que SheetJS (D21): se añadió
    `**/DetalleEjercicioScreen-*.js` a `globIgnores` en `vite.config.ts` y el precaché volvió de 1,08 MiB a
    700 KiB.
  - **D25:** en las gráficas de e1RM, peso máximo, duración y distancia el eje Y no fuerza el cero —igual que
    el peso corporal de `design.md` §9—; en tonelaje y reps totales sí, porque son sumas de trabajo.
  - **Dos fallos de build encontrados y corregidos, no relacionados con esta tarea pero que bloqueaban
    `npm run build`:** `tsconfig.app.json` no tenía `"node"` en `"types"`, así que `importarEjemplo.test.ts`
    (que ya usaba `node:fs` desde el 17/09) rompía `tsc -b` en cuanto se tocaba cualquier otro archivo del
    proyecto — nadie lo había notado porque `vitest` no pasa por `tsc`. Corregido añadiendo `"node"` a la
    lista. Los otros dos eran de tipos de Recharts (`Tooltip`/`Axis` con `unknown` en vez de tipos
    demasiado estrechos) y de `exactOptionalPropertyTypes` en `DetailView`.
  - **80 tests** (65 + 15 nuevos de `metricas.ts`), `npm run build` y `npm run lint` en verde.
  - **Sin probar contra Supabase real todavía.** El calendario y el detalle de ejercicio solo se han visto
    compilar y pasar tests con datos inventados: no hay sesión iniciada en este entorno para comprobarlos con
    el dedo. Primera prueba pendiente: importar una rutina, registrar un par de series de un ejercicio en dos
    días distintos, y comprobar que el calendario marca el día como hecho y que el detalle del ejercicio
    dibuja el punto y el registro correctos.
  - **Sigue sin hacerse la prueba del gimnasio** (punto 1 de la fase 1): esta sesión trabajó sobre la
    portada, no sobre el modo entreno, así que ese hito sigue exactamente donde estaba el 16/09.

- **17/09/2026 — Importador de Excel hecho, y el módulo ya funciona con rutina real.** Los datos de prueba
  (`planEntrenoPrueba.ts`) están **borrados**: la app ya no inventa nada.
  - **Importador** (`spec.md` §4.6, D21 y D22): `core/xlsx.ts` envuelve SheetJS con `import()` dinámico;
    `importarFormato.ts` valida el formato canónico —incluida la coma decimal y los avisos por columna
    ausente—; `importarEmparejar.ts` empareja contra el catálogo con Dice sobre palabras;
    `importarRutina.ts` escribe rutina, días y ejercicios por `core/db`; `ImportarRutinaScreen.tsx` es la
    pantalla de los 5 pasos. Ruta `/entreno/importar`.
  - **Rutina real de punta a punta:** `proximoEntreno.ts` calcula el día que toca (D23) y de ahí salen
    tanto la portada de Entreno como el snapshot de `session_exercises` del modo entreno. `ObjetivoPlan`
    pasa a ser anulable, porque la rutina real lo es (un cardio no tiene series ni peso).
  - **Excel de ejemplo** en `docs/plantillas/rutina-ejemplo.xlsx`: 4 semanas, 16 días, 64 filas, con progresión y
    descarga. Los nombres van escritos como los escribiría un entrenador —abreviados y sin tildes— y dos
    de ellos no existen en el catálogo, para que el emparejamiento se pruebe de verdad. Sirve también
    como plantilla para pasarle al entrenador.
  - **65 tests** (41 + 24 nuevos). El importante es `importarEjemplo.test.ts`: recorre el circuito
    completo contra el .xlsx real —SheetJS, validación y emparejamiento— y comprueba que la progresión
    sobrevive al parser. Los otros prueban la lógica con filas inventadas; ese demuestra que un archivo
    de verdad entra entero.
  - **Ojo con el precaché:** al entrar SheetJS, el arranque de la PWA pasó de 680 KiB a 1,18 MiB. Se
    excluyó con `globIgnores` en `vite.config.ts` y volvió a 696 KiB. Si algún día se añade otra librería
    pesada de uso esporádico, mirar esto antes de darlo por bueno.
  - **Windows, choque de mayúsculas:** `ImportarRutina.tsx` e `importarRutina.ts` solo se diferenciaban en
    el caso y TypeScript se negó a compilar. Por eso la pantalla se llama `ImportarRutinaScreen.tsx`.
  - **Pendiente de probar con el dedo:** el importador no se ha ejecutado todavía contra la base real
    —hace falta sesión iniciada—. Lo verificado es el parseo y el emparejamiento, no la inserción.
    Primera prueba: importar `docs/plantillas/rutina-ejemplo.xlsx` y comprobar que aparecen 1 rutina, 16 días y 64
    `routine_exercises`, y que la outbox los sube en orden.

- **16/09/2026 — Modo entreno prototipado, pendiente de probar en el gimnasio.** Construida la pantalla 3
  entera (`spec.md` §4.7): `SerieActiva` (una sola serie visible, steppers de 64 px prerrellenados con el
  objetivo, RIR 0–5, 3 chips del wireframe, nota opcional), `RestTimer` (cronómetro de descanso a pantalla
  completa con `navigator.vibrate`), `useWakeLock` (Screen Wake Lock, se reintenta al volver a primer plano)
  y `SustituirSheet` (buscador simple del catálogo + motivo). Todo en `src/modules/training/`. Nuevos
  componentes de `core/ui`: `Stepper` y `Chip`. Ruta `/entreno/modo`, **fuera de `AppLayout`** a propósito
  —sin barra de pestañas que distraiga a mitad de serie—, con botón "Empezar" desde `TrainingScreen`.
  - **La sesión es real, no una maqueta**: `useSesionEntreno` crea un `workout_session` + sus
    `session_exercises` de verdad en Dexie/outbox (misma puerta de escritura `core/db`, mismo camino de
    sincronización ya verificado en el punto 11) y se puede abandonar y retomar, como pide la spec. Los dos
    ejercicios y sus objetivos son de PRUEBA (`planEntrenoPrueba.ts`, se borra en cuanto exista el
    importador de Excel §4.6): toma dos ejercicios reales del catálogo ya sincronizado —prefiere
    "sentadilla" y "banca" por nombre, si no los encuentra coge los dos primeros— para que `exercise_id`
    sea una fila real y la subida no la rechace la clave ajena.
  - **Simplificaciones conscientes frente a la spec, para no sobreconstruir antes de la prueba física:**
    el vídeo del ejercicio abre en pestaña nueva en vez de la hoja inferior con reproductor embebido que
    pide §4.5 (no existe `BottomSheet` todavía); las etiquetas son las 3 que trae el wireframe
    (`facil`/`al_fallo`/`molestia`), no las 7 de §4.4; "saltar" marca `skipped` en todo el ejercicio, no
    solo la serie actual, porque el modelo de datos no tiene concepto de saltar una serie suelta. Ninguna
    es una regresión de arquitectura: todas pasan por `core/db` igual que el resto de la app.
  - `npm run build`, `npm run lint` y los 41 tests existentes, en verde. No se añadieron tests nuevos: es
    exploratorio y `CLAUDE.md` pide no testear comportamiento que aún no está cerrado.
  - **Sin probar en un dispositivo real todavía.** No se puede marcar el punto 1 de la fase 1 como hecho
    hasta hacerlo. Antes de ir al gimnasio: iniciar sesión en el móvil, comprobar que el Wake Lock aguanta
    con la pantalla bloqueada un rato, y que el stepper de peso (pasos de 2,5 kg) y de reps son cómodos con
    una mano. Si algo no lo es, **se rehace antes de seguir** (es literalmente el criterio de la spec).

- ✅ **INCIDENTE DE SEGURIDAD — 10/09/2026, CERRADO el mismo día. La clave `service_role` se publicó en el bundle del cliente.**
  **Cierre verificado:** la app usa `sb_publishable_…`, las claves legacy están desactivadas y la que estuvo expuesta devuelve **401**. Comprobado pidiendo datos con ella contra la API. En el primer despliegue a Vercel las dos variables se pegaron cruzadas: `VITE_SUPABASE_URL` recibió la clave anon y `VITE_SUPABASE_ANON_KEY` recibió la **`service_role`**, que se salta todas las políticas RLS. El resultado quedó accesible sin autenticación en `/assets/db-*.js`.
  **Cómo se resolvió, y por qué así:** en lugar de rotar el secreto JWT se migró a las claves nuevas. En el sistema legacy, `anon` y `service_role` comparten secreto, así que rotar una invalida las dos a la vez y deja la app caída hasta redesplegar, a ciegas. Las claves nuevas son independientes: se cambió la app a `sb_publishable_…`, se comprobó que entraba, y solo entonces se desactivaron las legacy. Con red en todo momento y reversible hasta el último paso.
  **Ojo para la próxima:** corregir el código NO retira una clave del despliegue ya publicado. Vite la incrusta al compilar, así que solo desaparece con un despliegue nuevo posterior al cambio de variables.
  **Por qué no saltó nada:** la comprobación anterior solo miraba si las variables estaban vacías, y ambas tenían contenido. Corregido: `src/app/revisarConfig.ts` decodifica los JWT y se niega a arrancar si el rol no es `anon` o si la URL no es una URL. Con 7 tests, uno de ellos reproduce el cruce exacto.
  **Y por qué se veía todo negro:** `createClient` reventaba con la URL inválida al importarse el módulo, y el `import()` dinámico no tenía `.catch()`. Ahora lo tiene.
  **Estado a 10/09/2026:** las variables ya están corregidas y el dominio de producción está limpio —comprobado descargando todos los trozos y decodificando cada JWT: solo aparece el rol `anon`—. Queda por confirmar la rotación de la `service_role` y el borrado de los despliegues antiguos.
  **Lección de método:** al comprobar si el bundle viejo seguía servido, un 200 me hizo pensar que sí. Era falso: con la reescritura de SPA **cualquier ruta inexistente devuelve 200 con el `index.html`**. Hay que mirar el `content-type` y el contenido, nunca solo el código de estado.

- **Cuenta creada y login verificado** el 10/09/2026 (`alejandromartin333@gmail.com`). El trigger `on_auth_user_created` creó la fila de `profiles` sola, lo que confirma de paso que el `revoke execute` de la migración `harden_functions` no rompió el trigger: se ejecuta como propietario de la tabla, no como el cliente.
- **Fallo corregido el 10/09/2026: el contador de «Pendientes» no se movía.** En modo avión, crear un registro lo añadía a Dexie pero el contador seguía a cero. El dato **sí** se encolaba —escritura y cola van en la misma transacción—, pero había **dos fuentes de verdad para el mismo número**: la interfaz leía una copia guardada dentro del motor de sincronización que solo se refrescaba al terminar un ciclo. Con la app sin cobertura eso significaba un minuto entero aparentando que el registro se había perdido, que es justo lo contrario de lo que la `outbox` debe transmitir. Ahora los contadores se leen de la tabla `outbox` con `useLiveQuery`, única fuente y siempre al día, y `EstadoSync` se queda solo con lo que Dexie no puede saber.
- **Quedan registros «Prueba …» en la base local del iPhone.** Se borraron del servidor, pero la bajada solo añade, no borra. Se limpian con Perfil → Datos → Vaciar base local.
- **El panel de sincronización se mudó** a Perfil, y `DesignCheck` a Perfil → Sistema de diseño. Ambos siguen siendo provisionales y se borran al cerrar la fase 0.
- **Sin borrado de la base local al cerrar sesión, y es deliberado**: ahí puede haber registros sin subir. Consecuencia conocida: si algún día entrara un usuario distinto en el mismo dispositivo, vería los datos locales del anterior. No es un problema real con un solo usuario (D4), pero está aquí escrito para que no sorprenda.
- **Bundle resuelto, con matiz.** El código propio de la app son ahora **7 kB gzip**; cada módulo es su propio trozo y las librerías van separadas (react 68, supabase 55, dexie 31, router 30 kB gzip). El total sigue siendo ~190 kB la primera vez, pero el service worker lo precachea y una actualización de la app ya solo invalida esos 7 kB. Aviso de los 500 kB desaparecido.
- **Límite conocido de la bajada:** se trae una página de 1000 filas por tabla y ciclo, y el cursor avanza con `updated_at` estricto (`gt`). Si más de 1000 filas compartieran milisegundo exacto, se saltarían algunas. Con estos volúmenes es imposible, pero está escrito por si algún día se importa un histórico grande de golpe.
- **Los nombres de archivo de las migraciones se renombraron** para que coincidan con las versiones que quedaron registradas en el servidor (`20260910000747`, `...826`, `...931`). Se aplicaron por MCP, que asigna su propia marca de tiempo; sin renombrar, un futuro `supabase db push` las habría creído pendientes y habría intentado repetirlas.
- **Revisión de RLS hecha el 10/09/2026, sin hallazgos.** Las diez tablas tienen `enable row level security` y políticas. La duda sobre `exercises` queda resuelta: `select` permite las filas globales (`user_id is null or auth.uid() = user_id`), pero `insert`, `update` y `delete` exigen `auth.uid() = user_id`, que con `user_id` nulo evalúa a NULL y RLS lo trata como falso — nadie puede crear, modificar ni borrar el catálogo global desde el cliente. `profiles` no lleva `user_id` porque su clave primaria *es* el id del usuario.
- El linter de seguridad de Supabase queda con **un solo aviso, y no es nuestro**: `public.rls_auto_enable()` es una función de la plataforma (propiedad de `postgres`) que activa RLS en toda tabla nueva de `public`. No tocarla. Los otros dos avisos se corrigieron en la migración `harden_functions`.
- La CLI de Supabase **no está instalada** (`supabase: command not found`). No bloquea nada: el MCP cubre migraciones y tipos.
- **El bundle pasó de 70 kB a 126 kB gzip** al entrar `supabase-js`. Vigilarlo: `design.md` y la spec §2.8 exigen que el arranque del modo entreno sea ligero. Si molesta, la vía es cargar el motor de sincronización de forma diferida, no el auth, que hace falta en el primer pintado.
- **Los colores siguen sin confirmar contra el lienzo.** Están en `src/styles/tokens.css` y se ven todos juntos en `src/app/DesignCheck.tsx`, que ahora vive detrás del login. Mirarlos en el iPhone, no en el monitor.
- La app **exige red la primera vez** para iniciar sesión. Después la sesión persiste en almacenamiento local y `getSession()` no toca la red, así que abre sin cobertura. Es la premisa de la prueba de aceptación del punto 11.
- `src/app/App.tsx` es **provisional y se borra** en el punto 8: es una hoja de contraste de tokens, no el shell. El shell real es `AppShell` + `TabBar` de `design.md` §6.
- **En Windows, `npm run build` falla con `EBUSY` si `npm run dev` está corriendo** (`rmdir dist\assets`). Con `devOptions: { enabled: true }` el plugin PWA mantiene abierto `dist`. Parar el dev server antes de compilar; no es un fallo de configuración.
- `registerType: "autoUpdate"` en `vite.config.ts` está sin revisar. Cuando exista el modo entreno hay que pasarlo a `prompt` o condicionarlo: una recarga automática a mitad de una serie perdería el registro en curso.
- No empezar el módulo de entrenamiento hasta que la prueba de aceptación de la fase 0 pase. La cola de sincronización es la pieza de la que depende todo lo demás.

---

## Registro de sesiones

| Fecha | Qué se hizo | Dónde se quedó |
|---|---|---|
| 09/09/2026 | Planificación completa, especificación v0.4, migraciones de fase 0 y 1, sistema de diseño | Listo para crear el proyecto de Supabase y arrancar Vite |
| 10/09/2026 | Puntos 2–4: andamiaje Vite + React + TS estricto + Tailwind 4 con tokens + PWA (manifest, iconos, SW). D15 y D16. `npm run build` en verde | Parado tras el punto 4 a petición propia, para validar el color en el móvil antes de tocar Dexie |
| 10/09/2026 | Punto 1 (migraciones aplicadas + `harden_functions`), punto 5 (cliente, `AuthProvider`, login) y tipos generados. Repo propio creado y subido | Bloqueado en crear la cuenta de `auth.users` desde el panel; después, punto 7 (Dexie y outbox) |
| 10/09/2026 | Punto 7: `core/db` entero — UUID v7 propio, esquema de Dexie, `outbox` transaccional, subida con retroceso exponencial, bajada incremental, 24 tests. D17 y D18. `SyncBadge` y panel de pruebas | Falta validar contra el servidor real (punto 11). Luego, punto 8: shell, router y barra de 5 pestañas |
| 10/09/2026 (noche) | Limpieza (spec duplicada, deriva del modelo de datos, semilla del catálogo). Puntos 8 y 9: shell, barra de 5 pestañas, router con división por rutas, dashboard y placeholders. Perfil con exportación a JSON. Configuración de despliegue. D19. 31 tests | Todo compila y las rutas responden, pero **nadie lo ha visto pintado**. Abrir la app y mirarla; luego desplegar |
| 10/09/2026 | Vercel en vez de Netlify (D20). Tildes en toda la interfaz e iconos de coche y mancuerna rehechos. **Incidente de la `service_role`** y barrera `revisarConfig` con 7 tests. Punto 10 cerrado: desplegada y verificada en producción. 38 tests | Falta el punto 11: instalarla en el iPhone. Y confirmar la rotación de la clave y el borrado de despliegues antiguos |
| 10/09/2026 (tarde) | Incidente cerrado migrando a las claves nuevas y desactivando las legacy: la expuesta devuelve 401. `context.md`. Corregidas fechas mal puestas. Arreglado el contador de pendientes, que tenía dos fuentes de verdad. **Punto 11 superado: la app instala en el iPhone y sincroniza sin cobertura.** 41 tests | ✅ **Fase 0 completa.** Empieza la fase 1: prototipar el modo entreno y probarlo en el gimnasio |
| 16/09/2026 | Modo entreno prototipado (spec §4.7): `Stepper` y `Chip` en `core/ui`; `SerieActiva`, `RestTimer`, `useWakeLock`, `SustituirSheet` y `useSesionEntreno` en `modules/training`; ruta `/entreno/modo` fuera de `AppLayout`. Sesión real sobre `core/db`, con dos ejercicios de prueba tomados del catálogo (`planEntrenoPrueba.ts`, temporal hasta el importador de Excel). `npm run build/lint/test` en verde, 41 tests sin cambios | **Sin probar en el gimnasio todavía** — es el siguiente paso, antes de tocar nada más del módulo |
| 17/09/2026 | Importador de Excel completo (§4.6, D21, D22): `core/xlsx.ts`, `importarFormato.ts`, `importarEmparejar.ts`, `importarRutina.ts`, `ImportarRutinaScreen.tsx`. `proximoEntreno.ts` y D23 sustituyen los datos de prueba por la rutina real en toda la portada y el modo entreno. Excel de ejemplo en `docs/plantillas/rutina-ejemplo.xlsx`. 65 tests | Falta probar el importador con el dedo contra Supabase real (hace falta sesión iniciada) |
| 18/09/2026 | Calendario de la semana (`CalendarioSemana.tsx`, `calcularSemanaActual`) y detalle de ejercicio: patrón `DetailView` (§2.8, D12) y `MetricChart` (Recharts) por primera vez, `metricas.ts` con las cinco métricas de §4.9, ruta `/entreno/ejercicio/:exerciseId` fuera de `AppLayout` (D24), eje Y sin cero para pesos (D25). Corregidos dos fallos de build preexistentes (`tsconfig` sin tipos de Node, tipos de Recharts). 80 tests, build y lint en verde | **Sin probar contra Supabase real.** Sigue pendiente la prueba del gimnasio del punto 1, que esta sesión no tocó |
