/**
 * LibreOffice core 모듈 → LoBooK 런타임 엔진 매핑
 * @see https://github.com/shinkang888-code/libreoffice
 * @see vendor/libreoffice/engine-manifest.json
 */

export type LibreOfficeModuleId =
  | "sw"
  | "sc"
  | "sd"
  | "hwpfilter"
  | "filter"
  | "libreofficekit"
  | "framework"
  | "editeng";

export type LibreOfficeDocKind = "writer" | "calc" | "impress" | "draw" | "hwp" | "pdf" | "html";

export type LibreOfficeEngineBinding = {
  moduleId: LibreOfficeModuleId;
  label: string;
  docKind: LibreOfficeDocKind;
  formats: string[];
  /** LoBooK 기존 엔진 ID (lofice catalog) */
  lobookEngine: string;
  lobookPanel: "word" | "hwp" | "pdf" | "html" | "office";
  status: "integrated" | "partial" | "planned";
  description: string;
};

/** LibreOffice sw/filter/hwpfilter 모듈 기반 문서 엔진 라우팅 */
export const LIBREOFFICE_ENGINE_BINDINGS: LibreOfficeEngineBinding[] = [
  {
    moduleId: "sw",
    label: "LibreOffice Writer",
    docKind: "writer",
    formats: ["odt", "docx", "doc", "rtf", "txt"],
    lobookEngine: "eigenpal-docx",
    lobookPanel: "word",
    status: "integrated",
    description: "sw/ Writer — eigenpal DOCX 편집기로 런타임 연동",
  },
  {
    moduleId: "hwpfilter",
    label: "LibreOffice HWP Filter",
    docKind: "hwp",
    formats: ["hwp", "hwpx"],
    lobookEngine: "rhwp",
    lobookPanel: "hwp",
    status: "integrated",
    description: "hwpfilter/ — RHWP WASM 뷰어·HWPX 변환",
  },
  {
    moduleId: "filter",
    label: "LibreOffice PDF Filter",
    docKind: "pdf",
    formats: ["pdf"],
    lobookEngine: "pdfjs",
    lobookPanel: "pdf",
    status: "integrated",
    description: "filter/ — PDF.js 뷰어 + OCR 파이프라인",
  },
  {
    moduleId: "editeng",
    label: "Edit Engine (HTML)",
    docKind: "html",
    formats: ["html", "htm"],
    lobookEngine: "codemirror-html",
    lobookPanel: "html",
    status: "integrated",
    description: "editeng/ — HTML 소스 편집 (CodeMirror)",
  },
  {
    moduleId: "sc",
    label: "LibreOffice Calc",
    docKind: "calc",
    formats: ["ods", "xlsx", "csv"],
    lobookEngine: "spreadsheet",
    lobookPanel: "office",
    status: "planned",
    description: "sc/ — 스프레드시트 (lofice planned)",
  },
  {
    moduleId: "sd",
    label: "LibreOffice Impress",
    docKind: "impress",
    formats: ["odp", "pptx"],
    lobookEngine: "ppt-master",
    lobookPanel: "office",
    status: "partial",
    description: "sd/ — PPT Master AI 스튜디오 연동",
  },
  {
    moduleId: "libreofficekit",
    label: "LibreOfficeKit",
    docKind: "writer",
    formats: ["*"],
    lobookEngine: "libreofficekit",
    lobookPanel: "office",
    status: "planned",
    description: "libreofficekit/ — Collabora/LO Online WOPI 브리지 (P2)",
  },
];

export function resolveBindingByFormat(ext: string): LibreOfficeEngineBinding | undefined {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  return LIBREOFFICE_ENGINE_BINDINGS.find((b) => b.formats.includes(normalized));
}

export function resolveBindingByPanel(
  panel: LibreOfficeEngineBinding["lobookPanel"],
): LibreOfficeEngineBinding | undefined {
  return LIBREOFFICE_ENGINE_BINDINGS.find((b) => b.lobookPanel === panel);
}

/** 레거시 EditorMode → LibreOffice 문서 종류 */
export function legacyModeToDocKind(
  mode: string,
): LibreOfficeDocKind | "writer-source" | "studio" | null {
  switch (mode) {
    case "markdown":
      return "writer-source";
    case "word":
    case "html":
      return "writer";
    case "hwp":
      return "hwp";
    case "pdf":
      return "pdf";
    case "office":
      return "writer";
    case "cowork":
    case "architecture":
      return "studio";
    case "libreoffice":
      return "writer";
    case "writer":
      return "writer-source";
    case "studio":
      return "studio";
    default:
      return null;
  }
}
