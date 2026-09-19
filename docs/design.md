# Sistema de diseno

Wireframe de referencia: lienzo de Claude Design "My Life - Wireframes" (v1, hasta 18/09/2026) y,
desde el 18/09/2026, los mockups reales de Stitch/Claude Design compartidos por Alejandro
(`kinetic_obsidian/DESIGN.md`, sistema "Kinetic Obsidian") para Entreno, Coche, Finanzas,
Nutricion y Salud. D28 documenta la sustitucion completa; D29 la sexta pestana (Salud); D30 el
selector de RPE que ensena RPE pero guarda RIR.

---

## 1. Principios

1. **La zona del pulgar manda.** Toda accion primaria vive en el tercio inferior.
2. **Un dato grande vale mas que cinco pequenos.** Cada pantalla tiene un numero protagonista.
3. **Oscuro por defecto, OLED.** Fondo casi negro absoluto: menos fatiga visual en el gimnasio y
   de noche, y menos consumo en pantallas OLED.
4. **Menos friccion que features.** Ante la duda, se quita un paso, no se anade una opcion.
5. **Nada de decoracion con datos.** Si un grafico no responde a una pregunta concreta, no existe.
6. **Sin sombras difusas.** La profundidad se consigue con capas tonales (superficie mas clara
   segun se eleva) y bordes de 1 px nitidos, nunca con `box-shadow` difuminado.

---

## 2. Tokens de color

Definidos en `src/styles/tokens.css` (Tailwind v4, D15). Contrastados contra el lienzo el
18/09/2026 (D28): tres superficies mas una de overlay, texto con tres niveles y tres acentos
con uso semantico fijo, no libre.

```css
:root {
  /* Superficies */
  --bg:            #0A0A0C;   /* fondo de la app, "surface void" */
  --surface:       #121216;   /* tarjetas, nivel 1 */
  --surface-2:     #1A1A22;   /* elevado: hojas, inputs activos, nivel 2 */
  --surface-3:     #242430;   /* overlays y modales, nivel 3 */
  --border:        #1E1E28;

  /* Texto */
  --text:          #F3F4F6;
  --text-muted:    #9CA3AF;
  --text-faint:    #4B5563;

  /* Acentos (D28: tres, con uso fijo, no "el que haga falta") */
  --accent:        #D8FF3E;   /* lima: accion primaria, objetivo cumplido, racha */
  --accent-press:  #B0D500;
  --accent-2:      #00F5D4;   /* cian: metricas aerobicas, contadores en vivo */
  --accent-3:      #FF9F1C;   /* ambar: en curso, avisos intermedios */
  --on-accent:     #0A0A0C;

  /* Semanticos */
  --danger:        #FF3B5C;
  --warning:       #FF9F1C;   /* = accent-3 */
  --info:          #00F5D4;   /* = accent-2 */
}
```

**Regla de acento (revisada por D28):** cada uno de los tres acentos tiene un uso fijo y no se
intercambian libremente. Si una pantalla necesita un cuarto significado, se decide antes de
inventar un color nuevo, no se reutiliza uno de los tres fuera de su papel.

---

## 3. Tipografia

Tres familias (D28, via Google Fonts en index.html):

| Familia | Uso |
|---|---|
| Space Grotesk | Titulares y cabeceras (h1/h2/h3, aplicado en la capa base de index.css). |
| Geist | Texto general, cuerpo, etiquetas de campo. Fuente por defecto de body. |
| JetBrains Mono | Lecturas numericas: cronometros, contadores, RPE, e1RM en vivo (font-mono). |

| Rol | Tamano / interlineado | Peso | Uso |
|---|---|---|---|
| display | 48 / 52 | 700 | El numero protagonista: cuenta atras del descanso, valor de DetailView |
| headline-lg | 32 / 38 | 600 | Cabeceras de seccion grandes (Inicio) |
| title-lg | 26 / 32 | 600 | Objetivo en el modo entreno |
| title | 18 / 24 | 600 | Nombre de ejercicio, cabeceras de pantalla |
| body | 16 / 24 | 400 | Texto general. Minimo absoluto para contenido |
| label | 14 / 20 | 500 | Etiquetas de campo, "Serie 1 de 2" |
| caption | 12 / 16 | 400 | Marcas de eje, fechas, metadatos |
| metric-xl | 40 / 44 | 700 | Lectura grande de tarjeta (MetricTile, e1RM), font-mono |
| metric-md | 20 / 26 | 600 | HUD del modo entreno, contadores, font-mono |
| label-md | 12 / 16 | 500 | Etiqueta mayuscula con tracking, font-mono |
| label-sm | 10 / 14 | 500 | Etiqueta diminuta, unidades, font-mono |

Los numeros que se leen de un vistazo usan tabular-nums.

---

## 4. Espaciado, radios y elevacion

- Rejilla base de 4 px. Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Margen lateral de pantalla: 16 px. Separacion entre tarjetas: 12 px. Padding de tarjeta: 16 px.
- Radios (D28, mas ajustados que la v1): 8 px en tarjetas y botones, 12 px en hojas inferiores y
  modales, 999 px solo en chips y toggles circulares (excepcion pildora).
- Elevacion por capa tonal, no por sombra: bg (0) menos surface (1) menos surface-2 (2) menos
  surface-3 (3), cada una con un borde de 1 px nitido, nunca una sombra difuminada.
- Elementos activos o en curso (una serie en marcha, un timer corriendo) llevan un borde de
  acento de 1 px en vez de sombra, como marca de "esto esta vivo ahora".

---

## 5. Zonas tactiles (critico)

| Elemento | Tamano minimo |
|---|---|
| Cualquier elemento pulsable | 48 x 48 px |
| Boton primario | 56 px de alto, ancho completo menos margenes |
| Steppers del modo entreno | 64 x 64 px |
| Barra de navegacion inferior | 56 px + area segura del dispositivo |
| Separacion entre dos elementos pulsables | 8 px minimo |

El lienzo de referencia no contradice estos minimos (su propia regla es tambien 48 px). Respetar
env(safe-area-inset-bottom) en la barra inferior y en los botones fijos.

---

## 6. Inventario de componentes (core/ui)

| Componente | Descripcion |
|---|---|
| AppShell | Layout con cabecera (titulo + avatar de Perfil) y barra inferior de 6 pestanas |
| TabBar | Navegacion inferior, con area segura (D29: 6 destinos) |
| MaterialIcon | Envoltorio de la fuente Material Symbols Outlined (D28), sustituye a icons.tsx |
| Card | Contenedor base de superficie |
| Button | primary (font-mono, mayusculas) . secondary . ghost . danger |
| Stepper | boton menos / valor / boton mas, objetivos de 64 px |
| Chip | Seleccion multiple de etiquetas, estado activo/inactivo |
| SegmentedControl | Rango temporal y RIR |
| MetricChart | Envoltorio unico de Recharts, con carga diferida |
| DetailView | Patron de detalle: cabecera con valor y delta + grafico + lista de registros |
| MetricTile | Icono + etiqueta + valor grande + progreso opcional (D28) |
| ProgressBar | Barra de progreso generica, color por estado semantico (D28) |
| ListRow | Fila de lista: icono o barra lateral + titulo/subtitulo + valor (D28) |
| SectionHeader | Icono + titulo + meta/accion a la derecha (D28) |
| Pill | Chip de estado pequeno: "EN VIVO", "SYNC OK" (D28) |
| BottomSheet | Hoja inferior generica: fondo atenuado + panel con radio 12 px (D28) |
| EmptyState | Icono, frase y accion |
| SyncBadge | Indicador discreto de registros pendientes de sincronizar |

---

## 7. Pantallas del wireframe

| # | Pantalla | Modulo | Fase |
|---|---|---|---|
| 1 | Inicio (dashboard) | app | 0 esqueleto / 1 datos reales, 18/09 |
| 2 | Entreno - sesion del dia | training | 1 |
| 3 | Modo entreno - serie activa, HUD, RPE, e1RM en vivo | training | 1 |
| 4 | Cronometro de descanso | training | 1 |
| 5 | Detalle de ejercicio, DetailView | training | 1 |
| 6 | Salud - cuerpo, readiness y biometria, D29, pestana propia | health | 1.5 / 3 |
| 7 | Coche - ficha del vehiculo | car | 2 |
| 8 | Importar rutina desde Excel | training | 1 |
| 9 | Entreno - portada con la sesion en curso (D31) | training | 1 |

La pantalla 2 tiene dos caras desde D31: el resumen del dia cuando no hay nada empezado y la
pantalla 9 cuando hay una sesion viva. La 3 se sale con flecha sin terminar la sesion, y la
secuencia de series se ve entera en la 9, que es donde hay sitio para leerla con calma.

La pantalla 3 sigue siendo la que decide el proyecto (D28 no cambia esto): sigue sin probarse en
el gimnasio con el dedo real. El HUD, el RPE y la secuencia de series son anadidos sobre el mismo
principio de "una serie visible, controles grandes, sin listas que haya que usar para registrar".

---

## 8. Estados que hay que disenar siempre

1. Vacio - todavia no hay datos. Con accion para crear el primero.
2. Cargando - esqueletos, no spinners. Casi nunca aparece porque la app lee de Dexie.
3. Error - que ha fallado y que puede hacer el usuario.
4. Sin conexion - la app funciona igual; solo aparece SyncBadge. Nunca bloquear la interfaz.

---

## 9. Graficas

- Serie principal en --accent (lima); secundaria en --accent-2 (cian).
- Marcas de eje en --text-faint, tamano caption. Maximo 4 marcas en el eje X en movil.
- Sin rejilla vertical. Rejilla horizontal en --border a 1 px, solo si ayuda a leer valores.
- Sin leyenda cuando hay una sola serie.
- Puntos de datos visibles solo si hay menos de 30; por encima, solo la linea.
- Los eventos anotados (molestias, sustituciones) son marcadores sobre el eje, no series propias.
- El eje Y del peso corporal y de los pesos de ejercicio nunca empieza en cero (D25). El de
  tonelaje y volumen, si.
