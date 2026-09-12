-- ========================================================================================
-- MIGRACIÓN 008: alinear el schema versionado con el estado real de produccion (Contaflow-VR)
-- ========================================================================================
-- Contexto: al preparar el segundo despliegue (Contaflow-SC) se comparo el schema real de
-- Contaflow-VR contra las migraciones 001-007 y aparecieron 4 diferencias que nunca quedaron
-- documentadas en un archivo de migracion (cambios hechos en algun momento directo por el
-- SQL Editor o el dashboard de Supabase, sin dejar rastro en este repo):
--
--   1. calendario_base_impuestos tiene un UNIQUE (impuesto_id, anio, periodo, digito) real
--      llamado 'unique_regla_calendario' -- nunca creado por ninguna migracion.
--   2. cliente_impuestos tiene un UNIQUE (cliente_id, impuesto_id) SIN filtro, llamado
--      'unique_cliente_impuesto' -- mas estricto que el indice parcial de la migracion 005
--      (que solo cubre eliminado IS NULL). Coexisten sin conflicto porque el codigo de
--      asignarImpuesto()/asignarImpuestosBulk() siempre reactiva la fila existente (activa o
--      soft-deleted) en vez de insertar una nueva para el mismo par cliente+impuesto, asi que
--      nunca hay mas de una fila por par.
--   3. tareas tiene un CHECK (estado IN ('PENDIENTE','EN_PROGRESO','COMPLETADA')) real,
--      llamado 'tareas_estado_check' -- nunca creado por ninguna migracion.
--   4. La funcion public.handle_updated_at() y los 7 triggers set_timestamp_* creados por la
--      migracion 001 YA NO EXISTEN en produccion (se eliminaron en algun momento). Se
--      confirmo que ningun trigger es necesario: TODOS los *Service.ts de la app ya setean
--      'actualizado: new Date().toISOString()' manualmente en cada update. Se eliminan aqui
--      para que el schema versionado deje de mentir sobre su propia existencia.
--   5. notificaciones_enviadas tiene una politica explicita "Permitir todo al service_role"
--      -- redundante (service_role siempre bypassa RLS), pero se replica para que el schema
--      sea identico byte a byte entre instancias.
--
-- Esta migracion es un catch-up idempotente: en Contaflow-VR los puntos 1-4 son no-ops (ya
-- estan en ese estado) y quedan registrados en su historial de migraciones para que un futuro
-- `supabase db push` no intente reaplicarlos y falle. En un despliegue nuevo (Contaflow-SC en
-- adelante) deja el schema identico al de produccion real.
-- ========================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_regla_calendario'
  ) THEN
    ALTER TABLE public.calendario_base_impuestos
      ADD CONSTRAINT unique_regla_calendario UNIQUE (impuesto_id, anio, periodo, digito);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_cliente_impuesto'
  ) THEN
    ALTER TABLE public.cliente_impuestos
      ADD CONSTRAINT unique_cliente_impuesto UNIQUE (cliente_id, impuesto_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tareas_estado_check'
  ) THEN
    ALTER TABLE public.tareas
      ADD CONSTRAINT tareas_estado_check CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'));
  END IF;
END $$;

-- Quitar los triggers/funcion de timestamp automatico: nunca se usan (la app ya setea
-- 'actualizado' manualmente en cada UPDATE) y no existen en produccion desde hace tiempo.
DROP TRIGGER IF EXISTS set_timestamp_usuarios ON public.usuarios;
DROP TRIGGER IF EXISTS set_timestamp_clientes ON public.clientes;
DROP TRIGGER IF EXISTS set_timestamp_impuestos ON public.impuestos;
DROP TRIGGER IF EXISTS set_timestamp_cliente_impuestos ON public.cliente_impuestos;
DROP TRIGGER IF EXISTS set_timestamp_calendario ON public.calendario_base_impuestos;
DROP TRIGGER IF EXISTS set_timestamp_vencimientos ON public.vencimientos;
DROP TRIGGER IF EXISTS set_timestamp_tareas ON public.tareas;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- 5. Politica explicita (redundante pero presente en produccion) para service_role
DROP POLICY IF EXISTS "Permitir todo al service_role" ON public.notificaciones_enviadas;
CREATE POLICY "Permitir todo al service_role" ON public.notificaciones_enviadas
  FOR ALL TO service_role USING (true) WITH CHECK (true);
