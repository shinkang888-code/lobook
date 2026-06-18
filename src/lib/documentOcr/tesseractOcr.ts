import { getPdfJs } from "@/lib/pdf/pdf-engine";
import type { Worker } from "tesseract.js";

let workerInstance: Worker | null = null;
let workerInit: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (workerInstance) return workerInstance;
  if (!workerInit) {
    workerInit = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("kor+eng", 1, { logger: () => {} });
      workerInstance = worker;
      return worker;
    })();
  }
  return workerInit;
}

export async function ocrImageBlob(blob: Blob): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(blob, { rotateAuto: true } as Parameters<Worker["recognize"]>[1]);
  return data.text.trim();
}

export async function ocrPdfBuffer(
  buffer: ArrayBuffer,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const total = Math.min(pdf.numPages, 30);
  const parts: string[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    page.cleanup();
    if (!blob) continue;

    const text = await ocrImageBlob(blob);
    if (text) parts.push(text);
  }

  pdf.destroy();
  return parts.join("\n\n");
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    workerInit = null;
  }
}
