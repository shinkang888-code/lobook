"use client";

import { useMemo } from "react";
import { Viewer, useRegistry } from "@microscope-js/react";
import { docxRenderer } from "@microscope-js/renderer-docx";
import { Loader2 } from "lucide-react";

type DocxPreviewPanelProps = {
  buffer: ArrayBuffer;
  fileName: string;
  className?: string;
};

export function DocxPreviewPanel({ buffer, fileName, className }: DocxPreviewPanelProps) {
  const registry = useRegistry([docxRenderer]);

  const source = useMemo(() => {
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }, [buffer]);

  return (
    <Viewer
      source={source}
      registry={registry}
      className={className ?? "h-[320px] w-full overflow-auto rounded-md border border-gray-200 bg-white"}
      loadingFallback={
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 bg-gray-50">
          <Loader2 className="size-6 animate-spin text-[#2b579a]" />
          <p className="text-xs text-gray-500">DOCX 미리보기 로딩…</p>
        </div>
      }
      errorFallback={(err) => (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-red-600">미리보기 실패</p>
          <p className="text-xs text-gray-500">{err.message}</p>
          <p className="text-[10px] text-gray-400">{fileName}</p>
        </div>
      )}
    />
  );
}
