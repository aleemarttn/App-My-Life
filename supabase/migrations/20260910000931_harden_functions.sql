-- =============================================================
-- My Life · 0003 · Endurecido de funciones
--
-- Corrige los dos avisos del linter de seguridad de Supabase que
-- salieron al aplicar 0001. No cambia el modelo de datos.
--
-- El tercer aviso, sobre public.rls_auto_enable(), NO se toca: esa
-- función es de la plataforma de Supabase (propiedad de postgres),
-- es un event trigger que activa RLS en toda tabla nueva de public,
-- y modificarla sería desactivar una red de seguridad ajena.
-- =============================================================

-- -------------------------------------------------------------
-- 1 · search_path fijo en set_updated_at
-- Aviso: function_search_path_mutable.
-- Sin search_path fijo, quien pueda crear objetos en un esquema
-- del search_path del llamante podría sustituir a un operador o
-- función usada dentro del cuerpo. Aquí el riesgo es bajo porque
-- la función es SECURITY INVOKER, pero el coste de cerrarlo es
-- nulo. now() sigue resolviendo: pg_catalog se consulta siempre.
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- 2 · handle_new_user deja de ser invocable por el cliente
-- Avisos: anon_ / authenticated_security_definer_function_executable.
--
-- Es SECURITY DEFINER (tiene que serlo: escribe en profiles saltando
-- RLS cuando aún no hay sesión). PostgREST la expone como
-- /rest/v1/rpc/handle_new_user. En la práctica una llamada directa
-- falla, porque una función que devuelve `trigger` solo puede
-- ejecutarse como trigger, pero no conviene depender de eso: basta
-- con que deje de estar en la API pública.
--
-- El trigger on_auth_user_created sigue funcionando igual: se
-- ejecuta como el propietario de la tabla, no como el cliente.
-- -------------------------------------------------------------
revoke execute on function public.handle_new_user() from anon, authenticated, public;
