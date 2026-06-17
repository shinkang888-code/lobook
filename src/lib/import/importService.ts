import { getBookStructure, saveBookStructure } from "@/lib/chapterService";
import { importDocx } from "@/lib/import/docx";
import { importEpub } from "@/lib/import/epubImporter";
import { saveImportFile } from "@/lib/import/storage";
import type { SaveStructureInput } from "@/lib/types";

export type ImportMode = "replace" | "append";

export async function importDocxToBook(
  bookId: string,
  buffer: ArrayBuffer,
  fileName: string,
  mode: ImportMode = "replace",
) {
  await saveImportFile(new File([buffer], fileName), bookId, "docx");
  const { html, markdown } = await importDocx(buffer);
  return applyImport(bookId, mode, [
    {
      title: fileName.replace(/\.docx$/i, "") || "Word 원고",
      content_md: markdown,
      content_html: html,
      primary_source: "word" as const,
    },
  ]);
}

export async function importEpubToBook(
  bookId: string,
  buffer: ArrayBuffer,
  fileName: string,
  mode: ImportMode = "replace",
) {
  await saveImportFile(new File([buffer], fileName), bookId, "epub");
  const epub = await importEpub(buffer);
  const chapters = epub.chapters.map((ch, i) => ({
    title: ch.title,
    content_md: "",
    content_html: ch.html,
    primary_source: "html" as const,
    sort_order: i,
  }));

  const structure = await applyImport(bookId, mode, chapters);
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

export async function storeHwpImport(bookId: string, buffer: ArrayBuffer, fileName: string) {
  const { storagePath } = await saveImportFile(new File([buffer], fileName), bookId, "hwp");
  return { storagePath, fileName };
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
