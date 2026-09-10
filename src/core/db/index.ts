/**
 * Superficie publica de core/db. Los modulos importan de aqui y nunca de
 * los archivos internos, para que reorganizarlos por dentro no rompa nada.
 */

export {
  db,
  MyLifeDB,
  TABLAS_BAJABLES,
  TABLAS_CON_BORRADO_LOGICO,
  TABLAS_SUBIBLES,
} from "./schema";
export type {
  EntradaMeta,
  EntradaOutbox,
  EstadoOutbox,
  TablaBajable,
  TablaConBorradoLogico,
  TablaSubible,
} from "./schema";

export { exportarTodo, nombreDeExportacion, vaciarBaseLocal } from "./exportar";
export type { Exportacion } from "./exportar";

export { actualizar, borrar, borrarLogico, crear, fijarUsuarioActual, usuarioActualId } from "./write";
export type { DatosNuevos } from "./write";

export { contarFalladas, contarPendientes, empujar, reintentarFalladas } from "./push";
export { bajar, reiniciarCursores } from "./pull";

export { detenerSync, escucharSync, estadoSync, iniciarSync, sincronizarAhora } from "./sync";
export type { EstadoSync } from "./sync";

export { instanteDeUuidv7, uuidv7 } from "./uuid";
