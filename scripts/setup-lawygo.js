/**
 * lawygo vendor setup — 기능 카탈로그 추출
 * Usage: node scripts/setup-lawygo.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "lawygo", "lawygo");
const sourceRoot = process.env.LAWYGO_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "lawygo");
const REPO = "https://github.com/shinkang888-code/lawygo.git";

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function main() {
  let root = sourceRoot;
  if (!fs.existsSync(path.join(root, "package.json"))) {
    console.log("Cloning lawygo (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    const tmp = path.join(bookRoot, "vendor", "_lawygo-clone");
    run(`git clone --depth 1 ${REPO} "${tmp}"`, bookRoot);
    root = fs.existsSync(path.join(tmp, "lawygo", "package.json"))
      ? path.join(tmp, "lawygo")
      : tmp;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
  const manifest = {
    source: "lawygo",
    repo: REPO,
    version: pkg.version,
    extractedAt: new Date().toISOString(),
    features: ["document-ocr", "pdf-chunk", "pdf-structured", "ai-two-panel"],
  };

  fs.mkdirSync(vendorRoot, { recursive: true });
  fs.writeFileSync(path.join(vendorRoot, "feature-manifest.json"), JSON.stringify(manifest, null, 2));

  fs.writeFileSync(
    path.join(bookRoot, ".lawygo-install.json"),
    JSON.stringify({ root, installedAt: manifest.extractedAt }, null, 2),
  );

  console.log(`\n✓ lawygo feature manifest → vendor/lawygo/`);
}

main();
