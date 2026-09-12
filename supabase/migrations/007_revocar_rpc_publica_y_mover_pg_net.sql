-- ========================================================================================
-- MIGRACIÓN 007: cerrar superficie RPC publica innecesaria + mover pg_net fuera de public
-- ========================================================================================
-- Contexto: por defecto Postgres otorga EXECUTE a PUBLIC (anon + authenticated + cualquier
-- rol futuro) sobre toda funcion nueva. Ninguna de estas 6 funciones esta pensada para
-- llamarse directamente via /rest/v1/rpc/<nombre> desde el cliente (se confirmo que el
-- frontend no usa supabase.rpc() en ningun lado):
--   - es_admin() / mi_cargo(): solo se usan DENTRO de las politicas RLS (USING/WITH CHECK),
--     evaluadas con el rol 'authenticated' -> deben seguir siendo ejecutables por
--     'authenticated', pero no hace falta que 'anon' (sin sesion) pueda llamarlas.
--   - purgar_vencimientos_inactivos() / registrar_auditoria_automatica() /
--     usuarios_bloquear_autoescalada() / vencimientos_bloquear_campos_no_autorizados():
--     son funciones de trigger puras (RETURNS TRIGGER). Postgres las invoca automaticamente
--     al disparar el trigger sin requerir EXECUTE del rol que hizo el INSERT/UPDATE/DELETE,
--     asi que revocar EXECUTE de anon/authenticated no rompe nada y solo cierra la llamada
--     manual directa via RPC.
-- ========================================================================================

REVOKE EXECUTE ON FUNCTION public.es_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.es_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mi_cargo() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mi_cargo() FROM anon;
GRANT EXECUTE ON FUNCTION public.mi_cargo() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purgar_vencimientos_inactivos() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purgar_vencimientos_inactivos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.purgar_vencimientos_inactivos() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_automatica() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_automatica() FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_automatica() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.usuarios_bloquear_autoescalada() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.usuarios_bloquear_autoescalada() FROM anon;
REVOKE EXECUTE ON FUNCTION public.usuarios_bloquear_autoescalada() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.vencimientos_bloquear_campos_no_autorizados() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vencimientos_bloquear_campos_no_autorizados() FROM anon;
REVOKE EXECUTE ON FUNCTION public.vencimientos_bloquear_campos_no_autorizados() FROM authenticated;

-- ----------------------------------------------------------------------------------------
-- NOTA sobre pg_net: el advisory "extension_in_public" tambien senala esta extension, pero
-- pg_net NO soporta `ALTER EXTENSION ... SET SCHEMA` (no es reubicable). Sus funciones ya
-- viven en un schema propio ('net.http_get/http_post/...'), separado de 'public'; la unica
-- forma de mover el registro de la extension misma seria DROP + CREATE EXTENSION en el
-- schema nuevo, lo cual arriesga romper cron jobs o webhooks que dependan de ella. Se deja
-- fuera de esta migracion a proposito -- ver conversacion para la decision.
-- ----------------------------------------------------------------------------------------
