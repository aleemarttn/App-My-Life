import { useEffect, useState } from "react";

/**
 * Segundos transcurridos desde `iniciadaEn` (ISO), refrescados cada segundo.
 *
 * Siempre se calcula contra el reloj, nunca acumulando ticks: si la pantalla
 * se apaga o la PWA se descarta y se vuelve a abrir, el tiempo que sale
 * sigue siendo el real de la sesion. `pausado` solo deja de refrescar la
 * pantalla; no altera lo que se guarda, porque no se guarda nada.
 */
export function useCronometro(iniciadaEn: string, pausado = false): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (pausado) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausado]);

  return Math.max(0, Math.floor((ahora - new Date(iniciadaEn).getTime()) / 1000));
}
