"use client";

import type { EditorMode } from "@/lib/editor/types";
import { CORE_EDITOR_MODES } from "@/lib/editor/types";

const MODE_LABELS: Record<EditorMode, string> = {
  markdown: "Markdown",
  html: "HTML",
  word: "Word",
  hwp: "HWP",
  pdf: "PDF",
  cowork: "AI Cowork",
  preview: "미리보기",
};

type EditorTabBarProps = {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
};

export function EditorTabBar({ activeMode, onModeChange }: EditorTabBarProps) {
  return (
    <div className="hancom-editor-tabs shrink-0">
      <div className="hancom-editor-tabs-inner h-10 items-stretch">
        {CORE_EDITOR_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`hancom-editor-tab-btn ${activeMode === mode ? "hancom-editor-tab-btn--active" : ""}`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
        <div className="ml-auto flex items-center pr-2 text-[10px] text-[var(--hnc-control-text-color-disabled)]">
          편집기 모드
        </div>
      </div>
    </div>
  );
}
