"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageSpec } from "@/lib/editor/types";
import { RhwpCanvasViewer } from "./RhwpCanvasViewer";
import { HwpxHtmlViewer } from "./HwpxHtmlViewer";
import { isHwpxFileName } from "@/lib/hwpx/hwpxService";

type HwpEditorPanelProps = {
  bookId: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  onPageCountChange?: (count: number) => void;
};

export function HwpEditorPanel({
  bookId,
  pageSpec,
  zoom,
  activePage,
  onPageCountChange,
}: HwpEditorPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
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
    if (isHwpxFileName(fileName)) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <HwpxHtmlViewer
            buffer={buffer}
            fileName={fileName}
            pageSpec={pageSpec}
            zoom={zoom}
            onPageCountChange={onPageCountChange}
            onError={setError}
          />
          {error && (
            <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{error}</p>
          )}
          <p className="shrink-0 border-t border-[#2b579a]/20 bg-[#2b579a]/5 px-2 py-1 text-[10px] text-[#2b579a]">
            HWPX: 한컴 hwpx-contents-extract 기반 본문 추출 · Ribbon → HTML 변환으로 Word 탭 편집
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
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
        {error && (
          <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{error}</p>
        )}
        <p className="shrink-0 border-t border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
          편집: Ribbon → HWP 가져오기 → 「HTML로 변환하여 편집」 후 Word/HTML 탭 사용
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
        <h3 className="mb-2 text-sm font-semibold text-gray-700">HWP 편집기</h3>
        <p className="mb-4 max-w-sm text-xs text-gray-500">
          Ribbon → HWP 가져오기 또는 아래 버튼으로 파일을 열면 Canvas 뷰어로 표시됩니다.
          ({pageSpec.preset_id.toUpperCase()} 규격에 맞춰 스케일)
        </p>
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            HWP 파일 선택
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadFromServer()}>
            서버에서 다시 불러오기
          </Button>
        </div>
      </div>
    </div>
  );
}
