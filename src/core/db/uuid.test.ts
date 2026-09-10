import { describe, expect, it, vi } from "vitest";

const FORMATO = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * El generador guarda estado entre llamadas a proposito: el ultimo
 * milisegundo visto y un contador de secuencia, que es lo que garantiza la
 * monotonicidad. Ese estado es global al modulo, asi que cada test carga
 * una copia limpia; si no, un test que simula un reloj en 2027 envenena a
 * los siguientes.
 */
async function generadorLimpio() {
  vi.resetModules();
  return import("./uuid");
}

describe("uuidv7", () => {
  it("cumple el formato, la version 7 y la variante RFC", async () => {
    const { uuidv7 } = await generadorLimpio();
    for (let i = 0; i < 200; i++) {
      expect(uuidv7()).toMatch(FORMATO);
    }
  });

  it("no repite", async () => {
    const { uuidv7 } = await generadorLimpio();
    const vistos = new Set<string>();
    for (let i = 0; i < 10_000; i++) vistos.add(uuidv7());
    expect(vistos.size).toBe(10_000);
  });

  it("ordena alfabeticamente igual que cronologicamente", async () => {
    // Es LA propiedad de la que depende el orden FIFO de la outbox y el de
    // las claves ajenas. Si esto se rompe, se suben hijos antes que padres
    // y el servidor los rechaza.
    const { uuidv7 } = await generadorLimpio();
    const ids = Array.from({ length: 5_000 }, () => uuidv7());
    expect([...ids].sort()).toEqual(ids);
  });

  it("sigue ordenando dentro del mismo milisegundo", async () => {
    // Registrar varias series seguidas cae en el mismo milisegundo: sin el
    // contador de secuencia el orden relativo seria aleatorio.
    const { uuidv7 } = await generadorLimpio();
    const congelado = 1_789_000_000_000;
    const ids = Array.from({ length: 1_000 }, () => uuidv7(congelado));
    expect([...ids].sort()).toEqual(ids);
  });

  it("mantiene el orden aunque el reloj retroceda", async () => {
    // Cambio de hora o ajuste NTP: nunca debe generarse un id anterior.
    const { uuidv7 } = await generadorLimpio();
    const antes = uuidv7(1_800_000_000_000);
    const conRelojAtrasado = uuidv7(1_700_000_000_000);
    expect(conRelojAtrasado > antes).toBe(true);
  });

  it("conserva el instante de creacion", async () => {
    const { uuidv7, instanteDeUuidv7 } = await generadorLimpio();
    const momento = 1_789_000_000_000;
    expect(instanteDeUuidv7(uuidv7(momento))).toBe(momento);
  });
});
