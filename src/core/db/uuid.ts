/**
 * UUID v7 (RFC 9562): 48 bits de milisegundos Unix + 74 bits aleatorios.
 *
 * Por que v7 y no el v4 de crypto.randomUUID(): los id se generan en cliente
 * (spec §2.3) y acaban siendo clave primaria en Postgres. Un v4 es aleatorio,
 * asi que los indices se fragmentan y, sobre todo, no hay forma de ordenar
 * registros por su id. Un v7 es monotono en el tiempo: ordenar por id equivale
 * a ordenar por instante de creacion, que es justo lo que necesitan la outbox
 * (orden FIFO, respeta las claves ajenas) y el historial.
 *
 * Se implementa a mano en lugar de traer la libreria `uuid` entera: son
 * treinta lineas de un formato cerrado y con tests propios.
 */

/**
 * Contador de secuencia dentro del mismo milisegundo.
 *
 * Sin esto, dos llamadas en el mismo milisegundo producen ids cuyo orden
 * relativo es aleatorio, y la outbox podria enviar un hijo antes que su
 * padre. Se reutilizan 12 bits del bloque aleatorio (`rand_a` en la RFC)
 * como contador, que es el metodo 1 de "monotonicidad" del RFC 9562 §6.2.
 */
let ultimoMs = -1;
let secuencia = 0;

const MAX_SECUENCIA = 0xfff; // 12 bits

function aleatorios(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function uuidv7(ahora: number = Date.now()): string {
  let ms = ahora;

  if (ms === ultimoMs) {
    secuencia += 1;
    if (secuencia > MAX_SECUENCIA) {
      // Mas de 4096 ids en un milisegundo: se pide prestado el siguiente.
      // Preferimos un id levemente adelantado a uno fuera de orden.
      ms = ultimoMs + 1;
      ultimoMs = ms;
      secuencia = 0;
    }
  } else {
    if (ms < ultimoMs) {
      // El reloj ha ido hacia atras (cambio de hora, ajuste NTP). Nunca
      // retrocedemos: romperia el orden de la cola.
      ms = ultimoMs;
      secuencia += 1;
    } else {
      ultimoMs = ms;
      secuencia = 0;
    }
  }

  const bytes = new Uint8Array(16);

  // 0-5: marca de tiempo de 48 bits, big-endian.
  bytes[0] = (ms / 2 ** 40) & 0xff;
  bytes[1] = (ms / 2 ** 32) & 0xff;
  bytes[2] = (ms / 2 ** 24) & 0xff;
  bytes[3] = (ms / 2 ** 16) & 0xff;
  bytes[4] = (ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  // 6-7: version 7 (4 bits) + los 12 bits de secuencia.
  bytes[6] = 0x70 | ((secuencia >> 8) & 0x0f);
  bytes[7] = secuencia & 0xff;

  // 8-15: variante RFC 4122 (2 bits) + 62 bits aleatorios.
  const resto = aleatorios(8);
  bytes[8] = 0x80 | (resto[0]! & 0x3f);
  for (let i = 1; i < 8; i++) bytes[8 + i] = resto[i]!;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Extrae el instante de creacion de un UUID v7. Util para depurar la cola. */
export function instanteDeUuidv7(uuid: string): number {
  return parseInt(uuid.replace(/-/g, "").slice(0, 12), 16);
}
