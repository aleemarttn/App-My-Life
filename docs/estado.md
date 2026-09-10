# Estado del proyecto

> **Este archivo se lee al empezar cada sesión de trabajo y se actualiza al terminarla.**
> Es la memoria del proyecto entre sesiones. Si está desactualizado, la siguiente sesión trabaja a ciegas.

**Última actualización:** 10/09/2026
**Fase actual:** 0 — Cimientos
**Siguiente hito:** que la app instale en el móvil, autentique y sincronice un dato estando offline

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
- [x] **Punto 10** — Desplegada en Vercel: **https://app-my-life.vercel.app** (D20). Verificado el 11/09/2026 contra el sitio en producción: la URL correcta va incrustada, no hay ninguna `service_role` en ningún trozo, las ocho rutas cargan por la reescritura de SPA, las cuatro cabeceras de seguridad llegan, la CSP permite la conexión con Supabase, el cacheado es inmutable en assets y nulo en `sw.js`, y la clave anon responde 200 contra la API

### En curso
- [ ] **Punto 6 — a medias.** `src/core/supabase/types.ts` ya está generado y el cliente va tipado, pero se generó desde el MCP de Supabase, no con la CLI. Hay que rehacerlo con la CLI en cuanto esté instalada, y **regenerarlo después de cada migración**.
- [ ] **Seguridad, pendiente de confirmar:** rotar la `service_role` en Supabase y **borrar los despliegues antiguos de Vercel**. Ver el incidente más abajo. El dominio de producción ya está limpio, pero cada despliegue antiguo conserva una URL propia y permanente.

### Pendiente (en este orden)
11. [ ] **Prueba de aceptación de la fase 0.** La parte de sincronización offline ya está verificada. Falta la otra mitad: **instalarla en el iPhone** desde la URL de Vercel y comprobar que abre, autentica y registra sin cobertura.
12. [ ] Cerrada la fase 0, empieza la **fase 1 — entrenamiento**. Primero se prototipa la pantalla 3 del wireframe (modo entreno) y se prueba en el gimnasio, antes de construir nada más: `design.md` §7 y el registro de riesgos son tajantes con eso.

---

## Notas para la siguiente sesión

- 🔴 **INCIDENTE DE SEGURIDAD — 11/09/2026. La clave `service_role` se publicó en el bundle del cliente.** En el primer despliegue a Vercel las dos variables se pegaron cruzadas: `VITE_SUPABASE_URL` recibió la clave anon y `VITE_SUPABASE_ANON_KEY` recibió la **`service_role`**, que se salta todas las políticas RLS. El resultado quedó accesible sin autenticación en `/assets/db-*.js`.
  **Qué hay que hacer, y en este orden:** (1) **rotar la `service_role`** en Supabase — mientras no se rote, sigue siendo válida aunque se borre el despliegue; (2) corregir las dos variables en Vercel; (3) volver a desplegar; (4) **borrar los despliegues antiguos** en Vercel, porque conservan su propia URL permanente y siguen sirviendo el bundle comprometido.
  **Ojo:** corregir el código NO retira la clave del despliegue ya publicado. Vite la incrusta al compilar, así que solo desaparece con un despliegue nuevo hecho con las variables correctas.
  **Por qué no saltó nada:** la comprobación anterior solo miraba si las variables estaban vacías, y ambas tenían contenido. Corregido: `src/app/revisarConfig.ts` decodifica los JWT y se niega a arrancar si el rol no es `anon` o si la URL no es una URL. Con 7 tests, uno de ellos reproduce el cruce exacto.
  **Y por qué se veía todo negro:** `createClient` reventaba con la URL inválida al importarse el módulo, y el `import()` dinámico no tenía `.catch()`. Ahora lo tiene.
  **Estado a 11/09/2026:** las variables ya están corregidas y el dominio de producción está limpio —comprobado descargando todos los trozos y decodificando cada JWT: solo aparece el rol `anon`—. Queda por confirmar la rotación de la `service_role` y el borrado de los despliegues antiguos.
  **Lección de método:** al comprobar si el bundle viejo seguía servido, un 200 me hizo pensar que sí. Era falso: con la reescritura de SPA **cualquier ruta inexistente devuelve 200 con el `index.html`**. Hay que mirar el `content-type` y el contenido, nunca solo el código de estado.

- **Cuenta creada y login verificado** el 10/09/2026 (`alejandromartin333@gmail.com`). El trigger `on_auth_user_created` creó la fila de `profiles` sola, lo que confirma de paso que el `revoke execute` de la migración `harden_functions` no rompió el trigger: se ejecuta como propietario de la tabla, no como el cliente.
- **SIN VERIFICACIÓN VISUAL.** Todo lo del shell y las pantallas compila, pasa el lint, pasa los 31 tests y las ocho rutas responden 200 sobre el build de producción, pero **nadie lo ha visto pintado**: la extensión de Chrome no estaba conectada. Lo primero al retomar es abrir la app y mirarla. Los sospechosos habituales serían los iconos de la barra (dibujados a mano, sin ver) y el hueco inferior del contenido.
- **El panel de sincronización se mudó** a Perfil, y `DesignCheck` a Perfil → Sistema de diseño. Ambos siguen siendo provisionales y se borran al cerrar la fase 0.
- **Quedan 7 filas «Prueba …» en la base local del navegador.** Se borraron del servidor, pero Dexie no las pierde solo. Se limpian con Perfil → Datos → Vaciar base local, que vuelve a bajar el catálogo del servidor.
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
| 11/09/2026 | Vercel en vez de Netlify (D20). Tildes en toda la interfaz e iconos de coche y mancuerna rehechos. **Incidente de la `service_role`** y barrera `revisarConfig` con 7 tests. Punto 10 cerrado: desplegada y verificada en producción. 38 tests | Falta el punto 11: instalarla en el iPhone. Y confirmar la rotación de la clave y el borrado de despliegues antiguos |
