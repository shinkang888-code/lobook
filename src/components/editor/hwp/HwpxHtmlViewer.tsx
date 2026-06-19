"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Tags } from "lucide-react";
import { previewHwpx } from "@/lib/hwpx/hwpxService";
import type { PageSpec } from "@/lib/editor/types";
import { contentAreaPx } from "@/lib/editor/pageSpec";

type HwpxHtmlViewerProps = {
  buffer: ArrayBuffer;
  fileName: string;
  pageSpec: PageSpec;
  zoom: number;
  onPageCountChange?: (count: number) => void;
  onError?: (message: string) => void;
};

export function HwpxHtmlViewer({
  buffer,
  fileName,
  pageSpec,
  zoom,
  onPageCountChange,
  onError,
}: HwpxHtmlViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewHwpx>> | null>(null);

  const contentArea = contentAreaPx(pageSpec, zoom);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void previewHwpx(buffer)
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        onPageCountChange?.(Math.max(1, data.sectionCount));
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "HWPX 렌더링 실패";
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buffer, onError, onPageCountChange]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-white">
        <Loader2 className="size-6 animate-spin text-[#2b579a]" />
        <p className="text-xs text-gray-600">HWPX 본문 추출 중…</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center bg-white">
        <p className="text-sm font-medium text-red-600">HWPX 뷰어 오류</p>
        <p className="text-xs text-gray-500">{error ?? "내용 없음"}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <p className="shrink-0 border-b border-gray-200 bg-gradient-to-r from-[#2b579a]/5 to-white px-3 py-1.5 text-[10px] text-gray-600">
        <FileText className="mr-1 inline size-3 text-[#2b579a]" />
        {fileName} · HWPX · 섹션 {preview.sectionCount} · 이미지 {preview.imageCount} ·{" "}
        {pageSpec.preset_id.toUpperCase()}
      </p>

      {preview.keywords.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
          <Tags className="size-3 text-slate-400" />
          {preview.keywords.slice(0, 6).map((kw) => (
            <span
              key={kw.word}
              className="rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-500 shadow-sm"
            >
              {kw.word}
            </span>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-white px-4 py-6">
        <div
          className="mx-auto rounded-sm bg-white shadow-lg prose prose-sm max-w-none px-8 py-10 text-slate-900"
          style={{
            width: contentArea.width,
            minHeight: contentArea.height,
          }}
          dangerouslySetInnerHTML={{ __html: preview.html }}
        />
      </div>
    </div>
  );
}
