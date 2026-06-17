export type EditorMode = "markdown" | "html" | "word" | "hwp" | "preview";

export const CORE_EDITOR_MODES: EditorMode[] = ["markdown", "html", "word", "hwp"];

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
