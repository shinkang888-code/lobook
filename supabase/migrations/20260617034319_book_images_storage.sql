-- Book Studio: 이미지 Storage 버킷
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-images',
  'book-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "book images public read"
  on storage.objects for select
  using (bucket_id = 'book-images');

create policy "book images upload"
  on storage.objects for insert
  with check (bucket_id = 'book-images');

create policy "book images update"
  on storage.objects for update
  using (bucket_id = 'book-images');

create policy "book images delete"
  on storage.objects for delete
  using (bucket_id = 'book-images');
