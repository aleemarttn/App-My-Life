import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerPrimeraHoja } from "@/core/xlsx";
import { emparejar } from "./importarEmparejar";
import { validarFilas } from "./importarFormato";

/**
 * El circuito completo del importador contra el archivo de ejemplo real:
 * SheetJS lee el .xlsx, se valida y se empareja contra el catalogo.
 *
 * Es el test que de verdad protege el importador: los otros prueban la
 * logica con filas inventadas, y este demuestra que un Excel de verdad
 * —con sus celdas vacias y sus nombres escritos en corto— entra entero.
 */

/** El catalogo global de supabase/seed.sql, tal cual. */
const CATALOGO = [
  "Press banca plano",
  "Press banca inclinado",
  "Press mancuernas plano",
  "Aperturas en polea",
  "Fondos en paralelas",
  "Dominadas",
  "Jalón al pecho",
  "Remo con barra",
  "Remo en polea baja",
  "Remo con mancuerna",
  "Pull-over en polea",
  "Sentadilla trasera",
  "Sentadilla frontal",
  "Prensa de piernas",
  "Peso muerto",
  "Peso muerto rumano",
  "Zancadas",
  "Extensión de cuádriceps",
  "Curl femoral tumbado",
  "Hip thrust",
  "Elevación de gemelos",
  "Press militar",
  "Press hombro mancuernas",
  "Elevaciones laterales",
  "Pájaros",
  "Face pull",
  "Curl con barra",
  "Curl con mancuernas",
  "Curl martillo",
  "Extensión de tríceps polea",
  "Press francés",
  "Plancha",
  "Elevación de piernas",
  "Rueda abdominal",
  "Correr",
  "Bicicleta estática",
  "Cinta de correr",
  "Elíptica",
  "Remo ergómetro",
  "Caminar",
].map((name, i) => ({ id: String(i + 1), name }));

function archivoEjemplo(): File {
  const datos = readFileSync(new URL("../../../docs/plantillas/rutina-ejemplo.xlsx", import.meta.url));
  return new File([datos], "rutina-ejemplo.xlsx");
}

describe("importar el Excel de ejemplo", () => {
  it("lo lee y lo valida sin un solo error", async () => {
    const hoja = await leerPrimeraHoja(archivoEjemplo());
    const { filas, errores, columnasAusentes } = validarFilas(hoja.filas);

    expect(errores).toEqual([]);
    expect(columnasAusentes).toEqual([]);
    expect(hoja.nombre).toBe("Mesociclo 3");
    expect(filas).toHaveLength(64);
    expect(new Set(filas.map((f) => f.semana)).size).toBe(4);
    expect(new Set(filas.map((f) => `${f.semana}-${f.dia}`)).size).toBe(16);
  });

  it("conserva la progresion entre semanas", async () => {
    const hoja = await leerPrimeraHoja(archivoEjemplo());
    const { filas } = validarFilas(hoja.filas);

    const sentadilla = filas.filter((f) => f.ejercicio === "Sentadilla").map((f) => f.peso);
    // Sube tres semanas y descarga en la cuarta. Si el parser perdiera los
    // decimales o la columna, esto se caeria.
    expect(sentadilla).toEqual([80, 82, 84, 68]);
  });

  it("empareja lo que puede y se calla donde hay duda", async () => {
    const hoja = await leerPrimeraHoja(archivoEjemplo());
    const { filas } = validarFilas(hoja.filas);
    const nombres = [...new Set(filas.map((f) => f.ejercicio))];

    const porNombre = new Map(emparejar(nombres, CATALOGO).map((e) => [e.nombreExcel, e]));
    const estado = (n: string) => porNombre.get(n)?.estado;
    const propuesta = (n: string) => porNombre.get(n)?.propuesta?.name;

    expect(nombres).toHaveLength(16);

    // Coincidencia total aunque el entrenador escriba sin tildes o en corto.
    expect(estado("Jalon al pecho")).toBe("exacto");
    expect(estado("Curl barra")).toBe("exacto");
    expect(estado("Correr")).toBe("exacto");

    // Un unico parecido claro: se propone, pero se revisa.
    expect(propuesta("Prensa")).toBe("Prensa de piernas");
    expect(propuesta("Femoral tumbado")).toBe("Curl femoral tumbado");
    expect(propuesta("Gemelos")).toBe("Elevación de gemelos");
    expect(propuesta("Triceps polea")).toBe("Extensión de tríceps polea");

    // Ambiguo de verdad: trasera o frontal, plano o inclinado. Decide el
    // usuario, porque acertar a medias aqui corrompe el historial.
    expect(estado("Sentadilla")).toBe("sin_resolver");
    expect(estado("Press banca")).toBe("sin_resolver");

    // No esta en el catalogo y no se parece a nada: se creara.
    expect(estado("Crunch en polea")).toBe("sin_resolver");
  });
});
