/**
 * microsoft-365-docs vendor setup — Word 기능 카탈로그 추출
 * Usage: node scripts/setup-m365-word-docs.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "microsoft-365-docs");
const sourceRoot = process.env.M365_DOCS_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "microsoft-365-docs");
const REPO = "https://github.com/shinkang888-code/microsoft-365-docs.git";

const WORD_DOC_PATTERNS = [
  /esignature.*word/i,
  /content-assembly/i,
  /agreements/i,
  /translation/i,
  /copilot-tuning/i,
  /wordexcelppt/i,
  /word.*agent/i,
];

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function parseTocYaml(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const hrefMatch = line.match(/^\s*href:\s*(.+)$/);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].trim();
    let name = href;
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const nameMatch = lines[j].trimEnd().match(/^\s*-\s*name:\s*(.+)$/);
      if (nameMatch) {
        name = nameMatch[1].trim();
        break;
      }
    }
    items.push({ name, href });
  }
  return items;
}

function collectWordDocs(root) {
  const tocPaths = [
    path.join(root, "microsoft-365", "documentprocessing", "TOC.yml"),
    path.join(root, "copilot", "TOC.yml"),
  ];
  const all = [];
  for (const toc of tocPaths) {
    all.push(...parseTocYaml(toc));
  }
  return all.filter((item) => {
    const blob = `${item.name} ${item.href}`;
    return WORD_DOC_PATTERNS.some((re) => re.test(blob));
  });
}

function main() {
  let root = sourceRoot;
  if (!fs.existsSync(path.join(root, "microsoft-365", "documentprocessing", "TOC.yml"))) {
    console.log("Cloning microsoft-365-docs (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const wordDocs = collectWordDocs(root);
  const catalog = {
    source: "microsoft-365-docs",
    extractedAt: new Date().toISOString(),
    wordDocCount: wordDocs.length,
    items: wordDocs,
  };

  fs.mkdirSync(vendorRoot, { recursive: true });
  fs.writeFileSync(path.join(vendorRoot, "word-feature-catalog.json"), JSON.stringify(catalog, null, 2));

  fs.writeFileSync(
    path.join(bookRoot, ".m365-word-docs-install.json"),
    JSON.stringify({ root, installedAt: catalog.extractedAt, count: wordDocs.length }, null, 2),
  );

  console.log(`\n✓ Word feature catalog — ${wordDocs.length} docs → vendor/microsoft-365-docs/`);
}

main();
