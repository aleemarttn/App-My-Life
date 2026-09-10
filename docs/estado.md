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
- [x] `core/ui/Button` y `core/ui/SyncBadge`
- [x] **Punto 7** — `core/db` completo: esquema de Dexie con las diez tablas, `outbox`, motor de subida y bajada, y **24 tests en verde**

### En curso
- [ ] **Punto 6 — a medias.** `src/core/supabase/types.ts` ya está generado y el cliente va tipado, pero se generó desde el MCP de Supabase, no con la CLI. Hay que rehacerlo con la CLI en cuanto esté instalada, y **regenerarlo después de cada migración**.
- [ ] **Punto 7 — sin probar contra el servidor real.** Los tests cubren la lógica de la cola con un doble; falta que un registro creado en la app llegue de verdad a Supabase. Es lo que verifica el punto 11.

### Pendiente (en este orden)
8. [ ] `app/`: shell, router, barra de navegación inferior de 5 pestañas, avatar de Perfil en cabecera
9. [ ] Pantallas vacías de los cinco destinos (placeholders)
10. [ ] Despliegue en Netlify + variables de entorno
11. [ ] **Prueba de aceptación de la fase 0:** crear un registro en modo avión, cerrar la app, recuperar la red y comprobar que llega a Supabase

---

## Notas para la siguiente sesión

- **Cuenta creada y login verificado** el 10/09/2026 (`alejandromartin333@gmail.com`). El trigger `on_auth_user_created` creó la fila de `profiles` sola, lo que confirma de paso que el `revoke execute` de la migración `harden_functions` no rompió el trigger: se ejecuta como propietario de la tabla, no como el cliente.
- **Cómo se prueba el punto 11 hoy:** entrar, ir a la tarjeta «Sincronización» de `DesignCheck`, poner el navegador en modo sin conexión (F12 → Network → Offline), pulsar «Crear ejercicio de prueba» y ver subir el contador de pendientes. Recuperar la red y comprobar que baja a cero y que la fila aparece en la tabla `exercises` de Supabase.
- **Sin borrado de la base local al cerrar sesión, y es deliberado**: ahí puede haber registros sin subir. Consecuencia conocida: si algún día entrara un usuario distinto en el mismo dispositivo, vería los datos locales del anterior. No es un problema real con un solo usuario (D4), pero está aquí escrito para que no sorprenda.
- **El bundle va por 160 kB gzip** y el build ya avisa de que el trozo pasa de 500 kB sin comprimir. No es urgente, pero hay que atacarlo antes de que entre Recharts: la vía es dividir por rutas en el punto 8 y la carga diferida de gráficas que ya exige `CLAUDE.md`.
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
