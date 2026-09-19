import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerPrimeraHoja } from "@/core/xlsx";
import { validarFilas } from "./importarFormato";

/**
 * `rutina-con-pesos.xlsx`: la rutina real de Alejandro exportada de la base
 * con una columna `peso` inventada, para poder ver en pantalla como queda
 * un objetivo CON peso pautado (la rutina de verdad no trae ninguno: 0 de
 * sus 39 filas). Este test existe para no darle a importar un archivo
 * generado a mano sin haberlo pasado antes por el validador de verdad.
 */
function archivo(): File {
  const datos = readFileSync(new URL("../../../docs/plantillas/rutina-con-pesos.xlsx", import.meta.url));
  return new File([datos], "rutina-con-pesos.xlsx");
}

describe("el Excel de prueba con pesos", () => {
  it("entra entero por el validador, sin errores ni columnas ausentes", async () => {
    const hoja = await leerPrimeraHoja(archivo());
    const { filas, errores, columnasAusentes } = validarFilas(hoja.filas);

    expect(errores).toEqual([]);
    expect(columnasAusentes).toEqual([]);
    expect(filas).toHaveLength(30);
    expect(new Set(filas.map((f) => f.semana)).size).toBe(2);
    expect(new Set(filas.map((f) => `${f.semana}-${f.dia}`)).size).toBe(8);
  });

  it("trae peso donde tiene sentido y lo deja vacio donde no", async () => {
    const hoja = await leerPrimeraHoja(archivo());
    const { filas } = validarFilas(hoja.filas);

    const prensa = filas.filter((f) => f.ejercicio === "Prensa de piernas").map((f) => f.peso);
    expect(prensa).toEqual([120, 130]);

    // La plancha se mide en segundos: un peso ahi seria ruido.
    expect(filas.find((f) => f.ejercicio === "Plancha")?.peso).toBeNull();
  });

  it("conserva las notas del entrenador, que es media pauta", async () => {
    const hoja = await leerPrimeraHoja(archivo());
    const { filas } = validarFilas(hoja.filas);

    const fondos = filas.find((f) => f.ejercicio === "Fondos en paralelas");
    expect(fondos?.notas).toContain("AMRAP");
    expect(filas.filter((f) => f.notas != null)).toHaveLength(22);
  });
});
