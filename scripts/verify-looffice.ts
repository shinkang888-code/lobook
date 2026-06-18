/**
 * LoOffice (Loffice + lawygo) 통합 검증
 * 실행: npm run verify:looffice
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REQUIRED = [
  "src/lib/documentOcr/extractDocumentTextClient.ts",
  "src/lib/documentOcr/tesseractOcr.ts",
  "src/lib/pdf/pdf-engine.ts",
  "src/lib/looffice/loofficeCatalog.ts",
  "src/lib/lawygo/clientPdfChunks.ts",
  "src/lib/lawygo/lawygoFeatures.ts",
  "src/components/ocr/OcrTextPanel.tsx",
  "src/components/editor/looffice/LoOfficeHub.tsx",
  "scripts/setup-looffice.js",
  "scripts/setup-lawygo.js",
];

function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== LoOffice (Loffice + lawygo) 검증 ===\n");

  for (const rel of REQUIRED) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`missing ${rel}`);
    else ok(rel);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
  if (!pkg.dependencies?.["tesseract.js"]) errors.push("tesseract.js dependency");
  else ok("tesseract.js 설치됨");
  if (!pkg.dependencies?.["pdf-lib"]) errors.push("pdf-lib dependency");
  else ok("pdf-lib 설치됨");

  if (!fs.existsSync(path.join(ROOT, "public/pdf.worker.min.mjs"))) {
    errors.push("pdf.worker.min.mjs — npm run postinstall");
  } else ok("PDF worker");

  const types = fs.readFileSync(path.join(ROOT, "src/lib/editor/types.ts"), "utf-8");
  if (!types.includes('"office"')) errors.push("office editor mode");
  else ok("LoOffice 편집기 모드");

  const installLoffice = path.join(ROOT, ".looffice-install.json");
  const installLawygo = path.join(ROOT, ".lawygo-install.json");
  if (fs.existsSync(installLoffice)) ok("Loffice setup 완료");
  else console.log("  ⚠ npm run setup:looffice 권장");
  if (fs.existsSync(installLawygo)) ok("lawygo setup 완료");
  else console.log("  ⚠ npm run setup:lawygo 권장");

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ LoOffice 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main();
