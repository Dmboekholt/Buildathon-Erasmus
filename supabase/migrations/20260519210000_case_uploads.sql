-- Case uploads: private storage bucket + source-file columns on cases.
-- Source memoranda are written to storage.objects under bucket 'case-uploads'
-- and a reference to the path/filename is stored on the case row.

insert into storage.buckets (id, name, public)
values ('case-uploads', 'case-uploads', false)
on conflict (id) do nothing;

-- Hackathon-permissive policy mirrors the existing demo_all_* pattern
-- (RLS otherwise blocks the service role token used in dev seed scripts).
drop policy if exists "demo_storage_case_uploads" on storage.objects;
create policy "demo_storage_case_uploads"
  on storage.objects for all
  using (bucket_id = 'case-uploads')
  with check (bucket_id = 'case-uploads');

alter table public.cases
  add column if not exists source_file_path text,
  add column if not exists source_file_name text;
