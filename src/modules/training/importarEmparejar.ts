/**
 * Emparejamiento difuso de nombres de ejercicio contra el catalogo
 * (spec §4.6, paso 3). Es la parte cara del importador: el entrenador
 * escribe "Sentadilla" y el catalogo dice "Sentadilla trasera".
 *
 * Regla de diseño: el importador PROPONE, nunca decide solo salvo que la
 * coincidencia sea total. Un emparejamiento silencioso y equivocado mete
 * series en el ejercicio equivocado y corrompe el historial sin avisar,
 * que es mucho peor que preguntar.
 */

/** Palabras que no distinguen un ejercicio de otro. */
const VACIAS = new Set(["de", "del", "con", "en", "el", "la", "los", "las", "al", "a", "y", "por", "para"]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t !== "" && !VACIAS.has(t));
}

/**
 * Coeficiente de Dice sobre conjuntos de palabras, no distancia de edicion.
 *
 * Importa que las palabras coincidan, no el orden ni la longitud: "Curl con
 * barra" y "Curl barra" son el mismo ejercicio, mientras que "Press banca"
 * y "Press militar" comparten palabra y no lo son.
 */
export function similitud(a: string, b: string): number {
  if (normalizar(a) === normalizar(b)) return 1;

  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;

  let comunes = 0;
  for (const t of ta) if (tb.has(t)) comunes += 1;

  return (2 * comunes) / (ta.size + tb.size);
}

export interface EjercicioCatalogo {
  id: string;
  name: string;
}

export interface Candidato {
  ejercicio: EjercicioCatalogo;
  puntuacion: number;
}

export type EstadoEmparejado = "exacto" | "probable" | "sin_resolver";

export interface Emparejamiento {
  nombreExcel: string;
  estado: EstadoEmparejado;
  /** Null cuando hay empate o nada se parece lo bastante: lo resuelve el usuario. */
  propuesta: EjercicioCatalogo | null;
  candidatos: Candidato[];
}

/** Por debajo de esto no se propone nada: mejor preguntar que colar un error. */
export const UMBRAL_PROBABLE = 0.6;

const MAX_CANDIDATOS = 8;

export function emparejar(nombresExcel: string[], catalogo: EjercicioCatalogo[]): Emparejamiento[] {
  return nombresExcel.map((nombreExcel) => {
    const candidatos = catalogo
      .map((ejercicio) => ({ ejercicio, puntuacion: similitud(nombreExcel, ejercicio.name) }))
      .filter((c) => c.puntuacion > 0)
      .sort((a, b) => b.puntuacion - a.puntuacion || a.ejercicio.name.localeCompare(b.ejercicio.name))
      .slice(0, MAX_CANDIDATOS);

    const mejor = candidatos[0];
    if (!mejor) return { nombreExcel, estado: "sin_resolver", propuesta: null, candidatos };

    if (mejor.puntuacion === 1) {
      return { nombreExcel, estado: "exacto", propuesta: mejor.ejercicio, candidatos };
    }

    // Empate en lo alto = ambiguo de verdad ("Sentadilla" puede ser trasera
    // o frontal). Proponer una de las dos seria echarlo a suertes.
    const hayEmpate = candidatos[1]?.puntuacion === mejor.puntuacion;
    if (mejor.puntuacion >= UMBRAL_PROBABLE && !hayEmpate) {
      return { nombreExcel, estado: "probable", propuesta: mejor.ejercicio, candidatos };
    }

    return { nombreExcel, estado: "sin_resolver", propuesta: null, candidatos };
  });
}
