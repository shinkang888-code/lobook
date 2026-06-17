/**
 * AionUi vendor setup for Book Studio Cowork integration.
 * Usage: node scripts/setup-aionui.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bookRoot = path.join(__dirname, "..");
const defaultSource = path.join(bookRoot, "..", "AionUi");
const sourceRoot = process.env.AIONUI_ROOT || defaultSource;
const vendorRoot = path.join(bookRoot, "vendor", "aionui");
const WORKSPACE_PACKAGES = ["desktop", "web-cli", "shared-scripts", "web-host"];

function run(cmd, cwd, env = process.env) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env });
}

function runSafe(cmd, cwd, env = process.env) {
  try {
    run(cmd, cwd, env);
    return true;
  } catch {
    return false;
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
  return true;
}

function bunEnv(bookRoot) {
  const bunBin = path.join(bookRoot, "node_modules", "bun", "bin");
  const sep = path.delimiter;
  const pathPrefix = fs.existsSync(bunBin) ? `${bunBin}${sep}` : "";
  return {
    ...process.env,
    CI: "true",
    HUSKY: "0",
    PATH: `${pathPrefix}${process.env.PATH || ""}`,
  };
}

function fixWorkspaceJunctions(root) {
  if (process.platform !== "win32") return;
  const scopeDir = path.join(root, "node_modules", "@aionui");
  fs.mkdirSync(scopeDir, { recursive: true });
  for (const pkg of WORKSPACE_PACKAGES) {
    const link = path.join(scopeDir, pkg);
    const target = path.join(root, "packages", pkg);
    if (!fs.existsSync(target)) continue;
    if (fs.existsSync(link)) continue;
    try {
      fs.symlinkSync(target, link, "junction");
      console.log(`  ✓ junction @aionui/${pkg}`);
    } catch {
      console.warn(`  ⚠ junction 실패 @aionui/${pkg}`);
    }
  }
}

function resolveBunCmd(bookRoot) {
  const bunBin = path.join(bookRoot, "node_modules", "bun", "bin", "bun.exe");
  return fs.existsSync(bunBin) ? `"${bunBin}"` : "bun";
}

function installAionUi(root, bookRoot) {
  const bunCmd = resolveBunCmd(bookRoot);
  const env = bunEnv(bookRoot);

  console.log("\nInstalling AionUi dependencies (bun)...");
  const installed = runSafe(`${bunCmd} install --backend=copyfile --ignore-scripts`, root, env);
  if (!installed) {
    console.warn("⚠ bun install 일부 실패 — Windows에서 흔함. 워크스페이스 링크 복구를 시도합니다.");
  }

  fixWorkspaceJunctions(root);

  if (process.platform === "win32") {
    console.log("\nWindows: electron-vite 빌드 도구 보강...");
    runSafe(
      `${bunCmd} add -d picocolors cac esbuild magic-string @sentry/rollup-plugin node-gyp`,
      root,
      env,
    );
  }

  return bunCmd;
}

function buildRenderer(root, bunCmd, env) {
  const renderer = path.join(root, "out", "renderer", "index.html");
  if (fs.existsSync(renderer)) {
    console.log("\n✓ renderer 이미 빌드됨");
    return true;
  }

  console.log('\nBuilding AionUi renderer — 최초 1회, 수 분 소요...');
  const config = "packages/desktop/electron.vite.config.ts";
  const viaBun = runSafe(
    `${bunCmd} ./node_modules/electron-vite/bin/electron-vite.js build --config ${config}`,
    root,
    env,
  );
  if (viaBun && fs.existsSync(renderer)) return true;

  const viaScript = runSafe(`${bunCmd} run package`, root, env);
  if (viaScript && fs.existsSync(renderer)) return true;

  console.warn("\n⚠ renderer 빌드 실패 — Studio Chat은 사용 가능합니다.");
  console.warn("  수동: cd vendor/aionui && bun run package");
  console.warn("  또는 원격 WebUI: AIONUI_WEB_URL 환경 변수 설정");
  return false;
}

function main() {
  let root = sourceRoot;
  if (!fs.existsSync(path.join(root, "package.json"))) {
    console.log("Cloning AionUi (shallow)...");
    fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });
    run(`git clone --depth 1 https://github.com/shinkang888-code/AionUi.git "${vendorRoot}"`, bookRoot);
    root = vendorRoot;
  } else if (root !== vendorRoot) {
    console.log(`Using existing clone: ${root}`);
    console.log("  (외부 클론은 .aionui-install.json으로만 참조 — vendor 심링크는 Turbopack과 충돌합니다)");
  }

  const pkg = path.join(root, "package.json");
  if (!fs.existsSync(pkg)) {
    console.error("AionUi package.json not found");
    process.exit(1);
  }

  console.log("\nInstalling Book Studio bun runtime (dev)...");
  runSafe("npm install bun --save-dev", bookRoot);

  const bunCmd = installAionUi(root, bookRoot);
  const env = bunEnv(bookRoot);
  buildRenderer(root, bunCmd, env);

  fs.writeFileSync(
    path.join(bookRoot, ".aionui-install.json"),
    JSON.stringify({ root, installedAt: new Date().toISOString() }, null, 2),
  );
  console.log("\n✓ AionUi setup complete →", root);
}

main();
