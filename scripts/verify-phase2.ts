/**
 * Phase 2~3 기능 검증 (import/export/versions)
 * 실행: npx tsx scripts/verify-phase2.ts
 */
import JSZip from "jszip";
import { listBooks } from "../src/lib/bookService";
import { getBookStructure, saveBookStructure } from "../src/lib/chapterService";
import { buildDocxBuffer, buildPrintableHtml } from "../src/lib/export/docxExport";
import { importDocx } from "../src/lib/import/docx";
import { importEpub } from "../src/lib/import/epubImporter";
import { importDocxToBook, importEpubToBook } from "../src/lib/import/importService";
import { DEFAULT_PAGE_SPEC } from "../src/lib/editor/pageSpec";

async function createMinimalDocx(text: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>
</w:document>`,
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

async function createMinimalEpub(title: string, body: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:language>ko</dc:language>
    <dc:identifier id="uid">test-epub</dc:identifier>
  </metadata>
  <manifest>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine><itemref idref="ch1"/></spine>
</package>`,
  );
  zip.file(
    "OEBPS/chapter1.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch1</title></head>
<body><h1>1장</h1><p>${body}</p></body></html>`,
  );
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Nav</title></head>
<body><nav epub:type="toc"><ol><li><a href="chapter1.xhtml">1장</a></li></ol></nav></body></html>`,
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Phase 2~3 기능 검증 ===\n");

  const books = await listBooks();
  if (books.length === 0) {
    errors.push("책 목록이 비어 있음");
  } else {
    ok(`책 ${books.length}권 조회`);
  }
  const book = books[0];
  if (!book) {
    console.error("\n❌ 검증 실패 — 책 없음\n");
    process.exit(1);
  }

  const docxBuf = await createMinimalDocx("Phase 2 DOCX 테스트");
  const docxParsed = await importDocx(docxBuf);
  if (!docxParsed.html.includes("Phase 2")) errors.push("mammoth HTML 파싱 실패");
  else ok("DOCX → HTML (mammoth)");

  const epubBuf = await createMinimalEpub("테스트 EPUB", "EPUB 본문");
  const epubParsed = await importEpub(epubBuf);
  if (epubParsed.chapters.length === 0) errors.push("EPUB 챕터 0개");
  else ok(`EPUB → 챕터 ${epubParsed.chapters.length}개`);

  const structureBefore = await getBookStructure(book.id);
  if (!structureBefore) {
    errors.push("getBookStructure null");
  } else {
    await importDocxToBook(book.id, docxBuf, "verify.docx", "replace");
    const afterDocx = await getBookStructure(book.id);
    if (!afterDocx?.chapters[0]?.content_html) errors.push("DOCX import 후 HTML 없음");
    else ok("DOCX import → 챕터 저장");

    await importEpubToBook(book.id, epubBuf, "verify.epub", "replace");
    const afterEpub = await getBookStructure(book.id);
    if (!afterEpub || afterEpub.chapters.length < 1) errors.push("EPUB import 실패");
    else ok(`EPUB import — ${afterEpub.chapters.length}챕터`);
  }

  const structure = await getBookStructure(book.id);
  if (structure) {
    await saveBookStructure(book.id, {
      title: structure.book.title,
      author: structure.book.author,
      status: structure.book.status,
      page_spec: DEFAULT_PAGE_SPEC,
      chapters: structure.chapters.map((c, i) => ({
        id: c.id,
        title: c.title || `챕터 ${i + 1}`,
        sort_order: i,
        content_md: c.content_md || "# 테스트",
        content_html: c.content_html || "<p>테스트</p>",
        primary_source: c.primary_source,
      })),
    });

    const docxOut = await buildDocxBuffer(structure);
    if (docxOut.length < 1000) errors.push(`DOCX export too small: ${docxOut.length}`);
    else ok(`DOCX export — ${docxOut.length} bytes`);

    const printHtml = buildPrintableHtml(structure);
    if (!printHtml.includes("<html")) errors.push("printable HTML invalid");
    else ok(`PDF(인쇄) HTML — ${printHtml.length} chars`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Phase 2~3 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log("");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
