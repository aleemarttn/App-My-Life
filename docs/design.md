# Sistema de diseño

Wireframe de referencia: lienzo de Claude Design "My Life - Wireframes".

> **Los valores de color de esta sección son una propuesta coherente con el wireframe, no una
> extracción automática de él.** Están ya implementados en `src/styles/tokens.css` pero
> **pendientes de contrastar contra el lienzo** en un dispositivo real (D15). Si alguno no
> coincide, se corrige aquí y en `tokens.css`, que es el único sitio donde vive el valor.
> Todo lo demás (escala, espaciado, zonas táctiles, patrones) es independiente del color y no cambia.

---

## 1. Principios

1. **La zona del pulgar manda.** Toda acción primaria vive en el tercio inferior. La cabecera es para orientarse, no para actuar.
2. **Un dato grande vale más que cinco pequeños.** Cada pantalla tiene un número protagonista.
3. **Oscuro por defecto.** La app se usa en gimnasios y de noche.
4. **Menos fricción que features.** Ante la duda, se quita un paso, no se añade una opción.
5. **Nada de decoración con datos.** Si un gráfico no responde a una pregunta concreta, no existe.

---

## 2. Tokens de color

Definidos en el bloque `@theme` de `src/styles/tokens.css` (Tailwind v4, D15). Cada variable es a
la vez variable CSS —accesible con `var(--color-accent)` en cualquier sitio— y generadora de su
utilidad de Tailwind (`bg-accent`, `text-accent`, `border-accent`). No hay `tailwind.config.js`:
el token vive en un solo archivo y no se duplica.

Los nombres reales llevan el prefijo de espacio de nombres de Tailwind (`--color-bg`,
`--color-surface`…). Se listan aquí sin él por legibilidad:

```css
:root {
  /* Superficies */
  --bg:            #0B0C0E;   /* fondo de la app */
  --surface:       #16181C;   /* tarjetas */
  --surface-2:     #202329;   /* elementos elevados, inputs, chips */
  --border:        #2A2E36;   /* separadores y bordes de 1px */

  /* Texto */
  --text:          #F2F4F7;   /* primario */
  --text-muted:    #9BA3AF;   /* secundario, etiquetas */
  --text-faint:    #626B78;   /* terciario, marcas de eje */

  /* Acento (uno solo, D-diseño) */
  --accent:        #4ADE80;   /* acciones primarias y serie principal de datos */
  --accent-press:  #22C55E;   /* estado pulsado */
  --on-accent:     #08130C;   /* texto sobre acento */

  /* Semánticos */
  --danger:        #F87171;   /* alertas de coche, molestias, desvíos */
  --warning:       #FBBF24;   /* umbrales próximos */
  --info:          #60A5FA;   /* serie secundaria en gráficos */
}
```

**Contraste:** `--text` sobre `--bg` ≈ 16:1 y `--text-muted` sobre `--surface` ≈ 6:1, ambos por encima de AA. `--text-faint` es solo para marcas de eje y texto no esencial. **Nunca** poner texto de tamaño normal en `--text-faint` sobre `--surface-2`.

**Regla de acento:** un solo color de acento en toda la app. Si una pantalla parece necesitar un segundo, es que tiene dos acciones primarias y hay que decidir cuál lo es.

---

## 3. Tipografía

Fuente del sistema (`-apple-system, system-ui, sans-serif`). Sin webfonts: ahorran 100–200 kB y en móvil no se distinguen.

| Rol | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `display` | 48 / 52 | 700 | El número protagonista: cuenta atrás del descanso, peso actual |
| `title-lg` | 28 / 34 | 600 | Objetivo en el modo entreno ("15 kg × 15 reps") |
| `title` | 20 / 26 | 600 | Nombre de ejercicio, cabeceras de pantalla |
| `body` | 16 / 24 | 400 | Texto general. **Mínimo absoluto para contenido.** |
| `label` | 14 / 20 | 500 | Etiquetas de campo, "Serie 1 de 2" |
| `caption` | 12 / 16 | 400 | Marcas de eje, fechas, metadatos |

Los números que se leen de un vistazo usan **variante tabular** (`font-variant-numeric: tabular-nums`) para que no bailen al cambiar de valor.

---

## 4. Espaciado, radios y elevación

- **Rejilla base de 4 px.** Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Margen lateral de pantalla:** 16 px.
- **Separación entre tarjetas:** 12 px.
- **Padding interno de tarjeta:** 16 px.
- **Radios:** 12 px en tarjetas, 16 px en hojas inferiores, 10 px en botones, 999 px en chips.
- **Elevación por color, no por sombra.** En tema oscuro las sombras no se ven: se sube de `--surface` a `--surface-2`.

---

## 5. Zonas táctiles (crítico)

| Elemento | Tamaño mínimo |
|---|---|
| Cualquier elemento pulsable | 48 × 48 px |
| Botón primario | 56 px de alto, ancho completo menos márgenes |
| Steppers del modo entreno | 64 × 64 px |
| Barra de navegación inferior | 56 px + área segura del dispositivo |
| Separación entre dos elementos pulsables | 8 px mínimo |

Respetar `env(safe-area-inset-bottom)` en la barra inferior y en los botones fijos: sin eso, en iPhone el botón principal queda debajo del indicador de inicio.

Estos tamaños están en `tokens.css` como escala de espaciado, para no escribir números mágicos:
`size-touch` (48), `h-touch-primary` (56), `size-touch-stepper` (64), `h-tabbar` (56). Las áreas
seguras son las utilidades `pt-safe`, `pb-safe` y `h-tabbar-safe` de `src/styles/index.css`, y
requieren `viewport-fit=cover` en el `<meta name="viewport">` (ya puesto en `index.html`).

---

## 6. Inventario de componentes (`core/ui`)

Se construyen en este orden; los cuatro primeros los necesita la fase 0.

| Componente | Descripción |
|---|---|
| `AppShell` | Layout con cabecera (título + avatar de Perfil) y barra inferior de 5 pestañas |
| `TabBar` | Navegación inferior, con área segura |
| `Card` | Contenedor base de superficie |
| `Button` | `primary` · `secondary` · `ghost` · `danger`. Alto 56 px en primario |
| `Stepper` | − / valor / + con objetivos de 64 px. **El control más importante de la app** |
| `Chip` | Selección múltiple de etiquetas, estado activo/inactivo |
| `SegmentedControl` | Rango temporal (30 d · 90 d · 1 a · Todo) y RIR (0–5) |
| `MetricChart` | Envoltorio único de Recharts, con carga diferida |
| `DetailView` | Patrón de detalle: cabecera con valor y delta + gráfico + lista de registros |
| `StatTile` | Valor grande + etiqueta + delta opcional |
| `BottomSheet` | Hoja inferior para el vídeo del ejercicio y los selectores |
| `EmptyState` | Icono, frase y acción. Se define **antes** de necesitarlo, no después |
| `SyncBadge` | Indicador discreto de registros pendientes de sincronizar |

---

## 7. Pantallas del wireframe

| # | Pantalla | Módulo | Fase |
|---|---|---|---|
| 1 | Inicio (dashboard) | `app` | 0 (esqueleto) / 1 (datos) |
| 2 | Entreno — sesión del día | `training` | 1 |
| 3 | **Modo entreno — serie activa** | `training` | 1 |
| 4 | Cronómetro de descanso | `training` | 1 |
| 5 | Detalle de ejercicio (`DetailView`) | `training` | 1 |
| 6 | Perfil — Cuerpo | `body` | 1.5 |
| 7 | Coche — ficha del vehículo | `car` | 2 |
| 8 | Importar rutina desde Excel | `training` | 1 |

**La pantalla 3 es la que decide el proyecto.** Se prototipa y se prueba en el gimnasio en la primera semana de la fase 1, antes de construir nada más del módulo. Si el flujo de registro no es cómodo con una mano y sin mirar, se rehace antes de seguir.

---

## 8. Estados que hay que diseñar siempre

Para cada pantalla con datos, las cuatro variantes. Es el olvido más habitual y el que más retrabajo genera:

1. **Vacío** — todavía no hay datos. Con acción para crear el primero.
2. **Cargando** — esqueletos, no *spinners*. Como la app lee de Dexie, este estado casi nunca aparece; cuando lo haga, que no salte el diseño.
3. **Error** — qué ha fallado y qué puede hacer el usuario.
4. **Sin conexión** — la app funciona igual; solo aparece `SyncBadge` con los registros pendientes. **Nunca bloquear la interfaz por falta de red.**

---

## 9. Gráficas

Reglas específicas de `MetricChart`, complementarias a `docs/spec.md` §2.8:

- Serie principal en `--accent`; secundaria (media móvil, comparativa) en `--info`.
- Marcas de eje en `--text-faint`, tamaño `caption`. Máximo 4 marcas en el eje X en móvil.
- Sin rejilla vertical. Rejilla horizontal en `--border` a 1 px, y solo si ayuda a leer valores.
- Sin leyenda cuando hay una sola serie.
- Puntos de datos visibles solo si hay menos de 30; por encima, solo la línea.
- Los eventos anotados (molestias, sustituciones, mantenimientos) son marcadores sobre el eje, no series propias.
- **El eje Y del peso corporal nunca empieza en cero**: aplastaría la variación real. El de tonelaje y volumen, sí.
