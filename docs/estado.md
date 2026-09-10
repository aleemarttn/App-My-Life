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
- [x] Migraciones SQL escritas (`supabase/migrations/`) — **pendientes de aplicar**
- [x] **Punto 2** — Vite 8 + React 19 + TS 6 (`react-ts`). `strict` activado a mano: la plantilla ya no lo trae
- [x] **Punto 3** — Tailwind 4.3 con todos los tokens de `design.md` §2–§5 en `src/styles/tokens.css` (D15)
- [x] **Punto 4** — `vite-plugin-pwa`: manifest en español, iconos generados, service worker con precaché del app-shell

### En curso
- [ ] Nada. Parado a propósito tras el punto 4 para validar el color en el móvil antes de seguir.

### Pendiente (en este orden)
1. [ ] Crear el proyecto en Supabase y aplicar las dos migraciones — **lo hace Alejandro**
5. [ ] Cliente de Supabase + Auth (email + contraseña, un solo usuario)
6. [ ] Generar tipos: `supabase gen types typescript`
7. [ ] `core/db`: esquema de Dexie, tabla `outbox`, motor de sincronización
8. [ ] `app/`: shell, router, barra de navegación inferior de 5 pestañas, avatar de Perfil en cabecera
9. [ ] Pantallas vacías de los cinco destinos (placeholders)
10. [ ] Despliegue en Netlify + variables de entorno
11. [ ] **Prueba de aceptación de la fase 0:** crear un registro en modo avión, cerrar la app, recuperar la red y comprobar que llega a Supabase

---

## Notas para la siguiente sesión

- **Bloqueo actual:** los puntos 5 y 6 necesitan que exista el proyecto de Supabase. Hacen falta `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en un `.env` (plantilla en `.env.example`), y el `project-ref` para `supabase gen types typescript`.
- Las migraciones están escritas pero **no aplicadas**. Revisar la política RLS de `exercises` antes de aplicar: es la única tabla que permite filas globales (`user_id is null`).
- **Los colores siguen sin confirmar contra el lienzo.** Ya están implementados en `src/styles/tokens.css` y se ven todos juntos en la pantalla provisional de `src/app/App.tsx`. Mirarlos en el iPhone, no en el monitor: el brillo y el punto negro cambian el juicio. Si alguno falla, se cambia solo en `tokens.css`.
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
