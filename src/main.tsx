import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigError } from "@/app/ConfigError";
import { revisarConfig } from "@/app/revisarConfig";
import "@/styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No existe #root en index.html");

const raiz = createRoot(root);

/**
 * Arranque en dos tiempos: primero se revisa la configuracion, y solo si
 * esta bien se carga la aplicacion.
 *
 * Vite incrusta las variables VITE_* en el bundle al compilar. Si estan mal,
 * el cliente de Supabase revienta AL IMPORTARSE, antes de que React monte
 * nada, y el resultado es una pantalla en blanco con el error escondido en
 * la consola. Por eso `App` se importa de forma dinamica: asi la cadena que
 * llega hasta core/supabase no se ejecuta y en su lugar se pinta algo que
 * explica el problema.
 */
const problemas = revisarConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function pintarError(lista: typeof problemas) {
  raiz.render(
    <StrictMode>
      <ConfigError problemas={lista} />
    </StrictMode>,
  );
}

if (problemas.length > 0) {
  pintarError(problemas);
} else {
  void import("@/app/App")
    .then(({ App }) => {
      raiz.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    })
    .catch((fallo: unknown) => {
      // Sin este catch, cualquier fallo al cargar la aplicacion deja la
      // pantalla en negro y en silencio. Fue exactamente lo que paso en el
      // primer despliegue.
      pintarError([
        {
          variable: "Arranque",
          problema: fallo instanceof Error ? fallo.message : String(fallo),
          grave: true,
        },
      ]);
    });
}
