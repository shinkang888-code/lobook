/**
 * Loffice 통합 오피스 엔진 카탈로그
 * @see https://github.com/shinkang888-code/lofice
 */

export type LofficeEngineId =
  | "udoc-viewer"
  | "rhwp"
  | "eigenpal-docx"
  | "microscope"
  | "pdfjs"
  | "tesseract-ocr"
  | "ddddocr"
  | "7z-archive"
  | "ppt-master"
  | "spreadsheet"
  | "stirling-pdf";

export type LofficeEngine = {
  id: LofficeEngineId;
  label: string;
  formats: string[];
  description: string;
  lobookMode?: string;
  status: "integrated" | "partial" | "planned";
};

export const LOOFFICE_ENGINES: LofficeEngine[] = [
  {
    id: "rhwp",
    label: "RHWP WASM",
    formats: ["hwp", "hwpx"],
    description: "한글 네이티브 Canvas 뷰어·멀티페이지",
    lobookMode: "hwp",
    status: "integrated",
  },
  {
    id: "eigenpal-docx",
    label: "eigenpal DOCX",
    formats: ["docx", "docm"],
    description: "네이티브 Word 편집·저장",
    lobookMode: "word",
    status: "integrated",
  },
  {
    id: "pdfjs",
    label: "PDF.js",
    formats: ["pdf"],
    description: "PDF 뷰어·텍스트 레이어·OCR 입력",
    lobookMode: "pdf",
    status: "integrated",
  },
  {
    id: "microscope",
    label: "Microscope.js",
    formats: ["docx", "pdf", "pptx", "image"],
    description: "폴백 오피스 렌더러",
    status: "partial",
  },
  {
    id: "tesseract-ocr",
    label: "Tesseract.js",
    formats: ["pdf", "jpg", "png"],
    description: "브라우저 OCR (kor+eng)",
    lobookMode: "office",
    status: "integrated",
  },
  {
    id: "ddddocr",
    label: "ddddocr",
    formats: ["pdf", "image"],
    description: "고품질 OCR 사이드카 (선택)",
    lobookMode: "office",
    status: "partial",
  },
  {
    id: "udoc-viewer",
    label: "UDoc Viewer",
    formats: ["pdf", "docx"],
    description: "WASM 고속 뷰어",
    status: "planned",
  },
  {
    id: "spreadsheet",
    label: "Spreadsheet",
    formats: ["xlsx", "xls", "csv"],
    description: "Excel 편집기",
    status: "planned",
  },
  {
    id: "ppt-master",
    label: "PPT Master",
    formats: ["pptx"],
    description: "AI 프레젠테이션 생성",
    lobookMode: "cowork",
    status: "partial",
  },
  {
    id: "stirling-pdf",
    label: "Stirling-PDF",
    formats: ["pdf"],
    description: "PDF 병합·분할·회전",
    status: "planned",
  },
  {
    id: "7z-archive",
    label: "7z WASM",
    formats: ["zip", "7z", "rar"],
    description: "아카이브 탐색",
    status: "planned",
  },
];

export const LOOFFICE_FORMAT_GROUPS = [
  { app: "word", label: "Word", exts: ["docx", "doc", "rtf", "odt", "html", "md"] },
  { app: "excel", label: "Excel", exts: ["xlsx", "xls", "csv", "ods"] },
  { app: "powerpoint", label: "PowerPoint", exts: ["pptx", "ppt", "odp"] },
  { app: "hwp", label: "한글", exts: ["hwp", "hwpx"] },
  { app: "pdf", label: "PDF", exts: ["pdf"] },
  { app: "image", label: "이미지", exts: ["jpg", "png", "webp", "tiff"] },
] as const;
