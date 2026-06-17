/**
 * MarkItDown 연동 검증
 * 실행: npx tsx scripts/verify-markitdown.ts
 */
import { listBooks } from "../src/lib/bookService";
import { getBookStructure } from "../src/lib/chapterService";
import { applyMarkitdownToBook } from "../src/lib/convert/markitdownApply";
import {
  convertFileToMarkdown,
  getMarkitdownStatus,
} from "../src/lib/convert/markitdownService";
import { isMarkitdownSupported } from "../src/lib/convert/markitdownConstants";

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== MarkItDown 연동 검증 ===\n");

  if (!isMarkitdownSupported("sample.docx")) errors.push("docx extension check failed");
  else ok("지원 확장자 검사");

  const status = await getMarkitdownStatus();
  if (!status.available) {
    errors.push(`변환기 미가용: ${status.error ?? "unknown"}`);
    console.log(`  ⚠ MarkItDown 미설치 — pip install -r requirements-markitdown.txt`);
  } else {
    ok(`변환기 가용 (${status.mode})`);
  }

  if (status.available) {
    const mdSample = "# MarkItDown test\n\nHello **world**.";
    const converted = await convertFileToMarkdown(
      new TextEncoder().encode(mdSample).buffer,
      "verify.md",
    );
    if (!converted.includes("MarkItDown")) errors.push("md self-convert failed");
    else ok(`변환 샘플 — ${converted.length} chars`);

    const books = await listBooks();
    const book = books[0];
    if (!book) {
      errors.push("책 없음");
    } else {
      await applyMarkitdownToBook(book.id, converted, "verify.md", "replace");
      const structure = await getBookStructure(book.id);
      if (!structure?.chapters[0]?.content_md?.includes("MarkItDown")) {
        errors.push("replace apply failed");
      } else {
        ok("책 구조에 마크다운 적용 (replace)");
      }
    }
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ MarkItDown 검증 통과\n");
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
