-- Phase 2: DOCX/PDF import metadata on books
alter table books add column if not exists docx_import_path text;
alter table books add column if not exists docx_import_name text;
alter table books add column if not exists pdf_import_path text;
alter table books add column if not exists pdf_import_name text;
