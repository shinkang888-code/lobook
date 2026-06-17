import { extractHwpx } from "./hwpxExtractor";
import { hwpxToChapters, hwpxToPreviewHtml } from "./hwpxToChapters";

export type HwpxPreview = {
  sectionCount: number;
  imageCount: number;
  charCount: number;
  keywords: { word: string; count: number }[];
  html: string;
  plainText: string;
};

export async function previewHwpx(buffer: ArrayBuffer): Promise<HwpxPreview> {
  const extracted = await extractHwpx(buffer);
  return {
    sectionCount: extracted.sections.length,
    imageCount: extracted.images.length,
    charCount: extracted.plainText.length,
    keywords: extracted.keywords,
    html: hwpxToPreviewHtml(extracted),
    plainText: extracted.plainText,
  };
}

export async function hwpxBufferToChapters(buffer: ArrayBuffer) {
  const extracted = await extractHwpx(buffer);
  return hwpxToChapters(extracted);
}

export function isHwpxFileName(fileName: string): boolean {
  return /\.hwpx$/i.test(fileName);
}
