import path from "path";

export type PptCanvasFormat = "ppt169" | "ppt43";

export const PPT_CANVAS = {
  ppt169: { viewBox: "0 0 1280 720", width: 1280, height: 720, label: "16:9" },
  ppt43: { viewBox: "0 0 1024 768", width: 1024, height: 768, label: "4:3" },
} as const;

export function resolvePptMasterScriptsDir(): string {
  const custom = process.env.PPT_MASTER_ROOT;
  if (custom) {
    return path.join(custom, "skills", "ppt-master", "scripts");
  }
  return path.join(process.cwd(), "vendor", "ppt-master", "skills", "ppt-master", "scripts");
}

export function resolvePptWorkspaceDir(bookId: string): string {
  return path.join(process.cwd(), ".data", "ppt-workspace", bookId);
}

export function pythonBinary(): string {
  return process.env.PPT_MASTER_PYTHON || process.env.MARKITDOWN_PYTHON || "python";
}
