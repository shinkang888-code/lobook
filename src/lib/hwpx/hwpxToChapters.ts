import type { HwpPageChapter } from "@/lib/import/hwpImporter";
import { escapeHtml, type HwpxExtractResult } from "./hwpxExtractor";

export function hwpxToChapters(result: HwpxExtractResult): HwpPageChapter[] {
  const imageHtml = result.images
    .map(
      (img) =>
        `<figure class="hwpx-image"><img src="data:${img.mime};base64,${img.base64}" alt="" loading="lazy" /></figure>`,
    )
    .join("\n");

  if (result.sections.length === 0) {
    const fallback = result.plainText
      ? `<p>${escapeHtml(result.plainText)}</p>`
      : "<p></p>";
    return [{ title: "HWPX 원고", content_html: fallback, page_index: 0 }];
  }

  return result.sections.map((section, index) => {
    const body = section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
    const sectionNum = section.path.match(/section(\d+)/i)?.[1];
    const title =
      result.sections.length === 1
        ? "HWPX 원고"
        : `섹션 ${sectionNum ?? index + 1}`;
    const html =
      index === 0 && imageHtml ? `${body}\n<section class="hwpx-images">${imageHtml}</section>` : body;

    return {
      title,
      content_html: html || "<p></p>",
      page_index: index,
    };
  });
}

export function hwpxToPreviewHtml(result: HwpxExtractResult): string {
  const chapters = hwpxToChapters(result);
  return chapters.map((c) => `<article><h2>${escapeHtml(c.title)}</h2>${c.content_html}</article>`).join("\n");
}
