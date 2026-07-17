-- Performance indexes on the most-filtered columns (Postgres does not auto-index
-- foreign keys). These speed up the dashboard, exams, practice, recommendations
-- and badges queries, especially as data grows.

create index if not exists idx_exam_attempts_user_status on public.exam_attempts(user_id, status);
create index if not exists idx_questions_topic on public.questions(topic_id);
create index if not exists idx_topics_subject on public.topics(subject_id);
