# My Life — Contrato de trabajo

PWA personal de registro y control. Cuatro pestañas —entrenamiento, nutrición, economía y coche— más **Perfil** en la cabecera, que contiene cuerpo y salud.
Usuario único (Alejandro), sin publicación en App Store. Español, tema oscuro por defecto.

\---

## PROTOCOLO OBLIGATORIO DE INICIO DE SESIÓN

Antes de escribir o modificar **una sola línea de código**:

1. Lee `docs/estado.md` — en qué punto está el proyecto ahora mismo.
2. Lee la sección de `docs/spec.md` correspondiente al módulo que se va a tocar.
3. Si la tarea toca interfaz, lee `docs/design.md`.
4. Si la tarea cambia una decisión previa, lee `docs/decisiones.md`.
5. Resume en dos frases qué vas a hacer y **espera confirmación** antes de empezar.

No asumas que el estado del proyecto es el que recuerdas de una sesión anterior. No lo es.

## PROTOCOLO OBLIGATORIO DE CIERRE DE SESIÓN

1. Actualiza `docs/estado.md`: qué se ha hecho, qué queda pendiente, qué está a medias y por dónde retomar.
2. Si se ha tomado una decisión de diseño, añádela a `docs/decisiones.md` con fecha y **motivo**. Append-only, nunca se reescribe una decisión antigua.
3. Si la implementación se ha desviado de `docs/spec.md`, actualiza la especificación. La spec es la fuente de verdad, no el código.

\---

## Documentación

|Archivo|Contenido|Cuándo leerlo|
|-|-|-|
|`CLAUDE.md`|Este archivo. Reglas e índice.|Siempre (automático)|
|`docs/spec.md`|Especificación funcional y modelo de datos completo|Al tocar cualquier módulo|
|`docs/design.md`|Sistema visual: tokens, tipografía, componentes, zonas táctiles|Al tocar cualquier interfaz|
|`docs/estado.md`|Estado actual del proyecto|Al arrancar cualquier sesión|
|`docs/decisiones.md`|Log de decisiones con fecha y motivo|Al cambiar de rumbo|

Este archivo se mantiene **por debajo de 150 líneas** a propósito: se carga en cada turno de la conversación. El detalle vive en `docs/`, que se lee bajo demanda.

\---

## Stack

* **Frontend:** Vite + React + TypeScript
* **Gráficas:** Recharts, con carga diferida y envuelto en `core/ui/MetricChart`
* **PWA:** vite-plugin-pwa (Workbox)
* **Estilos:** Tailwind CSS
* **Estado servidor:** TanStack Query
* **Persistencia local:** Dexie (IndexedDB) — obligatorio, la app es offline-first
* **Excel:** SheetJS, import y export en el navegador
* **Backend:** Supabase — Postgres, Auth, RLS, Storage, Edge Functions, pg\_cron
* **Hosting:** Vercel (D20)
* **Notificaciones:** Telegram Bot API (principal) + Web Push (secundaria)

## Estructura

```
src/
├── app/        shell, router, layout, navegación
├── modules/    training · body · car · finance · nutrition
└── core/       db (Dexie + outbox) · supabase · xlsx · ui
supabase/
├── migrations/
└── functions/  parse-entry · telegram-webhook · health-ingest · scheduler-tick
docs/           spec.md · estado.md · decisiones.md
```

\---

## REGLAS INNEGOCIABLES

**Arquitectura**

* Un módulo **nunca** importa de otro módulo. Lo compartido sube a `core/`.
* La UI **nunca** escribe directamente en Supabase. Todo pasa por `core/db` (Dexie + outbox).
* La UI **siempre** lee de Dexie. Nunca espera a la red para pintar.
* Los `id` se generan en cliente (UUID v7). Nada de `serial` ni `identity`.

**Datos**

* Toda tabla nueva lleva `user\_id` y su política RLS **en la misma migración**. Sin excepciones.
* Migraciones versionadas en `supabase/migrations/`. Nunca cambios a mano en el panel de Supabase.
* Los datos derivados (tonelaje, e1RM, consumo L/100 km, medias móviles) **nunca se almacenan**.
* Toda agregación que alimente una gráfica se calcula **en cliente**, sobre datos de Dexie. Las vistas de Postgres son solo para servidor (exportaciones, `scheduler-tick`, agente entrenador). Motivo: las gráficas deben funcionar sin cobertura.
* La `outbox` no borra un registro hasta recibir confirmación del servidor.

**Seguridad**

* Ninguna clave secreta en el bundle del cliente. Tokens de Telegram, claves de LLM y claves de servicio viven solo en variables de entorno de Edge Functions.
* La clave `anon` de Supabase es pública por diseño: la seguridad vive en las políticas RLS.
* El bucket de fotos corporales es **privado**. Acceso solo por URLs firmadas de caducidad corta.
* El webhook de Telegram valida `secret\_token` de cabecera y lista blanca de `chat\_id`.

**Producto**

* No se empieza una fase sin cumplir el criterio de salida de la anterior (`docs/spec.md` §10).
* Nada de UI multiusuario, onboarding, planes ni facturación. El multi-tenant vive solo en el modelo de datos.
* Ante la duda entre una feature más y menos fricción de registro, gana **menos fricción**. La app muere si registrar cuesta.

\---

## Convenciones de código

* TypeScript estricto. `any` prohibido salvo justificación en comentario.
* Tipos de base de datos generados con `supabase gen types typescript`, nunca escritos a mano.
* Nombres de tablas y columnas en `snake\_case` e **inglés**. Textos de la interfaz en **español**.
* Componentes en `PascalCase`, hooks en `useCamelCase`.
* Un componente por archivo. Si pasa de 200 líneas, se parte.
* Sin librerías de UI pesadas: Tailwind y componentes propios en `core/ui`.
* Gráficas: **solo** a través de `core/ui/MetricChart`. Ningún módulo instancia Recharts directamente.
* El bundle de gráficas se carga con `React.lazy`. Nunca debe entrar en el arranque del modo entreno.
* Toda entidad con historial (ejercicio, peso, medida, categoría de gasto, consumo) usa el patrón `DetailView` de `docs/spec.md` §2.8. No se diseñan pantallas de detalle a medida.

## Qué NO hacer

* No instalar dependencias sin justificarlo primero.
* No refactorizar código que no forma parte de la tarea en curso.
* No crear archivos de documentación nuevos (README, notas) salvo petición explícita.
* No añadir tests a módulos que aún no tienen el comportamiento cerrado; sí en `core/db` y en los parsers.
* No "mejorar" la especificación por iniciativa propia: si algo parece mal, se dice y se decide antes de tocarlo.

\---

## Estado actual

**Fase 0 — Cimientos: COMPLETADA** el 10/09/2026. Desplegada en https://app-my-life.vercel.app, instalada en el iPhone y con la sincronización offline verificada de extremo a extremo.

**Fase 1 — Entrenamiento.** Lo primero es prototipar el modo entreno (`spec.md` §4.7) y probarlo en el gimnasio **antes de construir nada más**: es la pantalla que decide el proyecto. Ver `docs/estado.md`.

