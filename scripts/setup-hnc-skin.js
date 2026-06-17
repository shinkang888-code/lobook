/**
 * hnc-office-addin-ctrl 스킨 설치 (public/hancom-skin)
 * Usage: node scripts/setup-hnc-skin.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "hnc-office-addin-ctrl");
const sourceRoot = process.env.HNC_SKIN_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "hnc-office-addin-ctrl");
const publicSkin = path.join(bookRoot, "public", "hancom-skin");
const REPO = "https://github.com/shinkang888-code/hnc-office-addin-ctrl.git";

const CSS_FILES = [
  "hnc-skin.css",
  "hnc-base.css",
  "hnc-button.css",
  "hnc-submenu.css",
  "hnc-separator.css",
  "hnc-checkbox-radio.css",
  "hnc-editor-spin.css",
  "hnc-slider.css",
  "hnc-groupbox.css",
  "hnc-tab.css",
  "hnc-combobox.css",
];

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

function main() {
  let root = sourceRoot;
  const srcDir = path.join(root, "src");

  if (!fs.existsSync(path.join(srcDir, "hnc-skin.css"))) {
    console.log("Cloning hnc-office-addin-ctrl (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const cssSource = path.join(root, "src");
  fs.mkdirSync(publicSkin, { recursive: true });

  for (const file of CSS_FILES) {
    const from = path.join(cssSource, file);
    if (!fs.existsSync(from)) {
      console.error("Missing:", from);
      process.exit(1);
    }
    copyFile(from, path.join(publicSkin, file));
    console.log(`  ✓ ${file}`);
  }

  copyDir(path.join(root, "tester-img"), path.join(publicSkin, "icons"));

  const bundle = `@import url("./hnc-skin.css");
@import url("./hnc-base.css");
@import url("./hnc-button.css");
@import url("./hnc-submenu.css");
@import url("./hnc-separator.css");
@import url("./hnc-checkbox-radio.css");
@import url("./hnc-editor-spin.css");
@import url("./hnc-slider.css");
@import url("./hnc-groupbox.css");
@import url("./hnc-tab.css");
@import url("./hnc-combobox.css");
`;
  fs.writeFileSync(path.join(publicSkin, "hnc-office-addin-ctrl.css"), bundle);

  fs.writeFileSync(
    path.join(bookRoot, ".hnc-skin-install.json"),
    JSON.stringify({ root, installedAt: new Date().toISOString() }, null, 2),
  );

  console.log("\n✓ Hancom Office skin → public/hancom-skin/");
}

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

main();
