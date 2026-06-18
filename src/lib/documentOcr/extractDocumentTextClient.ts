import { checkDdddOcrHealth } from "./ddddocr-api";
import { isDdddOcrServerAvailable } from "./ddddocr-config";
import * as ddddocrOcr from "./ddddocrOcr";
import { extractTextFromPdfBuffer } from "./pdfTextExtractClient";
import * as tesseractOcr from "./tesseractOcr";
import type { DocumentOcrResult, OcrEngine } from "./types";
import { isImageMime, isPdfMime, needsOcrFallback } from "./types";

export const MAX_OCR_BYTES = 12 * 1024 * 1024;

async function resolveEngine(engine: OcrEngine): Promise<"ddddocr" | "tesseract"> {
  if (engine === "tesseract") return "tesseract";
  if (engine === "ddddocr") {
    if (!isDdddOcrServerAvailable()) {
      throw new Error("ddddocr 서버 URL이 설정되지 않았습니다. NEXT_PUBLIC_DDDDOCR_URL을 확인하세요.");
    }
    const ok = await checkDdddOcrHealth();
    if (!ok) throw new Error("ddddocr 서버에 연결할 수 없습니다.");
    return "ddddocr";
  }
  if (isDdddOcrServerAvailable() && (await checkDdddOcrHealth())) {
    return "ddddocr";
  }
  return "tesseract";
}

export async function extractDocumentTextClient(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  onProgress?: (message: string, percent?: number) => void,
  engine: OcrEngine = "auto",
): Promise<DocumentOcrResult> {
  if (buffer.byteLength > MAX_OCR_BYTES) {
    throw new Error("파일은 12MB 이하여야 합니다. 대용량 PDF는 LawyGo 청크 분할을 사용하세요.");
  }

  const warnings: string[] = [];
  const resolvedEngine = await resolveEngine(engine);
  const ocrLabel = resolvedEngine === "ddddocr" ? "ddddocr" : "Tesseract";

  if (isPdfMime(mimeType, fileName)) {
    onProgress?.("PDF 텍스트 레이어 추출 중...", 10);
    let text = "";
    let pageCount = 0;

    try {
      const extracted = await extractTextFromPdfBuffer(buffer);
      text = extracted.text;
      pageCount = extracted.pageCount;
    } catch {
      warnings.push("PDF 텍스트 레이어 추출 실패 — OCR로 전환합니다.");
    }

    if (!needsOcrFallback(text, pageCount)) {
      return { text, method: "pdf-text", pageCount, charCount: text.length, warnings };
    }

    warnings.push(`스캔 PDF로 보입니다. ${ocrLabel} OCR을 실행합니다.`);
    onProgress?.(`${ocrLabel} OCR 실행 중...`, 30);

    const ocrFn = resolvedEngine === "ddddocr" ? ddddocrOcr.ocrPdfBuffer : tesseractOcr.ocrPdfBuffer;
    const ocrText = await ocrFn(buffer, (page, total) => {
      onProgress?.(`OCR ${page}/${total} 페이지`, 30 + Math.round((page / total) * 60));
    });

    if (ocrText.trim()) {
      return {
        text: ocrText,
        method: resolvedEngine === "ddddocr" ? "ddddocr" : "tesseract",
        pageCount,
        charCount: ocrText.length,
        warnings,
      };
    }

    if (text.trim()) {
      warnings.push("OCR 결과가 비어 있어 PDF 텍스트 레이어를 사용합니다.");
      return { text, method: "pdf-text", pageCount, charCount: text.length, warnings };
    }

    throw new Error("PDF에서 텍스트를 추출하지 못했습니다.");
  }

  if (isImageMime(mimeType, fileName)) {
    onProgress?.(`${ocrLabel} OCR 실행 중...`, 20);
    const blob = new Blob([buffer], { type: mimeType.startsWith("image/") ? mimeType : "image/jpeg" });
    const text =
      resolvedEngine === "ddddocr"
        ? await ddddocrOcr.ocrImageBlob(blob)
        : await tesseractOcr.ocrImageBlob(blob);

    if (!text.trim()) throw new Error("이미지 OCR 결과가 비어 있습니다.");
    return {
      text,
      method: resolvedEngine === "ddddocr" ? "ddddocr" : "tesseract",
      charCount: text.length,
      warnings,
    };
  }

  throw new Error("PDF 또는 이미지(JPG, PNG, WEBP, TIFF)만 OCR 지원합니다.");
}
