
-- Extend lessons with multimedia content support
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS summary text;

-- Lesson checkpoints: in-lesson quick checks
CREATE TABLE IF NOT EXISTS public.lesson_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_checkpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_checkpoints TO authenticated;
GRANT ALL ON public.lesson_checkpoints TO service_role;
ALTER TABLE public.lesson_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkpoints viewable by signed in" ON public.lesson_checkpoints
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers/admins manage checkpoints" ON public.lesson_checkpoints
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Lesson progress: per-user completion / position
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  checkpoint_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER lesson_progress_touch BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
