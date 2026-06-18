/**
 * AI 프레젠테이션 스튜디오 — Gemini CLI + Figma CLI 연동 설정
 * Usage: node scripts/setup-ppt-studio.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const vendorRoot = path.join(bookRoot, "vendor", "ppt-studio");

function run(cmd, cwd = bookRoot) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: "inherit", env: process.env, shell: true });
    return true;
  } catch {
    return false;
  }
}

function main() {
  fs.mkdirSync(vendorRoot, { recursive: true });

  const themes = {
    version: 1,
    extractedAt: new Date().toISOString(),
    figmaFileKey: "3FVgUkf0MGa6QVQoRxnUE3",
    figmaFileUrl:
      "https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3/Book-Studio-Design-System",
    themes: [
      {
        id: "lobook",
        label: "LoBooK Classic",
        accent: "#335095",
        bg: "#f8fafc",
        text: "#0f172a",
        muted: "#64748b",
        gradientStart: "#1e3f6f",
        gradientEnd: "#335095",
        coverSubtitle: "#dbeafe",
        coverFooter: "#bfdbfe",
        fontFamily: "Malgun Gothic, Apple SD Gothic Neo, sans-serif",
        source: "figma",
      },
      {
        id: "figma-light",
        label: "Figma Design System",
        accent: "#6182d6",
        bg: "#ffffff",
        text: "#1a1a1a",
        muted: "#6b7280",
        gradientStart: "#335095",
        gradientEnd: "#6182d6",
        coverSubtitle: "#e8eef8",
        coverFooter: "#c5d4f0",
        fontFamily: "Inter, Malgun Gothic, sans-serif",
        source: "figma",
      },
    ],
  };

  fs.writeFileSync(path.join(vendorRoot, "figma-themes.json"), JSON.stringify(themes, null, 2));
  console.log("✓ figma-themes.json →", path.join(vendorRoot, "figma-themes.json"));

  const geminiOk = run("npx @google/gemini-cli --version");
  const figmaOk = run("npx figma --version");

  const install = {
    installedAt: new Date().toISOString(),
    geminiCli: geminiOk,
    figmaCli: figmaOk,
    envHints: {
      GEMINI_API_KEY: "Gemini API (슬라이드 AI 플래닝)",
      FIGMA_ACCESS_TOKEN: "Figma REST API (라이브 변수 테마)",
      FIGMA_FILE_KEY: "Figma 파일 키 (기본: Book Studio Design System)",
    },
  };

  fs.writeFileSync(path.join(bookRoot, ".ppt-studio-install.json"), JSON.stringify(install, null, 2));
  console.log("✓ .ppt-studio-install.json");

  console.log("\n환경 변수 (선택):");
  console.log("  GEMINI_API_KEY=...        # Gemini AI 플래너");
  console.log("  FIGMA_ACCESS_TOKEN=...    # Figma 라이브 테마");
  console.log("  FIGMA_FILE_KEY=3FVgUkf0MGa6QVQoRxnUE3");
  console.log("\n검증: npm run verify:ppt");
}

main();
