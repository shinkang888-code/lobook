import { spawn } from "child_process";

export type CliProbeResult = {
  available: boolean;
  version?: string;
  error?: string;
};

function runCommand(
  command: string,
  args: string[],
  timeoutMs = 15000,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
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
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ stdout, stderr: stderr || "timeout", code: null });
    }, timeoutMs);
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    proc.on("error", (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: error.message, code: null });
    });
  });
}

export async function probeNpxCli(
  packageName: string,
  versionFlag = "--version",
): Promise<CliProbeResult> {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const { stdout, stderr, code } = await runCommand(npx, [packageName, versionFlag]);
  const text = (stdout || stderr).trim();
  if (code === 0 && text) {
    const version = text.split("\n").pop()?.trim();
    return { available: true, version };
  }
  return {
    available: false,
    error: text || `${packageName} CLI를 찾을 수 없습니다.`,
  };
}
