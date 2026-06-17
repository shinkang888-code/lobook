"use client";

import { useMemo } from "react";
import { Viewer, useRegistry } from "@microscope-js/react";
import { pdfRenderer } from "@microscope-js/renderer-pdf";
import { Loader2 } from "lucide-react";

type PdfPreviewPanelProps = {
  buffer: ArrayBuffer;
  fileName: string;
  className?: string;
};

export function PdfPreviewPanel({ buffer, fileName, className }: PdfPreviewPanelProps) {
  const registry = useRegistry([pdfRenderer]);

  const source = useMemo(
    () => new Blob([buffer], { type: "application/pdf" }),
    [buffer],
  );

  return (
    <Viewer
      source={source}
      registry={registry}
      className={className ?? "h-full w-full overflow-auto bg-gray-100"}
      loadingFallback={
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <Loader2 className="size-7 animate-spin text-[#2b579a]" />
          <p className="text-xs text-gray-500">PDF 뷰어 로딩…</p>
        </div>
      }
      errorFallback={(err) => (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-red-600">PDF 오류</p>
          <p className="text-xs text-gray-500">{err.message}</p>
          <p className="text-[10px] text-gray-400">{fileName}</p>
        </div>
      )}
    />
  );
}
