import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente unico de Supabase.
 *
 * Ojo con el limite de responsabilidad (regla innegociable de CLAUDE.md):
 * este cliente es para AUTENTICACION y para el motor de sincronizacion de
 * core/db. La interfaz NUNCA lo usa para leer ni escribir datos: lee de
 * Dexie y escribe en Dexie + outbox. Si aparece un `supabase.from(...)`
 * dentro de un modulo, es un error de arquitectura.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallar aqui, al arrancar, y no con un 401 confuso a mitad de un entreno.
if (!url || !anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example a .env y rellenalos.",
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // La sesion sobrevive al cierre de la app: entrar al gimnasio y tener
    // que escribir la contrasena seria fricción inaceptable.
    persistSession: true,
    autoRefreshToken: true,
    // No hay enlaces magicos ni OAuth, solo email + contrasena, asi que no
    // hay ningun token que recoger de la URL.
    detectSessionInUrl: false,
  },
});
