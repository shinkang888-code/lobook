/**
 * architecture-center vendor setup — Azure 패턴 카탈로그 추출
 * Usage: node scripts/setup-architecture-center.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "architecture-center");
const sourceRoot = process.env.ARCH_CENTER_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "architecture-center");
const REPO = "https://github.com/shinkang888-code/architecture-center.git";

const ARCH_DOC_PATTERNS = [
  /rag/i,
  /document/i,
  /ai-agent/i,
  /foundry/i,
  /multi-modal/i,
  /generate-documents/i,
  /web-app/i,
  /reliable-web/i,
  /modern-web/i,
  /publisher/i,
  /static-content/i,
  /design-principles/i,
  /self-healing/i,
  /scale-out/i,
  /managed-services/i,
  /content.deliver/i,
  /chunk/i,
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

function collectArchDocs(root) {
  const tocPaths = [
    path.join(root, "docs", "toc.yml"),
    path.join(root, "docs", "ai-ml", "toc.yml"),
    path.join(root, "docs", "web-apps", "toc.yml"),
  ];
  const all = [];
  for (const toc of tocPaths) {
    all.push(...parseTocYaml(toc));
  }
  const seen = new Set();
  return all.filter((item) => {
    const blob = `${item.name} ${item.href}`;
    if (!ARCH_DOC_PATTERNS.some((re) => re.test(blob))) return false;
    const key = item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function main() {
  let root = sourceRoot;
  if (!fs.existsSync(path.join(root, "docs", "toc.yml"))) {
    console.log("Cloning architecture-center (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 ${REPO} "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else {
    console.log(`Using existing clone: ${root}`);
  }

  const archDocs = collectArchDocs(root);
  const catalog = {
    source: "architecture-center",
    repo: "https://github.com/shinkang888-code/architecture-center",
    learnBase: "https://learn.microsoft.com/azure/architecture",
    extractedAt: new Date().toISOString(),
    archDocCount: archDocs.length,
    items: archDocs,
  };

  fs.mkdirSync(vendorRoot, { recursive: true });
  fs.writeFileSync(path.join(vendorRoot, "pattern-catalog.json"), JSON.stringify(catalog, null, 2));

  fs.writeFileSync(
    path.join(bookRoot, ".architecture-center-install.json"),
    JSON.stringify({ root, installedAt: catalog.extractedAt, count: archDocs.length }, null, 2),
  );

  console.log(`\n✓ Architecture pattern catalog — ${archDocs.length} docs → vendor/architecture-center/`);
}

main();
