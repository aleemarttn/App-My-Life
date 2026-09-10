import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./schema";
import { actualizar, borrar, borrarLogico, crear, fijarUsuarioActual } from "./write";

const USUARIO = "11111111-1111-7111-8111-111111111111";

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  fijarUsuarioActual(USUARIO);
});

describe("crear", () => {
  it("guarda la fila y la encola en la misma operacion", async () => {
    const id = await crear("exercises", { name: "Sentadilla", kind: "strength" });

    const fila = await db.exercises.get(id);
    expect(fila?.name).toBe("Sentadilla");

    const cola = await db.outbox.toArray();
    expect(cola).toHaveLength(1);
    expect(cola[0]).toMatchObject({
      id,
      tabla: "exercises",
      op: "upsert",
      intentos: 0,
      estado: "pending",
    });
  });

  it("estampa user_id sin que la pantalla tenga que acordarse", async () => {
    const id = await crear("exercises", { name: "Press banca" });
    expect((await db.exercises.get(id))?.user_id).toBe(USUARIO);
  });

  it("no estampa user_id en profiles, que no tiene esa columna", async () => {
    const id = await crear("profiles", { display_name: "Alejandro" });
    const fila = await db.profiles.get(id);
    expect(fila).toBeDefined();
    expect(fila).not.toHaveProperty("user_id");
  });

  it("falla si no hay sesion, en vez de subir una fila que RLS rechazara", async () => {
    fijarUsuarioActual(null);
    await expect(crear("exercises", { name: "Dominadas" })).rejects.toThrow(/sesion/i);
    // Y no deja rastro a medias.
    expect(await db.exercises.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
  });

  it("el contador de pendientes refleja la escritura al instante", async () => {
    // La cola se lee en vivo desde Dexie, no de una copia guardada en el
    // motor de sincronizacion. Cuando venia de esa copia, crear un registro
    // en modo avion lo encolaba bien pero el contador seguia a cero hasta el
    // siguiente ciclo, y parecia que el dato se habia perdido.
    const { contarPendientes } = await import("./push");
    expect(await contarPendientes()).toBe(0);

    await crear("exercises", { name: "Sin cobertura" });

    expect(await contarPendientes()).toBe(1);
  });

  it("genera id ordenable: la cola respeta el orden de creacion", async () => {
    const primero = await crear("exercises", { name: "A" });
    const segundo = await crear("exercises", { name: "B" });
    expect(segundo > primero).toBe(true);

    const cola = await db.outbox.orderBy("seq").toArray();
    expect(cola.map((e) => e.id)).toEqual([primero, segundo]);
  });
});

describe("actualizar", () => {
  it("fusiona los cambios y sube la fila entera, no el parche", async () => {
    const id = await crear("exercises", { name: "Remo", muscle_group: "espalda" });
    await db.outbox.clear();

    await actualizar("exercises", id, { name: "Remo con barra" });

    const fila = await db.exercises.get(id);
    expect(fila?.name).toBe("Remo con barra");
    expect(fila?.muscle_group).toBe("espalda");

    // El servidor resuelve conflictos por updated_at, asi que necesita el
    // estado final completo.
    const [entrada] = await db.outbox.toArray();
    expect(entrada?.payload["muscle_group"]).toBe("espalda");
  });

  it("mueve updated_at hacia delante", async () => {
    const id = await crear("exercises", { name: "Curl" });
    const antes = (await db.exercises.get(id))?.updated_at ?? "";

    await new Promise((r) => setTimeout(r, 5));
    await actualizar("exercises", id, { name: "Curl martillo" });

    const despues = (await db.exercises.get(id))?.updated_at ?? "";
    expect(despues > antes).toBe(true);
  });

  it("se niega a modificar algo que no existe", async () => {
    await expect(actualizar("exercises", "no-existe", { name: "X" })).rejects.toThrow(/no existe/i);
  });
});

describe("borrado", () => {
  it("el logico conserva la fila y marca deleted_at", async () => {
    const id = await crear("exercises", { name: "Zancadas" });
    await borrarLogico("exercises", id);

    const fila = await db.exercises.get(id);
    expect(fila).toBeDefined();
    expect(fila?.deleted_at).toBeTruthy();
  });

  it("el real la quita y encola la orden de borrado", async () => {
    const id = await crear("exercises", { name: "Temporal" });
    await db.outbox.clear();

    await borrar("exercises", id);

    expect(await db.exercises.get(id)).toBeUndefined();
    const [entrada] = await db.outbox.toArray();
    expect(entrada?.op).toBe("delete");
    expect(entrada?.id).toBe(id);
  });
});
