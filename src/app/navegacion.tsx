import {
  IconoCoche,
  IconoComida,
  IconoDinero,
  IconoEntreno,
  IconoInicio,
} from "@/core/ui/icons";
import type { DestinoTab } from "@/core/ui/TabBar";

/**
 * Los cinco destinos de la barra inferior, ORDENADOS POR FRECUENCIA DE USO
 * real (spec §2.7, D7). No por importancia ni por orden de construccion: la
 * barra la recorre el pulgar todos los dias.
 *
 * Perfil no esta aqui. Vive en el avatar de la cabecera porque es consulta y
 * configuracion semanal, no una accion diaria (D11).
 */
export const DESTINOS: DestinoTab[] = [
  { to: "/", label: "Inicio", icono: <IconoInicio /> },
  { to: "/entreno", label: "Entreno", icono: <IconoEntreno /> },
  { to: "/comida", label: "Comida", icono: <IconoComida /> },
  { to: "/dinero", label: "Dinero", icono: <IconoDinero /> },
  { to: "/coche", label: "Coche", icono: <IconoCoche /> },
];

/** Titulo de la cabecera por ruta. La portada muestra el nombre de la app. */
const TITULOS: Record<string, string> = {
  "/": "My Life",
  "/entreno": "Entreno",
  "/comida": "Comida",
  "/dinero": "Dinero",
  "/coche": "Coche",
  "/perfil": "Perfil",
  "/perfil/diseno": "Sistema de diseño",
};

export function tituloDe(ruta: string): string {
  return TITULOS[ruta] ?? "My Life";
}
