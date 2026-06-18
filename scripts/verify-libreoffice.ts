/**
 * LibreOffice 중심 편집기 검증
 * 실행: npm run verify:libreoffice
 */
import fs from "fs";
import path from "path";
import { LIBREOFFICE_ENGINE_BINDINGS } from "../src/lib/libreoffice/libreOfficeCatalog";
import { getLibreOfficeRuntimeStatus } from "../src/lib/libreoffice/libreOfficeStatus";

const ROOT = process.cwd();

const REQUIRED = [
  "src/lib/libreoffice/libreOfficeCatalog.ts",
  "src/lib/libreoffice/libreOfficeStatus.ts",
  "src/components/editor/libreoffice/LibreOfficeHub.tsx",
  "src/components/editor/libreoffice/LibreOfficeRibbon.tsx",
  "src/components/editor/libreoffice/LibreOfficeSidebar.tsx",
  "src/components/editor/studio/StudioHub.tsx",
  "src/app/api/libreoffice/catalog/route.ts",
  "scripts/setup-libreoffice.js",
];

function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== LibreOffice 중심 편집기 검증 ===\n");

  for (const rel of REQUIRED) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`missing ${rel}`);
    else ok(rel);
  }

  const types = fs.readFileSync(path.join(ROOT, "src/lib/editor/types.ts"), "utf-8");
  if (!types.includes('"libreoffice"')) errors.push("libreoffice editor mode");
  else ok("libreoffice EditorMode");

  if (!types.includes('CORE_EDITOR_MODES: EditorMode[] = ["libreoffice", "writer", "studio"]')) {
    errors.push("3-tab CORE_EDITOR_MODES");
  } else ok("3탭 구조 (LibreOffice / Writer / Studio)");

  const shell = fs.readFileSync(
    path.join(ROOT, "src/components/editor/shell/BookEditorShell.tsx"),
    "utf-8",
  );
  if (!shell.includes("LibreOfficeRibbon")) errors.push("LibreOfficeRibbon not wired");
  else ok("BookEditorShell → LibreOfficeRibbon");
  if (!shell.includes("LibreOfficeHub")) errors.push("LibreOfficeHub not wired");
  else ok("BookEditorShell → LibreOfficeHub");

  const integrated = LIBREOFFICE_ENGINE_BINDINGS.filter((b) => b.status === "integrated");
  ok(`엔진 바인딩 — ${integrated.length}/${LIBREOFFICE_ENGINE_BINDINGS.length} 통합`);

  void getLibreOfficeRuntimeStatus().then((status) => {
    if (status.moduleCount < 5) errors.push("module count");
    else ok(`모듈 매니페스트 — ${status.moduleCount}개`);

    if (fs.existsSync(path.join(ROOT, ".libreoffice-install.json"))) {
      ok("libreoffice setup 완료");
    } else {
      console.log("  ⚠ npm run setup:libreoffice 권장");
    }

    console.log("\n=== 결과 ===");
    if (errors.length === 0) {
      console.log("✅ LibreOffice 편집기 검증 통과\n");
      process.exit(0);
    }
    console.log("❌ 검증 실패:");
    errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  });
}

main();
