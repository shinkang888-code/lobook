import { getPdfJs } from "@/lib/pdf/pdf-engine";

export async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  if (typeof window === "undefined") {
    throw new Error("PDF 텍스트 추출은 브라우저에서만 가능합니다.");
  }

  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lineParts: string[] = [];
    let lastY: number | null = null;
    let line = "";

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round((item as { transform?: number[] }).transform?.[5] ?? 0);
      if (lastY !== null && Math.abs(y - lastY) > 4) {
        if (line.trim()) lineParts.push(line.trim());
        line = item.str;
      } else {
        line += (line && !line.endsWith(" ") && !item.str.startsWith(" ") ? " " : "") + item.str;
      }
      lastY = y;
    }
    if (line.trim()) lineParts.push(line.trim());
    pages.push(lineParts.join("\n"));
    page.cleanup();
  }

  const pageCount = pdf.numPages;
  pdf.destroy();
  return { text: normalizeExtractedText(pages.join("\n\n")), pageCount };
}

export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
