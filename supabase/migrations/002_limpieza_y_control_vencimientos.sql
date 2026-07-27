-- ========================================================================================
-- LIMPIEZA DE DATOS HUÉRFANOS Y CONTROL DE VENCIMIENTOS
-- ========================================================================================

-- 1. PURGA INMEDIATA DE REGISTROS INACTIVOS O ELIMINADOS
-- Eliminar vencimientos pendientes de clientes inactivos o con borrado lógico
DELETE FROM public.vencimientos
WHERE estado_tarea != 'PRESENTADO'
  AND cliente_id IN (
      SELECT id FROM public.clientes 
      WHERE estado != 'ACTIVO' OR eliminado IS NOT NULL
  );

-- Eliminar vencimientos pendientes de impuestos inactivos o con borrado lógico
DELETE FROM public.vencimientos
WHERE estado_tarea != 'PRESENTADO'
  AND impuesto_id IN (
      SELECT id FROM public.impuestos 
      WHERE estado != 'ACTIVO' OR eliminado IS NOT NULL
  );

-- Eliminar vencimientos pendientes cuya relación cliente-impuesto ya no exista o esté inactiva
DELETE FROM public.vencimientos
WHERE estado_tarea != 'PRESENTADO'
  AND NOT EXISTS (
      SELECT 1 FROM public.cliente_impuestos ci
      WHERE ci.cliente_id = public.vencimientos.cliente_id
        AND ci.impuesto_id = public.vencimientos.impuesto_id
        AND ci.estado = 'ACTIVO'
        AND ci.eliminado IS NULL
  );

-- ========================================================================================
-- 2. FUNCIÓN DE DISPARADOR (TRIGGER) PARA MANTENIMIENTO AUTOMÁTICO
-- ========================================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ASIGNACIÓN DE TRIGGERS EN LAS TABLAS PADRE
DROP TRIGGER IF EXISTS trg_purgar_vencimientos_clientes ON public.clientes;
CREATE TRIGGER trg_purgar_vencimientos_clientes
AFTER UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.purgar_vencimientos_inactivos();

DROP TRIGGER IF EXISTS trg_purgar_vencimientos_impuestos ON public.impuestos;
CREATE TRIGGER trg_purgar_vencimientos_impuestos
AFTER UPDATE ON public.impuestos
FOR EACH ROW EXECUTE FUNCTION public.purgar_vencimientos_inactivos();

DROP TRIGGER IF EXISTS trg_purgar_vencimientos_ci ON public.cliente_impuestos;
CREATE TRIGGER trg_purgar_vencimientos_ci
AFTER UPDATE ON public.cliente_impuestos
FOR EACH ROW EXECUTE FUNCTION public.purgar_vencimientos_inactivos();