import type { PrimarySource, SaveStructureInput } from "@/lib/types";

export type DocumentFormat =
  | "markdown"
  | "html"
  | "docx"
  | "epub"
  | "hwp"
  | "hwpx"
  | "pdf"
  | "pptx"
  | "image";

export type ImportMode = "replace" | "append";

export type HwpImportMode = "store" | "convert";

export type ChapterDraft = {
  title: string;
  content_md: string;
  content_html: string;
  primary_source: PrimarySource;
  sort_order?: number;
};

export type ImportOptions = {
  bookId: string;
  fileName: string;
  mode: ImportMode;
  hwpMode?: HwpImportMode;
};

export type ImportResult = {
  imported: number;
  storagePath?: string;
  fileName?: string;
  chapters?: ChapterDraft[];
};

export interface DocumentEngine {
  format: DocumentFormat;
  label: string;
  extensions: string[];
  mimeTypes?: string[];
  canView: boolean;
  canEdit: boolean;
  editorMode?: "markdown" | "html" | "word" | "hwp";
  importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult>;
}

export type ImportChapterInput = SaveStructureInput["chapters"][0];
