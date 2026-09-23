import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigError } from "@/app/ConfigError";
import { revisarConfig } from "@/app/revisarConfig";
import "@/styles/index.css";

/**
 * Recarga sola si un `import()` dinamico falla (rutas con `lazy`, como
 * `/entreno/modo`), en vez de dejar la pantalla de error crudo de
 * react-router ("'text/html' is not a valid JavaScript MIME type").
 *
 * Pasa cuando la pestana lleva abierta desde antes de un despliegue nuevo:
 * el bundle en memoria pide un trozo con el hash antiguo, ese archivo ya no
 * existe en el servidor, y el rewrite de SPA de `vercel.json` devuelve
 * `index.html` en su lugar. Es el fallo documentado de Vite para este caso
 * exacto (https://vite.dev/guide/build.html#load-error-handling).
 *
 * No perdona ninguna serie ya registrada -- eso ya esta en Dexie antes de
 * que esto pueda pasar -- solo el peso/reps que se estuvieran tecleando sin
 * confirmar todavia en la serie actual.
 */
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

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
