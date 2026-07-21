-- ========================================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN - MARCA BLANCA (VERSIÓN EXACTA)
-- ========================================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ========================================================================================
-- 2. FUNCIÓN GENÉRICA PARA ACTUALIZAR TIMESTAMPS (Triggers)
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================================
-- 3. CREACIÓN DE TABLAS PRINCIPALES
-- ========================================================================================

-- TABLA: USUARIOS
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT,
    cargo TEXT NOT NULL,
    estado TEXT DEFAULT 'ACTIVO',
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW(),
    eliminado TIMESTAMPTZ,
    correo_notificacion VARCHAR
);

-- TABLA: CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nit TEXT UNIQUE NOT NULL,
    dv INT4 NOT NULL,
    razon_social TEXT NOT NULL,
    email TEXT,
    contador_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'ACTIVO',
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW(),
    eliminado TIMESTAMPTZ,
    celular TEXT
);

-- TABLA: IMPUESTOS
CREATE TABLE public.impuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    periodicidad TEXT NOT NULL,
    regla_vencimiento TEXT NOT NULL,
    especialista_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'ACTIVO',
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW(),
    eliminado TIMESTAMPTZ
);

-- TABLA: CLIENTE_IMPUESTOS (Relación muchos a muchos)
CREATE TABLE public.cliente_impuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'ACTIVO',
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW(),
    eliminado TIMESTAMPTZ
);

-- TABLA: CALENDARIO_BASE_IMPUESTOS
CREATE TABLE public.calendario_base_impuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
    anio INT4 NOT NULL,
    periodo TEXT NOT NULL,
    digito INT4,
    fecha_vencimiento_oficial DATE NOT NULL,
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: AUDITORIA
CREATE TABLE public.auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    registro_id UUID NOT NULL,
    datos_previos JSONB,
    datos_nuevos JSONB,
    creado TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: VENCIMIENTOS (Actualizada según captura)
CREATE TABLE public.vencimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
    calendario_base_id UUID NOT NULL REFERENCES public.calendario_base_impuestos(id) ON DELETE CASCADE,
    fecha_limite DATE NOT NULL,
    periodo_fiscal TEXT NOT NULL,
    estado_tarea TEXT DEFAULT 'PENDIENTE',
    observaciones TEXT,
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: TAREAS
CREATE TABLE public.tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_limite DATE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'PENDIENTE',
    creado TIMESTAMPTZ DEFAULT NOW(),
    actualizado TIMESTAMPTZ DEFAULT NOW(),
    eliminado TIMESTAMPTZ
);

-- TABLA: NOTIFICACIONES ENVIADAS
CREATE TABLE public.notificaciones_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_alerta TEXT NOT NULL,
    fecha_despacho DATE NOT NULL,
    correo_destino TEXT NOT NULL,
    creado TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================================
-- 4. ASIGNACIÓN DE TRIGGERS (Auto-Update Timestamps)
-- ========================================================================================
CREATE TRIGGER set_timestamp_usuarios BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_impuestos BEFORE UPDATE ON public.impuestos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_cliente_impuestos BEFORE UPDATE ON public.cliente_impuestos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_calendario BEFORE UPDATE ON public.calendario_base_impuestos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_vencimientos BEFORE UPDATE ON public.vencimientos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_tareas BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ========================================================================================
-- 5. CONFIGURACIÓN INICIAL DE SEGURIDAD (RLS)
-- ========================================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_impuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_base_impuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vencimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_enviadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.impuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.cliente_impuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.calendario_base_impuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.vencimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.tareas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.notificaciones_enviadas FOR ALL TO authenticated USING (true) WITH CHECK (true);