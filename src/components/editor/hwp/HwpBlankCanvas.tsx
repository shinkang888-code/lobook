"use client";

import { useEffect, useState } from "react";
import type { PageSpec } from "@/lib/editor/types";
import { mmToPx } from "@/lib/editor/pageSpec";

type HwpBlankCanvasProps = {
  pageSpec: PageSpec;
  zoom: number;
  activePage?: number;
  onPageCountChange?: (count: number) => void;
};

function fitScale(pageWidth: number, containerWidth: number): number {
  if (pageWidth <= 0 || containerWidth <= 0) return 1;
  return Math.min(2, Math.max(0.25, containerWidth / pageWidth));
}

export function HwpBlankCanvas({
  pageSpec,
  zoom,
  activePage = 1,
  onPageCountChange,
}: HwpBlankCanvasProps) {
  const [scale, setScale] = useState(1);

  const pageW = mmToPx(
    pageSpec.orientation === "portrait" ? pageSpec.width_mm : pageSpec.height_mm,
    zoom,
  );
  const pageH = mmToPx(
    pageSpec.orientation === "portrait" ? pageSpec.height_mm : pageSpec.width_mm,
    zoom,
  );
  const containerW = pageW - mmToPx(pageSpec.margins.left + pageSpec.margins.right, zoom);

  useEffect(() => {
    onPageCountChange?.(1);
  }, [onPageCountChange]);

  useEffect(() => {
    setScale(fitScale(pageW, containerW));
  }, [pageW, containerW, zoom, pageSpec]);

  const displayW = Math.max(1, Math.floor(pageW * scale));
  const displayH = Math.max(1, Math.floor(pageH * scale));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <p className="shrink-0 border-b border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
        새 문서.hwp · {activePage}/1 · {pageSpec.preset_id.toUpperCase()} · scale{" "}
        {Math.round(scale * 100)}%
      </p>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-white px-2 py-4">
        <div className="mx-auto" style={{ width: "fit-content" }}>
          <div
            data-page="1"
            className="mx-auto mb-4 bg-white shadow-md"
            style={{ width: displayW, minHeight: displayH }}
          >
            <div
              className="hwp-blank-page h-full min-h-full outline-none"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              style={{
                width: displayW,
                minHeight: displayH,
                padding: `${mmToPx(pageSpec.margins.top, zoom) * scale}px ${mmToPx(pageSpec.margins.right, zoom) * scale}px ${mmToPx(pageSpec.margins.bottom, zoom) * scale}px ${mmToPx(pageSpec.margins.left, zoom) * scale}px`,
                fontFamily: pageSpec.font_family,
                fontSize: `${pageSpec.font_size_pt * zoom * scale}pt`,
                lineHeight: pageSpec.line_height,
                boxSizing: "border-box",
              }}
              data-placeholder="여기에 입력하거나 HWP/HWPX 파일을 불러오세요."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
