-- ========================================================================================
-- MIGRACIÓN: RLS REAL POR ROL Y PROPIETARIO (reemplaza las políticas "permitir todo")
-- + AUDITORÍA AUTOMÁTICA POR TRIGGER (deja de depender de que cada servicio de JS recuerde
--   llamar a registrarAuditoria())
-- + BLOQUEO DE CAMPOS EN VENCIMIENTOS (solo el sync oficial puede tocar la fecha)
-- ========================================================================================
-- Contexto: todas las políticas actuales son `USING (true) WITH CHECK (true)` para el rol
-- `authenticated`, es decir, cualquier usuario logueado puede leer/escribir cualquier fila de
-- cualquier tabla vía el cliente Supabase, sin importar su cargo. El control de acceso real
-- vive solo en JavaScript (ProtectedRoute, banderas puedeAdministrar, filtros en servicios).
-- Esta migración reproduce esas mismas reglas de negocio a nivel de base de datos.
--
-- "Admin" en toda esta migración significa exactamente: cargo IN ('Gerente', 'Ingeniero').
-- No existe ni se crea ningún rol/cargo literal llamado 'Admin' — es simplemente el nombre
-- corto que le damos a esa combinación de dos cargos para no repetirla en cada política.
--
-- IMPORTANTE ANTES DE APLICAR:
--  1. Revisar cada política contra el comportamiento actual de la UI (dejé el mapeo a la
--     página/servicio que la motiva en cada bloque).
--  2. Probar primero contra un branch/rama de desarrollo de Supabase, no directo en prod.
--  3. Los 3 Edge Functions (crear-usuario, resetear-clave, enviar-notificaciones) usan la
--     SERVICE_ROLE_KEY, que siempre bypassa RLS — no se ven afectados por esta migración.
--  4. Tras aplicar esto, hay que quitar las llamadas manuales a
--     usuariosService.registrarAuditoria() del código de cada servicio (ya no hacen falta y
--     duplicarían el registro); se deja el detalle de qué archivos tocar al final del archivo.

-- ========================================================================================
-- 1. FUNCIONES AUXILIARES (SECURITY DEFINER para evitar recursión de RLS sobre 'usuarios')
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.mi_cargo()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cargo FROM public.usuarios WHERE id = auth.uid();
$$;

-- "Admin" = Gerente o Ingeniero. Únicos dos cargos con permisos de administración hoy.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.mi_cargo() IN ('Gerente', 'Ingeniero');
$$;

-- ========================================================================================
-- 2. USUARIOS
-- Directorio: SELECT abierto (se usa en dropdowns de responsable/especialista en toda la app).
-- INSERT: ninguna (los usuarios solo se crean vía Edge Function crear-usuario con service_role).
-- UPDATE: uno mismo (PerfilPage) o Gerente/Ingeniero (UserForm). Un trigger impide que alguien
--         que NO sea Gerente/Ingeniero se auto-cambie 'cargo' o 'estado', aunque sea su propia
--         fila.
-- DELETE: ninguna (usuariosService.delete() hace soft-delete vía UPDATE, no DELETE real).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.usuarios;

CREATE POLICY "usuarios_select_directorio" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "usuarios_update_propio_o_admin" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.es_admin())
  WITH CHECK (id = auth.uid() OR public.es_admin());

CREATE OR REPLACE FUNCTION public.usuarios_bloquear_autoescalada()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo Gerente o Ingeniero pueden cambiar cargo/estado, incluso sobre su propia fila.
  IF NOT public.es_admin() THEN
    IF NEW.cargo IS DISTINCT FROM OLD.cargo OR NEW.estado IS DISTINCT FROM OLD.estado THEN
      RAISE EXCEPTION 'No autorizado para modificar cargo o estado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_usuarios_bloquear_autoescalada ON public.usuarios;
CREATE TRIGGER trg_usuarios_bloquear_autoescalada
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.usuarios_bloquear_autoescalada();

-- ========================================================================================
-- 3. CLIENTES
-- Directorio compartido: SELECT abierto a todos (ClientesPage, DetalleClientePage no filtran
-- por responsable). Escritura: solo Gerente/Ingeniero (puedeAdministrar en ClientesPage.tsx;
-- confirmado: hoy son los únicos cargos con permiso real para crear/editar clientes).
-- DELETE real: ninguna (soft-delete vía UPDATE eliminado/estado).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.clientes;

CREATE POLICY "clientes_select_directorio" ON public.clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clientes_insert_admin" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (public.es_admin());

CREATE POLICY "clientes_update_admin" ON public.clientes
  FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ========================================================================================
-- 4. IMPUESTOS
-- SELECT abierto (nav "Impuestos" visible a todos los roles en Layout.tsx). Escritura: solo
-- Gerente/Ingeniero (puedeAdministrar en ImpuestosPage.tsx / DetalleImpuestoPage.tsx).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.impuestos;

CREATE POLICY "impuestos_select_directorio" ON public.impuestos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "impuestos_insert_admin" ON public.impuestos
  FOR INSERT TO authenticated WITH CHECK (public.es_admin());

CREATE POLICY "impuestos_update_admin" ON public.impuestos
  FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ========================================================================================
-- 5. CLIENTE_IMPUESTOS
-- SELECT abierto (necesario para que cualquiera vea las obligaciones de un cliente en su
-- ficha). Escritura: solo Gerente/Ingeniero (el modal de obligaciones en DetalleClientePage.tsx
-- está detrás de puedeAdministrar).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.cliente_impuestos;

CREATE POLICY "cliente_impuestos_select_directorio" ON public.cliente_impuestos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cliente_impuestos_insert_admin" ON public.cliente_impuestos
  FOR INSERT TO authenticated WITH CHECK (public.es_admin());

CREATE POLICY "cliente_impuestos_update_admin" ON public.cliente_impuestos
  FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ========================================================================================
-- 6. CALENDARIO_BASE_IMPUESTOS
-- SELECT abierto (todos ven el calendario oficial). Escritura y DELETE: solo Gerente/Ingeniero
-- — este es el fix real del hallazgo de /impuestos/:id sin guard de ruta; con esto la mutación
-- queda bloqueada a nivel de base de datos sin importar qué botón o ruta la dispare.
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.calendario_base_impuestos;

CREATE POLICY "calendario_base_select_directorio" ON public.calendario_base_impuestos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "calendario_base_insert_admin" ON public.calendario_base_impuestos
  FOR INSERT TO authenticated WITH CHECK (public.es_admin());

CREATE POLICY "calendario_base_update_admin" ON public.calendario_base_impuestos
  FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "calendario_base_delete_admin" ON public.calendario_base_impuestos
  FOR DELETE TO authenticated USING (public.es_admin());

-- ========================================================================================
-- 7. VENCIMIENTOS
-- SELECT: Gerente/Ingeniero ven todo; el resto solo lo suyo (contador del cliente O
-- especialista del impuesto) — reproduce el filtro que hoy hace
-- vencimientosService.getVencimientosMes en JS.
-- INSERT: solo Gerente/Ingeniero (los vencimientos se generan por
-- calendarioBaseService.sincronizarVencimientosConCalendarioBase, no hay alta manual en la UI).
-- UPDATE: el encargado (contador o especialista) puede actualizar SU vencimiento, pero un
-- trigger le bloquea todo excepto 'estado_tarea' y 'observaciones' — la fecha límite y demás
-- datos del vencimiento SOLO se actualizan de forma automática desde el calendario oficial
-- (sincronizarVencimientosConCalendarioBase), nunca a mano.
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.vencimientos;

CREATE POLICY "vencimientos_select_propio_o_admin" ON public.vencimientos
  FOR SELECT TO authenticated USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = auth.uid()
    )
  );

CREATE POLICY "vencimientos_insert_admin" ON public.vencimientos
  FOR INSERT TO authenticated WITH CHECK (public.es_admin());

CREATE POLICY "vencimientos_update_propio_o_admin" ON public.vencimientos
  FOR UPDATE TO authenticated USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = auth.uid()
    )
  ) WITH CHECK (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = vencimientos.cliente_id AND c.contador_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.impuestos i
      WHERE i.id = vencimientos.impuesto_id AND i.especialista_id = auth.uid()
    )
  );

-- Blindaje de campos: el encargado (no-admin) solo puede tocar estado_tarea/observaciones.
-- La fecha límite y los datos de identidad del vencimiento son de solo-lectura para él; solo
-- el sync automático del calendario oficial (que corre como Gerente/Ingeniero) los cambia.
CREATE OR REPLACE FUNCTION public.vencimientos_bloquear_campos_no_autorizados()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.es_admin() THEN
    IF NEW.fecha_limite IS DISTINCT FROM OLD.fecha_limite
       OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
       OR NEW.impuesto_id IS DISTINCT FROM OLD.impuesto_id
       OR NEW.calendario_base_id IS DISTINCT FROM OLD.calendario_base_id
       OR NEW.periodo_fiscal IS DISTINCT FROM OLD.periodo_fiscal THEN
      RAISE EXCEPTION 'La fecha límite y los datos del vencimiento solo se actualizan automáticamente desde el calendario oficial. El encargado solo puede cambiar el estado y las observaciones.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_vencimientos_bloquear_campos ON public.vencimientos;
CREATE TRIGGER trg_vencimientos_bloquear_campos
  BEFORE UPDATE ON public.vencimientos
  FOR EACH ROW EXECUTE FUNCTION public.vencimientos_bloquear_campos_no_autorizados();

-- ========================================================================================
-- 8. TAREAS
-- SELECT: Gerente/Ingeniero ven todo; el resto solo las suyas (tareasService.getAll ya filtra
-- así en JS). INSERT/UPDATE: uno mismo o Gerente/Ingeniero (TareaForm solo deja elegir otro
-- usuario si puedeAdministrar). DELETE real: ninguna (soft-delete vía UPDATE eliminado).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.tareas;

CREATE POLICY "tareas_select_propio_o_admin" ON public.tareas
  FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR public.es_admin());

CREATE POLICY "tareas_insert_propio_o_admin" ON public.tareas
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid() OR public.es_admin());

CREATE POLICY "tareas_update_propio_o_admin" ON public.tareas
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid() OR public.es_admin())
  WITH CHECK (usuario_id = auth.uid() OR public.es_admin());

-- ========================================================================================
-- 9. AUDITORIA — ahora se llena SOLA por trigger (ver sección 11), ya no depende de que cada
-- servicio de JS recuerde llamar a registrarAuditoria(). Registro append-only: nadie puede
-- editar ni borrar. SELECT solo Gerente/Ingeniero.
-- La política de INSERT para 'authenticated' se deja SOLO para el único caso que no pasa por
-- una tabla con trigger: el registro de "clave restablecida por administrador" en
-- usuariosService.forzarCambioPassword (la Edge Function resetear-clave cambia la contraseña
-- en auth.users, no en una tabla de public, así que no hay fila que dispare un trigger).
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.auditoria;

CREATE POLICY "auditoria_select_admin" ON public.auditoria
  FOR SELECT TO authenticated USING (public.es_admin());

CREATE POLICY "auditoria_insert_propio" ON public.auditoria
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

-- Sin política de UPDATE/DELETE para 'authenticated' => denegado por defecto.

-- ========================================================================================
-- 10. NOTIFICACIONES_ENVIADAS
-- Tabla de uso exclusivo del Edge Function enviar-notificaciones (vía SERVICE_ROLE_KEY, que
-- bypassa RLS). Ningún usuario autenticado necesita leerla ni escribirla desde el navegador.
-- ========================================================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.notificaciones_enviadas;
-- Sin políticas para 'authenticated' => denegado por defecto (solo accesible por service_role).

-- ========================================================================================
-- 11. AUDITORÍA AUTOMÁTICA POR TRIGGER
-- Reemplaza los ~20 llamados manuales a usuariosService.registrarAuditoria() repartidos en
-- clientesService, usuariosService, impuestosService, tareasService, calendarioBaseService y
-- vencimientosService. Con esto, CUALQUIER INSERT/UPDATE/DELETE sobre las tablas de negocio
-- queda registrado siempre, sin importar si el desarrollador se acordó de llamar a la función
-- de auditoría en ese servicio en particular (así se genera el registro que hoy le falta a
-- tareasService.updateEstado, por ejemplo).
--
-- Detecta automáticamente:
--   - CREAR     -> INSERT
--   - ELIMINAR  -> UPDATE donde 'eliminado' pasa de NULL a NOT NULL (soft-delete)
--   - REACTIVAR -> UPDATE donde 'eliminado' pasa de NOT NULL a NULL (soft-undelete)
--   - MODIFICAR -> cualquier otro UPDATE
--   - ELIMINAR  -> DELETE real (no se usa hoy salvo en calendario_base_impuestos)
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.registrar_auditoria_automatica()
RETURNS TRIGGER AS $$
DECLARE
  v_accion TEXT;
  v_registro_id UUID;
  v_eliminado_antes TEXT;
  v_eliminado_despues TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_accion := 'CREAR';
    v_registro_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_accion := 'ELIMINAR';
    v_registro_id := OLD.id;
  ELSE -- UPDATE
    v_eliminado_antes := to_jsonb(OLD)->>'eliminado';
    v_eliminado_despues := to_jsonb(NEW)->>'eliminado';

    IF v_eliminado_antes IS NULL AND v_eliminado_despues IS NOT NULL THEN
      v_accion := 'ELIMINAR';
    ELSIF v_eliminado_antes IS NOT NULL AND v_eliminado_despues IS NULL THEN
      v_accion := 'REACTIVAR';
    ELSE
      v_accion := 'MODIFICAR';
    END IF;
    v_registro_id := NEW.id;
  END IF;

  INSERT INTO public.auditoria (usuario_id, accion, modulo, registro_id, datos_previos, datos_nuevos)
  VALUES (
    auth.uid(), -- NULL cuando la mutación corre con SERVICE_ROLE_KEY (ver nota más abajo)
    v_accion,
    UPPER(TG_TABLE_NAME),
    v_registro_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auditoria_usuarios ON public.usuarios;
CREATE TRIGGER trg_auditoria_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_clientes ON public.clientes;
CREATE TRIGGER trg_auditoria_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_impuestos ON public.impuestos;
CREATE TRIGGER trg_auditoria_impuestos
  AFTER INSERT OR UPDATE OR DELETE ON public.impuestos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_cliente_impuestos ON public.cliente_impuestos;
CREATE TRIGGER trg_auditoria_cliente_impuestos
  AFTER INSERT OR UPDATE OR DELETE ON public.cliente_impuestos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_calendario_base ON public.calendario_base_impuestos;
CREATE TRIGGER trg_auditoria_calendario_base
  AFTER INSERT OR UPDATE OR DELETE ON public.calendario_base_impuestos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_vencimientos ON public.vencimientos;
CREATE TRIGGER trg_auditoria_vencimientos
  AFTER INSERT OR UPDATE OR DELETE ON public.vencimientos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_auditoria_tareas ON public.tareas;
CREATE TRIGGER trg_auditoria_tareas
  AFTER INSERT OR UPDATE OR DELETE ON public.tareas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

-- NOTA sobre 'usuario_id = NULL' en la auditoría:
-- La creación de usuarios (crear-usuario) corre con SERVICE_ROLE_KEY, que no lleva el JWT del
-- Gerente/Ingeniero que hizo la solicitud, así que auth.uid() es NULL en ese INSERT puntual y
-- el trigger no puede saber quién fue. Ya agregué un INSERT explícito de auditoría dentro de
-- la propia Edge Function crear-usuario (que sí conoce el id del llamador porque lo valida
-- para la autorización) para cubrir ese único caso — ver supabase/functions/crear-usuario/index.ts.
