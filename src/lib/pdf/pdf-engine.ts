import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsModule: typeof import("pdfjs-dist") | null = null;
let loadPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function preloadPdfEngine(): Promise<typeof import("pdfjs-dist")> {
  if (loadPromise) return loadPromise;
  loadPromise = import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsModule = pdfjs;
    return pdfjs;
  });
  return loadPromise;
}

export async function getPdfJs() {
  return pdfjsModule ?? preloadPdfEngine();
}

export function toPdfBytes(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export async function openPdfDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  return pdfjs.getDocument({ data: toPdfBytes(buffer), useSystemFonts: true }).promise;
}
