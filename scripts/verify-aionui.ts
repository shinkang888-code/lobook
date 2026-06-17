/**
 * AionUi 연동 검증
 * 실행: npx tsx scripts/verify-aionui.ts
 */
import { listBooks } from "../src/lib/bookService";
import { getAionUiStatus } from "../src/lib/aionui/aionuiService";
import { buildBookCoworkContext } from "../src/lib/aionui/bookContext";
import { isCoworkAiEnabled } from "../src/lib/aionui/coworkChatService";
import { AION_ASSISTANT_PRESETS } from "../src/lib/aionui/aionuiConstants";

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== AionUi 연동 검증 ===\n");

  if (AION_ASSISTANT_PRESETS.length < 4) errors.push("presets missing");
  else ok(`어시스턴트 프리셋 ${AION_ASSISTANT_PRESETS.length}개`);

  const status = await getAionUiStatus();
  if (!status.installed) {
    console.log(`  ⚠ AionUi 미설치 — npm run setup:aionui`);
    console.log(`    ${status.error ?? ""}`);
  } else {
    ok(`AionUi 설치됨 — ${status.root}`);
    if (status.running) ok(`WebUI 실행 중 — ${status.webUrl}`);
    else console.log("  ○ WebUI 오프라인 (npm run start:aionui)");
  }

  if (isCoworkAiEnabled()) ok("Studio Cowork Chat API 활성");
  else console.log("  ○ Studio Chat — OPENAI_API_KEY 미설정 (로컬 플래너만)");

  const books = await listBooks();
  const book = books[0];
  if (!book) {
    errors.push("책 없음");
  } else {
    const ctx = await buildBookCoworkContext(book.id);
    if (!ctx.markdown) errors.push("context empty");
    else ok(`책 컨텍스트 — ${ctx.chapterCount}챕터, ${ctx.markdown.length}자`);
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ AionUi 연동 검증 통과\n");
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
