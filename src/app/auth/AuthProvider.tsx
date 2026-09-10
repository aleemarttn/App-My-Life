import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/core/supabase/client";
import { AuthContext } from "./authContext";

/**
 * Mantiene la sesion viva y sincronizada con supabase-js.
 *
 * No hace ninguna llamada de red al arrancar si ya hay sesion guardada:
 * getSession() lee de almacenamiento local. Eso importa porque la app tiene
 * que abrir sin cobertura.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vigente = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!vigente) return;
      setSession(data.session);
      setLoading(false);
    });

    // Cubre login, logout, refresco de token y cambios desde otra pestana.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, siguiente) => {
      setSession(siguiente);
      setLoading(false);
    });

    return () => {
      vigente = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
