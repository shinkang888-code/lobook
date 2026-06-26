-- LoBooK schema for Neon Postgres (Supabase storage migrations excluded)
create extension if not exists "pgcrypto";

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null default '제목 없음',
  author text not null default '익명',
  content_md text not null default '',
  content_html text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  page_spec jsonb default '{
    "preset_id":"b5","width_mm":176,"height_mm":250,
    "orientation":"portrait",
    "margins":{"top":20,"right":15,"bottom":20,"left":15},
    "facing_pages":false,"columns":1,
    "line_height":1.8,"font_family":"Malgun Gothic","font_size_pt":11
  }'::jsonb,
  hwp_import_path text,
  hwp_import_name text,
  docx_import_path text,
  docx_import_name text,
  pdf_import_path text,
  pdf_import_name text,
  ppt_export_path text,
  ppt_export_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_updated_at_idx on public.books (updated_at desc);
create index if not exists books_status_idx on public.books (status);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null default '1장',
  sort_order int not null default 0,
  content_md text not null default '',
  content_html text not null default '',
  primary_source text not null default 'markdown',
  page_spec_override jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapters_book_id_idx on public.chapters (book_id, sort_order);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  page_number int not null,
  title text,
  content_html text not null default '',
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, page_number)
);

create index if not exists pages_chapter_id_idx on public.pages (chapter_id, page_number);

create table if not exists public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  snapshot jsonb not null,
  label text default '',
  created_at timestamptz not null default now()
);

create index if not exists book_versions_book_id_idx on public.book_versions (book_id, created_at desc);

create or replace function public.set_books_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at
  before update on public.books
  for each row execute function public.set_books_updated_at();

create or replace function public.set_chapters_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists chapters_updated_at on public.chapters;
create trigger chapters_updated_at
  before update on public.chapters
  for each row execute function public.set_chapters_updated_at();

create or replace function public.set_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_pages_updated_at();
