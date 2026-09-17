import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db } from "@/core/db";
import { leerPrimeraHoja } from "@/core/xlsx";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { emparejar } from "./importarEmparejar";
import type { Emparejamiento } from "./importarEmparejar";
import { validarFilas } from "./importarFormato";
import type { ErrorFila, FilaRutina } from "./importarFormato";
import { importarRutina } from "./importarRutina";
import type { Resolucion, ResumenImportacion } from "./importarRutina";

type Fase = "elegir" | "revisar" | "importando" | "hecho";

const ETIQUETA_ESTADO: Record<Emparejamiento["estado"], string> = {
  exacto: "exacto",
  probable: "propuesta",
  sin_resolver: "decide tú",
};

const COLOR_ESTADO: Record<Emparejamiento["estado"], string> = {
  exacto: "text-accent",
  probable: "text-warning",
  sin_resolver: "text-danger",
};

/**
 * Importador de rutinas desde Excel (spec §4.6).
 *
 * El archivo NO sale del dispositivo: SheetJS lo parsea en el navegador.
 * Nada se escribe hasta que el usuario confirma en el resumen, y ningun
 * nombre se empareja solo salvo que la coincidencia sea total.
 */
export function ImportarRutinaScreen() {
  const navigate = useNavigate();

  const catalogo = useLiveQuery(
    async () => {
      const filas = await db.exercises.filter((e) => e.deleted_at == null).sortBy("name");
      return filas.map((e) => ({ id: e.id, name: e.name }));
    },
    [],
    [],
  );

  const [fase, setFase] = useState<Fase>("elegir");
  const [fallo, setFallo] = useState<string | null>(null);
  const [errores, setErrores] = useState<ErrorFila[]>([]);
  const [columnasAusentes, setColumnasAusentes] = useState<string[]>([]);
  const [filas, setFilas] = useState<FilaRutina[]>([]);
  const [emparejamientos, setEmparejamientos] = useState<Emparejamiento[]>([]);
  const [resoluciones, setResoluciones] = useState<Map<string, Resolucion>>(new Map());
  const [nombreRutina, setNombreRutina] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);

  async function alElegirArchivo(archivo: File): Promise<void> {
    setFallo(null);
    setErrores([]);
    try {
      const hoja = await leerPrimeraHoja(archivo);
      const validacion = validarFilas(hoja.filas);

      setColumnasAusentes(validacion.columnasAusentes);
      if (validacion.errores.length > 0) {
        setErrores(validacion.errores);
        return;
      }
      if (validacion.filas.length === 0) {
        setFallo("El archivo no tiene ninguna fila con datos.");
        return;
      }

      const nombres = [...new Set(validacion.filas.map((f) => f.ejercicio))];
      const emparejados = emparejar(nombres, catalogo);

      const iniciales = new Map<string, Resolucion>();
      for (const e of emparejados) {
        if (e.propuesta) iniciales.set(e.nombreExcel, { tipo: "existente", id: e.propuesta.id });
      }

      setFilas(validacion.filas);
      setEmparejamientos(emparejados);
      setResoluciones(iniciales);
      setNombreRutina(hoja.nombre);
      setNombreArchivo(archivo.name);
      setFase("revisar");
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    }
  }

  function resolver(nombreExcel: string, valor: string): void {
    setResoluciones((actual) => {
      const siguiente = new Map(actual);
      if (valor === "") siguiente.delete(nombreExcel);
      else if (valor === "__nuevo__") siguiente.set(nombreExcel, { tipo: "nuevo" });
      else siguiente.set(nombreExcel, { tipo: "existente", id: valor });
      return siguiente;
    });
  }

  async function confirmar(): Promise<void> {
    setFase("importando");
    setFallo(null);
    try {
      setResumen(await importarRutina({ nombreRutina, nombreArchivo, filas, resoluciones }));
      setFase("hecho");
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo importar.");
      setFase("revisar");
    }
  }

  if (fase === "hecho" && resumen) {
    return (
      <Card titulo="Rutina importada">
        <p className="text-body text-text-muted">
          {resumen.semanas} semanas · {resumen.dias} días · {resumen.ejercicios} ejercicios.
        </p>
        {resumen.creados.length > 0 && (
          <p className="text-caption mt-2 text-text-muted">
            Ejercicios creados: {resumen.creados.join(", ")}.
          </p>
        )}
        <div className="mt-4">
          <Button onClick={() => navigate("/entreno")}>Volver a Entreno</Button>
        </div>
      </Card>
    );
  }

  if (fase === "elegir") {
    return (
      <div className="space-y-3">
        <Card titulo="Importar rutina">
          <p className="text-body mb-4 text-text-muted">
            El Excel de tu entrenador, con una fila por ejercicio. Se lee en el móvil; el archivo no
            se sube a ningún sitio.
          </p>
          <label className="text-body flex h-touch-primary cursor-pointer items-center justify-center rounded-button bg-accent font-semibold text-on-accent active:bg-accent-press">
            Elegir archivo
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void alElegirArchivo(archivo);
              }}
            />
          </label>
        </Card>

        {fallo && (
          <Card>
            <p className="text-body text-danger">{fallo}</p>
          </Card>
        )}

        {errores.length > 0 && (
          <Card titulo={`${errores.length} problema${errores.length === 1 ? "" : "s"} en el archivo`}>
            <p className="text-body mb-3 text-text-muted">No se ha importado nada. Corrígelos y vuelve a intentarlo.</p>
            <ul className="space-y-1.5">
              {errores.slice(0, 30).map((e, i) => (
                <li key={i} className="text-label">
                  <span className="text-text-faint tabular-nums">{e.fila === 0 ? "archivo" : `fila ${e.fila}`}</span>{" "}
                  <span className="text-text-muted">{e.mensaje}</span>
                </li>
              ))}
            </ul>
            {errores.length > 30 && (
              <p className="text-caption mt-2 text-text-faint">y {errores.length - 30} más…</p>
            )}
          </Card>
        )}
      </div>
    );
  }

  const sinResolver = emparejamientos.filter((e) => !resoluciones.has(e.nombreExcel)).length;
  const semanas = new Set(filas.map((f) => f.semana)).size;
  const dias = new Set(filas.map((f) => `${f.semana}-${f.dia}`)).size;

  return (
    <div className="space-y-3">
      <Card titulo="Qué se va a importar">
        <label className="text-label mb-1 block text-text-muted" htmlFor="nombre-rutina">
          Nombre de la rutina
        </label>
        <input
          id="nombre-rutina"
          value={nombreRutina}
          onChange={(e) => setNombreRutina(e.target.value)}
          className="text-body mb-3 h-touch w-full rounded-button border border-border bg-surface-2 px-4 text-text"
        />
        <p className="text-body text-text-muted">
          {semanas} semanas · {dias} días · {filas.length} ejercicios.
        </p>
        <p className="text-caption mt-2 text-text-faint">
          Pasará a ser tu rutina activa; la anterior deja de serlo.
        </p>
        {columnasAusentes.length > 0 && (
          <p className="text-caption mt-2 text-warning">
            Sin columna: {columnasAusentes.join(", ")}. Si era un error de nombre, cancela y corrígelo.
          </p>
        )}
      </Card>

      <Card titulo={`Ejercicios (${emparejamientos.length})`}>
        <p className="text-body mb-3 text-text-muted">
          {sinResolver === 0
            ? "Todos emparejados. Revisa las propuestas antes de importar."
            : `Faltan ${sinResolver} por decidir.`}
        </p>
        <ul className="space-y-3">
          {emparejamientos.map((e) => {
            const resolucion = resoluciones.get(e.nombreExcel);
            const valor =
              resolucion == null ? "" : resolucion.tipo === "nuevo" ? "__nuevo__" : resolucion.id;
            return (
              <li key={e.nombreExcel}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-body truncate">{e.nombreExcel}</span>
                  <span className={`text-caption shrink-0 ${COLOR_ESTADO[e.estado]}`}>
                    {ETIQUETA_ESTADO[e.estado]}
                  </span>
                </div>
                <select
                  value={valor}
                  onChange={(ev) => resolver(e.nombreExcel, ev.target.value)}
                  className="text-body h-touch w-full rounded-button border border-border bg-surface-2 px-3 text-text"
                >
                  <option value="">— elige un ejercicio —</option>
                  {e.candidatos.map((c) => (
                    <option key={c.ejercicio.id} value={c.ejercicio.id}>
                      {c.ejercicio.name}
                    </option>
                  ))}
                  <optgroup label="Resto del catálogo">
                    {catalogo
                      .filter((c) => !e.candidatos.some((cand) => cand.ejercicio.id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                  <option value="__nuevo__">+ Crear «{e.nombreExcel}»</option>
                </select>
              </li>
            );
          })}
        </ul>
      </Card>

      {fallo && (
        <Card>
          <p className="text-body text-danger">{fallo}</p>
        </Card>
      )}

      <div className="space-y-3">
        <Button
          onClick={() => void confirmar()}
          disabled={sinResolver > 0 || nombreRutina.trim() === "" || fase === "importando"}
        >
          {fase === "importando" ? "Importando…" : "Importar rutina"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => navigate("/entreno")}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
