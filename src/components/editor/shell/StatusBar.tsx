"use client";

import type { EditorMode, PageSpec } from "@/lib/editor/types";
import { PAGE_PRESETS } from "@/lib/editor/pageSpec";

type StatusBarProps = {
  pageNumber: number;
  pageTotal: number;
  pageSpec: PageSpec;
  editorMode: EditorMode;
  zoom: number;
  bookTitle: string;
};

const MODE_LABELS: Record<EditorMode, string> = {
  markdown: "Markdown",
  html: "HTML",
  word: "Word",
  hwp: "HWP",
  pdf: "PDF",
  preview: "미리보기",
};

export function StatusBar({
  pageNumber,
  pageTotal,
  pageSpec,
  editorMode,
  zoom,
  bookTitle,
}: StatusBarProps) {
  const presetLabel =
    pageSpec.preset_id === "custom"
      ? "사용자 정의"
      : PAGE_PRESETS[pageSpec.preset_id as keyof typeof PAGE_PRESETS]?.label ?? pageSpec.preset_id;

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-[#1e3f6f] bg-[#2b579a] px-3 text-[10px] text-white">
      <div className="flex items-center gap-3">
        <span>
          페이지 {pageNumber} / {pageTotal}
        </span>
        <span className="opacity-70">
          {presetLabel} ({pageSpec.width_mm}×{pageSpec.height_mm}mm)
        </span>
        <span className="opacity-70">{MODE_LABELS[editorMode]}</span>
      </div>
      <div className="flex items-center gap-3 opacity-90">
        <span>{Math.round(zoom * 100)}%</span>
        <span className="max-w-[40vw] truncate">{bookTitle}</span>
      </div>
    </footer>
  );
}
