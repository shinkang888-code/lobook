/**
 * hwpx-contents-extract vendor setup (reference + optional Python text_rank).
 * Usage: node scripts/setup-hwpx-extract.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "hwpx-contents-extract");
const sourceRoot = process.env.HWPX_EXTRACT_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "hwpx-contents-extract");
const REPO = "https://github.com/shinkang888-code/hwpx-contents-extract.git";

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function main() {
  let root = sourceRoot;

  if (!fs.existsSync(path.join(root, "README.md"))) {
    console.log("Cloning hwpx-contents-extract (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const manifest = {
    root,
    installedAt: new Date().toISOString(),
    note: "Book Studio는 TypeScript 포팅 추출기를 사용합니다. Java/Python은 선택 사항입니다.",
  };
  fs.writeFileSync(path.join(bookRoot, ".hwpx-extract-install.json"), JSON.stringify(manifest, null, 2));

  console.log("\n✓ hwpx-contents-extract setup complete");
  console.log("  본문 추출: src/lib/hwpx/ (서버리스 호환, Java 불필요)");
  console.log("  선택 Python 키워드: pip install -r requirements-hwpx-text-rank.txt");
}

main();
