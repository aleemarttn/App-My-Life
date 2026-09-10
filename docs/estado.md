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
- [x] Decisiones de alcance cerradas (`docs/decisiones.md`, D1–D16)
- [x] Sistema de diseño definido (`docs/design.md`)
- [x] **Punto 1** — Proyecto `wcmtrjjalwbchrmlsvow` con las **tres** migraciones aplicadas (10/09/2026)
- [x] **Punto 2** — Vite 8 + React 19 + TS 6 (`react-ts`). `strict` activado a mano: la plantilla ya no lo trae
- [x] **Punto 3** — Tailwind 4.3 con todos los tokens de `design.md` §2–§5 en `src/styles/tokens.css` (D15)
- [x] **Punto 4** — `vite-plugin-pwa`: manifest en español, iconos generados, service worker con precaché del app-shell
- [x] **Punto 5** — Cliente de Supabase, `AuthProvider`, `AuthGate` y pantalla de acceso con email y contraseña
- [x] Repositorio propio en `aleemarttn/App-My-Life` (10/09/2026), anidado dentro de `Proyectos-Personales-prueba`, que lo ignora
- [x] `core/ui/Button` — el primero de los cuatro componentes que `design.md` §6 pide para la fase 0

### En curso
- [ ] **Punto 6 — a medias.** `src/core/supabase/types.ts` ya está generado y el cliente va tipado, pero se generó desde el MCP de Supabase, no con la CLI. Hay que rehacerlo con la CLI en cuanto esté instalada, y **regenerarlo después de cada migración**.

### Pendiente (en este orden)
7. [ ] `core/db`: esquema de Dexie, tabla `outbox`, motor de sincronización
8. [ ] `app/`: shell, router, barra de navegación inferior de 5 pestañas, avatar de Perfil en cabecera
9. [ ] Pantallas vacías de los cinco destinos (placeholders)
10. [ ] Despliegue en Netlify + variables de entorno
11. [ ] **Prueba de aceptación de la fase 0:** crear un registro en modo avión, cerrar la app, recuperar la red y comprobar que llega a Supabase

---

## Notas para la siguiente sesión

- **BLOQUEO: `auth.users` está vacío, no hay ninguna cuenta.** Sin ella no se puede pasar de la pantalla de acceso ni probar nada de lo que viene después. Se crea una sola vez desde el panel: *Authentication → Users → Add user*, con «Auto Confirm User» marcado (si no, Supabase pide confirmar el email y el login devuelve `email not confirmed`). El trigger `on_auth_user_created` crea la fila de `profiles` sola.
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
