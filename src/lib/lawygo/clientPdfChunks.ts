/** lawygo pdfChunkOcr 상수 — LoBooK 대용량 PDF 분할 */
export const PDF_UPLOAD_SAFE_BYTES = 3.5 * 1024 * 1024;
export const PDF_OCR_PAGES_PER_CHUNK = 5;

export type PdfUploadChunk = {
  name: string;
  data: Uint8Array;
  pageFrom: number;
  pageTo: number;
};

export async function splitPdfIntoUploadChunks(
  fileBuffer: ArrayBuffer,
  fileName: string,
  maxBytes = PDF_UPLOAD_SAFE_BYTES,
  pagesPerChunk = PDF_OCR_PAGES_PER_CHUNK,
): Promise<PdfUploadChunk[]> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const totalPages = src.getPageCount();
  const baseName = fileName.replace(/\.pdf$/i, "") || "document";
  const chunks: PdfUploadChunk[] = [];

  for (let start = 1; start <= totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk - 1, totalPages);
    const indices: number[] = [];
    for (let p = start; p <= end; p++) indices.push(p - 1);

    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, indices);
    for (const page of copied) dst.addPage(page);
    const bytes = await dst.save();

    if (bytes.byteLength > maxBytes && end > start) {
      for (let p = start; p <= end; p++) {
        const single = await PDFDocument.create();
        const [one] = await single.copyPages(src, [p - 1]);
        single.addPage(one);
        const singleBytes = await single.save();
        chunks.push({
          name: `${baseName}_p${p}.pdf`,
          data: singleBytes,
          pageFrom: p,
          pageTo: p,
        });
      }
      continue;
    }

    chunks.push({
      name: `${baseName}_p${start}-${end}.pdf`,
      data: bytes,
      pageFrom: start,
      pageTo: end,
    });
  }

  return chunks;
}
