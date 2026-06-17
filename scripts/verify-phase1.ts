/**
 * Phase 1 기능 검증 스크립트 (Node.js 직접 실행)
 * 실행: npx tsx scripts/verify-phase1.ts
 */
import { getBookStructure, saveBookStructure, addChapter } from "../src/lib/chapterService";
import { listBooks } from "../src/lib/bookService";
import { buildEpubBufferV2, chaptersToEpubInput } from "../src/lib/export/epub/buildEpub";
import { DEFAULT_PAGE_SPEC } from "../src/lib/editor/pageSpec";

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Phase 1 기능 검증 ===\n");

  // 1. 책 목록
  const books = await listBooks();
  if (books.length === 0) errors.push("책 목록이 비어 있음");
  else ok(`책 ${books.length}권 조회`);
  const book = books[0];

  // 2. 구조 조회 (자동 마이그레이션)
  const structure = await getBookStructure(book.id);
  if (!structure) {
    errors.push("getBookStructure null");
  } else {
    ok(`구조 조회 — 챕터 ${structure.chapters.length}개`);
    if (structure.chapters.length === 0) errors.push("기본 챕터 없음");
  }

  // 3. 저장
  if (structure) {
    const ch = structure.chapters[0];
    const saved = await saveBookStructure(book.id, {
      title: book.title,
      author: book.author,
      status: book.status,
      page_spec: DEFAULT_PAGE_SPEC,
      chapters: [
        {
          id: ch.id,
          title: ch.title,
          sort_order: 0,
          content_md: "# Phase 1 검증\n\n테스트 본문입니다.\n\n---\n\n## 2페이지",
          content_html: "<h1>Phase 1 검증</h1><p>테스트 본문입니다.</p>",
          primary_source: "markdown",
        },
      ],
    });
    if (!saved) errors.push("saveBookStructure failed");
    else ok("구조 저장 성공");
  }

  // 4. 챕터 추가
  const newCh = await addChapter(book.id, "2장 검증");
  if (!newCh) errors.push("addChapter failed");
  else ok(`챕터 추가 — ${newCh.title}`);

  const structure2 = await getBookStructure(book.id);
  if (structure2 && structure2.chapters.length >= 2) {
    ok(`챕터 ${structure2.chapters.length}개 확인`);
  } else {
    errors.push(`챕터 수 부족: ${structure2?.chapters.length}`);
  }

  // 5. EPUB v2 export
  if (structure2) {
    const buffer = await buildEpubBufferV2({
      title: structure2.book.title,
      author: structure2.book.author,
      chapters: chaptersToEpubInput(structure2.chapters),
      pageSpec: DEFAULT_PAGE_SPEC,
    });
    if (buffer.length < 500) errors.push(`EPUB too small: ${buffer.length}`);
    else ok(`EPUB v2 생성 — ${buffer.length} bytes, ${structure2.chapters.length}챕터`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Phase 1 검증 통과\n");
    process.exit(0);
  } else {
    console.log("❌ 실패:");
    errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
