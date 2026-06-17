/**
 * hnc-office-addin-ctrl 스킨 검증
 * 실행: npm run verify:hnc-skin
 */
import fs from "fs";
import path from "path";

const SKIN_DIR = path.join(process.cwd(), "public", "hancom-skin");

const REQUIRED = [
  "hnc-skin.css",
  "hnc-base.css",
  "hnc-button.css",
  "hnc-groupbox.css",
  "hnc-tab.css",
  "hnc-office-addin-ctrl.css",
  "book-studio-hancom.css",
];

function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Hancom Office 스킨 검증 ===\n");

  for (const file of REQUIRED) {
    const p = path.join(SKIN_DIR, file);
    if (!fs.existsSync(p)) errors.push(`missing ${file}`);
    else ok(file);
  }

  const skin = fs.readFileSync(path.join(SKIN_DIR, "hnc-skin.css"), "utf-8");
  if (!skin.includes("--hnc-control-text-color-accent3")) errors.push("skin tokens");
  else ok("Hancom design tokens");

  const bridge = fs.readFileSync(path.join(SKIN_DIR, "book-studio-hancom.css"), "utf-8");
  if (!bridge.includes("hancom-ribbon-panel")) errors.push("bridge css");
  else ok("Book Studio bridge CSS");

  const icons = path.join(SKIN_DIR, "icons");
  if (!fs.existsSync(icons)) errors.push("icons dir");
  else ok("한컴 아이콘 에셋");

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Hancom 스킨 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main();
