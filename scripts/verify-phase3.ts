/**
 * Phase 1 Sprint 1 검증 — engine registry, HWP HTML import, DOCX engines
 * 실행: npx tsx scripts/verify-phase3.ts
 */
import JSZip from "jszip";
import { listEngines, resolveImportFormat } from "../src/lib/engines/registry";
import { listBooks } from "../src/lib/bookService";
import { getBookStructure } from "../src/lib/chapterService";
import { importDocxToBook, importHwpToBook } from "../src/lib/import/importService";
import { getLatestHwpImport } from "../src/lib/import/importMeta";
import { importDocx } from "../src/lib/import/docx";

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

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Phase 1 Sprint 1 검증 ===\n");

  const engines = listEngines();
  if (engines.length < 4) errors.push(`engine count ${engines.length} < 4`);
  else ok(`Document engines ${engines.length}개 — ${engines.map((e) => e.format).join(", ")}`);

  const wordEngine = resolveImportFormat("docx");
  if (!wordEngine.canView) errors.push("wordEngine.canView false");
  else ok("wordEngine 등록");

  const books = await listBooks();
  const book = books[0];
  if (!book) {
    console.error("❌ 책 없음");
    process.exit(1);
  }
  ok(`책 ${books.length}권`);

  const docxBuf = await createMinimalDocx("Sprint1 DOCX");
  const parsed = await importDocx(docxBuf);
  if (!parsed.html.includes("Sprint1")) errors.push("mammoth parse fail");
  else ok("mammoth DOCX parse");

  await importDocxToBook(book.id, docxBuf, "sprint1.docx", "replace");
  const afterDocx = await getBookStructure(book.id);
  if (!afterDocx?.chapters[0]?.content_html) errors.push("docx import no html");
  else ok("engine docx import → chapter");

  try {
    const hwpResult = await importHwpToBook(book.id, docxBuf, "fake.hwp", "replace", "store");
    if (!hwpResult.storagePath) errors.push("hwp store no path");
    else ok(`hwp store — ${hwpResult.storagePath}`);

    const meta = await getLatestHwpImport(book.id);
    if (!meta?.storagePath) errors.push("hwp meta missing");
    else ok(`hwp import meta — ${meta.fileName}`);
  } catch (e) {
    errors.push(`hwp store: ${e instanceof Error ? e.message : "fail"}`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Phase 1 Sprint 1 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
