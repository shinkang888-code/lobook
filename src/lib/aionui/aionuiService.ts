import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import {
  bunBinary,
  defaultAionUiPort,
  resolveAionUiRootAsync,
  resolveAionUiWebUrl,
} from "./paths";

export type AionUiStatus = {
  installed: boolean;
  running: boolean;
  webUrl: string | null;
  localUrl: string | null;
  root: string | null;
  rendererBuilt: boolean;
  error?: string;
};

async function checkRenderer(root: string): Promise<boolean> {
  try {
    await fs.access(path.join(root, "out", "renderer", "index.html"));
    return true;
  } catch {
    return false;
  }
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status === 401 || res.status === 302;
  } catch {
    return false;
  }
}

export async function getAionUiStatus(): Promise<AionUiStatus> {
  const explicit = resolveAionUiWebUrl();
  if (explicit) {
    const running = await probeUrl(explicit);
    return {
      installed: true,
      running,
      webUrl: explicit,
      localUrl: explicit,
      root: null,
      rendererBuilt: true,
      error: running ? undefined : "AIONUI_WEB_URL에 연결할 수 없습니다.",
    };
  }

  let root: string | null = null;
  try {
    root = await resolveAionUiRootAsync();
    const hasPkg = await fs.access(path.join(root, "package.json")).then(() => true).catch(() => false);
    if (!hasPkg) {
      return {
        installed: false,
        running: false,
        webUrl: null,
        localUrl: null,
        root,
        rendererBuilt: false,
        error: "AionUi 미설치 — npm run setup:aionui",
      };
    }

    const rendererBuilt = await checkRenderer(root);
    const port = defaultAionUiPort();
    const localUrl = `http://127.0.0.1:${port}`;
    const running = await probeUrl(localUrl);

    return {
      installed: true,
      running,
      webUrl: running ? localUrl : null,
      localUrl,
      root,
      rendererBuilt,
      error: !rendererBuilt ? "renderer 미빌드 — cd vendor/aionui && bun run package" : undefined,
    };
  } catch (error) {
    return {
      installed: false,
      running: false,
      webUrl: null,
      localUrl: null,
      root,
      rendererBuilt: false,
      error: error instanceof Error ? error.message : "AionUi 상태 확인 실패",
    };
  }
}

let starting = false;

export async function startAionUiWebui(): Promise<{ url: string }> {
  if (starting) throw new Error("AionUi가 이미 시작 중입니다.");
  const status = await getAionUiStatus();
  if (status.running && status.webUrl) return { url: status.webUrl };

  const root = await resolveAionUiRootAsync();
  const rendererBuilt = await checkRenderer(root);
  if (!rendererBuilt) {
    throw new Error("AionUi renderer가 없습니다. npm run setup:aionui 를 실행하세요.");
  }

  const port = defaultAionUiPort();
  const bun = bunBinary();
  let bunCmd = bun;
  try {
    await fs.access(bun);
  } catch {
    bunCmd = "bun";
  }

  starting = true;
  try {
    const child = spawn(bunCmd, ["run", "webui", "--no-build", "--port", String(port)], {
      cwd: root,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env, AIONUI_OPEN_BROWSER: "0" },
    });
    child.unref();

    const localUrl = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      if (await probeUrl(localUrl)) return { url: localUrl };
    }
    throw new Error("AionUi WebUI 시작 시간 초과 (60초)");
  } finally {
    starting = false;
  }
}
