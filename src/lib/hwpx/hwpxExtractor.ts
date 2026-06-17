/**
 * HWPX 텍스트·이미지 추출 — hancom-io/hwpx-contents-extract (Apache-2.0) 로직 TypeScript 포팅.
 * @see https://github.com/shinkang888-code/hwpx-contents-extract
 */
import JSZip from "jszip";

export type HwpxSection = {
  path: string;
  paragraphs: string[];
};

export type HwpxImage = {
  path: string;
  mime: string;
  base64: string;
};

export type HwpxExtractResult = {
  sections: HwpxSection[];
  images: HwpxImage[];
  plainText: string;
  keywords: { word: string; count: number }[];
};

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function stripXmlTags(fragment: string): string {
  return decodeXmlEntities(fragment.replace(/<[^>]+>/g, "")).trim();
}

/** Java HwpxManager: XPath `//*[name()='hp:p']` 와 동등 */
export function extractParagraphsFromSectionXml(xml: string): string[] {
  const paragraphs: string[] = [];
  const paragraphRegex = /<(?:[\w-]+:)?p\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?p>/gi;
  let match: RegExpExecArray | null;

  while ((match = paragraphRegex.exec(xml)) !== null) {
    const text = stripXmlTags(match[0]);
    if (text) paragraphs.push(text);
  }

  if (paragraphs.length === 0) {
    const textNodeRegex = /<(?:[\w-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?t>/gi;
    while ((match = textNodeRegex.exec(xml)) !== null) {
      const text = stripXmlTags(match[1]);
      if (text) paragraphs.push(text);
    }
  }

  return paragraphs;
}

function imageMimeFromPath(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  if (ext === "webp") return "image/webp";
  return null;
}

/** text_rank.py 개념의 간단 키워드 빈도 (서버리스 호환) */
export function extractTopKeywords(text: string, limit = 12): { word: string; count: number }[] {
  const tokens = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export async function extractHwpx(buffer: ArrayBuffer): Promise<HwpxExtractResult> {
  const zip = await JSZip.loadAsync(buffer);
  const sections: HwpxSection[] = [];
  const images: HwpxImage[] = [];

  const names = Object.keys(zip.files).sort();

  for (const name of names) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;

    if (/section/i.test(name) && name.toLowerCase().endsWith(".xml")) {
      const xml = await entry.async("string");
      const paragraphs = extractParagraphsFromSectionXml(xml);
      if (paragraphs.length > 0) {
        sections.push({ path: name, paragraphs });
      }
    }

    const mime = imageMimeFromPath(name);
    if (mime && /image|bindata|picture/i.test(name)) {
      const base64 = await entry.async("base64");
      images.push({ path: name, mime, base64 });
    }
  }

  const plainText = sections.flatMap((s) => s.paragraphs).join("\n");
  return {
    sections,
    images,
    plainText,
    keywords: extractTopKeywords(plainText),
  };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
