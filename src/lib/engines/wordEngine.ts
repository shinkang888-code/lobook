import { importDocx } from "@/lib/import/docx";
import { saveImportFile } from "@/lib/import/storage";
import type { DocumentEngine, ImportOptions, ImportResult } from "./types";

export const wordEngine: DocumentEngine = {
  format: "docx",
  label: "Word (DOCX)",
  extensions: [".docx"],
  mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  canView: true,
  canEdit: true,
  editorMode: "word",

  async importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult> {
    await saveImportFile(new File([buffer], opts.fileName), opts.bookId, "docx");
    const { html, markdown } = await importDocx(buffer);
    return {
      imported: 1,
      chapters: [
        {
          title: opts.fileName.replace(/\.docx$/i, "") || "Word 원고",
          content_md: markdown,
          content_html: html,
          primary_source: "word",
        },
      ],
    };
  },
};
