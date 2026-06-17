"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Monitor, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PageSpec } from "@/lib/editor/types";
import { RhwpCanvasViewer } from "./RhwpCanvasViewer";
import { HwpxHtmlViewer } from "./HwpxHtmlViewer";
import { HancomToolkitHub } from "./HancomToolkitHub";
import { isHwpxFileName } from "@/lib/hwpx/hwpxService";

type HwpPanelTab = "preview" | "toolkit";

type HwpEditorPanelProps = {
  bookId: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  onPageCountChange?: (count: number) => void;
  onConvertedToWord?: () => void;
};

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
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin" />
        HWP 불러오는 중…
      </div>
    );
  }

  if (buffer && fileName) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3 py-1.5">
          <button
            type="button"
            onClick={() => setPanelTab("preview")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium ${
              panelTab === "preview" ? "bg-[#2b579a] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Monitor className="size-3.5" /> 미리보기
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("toolkit")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium ${
              panelTab === "toolkit" ? "bg-[#2b579a] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Wrench className="size-3.5" /> 한컴 툴킷
          </button>
          <div className="flex-1" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            disabled={converting}
            onClick={() => void handleConvertHtml()}
          >
            {converting ? <Loader2 className="size-3 animate-spin" /> : null}
            HTML 변환
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          {panelTab === "toolkit" ? (
            <HancomToolkitHub
              bookId={bookId}
              fileName={fileName}
              onConvertHtml={() => void handleConvertHtml()}
            />
          ) : isHwpxFileName(fileName) ? (
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
          )}
        </div>

        {error && panelTab === "preview" && (
          <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{error}</p>
        )}
        <p className="shrink-0 border-t border-[#2b579a]/15 bg-[#2b579a]/5 px-2 py-1 text-[10px] text-[#2b579a]">
          {isHwpxFileName(fileName)
            ? "HWPX 추출 + 한컴 툴킷 · Ribbon 가져오기 또는 「HTML 변환」"
            : "HWP Canvas + 한컴오피스 뷰어 연동 · 툴킷 탭에서 분석·다운로드"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <input
        ref={inputRef}
        type="file"
        accept=".hwp,.hwpx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
        <Upload className="mx-auto mb-4 size-12 text-gray-400" />
        <h3 className="mb-2 text-sm font-semibold text-gray-700">한컴 HWP 편집기</h3>
        <p className="mb-4 max-w-sm text-xs text-gray-500">
          HWP Canvas / HWPX HTML 미리보기 + 한컴 툴킷(문서 분석·뷰어·파이프라인).
          ({pageSpec.preset_id.toUpperCase()} 규격)
        </p>
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            HWP/HWPX 선택
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadFromServer()}>
            서버에서 다시 불러오기
          </Button>
        </div>
      </div>
    </div>
  );
}
