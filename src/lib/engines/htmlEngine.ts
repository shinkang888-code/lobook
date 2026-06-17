import { importEpub } from "@/lib/import/epubImporter";
import { saveImportFile } from "@/lib/import/storage";
import type { DocumentEngine, ImportOptions, ImportResult } from "./types";

export const htmlEngine: DocumentEngine = {
  format: "epub",
  label: "EPUB",
  extensions: [".epub"],
  mimeTypes: ["application/epub+zip"],
  canView: true,
  canEdit: true,
  editorMode: "html",

  async importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult> {
    await saveImportFile(new File([buffer], opts.fileName), opts.bookId, "epub");
    const epub = await importEpub(buffer);
    return {
      imported: epub.chapters.length,
      chapters: epub.chapters.map((ch, i) => ({
        title: ch.title,
        content_md: "",
        content_html: ch.html,
        primary_source: "html",
        sort_order: i,
      })),
    };
  },
};
