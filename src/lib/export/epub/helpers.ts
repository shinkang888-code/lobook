import type { PageSpec } from "@/lib/editor/types";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function pageSpecToCss(spec: PageSpec): string {
  const w = spec.orientation === "portrait" ? spec.width_mm : spec.height_mm;
  const h = spec.orientation === "portrait" ? spec.height_mm : spec.width_mm;
  const { margins } = spec;
  return `
    @page { size: ${w}mm ${h}mm; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
    body {
      font-family: ${spec.font_family};
      font-size: ${spec.font_size_pt}pt;
      line-height: ${spec.line_height};
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 { line-height: 1.3; page-break-after: avoid; }
    img { max-width: 100%; height: auto; }
    pre, code { font-family: ui-monospace, monospace; }
    .page-break { page-break-before: always; }
  `.trim();
}

export interface HeadingEntry {
  level: number;
  title: string;
  href: string;
}

export function extractHeadingsFromHtml(html: string, chapterFile: string): HeadingEntry[] {
  const entries: HeadingEntry[] = [];
  const regex = /<h([1-3])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]);
    const id = match[2] || `heading-${index++}`;
    const title = match[3].replace(/<[^>]+>/g, "").trim();
    if (title) {
      entries.push({ level, title, href: `${chapterFile}#${id}` });
    }
  }
  return entries;
}

export function buildNavHtml(bookTitle: string, tocItems: HeadingEntry[]): string {
  if (tocItems.length === 0) {
    return `<ol><li><a href="chapter1.xhtml">${escapeXml(bookTitle)}</a></li></ol>`;
  }

  let html = "<ol>";
  let lastLevel = 1;
  for (const item of tocItems) {
    while (lastLevel < item.level) {
      html += "<ol>";
      lastLevel++;
    }
    while (lastLevel > item.level) {
      html += "</ol>";
      lastLevel--;
    }
    html += `<li><a href="${escapeXml(item.href)}">${escapeXml(item.title)}</a></li>`;
  }
  while (lastLevel > 1) {
    html += "</ol>";
    lastLevel--;
  }
  html += "</ol>";
  return html;
}

export function wrapChapterHtml(
  title: string,
  bodyHtml: string,
  pageSpecCss: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head>
  <title>${escapeXml(title)}</title>
  <meta charset="utf-8"/>
  <style>${pageSpecCss}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function buildNavDocument(bookTitle: string, navBody: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko">
<head>
  <title>목차</title>
  <meta charset="utf-8"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(bookTitle)}</h1>
    ${navBody}
  </nav>
</body>
</html>`;
}
