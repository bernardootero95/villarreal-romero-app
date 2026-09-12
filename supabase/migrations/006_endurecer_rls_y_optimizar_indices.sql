-- ========================================================================================
-- MIGRACIÓN 006: CIERRA FUGA DE RLS EN TAREAS + OPTIMIZACIÓN (initplan RLS + índices FK)
-- ========================================================================================
-- Contexto: al aplicar la migración 004 (RLS por rol) sobre 'tareas', quedaron vivas 4
-- políticas heredadas de una configuración anterior a las migraciones versionadas:
--   "Permitir SELECT/INSERT/UPDATE/DELETE a usuarios autenticados" (todas USING/CHECK true).
-- Como las políticas RLS "permissive" se combinan con OR, estas políticas viejas anulan por
-- completo la regla "solo mis tareas o admin" de tareas_select/insert/update_propio_o_admin:
-- CUALQUIER usuario autenticado podía leer, modificar o BORRAR FÍSICAMENTE cualquier tarea de
-- cualquier otro usuario (la política de DELETE ni siquiera tiene contraparte fina — la app
-- nunca hace hard-delete, pero la API REST sí lo permitía). Este es el fix principal de esta
-- migración.
--
-- De paso se resuelven los hallazgos de performance advisor:
--   - auth_rls_initplan: envolver auth.uid() en (select auth.uid()) para que el planner lo
--     evalúe una vez por statement en vez de una vez por fila.
--   - unindexed_foreign_keys: índice en las 9 FK que no tenían cobertura.
--   - function_search_path_mutable: fijar search_path en purgar_vencimientos_inactivos.
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- 1. FIX CRÍTICO: eliminar políticas heredadas "permitir todo" en tareas
-- ----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir SELECT a usuarios autenticados" ON public.tareas;
DROP POLICY IF EXISTS "Permitir INSERT a usuarios autenticados" ON public.tareas;
DROP POLICY IF EXISTS "Permitir UPDATE a usuarios autenticados" ON public.tareas;
DROP POLICY IF EXISTS "Permitir DELETE a usuarios autenticados" ON public.tareas;

-- ----------------------------------------------------------------------------------------
-- 2. RLS INITPLAN: reemplazar auth.uid() por (select auth.uid()) en las 7 políticas marcadas
-- ----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "usuarios_update_propio_o_admin" ON public.usuarios;
CREATE POLICY "usuarios_update_propio_o_admin" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) OR public.es_admin())
  WITH CHECK (id = (select auth.uid()) OR public.es_admin());

DROP POLICY IF EXISTS "tareas_select_propio_o_admin" ON public.tareas;
CREATE POLICY "tareas_select_propio_o_admin" ON public.tareas
  FOR SELECT TO authenticated USING (usuario_id = (select auth.uid()) OR public.es_admin());

DROP POLICY IF EXISTS "tareas_insert_propio_o_admin" ON public.tareas;
CREATE POLICY "tareas_insert_propio_o_admin" ON public.tareas
  FOR INSERT TO authenticated WITH CHECK (usuario_id = (select auth.uid()) OR public.es_admin());

DROP POLICY IF EXISTS "tareas_update_propio_o_admin" ON public.tareas;
CREATE POLICY "tareas_update_propio_o_admin" ON public.tareas
  FOR UPDATE TO authenticated
  USING (usuario_id = (select auth.uid()) OR public.es_admin())
  WITH CHECK (usuario_id = (select auth.uid()) OR public.es_admin());

DROP POLICY IF EXISTS "auditoria_insert_propio" ON public.auditoria;
CREATE POLICY "auditoria_insert_propio" ON public.auditoria
  FOR INSERT TO authenticated WITH CHECK (usuario_id = (select auth.uid()));

DROP POLICY IF EXISTS "vencimientos_select_propio_o_admin" ON public.vencimientos;
CREATE POLICY "vencimientos_select_propio_o_admin" ON public.vencimientos
  FOR SELECT TO authenticated USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "vencimientos_update_propio_o_admin" ON public.vencimientos;
CREATE POLICY "vencimientos_update_propio_o_admin" ON public.vencimientos
  FOR UPDATE TO authenticated USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = (select auth.uid())
    )
  ) WITH CHECK (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = (select auth.uid())
    )
  );

-- ----------------------------------------------------------------------------------------
-- 3. ÍNDICES FALTANTES EN FOREIGN KEYS
-- ----------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON public.auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_cliente_impuestos_impuesto_id ON public.cliente_impuestos (impuesto_id);
CREATE INDEX IF NOT EXISTS idx_clientes_contador_id ON public.clientes (contador_id);
CREATE INDEX IF NOT EXISTS idx_impuestos_especialista_id ON public.impuestos (especialista_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_enviadas_usuario_id ON public.notificaciones_enviadas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_tareas_usuario_id ON public.tareas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_vencimientos_calendario_base_id ON public.vencimientos (calendario_base_id);
CREATE INDEX IF NOT EXISTS idx_vencimientos_cliente_id ON public.vencimientos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_vencimientos_impuesto_id ON public.vencimientos (impuesto_id);

-- ----------------------------------------------------------------------------------------
-- 4. FIJAR search_path EN purgar_vencimientos_inactivos (function_search_path_mutable)
-- ----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purgar_vencimientos_inactivos()
RETURNS TRIGGER AS $$
BEGIN
    -- Se activa si el registro pasa a inactivo o se le aplica borrado lógico (eliminado)
    IF (NEW.eliminado IS NOT NULL AND OLD.eliminado IS NULL) OR (NEW.estado != 'ACTIVO' AND OLD.estado = 'ACTIVO') THEN

        IF TG_TABLE_NAME = 'clientes' THEN
            DELETE FROM public.vencimientos
            WHERE cliente_id = NEW.id AND estado_tarea != 'PRESENTADO';

        ELSIF TG_TABLE_NAME = 'impuestos' THEN
            DELETE FROM public.vencimientos
            WHERE impuesto_id = NEW.id AND estado_tarea != 'PRESENTADO';

        ELSIF TG_TABLE_NAME = 'cliente_impuestos' THEN
            DELETE FROM public.vencimientos
            WHERE cliente_id = NEW.cliente_id
              AND impuesto_id = NEW.impuesto_id
              AND estado_tarea != 'PRESENTADO';
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
