-- Fix: exam score never saved on submission.
--
-- The prevent_exam_attempt_score_tampering trigger nulls out score/total_marks
-- whenever the writer is not a teacher/admin, checked via has_role(auth.uid(), ...).
-- But the exam-submit API writes with the SERVICE ROLE, where auth.uid() is NULL.
-- has_role(NULL, ...) returns false, so the trigger treated every server-side
-- submission as tampering and wiped the score. Result: all submitted exams had
-- score = NULL, breaking the leaderboard, analytics, and parent/teacher dashboards.
--
-- Allow the write when auth.uid() IS NULL. That only occurs for trusted
-- server-side / service-role calls — the anon and authenticated roles are already
-- restricted: authenticated has UPDATE only on (status, submitted_at) and anon has
-- ALL revoked on this table. So a NULL uid here can only be the service role.

CREATE OR REPLACE FUNCTION public.prevent_exam_attempt_score_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    auth.uid() IS NULL  -- trusted server-side / service-role context
    OR public.has_role(auth.uid(), 'teacher'::app_role)
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
