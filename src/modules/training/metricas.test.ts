import { describe, expect, it } from "vitest";
import {
  calcularDelta,
  e1rm,
  filtrarPorRango,
  metricasDe,
  serieDeMetrica,
  type RegistroSesion,
} from "./metricas";

function registro(parcial: Partial<RegistroSesion>): RegistroSesion {
  return {
    sessionId: "s",
    fecha: new Date().toISOString(),
    sets: [],
    molestia: false,
    sustituido: false,
    skipped: false,
    ...parcial,
  };
}

describe("e1rm", () => {
  it("aplica la formula de Epley", () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
    expect(e1rm(100, 0)).toBe(100);
  });
});

describe("metricasDe", () => {
  it("da las cinco de fuerza para strength", () => {
    expect(metricasDe("strength").map((m) => m.id)).toEqual([
      "e1rm",
      "peso_max",
      "tonelaje",
      "rir_medio",
      "reps_totales",
    ]);
  });

  it("da distancia y duracion para cardio", () => {
    expect(metricasDe("cardio").map((m) => m.id)).toEqual(["distancia", "duracion"]);
  });

  it("da solo duracion para time y solo distancia para distance", () => {
    expect(metricasDe("time").map((m) => m.id)).toEqual(["duracion"]);
    expect(metricasDe("distance").map((m) => m.id)).toEqual(["distancia"]);
  });
});

describe("serieDeMetrica", () => {
  it("coge la mejor serie de trabajo por sesion para e1RM y peso máximo", () => {
    const registros = [
      registro({
        sessionId: "a",
        sets: [
          { peso: 100, reps: 5, rir: 2, duracion: null, distancia: null, tags: [] },
          { peso: 80, reps: 12, rir: 1, duracion: null, distancia: null, tags: [] },
        ],
      }),
    ];
    const e1 = serieDeMetrica("e1rm", registros);
    expect(e1).toHaveLength(1);
    expect(e1[0]!.valor).toBeCloseTo(Math.max(e1rm(100, 5), e1rm(80, 12)), 5);

    const pesoMax = serieDeMetrica("peso_max", registros);
    expect(pesoMax[0]!.valor).toBe(100);
  });

  it("suma el tonelaje y las reps totales de la sesion", () => {
    const registros = [
      registro({
        sets: [
          { peso: 100, reps: 5, rir: null, duracion: null, distancia: null, tags: [] },
          { peso: 100, reps: 5, rir: null, duracion: null, distancia: null, tags: [] },
        ],
      }),
    ];
    expect(serieDeMetrica("tonelaje", registros)[0]!.valor).toBe(1000);
    expect(serieDeMetrica("reps_totales", registros)[0]!.valor).toBe(10);
  });

  it("promedia el RIR ignorando series sin RIR pautado", () => {
    const registros = [
      registro({
        sets: [
          { peso: 100, reps: 5, rir: 2, duracion: null, distancia: null, tags: [] },
          { peso: 100, reps: 5, rir: null, duracion: null, distancia: null, tags: [] },
          { peso: 100, reps: 5, rir: 4, duracion: null, distancia: null, tags: [] },
        ],
      }),
    ];
    expect(serieDeMetrica("rir_medio", registros)[0]!.valor).toBe(3);
  });

  it("no genera punto si ninguna serie tiene datos para esa metrica", () => {
    const registros = [
      registro({ sets: [{ peso: null, reps: null, rir: null, duracion: 60, distancia: null, tags: [] }] }),
    ];
    expect(serieDeMetrica("e1rm", registros)).toHaveLength(0);
    expect(serieDeMetrica("duracion", registros)[0]!.valor).toBe(1);
  });

  it("convierte distancia de metros a kilometros", () => {
    const registros = [
      registro({ sets: [{ peso: null, reps: null, rir: null, duracion: null, distancia: 5000, tags: [] }] }),
    ];
    expect(serieDeMetrica("distancia", registros)[0]!.valor).toBe(5);
  });
});

describe("filtrarPorRango", () => {
  const ahora = new Date("2026-09-18T00:00:00Z");
  const puntos = [
    { sessionId: "a", fecha: "2026-01-01T00:00:00Z", valor: 1, molestia: false, sustituido: false },
    { sessionId: "b", fecha: "2026-08-01T00:00:00Z", valor: 2, molestia: false, sustituido: false },
    { sessionId: "c", fecha: "2026-09-15T00:00:00Z", valor: 3, molestia: false, sustituido: false },
  ];

  it("todo devuelve todos los puntos sin filtrar", () => {
    expect(filtrarPorRango(puntos, "todo", ahora)).toHaveLength(3);
  });

  it("30d deja solo el punto reciente", () => {
    expect(filtrarPorRango(puntos, "30d", ahora)).toEqual([puntos[2]]);
  });

  it("90d incluye agosto y septiembre pero no enero", () => {
    expect(filtrarPorRango(puntos, "90d", ahora)).toEqual([puntos[1], puntos[2]]);
  });
});

describe("calcularDelta", () => {
  it("null con menos de dos puntos", () => {
    expect(calcularDelta([])).toBeNull();
    expect(calcularDelta([{ sessionId: "a", fecha: "x", valor: 1, molestia: false, sustituido: false }])).toBeNull();
  });

  it("resta el primero del ultimo y marca el signo", () => {
    const puntos = [
      { sessionId: "a", fecha: "x", valor: 80, molestia: false, sustituido: false },
      { sessionId: "b", fecha: "y", valor: 92.5, molestia: false, sustituido: false },
    ];
    expect(calcularDelta(puntos)).toEqual({ valor: 12.5, positivo: true });
  });

  it("marca negativo cuando baja", () => {
    const puntos = [
      { sessionId: "a", fecha: "x", valor: 100, molestia: false, sustituido: false },
      { sessionId: "b", fecha: "y", valor: 90, molestia: false, sustituido: false },
    ];
    expect(calcularDelta(puntos)!.positivo).toBe(false);
  });
});
