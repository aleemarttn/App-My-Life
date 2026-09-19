import { describe, expect, it } from "vitest";
import { objetivoSesion, reloj, textoReps } from "./formato";
import type { ObjetivoPautado } from "./formato";

const VACIO: ObjetivoPautado = {
  target_sets: null,
  target_reps_min: null,
  target_reps_max: null,
  target_weight: null,
  target_rir: null,
  target_duration_seconds: null,
  target_distance_m: null,
};

describe("textoReps", () => {
  it("colapsa el rango cuando el minimo y el maximo coinciden", () => {
    expect(textoReps({ ...VACIO, target_reps_min: 8, target_reps_max: 8 })).toBe("8");
  });

  it("mantiene el rango del Excel cuando son distintos", () => {
    expect(textoReps({ ...VACIO, target_reps_min: 6, target_reps_max: 8 })).toBe("6-8");
  });

  it("aguanta que el Excel solo traiga uno de los dos", () => {
    expect(textoReps({ ...VACIO, target_reps_max: 12 })).toBe("12");
    expect(textoReps({ ...VACIO, target_reps_min: 12 })).toBe("12");
  });

  it("devuelve null si el Excel no pauto reps (cardio, plancha)", () => {
    expect(textoReps(VACIO)).toBeNull();
  });
});

describe("objetivoSesion", () => {
  it("arma la linea del mockup: series, rango y RPE", () => {
    const objetivo: ObjetivoPautado = {
      ...VACIO,
      target_sets: 4,
      target_reps_min: 6,
      target_reps_max: 8,
      target_rir: 2,
    };
    expect(objetivoSesion(objetivo)).toBe("4 × 6-8 @ RPE 8");
  });

  it("ensena el RPE como la cara visible del RIR pautado (D30)", () => {
    expect(objetivoSesion({ ...VACIO, target_sets: 3, target_reps_max: 10, target_rir: 0 })).toBe(
      "3 × 10 @ RPE 10",
    );
    expect(objetivoSesion({ ...VACIO, target_sets: 3, target_reps_max: 10, target_rir: 5 })).toBe(
      "3 × 10 @ RPE 5",
    );
  });

  it("no inventa RPE cuando el Excel no trae la columna rir", () => {
    expect(objetivoSesion({ ...VACIO, target_sets: 3, target_reps_max: 10 })).toBe("3 × 10");
  });

  it("incluye el peso pautado cuando lo hay", () => {
    expect(
      objetivoSesion({ ...VACIO, target_sets: 4, target_reps_max: 8, target_weight: 82.5 }),
    ).toBe("4 × 8 · 82.5 kg");
  });

  it("usa duracion y distancia en el cardio, no series y reps", () => {
    expect(objetivoSesion({ ...VACIO, target_duration_seconds: 1800, target_distance_m: 5000 })).toBe(
      "30 min · 5 km",
    );
  });

  it("lo dice cuando el ejercicio vino sin ninguna pauta", () => {
    expect(objetivoSesion(VACIO)).toBe("Sin objetivo pautado");
  });
});

describe("reloj", () => {
  it("rellena con ceros a la izquierda", () => {
    expect(reloj(0)).toBe("00:00");
    expect(reloj(9)).toBe("00:09");
    expect(reloj(150)).toBe("02:30");
  });

  it("sigue contando por encima de la hora sin desbordar los minutos", () => {
    expect(reloj(3725)).toBe("62:05");
  });

  it("nunca ensena tiempo negativo (reloj del movil movido a mano)", () => {
    expect(reloj(-30)).toBe("00:00");
  });
});
