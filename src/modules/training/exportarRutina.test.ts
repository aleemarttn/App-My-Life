import { describe, expect, it } from "vitest";
import {
  agruparPorSemana,
  calcularResumen,
  construirFilasSemana,
  construirHojas,
  nombreDeExportacionRutina,
  type SesionParaExportar,
} from "./exportarRutina";
import type { ObjetivoPlan } from "./useSesionEntreno";

function planned(extra: Partial<ObjetivoPlan> = {}): ObjetivoPlan {
  return {
    target_sets: 3,
    target_reps_min: 8,
    target_reps_max: 10,
    target_weight: 80,
    target_rir: 2,
    target_duration_seconds: null,
    target_distance_m: null,
    rest_seconds: 120,
    ...extra,
  };
}

function sesion(extra: Partial<SesionParaExportar> = {}): SesionParaExportar {
  return {
    fecha: "2026-09-15T18:00:00.000Z",
    dia: "Lunes - Pierna",
    weekNumber: 1,
    ejercicios: [
      {
        ejercicioNombre: "Sentadilla",
        sustituidoDeNombre: null,
        motivoSustitucion: null,
        planned: planned(),
        sets: [
          { setIndex: 1, peso: 80, reps: 10, rir: 2, rpe: null, tags: [], nota: null },
          { setIndex: 2, peso: 82.5, reps: 8, rir: 1, rpe: 9.5, tags: ["al_fallo"], nota: "duro" },
        ],
      },
    ],
    ...extra,
  };
}

describe("construirFilasSemana", () => {
  it("una fila por serie registrada, con lo pautado y lo real juntos", () => {
    const filas = construirFilasSemana([sesion()]);

    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      fecha: "2026-09-15",
      dia: "Lunes - Pierna",
      ejercicio: "Sentadilla",
      serie: 1,
      peso_pautado: 80,
      peso_real: 80,
      reps_pautadas: "8-10",
      reps_reales: 10,
      rir: 2,
      etiquetas: "",
    });
    expect(filas[1]?.etiquetas).toBe("al_fallo");
    expect(filas[1]?.nota).toBe("duro");
  });

  it("exporta el RPE en su propia columna, al lado del RIR (D34)", () => {
    const filas = construirFilasSemana([sesion()]);
    // La serie 1 se registro sin marcar RPE: la celda va vacia, no a cero.
    expect(filas[0]?.rir).toBe(2);
    expect(filas[0]?.rpe).toBe("");
    // La serie 2 llevaba los dos, y no son el uno el reflejo del otro:
    // RIR 1 equivaldria a RPE 9, pero Alejandro marco 9,5.
    expect(filas[1]?.rir).toBe(1);
    expect(filas[1]?.rpe).toBe(9.5);
  });

  it("un solo valor de reps pautadas cuando min y max coinciden", () => {
    const filas = construirFilasSemana([
      sesion({ ejercicios: [{ ...sesion().ejercicios[0]!, planned: planned({ target_reps_min: 10, target_reps_max: 10 }) }] }),
    ]);
    expect(filas[0]?.reps_pautadas).toBe(10);
  });

  it("registra la sustitucion y su motivo", () => {
    const filas = construirFilasSemana([
      sesion({
        ejercicios: [
          {
            ...sesion().ejercicios[0]!,
            sustituidoDeNombre: "Prensa",
            motivoSustitucion: "máquina ocupada",
          },
        ],
      }),
    ]);
    expect(filas[0]?.sustituido_de).toBe("Prensa");
    expect(filas[0]?.motivo_sustitucion).toBe("máquina ocupada");
  });
});

describe("agruparPorSemana", () => {
  it("agrupa por semana y las ordena", () => {
    const grupos = agruparPorSemana([sesion({ weekNumber: 2 }), sesion({ weekNumber: 1 })]);
    expect([...grupos.keys()]).toEqual([1, 2]);
  });
});

describe("calcularResumen", () => {
  it("suma tonelaje, promedia RIR y cuenta series", () => {
    const [fila] = calcularResumen([sesion()]);

    expect(fila?.ejercicio).toBe("Sentadilla");
    expect(fila?.series_totales).toBe(2);
    // 80*10 + 82.5*8 = 800 + 660 = 1460
    expect(fila?.tonelaje_kg).toBe(1460);
    expect(fila?.rir_medio).toBe(1.5);
  });

  it("el cumplimiento compara series hechas con series pautadas", () => {
    // Pautadas 3, hechas 2 -> 67%.
    const [fila] = calcularResumen([sesion()]);
    expect(fila?.cumplimiento_pct).toBe(67);
  });

  it("un ejercicio sin target_sets (cardio) cuenta como una sola serie pautada", () => {
    const s = sesion({
      ejercicios: [
        {
          ejercicioNombre: "Correr",
          sustituidoDeNombre: null,
          motivoSustitucion: null,
          planned: planned({ target_sets: null, target_reps_min: null, target_reps_max: null, target_duration_seconds: 1800 }),
          sets: [{ setIndex: 1, peso: null, reps: null, rir: null, rpe: null, tags: [], nota: null }],
        },
      ],
    });
    expect(calcularResumen([s])[0]?.cumplimiento_pct).toBe(100);
  });

  it("cuenta las sustituciones y acumula etiquetas sin repetir", () => {
    const s = sesion({
      ejercicios: [
        { ...sesion().ejercicios[0]!, sustituidoDeNombre: "Prensa" },
      ],
    });
    const s2 = sesion({ weekNumber: 2 });
    const [fila] = calcularResumen([s, s2]);

    expect(fila?.sustituciones).toBe(1);
    expect(fila?.etiquetas_acumuladas).toBe("al_fallo");
  });
});

describe("construirHojas", () => {
  it("una hoja por semana mas el resumen, al final", () => {
    const hojas = construirHojas([sesion({ weekNumber: 1 }), sesion({ weekNumber: 2 })]);
    expect(hojas.map((h) => h.nombre)).toEqual(["Semana 1", "Semana 2", "Resumen"]);
  });
});

describe("nombreDeExportacionRutina", () => {
  it("convierte el nombre de la rutina en un nombre de archivo valido", () => {
    const nombre = nombreDeExportacionRutina("Mesociclo 3 - Octubre", new Date("2026-09-18T10:00:00.000Z"));
    expect(nombre).toBe("Mesociclo_3_Octubre_2026-09-18.xlsx");
  });

  it("cae a 'rutina' si el nombre no deja ningun caracter valido", () => {
    expect(nombreDeExportacionRutina("***", new Date("2026-09-18T10:00:00.000Z"))).toBe("rutina_2026-09-18.xlsx");
  });
});
