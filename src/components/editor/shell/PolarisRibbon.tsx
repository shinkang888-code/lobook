"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Italic,
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
  Minus,
  FileStack,
  RotateCw,
  Ruler,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RibbonTab } from "@/lib/editor/types";
import { useEditorToolbarOptional } from "./EditorToolbarContext";

type PolarisRibbonProps = {
  bookTitle: string;
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
  onSnapshot?: () => void;
  onPreview?: () => void;
  showThumbnails?: boolean;
  onToggleThumbnails?: () => void;
};

export function PolarisRibbon({
  bookTitle,
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
  onSnapshot,
  onPreview,
  showThumbnails,
  onToggleThumbnails,
}: PolarisRibbonProps) {
  const router = useRouter();
  const [tab, setTab] = useState<RibbonTab>("edit");
  const toolbar = useEditorToolbarOptional();
  const actions = toolbar?.actions ?? {};

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: "file", label: "파일" },
    { id: "edit", label: "편집" },
    { id: "view", label: "보기" },
    { id: "insert", label: "입력" },
    { id: "format", label: "서식" },
    { id: "page", label: "쪽" },
  ];

  return (
    <div className="shrink-0 select-none">
      {/* Title bar — Polaris navy */}
      <div className="flex h-9 items-center bg-[#2b579a] px-3 text-xs text-white">
        <span className="mr-2 font-semibold tracking-wide">Book Studio</span>
        <span className="mx-2 opacity-40">|</span>
        <span className="flex-1 truncate opacity-90">{bookTitle || "제목 없음"}</span>
        <span className="hidden items-center gap-2 sm:flex">
          <span
            className={`inline-block size-2 rounded-full ${dirty ? "bg-amber-300" : "bg-emerald-300"}`}
          />
          <span className="opacity-80">{saving ? "저장 중…" : dirty ? "변경됨" : "저장됨"}</span>
        </span>
      </div>

      {/* Menu tabs */}
      <div className="border-b border-[#1e3f6f] bg-[#2b579a]">
        <div className="scrollbar-thin flex h-8 items-center gap-0.5 overflow-x-auto px-1">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="shrink-0 rounded p-1.5 text-white/80 hover:bg-white/10"
            title="목록으로"
          >
            <ChevronLeft className="size-4" />
          </button>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-t px-4 py-1 text-xs font-medium transition-colors ${
                tab === id ? "bg-[#f3f3f3] text-[#2b579a]" : "text-white/90 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="min-w-2 flex-1" />
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex shrink-0 items-center gap-1 rounded bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 disabled:opacity-50"
            >
              <Save className="size-3.5" />
              {saving ? "저장 중" : "저장"}
            </button>
          )}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="flex shrink-0 items-center gap-1 rounded bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30"
            >
              <Eye className="size-3.5" />
              미리보기
            </button>
          )}
          {onExportEpub && (
            <button
              type="button"
              onClick={onExportEpub}
              className="flex shrink-0 items-center gap-1 rounded bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30"
            >
              <Download className="size-3.5" />
              EPUB
            </button>
          )}
        </div>
      </div>

      {/* Ribbon panel */}
      <div className="ribbon-panel min-h-[76px] overflow-x-auto border-b border-gray-300 bg-[#f3f3f3] px-2 py-1.5">
        {tab === "file" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="파일">
              <RibbonBtn icon={FileText} label="목록" onClick={() => router.push("/")} />
              {onSave && <RibbonBtn icon={Save} label="저장" onClick={onSave} />}
              {onSnapshot && <RibbonBtn icon={FileStack} label="버전 저장" onClick={onSnapshot} />}
              <RibbonBtn icon={Printer} label="인쇄" onClick={() => window.print()} />
            </RibbonGroup>
            <RibbonGroup label="가져오기">
              <RibbonBtn icon={FileText} label="Word" onClick={onImportDocx} />
              <RibbonBtn icon={FileStack} label="EPUB" onClick={onImportEpub} />
              <RibbonBtn icon={FileText} label="HWP" onClick={onImportHwp} />
              <RibbonBtn icon={FileStack} label="PDF" onClick={onImportPdf} />
            </RibbonGroup>
            <RibbonGroup label="내보내기">
              {onExportEpub && <RibbonBtn icon={Download} label="EPUB" onClick={onExportEpub} />}
              {onExportDocx && <RibbonBtn icon={Download} label="Word" onClick={onExportDocx} />}
              {onExportPdf && <RibbonBtn icon={Printer} label="PDF" onClick={onExportPdf} />}
            </RibbonGroup>
          </div>
        )}
        {tab === "edit" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="클립보드">
              <RibbonBtn icon={Copy} label="복사" onClick={actions.copy} />
              <RibbonBtn icon={Scissors} label="잘라내기" onClick={actions.cut} />
              <RibbonBtn icon={ClipboardPaste} label="붙여넣기" onClick={actions.paste} />
            </RibbonGroup>
            <RibbonGroup label="편집">
              <RibbonBtn icon={Undo2} label="실행 취소" onClick={actions.undo} />
              <RibbonBtn icon={Redo2} label="다시 실행" onClick={actions.redo} />
            </RibbonGroup>
          </div>
        )}
        {tab === "view" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="확대/축소">
              <RibbonBtn icon={ZoomOut} label="축소" onClick={actions.zoomOut} />
              <RibbonBtn icon={ZoomIn} label="확대" onClick={actions.zoomIn} />
              <RibbonBtn icon={Maximize2} label="폭 맞춤" onClick={actions.zoomFit} />
              <RibbonBtn icon={LayoutGrid} label="100%" onClick={actions.zoomReset} />
            </RibbonGroup>
            <RibbonGroup label="페이지">
              <RibbonBtn icon={ChevronLeft} label="이전" onClick={actions.prevPage} />
              <RibbonBtn icon={ChevronRight} label="다음" onClick={actions.nextPage} />
              <RibbonBtn
                icon={FileStack}
                label="썸네일"
                onClick={onToggleThumbnails}
                active={showThumbnails}
              />
            </RibbonGroup>
          </div>
        )}
        {tab === "insert" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="삽입">
              <RibbonBtn icon={ImageIcon} label="그림" />
              <RibbonBtn icon={Table} label="표" />
              <RibbonBtn icon={Link2} label="하이퍼링크" />
              <RibbonBtn icon={Minus} label="구분선" />
            </RibbonGroup>
          </div>
        )}
        {tab === "format" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="글꼴">
              <RibbonBtn icon={Bold} label="굵게" onClick={actions.bold} />
              <RibbonBtn icon={Italic} label="기울임" onClick={actions.italic} />
              <RibbonBtn icon={Underline} label="밑줄" onClick={actions.underline} />
            </RibbonGroup>
            <RibbonGroup label="단락">
              <RibbonBtn icon={AlignLeft} label="왼쪽" onClick={actions.alignLeft} />
              <RibbonBtn icon={AlignCenter} label="가운데" onClick={actions.alignCenter} />
              <RibbonBtn icon={AlignRight} label="오른쪽" onClick={actions.alignRight} />
            </RibbonGroup>
          </div>
        )}
        {tab === "page" && (
          <div className="flex min-w-max gap-4 text-xs">
            <RibbonGroup label="용지">
              <RibbonBtn icon={Ruler} label="페이지 설정" />
              <RibbonBtn icon={RotateCw} label="방향" />
            </RibbonGroup>
            <p className="self-center text-[10px] text-gray-500">
              우측 패널에서 페이지 규격(B5/A4 등)과 여백을 설정하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col border-r border-gray-300 pr-3 last:border-0">
      <div className="mb-0.5 flex gap-0.5">{children}</div>
      <span className="text-center text-[10px] leading-none text-gray-500">{label}</span>
    </div>
  );
}

function RibbonBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded px-2 py-1 transition-colors ${
        active
          ? "bg-[#2b579a]/15 text-[#2b579a]"
          : disabled || !onClick
            ? "cursor-default opacity-40"
            : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      <Icon className="size-5" />
      <span className="whitespace-nowrap text-[10px] leading-none">{label}</span>
    </button>
  );
}
