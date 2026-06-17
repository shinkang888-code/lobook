import { promises as fs } from "fs";
import path from "path";

export function resolveAionUiRoot(): string {
  if (process.env.AIONUI_ROOT) return path.resolve(process.env.AIONUI_ROOT);
  return path.join(process.cwd(), "vendor", "aionui");
}

export async function readInstallManifest(): Promise<{ root: string } | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".aionui-install.json"), "utf-8");
    return JSON.parse(raw) as { root: string };
  } catch {
    return null;
  }
}

export async function resolveAionUiRootAsync(): Promise<string> {
  const manifest = await readInstallManifest();
  if (manifest?.root && (await pathExists(manifest.root))) return manifest.root;
  const root = resolveAionUiRoot();
  if (await pathExists(path.join(root, "package.json"))) return root;
  const sibling = path.join(process.cwd(), "..", "AionUi");
  if (await pathExists(path.join(sibling, "package.json"))) return sibling;
  return root;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export function defaultAionUiPort(): number {
  const env = process.env.AIONUI_PORT;
  if (env && /^\d+$/.test(env)) return Number(env);
  return 25809;
}

export function resolveAionUiWebUrl(): string | null {
  const explicit = process.env.AIONUI_WEB_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  return null;
}

export function bunBinary(): string {
  const local = path.join(
    process.cwd(),
    "node_modules",
    "bun",
    "bin",
    process.platform === "win32" ? "bun.exe" : "bun",
  );
  return local;
}
