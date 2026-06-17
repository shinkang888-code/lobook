import JSZip from "jszip";
import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";
import type { PageSpec } from "@/lib/editor/types";
import type { Chapter } from "@/lib/types";
import {
  buildNavDocument,
  buildNavHtml,
  escapeXml,
  extractHeadingsFromHtml,
  pageSpecToCss,
  wrapChapterHtml,
} from "./helpers";

export interface EpubChapterInput {
  id: string;
  title: string;
  html: string;
}

export async function buildEpubBufferV2(options: {
  title: string;
  author: string;
  chapters: EpubChapterInput[];
  pageSpec?: PageSpec;
}): Promise<Buffer> {
  const zip = new JSZip();
  const bookId = crypto.randomUUID();
  const modified = new Date().toISOString().slice(0, 19) + "Z";
  const spec = options.pageSpec ?? DEFAULT_PAGE_SPEC;
  const css = pageSpecToCss(spec);

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.folder("META-INF")?.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("EPUB packaging failed");

  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const allHeadings: ReturnType<typeof extractHeadingsFromHtml> = [];

  options.chapters.forEach((ch, index) => {
    const fileName = `chapter${index + 1}.xhtml`;
    const itemId = ch.id || `chapter${index + 1}`;
    oebps.file(fileName, wrapChapterHtml(ch.title, ch.html, css));
    manifestItems.push(
      `<item id="${itemId}" href="${fileName}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${itemId}"/>`);
    allHeadings.push(...extractHeadingsFromHtml(ch.html, fileName));
  });

  const navBody = buildNavHtml(options.title, allHeadings);
  oebps.file("nav.xhtml", buildNavDocument(options.title, navBody));

  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${escapeXml(options.title)}</dc:title>
    <dc:creator>${escapeXml(options.author)}</dc:creator>
    <dc:language>ko</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function chaptersToEpubInput(chapters: Chapter[]): EpubChapterInput[] {
  return chapters.map((ch, i) => ({
    id: ch.id.replace(/[^a-zA-Z0-9_-]/g, "") || `ch${i + 1}`,
    title: ch.title,
    html: ch.content_html || `<p>${ch.content_md.replace(/\n/g, "<br/>")}</p>`,
  }));
}

/** @deprecated v1 단일 챕터 — v2 사용 권장 */
export async function buildEpubBuffer(options: {
  title: string;
  author: string;
  html: string;
  pageSpec?: PageSpec;
}): Promise<Buffer> {
  return buildEpubBufferV2({
    title: options.title,
    author: options.author,
    pageSpec: options.pageSpec,
    chapters: [{ id: "chapter1", title: options.title, html: options.html }],
  });
}
