
REVOKE SELECT (correct_answer, explanation) ON public.questions          FROM anon;
REVOKE SELECT (correct_index, explanation) ON public.lesson_checkpoints FROM anon;
