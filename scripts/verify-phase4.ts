/**
 * Phase 2 검증 — PDF engine, DOCX/PDF import meta, 5-tab editor
 * 실행: npx tsx scripts/verify-phase4.ts
 */
import { CORE_EDITOR_MODES } from "../src/lib/editor/types";
import { listEngines, resolveImportFormat } from "../src/lib/engines/registry";
import { listBooks } from "../src/lib/bookService";
import {
  getLatestDocxImport,
  getLatestPdfImport,
  setLatestDocxImport,
  setLatestPdfImport,
} from "../src/lib/import/importMeta";
import { importPdfToBook } from "../src/lib/import/importService";

async function createMinimalPdf(): Promise<ArrayBuffer> {
  const header = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";
  const pages = "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n";
  const page =
    "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj\n";
  const content = "4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Phase2 PDF) Tj ET\nendstream\nendobj\n";
  const xref = "xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \n";
  const trailer = "trailer<</Size 5/Root 1 0 R>>\nstartxref\n300\n%%EOF";
  const body = header + pages + page + content + xref + trailer;
  return new TextEncoder().encode(body).buffer;
}

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Phase 2 검증 ===\n");

  if (CORE_EDITOR_MODES.length !== 5) {
    errors.push(`CORE_EDITOR_MODES ${CORE_EDITOR_MODES.length} !== 5`);
  } else if (!CORE_EDITOR_MODES.includes("pdf")) {
    errors.push("CORE_EDITOR_MODES missing pdf");
  } else {
    ok(`Editor tabs — ${CORE_EDITOR_MODES.join(", ")}`);
  }

  const engines = listEngines();
  if (engines.length < 5) errors.push(`engine count ${engines.length} < 5`);
  else ok(`Document engines ${engines.length}개 — ${engines.map((e) => e.format).join(", ")}`);

  const pdfEngine = resolveImportFormat("pdf");
  if (!pdfEngine.canView) errors.push("pdfEngine.canView false");
  if (pdfEngine.editorMode !== "pdf") errors.push("pdfEngine.editorMode !== pdf");
  else ok("pdfEngine 등록");

  const wordEngine = resolveImportFormat("docx");
  if (!wordEngine.canView) errors.push("wordEngine.canView false");
  else ok("wordEngine (docx meta) 등록");

  const books = await listBooks();
  const book = books[0];
  if (!book) {
    console.error("❌ 책 없음");
    process.exit(1);
  }
  ok(`책 ${books.length}권`);

  const pdfBuf = await createMinimalPdf();
  const pdfResult = await importPdfToBook(book.id, pdfBuf, "verify-phase2.pdf");
  if (!pdfResult.storagePath) errors.push("pdf import no storagePath");
  else ok(`PDF import — ${pdfResult.storagePath}`);

  const pdfMeta = await getLatestPdfImport(book.id);
  if (!pdfMeta?.storagePath) errors.push("pdf meta missing");
  else ok(`PDF meta — ${pdfMeta.fileName}`);

  await setLatestDocxImport(book.id, "imports/test/verify.docx", "verify.docx");
  const docxMeta = await getLatestDocxImport(book.id);
  if (!docxMeta?.storagePath) errors.push("docx meta round-trip fail");
  else ok(`DOCX meta — ${docxMeta.fileName}`);

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Phase 2 검증 통과\n");
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
