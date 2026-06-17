import { importDocx } from "@/lib/import/docx";
import type { DocumentEngine, ImportOptions, ImportResult } from "./types";

export const markdownEngine: DocumentEngine = {
  format: "markdown",
  label: "Markdown",
  extensions: [".md", ".markdown"],
  canView: true,
  canEdit: true,
  editorMode: "markdown",

  async importToChapters(buffer: ArrayBuffer, opts: ImportOptions): Promise<ImportResult> {
    if (opts.fileName.match(/\.docx$/i)) {
      const { html, markdown } = await importDocx(buffer);
      return {
        imported: 1,
        chapters: [
          {
            title: opts.fileName.replace(/\.docx$/i, "") || "Word 원고",
            content_md: markdown,
            content_html: html,
            primary_source: "markdown",
          },
        ],
      };
    }
    const text = new TextDecoder().decode(buffer);
    return {
      imported: 1,
      chapters: [
        {
          title: opts.fileName.replace(/\.(md|markdown)$/i, "") || "Markdown",
          content_md: text,
          content_html: "",
          primary_source: "markdown",
        },
      ],
    };
  },
};
