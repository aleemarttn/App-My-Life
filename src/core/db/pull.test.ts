import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Doble del servidor para la bajada. Se prueba la politica, no Supabase:
 * que el cursor avance, que arranque desde el principio la primera vez y,
 * sobre todo, que una escritura local sin subir no la pise la version
 * remota (D18) — que es una garantia contra perdida de datos.
 */
const servidor = vi.hoisted(() => ({
  filas: {} as Record<string, Record<string, unknown>[]>,
  consultas: [] as { tabla: string; columna: string; desde: string }[],
}));

vi.mock("@/core/supabase/client", () => ({
  supabase: {
    from(tabla: string) {
      const consulta = {
        select: () => consulta,
        gt: (columna: string, desde: string) => {
          servidor.consultas.push({ tabla, columna, desde });
          return consulta;
        },
        order: () => consulta,
        limit: () => Promise.resolve({ data: servidor.filas[tabla] ?? [], error: null }),
      };
      return consulta;
    },
  },
}));

const { db } = await import("./schema");
const { bajar, reiniciarCursores } = await import("./pull");
const { crear, fijarUsuarioActual } = await import("./write");

const USUARIO = "33333333-3333-7333-8333-333333333333";

function ejercicio(id: string, name: string, updated_at: string) {
  return {
    id,
    user_id: null,
    name,
    kind: "strength",
    muscle_group: null,
    equipment: null,
    video_url: null,
    is_unilateral: false,
    notes: null,
    created_at: updated_at,
    updated_at,
    deleted_at: null,
  };
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  fijarUsuarioActual(USUARIO);
  servidor.filas = {};
  servidor.consultas = [];
});

describe("bajar", () => {
  it("guarda en Dexie lo que llega del servidor", async () => {
    servidor.filas["exercises"] = [
      ejercicio("aaa", "Sentadilla", "2026-09-01T10:00:00Z"),
      ejercicio("bbb", "Press banca", "2026-09-01T11:00:00Z"),
    ];

    const aplicadas = await bajar();

    expect(aplicadas).toBe(2);
    expect((await db.exercises.get("aaa"))?.name).toBe("Sentadilla");
    expect(await db.exercises.count()).toBe(2);
  });

  it("la primera vez pide desde el origen de los tiempos", async () => {
    await bajar();
    const deEjercicios = servidor.consultas.find((c) => c.tabla === "exercises");
    expect(deEjercicios?.desde).toBe("1970-01-01T00:00:00Z");
  });

  it("avanza el cursor y no vuelve a pedir lo mismo", async () => {
    servidor.filas["exercises"] = [ejercicio("aaa", "Sentadilla", "2026-09-01T10:00:00Z")];
    await bajar();

    servidor.consultas = [];
    await bajar();

    const segunda = servidor.consultas.find((c) => c.tabla === "exercises");
    expect(segunda?.desde).toBe("2026-09-01T10:00:00Z");
  });

  it("NO pisa una fila con cambios locales sin subir (D18)", async () => {
    // El usuario renombra un ejercicio sin cobertura...
    const id = await crear("exercises", { name: "Mi nombre local" });

    // ...y mientras tanto el servidor devuelve su version, mas vieja.
    servidor.filas["exercises"] = [ejercicio(id, "Nombre del servidor", "2026-09-01T10:00:00Z")];

    const aplicadas = await bajar();

    expect(aplicadas).toBe(0);
    expect((await db.exercises.get(id))?.name).toBe("Mi nombre local");
  });

  it("si ya no hay nada pendiente, la version del servidor si entra", async () => {
    const id = await crear("exercises", { name: "Local" });
    await db.outbox.clear(); // como si ya se hubiera subido

    servidor.filas["exercises"] = [ejercicio(id, "Del servidor", "2026-09-02T10:00:00Z")];
    await bajar();

    expect((await db.exercises.get(id))?.name).toBe("Del servidor");
  });

  it("usa sent_at en notifications_log, que no tiene updated_at", async () => {
    await bajar();
    const consulta = servidor.consultas.find((c) => c.tabla === "notifications_log");
    expect(consulta?.columna).toBe("sent_at");
  });

  it("reiniciarCursores fuerza una bajada completa", async () => {
    servidor.filas["exercises"] = [ejercicio("aaa", "Sentadilla", "2026-09-01T10:00:00Z")];
    await bajar();

    await reiniciarCursores();
    servidor.consultas = [];
    await bajar();

    const consulta = servidor.consultas.find((c) => c.tabla === "exercises");
    expect(consulta?.desde).toBe("1970-01-01T00:00:00Z");
  });
});
