/**
 * Pantalla de "falta configuracion". Se muestra cuando el bundle se
 * compilo sin las variables de entorno de Supabase.
 *
 * IMPORTANTE: este archivo no puede importar NADA de core/db ni de
 * core/supabase. Se pinta precisamente cuando esos modulos no pueden
 * cargarse, asi que importarlos provocaria el mismo fallo que intenta
 * explicar. Solo React y clases de Tailwind.
 */
export function ConfigError({ faltan }: { faltan: string[] }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-5">
        <h1 className="text-title mb-2 text-danger">Falta configuración</h1>

        <p className="text-body text-text-muted">
          La app se compiló sin estas variables de entorno, así que no puede
          conectarse a Supabase:
        </p>

        <ul className="my-4 space-y-1">
          {faltan.map((nombre) => (
            <li
              key={nombre}
              className="text-label rounded-button bg-surface-2 px-3 py-2 text-warning"
            >
              {nombre}
            </li>
          ))}
        </ul>

        <p className="text-caption text-text-faint">
          Se definen en el panel del hosting, no en el código. Vite las incrusta
          durante la compilación, así que después de añadirlas hay que volver a
          desplegar: no basta con recargar la página.
        </p>
      </div>
    </div>
  );
}
