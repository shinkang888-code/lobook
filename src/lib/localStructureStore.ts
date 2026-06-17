import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import { splitMarkdownToPages } from "@/lib/editor/tocBuilder";
import type { Book, BookStructure, Chapter, Page, SaveStructureInput } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STRUCTURE_FILE = path.join(DATA_DIR, "structures.json");

type StructureStore = Record<
  string,
  {
    chapters: Chapter[];
    pages: Record<string, Page[]>;
  }
>;

async function loadStore(): Promise<StructureStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STRUCTURE_FILE, "utf-8");
    return JSON.parse(raw) as StructureStore;
  } catch {
    return {};
  }
}

async function saveStore(store: StructureStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STRUCTURE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function pagesFromMarkdown(chapterId: string, content_md: string, content_html: string): Page[] {
  const slices = splitMarkdownToPages(content_md);
  const now = new Date().toISOString();
  return slices.map((slice, i) => ({
    id: `${chapterId}-p${slice.pageNumber}`,
    chapter_id: chapterId,
    page_number: slice.pageNumber,
    title: slice.title ?? null,
    content_html: i === 0 && slices.length === 1 ? content_html : slice.content_md.replace(/\n/g, "<br/>"),
    thumbnail_path: null,
    created_at: now,
    updated_at: now,
  }));
}

export function createDefaultChapter(book: Book): { chapter: Chapter; pages: Page[] } {
  const now = new Date().toISOString();
  const chapterId = crypto.randomUUID();
  const chapter: Chapter = {
    id: chapterId,
    book_id: book.id,
    title: book.title || "1장",
    sort_order: 0,
    content_md: book.content_md,
    content_html: book.content_html,
    primary_source: "markdown",
    page_spec_override: null,
    created_at: now,
    updated_at: now,
  };
  const pages = pagesFromMarkdown(chapterId, book.content_md, book.content_html);
  return { chapter, pages };
}

export async function getLocalStructure(book: Book): Promise<{ chapters: Chapter[]; pages: Record<string, Page[]> }> {
  const store = await loadStore();
  const entry = store[book.id];
  if (entry && entry.chapters.length > 0) {
    return entry;
  }
  const { chapter, pages } = createDefaultChapter(book);
  store[book.id] = { chapters: [chapter], pages: { [chapter.id]: pages } };
  await saveStore(store);
  return store[book.id];
}

export async function saveLocalStructure(bookId: string, input: SaveStructureInput): Promise<void> {
  const store = await loadStore();
  const now = new Date().toISOString();
  const chapters: Chapter[] = [];
  const pages: Record<string, Page[]> = {};

  for (const ch of input.chapters) {
    const chapterId = ch.id ?? crypto.randomUUID();
    chapters.push({
      id: chapterId,
      book_id: bookId,
      title: ch.title,
      sort_order: ch.sort_order,
      content_md: ch.content_md,
      content_html: ch.content_html,
      primary_source: ch.primary_source ?? "markdown",
      page_spec_override: null,
      created_at: now,
      updated_at: now,
    });

    if (ch.pages && ch.pages.length > 0) {
      pages[chapterId] = ch.pages.map((p) => ({
        id: `${chapterId}-p${p.page_number}`,
        chapter_id: chapterId,
        page_number: p.page_number,
        title: p.title ?? null,
        content_html: p.content_html,
        thumbnail_path: null,
        created_at: now,
        updated_at: now,
      }));
    } else {
      pages[chapterId] = pagesFromMarkdown(chapterId, ch.content_md, ch.content_html);
    }
  }

  store[bookId] = { chapters, pages };
  await saveStore(store);
}

export function mergeBookWithSpec(book: Book): Book {
  return {
    ...book,
    page_spec: book.page_spec ?? DEFAULT_PAGE_SPEC,
  };
}

export type { BookStructure };
