import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigError } from "@/app/ConfigError";
import "@/styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No existe #root en index.html");

const raiz = createRoot(root);

/**
 * Comprobacion de configuracion ANTES de cargar la aplicacion.
 *
 * Vite incrusta las variables VITE_* en el bundle al compilar. Si al
 * desplegar no estaban definidas, quedan como cadenas vacias y el cliente de
 * Supabase lanza al importarse, es decir, ANTES de que React monte nada: el
 * resultado es una pantalla en blanco y un error escondido en la consola.
 *
 * Por eso `App` se importa de forma dinamica y solo si la configuracion esta
 * completa. Asi la cadena de imports que llega hasta core/supabase no se
 * ejecuta, y en su lugar se pinta algo que explica que falta.
 */
const faltan = [
  import.meta.env.VITE_SUPABASE_URL ? null : "VITE_SUPABASE_URL",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? null : "VITE_SUPABASE_ANON_KEY",
].filter((n): n is string => n !== null);

if (faltan.length > 0) {
  raiz.render(
    <StrictMode>
      <ConfigError faltan={faltan} />
    </StrictMode>,
  );
} else {
  void import("@/app/App").then(({ App }) => {
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
