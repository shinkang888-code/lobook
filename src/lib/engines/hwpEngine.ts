import { extractHwpChaptersFromHtml } from "@/lib/import/hwpImporter";
import { setLatestHwpImport } from "@/lib/import/importMeta";
import { saveImportFile } from "@/lib/import/storage";
import type { DocumentEngine, ImportOptions, ImportResult } from "./types";

export const hwpEngine: DocumentEngine = {
  format: "hwp",
  label: "HWP/HWPX",
  extensions: [".hwp", ".hwpx"],
  mimeTypes: ["application/x-hwp", "application/hwp+zip", "application/vnd.hancom.hwpx"],
  canView: true,
  canEdit: false,
  editorMode: "hwp",

  async importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult> {
    const kind = opts.fileName.match(/\.hwpx$/i) ? "hwpx" : "hwp";
    const { storagePath } = await saveImportFile(
      new File([buffer], opts.fileName),
      opts.bookId,
      kind,
    );
    await setLatestHwpImport(opts.bookId, storagePath, opts.fileName);

    if (opts.hwpMode === "store") {
      return { imported: 0, storagePath, fileName: opts.fileName };
    }

    const pages = await extractHwpChaptersFromHtml(buffer);
    return {
      imported: pages.length,
      storagePath,
      fileName: opts.fileName,
      chapters: pages.map((p, i) => ({
        title: p.title,
        content_md: "",
        content_html: p.content_html,
        primary_source: "hwp",
        sort_order: i,
      })),
    };
  },
};
