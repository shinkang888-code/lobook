/** lofice + lawygo documentOcr types — LoBooK 클라이언트 OCR */

export type OcrMethod = "pdf-text" | "tesseract" | "ddddocr" | "pasted";

export type OcrEngine = "auto" | "ddddocr" | "tesseract";

export type DocumentOcrResult = {
  text: string;
  method: OcrMethod;
  pageCount?: number;
  charCount: number;
  warnings?: string[];
};

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/bmp",
  "image/gif",
]);

export const DOCUMENT_OCR_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/tiff,image/bmp,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff";

export function isPdfMime(mime: string, fileName: string): boolean {
  return mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export function isImageMime(mime: string, fileName: string): boolean {
  if (IMAGE_MIME_TYPES.has(mime)) return true;
  return /\.(jpe?g|png|webp|tiff?|bmp|gif)$/i.test(fileName);
}

export function isOcrSupported(mime: string, fileName: string): boolean {
  return isPdfMime(mime, fileName) || isImageMime(mime, fileName);
}

export function needsOcrFallback(extracted: string, pageCount: number): boolean {
  const len = extracted.trim().length;
  if (len < 60) return true;
  if (pageCount > 0 && len / pageCount < 40) return true;
  return false;
}

export const METHOD_LABEL: Record<OcrMethod, string> = {
  "pdf-text": "PDF 텍스트 레이어",
  tesseract: "Tesseract OCR",
  ddddocr: "ddddocr",
  pasted: "직접 입력",
};

export const ENGINE_LABEL: Record<OcrEngine, string> = {
  auto: "자동 (ddddocr → Tesseract)",
  ddddocr: "ddddocr",
  tesseract: "Tesseract",
};
