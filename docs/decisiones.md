# Log de decisiones

> **Append-only.** Nunca se reescribe ni se borra una decisión antigua. Si una decisión se revierte,
> se añade una nueva entrada que la anula y explica por qué. El valor de este archivo está en poder
> reconstruir *por qué* el proyecto es como es, no solo *cómo* es.

---

### D1 · Orden de construcción — 09/09/2026
**Decisión:** entrenamiento → coche → economía → nutrición.
**Motivo:** entrenamiento es el único módulo que no existe en ninguna forma, así que aporta valor nuevo desde el primer día y no pone en riesgo nada que ya funcione. El coche va segundo porque es el más barato de construir y valida el sistema de notificaciones programadas, del que dependen todos los demás módulos.

### D2 · Captura de datos — 09/09/2026
**Decisión:** un único servicio `parse-entry` con dos frontales, Telegram y la propia PWA.
**Motivo:** el bot de Telegram actual funciona porque la captura cuesta 3 segundos. Un chat dentro de la PWA sería *más* fricción, no menos. Con un parser compartido no hay que elegir: cada canal sirve a un contexto distinto y la fuente de verdad es siempre Supabase.

### D3 · Relación con Nutrigasto — 09/09/2026
**Decisión:** proyectos separados. Se reutiliza código, no datos. El módulo de nutrición se pospone a la fase 4, después de la entrega del TFG.
**Motivo:** Nutrigasto tiene entrega en octubre de 2026. Acoplarlo a un proyecto personal ataría el TFG a los plazos de My Life y viceversa. Separarlos elimina el riesgo académico por completo.

### D4 · Naturaleza del proyecto — 09/09/2026
**Decisión:** herramienta personal, con multi-tenant solo a nivel de modelo de datos (`user_id` + RLS en todas las tablas). Nada de UI multiusuario.
**Motivo:** añadir `user_id` cuesta unas horas hoy y hace imposible una migración dolorosa mañana. Construir onboarding, roles y facturación para un producto que quizá no llegue es gastar semanas contra una hipótesis sin validar.

### D5 · Comentarios de entrenamiento — 09/09/2026
**Decisión:** tres capas — RIR (número), etiquetas cerradas (categoría) y nota de texto libre (matiz).
**Motivo:** la propuesta inicial de solo etiquetas era incorrecta porque asumía que el consumidor era la app. El consumidor real de la nota es un humano (o una IA entrenadora), que necesita el matiz. Pero renunciar a lo estructurado impediría cualquier análisis agregado. Cada capa tiene su consumidor: RIR para la progresión automática, etiquetas para detectar patrones, texto para el entrenador.

### D6 · Intercambio con el entrenador — 09/09/2026
**Decisión:** Excel bidireccional. Se descarta construir una UI de entrenador.
**Motivo:** el entrenador no cambia de herramienta y es quien menos incentivo tiene para adaptarse. Además, el entrenador acabará siendo una IA propia, y un agente lee y escribe en Supabase directamente: no necesita interfaz. Construir la opción B sería construir el producto, no la app. `routines.source` contempla ya `'coach_api'` para ese futuro.

### D7 · Navegación — 09/09/2026
**Decisión:** barra inferior de 5 pestañas (Inicio · Entreno · Comida · Dinero · Coche) y dashboard como pantalla de arranque.
**Motivo:** las pestañas son acciones diarias. El dashboard responde a "¿qué tengo hoy?" sin obligar a navegar.

### D8 · Jerarquía de la rutina — 09/09/2026
**Decisión:** rutina (mesociclo) → **semana** → día → ejercicio. Columna `routine_days.week_number`.
**Motivo:** detectado al definir el formato de exportación. El mesociclo progresa entre semanas: la semana 3 no lleva los mismos kilos que la semana 1. Sin esa dimensión, importar un mesociclo de 4 semanas habría machacado los objetivos de la semana anterior y el historial habría quedado inservible.

### D9 · Fotos de progreso — 09/09/2026
**Decisión:** Supabase Storage, bucket privado, URLs firmadas de 60 segundos, compresión en cliente.
**Motivo:** la alternativa local (IndexedDB) no tiene copia de seguridad y se pierde al limpiar los datos del navegador. El riesgo del bucket es de configuración, se audita una vez y queda resuelto.

### D10 · Salud de iOS — 09/09/2026
**Decisión:** integración vía Atajos de iOS (POST a una Edge Function propia) con cinco métricas: peso, pasos, calorías activas, sueño y FC en reposo.
**Motivo:** una PWA no puede acceder a HealthKit, no existe API web y no va a existir. Atajos es el único camino sin app nativa, y además mantiene los datos yendo del iPhone directamente a Supabase propio, sin terceros.

### D11 · Cuerpo y salud dentro de Perfil — 09/09/2026
**Decisión:** cuerpo y salud no son una pestaña de la barra inferior; viven en Perfil, accesible desde el avatar de la cabecera.
**Motivo:** las pestañas inferiores son acciones diarias; el perfil es consulta y configuración semanal. Darle el mismo peso visual que a "Entreno" sería falsear la jerarquía, y seis elementos en la barra inferior rompen la zona táctil cómoda en pantallas de 6 pulgadas.

### D12 · Capa de gráficas — 09/09/2026
**Decisión:** un patrón único `DetailView` reutilizado por todos los módulos, sobre un componente `core/ui/MetricChart` (Recharts, carga diferida). **Toda agregación se calcula en cliente sobre Dexie**, no en vistas de Postgres.
**Motivo:** esto corrige una decisión anterior de la v0.2 de la especificación. Si las gráficas se alimentaran de vistas de Postgres, no funcionarían en el gimnasio sin cobertura, que es justo donde se usan. Los volúmenes de datos (miles de filas al año) hacen la agregación en cliente trivial.

### D13 · Métrica principal de progresión en fuerza — 09/09/2026
**Decisión:** 1RM estimado (fórmula de Epley), no el peso máximo levantado.
**Motivo:** el peso máximo miente cuando cambia el rango de repeticiones. 100 kg × 5 y 80 kg × 12 son esfuerzos casi equivalentes, pero un gráfico de peso máximo mostraría una caída del 20% inexistente. El e1RM normaliza ambos en un número comparable. Se etiqueta siempre como "estimado", nunca como récord real.

### D14 · Peso corporal: la señal es la media móvil — 09/09/2026
**Decisión:** el gráfico de peso muestra la media móvil de 7 días como serie principal y el dato diario como serie secundaria y tenue. En el dashboard solo se muestra la media.
**Motivo:** el peso diario es mayoritariamente ruido (agua, sodio, glucógeno) con oscilaciones de ±1,5 kg, muy por encima de la grasa que se puede ganar o perder en un día. Mostrar el dato crudo como principal induce a decisiones equivocadas.

### D15 · Tailwind v4 con `@theme`, sin `tailwind.config.js` — 10/09/2026
**Decisión:** los tokens de diseño se declaran una sola vez en el bloque `@theme` de `src/styles/tokens.css`, con Tailwind 4.3 y el plugin oficial `@tailwindcss/vite`. Anula la frase de `docs/design.md` §2 que hablaba de `theme.extend.colors`, que era sintaxis de la v3.
**Motivo:** `design.md` pedía dos cosas a la vez —variables CSS en `:root` *y* colores en la configuración de Tailwind— que en la v3 obligan a escribir cada hex en dos archivos y mantenerlos sincronizados a mano. En la v4 una sola declaración cumple ambas: genera la utilidad (`bg-surface`) y deja la variable accesible como `var(--color-surface)`, que es justo lo que necesitará `MetricChart` para pasarle colores a Recharts desde JS. Además, `estado.md` avisa de que los colores están sin confirmar contra el lienzo: con un único sitio donde tocarlos, ajustarlos es cambiar seis líneas y no una cacería. Coste: ninguno relevante, porque la v3 ya no recibe desarrollo activo.

### D16 · Alias `@/` en lugar de rutas relativas — 10/09/2026
**Decisión:** las importaciones internas usan el alias `@/` (`@/core/db`, `@/app/App`), declarado a la vez en `tsconfig.app.json` (`paths`) y en `vite.config.ts` (`resolve.alias`).
**Motivo:** la regla de oro de la arquitectura es que un módulo nunca importa de otro módulo. Con rutas relativas, `../../modules/car/x` se cuela con facilidad y solo se detecta leyendo con atención; con alias, `@/modules/car/...` dentro de `modules/training/` salta a la vista en una revisión y es trivial de detectar con un grep. El coste es mantener la ruta declarada en dos archivos, y ambos llevan un comentario que lo advierte.
