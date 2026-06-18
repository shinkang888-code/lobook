/**
 * HWPX 추출 검증
 * 실행: npm run verify:hwpx
 */
import JSZip from "jszip";
import { listBooks } from "../src/lib/bookService";
import { importHwpToBook } from "../src/lib/import/importService";
import { extractParagraphsFromSectionXml, extractHwpx } from "../src/lib/hwpx/hwpxExtractor";
import { hwpxToChapters } from "../src/lib/hwpx/hwpxToChapters";
import { previewHwpx } from "../src/lib/hwpx/hwpxService";

async function createSampleHwpx(text: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "Contents/section0.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p><hp:run><hp:t>${text}</hp:t></hp:run></hp:p>
  <hp:p><hp:run><hp:t>두 번째 문단</hp:t></hp:run></hp:p>
</hs:sec>`,
  );
  zip.file("mimetype", "application/hwp+zip");
  return zip.generateAsync({ type: "arraybuffer" });
}

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== HWPX 추출 검증 ===\n");

  const xml = `<hp:p><hp:t>한글 HWPX</hp:t></hp:p>`;
  const paras = extractParagraphsFromSectionXml(xml);
  if (!paras.includes("한글 HWPX")) errors.push("paragraph extract");
  else ok("hp:p 문단 추출");

  const buf = await createSampleHwpx("LoBooK HWPX 테스트");
  const extracted = await extractHwpx(buf);
  if (extracted.sections.length < 1) errors.push("no sections");
  else ok(`섹션 ${extracted.sections.length}개 추출`);

  const chapters = hwpxToChapters(extracted);
  if (!chapters[0]?.content_html.includes("LoBooK")) errors.push("chapter html");
  else ok("HTML 챕터 변환");

  const preview = await previewHwpx(buf);
  if (preview.charCount < 5) errors.push("preview empty");
  else ok(`미리보기 ${preview.charCount}자, 키워드 ${preview.keywords.length}개`);

  const books = await listBooks();
  const book = books[0];
  if (!book) {
    errors.push("책 없음");
  } else {
    const result = await importHwpToBook(book.id, buf, "verify.hwpx", "replace", "convert");
    if (!result.imported || result.imported < 1) errors.push("import hwpx");
    else ok(`책 import — ${result.imported}섹션`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ HWPX 검증 통과\n");
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
