-- FASE: Agregar columnas de proyección y sucursal a prospectos
-- Aplica en: Supabase Dashboard > SQL Editor

ALTER TABLE public.prospectos
  ADD COLUMN IF NOT EXISTS proyeccion jsonb,
  ADD COLUMN IF NOT EXISTS sucursal_cercana jsonb;

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'prospectos'
  AND column_name IN ('proyeccion', 'sucursal_cercana');
