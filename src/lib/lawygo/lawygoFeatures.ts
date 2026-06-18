/**
 * lawygo 이식 기능 카탈로그
 * @see https://github.com/shinkang888-code/lawygo
 */

export type LawygoFeature = {
  id: string;
  label: string;
  description: string;
  lobookStatus: "integrated" | "partial" | "catalog";
};

export const LAWYGO_FEATURES: LawygoFeature[] = [
  {
    id: "document-ocr",
    label: "문서 OCR 파이프라인",
    description: "PDF 텍스트 레이어 → Tesseract/ddddocr 폴백",
    lobookStatus: "integrated",
  },
  {
    id: "pdf-chunk",
    label: "대용량 PDF 청크 분할",
    description: "pdf-lib로 Vercel 업로드 한도 우회",
    lobookStatus: "integrated",
  },
  {
    id: "pdf-structured",
    label: "PDF 구조 변환",
    description: "OpenDataLoader → Markdown/HTML (서버 연동)",
    lobookStatus: "catalog",
  },
  {
    id: "ai-two-panel",
    label: "AI 2패널 워크스페이스",
    description: "입력/결과 분할 UI 패턴",
    lobookStatus: "partial",
  },
  {
    id: "doc-summary",
    label: "문서 구조화 요약",
    description: "Gemini 5섹션 요약",
    lobookStatus: "catalog",
  },
  {
    id: "legal-encyclopedia",
    label: "법률백과 RAG",
    description: "법무 도메인 전용 — LoBooK 범위 외",
    lobookStatus: "catalog",
  },
];
