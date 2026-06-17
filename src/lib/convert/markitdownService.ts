import { spawn } from "child_process";
import path from "path";
import { isMarkitdownSupported } from "./markitdownConstants";

export type MarkitdownMode = "http" | "local" | "none";

export type MarkitdownStatus = {
  available: boolean;
  mode: MarkitdownMode;
  error?: string;
};

export { isMarkitdownSupported } from "./markitdownConstants";

function pythonBinary(): string {
  return process.env.MARKITDOWN_PYTHON || "python";
}

function scriptPath(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "scripts", "markitdown_convert.py");
}

function convertViaSubprocess(buffer: ArrayBuffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBinary(), [scriptPath(), "--stdin", "--filename", fileName], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    proc.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `MarkItDown 변환 실패 (exit ${code})`));
        return;
      }
      resolve(stdout);
    });

    proc.stdin.write(Buffer.from(buffer));
    proc.stdin.end();
  });
}

async function convertViaHttp(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const baseUrl = process.env.MARKITDOWN_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("MARKITDOWN_SERVICE_URL이 설정되지 않았습니다.");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer]), fileName);

  const res = await fetch(`${baseUrl}/convert`, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { markdown?: string; detail?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.detail ?? data.error ?? `MarkItDown API 오류 (${res.status})`);
  }
  return data.markdown ?? "";
}

export async function convertFileToMarkdown(buffer: ArrayBuffer, fileName: string): Promise<string> {
  if (!isMarkitdownSupported(fileName)) {
    throw new Error(`MarkItDown이 지원하지 않는 형식입니다: ${fileName}`);
  }

  if (process.env.MARKITDOWN_SERVICE_URL) {
    return convertViaHttp(buffer, fileName);
  }
  return convertViaSubprocess(buffer, fileName);
}

export async function getMarkitdownStatus(): Promise<MarkitdownStatus> {
  if (process.env.MARKITDOWN_SERVICE_URL) {
    const baseUrl = process.env.MARKITDOWN_SERVICE_URL.replace(/\/$/, "");
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return { available: true, mode: "http" };
      return { available: false, mode: "http", error: `HTTP ${res.status}` };
    } catch (error) {
      return {
        available: false,
        mode: "http",
        error: error instanceof Error ? error.message : "MarkItDown API 연결 실패",
      };
    }
  }

  try {
    const sample = new TextEncoder().encode("# MarkItDown probe\n");
    await convertViaSubprocess(sample.buffer, "probe.md");
    return { available: true, mode: "local" };
  } catch (error) {
    return {
      available: false,
      mode: "none",
      error:
        error instanceof Error
          ? error.message
          : "로컬 Python/MarkItDown 미설치 — pip install -r requirements-markitdown.txt",
    };
  }
}
