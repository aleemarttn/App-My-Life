import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El servidor se sustituye por un doble controlable. Lo que se prueba aqui
 * no es Supabase, sino la politica de la cola: cuando se borra una entrada,
 * cuando se reintenta y cuando se aparca. Es la logica de la que depende
 * que no se pierda un entrenamiento registrado sin cobertura.
 */
const servidor = vi.hoisted(() => ({
  error: null as { code?: string; message: string } | null,
  recibidos: [] as string[],
}));

vi.mock("@/core/supabase/client", () => ({
  supabase: {
    from(tabla: string) {
      return {
        upsert: (_payload: unknown) => {
          servidor.recibidos.push(`upsert:${tabla}`);
          return Promise.resolve({ error: servidor.error });
        },
        delete: () => ({
          eq: (_col: string, _val: string) => {
            servidor.recibidos.push(`delete:${tabla}`);
            return Promise.resolve({ error: servidor.error });
          },
        }),
      };
    },
  },
}));

const { db } = await import("./schema");
const { contarFalladas, contarPendientes, empujar, reintentarFalladas } = await import("./push");
const { crear, fijarUsuarioActual } = await import("./write");

const USUARIO = "22222222-2222-7222-8222-222222222222";

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  fijarUsuarioActual(USUARIO);
  servidor.error = null;
  servidor.recibidos = [];
});

describe("empujar", () => {
  it("borra la entrada solo cuando el servidor confirma", async () => {
    await crear("exercises", { name: "Peso muerto" });

    const resultado = await empujar();

    expect(servidor.recibidos).toEqual(["upsert:exercises"]);
    expect(resultado.subidas).toBe(1);
    expect(await db.outbox.count()).toBe(0);
  });

  it("ante un fallo transitorio conserva la entrada y espera mas la proxima vez", async () => {
    await crear("exercises", { name: "Hip thrust" });
    servidor.error = { message: "Failed to fetch" }; // sin codigo: red caida

    await empujar();

    const entrada = (await db.outbox.toArray())[0];
    if (!entrada) throw new Error("la entrada deberia seguir en la cola");
    expect(entrada.estado).toBe("pending");
    expect(entrada.intentos).toBe(1);
    expect(entrada.proximo_intento_en > new Date().toISOString()).toBe(true);
  });

  it("detiene la cola en el primer fallo transitorio, para no adelantar a nadie", async () => {
    // Si la segunda entrada se subiera antes que la primera, un hijo podria
    // llegar al servidor antes que su padre y la clave ajena lo rechazaria.
    await crear("exercises", { name: "Primero" });
    await crear("exercises", { name: "Segundo" });
    servidor.error = { message: "Network request failed" };

    await empujar();

    const cola = await db.outbox.orderBy("seq").toArray();
    expect(cola).toHaveLength(2);
    expect(cola[0]?.intentos).toBe(1);
    expect(cola[1]?.intentos).toBe(0); // ni se intento
    expect(servidor.recibidos).toHaveLength(1);
  });

  it("aparca los fallos permanentes sin borrarlos y sigue con el resto", async () => {
    await crear("exercises", { name: "Con conflicto" });
    servidor.error = { code: "23505", message: "duplicate key value" };

    const resultado = await empujar();

    expect(resultado.falladas).toBe(1);
    const [entrada] = await db.outbox.toArray();
    // No se borra JAMAS: el dato del usuario no se tira aunque el servidor
    // lo rechace. Queda visible para poder arreglarlo.
    expect(entrada?.estado).toBe("failed");
    expect(entrada?.ultimo_error).toContain("duplicate key");
  });

  it("trata una violacion de RLS como permanente, no como algo que reintentar", async () => {
    await crear("exercises", { name: "Ajena" });
    servidor.error = { code: "42501", message: "new row violates row-level security policy" };

    await empujar();

    expect((await db.outbox.toArray())[0]?.estado).toBe("failed");
    expect(await contarPendientes()).toBe(0);
    expect(await contarFalladas()).toBe(1);
  });

  it("respeta la espera: no reintenta antes de tiempo", async () => {
    await crear("exercises", { name: "En espera" });
    servidor.error = { message: "timeout" };
    await empujar();
    servidor.recibidos = [];

    await empujar(); // inmediatamente despues

    expect(servidor.recibidos).toHaveLength(0);
  });

  it("propaga el borrado real al servidor", async () => {
    const { borrar } = await import("./write");
    const id = await crear("exercises", { name: "Efimero" });
    await empujar();
    servidor.recibidos = [];

    await borrar("exercises", id);
    await empujar();

    expect(servidor.recibidos).toEqual(["delete:exercises"]);
    expect(await db.outbox.count()).toBe(0);
  });
});

describe("reintentarFalladas", () => {
  it("devuelve las aparcadas a la cola con el contador a cero", async () => {
    await crear("exercises", { name: "Rechazada" });
    servidor.error = { code: "23505", message: "duplicate" };
    await empujar();

    servidor.error = null;
    expect(await reintentarFalladas()).toBe(1);
    expect(await contarPendientes()).toBe(1);

    await empujar();
    expect(await db.outbox.count()).toBe(0);
  });
});
