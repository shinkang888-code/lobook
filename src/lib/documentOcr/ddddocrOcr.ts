import { getPdfJs } from "@/lib/pdf/pdf-engine";
import { ddddocrClassifyBlob } from "./ddddocr-api";

export async function ocrImageBlob(blob: Blob): Promise<string> {
  return ddddocrClassifyBlob(blob);
}

export async function ocrPdfBuffer(
  buffer: ArrayBuffer,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const total = Math.min(pdf.numPages, 30);
  const parts: string[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    page.cleanup();
    if (!blob) continue;

    const text = await ocrImageBlob(blob);
    if (text) parts.push(text);
  }

  pdf.destroy();
  return parts.join("\n\n");
}
