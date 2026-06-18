/**
 * hancom-toolkit vendor setup — manifest JSON 복사 (Turbopack 심링크 충돌 방지).
 * Usage: node scripts/setup-hancom-toolkit.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "hancom-toolkit");
const sourceRoot = process.env.HANCOM_TOOLKIT_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "hancom-toolkit");
const REPO = "https://github.com/shinkang888-code/hancom-toolkit.git";
const MANIFEST_SRC = path.join("src", "resources", "hancom-toolkit.json");

function main() {
  let root = sourceRoot;
  const manifestPath = path.join(root, MANIFEST_SRC);

  if (!fs.existsSync(manifestPath)) {
    console.log("Cloning hancom-toolkit (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const src = path.join(root, MANIFEST_SRC);
  if (!fs.existsSync(src)) {
    console.error("hancom-toolkit.json not found at", src);
    process.exit(1);
  }

  fs.mkdirSync(vendorRoot, { recursive: true });
  fs.copyFileSync(src, path.join(vendorRoot, "hancom-toolkit.json"));
  fs.copyFileSync(src, path.join(vendorRoot, "manifest.json"));

  fs.writeFileSync(
    path.join(bookRoot, ".hancom-toolkit-install.json"),
    JSON.stringify({ root, manifestCopiedAt: new Date().toISOString() }, null, 2),
  );

  console.log("\n✓ hancom-toolkit manifest → vendor/hancom-toolkit/");
  console.log("  LoBooK: 한컴 툴킷 허브 + 문서 분석 (웹 포팅)");
}

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

main();
