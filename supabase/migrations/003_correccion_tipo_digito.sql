-- ========================================================================================
-- MIGRACIÓN: CORRECCIÓN DE TIPO DE DATO PARA DÍGITOS DE CALENDARIO
-- ========================================================================================

-- 1. Modificar la columna 'digito' de INT4 a TEXT para preservar los ceros a la izquierda ('00', '01', etc.)
ALTER TABLE public.calendario_base_impuestos 
ALTER COLUMN digito TYPE TEXT USING digito::TEXT;


-- ========================================================================================
-- 2. (OPCIONAL) SANEAMIENTO DE DATOS HISTÓRICOS
-- Si ya tenías configurado el calendario de Renta PN y los dígitos del 0 al 9 
-- se guardaron como un solo número ('0', '1', ..., '9'), puedes ejecutar esta 
-- consulta para agregarles el cero a la izquierda automáticamente.
-- ========================================================================================

/*
UPDATE public.calendario_base_impuestos 
SET digito = LPAD(digito, 2, '0') 
WHERE impuesto_id = 'AQUÍ_EL_UUID_DEL_IMPUESTO_RENTA_PN' 
  AND LENGTH(digito) = 1;
*/