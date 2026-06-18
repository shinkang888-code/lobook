"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Download,
  Eye,
  FileText,
  Italic as ItalicIcon,
  LayoutGrid,
  Maximize2,
  Printer,
  Redo2,
  Save,
  Scissors,
  Underline,
  Undo2,
  ZoomIn,
  ZoomOut,
  ClipboardPaste,
  ImageIcon,
  Table,
  Link2,
  FileStack,
  FileCode2,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoBookLogo } from "@/components/brand/LoBookLogo";
import type { EditorMode } from "@/lib/editor/types";
import { useEditorToolbarOptional } from "../shell/EditorToolbarContext";
import "./libreoffice-shell.css";

export type LibreOfficeRibbonTab = "file" | "edit" | "view" | "insert" | "format" | "tools";

type LibreOfficeRibbonProps = {
  bookTitle: string;
  editorMode: EditorMode;
  saving?: boolean;
  dirty?: boolean;
  onSave?: () => void;
  onExportEpub?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onImportDocx?: () => void;
  onImportEpub?: () => void;
  onImportHwp?: () => void;
  onImportPdf?: () => void;
  onConvertMarkdown?: () => void;
  onSnapshot?: () => void;
  onPreview?: () => void;
  showThumbnails?: boolean;
  onToggleThumbnails?: () => void;
};

const TABS: { id: LibreOfficeRibbonTab; label: string }[] = [
  { id: "file", label: "파일" },
  { id: "edit", label: "편집" },
  { id: "view", label: "보기" },
  { id: "insert", label: "삽입" },
  { id: "format", label: "서식" },
  { id: "tools", label: "도구" },
];

function RibbonBtn({
  title,
  onClick,
  disabled,
  children,
  primary,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`lo-ribbon-btn ${primary ? "lo-ribbon-btn--primary" : ""}`}
    >
      {children}
    </button>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="lo-ribbon-group">
      <div className="flex items-center gap-0.5">{children}</div>
      <span className="lo-ribbon-group-label">{label}</span>
    </div>
  );
}

export function LibreOfficeRibbon({
  bookTitle,
  editorMode,
  saving,
  dirty,
  onSave,
  onExportEpub,
  onExportDocx,
  onExportPdf,
  onImportDocx,
  onImportEpub,
  onImportHwp,
  onImportPdf,
  onConvertMarkdown,
  onSnapshot,
  onPreview,
  showThumbnails,
  onToggleThumbnails,
}: LibreOfficeRibbonProps) {
  const router = useRouter();
  const [tab, setTab] = useState<LibreOfficeRibbonTab>("edit");
  const toolbar = useEditorToolbarOptional();

  const modeLabel =
    editorMode === "writer" || editorMode === "markdown"
      ? "Writer (원고)"
      : editorMode === "libreoffice"
        ? "Loffice 문서"
        : editorMode === "studio"
          ? "LoBooK Studio"
          : editorMode;

  return (
    <div className="lo-shell lo-ribbon shrink-0">
      <div className="flex items-center gap-2 border-b border-[#c8c8c8] bg-[#f4f4f4] px-3 py-1">
        <button
          type="button"
          className="lo-ribbon-btn"
          title="책 목록"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="size-4" />
        </button>
        <LoBookLogo size={24} />
        <span className="text-xs font-semibold text-[#333]">{bookTitle || "제목 없음"}</span>
        <span className="rounded bg-[#e8f5e6] px-2 py-0.5 text-[10px] font-medium text-[#0d6b02]">
          {modeLabel}
        </span>
        {dirty && (
          <span className="text-[10px] text-amber-700">● 저장되지 않음</span>
        )}
      </div>

      <div className="lo-ribbon-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`lo-ribbon-tab ${tab === t.id ? "lo-ribbon-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="lo-ribbon-panel">
        {tab === "file" && (
          <>
            <RibbonGroup label="파일">
              <RibbonBtn title="저장" onClick={onSave} disabled={saving} primary>
                <Save className="size-4" />
                저장
              </RibbonBtn>
              <RibbonBtn title="버전 스냅샷" onClick={onSnapshot}>
                <FileStack className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="가져오기">
              <RibbonBtn title="DOCX" onClick={onImportDocx}>
                <FileText className="size-4" />
                Word
              </RibbonBtn>
              <RibbonBtn title="HWP" onClick={onImportHwp}>
                HWP
              </RibbonBtn>
              <RibbonBtn title="PDF" onClick={onImportPdf}>
                PDF
              </RibbonBtn>
              <RibbonBtn title="EPUB" onClick={onImportEpub}>
                EPUB
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="보내기">
              <RibbonBtn title="EPUB" onClick={onExportEpub}>
                <Download className="size-4" />
                EPUB
              </RibbonBtn>
              <RibbonBtn title="DOCX" onClick={onExportDocx}>
                DOCX
              </RibbonBtn>
              <RibbonBtn title="인쇄용" onClick={onExportPdf}>
                <Printer className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
          </>
        )}

        {tab === "edit" && (
          <>
            <RibbonGroup label="실행 취소">
              <RibbonBtn title="실행 취소" onClick={toolbar?.actions.undo}>
                <Undo2 className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="다시 실행" onClick={toolbar?.actions.redo}>
                <Redo2 className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="클립보드">
              <RibbonBtn title="잘라내기" onClick={toolbar?.actions.cut}>
                <Scissors className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="복사" onClick={toolbar?.actions.copy}>
                <Copy className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="붙여넣기" onClick={toolbar?.actions.paste}>
                <ClipboardPaste className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="글꼴">
              <RibbonBtn title="굵게" onClick={toolbar?.actions.bold}>
                <Bold className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="기울임" onClick={toolbar?.actions.italic}>
                <ItalicIcon className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="밑줄" onClick={toolbar?.actions.underline}>
                <Underline className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="단락">
              <RibbonBtn title="왼쪽" onClick={toolbar?.actions.alignLeft}>
                <AlignLeft className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="가운데" onClick={toolbar?.actions.alignCenter}>
                <AlignCenter className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="오른쪽" onClick={toolbar?.actions.alignRight}>
                <AlignRight className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
          </>
        )}

        {tab === "view" && (
          <>
            <RibbonGroup label="확대/축소">
              <RibbonBtn title="확대" onClick={toolbar?.actions.zoomIn}>
                <ZoomIn className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="축소" onClick={toolbar?.actions.zoomOut}>
                <ZoomOut className="size-4" />
              </RibbonBtn>
              <RibbonBtn title="페이지 맞춤" onClick={toolbar?.actions.zoomFit}>
                <Maximize2 className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
            <RibbonGroup label="탐색">
              <RibbonBtn title="썸네일" onClick={onToggleThumbnails}>
                <LayoutGrid className="size-4" />
                {showThumbnails ? "숨기기" : "썸네일"}
              </RibbonBtn>
              <RibbonBtn title="미리보기" onClick={onPreview}>
                <Eye className="size-4" />
              </RibbonBtn>
            </RibbonGroup>
          </>
        )}

        {tab === "insert" && (
          <RibbonGroup label="삽입">
            <RibbonBtn title="이미지">
              <ImageIcon className="size-4" />
            </RibbonBtn>
            <RibbonBtn title="표">
              <Table className="size-4" />
            </RibbonBtn>
            <RibbonBtn title="링크">
              <Link2 className="size-4" />
            </RibbonBtn>
          </RibbonGroup>
        )}

        {tab === "format" && (
          <RibbonGroup label="서식">
            <span className="text-[11px] text-gray-500 px-2">
              활성 문서 편집기의 서식 도구가 여기에 연결됩니다.
            </span>
          </RibbonGroup>
        )}

        {tab === "tools" && (
          <RibbonGroup label="변환">
            <RibbonBtn title="Markdown으로 변환" onClick={onConvertMarkdown}>
              <FileCode2 className="size-4" />
              MD 변환
            </RibbonBtn>
          </RibbonGroup>
        )}
      </div>
    </div>
  );
}
