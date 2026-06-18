import { promises as fs } from "fs";
import path from "path";
import type { Book, CreateBookInput, UpdateBookInput } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "books.json");

async function ensureStore(): Promise<Book[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Book[];
  } catch {
    const seed: Book[] = [
      {
        id: crypto.randomUUID(),
        title: "시작 가이드",
        author: "LoBooK",
        content_md: "# 전자책에 오신 것을 환영합니다\n\n왼쪽에서 **마크다운** 또는 **WYSIWYG**로 글을 쓰고, EPUB으로 내보낼 수 있습니다.",
        content_html:
          "<h1>전자책에 오신 것을 환영합니다</h1><p>왼쪽에서 <strong>마크다운</strong> 또는 <strong>WYSIWYG</strong>로 글을 쓰고, EPUB으로 내보낼 수 있습니다.</p>",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
}

async function saveBooks(books: Book[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf-8");
}

export async function listLocalBooks(): Promise<Book[]> {
  const books = await ensureStore();
  return books.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function getLocalBook(id: string): Promise<Book | null> {
  const books = await ensureStore();
  return books.find((book) => book.id === id) ?? null;
}

export async function createLocalBook(input: CreateBookInput): Promise<Book> {
  const books = await ensureStore();
  const now = new Date().toISOString();
  const book: Book = {
    id: crypto.randomUUID(),
    title: input.title.trim() || "제목 없음",
    author: input.author?.trim() || "익명",
    content_md: input.content_md ?? "",
    content_html: input.content_html ?? "",
    status: input.status ?? "draft",
    created_at: now,
    updated_at: now,
  };
  books.unshift(book);
  await saveBooks(books);
  return book;
}

export async function updateLocalBook(
  id: string,
  input: UpdateBookInput,
): Promise<Book | null> {
  const books = await ensureStore();
  const index = books.findIndex((book) => book.id === id);
  if (index === -1) return null;

  const updated: Book = {
    ...books[index],
    ...input,
    updated_at: new Date().toISOString(),
  };
  books[index] = updated;
  await saveBooks(books);
  return updated;
}

export async function deleteLocalBook(id: string): Promise<boolean> {
  const books = await ensureStore();
  const next = books.filter((book) => book.id !== id);
  if (next.length === books.length) return false;
  await saveBooks(next);
  return true;
}
