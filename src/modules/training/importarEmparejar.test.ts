import { describe, expect, it } from "vitest";
import { emparejar, similitud } from "./importarEmparejar";

/** Trozo del catalogo real de supabase/seed.sql. */
const CATALOGO = [
  { id: "1", name: "Press banca plano" },
  { id: "2", name: "Press banca inclinado" },
  { id: "3", name: "Sentadilla trasera" },
  { id: "4", name: "Sentadilla frontal" },
  { id: "5", name: "Prensa de piernas" },
  { id: "6", name: "Curl femoral tumbado" },
  { id: "7", name: "Elevación de gemelos" },
  { id: "8", name: "Elevación de piernas" },
  { id: "9", name: "Jalón al pecho" },
  { id: "10", name: "Curl con barra" },
  { id: "11", name: "Extensión de tríceps polea" },
  { id: "12", name: "Aperturas en polea" },
  { id: "13", name: "Peso muerto" },
  { id: "14", name: "Peso muerto rumano" },
  { id: "15", name: "Correr" },
];

function uno(nombre: string) {
  const [resultado] = emparejar([nombre], CATALOGO);
  if (!resultado) throw new Error("emparejar no devolvio nada");
  return resultado;
}

describe("similitud", () => {
  it("ignora tildes y mayusculas", () => {
    expect(similitud("Jalon al pecho", "Jalón al pecho")).toBe(1);
  });

  it("ignora las palabras de relleno", () => {
    expect(similitud("Curl barra", "Curl con barra")).toBe(1);
  });

  it("no confunde dos ejercicios que solo comparten una palabra", () => {
    expect(similitud("Press banca", "Press militar")).toBeLessThan(0.6);
  });
});

describe("emparejar", () => {
  it("resuelve solo lo que coincide del todo", () => {
    expect(uno("Correr").estado).toBe("exacto");
    expect(uno("Jalon al pecho").propuesta?.name).toBe("Jalón al pecho");
  });

  it("propone cuando hay un unico parecido claro", () => {
    const prensa = uno("Prensa");
    expect(prensa.estado).toBe("probable");
    expect(prensa.propuesta?.name).toBe("Prensa de piernas");

    expect(uno("Femoral tumbado").propuesta?.name).toBe("Curl femoral tumbado");
    expect(uno("Gemelos").propuesta?.name).toBe("Elevación de gemelos");
    expect(uno("Triceps polea").propuesta?.name).toBe("Extensión de tríceps polea");
  });

  it("no elige cuando hay empate: lo decide el usuario", () => {
    // "Sentadilla" puede ser trasera o frontal, y "Press banca" plano o
    // inclinado. Proponer una seria echarlo a suertes y meter las series
    // en el ejercicio equivocado.
    const sentadilla = uno("Sentadilla");
    expect(sentadilla.estado).toBe("sin_resolver");
    expect(sentadilla.propuesta).toBeNull();
    expect(sentadilla.candidatos.map((c) => c.ejercicio.name)).toContain("Sentadilla trasera");

    expect(uno("Press banca").estado).toBe("sin_resolver");
  });

  it("deja sin resolver lo que no se parece a nada", () => {
    const crunch = uno("Crunch en polea");
    expect(crunch.estado).toBe("sin_resolver");
    expect(crunch.propuesta).toBeNull();
  });

  it("devuelve los candidatos ordenados de mejor a peor", () => {
    const { candidatos } = uno("Peso muerto sumo");
    expect(candidatos[0]?.ejercicio.name).toBe("Peso muerto");
    expect(candidatos[0]!.puntuacion).toBeGreaterThan(candidatos[1]!.puntuacion);
  });

  it("empareja varios nombres de una vez, en orden", () => {
    const resultado = emparejar(["Correr", "Prensa"], CATALOGO);
    expect(resultado.map((r) => r.nombreExcel)).toEqual(["Correr", "Prensa"]);
  });
});
