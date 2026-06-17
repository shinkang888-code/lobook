/**
 * M365 Word 편집기 검증
 * 실행: npm run verify:m365-word
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
  "src/lib/word/m365WordCatalog.ts",
  "src/lib/word/wordDocumentUtils.ts",
  "src/components/editor/word/WordM365Ribbon.tsx",
  "src/components/editor/word/WordM365SidePanel.tsx",
  "src/components/editor/word/word-m365.css",
  "src/components/editor/word/WordEditorPanel.tsx",
  "src/app/api/word/catalog/route.ts",
  "scripts/setup-m365-word-docs.js",
];

function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== M365 Word 편집기 검증 ===\n");

  for (const rel of REQUIRED_FILES) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`missing ${rel}`);
    else ok(rel);
  }

  const catalog = fs.readFileSync(path.join(ROOT, "src/lib/word/m365WordCatalog.ts"), "utf-8");
  if (!catalog.includes("WORD_RIBBON_TABS")) errors.push("ribbon tabs");
  else ok("리본 탭 정의");

  const panel = fs.readFileSync(path.join(ROOT, "src/components/editor/word/WordEditorPanel.tsx"), "utf-8");
  if (!panel.includes("WordM365Ribbon")) errors.push("WordEditorPanel M365 통합");
  else ok("WordEditorPanel M365 워크스페이스");

  const utils = fs.readFileSync(path.join(ROOT, "src/lib/word/wordDocumentUtils.ts"), "utf-8");
  if (!utils.includes("buildTocHtml")) errors.push("TOC utils");
  else ok("목차·통계 유틸");

  const installPath = path.join(ROOT, ".m365-word-docs-install.json");
  const vendorCatalog = path.join(ROOT, "vendor", "microsoft-365-docs", "word-feature-catalog.json");
  if (fs.existsSync(installPath) || fs.existsSync(vendorCatalog)) {
    ok("microsoft-365-docs 카탈로그 (setup 완료)");
  } else {
    console.log("  ⚠ vendor 카탈로그 없음 — npm run setup:m365-word-docs 권장");
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ M365 Word 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main();
