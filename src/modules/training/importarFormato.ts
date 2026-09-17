/**
 * Formato canonico de importacion (spec §4.6): una fila por ejercicio.
 *
 * Que una semana tengas 3 dias y la siguiente 5 NO es un cambio de formato:
 * son filas distintas con otro valor en `semana` y `dia`. Lo unico que
 * rompe el importador es que cambien los nombres de las columnas, y por eso
 * se validan antes de tocar nada.
 */

export const COLUMNAS_REQUERIDAS = ["semana", "dia", "ejercicio"] as const;

export const COLUMNAS_OPCIONALES = [
  "tipo",
  "series",
  "reps_min",
  "reps_max",
  "peso",
  "rir",
  "duracion_seg",
  "distancia_m",
  "descanso_seg",
  "video_url",
  "notas",
] as const;

export const TIPOS = ["strength", "cardio", "time", "distance"] as const;
export type TipoEjercicio = (typeof TIPOS)[number];

export interface FilaRutina {
  /** Numero de fila en el Excel, con la cabecera como fila 1. */
  fila: number;
  semana: number;
  dia: string;
  ejercicio: string;
  tipo: TipoEjercicio;
  series: number | null;
  reps_min: number | null;
  reps_max: number | null;
  peso: number | null;
  rir: number | null;
  duracion_seg: number | null;
  distancia_m: number | null;
  descanso_seg: number | null;
  video_url: string | null;
  notas: string | null;
}

export interface ErrorFila {
  /** 0 cuando el problema es del archivo entero y no de una fila. */
  fila: number;
  mensaje: string;
}

export interface ResultadoValidacion {
  filas: FilaRutina[];
  errores: ErrorFila[];
  /** Columnas opcionales ausentes. No bloquean, pero se avisan en el resumen. */
  columnasAusentes: string[];
}

function texto(valor: unknown): string {
  if (valor == null) return "";
  return String(valor).trim();
}

/**
 * Acepta la coma decimal: en un teclado español es lo que sale, y un Excel
 * con configuracion regional española guarda "82,5" como texto.
 */
function numero(valor: unknown): number | null | "invalido" {
  const bruto = texto(valor);
  if (bruto === "") return null;
  const n = Number(bruto.replace(",", "."));
  return Number.isFinite(n) ? n : "invalido";
}

function limpio(valor: number | null | "invalido"): number | null {
  return valor === "invalido" ? null : valor;
}

export function validarFilas(brutas: Record<string, unknown>[]): ResultadoValidacion {
  const errores: ErrorFila[] = [];
  const filas: FilaRutina[] = [];

  const claves = new Set(brutas.flatMap((f) => Object.keys(f)));

  const requeridasQueFaltan = COLUMNAS_REQUERIDAS.filter((c) => !claves.has(c));
  if (requeridasQueFaltan.length > 0) {
    errores.push({ fila: 0, mensaje: `Faltan columnas obligatorias: ${requeridasQueFaltan.join(", ")}.` });
    return { filas, errores, columnasAusentes: [] };
  }

  const columnasAusentes = COLUMNAS_OPCIONALES.filter((c) => !claves.has(c));

  brutas.forEach((bruta, indice) => {
    const fila = indice + 2; // +1 por la cabecera, +1 porque Excel cuenta desde 1
    const anotar = (mensaje: string) => errores.push({ fila, mensaje });

    // Fila completamente vacia: Excel arrastra decenas al final del archivo.
    if (Object.values(bruta).every((v) => texto(v) === "")) return;

    const semana = numero(bruta["semana"]);
    const dia = texto(bruta["dia"]);
    const ejercicio = texto(bruta["ejercicio"]);

    if (typeof semana !== "number" || !Number.isInteger(semana) || semana < 1) {
      anotar("«semana» tiene que ser un número entero de 1 en adelante.");
    }
    if (dia === "") anotar("«dia» está vacío.");
    if (ejercicio === "") anotar("«ejercicio» está vacío.");

    const tipoBruto = texto(bruta["tipo"]).toLowerCase();
    const tipo = (tipoBruto === "" ? "strength" : tipoBruto) as TipoEjercicio;
    if (!TIPOS.includes(tipo)) {
      anotar(`«tipo» no reconocido: "${tipoBruto}". Válidos: ${TIPOS.join(", ")}.`);
    }

    const numericas = {
      series: numero(bruta["series"]),
      reps_min: numero(bruta["reps_min"]),
      reps_max: numero(bruta["reps_max"]),
      peso: numero(bruta["peso"]),
      rir: numero(bruta["rir"]),
      duracion_seg: numero(bruta["duracion_seg"]),
      distancia_m: numero(bruta["distancia_m"]),
      descanso_seg: numero(bruta["descanso_seg"]),
    };
    for (const [columna, valor] of Object.entries(numericas)) {
      if (valor === "invalido") anotar(`«${columna}» no es un número: "${texto(bruta[columna])}".`);
    }

    const repsMin = limpio(numericas.reps_min);
    const repsMax = limpio(numericas.reps_max);
    if (repsMin != null && repsMax != null && repsMin > repsMax) {
      anotar(`«reps_min» (${repsMin}) es mayor que «reps_max» (${repsMax}).`);
    }

    const series = limpio(numericas.series);
    const duracion = limpio(numericas.duracion_seg);
    const distancia = limpio(numericas.distancia_m);

    if (tipo === "strength") {
      if (series == null || series < 1) anotar("un ejercicio de fuerza necesita «series».");
      if (repsMin == null && repsMax == null) anotar("un ejercicio de fuerza necesita «reps_min» o «reps_max».");
    }
    if (tipo === "time" && duracion == null) anotar("un ejercicio de tiempo necesita «duracion_seg».");
    if (tipo === "distance" && distancia == null) anotar("un ejercicio de distancia necesita «distancia_m».");
    if (tipo === "cardio" && duracion == null && distancia == null) {
      anotar("un ejercicio de cardio necesita «duracion_seg» o «distancia_m».");
    }

    filas.push({
      fila,
      semana: typeof semana === "number" ? semana : 0,
      dia,
      ejercicio,
      tipo,
      series,
      reps_min: repsMin,
      reps_max: repsMax,
      peso: limpio(numericas.peso),
      rir: limpio(numericas.rir),
      duracion_seg: duracion,
      distancia_m: distancia,
      descanso_seg: limpio(numericas.descanso_seg),
      video_url: texto(bruta["video_url"]) || null,
      notas: texto(bruta["notas"]) || null,
    });
  });

  return { filas, errores, columnasAusentes };
}
