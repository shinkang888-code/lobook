-- Book Studio: 전자책 테이블
create extension if not exists "pgcrypto";

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null default '제목 없음',
  author text not null default '익명',
  content_md text not null default '',
  content_html text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_updated_at_idx on public.books (updated_at desc);
create index if not exists books_status_idx on public.books (status);

alter table public.books enable row level security;

-- MVP: service role API 경로 사용. 추후 auth.users 연동 시 정책 교체.
create policy "books read all"
  on public.books for select
  using (true);

create policy "books insert all"
  on public.books for insert
  with check (true);

create policy "books update all"
  on public.books for update
  using (true);

create policy "books delete all"
  on public.books for delete
  using (true);

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
