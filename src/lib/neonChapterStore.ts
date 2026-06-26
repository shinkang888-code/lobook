import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";
import { createDefaultChapter } from "./localStructureStore";
import { getNeonSql } from "./neonClient";
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

async function ensureNeonChapters(book: Book): Promise<{ chapters: Chapter[]; pages: Record<string, Page[]> }> {
  const sql = getNeonSql();
  const chapters = await sql`
    select * from chapters where book_id = ${book.id} order by sort_order asc
  `;

  if (chapters.length === 0) {
    const { chapter, pages } = createDefaultChapter(book);
    const inserted = await sql`
      insert into chapters (
        id, book_id, title, sort_order, content_md, content_html, primary_source
      ) values (
        ${chapter.id}, ${chapter.book_id}, ${chapter.title}, ${chapter.sort_order},
        ${chapter.content_md}, ${chapter.content_html}, ${chapter.primary_source}
      )
      returning *
    `;

    if (pages.length > 0) {
      for (const page of pages) {
        await sql`
          insert into pages (id, chapter_id, page_number, title, content_html)
          values (${page.id}, ${page.chapter_id}, ${page.page_number}, ${page.title}, ${page.content_html})
        `;
      }
    }

    return { chapters: [mapChapter(inserted[0] as Record<string, unknown>)], pages: { [chapter.id]: pages } };
  }

  const mapped = chapters.map((row) => mapChapter(row as Record<string, unknown>));
  const chapterIds = mapped.map((c) => c.id);
  const pageRows = await sql`
    select * from pages where chapter_id = any(${chapterIds}::uuid[]) order by page_number asc
  `;

  const pages: Record<string, Page[]> = {};
  for (const ch of mapped) pages[ch.id] = [];
  for (const row of pageRows) {
    const page = mapPage(row as Record<string, unknown>);
    if (!pages[page.chapter_id]) pages[page.chapter_id] = [];
    pages[page.chapter_id].push(page);
  }

  return { chapters: mapped, pages };
}

export async function getBookStructureNeon(book: Book): Promise<BookStructure> {
  const { chapters, pages } = await ensureNeonChapters(book);
  return { book, chapters, pages };
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

export async function saveBookStructureNeon(
  bookId: string,
  input: SaveStructureInput,
): Promise<BookStructure | null> {
  const sql = getNeonSql();
  const existing = await sql`select id from chapters where book_id = ${bookId}`;
  const existingIds = existing.map((row) => String((row as Record<string, unknown>).id));

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
      await sql`
        update chapters set
          title = ${payload.title},
          sort_order = ${payload.sort_order},
          content_md = ${payload.content_md},
          content_html = ${payload.content_html},
          primary_source = ${payload.primary_source},
          updated_at = now()
        where id = ${chapterId}
      `;
    } else {
      await sql`
        insert into chapters (
          id, book_id, title, sort_order, content_md, content_html, primary_source
        ) values (
          ${payload.id}, ${payload.book_id}, ${payload.title}, ${payload.sort_order},
          ${payload.content_md}, ${payload.content_html}, ${payload.primary_source}
        )
        on conflict (id) do update set
          title = excluded.title,
          sort_order = excluded.sort_order,
          content_md = excluded.content_md,
          content_html = excluded.content_html,
          primary_source = excluded.primary_source,
          updated_at = now()
      `;
    }

    await sql`delete from pages where chapter_id = ${chapterId}`;
    const pageList =
      ch.pages ?? splitPagesFromContent(chapterId, ch.content_md, ch.content_html);
    for (const page of pageList) {
      await sql`
        insert into pages (chapter_id, page_number, title, content_html)
        values (${chapterId}, ${page.page_number}, ${page.title ?? null}, ${page.content_html})
      `;
    }
  }

  const toDelete = existingIds.filter((id) => !input.chapters.some((c) => c.id === id));
  if (toDelete.length > 0) {
    await sql`delete from chapters where id = any(${toDelete}::uuid[])`;
  }

  const bookRows = await sql`select * from books where id = ${bookId} limit 1`;
  if (!bookRows[0]) return null;
  const book = {
    id: String((bookRows[0] as Record<string, unknown>).id),
    title: String((bookRows[0] as Record<string, unknown>).title ?? ""),
    author: String((bookRows[0] as Record<string, unknown>).author ?? "익명"),
    content_md: String((bookRows[0] as Record<string, unknown>).content_md ?? ""),
    content_html: String((bookRows[0] as Record<string, unknown>).content_html ?? ""),
    status: ((bookRows[0] as Record<string, unknown>).status as Book["status"]) ?? "draft",
    page_spec: parsePageSpec((bookRows[0] as Record<string, unknown>).page_spec),
    hwp_import_path:
      (bookRows[0] as Record<string, unknown>).hwp_import_path != null
        ? String((bookRows[0] as Record<string, unknown>).hwp_import_path)
        : null,
    hwp_import_name:
      (bookRows[0] as Record<string, unknown>).hwp_import_name != null
        ? String((bookRows[0] as Record<string, unknown>).hwp_import_name)
        : null,
    created_at: String((bookRows[0] as Record<string, unknown>).created_at),
    updated_at: String((bookRows[0] as Record<string, unknown>).updated_at),
  } satisfies Book;

  return getBookStructureNeon(book);
}
