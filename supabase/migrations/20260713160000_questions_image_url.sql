-- Optional diagram/figure for a question (e.g. Maths geometry, Science apparatus).
-- Stored as a public URL in the content-images bucket.
alter table public.questions
  add column if not exists image_url text;
