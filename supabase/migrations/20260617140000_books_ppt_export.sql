-- PPT export metadata on books
alter table books add column if not exists ppt_export_path text;
alter table books add column if not exists ppt_export_name text;
