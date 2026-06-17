/**
 * Vendor ppt-master Python scripts into vendor/ppt-master for Book Studio.
 * Usage: node scripts/setup-ppt-master.js
 * Source: PPT_MASTER_ROOT env or ../ppt-master (sibling clone)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "ppt-master");
const sourceRoot = process.env.PPT_MASTER_ROOT || defaultSource;
const skillScripts = path.join(sourceRoot, "skills", "ppt-master", "scripts");
const targetRoot = path.join(bookRoot, "vendor", "ppt-master", "skills", "ppt-master");
const targetScripts = path.join(targetRoot, "scripts");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function main() {
  if (!fs.existsSync(skillScripts)) {
    console.log("Cloning ppt-master (shallow)...");
    execSync(`git clone --depth 1 https://github.com/hugohe3/ppt-master.git "${sourceRoot}"`, {
      stdio: "inherit",
      cwd: bookRoot,
    });
  }

  if (!fs.existsSync(skillScripts)) {
    console.error("ppt-master scripts not found at:", skillScripts);
    process.exit(1);
  }

  fs.rmSync(targetRoot, { recursive: true, force: true });
  copyDir(skillScripts, targetScripts);

  const reqSrc = path.join(sourceRoot, "skills", "ppt-master", "requirements.txt");
  const reqDest = path.join(bookRoot, "requirements-ppt-master.txt");
  if (fs.existsSync(reqSrc)) {
    const lines = fs
      .readFileSync(reqSrc, "utf8")
      .split("\n")
      .filter((l) => !l.startsWith("#") && l.trim())
      .filter((l) =>
        /python-pptx|svglib|reportlab|cairosvg|edge-tts/.test(l),
      );
    fs.writeFileSync(
      reqDest,
      `# PPT Master export deps (Book Studio)\n# pip install -r requirements-ppt-master.txt\n${lines.join("\n")}\n`,
    );
  }

  console.log("✓ vendored ppt-master scripts →", targetScripts);
}

main();
