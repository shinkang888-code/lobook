"use client";

import { useEffect, useRef, useState } from "react";
import type { HwpDocument } from "@rhwp/core";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initRhwp, type RhwpPageInfo } from "@/lib/rhwp/setup";

type HwpEditorPanelProps = {
  bookId: string;
};

export function HwpEditorPanel({ bookId }: HwpEditorPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<RhwpPageInfo[]>([]);
  const [svgs, setSvgs] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const docRef = useRef<HwpDocument | null>(null);

  useEffect(() => {
    return () => {
      docRef.current?.free();
      docRef.current = null;
    };
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.hwp(x)?$/i)) {
      setError("HWP 또는 HWPX 파일만 지원합니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setPages([]);
    setSvgs([]);
    docRef.current?.free();

    try {
      const buffer = await file.arrayBuffer();
      const rhwp = await initRhwp();
      const doc = new rhwp.HwpDocument(new Uint8Array(buffer));
      docRef.current = doc;

      const count = doc.pageCount();
      const infos: RhwpPageInfo[] = [];
      const svgList: string[] = [];

      for (let i = 0; i < count; i++) {
        infos.push(JSON.parse(doc.getPageInfo(i)) as RhwpPageInfo);
        svgList.push(doc.renderPageSvg(i));
      }

      setPages(infos);
      setSvgs(svgList);
      setFileName(file.name);

      const key = `hwp-cache:${bookId}`;
      sessionStorage.setItem(key, file.name);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "HWP 렌더링 실패 — @rhwp/core WASM이 로드되지 않았을 수 있습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin" />
        HWP 렌더링 중…
      </div>
    );
  }

  if (svgs.length > 0) {
    return (
      <div className="h-full overflow-auto p-4">
        <p className="mb-3 text-xs text-gray-500">{fileName} · {svgs.length}페이지</p>
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          {svgs.map((svg, i) => (
            <div
              key={i}
              className="overflow-hidden rounded bg-white shadow-sm"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ))}
        </div>
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
          한글(HWP) 원고를 업로드하면 @rhwp/core WASM으로 페이지 미리보기를 제공합니다.
        </p>
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          HWP 파일 가져오기
        </Button>
      </div>
      {pages.length > 0 && (
        <p className="text-xs text-gray-400">{pages.length}페이지 로드됨</p>
      )}
    </div>
  );
}
