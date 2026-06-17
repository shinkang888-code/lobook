/**
 * Start AionUi WebUI from vendored clone.
 * Usage: npm run start:aionui
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const bookRoot = path.join(__dirname, "..");
const manifest = path.join(bookRoot, ".aionui-install.json");
let root = path.join(bookRoot, "vendor", "aionui");

if (fs.existsSync(manifest)) {
  try {
    root = JSON.parse(fs.readFileSync(manifest, "utf-8")).root || root;
  } catch {
    /* ignore */
  }
}
if (!fs.existsSync(path.join(root, "package.json"))) {
  root = path.join(bookRoot, "..", "AionUi");
}

const bun = path.join(bookRoot, "node_modules", "bun", "bin", process.platform === "win32" ? "bun.exe" : "bun");
const bunCmd = fs.existsSync(bun) ? bun : "bun";
const port = process.env.AIONUI_PORT || "25809";

console.log(`Starting AionUi WebUI from ${root} on port ${port}...`);
const child = spawn(bunCmd, ["run", "webui", "--no-build", "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, AIONUI_OPEN_BROWSER: "1" },
});

child.on("exit", (code) => process.exit(code ?? 0));
