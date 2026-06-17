-- Phase 1: page_spec, chapters, pages

alter table public.books
  add column if not exists page_spec jsonb default '{
    "preset_id":"b5","width_mm":176,"height_mm":250,
    "orientation":"portrait",
    "margins":{"top":20,"right":15,"bottom":20,"left":15},
    "facing_pages":false,"columns":1,
    "line_height":1.8,"font_family":"Malgun Gothic","font_size_pt":11
  }'::jsonb;

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null default '1장',
  sort_order int not null default 0,
  content_md text not null default '',
  content_html text not null default '',
  primary_source text not null default 'markdown'
    check (primary_source in ('markdown', 'html', 'word', 'hwp')),
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

alter table public.chapters enable row level security;
alter table public.pages enable row level security;

create policy "chapters read all" on public.chapters for select using (true);
create policy "chapters insert all" on public.chapters for insert with check (true);
create policy "chapters update all" on public.chapters for update using (true);
create policy "chapters delete all" on public.chapters for delete using (true);

create policy "pages read all" on public.pages for select using (true);
create policy "pages insert all" on public.pages for insert with check (true);
create policy "pages update all" on public.pages for update using (true);
create policy "pages delete all" on public.pages for delete using (true);

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

drop trigger if exists pages_updated_at on public.pages;

create or replace function public.set_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_pages_updated_at();
