
CREATE TABLE public.checkpoint_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkpoint_id uuid NOT NULL REFERENCES public.lesson_checkpoints(id) ON DELETE CASCADE,
  picked_index integer NOT NULL,
  is_correct boolean NOT NULL,
  attempts_so_far integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checkpoint_attempts_user_checkpoint_idx
  ON public.checkpoint_attempts (user_id, checkpoint_id, created_at DESC);

GRANT SELECT, INSERT ON public.checkpoint_attempts TO authenticated;
GRANT ALL ON public.checkpoint_attempts TO service_role;

ALTER TABLE public.checkpoint_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own checkpoint attempts"
  ON public.checkpoint_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students insert own checkpoint attempts"
  ON public.checkpoint_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff view all checkpoint attempts"
  ON public.checkpoint_attempts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
