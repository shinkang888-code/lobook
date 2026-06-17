let initPromise: Promise<void> | null = null;

export function registerRhwpTextMeasure(): void {
  if (typeof window === "undefined") return;
  let ctx: CanvasRenderingContext2D | null = null;
  let lastFont = "";
  (
    globalThis as typeof globalThis & { measureTextWidth?: (font: string, text: string) => number }
  ).measureTextWidth = (font: string, text: string) => {
    if (!ctx) ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return text.length * 8;
    if (font !== lastFont) {
      ctx.font = font;
      lastFont = font;
    }
    return ctx.measureText(text).width;
  };
}

export async function initRhwp(): Promise<typeof import("@rhwp/core")> {
  registerRhwpTextMeasure();
  if (!initPromise) {
    initPromise = (async () => {
      const rhwp = await import("@rhwp/core");
      await rhwp.default({ module_or_path: "/rhwp_bg.wasm" });
    })();
  }
  await initPromise;
  return import("@rhwp/core");
}

export interface RhwpPageInfo {
  width: number;
  height: number;
  page_number?: number;
}
