import mammoth from "mammoth";

function toNodeBuffer(buffer: ArrayBuffer): Buffer {
  return Buffer.from(buffer);
}

export async function parseDocxToHtml(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer: toNodeBuffer(buffer) });
  return result.value || "<p>내용이 없습니다.</p>";
}

export async function parseDocxToMarkdown(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: toNodeBuffer(buffer) });
  const lines = result.value.split("\n").filter(Boolean);
  return lines.map((line) => (line.trim() ? `${line.trim()}\n\n` : "")).join("");
}

export type DocxImportResult = {
  html: string;
  markdown: string;
  warnings: string[];
};

export async function importDocx(buffer: ArrayBuffer): Promise<DocxImportResult> {
  const nodeBuffer = toNodeBuffer(buffer);
  const htmlResult = await mammoth.convertToHtml({ buffer: nodeBuffer });
  const mdResult = await mammoth.extractRawText({ buffer: nodeBuffer });
  return {
    html: htmlResult.value || "<p></p>",
    markdown: mdResult.value || "",
    warnings: htmlResult.messages.map((m) => m.message),
  };
}
