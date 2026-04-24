-- FASE 1: Tabla de perfiles y roles
-- Aplica en: Supabase Dashboard > SQL Editor

-- 1. Crear tabla perfiles
CREATE TABLE IF NOT EXISTS public.perfiles (
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT,
  rol           TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin','director','usuario')),
  activo        BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insertar todos los usuarios existentes como 'usuario' activo
INSERT INTO public.perfiles (user_id, email, rol, activo)
SELECT id, email, 'usuario', true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Asignar rol 'admin' al usuario lrojasreyes
UPDATE public.perfiles SET rol = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email ILIKE 'lrojasreyes%'
  ORDER BY created_at ASC LIMIT 1
);

-- 4. Asignar rol 'director' a los 4 directores
UPDATE public.perfiles SET rol = 'director'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'varredondo@bafar.com.mx',
    'oespinosa@bafar.com.mx',
    'jaguilara@bafar.com.mx',
    'nbriones@bafar.com.mx'
  )
);

-- 5. Verificar resultado
SELECT p.email, p.rol, p.activo, u.email AS email_auth
FROM public.perfiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.rol, p.email;
