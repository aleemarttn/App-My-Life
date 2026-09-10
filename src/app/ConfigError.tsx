import type { ProblemaConfig } from "./revisarConfig";

/**
 * Pantalla de "la configuracion esta mal". Se muestra cuando el bundle se
 * compilo sin las variables de Supabase o con valores que no son lo que
 * dicen ser.
 *
 * IMPORTANTE: este archivo no puede importar NADA de core/db ni de
 * core/supabase. Se pinta precisamente cuando esos modulos no pueden
 * cargarse, asi que importarlos provocaria el mismo fallo que intenta
 * explicar. Solo React y clases de Tailwind.
 */
export function ConfigError({ problemas }: { problemas: ProblemaConfig[] }) {
  const hayGrave = problemas.some((p) => p.grave);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-5">
        <h1 className="text-title mb-2 text-danger">
          {hayGrave ? "Configuración peligrosa" : "Falta configuración"}
        </h1>

        <p className="text-body text-text-muted">
          La app se compiló con estas variables de entorno mal puestas, así que
          no va a arrancar:
        </p>

        <ul className="my-4 space-y-2">
          {problemas.map((p) => (
            <li key={p.variable} className="rounded-button bg-surface-2 p-3">
              <p className="text-label text-warning">{p.variable}</p>
              <p className="text-caption mt-1 text-text-muted">{p.problema}</p>
            </li>
          ))}
        </ul>

        <p className="text-caption text-text-faint">
          Se definen en el panel del hosting, no en el código. Vite las incrusta
          durante la compilación, así que después de corregirlas hay que volver a
          desplegar: recargar la página no basta.
        </p>
      </div>
    </div>
  );
}
