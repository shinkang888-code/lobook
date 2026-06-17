import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";
import { getBook, updateBook } from "./bookService";
import {
  createDefaultChapter,
  getLocalStructure,
  mergeBookWithSpec,
  saveLocalStructure,
} from "./localStructureStore";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseClient";
import type { Book, BookStructure, Chapter, Page, SaveStructureInput } from "./types";

function parsePageSpec(raw: unknown): PageSpec {
  if (raw && typeof raw === "object") {
    return { ...DEFAULT_PAGE_SPEC, ...(raw as PageSpec) };
  }
  return DEFAULT_PAGE_SPEC;
}

function mapChapter(row: Record<string, unknown>): Chapter {
  return {
    id: String(row.id),
    book_id: String(row.book_id),
    title: String(row.title ?? "챕터"),
    sort_order: Number(row.sort_order ?? 0),
    content_md: String(row.content_md ?? ""),
    content_html: String(row.content_html ?? ""),
    primary_source: (row.primary_source as Chapter["primary_source"]) ?? "markdown",
    page_spec_override: row.page_spec_override
      ? parsePageSpec(row.page_spec_override)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapPage(row: Record<string, unknown>): Page {
  return {
    id: String(row.id),
    chapter_id: String(row.chapter_id),
    page_number: Number(row.page_number),
    title: row.title != null ? String(row.title) : null,
    content_html: String(row.content_html ?? ""),
    thumbnail_path: row.thumbnail_path != null ? String(row.thumbnail_path) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapBookRow(row: Record<string, unknown>): Book {
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

async function ensureSupabaseChapters(book: Book): Promise<{ chapters: Chapter[]; pages: Record<string, Page[]> }> {
  const admin = getSupabaseAdmin()!;
  const { data: chapters, error } = await admin
    .from("chapters")
    .select("*")
    .eq("book_id", book.id)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  if (!chapters || chapters.length === 0) {
    const { chapter, pages } = createDefaultChapter(book);
    const { data: inserted, error: insertErr } = await admin
      .from("chapters")
      .insert({
        id: chapter.id,
        book_id: chapter.book_id,
        title: chapter.title,
        sort_order: chapter.sort_order,
        content_md: chapter.content_md,
        content_html: chapter.content_html,
        primary_source: chapter.primary_source,
      })
      .select("*")
      .single();
    if (insertErr) throw new Error(insertErr.message);

    const pageRows = pages.map((p) => ({
      id: p.id,
      chapter_id: p.chapter_id,
      page_number: p.page_number,
      title: p.title,
      content_html: p.content_html,
    }));
    if (pageRows.length > 0) {
      const { error: pageErr } = await admin.from("pages").insert(pageRows);
      if (pageErr) throw new Error(pageErr.message);
    }
    return { chapters: [mapChapter(inserted)], pages: { [chapter.id]: pages } };
  }

  const mapped = chapters.map(mapChapter);
  const chapterIds = mapped.map((c) => c.id);
  const { data: pageRows, error: pageErr } = await admin
    .from("pages")
    .select("*")
    .in("chapter_id", chapterIds)
    .order("page_number", { ascending: true });

  if (pageErr) throw new Error(pageErr.message);

  const pages: Record<string, Page[]> = {};
  for (const ch of mapped) pages[ch.id] = [];
  for (const row of pageRows ?? []) {
    const p = mapPage(row);
    if (!pages[p.chapter_id]) pages[p.chapter_id] = [];
    pages[p.chapter_id].push(p);
  }

  return { chapters: mapped, pages };
}

export async function getBookStructure(bookId: string): Promise<BookStructure | null> {
  const rawBook = await getBook(bookId);
  if (!rawBook) return null;

  const book = mergeBookWithSpec(rawBook);

  if (!isSupabaseConfigured()) {
    const { chapters, pages } = await getLocalStructure(book);
    return { book, chapters, pages };
  }

  try {
    const admin = getSupabaseAdmin()!;
    const { data, error } = await admin.from("books").select("*").eq("id", bookId).maybeSingle();
    if (error) throw new Error(error.message);
    const fullBook = data ? mapBookRow(data) : book;
    const { chapters, pages } = await ensureSupabaseChapters(fullBook);
    return { book: fullBook, chapters, pages };
  } catch {
    const { chapters, pages } = await getLocalStructure(book);
    return { book, chapters, pages };
  }
}

export async function saveBookStructure(bookId: string, input: SaveStructureInput): Promise<BookStructure | null> {
  const firstChapter = input.chapters[0];
  const legacyMd = firstChapter?.content_md ?? "";
  const legacyHtml = firstChapter?.content_html ?? "";

  await updateBook(bookId, {
    title: input.title,
    author: input.author,
    status: input.status,
    content_md: legacyMd,
    content_html: legacyHtml,
    page_spec: input.page_spec,
  });

  if (!isSupabaseConfigured()) {
    await saveLocalStructure(bookId, input);
    return getBookStructure(bookId);
  }

  try {
    const admin = getSupabaseAdmin()!;
    const existing = await admin.from("chapters").select("id").eq("book_id", bookId);
    const existingIds = (existing.data ?? []).map((r) => String(r.id));

    for (const ch of input.chapters) {
      const chapterId = ch.id ?? crypto.randomUUID();
      const payload = {
        id: chapterId,
        book_id: bookId,
        title: ch.title,
        sort_order: ch.sort_order,
        content_md: ch.content_md,
        content_html: ch.content_html,
        primary_source: ch.primary_source ?? "markdown",
      };

      if (ch.id && existingIds.includes(ch.id)) {
        await admin.from("chapters").update(payload).eq("id", ch.id);
      } else {
        await admin.from("chapters").upsert(payload);
      }

      await admin.from("pages").delete().eq("chapter_id", chapterId);
      const pageList =
        ch.pages ??
        splitPagesFromContent(chapterId, ch.content_md, ch.content_html);
      if (pageList.length > 0) {
        await admin.from("pages").insert(
          pageList.map((p) => ({
            chapter_id: chapterId,
            page_number: p.page_number,
            title: p.title,
            content_html: p.content_html,
          })),
        );
      }
    }

    const toDelete = existingIds.filter((id) => !input.chapters.some((c) => c.id === id));
    if (toDelete.length > 0) {
      await admin.from("chapters").delete().in("id", toDelete);
    }
  } catch {
    await saveLocalStructure(bookId, input);
  }

  return getBookStructure(bookId);
}

function splitPagesFromContent(
  chapterId: string,
  content_md: string,
  content_html: string,
): Array<{ page_number: number; title?: string; content_html: string }> {
  const parts = content_md.split(/\n---+\n/);
  if (parts.length <= 1) {
    return [{ page_number: 1, content_html: content_html || content_md.replace(/\n/g, "<br/>") }];
  }
  return parts.map((part, i) => ({
    page_number: i + 1,
    title: part.match(/^#\s+(.+)/m)?.[1],
    content_html: part.trim().replace(/\n/g, "<br/>"),
  }));
}

export async function addChapter(bookId: string, title: string): Promise<Chapter | null> {
  const structure = await getBookStructure(bookId);
  if (!structure) return null;

  const sort_order = structure.chapters.length;
  const newChapter: SaveStructureInput["chapters"][0] = {
    title,
    sort_order,
    content_md: `# ${title}\n\n`,
    content_html: `<h1>${title}</h1><p></p>`,
    primary_source: "markdown",
  };

  await saveBookStructure(bookId, {
    title: structure.book.title,
    author: structure.book.author,
    status: structure.book.status,
    page_spec: structure.book.page_spec,
    chapters: [
      ...structure.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        sort_order: c.sort_order,
        content_md: c.content_md,
        content_html: c.content_html,
        primary_source: c.primary_source,
      })),
      newChapter,
    ],
  });

  const updated = await getBookStructure(bookId);
  return updated?.chapters.find((c) => c.sort_order === sort_order) ?? null;
}
