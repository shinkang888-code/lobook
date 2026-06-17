-- HWP import 메타 (Phase 1 Sprint 1)
alter table public.books
  add column if not exists hwp_import_path text,
  add column if not exists hwp_import_name text;
