import type { CSSProperties } from "react";
import type { PagePresetId, PageSpec } from "./types";

export const PAGE_PRESETS: Record<
  Exclude<PagePresetId, "custom">,
  { label: string; width_mm: number; height_mm: number; description: string }
> = {
  a4: { label: "A4", width_mm: 210, height_mm: 297, description: "인쇄·PDF 표준" },
  a5: { label: "A5", width_mm: 148, height_mm: 210, description: "소형 도서" },
  b5: { label: "B5", width_mm: 176, height_mm: 250, description: "한국 일반 도서" },
  us_letter: { label: "Letter", width_mm: 216, height_mm: 279, description: "북미" },
  us_trade_6x9: { label: "6×9", width_mm: 152, height_mm: 229, description: "미국 trade paperback" },
  novel_kr: { label: "신국판", width_mm: 152, height_mm: 225, description: "한국 소설" },
};

export const DEFAULT_PAGE_SPEC: PageSpec = {
  preset_id: "b5",
  width_mm: 176,
  height_mm: 250,
  orientation: "portrait",
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  facing_pages: false,
  font_family: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  font_size_pt: 11,
  line_height: 1.8,
};

export function mmToPx(mm: number, zoom = 1): number {
  return (mm * 96) / 25.4 * zoom;
}

export function pageSpecToCss(spec: PageSpec, zoom = 1): CSSProperties {
  const w = spec.orientation === "portrait" ? spec.width_mm : spec.height_mm;
  const h = spec.orientation === "portrait" ? spec.height_mm : spec.width_mm;
  const { margins } = spec;

  return {
    width: mmToPx(w, zoom),
    height: mmToPx(h, zoom),
    padding: `${mmToPx(margins.top, zoom)}px ${mmToPx(margins.right, zoom)}px ${mmToPx(margins.bottom, zoom)}px ${mmToPx(margins.left, zoom)}px`,
    fontFamily: spec.font_family,
    fontSize: `${spec.font_size_pt * zoom}pt`,
    lineHeight: spec.line_height,
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  };
}

export function loadPageSpec(bookId: string): PageSpec {
  if (typeof window === "undefined") return DEFAULT_PAGE_SPEC;
  try {
    const raw = localStorage.getItem(`book-page-spec:${bookId}`);
    if (raw) return { ...DEFAULT_PAGE_SPEC, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PAGE_SPEC;
}

export function savePageSpec(bookId: string, spec: PageSpec): void {
  localStorage.setItem(`book-page-spec:${bookId}`, JSON.stringify(spec));
}

export function applyPreset(presetId: PagePresetId, current: PageSpec): PageSpec {
  if (presetId === "custom") return { ...current, preset_id: "custom" };
  const preset = PAGE_PRESETS[presetId];
  return {
    ...current,
    preset_id: presetId,
    width_mm: preset.width_mm,
    height_mm: preset.height_mm,
  };
}
