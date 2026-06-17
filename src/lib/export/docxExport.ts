import HTMLtoDOCX from "html-to-docx";
import type { BookStructure } from "@/lib/types";
import { pageSpecToCss } from "@/lib/export/epub/helpers";
import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";

export async function buildDocxBuffer(structure: BookStructure): Promise<Buffer> {
  const spec = structure.book.page_spec ?? DEFAULT_PAGE_SPEC;
  const css = pageSpecToCss(spec);

  const body = structure.chapters
    .map(
      (ch) =>
        `<section><h1>${escapeHtml(ch.title)}</h1>${ch.content_html || `<p>${escapeHtml(ch.content_md)}</p>`}</section>`,
    )
    .join("<hr/>");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${body}</body></html>`;

  const blob = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  return Buffer.from(blob as ArrayBuffer);
}

export function buildPrintableHtml(structure: BookStructure): string {
  const spec = structure.book.page_spec ?? DEFAULT_PAGE_SPEC;
  const css = pageSpecToCss(spec);
  const { book, chapters } = structure;

  const body = chapters
    .map(
      (ch) =>
        `<section class="page-break"><h1>${escapeHtml(ch.title)}</h1>${ch.content_html || `<p>${escapeHtml(ch.content_md).replace(/\n/g, "<br/>")}</p>`}</section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(book.title)}</title>
  <style>
    ${css}
    .page-break { page-break-after: always; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <header><h1>${escapeHtml(book.title)}</h1><p>${escapeHtml(book.author)}</p></header>
  ${body}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
