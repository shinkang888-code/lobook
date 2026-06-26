import { getNeonSql } from "./neonClient";
import type { Book, CreateBookInput, UpdateBookInput } from "./types";
import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";

function parsePageSpec(raw: unknown): PageSpec | undefined {
  if (raw && typeof raw === "object") return { ...DEFAULT_PAGE_SPEC, ...(raw as PageSpec) };
  return undefined;
}

function mapRow(row: Record<string, unknown>): Book {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    author: String(row.author ?? "익명"),
    content_md: String(row.content_md ?? ""),
    content_html: String(row.content_html ?? ""),
    status: (row.status as Book["status"]) ?? "draft",
    page_spec: parsePageSpec(row.page_spec),
    hwp_import_path: row.hwp_import_path != null ? String(row.hwp_import_path) : null,
    hwp_import_name: row.hwp_import_name != null ? String(row.hwp_import_name) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listBooksNeon(): Promise<Book[]> {
  const sql = getNeonSql();
  const rows = await sql`select * from books order by updated_at desc`;
  return rows.map((row) => mapRow(row as Record<string, unknown>));
}

export async function getBookNeon(id: string): Promise<Book | null> {
  const sql = getNeonSql();
  const rows = await sql`select * from books where id = ${id} limit 1`;
  return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
}

export async function createBookNeon(input: CreateBookInput): Promise<Book> {
  const sql = getNeonSql();
  const rows = await sql`
    insert into books (title, author, content_md, content_html, status)
    values (
      ${input.title.trim() || "제목 없음"},
      ${input.author?.trim() || "익명"},
      ${input.content_md ?? ""},
      ${input.content_html ?? ""},
      ${input.status ?? "draft"}
    )
    returning *
  `;
  return mapRow(rows[0] as Record<string, unknown>);
}

export async function updateBookNeon(id: string, input: UpdateBookInput): Promise<Book | null> {
  const sql = getNeonSql();
  const existing = await getBookNeon(id);
  if (!existing) return null;

  const rows = await sql`
    update books set
      title = ${input.title ?? existing.title},
      author = ${input.author ?? existing.author},
      content_md = ${input.content_md ?? existing.content_md},
      content_html = ${input.content_html ?? existing.content_html},
      status = ${input.status ?? existing.status},
      page_spec = ${JSON.stringify(input.page_spec ?? existing.page_spec ?? DEFAULT_PAGE_SPEC)}::jsonb,
      updated_at = now()
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
}

export async function deleteBookNeon(id: string): Promise<boolean> {
  const sql = getNeonSql();
  await sql`delete from books where id = ${id}`;
  return true;
}

const BOOK_COLUMN_KEYS = new Set([
  "hwp_import_path",
  "hwp_import_name",
  "docx_import_path",
  "docx_import_name",
  "pdf_import_path",
  "pdf_import_name",
  "ppt_export_path",
  "ppt_export_name",
]);

export async function updateBookColumnsNeon(
  bookId: string,
  columns: Record<string, string | null>,
): Promise<void> {
  const sql = getNeonSql();
  const entries = Object.entries(columns).filter(([key]) => BOOK_COLUMN_KEYS.has(key));
  if (entries.length === 0) return;

  const sets = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);
  await (sql as unknown as { query: (q: string, v: unknown[]) => Promise<unknown> }).query(
    `update books set ${sets}, updated_at = now() where id = $${entries.length + 1}`,
    [...values, bookId],
  );
}

export async function getBookImportColumnsNeon(
  bookId: string,
  kind: "hwp" | "docx" | "pdf",
): Promise<{ path: string | null; name: string | null }> {
  const sql = getNeonSql();
  const pathKey = `${kind}_import_path`;
  const nameKey = `${kind}_import_name`;
  const rows = await (sql as unknown as { query: (q: string, v: unknown[]) => Promise<Record<string, unknown>[]> }).query(
    `select ${pathKey} as path, ${nameKey} as name from books where id = $1 limit 1`,
    [bookId],
  );
  const row = rows[0];
  return {
    path: row?.path != null ? String(row.path) : null,
    name: row?.name != null ? String(row.name) : null,
  };
}

export async function getPptExportColumnsNeon(bookId: string) {
  const sql = getNeonSql();
  const rows = await sql`
    select ppt_export_path, ppt_export_name from books where id = ${bookId} limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return {
    path: row?.ppt_export_path != null ? String(row.ppt_export_path) : null,
    name: row?.ppt_export_name != null ? String(row.ppt_export_name) : null,
  };
}

export async function listBookVersionsNeon(bookId: string) {
  const sql = getNeonSql();
  return sql`
    select id, label, created_at
    from book_versions
    where book_id = ${bookId}
    order by created_at desc
    limit 20
  `;
}

export async function createBookVersionNeon(
  bookId: string,
  snapshot: unknown,
  label: string,
) {
  const sql = getNeonSql();
  const rows = await sql`
    insert into book_versions (book_id, snapshot, label)
    values (${bookId}, ${JSON.stringify(snapshot)}::jsonb, ${label})
    returning id, label, created_at
  `;
  return rows[0];
}
