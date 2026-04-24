-- FASE 4: Row Level Security
-- IMPORTANTE: Aplicar SOLO después de verificar que Fase 1-3 funcionan correctamente
-- Aplica en: Supabase Dashboard > SQL Editor

-- RLS en tabla perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer todos los perfiles
-- (necesario para que directores y admins vean emails)
CREATE POLICY "perfiles_select_autenticados" ON public.perfiles
  FOR SELECT TO authenticated USING (true);

-- Solo el propio usuario puede actualizar su perfil (email)
CREATE POLICY "perfiles_update_propio" ON public.perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS en tabla prospectos
ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;

-- Usuario normal: solo sus propios prospectos (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "prospectos_usuario_propio" ON public.prospectos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Director y Admin: pueden SELECT todos los prospectos
CREATE POLICY "prospectos_director_select_todos" ON public.prospectos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE user_id = auth.uid()
        AND rol IN ('director','admin')
        AND activo = true
    )
  );

-- Admin: acceso total a todos los prospectos
CREATE POLICY "prospectos_admin_total" ON public.prospectos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE user_id = auth.uid()
        AND rol = 'admin'
        AND activo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE user_id = auth.uid()
        AND rol = 'admin'
        AND activo = true
    )
  );

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('perfiles','prospectos')
ORDER BY tablename, policyname;
