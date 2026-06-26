import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";
import { getDataBackend } from "./dbMode";
import {
  createBookNeon,
  deleteBookNeon,
  getBookNeon,
  listBooksNeon,
  updateBookNeon,
} from "./neonBookStore";
import { getSupabaseAdmin } from "./supabaseClient";
import {
  createLocalBook,
  deleteLocalBook,
  getLocalBook,
  listLocalBooks,
  updateLocalBook,
} from "./localBookStore";
import type { Book, CreateBookInput, UpdateBookInput } from "./types";

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

export async function listBooks(): Promise<Book[]> {
  const backend = getDataBackend();
  if (backend === "local") return listLocalBooks();
  if (backend === "neon") return listBooksNeon();

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getBook(id: string): Promise<Book | null> {
  const backend = getDataBackend();
  if (backend === "local") return getLocalBook(id);
  if (backend === "neon") return getBookNeon(id);

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const backend = getDataBackend();
  if (backend === "local") return createLocalBook(input);
  if (backend === "neon") return createBookNeon(input);

  const admin = getSupabaseAdmin()!;
  const payload = {
    title: input.title.trim() || "제목 없음",
    author: input.author?.trim() || "익명",
    content_md: input.content_md ?? "",
    content_html: input.content_html ?? "",
    status: input.status ?? "draft",
  };
  const { data, error } = await admin.from("books").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book | null> {
  const backend = getDataBackend();
  if (backend === "local") return updateLocalBook(id, input);
  if (backend === "neon") return updateBookNeon(id, input);

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin
    .from("books")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function deleteBook(id: string): Promise<boolean> {
  const backend = getDataBackend();
  if (backend === "local") return deleteLocalBook(id);
  if (backend === "neon") return deleteBookNeon(id);

  const admin = getSupabaseAdmin()!;
  const { error } = await admin.from("books").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
