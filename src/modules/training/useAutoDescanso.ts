import { useCallback, useState } from "react";

const CLAVE = "mylife.entreno.autoDescanso";

function leer(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== "no";
  } catch {
    // Safari en modo privado puede tirar al leer. El valor por defecto
    // (cronometro automatico) es el comportamiento que habia hasta ahora.
    return true;
  }
}

/**
 * Si al registrar una serie se abre solo el cronometro de descanso.
 *
 * spec §4.7 lo pide "activable/desactivable en ajustes" (asuncion 3), pero
 * la pantalla de Ajustes todavia no existe (`ProfileScreen`, fase 1). Vive
 * de momento en el propio modo entreno y en `localStorage`: es una
 * preferencia de interfaz de este dispositivo, no un dato del usuario, asi
 * que no entra en Dexie ni se sincroniza (D31).
 */
export function useAutoDescanso(): [boolean, (valor: boolean) => void] {
  const [activo, setActivo] = useState(leer);

  const cambiar = useCallback((valor: boolean) => {
    setActivo(valor);
    try {
      localStorage.setItem(CLAVE, valor ? "si" : "no");
    } catch {
      // Sin almacenamiento: la preferencia dura lo que dure la sesion.
    }
  }, []);

  return [activo, cambiar];
}
