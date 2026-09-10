import { bajar } from "./pull";
import { empujar } from "./push";

/**
 * Motor de sincronizacion: decide CUANDO se sincroniza. El QUE vive en
 * push.ts y pull.ts.
 *
 * Nada de esto bloquea nunca la interfaz. La app lee de Dexie y pinta;
 * esto ocurre por detras (design.md §8: no bloquear la interfaz por falta
 * de red).
 *
 * OJO con lo que este estado NO incluye: los contadores de pendientes y
 * fallidos. Estuvieron aqui y era un error, porque solo se refrescaban al
 * terminar un ciclo: crear un registro sin cobertura encolaba bien pero el
 * contador seguia a cero hasta el siguiente sondeo, y parecia que el dato
 * se habia perdido. Esos numeros viven en la tabla `outbox` de Dexie y se
 * leen de ahi con useLiveQuery, que es la unica fuente y siempre esta al
 * dia. Aqui solo queda lo que Dexie no puede saber: si hay un ciclo en
 * marcha y si el ultimo fallo.
 */

/** Sondeo de fondo. Corto no aporta: los disparadores reales son eventos. */
const INTERVALO_MS = 60_000;

export interface EstadoSync {
  sincronizando: boolean;
  ultimoIntento: string | null;
  ultimoError: string | null;
}

type Oyente = (estado: EstadoSync) => void;

let estado: EstadoSync = {
  sincronizando: false,
  ultimoIntento: null,
  ultimoError: null,
};

const oyentes = new Set<Oyente>();
let temporizador: ReturnType<typeof setInterval> | null = null;
let activo = false;

function emitir(cambios: Partial<EstadoSync>): void {
  estado = { ...estado, ...cambios };
  for (const oyente of oyentes) oyente(estado);
}

export function estadoSync(): EstadoSync {
  return estado;
}

/**
 * Suscribe y devuelve la funcion para darse de baja.
 *
 * No invoca al oyente de entrada a proposito: asi encaja tal cual con
 * useSyncExternalStore, que ya lee el estado inicial por su cuenta con
 * estadoSync(). Llamarlo aqui provocaria una notificacion redundante en
 * cada montaje.
 */
export function escucharSync(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/**
 * Un ciclo completo: primero subir, despues bajar.
 *
 * El orden no es casual. Subir primero deja el servidor al dia antes de
 * pedirle nada, asi que la bajada no devuelve una version vieja de algo
 * que acabamos de cambiar aqui.
 */
export async function sincronizarAhora(): Promise<void> {
  if (estado.sincronizando) return;
  // Sin red no se intenta siquiera. Los contadores no hay que tocarlos:
  // los pinta Dexie por su cuenta.
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  emitir({ sincronizando: true, ultimoIntento: new Date().toISOString() });

  try {
    await empujar();
    await bajar();
    emitir({ ultimoError: null });
  } catch (fallo) {
    // Sin cobertura esto es lo normal, no una excepcion. Se anota y ya:
    // el siguiente ciclo lo reintenta.
    emitir({ ultimoError: fallo instanceof Error ? fallo.message : String(fallo) });
  } finally {
    emitir({ sincronizando: false });
  }
}

function alRecuperarRed(): void {
  void sincronizarAhora();
}

function alVolverAlFrente(): void {
  if (document.visibilityState === "visible") void sincronizarAhora();
}

/**
 * Arranca el motor. Se llama al abrir sesion.
 *
 * Los disparadores son tres: recuperar la red, volver al primer plano y un
 * sondeo lento de respaldo. Los dos primeros cubren el caso real —salir del
 * sotano del gimnasio y sacar el movil del bolsillo—; el tercero existe
 * porque en iOS el evento `online` no siempre llega.
 */
export function iniciarSync(): void {
  if (activo) return;
  activo = true;

  window.addEventListener("online", alRecuperarRed);
  document.addEventListener("visibilitychange", alVolverAlFrente);
  temporizador = setInterval(() => void sincronizarAhora(), INTERVALO_MS);

  void sincronizarAhora();
}

/** Para el motor. Se llama al cerrar sesion. */
export function detenerSync(): void {
  if (!activo) return;
  activo = false;

  window.removeEventListener("online", alRecuperarRed);
  document.removeEventListener("visibilitychange", alVolverAlFrente);
  if (temporizador !== null) {
    clearInterval(temporizador);
    temporizador = null;
  }
}
