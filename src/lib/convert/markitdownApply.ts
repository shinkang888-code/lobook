import { getBookStructure, saveBookStructure } from "@/lib/chapterService";
import type { ImportMode } from "@/lib/engines/registry";
import type { SaveStructureInput } from "@/lib/types";

export type MarkitdownApplyMode = ImportMode | "chapter";

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "변환된 문서";
}

function markdownToSimpleHtml(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  return paragraphs || "<p></p>";
}

export async function applyMarkitdownToBook(
  bookId: string,
  markdown: string,
  fileName: string,
  mode: MarkitdownApplyMode,
  chapterId?: string,
) {
  const existing = await getBookStructure(bookId);
  if (!existing) throw new Error("책을 찾을 수 없습니다.");

  const html = markdownToSimpleHtml(markdown);
  const incoming = [
    {
      title: titleFromFileName(fileName),
      content_md: markdown,
      content_html: html,
      primary_source: "markdown" as const,
    },
  ];

  if (mode === "chapter") {
    if (!chapterId) throw new Error("chapterId가 필요합니다.");
    const target = existing.chapters.find((c) => c.id === chapterId);
    if (!target) throw new Error("챕터를 찾을 수 없습니다.");

    return saveBookStructure(bookId, {
      title: existing.book.title,
      author: existing.book.author,
      status: existing.book.status,
      page_spec: existing.book.page_spec,
      chapters: existing.chapters.map((c) =>
        c.id === chapterId
          ? {
              id: c.id,
              title: c.title || titleFromFileName(fileName),
              sort_order: c.sort_order,
              content_md: markdown,
              content_html: html,
              primary_source: "markdown",
            }
          : {
              id: c.id,
              title: c.title,
              sort_order: c.sort_order,
              content_md: c.content_md,
              content_html: c.content_html,
              primary_source: c.primary_source,
            },
      ),
    });
  }

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
      sort_order: i,
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
