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
  FileCode2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HncCommandBtn, HncIconOnlyBtn, HncRibbonGroup, HncRibbonIconBtn } from "@/components/hancom/HncControls";
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
  onConvertMarkdown?: () => void;
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
  onConvertMarkdown,
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
    <div className="hancom-editor-shell shrink-0 select-none">
      <div className="hancom-titlebar">
        <span className="hancom-titlebar-brand">한글 Book Studio</span>
        <span className="mx-1 opacity-40">|</span>
        <span className="hancom-titlebar-doc">{bookTitle || "제목 없음"}</span>
        <div className="hancom-titlebar-status">
          <span
            className={`hancom-titlebar-dot ${dirty ? "hancom-titlebar-dot--dirty" : "hancom-titlebar-dot--saved"}`}
          />
          <span>{saving ? "저장 중…" : dirty ? "변경됨" : "저장됨"}</span>
        </div>
      </div>

      <div className="hancom-ribbon-tabs">
        <div className="hancom-ribbon-tabs-inner">
          <HncIconOnlyBtn
            icon={ChevronLeft}
            label="목록으로"
            onClick={() => router.push("/")}
            className="!border-transparent !bg-transparent hover:!bg-white/10"
          />
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`hancom-ribbon-tab-btn ${tab === id ? "hancom-ribbon-tab-btn--active" : ""}`}
            >
              {label}
            </button>
          ))}
          <div className="hancom-ribbon-quickactions">
            {onSave && (
              <HncCommandBtn icon={Save} label={saving ? "저장 중" : "저장"} onClick={onSave} disabled={saving} />
            )}
            {onPreview && <HncCommandBtn icon={Eye} label="미리보기" onClick={onPreview} />}
            {onExportEpub && <HncCommandBtn icon={Download} label="EPUB" onClick={onExportEpub} />}
          </div>
        </div>
      </div>

      <div className="hancom-ribbon-panel">
        {tab === "file" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="파일">
              <HncRibbonIconBtn icon={FileText} label="목록" large onClick={() => router.push("/")} />
              {onSave && <HncRibbonIconBtn icon={Save} label="저장" large onClick={onSave} />}
              {onSnapshot && <HncRibbonIconBtn icon={FileStack} label="버전" large onClick={onSnapshot} />}
              <HncRibbonIconBtn icon={Printer} label="인쇄" large onClick={() => window.print()} />
            </HncRibbonGroup>
            <HncRibbonGroup label="가져오기">
              <HncRibbonIconBtn icon={FileText} label="Word" large onClick={onImportDocx} />
              <HncRibbonIconBtn icon={FileStack} label="EPUB" large onClick={onImportEpub} />
              <HncRibbonIconBtn icon={FileText} label="HWP" large onClick={onImportHwp} />
              <HncRibbonIconBtn icon={FileStack} label="PDF" large onClick={onImportPdf} />
            </HncRibbonGroup>
            <HncRibbonGroup label="변환">
              <HncRibbonIconBtn icon={FileCode2} label="마크다운" large onClick={onConvertMarkdown} />
            </HncRibbonGroup>
            <HncRibbonGroup label="보내기">
              {onExportEpub && <HncRibbonIconBtn icon={Download} label="EPUB" large onClick={onExportEpub} />}
              {onExportDocx && <HncRibbonIconBtn icon={Download} label="Word" large onClick={onExportDocx} />}
              {onExportPdf && <HncRibbonIconBtn icon={Printer} label="PDF" large onClick={onExportPdf} />}
            </HncRibbonGroup>
          </div>
        )}
        {tab === "edit" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="클립보드">
              <HncRibbonIconBtn icon={Copy} label="복사" large onClick={actions.copy} />
              <HncRibbonIconBtn icon={Scissors} label="잘라내기" large onClick={actions.cut} />
              <HncRibbonIconBtn icon={ClipboardPaste} label="붙여넣기" large onClick={actions.paste} />
            </HncRibbonGroup>
            <HncRibbonGroup label="편집">
              <HncRibbonIconBtn icon={Undo2} label="실행 취소" large onClick={actions.undo} />
              <HncRibbonIconBtn icon={Redo2} label="다시 실행" large onClick={actions.redo} />
            </HncRibbonGroup>
          </div>
        )}
        {tab === "view" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="확대/축소">
              <HncRibbonIconBtn icon={ZoomOut} label="축소" large onClick={actions.zoomOut} />
              <HncRibbonIconBtn icon={ZoomIn} label="확대" large onClick={actions.zoomIn} />
              <HncRibbonIconBtn icon={Maximize2} label="폭 맞춤" large onClick={actions.zoomFit} />
              <HncRibbonIconBtn icon={LayoutGrid} label="100%" large onClick={actions.zoomReset} />
            </HncRibbonGroup>
            <HncRibbonGroup label="페이지">
              <HncRibbonIconBtn icon={ChevronLeft} label="이전" large onClick={actions.prevPage} />
              <HncRibbonIconBtn icon={ChevronRight} label="다음" large onClick={actions.nextPage} />
              <HncRibbonIconBtn
                icon={FileStack}
                label="썸네일"
                large
                active={showThumbnails}
                onClick={onToggleThumbnails}
              />
            </HncRibbonGroup>
          </div>
        )}
        {tab === "insert" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="삽입">
              <HncRibbonIconBtn icon={ImageIcon} label="그림" large disabled />
              <HncRibbonIconBtn icon={Table} label="표" large disabled />
              <HncRibbonIconBtn icon={Link2} label="링크" large disabled />
              <HncRibbonIconBtn icon={Minus} label="구분선" large disabled />
            </HncRibbonGroup>
          </div>
        )}
        {tab === "format" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="글꼴">
              <HncRibbonIconBtn icon={Bold} label="굵게" large onClick={actions.bold} />
              <HncRibbonIconBtn icon={Italic} label="기울임" large onClick={actions.italic} />
              <HncRibbonIconBtn icon={Underline} label="밑줄" large onClick={actions.underline} />
            </HncRibbonGroup>
            <HncRibbonGroup label="단락">
              <HncRibbonIconBtn icon={AlignLeft} label="왼쪽" large onClick={actions.alignLeft} />
              <HncRibbonIconBtn icon={AlignCenter} label="가운데" large onClick={actions.alignCenter} />
              <HncRibbonIconBtn icon={AlignRight} label="오른쪽" large onClick={actions.alignRight} />
            </HncRibbonGroup>
          </div>
        )}
        {tab === "page" && (
          <div className="hancom-ribbon-row items-center">
            <HncRibbonGroup label="용지">
              <HncRibbonIconBtn icon={Ruler} label="페이지 설정" large disabled />
              <HncRibbonIconBtn icon={RotateCw} label="방향" large disabled />
            </HncRibbonGroup>
            <p className="self-center px-2 text-[10px] text-[var(--hnc-control-text-color-disabled)]">
              우측 패널에서 페이지 규격(B5/A4 등)과 여백을 설정하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
