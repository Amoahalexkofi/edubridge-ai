-- Defense-in-depth: explicit column-level REVOKEs on answer-key columns.
-- These tables currently have no table-level SELECT grant to authenticated/anon,
-- but these REVOKEs document intent and prevent regression if a future
-- migration grants SELECT on the whole table.

REVOKE SELECT (correct_answer, explanation) ON public.questions FROM anon, authenticated;
REVOKE SELECT (correct_index, explanation) ON public.lesson_checkpoints FROM anon, authenticated;

-- Tighten has_role(): remove broad PUBLIC execute; grant only to roles that need it.
-- The function is SECURITY DEFINER by necessity (reads user_roles which RLS hides),
-- so we cannot switch to INVOKER, but we can narrow EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;