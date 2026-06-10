
ALTER TABLE public.signup_invites
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text,
  ADD COLUMN IF NOT EXISTS note text;

-- Allow admins to read the signup attempt audit log from the staff console.
GRANT SELECT ON public.signup_attempts TO authenticated;

DROP POLICY IF EXISTS "Admins read signup attempts" ON public.signup_attempts;
CREATE POLICY "Admins read signup attempts" ON public.signup_attempts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
