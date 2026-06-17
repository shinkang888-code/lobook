"use client";

import { useEffect, useState } from "react";
import { Loader2, Tags } from "lucide-react";
import { previewHwpx } from "@/lib/hwpx/hwpxService";

type HwpxPreviewPanelProps = {
  buffer: ArrayBuffer;
  fileName: string;
};

export function HwpxPreviewPanel({ buffer, fileName }: HwpxPreviewPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewHwpx>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void previewHwpx(buffer)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "HWPX 미리보기 실패");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buffer]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        HWPX 분석 중…
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error ?? "미리보기를 생성할 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-[#2b579a]/10 px-2 py-0.5 font-medium text-[#2b579a]">
          {fileName}
        </span>
        <span>섹션 {preview.sectionCount}</span>
        <span>이미지 {preview.imageCount}</span>
        <span>{preview.charCount.toLocaleString()}자</span>
      </div>

      {preview.keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tags className="size-3.5 text-slate-400" />
          {preview.keywords.slice(0, 8).map((kw) => (
            <span
              key={kw.word}
              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600"
            >
              {kw.word} ({kw.count})
            </span>
          ))}
        </div>
      )}

      <div
        className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: preview.html }}
      />
    </div>
  );
}
