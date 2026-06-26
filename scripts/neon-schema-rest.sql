-- Remaining LoBooK tables (run after partial apply)
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
