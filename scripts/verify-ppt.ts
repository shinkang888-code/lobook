/**
 * PPT Master 연동 검증
 * 실행: npx tsx scripts/verify-ppt.ts
 */
import { listBooks } from "../src/lib/bookService";
import { buildPptPlan } from "../src/lib/ppt/pptAiService";
import { generatePptxFromPlan, getPptEngineStatus } from "../src/lib/ppt/pptExportService";
import { getLatestPptExport } from "../src/lib/ppt/pptMeta";
import { planFromMarkdown } from "../src/lib/ppt/slideSvgBuilder";

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== PPT Master 연동 검증 ===\n");

  const engine = await getPptEngineStatus();
  if (!engine.available) {
    errors.push(engine.error ?? "engine unavailable");
    console.log("  ⚠ npm run setup:ppt-master && pip install -r requirements-ppt-master.txt");
  } else {
    ok(`PPT 엔진 — ${engine.scriptsPath}`);
  }

  const plan = planFromMarkdown(
    "검증 책",
    "LoBooK",
    "# 1장\n\n- 첫 번째 포인트\n- 두 번째 포인트\n\n# 2장\n\n- 마무리 내용",
    "검증용 발표 자료",
    6,
  );
  if (plan.slides.length < 3) errors.push("slide plan too short");
  else ok(`슬라이드 플랜 — ${plan.slides.length}장`);

  const books = await listBooks();
  const book = books[0];
  if (!book) {
    console.error("❌ 책 없음");
    process.exit(1);
  }

  if (engine.available) {
    const aiPlan = await buildPptPlan({
      prompt: "책 내용 요약 발표",
      bookTitle: book.title,
      sourceMarkdown: "# 테스트\n\n- 항목 A\n- 항목 B",
      maxSlides: 5,
    });
    ok(`AI/로컬 플랜 — ${aiPlan.slides.length}장`);

    const result = await generatePptxFromPlan(book.id, aiPlan, "ppt169");
    if (!result.storagePath) errors.push("no storage path");
    else ok(`PPTX 생성 — ${result.fileName} (${result.slideCount}장)`);

    const meta = await getLatestPptExport(book.id);
    if (!meta?.storagePath) errors.push("ppt meta missing");
    else ok(`PPT 메타 — ${meta.fileName}`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ PPT Master 검증 통과\n");
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
