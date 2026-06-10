ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade_level text,
  ADD COLUMN IF NOT EXISTS school_type text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_grade_level_check,
  ADD CONSTRAINT profiles_grade_level_check
    CHECK (grade_level IS NULL OR grade_level IN ('JHS1','JHS2','JHS3','SHS1','SHS2','SHS3'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_school_type_check,
  ADD CONSTRAINT profiles_school_type_check
    CHECK (school_type IS NULL OR school_type IN ('public','private','international'));