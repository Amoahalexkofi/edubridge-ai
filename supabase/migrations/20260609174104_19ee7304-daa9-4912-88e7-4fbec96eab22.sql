
-- 1. Signup settings (singleton)
CREATE TABLE public.signup_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  mode text NOT NULL DEFAULT 'open' CHECK (mode IN ('open','invite_only','closed')),
  domain_allowlist text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.signup_settings TO authenticated, anon;
GRANT ALL ON public.signup_settings TO service_role;
ALTER TABLE public.signup_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read signup settings"
  ON public.signup_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update signup settings"
  ON public.signup_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.signup_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 2. Signup invites whitelist
CREATE TABLE public.signup_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signup_invites_email_idx ON public.signup_invites (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signup_invites TO authenticated;
GRANT ALL ON public.signup_invites TO service_role;
ALTER TABLE public.signup_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage signup invites"
  ON public.signup_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- 3. Signup attempts (rate limiting log; service role only)
CREATE TABLE public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text,
  email text,
  outcome text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signup_attempts_ip_idx ON public.signup_attempts (ip, created_at DESC);
CREATE INDEX signup_attempts_email_idx ON public.signup_attempts (email, created_at DESC);
GRANT ALL ON public.signup_attempts TO service_role;
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: locked to service_role only.
