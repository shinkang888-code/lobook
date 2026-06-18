"use client";

import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";

type EditorMarginToolsProps = {
  side: "left" | "right";
  zoom: number;
  pageNumber: number;
  pageTotal: number;
  onZoomChange: (zoom: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function EditorMarginTools({
  side,
  zoom,
  pageNumber,
  pageTotal,
  onZoomChange,
  onPrevPage,
  onNextPage,
}: EditorMarginToolsProps) {
  if (side === "left") {
    return (
      <div className="editor-workspace-margin editor-workspace-margin--left">
        <span className="editor-margin-label">줌</span>
        <button
          type="button"
          className="editor-margin-btn"
          title="확대"
          onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          className="editor-margin-btn text-[10px] font-medium"
          title="100%로 리셋"
          onClick={() => onZoomChange(1)}
        >
          {Math.round(zoom * 100)}
        </button>
        <button
          type="button"
          className="editor-margin-btn"
          title="축소"
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          className="editor-margin-btn text-[9px] font-medium leading-tight"
          title="폭 맞춤"
          onClick={() => onZoomChange(0.85)}
        >
          맞춤
        </button>
      </div>
    );
  }

  return (
    <div className="editor-workspace-margin editor-workspace-margin--right">
      <span className="editor-margin-label">페이지</span>
      <button
        type="button"
        className="editor-margin-btn"
        title="이전 페이지"
        disabled={pageNumber <= 1}
        onClick={onPrevPage}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-[10px] font-medium text-slate-600">
        {pageNumber}/{pageTotal}
      </span>
      <button
        type="button"
        className="editor-margin-btn"
        title="다음 페이지"
        disabled={pageNumber >= pageTotal}
        onClick={onNextPage}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
