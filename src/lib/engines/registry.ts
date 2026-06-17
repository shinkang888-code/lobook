import { htmlEngine } from "./htmlEngine";
import { hwpEngine } from "./hwpEngine";
import { markdownEngine } from "./markdownEngine";
import { pdfEngine } from "./pdfEngine";
import { wordEngine } from "./wordEngine";
import type { DocumentEngine, DocumentFormat } from "./types";

export const IMPORT_ENGINES: DocumentEngine[] = [
  markdownEngine,
  wordEngine,
  htmlEngine,
  hwpEngine,
  pdfEngine,
];

const importByKind = {
  docx: wordEngine,
  epub: htmlEngine,
  hwp: hwpEngine,
  pdf: pdfEngine,
} as const;

export function getEngine(format: DocumentFormat): DocumentEngine | undefined {
  return IMPORT_ENGINES.find((e) => e.format === format);
}

export function listEngines(): DocumentEngine[] {
  return [...IMPORT_ENGINES];
}

export function resolveImportFormat(kind: keyof typeof importByKind): DocumentEngine {
  return importByKind[kind];
}

export function detectFormat(fileName: string): DocumentFormat | null {
  const lower = fileName.toLowerCase();
  for (const engine of IMPORT_ENGINES) {
    if (engine.extensions.some((ext) => lower.endsWith(ext))) {
      return engine.format;
    }
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) return "image";
  return null;
}

export function editorModeForFormat(format: DocumentFormat): DocumentEngine["editorMode"] {
  return getEngine(format)?.editorMode;
}

export type { ImportMode, HwpImportMode, ChapterDraft, ImportResult } from "./types";

/** @deprecated use IMPORT_ENGINES */
export const DOCUMENT_ENGINES = IMPORT_ENGINES;
