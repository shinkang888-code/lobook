/**
 * Loffice vendor setup — 엔진 카탈로그·manifest 추출
 * Usage: node scripts/setup-looffice.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "lofice");
const sourceRoot = process.env.LOOFFICE_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "looffice");
const REPO = "https://github.com/shinkang888-code/lofice.git";

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function main() {
  let root = sourceRoot;
  if (!fs.existsSync(path.join(root, "package.json"))) {
    console.log("Cloning lofice (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
  const manifest = {
    source: "looffice",
    repo: REPO,
    version: pkg.version,
    extractedAt: new Date().toISOString(),
    engines: [
      "udoc-viewer",
      "rhwp",
      "eigenpal-docx",
      "microscope",
      "pdfjs",
      "tesseract-ocr",
      "ddddocr",
      "ppt-master",
    ],
  };

  fs.mkdirSync(vendorRoot, { recursive: true });
  fs.writeFileSync(path.join(vendorRoot, "engine-manifest.json"), JSON.stringify(manifest, null, 2));

  fs.writeFileSync(
    path.join(bookRoot, ".looffice-install.json"),
    JSON.stringify({ root, installedAt: manifest.extractedAt, version: pkg.version }, null, 2),
  );

  console.log(`\n✓ Loffice engine manifest → vendor/looffice/ (v${pkg.version})`);
}

main();
