"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Monitor, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PageSpec } from "@/lib/editor/types";
import { HwpBlankCanvas } from "./HwpBlankCanvas";
import { RhwpCanvasViewer } from "./RhwpCanvasViewer";
import { HwpxHtmlViewer } from "./HwpxHtmlViewer";
import { HancomToolkitHub } from "./HancomToolkitHub";
import { isHwpxFileName } from "@/lib/hwpx/hwpxService";
import "./hwp-editor.css";

type HwpPanelTab = "preview" | "toolkit";

type HwpEditorPanelProps = {
  bookId: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  onPageCountChange?: (count: number) => void;
  onConvertedToWord?: () => void;
};

function HwpFileInput({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept=".hwp,.hwpx"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
    />
  );
}

function HwpToolbarActions({
  inputRef,
  onReload,
  reloading,
  onConvert,
  converting,
  showConvert,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onReload: () => void;
  reloading?: boolean;
  onConvert?: () => void;
  converting?: boolean;
  showConvert?: boolean;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-[10px]"
        onClick={() => inputRef.current?.click()}
      >
        HWP/HWPX 선택
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-[10px]"
        disabled={reloading}
        onClick={onReload}
      >
        {reloading ? <Loader2 className="size-3 animate-spin" /> : null}
        서버에서 다시 불러오기
      </Button>
      {showConvert && onConvert && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          disabled={converting}
          onClick={onConvert}
        >
          {converting ? <Loader2 className="size-3 animate-spin" /> : null}
          HTML 변환
        </Button>
      )}
    </div>
  );
}

export function HwpEditorPanel({
  bookId,
  pageSpec,
  zoom,
  activePage,
  onPageCountChange,
  onConvertedToWord,
}: HwpEditorPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelTab, setPanelTab] = useState<HwpPanelTab>("preview");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const hasDocument = Boolean(buffer && fileName);
  const displayName = fileName ?? "새 문서.hwp";

  const loadFromServer = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const metaRes = await fetch(`/api/books/${bookId}/import/hwp/latest`);
      if (metaRes.status === 404) return;
      if (!metaRes.ok) throw new Error("HWP 메타데이터 조회 실패");
      const meta = (await metaRes.json()) as { fileName?: string };
      const fileRes = await fetch(`/api/books/${bookId}/import/hwp/file`);
      if (!fileRes.ok) throw new Error("HWP 파일을 불러올 수 없습니다.");
      const buf = await fileRes.arrayBuffer();
      setBuffer(buf);
      setFileName(meta.fileName ?? "document.hwp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "HWP 로드 실패");
    } finally {
      setLoadingMeta(false);
    }
  }, [bookId]);

  useEffect(() => {
    void loadFromServer();
  }, [loadFromServer]);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.hwp(x)?$/i)) {
      setError("HWP 또는 HWPX 파일만 지원합니다.");
      return;
    }
    setError(null);
    const buf = await file.arrayBuffer();
    setBuffer(buf);
    setFileName(file.name);
    onPageCountChange?.(0);
    setPanelTab("preview");
  };

  const handleConvertHtml = async () => {
    if (!buffer || !fileName) {
      toast.error("변환할 파일이 없습니다.");
      return;
    }
    setConverting(true);
    try {
      const form = new FormData();
      form.append("file", new File([buffer], fileName));
      form.append("mode", "replace");
      form.append("hwpMode", "convert");
      const res = await fetch(`/api/books/${bookId}/import/hwp`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "변환 실패");
      const unit = isHwpxFileName(fileName) ? "섹션" : "페이지";
      toast.success(`${(data as { imported?: number }).imported ?? 0}개 ${unit}을 Word 탭으로 변환했습니다.`);
      onConvertedToWord?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "HTML 변환 실패");
    } finally {
      setConverting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="lo-panel">
        <div className="hwp-editor-toolbar">
          <span className="text-[11px] font-medium text-slate-700">한컴 HWP 편집기</span>
        </div>
        <div className="lo-panel-body flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-5 animate-spin" />
          HWP 불러오는 중…
        </div>
      </div>
    );
  }

  return (
    <div className="lo-panel">
      <HwpFileInput inputRef={inputRef} onFile={handleFile} />
      <div className="hwp-editor-toolbar">
        <button
          type="button"
          onClick={() => setPanelTab("preview")}
          className={`hwp-editor-tab ${panelTab === "preview" ? "hwp-editor-tab--active" : ""}`}
        >
          <Monitor className="size-3.5" /> 미리보기
        </button>
        <button
          type="button"
          onClick={() => setPanelTab("toolkit")}
          className={`hwp-editor-tab ${panelTab === "toolkit" ? "hwp-editor-tab--active" : ""}`}
        >
          <Wrench className="size-3.5" /> 한컴 툴킷
        </button>
        <span className="truncate text-[10px] text-gray-500">{displayName}</span>
        <HwpToolbarActions
          inputRef={inputRef}
          onReload={() => void loadFromServer()}
          reloading={loadingMeta}
          onConvert={() => void handleConvertHtml()}
          converting={converting}
          showConvert={hasDocument}
        />
      </div>

      <div className="lo-panel-body flex flex-col">
        {panelTab === "toolkit" ? (
          <HancomToolkitHub
            bookId={bookId}
            fileName={fileName}
            onConvertHtml={hasDocument ? () => void handleConvertHtml() : undefined}
          />
        ) : hasDocument && buffer && fileName ? (
          isHwpxFileName(fileName) ? (
            <HwpxHtmlViewer
              buffer={buffer}
              fileName={fileName}
              pageSpec={pageSpec}
              zoom={zoom}
              onPageCountChange={onPageCountChange}
              onError={setError}
            />
          ) : (
            <RhwpCanvasViewer
              buffer={buffer}
              fileName={fileName}
              pageSpec={pageSpec}
              zoom={zoom}
              activePage={activePage}
              singlePage
              onPageCountChange={onPageCountChange}
              onError={setError}
            />
          )
        ) : (
          <HwpBlankCanvas
            pageSpec={pageSpec}
            zoom={zoom}
            activePage={activePage}
            onPageCountChange={onPageCountChange}
          />
        )}
      </div>

      {error && panelTab === "preview" && (
        <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{error}</p>
      )}
      <p className="hwp-editor-footer">
        {hasDocument
          ? isHwpxFileName(fileName!)
            ? "HWPX 추출 + 한컴 툴킷 · Ribbon 가져오기 또는 「HTML 변환」"
            : "HWP Canvas + 한컴오피스 뷰어 연동 · 툴킷 탭에서 분석·다운로드"
          : "빈 HWP 캔버스 · 상단 「HWP/HWPX 선택」 또는 Ribbon → HWP 가져오기"}
      </p>
    </div>
  );
}
