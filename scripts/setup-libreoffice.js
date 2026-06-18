/**
 * LibreOffice core 모듈 매니페스트 추출 (shallow metadata)
 * Usage: node scripts/setup-libreoffice.js
 * Source: https://github.com/shinkang888-code/libreoffice
 */
const fs = require("fs");
const path = require("path");

const bookRoot = path.join(__dirname, "..");
const vendorRoot = path.join(bookRoot, "vendor", "libreoffice");
const REPO = "https://github.com/shinkang888-code/libreoffice";

const MODULES = [
  {
    id: "sw",
    name: "Writer",
    path: "sw",
    description: "텍스트 문서 편집 (Writer)",
    formats: ["odt", "docx", "doc", "rtf"],
  },
  {
    id: "sc",
    name: "Calc",
    path: "sc",
    description: "스프레드시트 (Calc)",
    formats: ["ods", "xlsx", "csv"],
  },
  {
    id: "sd",
    name: "Impress/Draw",
    path: "sd",
    description: "프레젠테이션·도형 (Impress/Draw)",
    formats: ["odp", "pptx"],
  },
  {
    id: "hwpfilter",
    name: "HWP Filter",
    path: "hwpfilter",
    description: "한글(HWP/HWPX) 필터",
    formats: ["hwp", "hwpx"],
  },
  {
    id: "filter",
    name: "Import/Export Filters",
    path: "filter",
    description: "PDF·이미지 등 필터",
    formats: ["pdf", "svg", "png"],
  },
  {
    id: "framework",
    name: "UI Framework",
    path: "framework",
    description: "리본·메뉴·툴바 (uiconfig XML)",
    formats: [],
  },
  {
    id: "cui",
    name: "Common UI",
    path: "cui",
    description: "공통 대화상자·속성 패널",
    formats: [],
  },
  {
    id: "vcl",
    name: "Visual Class Library",
    path: "vcl",
    description: "위젯 툴킷·렌더링",
    formats: [],
  },
  {
    id: "editeng",
    name: "Edit Engine",
    path: "editeng",
    description: "텍스트 편집 엔진",
    formats: [],
  },
  {
    id: "libreofficekit",
    name: "LibreOfficeKit",
    path: "libreofficekit",
    description: "임베디드/온라인 API (LOK)",
    formats: ["*"],
  },
];

function main() {
  fs.mkdirSync(vendorRoot, { recursive: true });

  const manifest = {
    source: "libreoffice",
    repo: REPO,
    extractedAt: new Date().toISOString(),
    note: "Read-only LO core metadata. Runtime uses LoBooK engine bindings + optional LO Online.",
    modules: MODULES,
    uiConfig: {
      notebookBar: true,
      sidebarDeck: true,
      statusBar: true,
      inspiredBy: ["framework/uiconfig", "cui", "vcl"],
    },
    runtime: {
      collaboraUrlEnv: "LIBREOFFICE_ONLINE_URL",
      wopiBridge: "planned",
      wasmBuild: "planned",
    },
  };

  fs.writeFileSync(path.join(vendorRoot, "engine-manifest.json"), JSON.stringify(manifest, null, 2));

  const install = {
    installedAt: new Date().toISOString(),
    vendorRoot,
    modules: MODULES.length,
  };
  fs.writeFileSync(path.join(bookRoot, ".libreoffice-install.json"), JSON.stringify(install, null, 2));

  console.log("✓ LibreOffice manifest →", path.join(vendorRoot, "engine-manifest.json"));
  console.log("\n선택 환경 변수:");
  console.log("  LIBREOFFICE_ONLINE_URL=https://...  # Collabora/LO Online WOPI");
  console.log("\n검증: npm run verify:libreoffice");
}

main();
