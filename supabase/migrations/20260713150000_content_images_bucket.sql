-- Public storage bucket for lesson & question diagrams.
-- Uploads happen server-side with the service role (which bypasses RLS), so we
-- only need the bucket to exist and be publicly readable for display.

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = true;

-- Public read access to objects in this bucket (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public read content-images'
  ) then
    create policy "Public read content-images"
      on storage.objects for select
      using (bucket_id = 'content-images');
  end if;
end $$;
