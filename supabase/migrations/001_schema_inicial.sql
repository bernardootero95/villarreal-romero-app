-- ========================================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN - MARCA BLANCA
-- Este script construye la estructura relacional, triggers y políticas base para un nuevo tenant.
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

-- TABLA: USUARIOS (Extiende de auth.users de Supabase)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE,
    correo_notificacion TEXT,
    cargo TEXT NOT NULL,
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'INACTIVO')),
    eliminado TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: CLIENTES (Empresas asignadas a la firma)
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razon_social TEXT NOT NULL,
    nit TEXT NOT NULL UNIQUE,
    dv TEXT NOT NULL,
    contador_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: IMPUESTOS (Catálogo de Obligaciones de la Firma)
CREATE TABLE public.impuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    periodicidad TEXT NOT NULL,
    regla_vencimiento TEXT NOT NULL,
    especialista_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: CALENDARIO BASE (Plantilla oficial de vencimientos)
CREATE TABLE public.calendario_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    periodo TEXT NOT NULL,
    digito INTEGER, -- NULL indica que aplica para todos los dígitos (fecha fija)
    fecha_vencimiento_oficial DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: VENCIMIENTOS (Instancias reales asignadas a cada cliente)
CREATE TABLE public.vencimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
    asignacion_id UUID, -- Referencia a una posible tabla de historial de asignaciones
    fecha_limite DATE NOT NULL,
    periodo_fiscal TEXT NOT NULL,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    estado_tarea TEXT DEFAULT 'PENDIENTE' CHECK (estado_tarea IN ('PENDIENTE', 'REVISIÓN', 'PRESENTADO')),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: TAREAS (Gestión interna de actividades)
CREATE TABLE public.tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_limite DATE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'COMPLETADA')),
    eliminado TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: NOTIFICACIONES ENVIADAS (Auditoría y control de spam)
CREATE TABLE public.notificaciones_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_alerta TEXT NOT NULL,
    correo_destino TEXT NOT NULL,
    fecha_despacho DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================================
-- 4. ÍNDICES DE RENDIMIENTO (Performance)
-- ========================================================================================
CREATE INDEX idx_vencimientos_fecha ON public.vencimientos(fecha_limite);
CREATE INDEX idx_vencimientos_estado ON public.vencimientos(estado_tarea);
CREATE INDEX idx_tareas_fecha ON public.tareas(fecha_limite);
CREATE INDEX idx_tareas_estado ON public.tareas(estado);
CREATE INDEX idx_notificaciones_control ON public.notificaciones_enviadas(usuario_id, tipo_alerta, fecha_despacho);

-- ========================================================================================
-- 5. ASIGNACIÓN DE TRIGGERS (Auto-Update Timestamps)
-- ========================================================================================
CREATE TRIGGER set_timestamp_usuarios BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_impuestos BEFORE UPDATE ON public.impuestos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_calendario BEFORE UPDATE ON public.calendario_base FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_vencimientos BEFORE UPDATE ON public.vencimientos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_timestamp_tareas BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ========================================================================================
-- 6. CONFIGURACIÓN INICIAL DE SEGURIDAD (RLS)
-- ========================================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vencimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- Políticas base: Permitir acceso total a usuarios autenticados de la misma firma
-- (Asumiendo que el aislamiento de tenants se da por proyecto de Supabase)
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.impuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.calendario_base FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.vencimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.tareas FOR ALL TO authenticated USING (true) WITH CHECK (true);