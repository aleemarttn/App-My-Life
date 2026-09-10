import { describe, expect, it } from "vitest";
import { revisarConfig } from "./revisarConfig";

/**
 * Estos tests existen por un incidente real: en el primer despliegue se
 * pegaron los dos JWT cruzados y la clave `service_role` acabo publicada en
 * un archivo JavaScript accesible por cualquiera.
 */

/** Construye un JWT de mentira con el rol indicado. Solo el payload importa. */
function jwtFalso(role: string): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return [
    b64({ alg: "HS256", typ: "JWT" }),
    b64({ iss: "supabase", ref: "abc", role }),
    "firma",
  ].join(".");
}

const URL_OK = "https://wcmtrjjalwbchrmlsvow.supabase.co";

describe("revisarConfig", () => {
  it("da el visto bueno a una configuracion correcta", () => {
    expect(revisarConfig(URL_OK, jwtFalso("anon"))).toEqual([]);
  });

  it("RECHAZA la clave service_role en el cliente", () => {
    // El caso grave: esa clave se salta todas las politicas RLS.
    const problemas = revisarConfig(URL_OK, jwtFalso("service_role"));
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.variable).toBe("VITE_SUPABASE_ANON_KEY");
    expect(problemas[0]?.grave).toBe(true);
    expect(problemas[0]?.problema).toMatch(/service_role/);
  });

  it("detecta una clave donde deberia ir la URL", () => {
    const problemas = revisarConfig(jwtFalso("anon"), jwtFalso("anon"));
    expect(problemas[0]?.variable).toBe("VITE_SUPABASE_URL");
    expect(problemas[0]?.grave).toBe(true);
  });

  it("cazaria el cruce exacto del primer despliegue", () => {
    // URL <- clave anon, y clave <- service_role. Ambas cadenas rellenas,
    // asi que una comprobacion de "no vacio" las habria dado por buenas.
    const problemas = revisarConfig(jwtFalso("anon"), jwtFalso("service_role"));
    expect(problemas).toHaveLength(2);
    expect(problemas.every((p) => p.grave)).toBe(true);
  });

  it("avisa cuando falta cualquiera de las dos", () => {
    expect(revisarConfig(undefined, jwtFalso("anon"))).toHaveLength(1);
    expect(revisarConfig(URL_OK, undefined)).toHaveLength(1);
    expect(revisarConfig(undefined, undefined)).toHaveLength(2);
    expect(revisarConfig("", "")).toHaveLength(2);
  });

  it("rechaza una URL que no es https", () => {
    const problemas = revisarConfig("wcmtrjjalwbchrmlsvow.supabase.co", jwtFalso("anon"));
    expect(problemas[0]?.variable).toBe("VITE_SUPABASE_URL");
  });

  it("rechaza cualquier rol que no sea anon", () => {
    const problemas = revisarConfig(URL_OK, jwtFalso("authenticated"));
    expect(problemas[0]?.grave).toBe(true);
  });

  // ---- Formato nuevo de claves de Supabase. No son JWT, asi que la
  // comprobacion de rol no las ve: se distinguen por el prefijo.
  it("acepta la clave publishable, que es la sucesora de anon", () => {
    expect(revisarConfig(URL_OK, "sb_publishable_jp1kKH_CtxWjRx5V5qvjkw")).toEqual([]);
  });

  it("RECHAZA la clave secreta del formato nuevo", () => {
    const problemas = revisarConfig(URL_OK, "sb_secret_AbCdEf123456");
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.grave).toBe(true);
    expect(problemas[0]?.problema).toMatch(/sb_secret_/);
  });
});
