
-- 1. Remove column-level UPDATE on grade fields from authenticated users.
--    RLS still allows users to UPDATE their own rows, but Postgres column
--    privileges will reject any attempt to write these specific columns.
REVOKE UPDATE (score, total_marks) ON public.exam_attempts FROM authenticated;
REVOKE UPDATE (is_correct, marks_awarded) ON public.attempt_answers FROM authenticated;

-- Staff/service paths use service_role (admin client) or SECURITY DEFINER
-- functions, so they are unaffected.

-- 2. email_resend_attempts: add staff-only SELECT policy.
--    Inserts/updates continue to be performed by the backend service role
--    (which bypasses RLS), so no policy is needed for writes.
DROP POLICY IF EXISTS "Staff can view email resend attempts" ON public.email_resend_attempts;
CREATE POLICY "Staff can view email resend attempts"
ON public.email_resend_attempts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
