export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(html: string): number {
  return stripHtml(html).length;
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export type DocumentHeading = {
  level: number;
  text: string;
  id: string;
};

export function extractHeadings(html: string): DocumentHeading[] {
  const headings: DocumentHeading[] = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(html)) !== null) {
    const text = stripHtml(match[2]);
    if (!text) continue;
    index += 1;
    headings.push({
      level: Number(match[1]),
      text,
      id: `heading-${index}`,
    });
  }
  return headings;
}

export function buildTocHtml(headings: DocumentHeading[]): string {
  if (headings.length === 0) return "<p><em>제목(Heading)이 없습니다.</em></p>";
  const items = headings
    .map((h) => {
      const indent = (h.level - 1) * 16;
      return `<li style="margin-left:${indent}px"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`;
    })
    .join("");
  return `<nav class="word-toc"><h2>목차</h2><ul>${items}</ul></nav>`;
}

export function insertTableHtml(rows = 3, cols = 3): string {
  const header = `<tr>${Array.from({ length: cols }, (_, i) => `<th>열 ${i + 1}</th>`).join("")}</tr>`;
  const body = Array.from({ length: rows - 1 }, (_, r) =>
    `<tr>${Array.from({ length: cols }, (_, c) => `<td>셀 ${r + 1}-${c + 1}</td>`).join("")}</tr>`,
  ).join("");
  return `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead>${header}</thead><tbody>${body}</tbody></table><p></p>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
