import { getBookStructure, saveBookStructure } from "@/lib/chapterService";
import { resolveImportFormat, type ImportMode } from "@/lib/engines/registry";
import { importEpub } from "@/lib/import/epubImporter";
import type { SaveStructureInput } from "@/lib/types";

export type { ImportMode } from "@/lib/engines/registry";

export async function importDocxToBook(
  bookId: string,
  buffer: ArrayBuffer,
  fileName: string,
  mode: ImportMode = "replace",
) {
  const engine = resolveImportFormat("docx");
  const result = await engine.importToChapters(buffer, { bookId, fileName, mode });
  if (!result.chapters?.length) throw new Error("DOCX에서 내용을 추출하지 못했습니다.");
  return applyImport(bookId, mode, result.chapters);
}

export async function importEpubToBook(
  bookId: string,
  buffer: ArrayBuffer,
  fileName: string,
  mode: ImportMode = "replace",
) {
  const engine = resolveImportFormat("epub");
  const result = await engine.importToChapters(buffer, { bookId, fileName, mode });
  if (!result.chapters?.length) throw new Error("EPUB에서 챕터를 추출하지 못했습니다.");

  const structure = await applyImport(bookId, mode, result.chapters);
  const epub = await importEpub(buffer);
  if (epub.title && mode === "replace") {
    await saveBookStructure(bookId, {
      title: epub.title,
      author: epub.author,
      status: structure?.book.status ?? "draft",
      page_spec: structure?.book.page_spec,
      chapters:
        structure?.chapters.map((c) => ({
          id: c.id,
          title: c.title,
          sort_order: c.sort_order,
          content_md: c.content_md,
          content_html: c.content_html,
          primary_source: c.primary_source,
        })) ?? [],
    });
  }
  return getBookStructure(bookId);
}

export async function importHwpToBook(
  bookId: string,
  buffer: ArrayBuffer,
  fileName: string,
  mode: ImportMode = "replace",
  hwpMode: "store" | "convert" = "convert",
) {
  const engine = resolveImportFormat("hwp");
  const result = await engine.importToChapters(buffer, {
    bookId,
    fileName,
    mode,
    hwpMode,
  });

  if (hwpMode === "store" || !result.chapters?.length) {
    return { storagePath: result.storagePath, fileName: result.fileName, imported: 0 };
  }

  const structure = await applyImport(bookId, mode, result.chapters);
  return { ...result, structure, imported: result.imported };
}

/** @deprecated use importHwpToBook */
export async function storeHwpImport(bookId: string, buffer: ArrayBuffer, fileName: string) {
  return importHwpToBook(bookId, buffer, fileName, "replace", "store");
}

async function applyImport(
  bookId: string,
  mode: ImportMode,
  incoming: Array<{
    title: string;
    content_md: string;
    content_html: string;
    primary_source: SaveStructureInput["chapters"][0]["primary_source"];
    sort_order?: number;
  }>,
) {
  const existing = await getBookStructure(bookId);
  if (!existing) throw new Error("책을 찾을 수 없습니다.");

  let chapters: SaveStructureInput["chapters"];

  if (mode === "append") {
    const base = existing.chapters.length;
    chapters = [
      ...existing.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        sort_order: c.sort_order,
        content_md: c.content_md,
        content_html: c.content_html,
        primary_source: c.primary_source,
      })),
      ...incoming.map((ch, i) => ({
        title: ch.title,
        sort_order: base + i,
        content_md: ch.content_md,
        content_html: ch.content_html,
        primary_source: ch.primary_source,
      })),
    ];
  } else {
    chapters = incoming.map((ch, i) => ({
      title: ch.title,
      sort_order: ch.sort_order ?? i,
      content_md: ch.content_md,
      content_html: ch.content_html,
      primary_source: ch.primary_source,
    }));
  }

  return saveBookStructure(bookId, {
    title: existing.book.title,
    author: existing.book.author,
    status: existing.book.status,
    page_spec: existing.book.page_spec,
    chapters,
  });
}
