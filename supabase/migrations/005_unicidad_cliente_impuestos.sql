-- ========================================================================================
-- MIGRACIÓN: UNICIDAD REAL EN CLIENTE_IMPUESTOS
-- ========================================================================================
-- cliente_impuestos nunca tuvo una restricción que impidiera dos asignaciones ACTIVAS del
-- mismo impuesto al mismo cliente. asignarImpuesto() (asignación individual) ya reactivaba
-- la fila soft-deleted existente en vez de duplicar, pero asignarImpuestosBulk() (carga
-- masiva) solo hacía INSERT, así que re-subir el mismo Excel dos veces podía crear filas
-- ACTIVO duplicadas para el mismo cliente+impuesto.
--
-- Verificado antes de aplicar (2026-08-27): 0 duplicados activos existentes en producción,
-- así que el índice se puede crear sin fallar.
-- ========================================================================================
CREATE UNIQUE INDEX IF NOT EXISTS cliente_impuestos_activo_unico
  ON public.cliente_impuestos (cliente_id, impuesto_id)
  WHERE eliminado IS NULL;
