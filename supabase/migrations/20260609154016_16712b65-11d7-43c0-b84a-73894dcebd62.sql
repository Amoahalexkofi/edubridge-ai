
DROP POLICY IF EXISTS "events_insert_any" ON public.analytics_events;

CREATE POLICY "events_insert_self_or_anon" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );
