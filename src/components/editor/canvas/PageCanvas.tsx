"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { PageSpec } from "@/lib/editor/types";
import { pageSpecToCss } from "@/lib/editor/pageSpec";

type PageCanvasProps = {
  pageSpec: PageSpec;
  zoom: number;
  showMarginGuides?: boolean;
  children: ReactNode;
};

export function PageCanvas({ pageSpec, zoom, showMarginGuides = true, children }: PageCanvasProps) {
  const pageStyle = pageSpecToCss(pageSpec, zoom);

  return (
    <div className="polaris-workspace flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 items-start justify-center overflow-auto p-8">
        <div className="relative shrink-0" style={{ width: pageStyle.width, minHeight: pageStyle.height }}>
          {showMarginGuides && (
            <>
              <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-gray-300/60" />
              <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-gray-300/60" />
              <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-gray-300/60" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-gray-300/60" />
            </>
          )}
          <div className="polaris-page overflow-hidden" style={pageStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type ZoomControlsProps = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  pageNumber: number;
  pageTotal: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ZoomControls({
  zoom,
  onZoomChange,
  pageNumber,
  pageTotal,
  onPrevPage,
  onNextPage,
}: ZoomControlsProps) {
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-t border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-600">
      <button type="button" onClick={onPrevPage} disabled={pageNumber <= 1} className="rounded px-2 py-0.5 hover:bg-gray-100 disabled:opacity-40">
        ◀
      </button>
      <span>
        {pageNumber} / {pageTotal}
      </span>
      <button
        type="button"
        onClick={onNextPage}
        disabled={pageNumber >= pageTotal}
        className="rounded px-2 py-0.5 hover:bg-gray-100 disabled:opacity-40"
      >
        ▶
      </button>
      <span className="mx-2 text-gray-300">|</span>
      <button type="button" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))} className="rounded p-1 hover:bg-gray-100">
        <Minus className="size-3.5" />
      </button>
      <button type="button" onClick={() => onZoomChange(1)} className="min-w-[48px] rounded px-2 py-0.5 hover:bg-gray-100">
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" onClick={() => onZoomChange(Math.min(2, zoom + 0.1))} className="rounded p-1 hover:bg-gray-100">
        <Plus className="size-3.5" />
      </button>
      <button type="button" onClick={() => onZoomChange(0.75)} className="rounded px-2 py-0.5 hover:bg-gray-100">
        폭 맞춤
      </button>
    </div>
  );
}
