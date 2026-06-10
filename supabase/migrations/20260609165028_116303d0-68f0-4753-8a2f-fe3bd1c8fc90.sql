
REVOKE SELECT (correct_answer, explanation) ON public.questions FROM authenticated;
REVOKE SELECT (correct_index, explanation) ON public.lesson_checkpoints FROM authenticated;

GRANT SELECT
  (id, subject_id, topic_id, question_type, difficulty, prompt, options, year, marks, created_by, created_at)
  ON public.questions TO authenticated;

GRANT SELECT
  (id, lesson_id, prompt, options, order_index, created_at)
  ON public.lesson_checkpoints TO authenticated;

GRANT ALL ON public.questions TO service_role;
GRANT ALL ON public.lesson_checkpoints TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                        FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at()                        FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_row_change()                          FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_exam_attempt_score_tampering()    FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_attempt_answer_grade_tampering()  FROM PUBLIC, authenticated, anon;
