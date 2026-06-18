"use client";

import { ChevronLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { LofficeLogo } from "@/components/brand/LofficeLogo";
import type { EditorMode } from "@/lib/editor/types";
import "./libreoffice-shell.css";

type LibreOfficeRibbonProps = {
  bookTitle: string;
  editorMode: EditorMode;
  saving?: boolean;
  dirty?: boolean;
  onSave?: () => void;
};

export function LibreOfficeRibbon({
  bookTitle,
  editorMode,
  saving,
  dirty,
  onSave,
}: LibreOfficeRibbonProps) {
  const router = useRouter();

  const modeLabel =
    editorMode === "writer" || editorMode === "markdown"
      ? "Writer"
      : editorMode === "libreoffice"
        ? "Loffice"
        : editorMode === "studio"
          ? "LoBooK Studio"
          : editorMode;

  return (
    <header className="lo-shell lo-ribbon shrink-0">
      <div className="lo-titlebar border-b border-[#c8c8c8] bg-[#f4f4f4] px-3 py-1.5">
        <div className="lo-titlebar-left flex min-w-0 items-center gap-1">
          <button
            type="button"
            className="lo-ribbon-btn shrink-0"
            title="책 목록"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <LofficeLogo size={24} showName nameClassName="text-sm font-bold text-[#0d6b02]" />
        </div>

        <h1 className="lo-titlebar-center truncate px-2 text-center text-sm font-semibold text-[#333]">
          {bookTitle || "제목 없음"}
        </h1>

        <div className="lo-titlebar-right flex min-w-0 items-center justify-end gap-2">
          {onSave && (
            <button
              type="button"
              className="lo-ribbon-btn shrink-0 text-[11px] font-medium text-[#0d6b02]"
              title="저장"
              disabled={saving}
              onClick={onSave}
            >
              <Save className="size-3.5" />
              {saving ? "저장 중…" : "저장"}
            </button>
          )}
          <span className="shrink-0 rounded bg-[#e8f5e6] px-2 py-0.5 text-[10px] font-medium text-[#0d6b02]">
            {modeLabel}
          </span>
          {dirty && (
            <span className="shrink-0 text-[10px] text-amber-700">● 미저장</span>
          )}
        </div>
      </div>
    </header>
  );
}
