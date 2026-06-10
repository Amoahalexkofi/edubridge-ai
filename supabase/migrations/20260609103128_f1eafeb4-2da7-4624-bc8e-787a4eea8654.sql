
-- 1. Fix handle_new_user: ignore client-supplied role; always default to student
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- Always default to student. Role elevation must be performed by an admin server-side.
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $function$;

-- 2. Restrict profiles SELECT to self (teachers/admins keep access)
DROP POLICY IF EXISTS "Profiles viewable by signed-in users" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Staff view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3. Restrict reading correct answers on lesson_checkpoints to staff
DROP POLICY IF EXISTS "Checkpoints viewable by signed in" ON public.lesson_checkpoints;
CREATE POLICY "Students view checkpoint prompts" ON public.lesson_checkpoints
  FOR SELECT TO authenticated
  USING (true);
-- Column-level: revoke answer/explanation visibility from students
REVOKE SELECT ON public.lesson_checkpoints FROM authenticated;
GRANT SELECT (id, lesson_id, prompt, options, order_index, created_at) ON public.lesson_checkpoints TO authenticated;
GRANT SELECT ON public.lesson_checkpoints TO service_role;
-- Allow teachers/admins full select via separate role-based grant path is not possible per role,
-- so expose a server-side view for staff usage as needed.

-- 4. Restrict reading correct_answer/explanation on questions to staff
REVOKE SELECT ON public.questions FROM authenticated;
GRANT SELECT (id, subject_id, topic_id, question_type, difficulty, prompt, options, year, marks, created_by, created_at) ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO service_role;

-- 5. Trigger to prevent students from setting their own grades
CREATE OR REPLACE FUNCTION public.prevent_attempt_answer_grade_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_correct := NULL;
      NEW.marks_awarded := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.is_correct := OLD.is_correct;
      NEW.marks_awarded := OLD.marks_awarded;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS prevent_attempt_answer_grade_tampering ON public.attempt_answers;
CREATE TRIGGER prevent_attempt_answer_grade_tampering
BEFORE INSERT OR UPDATE ON public.attempt_answers
FOR EACH ROW EXECUTE FUNCTION public.prevent_attempt_answer_grade_tampering();

CREATE OR REPLACE FUNCTION public.prevent_exam_attempt_score_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.score := NULL;
      NEW.total_marks := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.score := OLD.score;
      NEW.total_marks := OLD.total_marks;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS prevent_exam_attempt_score_tampering ON public.exam_attempts;
CREATE TRIGGER prevent_exam_attempt_score_tampering
BEFORE INSERT OR UPDATE ON public.exam_attempts
FOR EACH ROW EXECUTE FUNCTION public.prevent_exam_attempt_score_tampering();

-- 6. Revoke anon execute on has_role (only authenticated/service_role need it for RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
