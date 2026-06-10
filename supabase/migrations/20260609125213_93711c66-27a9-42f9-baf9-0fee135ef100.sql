
-- 1) Audit log table -------------------------------------------------------
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,                         -- auth.uid() at the time of the write
  actor_roles text[],                    -- roles snapshot (defence in depth for later forensics)
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  changed_columns text[],                -- NULL on INSERT/DELETE
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_target_idx ON public.audit_log (target_table, target_id, created_at DESC);
CREATE INDEX audit_log_actor_idx  ON public.audit_log (actor_id, created_at DESC);

-- Grants: staff may read; only service_role may write directly. The SECURITY
-- DEFINER trigger below also writes regardless of the caller's privileges.
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL    ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Staff read access.
CREATE POLICY "Staff view audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Intentionally NO INSERT / UPDATE / DELETE policies: the log is append-only
-- and may only be written by the trigger (SECURITY DEFINER) or service_role.

-- 2) Generic audit trigger ------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed text[];
  roles_snapshot text[];
  before_jsonb jsonb;
  after_jsonb jsonb;
  target uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key ORDER BY key) INTO changed
    FROM jsonb_each(to_jsonb(NEW)) n
    WHERE n.value IS DISTINCT FROM (to_jsonb(OLD) -> n.key);

    -- No-op update: skip the log row entirely.
    IF changed IS NULL OR array_length(changed, 1) = 0 THEN
      RETURN NEW;
    END IF;

    before_jsonb := to_jsonb(OLD);
    after_jsonb  := to_jsonb(NEW);
    target       := NEW.id;
  ELSIF TG_OP = 'INSERT' THEN
    after_jsonb := to_jsonb(NEW);
    target      := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    before_jsonb := to_jsonb(OLD);
    target       := OLD.id;
  END IF;

  SELECT array_agg(role::text)
    INTO roles_snapshot
    FROM public.user_roles
   WHERE user_id = auth.uid();

  INSERT INTO public.audit_log (
    actor_id, actor_roles, action, target_table, target_id,
    changed_columns, before, after
  ) VALUES (
    auth.uid(),
    roles_snapshot,
    TG_OP,
    TG_TABLE_NAME,
    target,
    changed,
    before_jsonb,
    after_jsonb
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_row_change() FROM PUBLIC;

-- 3) Wire triggers on the two attempt tables -------------------------------
DROP TRIGGER IF EXISTS audit_exam_attempts    ON public.exam_attempts;
DROP TRIGGER IF EXISTS audit_attempt_answers  ON public.attempt_answers;

CREATE TRIGGER audit_exam_attempts
  AFTER INSERT OR UPDATE OR DELETE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

CREATE TRIGGER audit_attempt_answers
  AFTER INSERT OR UPDATE OR DELETE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.log_row_change();
