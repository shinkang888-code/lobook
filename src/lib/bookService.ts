import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseClient";
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
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listBooks(): Promise<Book[]> {
  if (!isSupabaseConfigured()) return listLocalBooks();

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getBook(id: string): Promise<Book | null> {
  if (!isSupabaseConfigured()) return getLocalBook(id);

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  if (!isSupabaseConfigured()) return createLocalBook(input);

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
  if (!isSupabaseConfigured()) return updateLocalBook(id, input);

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
  if (!isSupabaseConfigured()) return deleteLocalBook(id);

  const admin = getSupabaseAdmin()!;
  const { error } = await admin.from("books").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
