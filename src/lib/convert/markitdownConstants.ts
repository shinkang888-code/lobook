const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".xlsx",
  ".xls",
  ".epub",
  ".html",
  ".htm",
  ".csv",
  ".json",
  ".xml",
  ".txt",
  ".md",
  ".markdown",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".zip",
] as const;

export const MARKITDOWN_ACCEPT =
  ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.epub,.html,.htm,.csv,.json,.xml,.txt,.md,.markdown,.png,.jpg,.jpeg,.gif,.webp,.zip";

export function isMarkitdownSupported(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
