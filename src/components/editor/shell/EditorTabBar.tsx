"use client";

import type { EditorMode } from "@/lib/editor/types";
import { CORE_EDITOR_MODES } from "@/lib/editor/types";

const MODE_LABELS: Record<EditorMode, string> = {
  markdown: "Markdown",
  html: "HTML",
  word: "Word",
  hwp: "HWP",
  pdf: "PDF",
  preview: "미리보기",
};

type EditorTabBarProps = {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
};

export function EditorTabBar({ activeMode, onModeChange }: EditorTabBarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center border-b border-gray-300 bg-white px-2">
      <div className="flex gap-0.5">
        {CORE_EDITOR_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`rounded px-4 py-1.5 text-xs font-medium transition-colors ${
              activeMode === mode
                ? "bg-[#2b579a] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
      <div className="ml-auto text-[10px] text-gray-400">편집기 모드 · Ctrl+Tab 전환 (예정)</div>
    </div>
  );
}
