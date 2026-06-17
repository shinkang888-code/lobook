-- book-imports Storage 버킷 (Phase 2)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-imports',
  'book-imports',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip',
    'application/octet-stream',
    'application/x-hwp',
    'application/haansofthwp',
    'application/hwp+zip',
    'application/vnd.hancom.hwpx'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "book imports upload" on storage.objects;
drop policy if exists "book imports read" on storage.objects;
drop policy if exists "book imports delete" on storage.objects;

create policy "book imports upload"
  on storage.objects for insert
  with check (bucket_id = 'book-imports');

create policy "book imports read"
  on storage.objects for select
  using (bucket_id = 'book-imports');

create policy "book imports delete"
  on storage.objects for delete
  using (bucket_id = 'book-imports');

-- 버전 스냅샷 (Phase 3)
create table if not exists public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  snapshot jsonb not null,
  label text default '',
  created_at timestamptz not null default now()
);

create index if not exists book_versions_book_id_idx on public.book_versions (book_id, created_at desc);

alter table public.book_versions enable row level security;

create policy "book_versions read all" on public.book_versions for select using (true);
create policy "book_versions insert all" on public.book_versions for insert with check (true);
create policy "book_versions delete all" on public.book_versions for delete using (true);
