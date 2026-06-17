"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageSpec } from "@/lib/editor/types";
import { PdfPreviewPanel } from "./PdfPreviewPanel";

type PdfEditorPanelProps = {
  bookId: string;
  pageSpec: PageSpec;
  activePage: number;
  onPageCountChange?: (count: number) => void;
};

type ViewTab = "print" | "file";

export function PdfEditorPanel({
  bookId,
  pageSpec,
  activePage,
  onPageCountChange,
}: PdfEditorPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("print");
  const [loading, setLoading] = useState(true);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPrintPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${bookId}/export/pdf`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "인쇄 미리보기 실패");
      }
      const html = await res.text();
      setPrintHtml(html);
      onPageCountChange?.(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인쇄 미리보기 실패");
    } finally {
      setLoading(false);
    }
  }, [bookId, onPageCountChange]);

  const loadPdfFile = useCallback(async () => {
    try {
      const metaRes = await fetch(`/api/books/${bookId}/import/pdf/latest`);
      if (metaRes.status === 404) return;
      if (!metaRes.ok) return;
      const meta = (await metaRes.json()) as { fileName?: string };
      const fileRes = await fetch(`/api/books/${bookId}/import/pdf/file`);
      if (!fileRes.ok) return;
      const buf = await fileRes.arrayBuffer();
      setPdfBuffer(buf);
      setPdfFileName(meta.fileName ?? "document.pdf");
      onPageCountChange?.(10);
    } catch {
      /* optional */
    }
  }, [bookId, onPageCountChange]);

  useEffect(() => {
    void loadPrintPreview();
    void loadPdfFile();
  }, [loadPrintPreview, loadPdfFile]);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.pdf$/i)) {
      setError("PDF 파일만 지원합니다.");
      return;
    }
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/books/${bookId}/import/pdf`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "PDF 업로드 실패");
    setViewTab("file");
    await loadPdfFile();
  };

  if (loading && !printHtml) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin" />
        PDF 미리보기 준비 중…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <button
          type="button"
          onClick={() => setViewTab("print")}
          className={`rounded px-2 py-0.5 text-[10px] ${viewTab === "print" ? "bg-[#2b579a] text-white" : "text-gray-600"}`}
        >
          인쇄 미리보기 ({pageSpec.preset_id.toUpperCase()})
        </button>
        <button
          type="button"
          onClick={() => setViewTab("file")}
          className={`rounded px-2 py-0.5 text-[10px] ${viewTab === "file" ? "bg-[#2b579a] text-white" : "text-gray-600"}`}
        >
          PDF 파일 {pdfFileName ? `· ${pdfFileName}` : ""}
        </button>
        <div className="ml-auto flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => void loadPrintPreview()}>
            새로고침
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => inputRef.current?.click()}>
            PDF 업로드
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error && <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{error}</p>}

      <div className="min-h-0 flex-1">
        {viewTab === "print" && printHtml && (
          <iframe
            title="인쇄 미리보기"
            srcDoc={printHtml}
            className="h-full w-full border-0 bg-white"
            sandbox="allow-same-origin"
          />
        )}
        {viewTab === "file" && pdfBuffer && pdfFileName && (
          <PdfPreviewPanel buffer={pdfBuffer} fileName={pdfFileName} className="h-full w-full" />
        )}
        {viewTab === "file" && !pdfBuffer && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Upload className="size-10 text-gray-400" />
            <p className="text-xs text-gray-500">Ribbon → PDF 가져오기 또는 업로드 버튼으로 PDF를 열 수 있습니다.</p>
          </div>
        )}
      </div>
      <p className="shrink-0 border-t border-gray-200 px-2 py-1 text-[10px] text-gray-500">
        페이지 {activePage} · 브라우저 인쇄(Ctrl+P)로 PDF 저장 가능
      </p>
    </div>
  );
}
