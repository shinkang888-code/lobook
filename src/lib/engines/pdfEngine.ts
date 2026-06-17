import { saveImportFile } from "@/lib/import/storage";
import { setLatestPdfImport } from "@/lib/import/importMeta";
import type { DocumentEngine, ImportOptions, ImportResult } from "./types";

export const pdfEngine: DocumentEngine = {
  format: "pdf",
  label: "PDF",
  extensions: [".pdf"],
  mimeTypes: ["application/pdf"],
  canView: true,
  canEdit: false,
  editorMode: "pdf",

  async importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult> {
    const { storagePath } = await saveImportFile(
      new File([buffer], opts.fileName),
      opts.bookId,
      "pdf",
    );
    await setLatestPdfImport(opts.bookId, storagePath, opts.fileName);
    return {
      imported: 0,
      storagePath,
      fileName: opts.fileName,
    };
  },
};
