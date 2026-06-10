
-- 1. Resend throttle table (service_role only — RLS denies everyone else)
CREATE TABLE public.email_resend_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text,
  outcome text NOT NULL DEFAULT 'sent',
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_resend_attempts_email_time_idx
  ON public.email_resend_attempts (lower(email), attempted_at DESC);

GRANT ALL ON public.email_resend_attempts TO service_role;
ALTER TABLE public.email_resend_attempts ENABLE ROW LEVEL SECURITY;
-- No policies => anon/authenticated cannot read or write directly.

-- 2. Analytics events table powering the staff funnel dashboard
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  props jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_event_time_idx
  ON public.analytics_events (event, created_at DESC);
CREATE INDEX analytics_events_time_idx
  ON public.analytics_events (created_at DESC);

GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including pre-signup anon visitors) may record their own events.
CREATE POLICY "events_insert_any" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only staff (teacher/admin/super_admin) can read the funnel data.
CREATE POLICY "events_select_staff" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
