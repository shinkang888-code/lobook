/**
 * PPT Master + AI 프레젠테이션 스튜디오 검증
 * 실행: npm run verify:ppt
 */
import fs from "fs";
import path from "path";
import { listBooks } from "../src/lib/bookService";
import { buildPptPlan } from "../src/lib/ppt/pptAiService";
import { generatePptxFromPlan, getPptEngineStatus } from "../src/lib/ppt/pptExportService";
import { getLatestPptExport } from "../src/lib/ppt/pptMeta";
import { getPptFigmaStatus, listPptThemes, resolvePptTheme } from "../src/lib/ppt/pptFigmaTheme";
import { getPptGeminiStatus } from "../src/lib/ppt/pptGeminiService";
import { buildSlideSvg, planFromMarkdown } from "../src/lib/ppt/slideSvgBuilder";

const ROOT = process.cwd();

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== AI 프레젠테이션 스튜디오 검증 ===\n");

  const required = [
    "src/lib/ppt/pptGeminiService.ts",
    "src/lib/ppt/pptFigmaTheme.ts",
    "src/lib/ppt/pptCliProbe.ts",
    "src/app/api/ppt/figma/themes/route.ts",
    "scripts/setup-ppt-studio.js",
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`missing ${rel}`);
    else ok(rel);
  }

  const engine = await getPptEngineStatus();
  if (!engine.available) {
    errors.push(engine.error ?? "engine unavailable");
    console.log("  ⚠ npm run setup:ppt-master && pip install -r requirements-ppt-master.txt");
  } else {
    ok(`PPT 엔진 — ${engine.scriptsPath}`);
  }

  const gemini = await getPptGeminiStatus();
  if (gemini.apiEnabled) ok(`Gemini API — ${gemini.model}`);
  else if (gemini.cliAvailable) ok(`Gemini CLI — ${gemini.cliVersion}`);
  else console.log("  ⚠ GEMINI_API_KEY 또는 npm run setup:ppt-studio 권장");

  const figma = await getPptFigmaStatus();
  if (figma.cliAvailable) ok(`Figma CLI — ${figma.cliVersion}`);
  else if (figma.apiEnabled) ok("Figma API — 연결됨");
  else console.log("  ⚠ Figma CLI(@figma/code-connect) 기본 테마 사용");

  const themes = await listPptThemes();
  if (themes.length < 2) errors.push("theme count too low");
  else ok(`Figma 테마 — ${themes.length}개`);

  const theme = await resolvePptTheme("lobook");
  const plan = planFromMarkdown(
    "검증 책",
    "LoBooK",
    "# 1장\n\n- 첫 번째 포인트\n- 두 번째 포인트\n\n# 2장\n\n- 마무리 내용",
    "검증용 발표 자료",
    6,
  );
  if (plan.slides.length < 3) errors.push("slide plan too short");
  else ok(`슬라이드 플랜 — ${plan.slides.length}장`);

  const svg = buildSlideSvg(plan.slides[0], 0, plan.slides.length, "0 0 1280 720", theme);
  if (!svg.includes(theme.gradientStart)) errors.push("theme not applied to SVG");
  else ok("테마 SVG 렌더링");

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
      provider: "local",
    });
    ok(`AI/로컬 플랜 — ${aiPlan.slides.length}장`);

    const result = await generatePptxFromPlan(book.id, aiPlan, "ppt169", "figma-light");
    if (!result.storagePath) errors.push("no storage path");
    else ok(`PPTX 생성 — ${result.fileName} (${result.slideCount}장)`);

    const meta = await getLatestPptExport(book.id);
    if (!meta?.storagePath) errors.push("ppt meta missing");
    else ok(`PPT 메타 — ${meta.fileName}`);
  }

  if (fs.existsSync(path.join(ROOT, ".ppt-studio-install.json"))) {
    ok("ppt-studio setup 완료");
  } else {
    console.log("  ⚠ npm run setup:ppt-studio 권장");
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ AI 프레젠테이션 스튜디오 검증 통과\n");
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
