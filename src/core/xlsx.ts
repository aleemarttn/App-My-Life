export interface HojaLeida {
  nombre: string;
  filas: Record<string, unknown>[];
}

export interface HojaEscribible {
  /** Maximo 31 caracteres: limite del formato .xlsx, se recorta si hace falta. */
  nombre: string;
  filas: Record<string, unknown>[];
}

/**
 * Envoltorio unico de SheetJS. Ningun modulo importa `xlsx` directamente.
 *
 * El `import()` dinamico no es un adorno: el bundle de Excel ronda los
 * 400 kB y `CLAUDE.md` exige que no penalice el arranque del modo entreno.
 * Asi solo se descarga cuando alguien abre el importador.
 *
 * El archivo NO sale del dispositivo: se parsea entero en el navegador.
 */
export async function leerPrimeraHoja(archivo: File): Promise<HojaLeida> {
  const XLSX = await import("xlsx");
  const libro = XLSX.read(await archivo.arrayBuffer());

  const nombre = libro.SheetNames[0];
  if (!nombre) throw new Error("El archivo no tiene ninguna hoja.");

  const hoja = libro.Sheets[nombre];
  if (!hoja) throw new Error(`No se pudo leer la hoja "${nombre}".`);

  // defval mantiene la clave presente cuando la celda esta vacia: sin el,
  // una fila con huecos pierde columnas y la validacion no sabria si falta
  // el dato o falta la columna entera.
  return { nombre, filas: XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" }) };
}

/**
 * Contraparte de `leerPrimeraHoja`: un libro con una hoja por elemento de
 * `hojas`, en el orden dado. Mismo motivo para el `import()` dinamico: no
 * meter los ~400 kB de SheetJS en el arranque de la app.
 */
export async function escribirLibro(hojas: HojaEscribible[]): Promise<Blob> {
  const XLSX = await import("xlsx");
  const libro = XLSX.utils.book_new();

  for (const hoja of hojas) {
    const worksheet = XLSX.utils.json_to_sheet(hoja.filas);
    XLSX.utils.book_append_sheet(libro, worksheet, hoja.nombre.slice(0, 31));
  }

  const datos = XLSX.write(libro, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([datos], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
