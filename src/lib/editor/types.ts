export type EditorMode =
  | "libreoffice"
  | "writer"
  | "studio"
  | "preview"
  /** @deprecated use writer */
  | "markdown"
  /** @deprecated use libreoffice */
  | "html"
  | "word"
  | "hwp"
  | "pdf"
  | "cowork"
  | "architecture"
  | "office";

/** LibreOffice 중심 3탭 구조 */
export const CORE_EDITOR_MODES: EditorMode[] = ["libreoffice", "writer", "studio"];

export type PrimaryEditorMode = "libreoffice" | "writer" | "studio" | "preview";

export function normalizeEditorMode(mode: EditorMode): PrimaryEditorMode {
  switch (mode) {
    case "markdown":
    case "writer":
      return "writer";
    case "html":
    case "word":
    case "hwp":
    case "pdf":
    case "office":
    case "libreoffice":
      return "libreoffice";
    case "cowork":
    case "architecture":
    case "studio":
      return "studio";
    case "preview":
      return "preview";
    default:
      return "libreoffice";
  }
}

export const EDITOR_MODE_LABELS: Record<PrimaryEditorMode, string> = {
  libreoffice: "LibreOffice",
  writer: "Writer (원고)",
  studio: "LoBooK Studio",
  preview: "미리보기",
};

export type PagePresetId =
  | "a4"
  | "a5"
  | "b5"
  | "us_letter"
  | "us_trade_6x9"
  | "novel_kr"
  | "custom";

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSpec {
  preset_id: PagePresetId;
  width_mm: number;
  height_mm: number;
  orientation: "portrait" | "landscape";
  margins: PageMargins;
  facing_pages: boolean;
  font_family: string;
  font_size_pt: number;
  line_height: number;
}

export interface TocNode {
  id: string;
  title: string;
  level: number;
  pageIndex: number;
  children: TocNode[];
}

export interface PageSlice {
  id: string;
  pageNumber: number;
  title?: string;
  content_md: string;
  content_html: string;
}

export type RibbonTab = "file" | "edit" | "view" | "insert" | "format" | "page";

export interface EditorToolbarActions {
  bold?: () => void;
  italic?: () => void;
  underline?: () => void;
  alignLeft?: () => void;
  alignCenter?: () => void;
  alignRight?: () => void;
  undo?: () => void;
  redo?: () => void;
  copy?: () => void;
  cut?: () => void;
  paste?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  zoomFit?: () => void;
  zoomReset?: () => void;
  prevPage?: () => void;
  nextPage?: () => void;
}
