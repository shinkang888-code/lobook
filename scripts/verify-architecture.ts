/**
 * Architecture Center 연동 검증
 * 실행: npm run verify:architecture
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REQUIRED = [
  "src/lib/architecture/architectureCatalog.ts",
  "src/lib/architecture/bookArchitectureAdvisor.ts",
  "src/components/editor/architecture/ArchitectureHub.tsx",
  "src/components/editor/architecture/architecture-hub.css",
  "src/app/api/architecture/catalog/route.ts",
  "src/app/api/books/[id]/architecture/advise/route.ts",
  "scripts/setup-architecture-center.js",
];

function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== Architecture Center 연동 검증 ===\n");

  for (const rel of REQUIRED) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`missing ${rel}`);
    else ok(rel);
  }

  const catalog = fs.readFileSync(path.join(ROOT, "src/lib/architecture/architectureCatalog.ts"), "utf-8");
  if (!catalog.includes("ARCHITECTURE_PATTERNS")) errors.push("pattern catalog");
  else ok("패턴 카탈로그");

  const advisor = fs.readFileSync(path.join(ROOT, "src/lib/architecture/bookArchitectureAdvisor.ts"), "utf-8");
  if (!advisor.includes("adviseBookArchitecture")) errors.push("advisor");
  else ok("책별 아키텍처 진단");

  const types = fs.readFileSync(path.join(ROOT, "src/lib/editor/types.ts"), "utf-8");
  if (!types.includes('"architecture"')) errors.push("editor mode");
  else ok("architecture 편집기 모드");

  const install = path.join(ROOT, ".architecture-center-install.json");
  const vendor = path.join(ROOT, "vendor", "architecture-center", "pattern-catalog.json");
  if (fs.existsSync(install) || fs.existsSync(vendor)) {
    ok("architecture-center 카탈로그 (setup 완료)");
  } else {
    console.log("  ⚠ vendor 카탈로그 없음 — npm run setup:architecture-center 권장");
  }

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ Architecture Center 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main();
