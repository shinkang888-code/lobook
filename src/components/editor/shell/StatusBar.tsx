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
  cowork: "AI Cowork",
  architecture: "아키텍처",
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
    <footer className="hancom-statusbar shrink-0">
      <div className="flex items-center gap-3">
        <span>
          페이지 {pageNumber} / {pageTotal}
        </span>
        <span>
          {presetLabel} ({pageSpec.width_mm}×{pageSpec.height_mm}mm)
        </span>
        <span>{MODE_LABELS[editorMode]}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>{Math.round(zoom * 100)}%</span>
        <span className="max-w-[40vw] truncate">{bookTitle}</span>
      </div>
    </footer>
  );
}
