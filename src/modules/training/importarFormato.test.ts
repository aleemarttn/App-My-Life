import { describe, expect, it } from "vitest";
import { validarFilas } from "./importarFormato";

function filaValida(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    semana: 1,
    dia: "Lunes - Pierna",
    ejercicio: "Sentadilla",
    tipo: "strength",
    series: 4,
    reps_min: 8,
    reps_max: 10,
    peso: 80,
    rir: 2,
    duracion_seg: "",
    distancia_m: "",
    descanso_seg: 180,
    video_url: "",
    notas: "",
    ...extra,
  };
}

describe("validarFilas", () => {
  it("acepta una fila correcta y numera la fila como en Excel", () => {
    const { filas, errores } = validarFilas([filaValida()]);

    expect(errores).toEqual([]);
    expect(filas).toHaveLength(1);
    // La cabecera es la fila 1, asi que el primer dato es la 2. Si esto se
    // descuadra, los errores señalan a la fila equivocada del archivo.
    expect(filas[0]?.fila).toBe(2);
    expect(filas[0]?.peso).toBe(80);
  });

  it("bloquea el archivo entero si falta una columna obligatoria", () => {
    const { ejercicio: _, ...sinEjercicio } = filaValida();
    const { filas, errores } = validarFilas([sinEjercicio]);

    expect(filas).toEqual([]);
    expect(errores).toHaveLength(1);
    expect(errores[0]?.fila).toBe(0);
    expect(errores[0]?.mensaje).toContain("ejercicio");
  });

  it("avisa de las columnas opcionales ausentes sin bloquear", () => {
    const { peso: _, ...sinPeso } = filaValida();
    const { filas, errores, columnasAusentes } = validarFilas([sinPeso]);

    expect(errores).toEqual([]);
    expect(filas).toHaveLength(1);
    // Sin este aviso, una columna mal escrita ("pesos") importaria la rutina
    // entera sin cargas y nadie se enteraria hasta el gimnasio.
    expect(columnasAusentes).toContain("peso");
  });

  it("entiende la coma decimal", () => {
    const { filas, errores } = validarFilas([filaValida({ peso: "82,5" })]);

    expect(errores).toEqual([]);
    expect(filas[0]?.peso).toBe(82.5);
  });

  it("rechaza un numero que no lo es", () => {
    const { errores } = validarFilas([filaValida({ peso: "ochenta" })]);

    expect(errores).toHaveLength(1);
    expect(errores[0]?.mensaje).toContain("peso");
  });

  it("rechaza un rango de repeticiones invertido", () => {
    const { errores } = validarFilas([filaValida({ reps_min: 12, reps_max: 8 })]);

    expect(errores.some((e) => e.mensaje.includes("mayor que"))).toBe(true);
  });

  it("ignora las filas vacias que Excel arrastra al final", () => {
    const vacia = Object.fromEntries(Object.keys(filaValida()).map((k) => [k, ""]));
    const { filas, errores } = validarFilas([filaValida(), vacia, vacia]);

    expect(errores).toEqual([]);
    expect(filas).toHaveLength(1);
  });

  it("exige series y repeticiones a un ejercicio de fuerza", () => {
    const { errores } = validarFilas([filaValida({ series: "", reps_min: "", reps_max: "" })]);

    expect(errores.some((e) => e.mensaje.includes("«series»"))).toBe(true);
    expect(errores.some((e) => e.mensaje.includes("reps_min"))).toBe(true);
  });

  it("acepta cardio sin series pero con duracion o distancia", () => {
    const cardio = filaValida({
      ejercicio: "Correr",
      tipo: "cardio",
      series: "",
      reps_min: "",
      reps_max: "",
      peso: "",
      duracion_seg: 1800,
      distancia_m: 5000,
    });
    const { filas, errores } = validarFilas([cardio]);

    expect(errores).toEqual([]);
    expect(filas[0]?.duracion_seg).toBe(1800);
  });

  it("rechaza cardio sin duracion ni distancia", () => {
    const cardio = filaValida({ tipo: "cardio", series: "", reps_min: "", reps_max: "" });
    const { errores } = validarFilas([cardio]);

    expect(errores.some((e) => e.mensaje.includes("cardio"))).toBe(true);
  });

  it("supone strength cuando falta el tipo, y rechaza uno inventado", () => {
    expect(validarFilas([filaValida({ tipo: "" })]).filas[0]?.tipo).toBe("strength");
    expect(validarFilas([filaValida({ tipo: "fuerza" })]).errores[0]?.mensaje).toContain("tipo");
  });

  it("rechaza una semana que no es un entero positivo", () => {
    expect(validarFilas([filaValida({ semana: 0 })]).errores[0]?.mensaje).toContain("semana");
    expect(validarFilas([filaValida({ semana: 1.5 })]).errores[0]?.mensaje).toContain("semana");
  });
});
