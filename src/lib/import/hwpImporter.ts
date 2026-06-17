import { initRhwpServer } from "@/lib/rhwp/setup";
import { hwpxBufferToChapters, isHwpxFileName } from "@/lib/hwpx/hwpxService";

export type HwpPageChapter = {
  title: string;
  content_html: string;
  page_index: number;
};

export async function extractHwpChaptersFromHtml(
  buffer: ArrayBuffer,
  fileName = "document.hwp",
): Promise<HwpPageChapter[]> {
  if (isHwpxFileName(fileName)) {
    return hwpxBufferToChapters(buffer);
  }

  const rhwp = await initRhwpServer();
  const doc = new rhwp.HwpDocument(new Uint8Array(buffer));

  try {
    const count = doc.pageCount();
    const chapters: HwpPageChapter[] = [];

    for (let i = 0; i < count; i++) {
      const html = doc.renderPageHtml(i);
      chapters.push({
        title: count === 1 ? "HWP 원고" : `페이지 ${i + 1}`,
        content_html: html || "<p></p>",
        page_index: i,
      });
    }

    return chapters;
  } finally {
    doc.free();
  }
}

export async function extractHwpBufferFromPath(storagePath: string): Promise<ArrayBuffer> {
  const { readImportBufferAsArrayBuffer } = await import("@/lib/import/importBuffer");
  return readImportBufferAsArrayBuffer(storagePath);
}
