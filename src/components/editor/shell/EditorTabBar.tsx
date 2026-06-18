"use client";

import { FileText, Layers, Sparkles } from "lucide-react";
import {
  CORE_EDITOR_MODES,
  EDITOR_MODE_LABELS,
  normalizeEditorMode,
  type EditorMode,
  type PrimaryEditorMode,
} from "@/lib/editor/types";
import "../libreoffice/libreoffice-shell.css";

type EditorTabBarProps = {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
};

const TAB_ICONS: Record<PrimaryEditorMode, typeof FileText> = {
  libreoffice: FileText,
  writer: FileText,
  studio: Sparkles,
  preview: Layers,
};

export function EditorTabBar({ activeMode, onModeChange }: EditorTabBarProps) {
  const normalized = normalizeEditorMode(activeMode);

  return (
    <div className="lo-editor-tabs shrink-0">
      {CORE_EDITOR_MODES.map((mode) => {
        const primary = normalizeEditorMode(mode);
        const Icon = TAB_ICONS[primary];
        const isActive = normalized === primary;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`lo-editor-tab ${isActive ? "lo-editor-tab--active" : ""}`}
          >
            <Icon className="lo-editor-tab-icon" />
            {EDITOR_MODE_LABELS[primary]}
          </button>
        );
      })}
      <div className="ml-auto flex items-center pr-3 text-[10px] text-white/60">
        Lofice 중심 편집기
      </div>
    </div>
  );
}
