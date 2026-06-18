"use client";

import { useCallback, useRef, useState } from "react";
import {
  FileScan,
  FileText,
  Layers,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { LoBookLogo } from "@/components/brand/LoBookLogo";
import { OcrTextPanel } from "@/components/ocr/OcrTextPanel";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";
import { DOCUMENT_OCR_ACCEPT } from "@/lib/documentOcr/types";
import { splitPdfIntoUploadChunks } from "@/lib/lawygo/clientPdfChunks";
import { LAWYGO_FEATURES } from "@/lib/lawygo/lawygoFeatures";
import { LOFICE_ENGINES, LOFICE_FORMAT_GROUPS } from "@/lib/lofice/loficeCatalog";
import { extractDocumentTextClient } from "@/lib/documentOcr/extractDocumentTextClient";
import "./looffice-hub.css";

type LoOfficeHubProps = {
  bookId: string;
  bookTitle: string;
  onApplyOcrText?: (text: string) => void;
};

type HubTab = "overview" | "engines" | "ocr" | "lawygo";

export function LoOfficeHub({ bookId, bookTitle, onApplyOcrText }: LoOfficeHubProps) {
  const [tab, setTab] = useState<HubTab>("overview");
  const [ocrFile, setOcrFile] = useState<{ buffer: ArrayBuffer; name: string; mime: string } | null>(null);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [chunkInfo, setChunkInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    setOcrFile({ buffer, name: file.name, mime: file.type || "application/octet-stream" });
    setChunkInfo(null);

    if (file.name.toLowerCase().endsWith(".pdf") && buffer.byteLength > 3.5 * 1024 * 1024) {
      setChunkLoading(true);
      try {
        const chunks = await splitPdfIntoUploadChunks(buffer, file.name);
        setChunkInfo(`LawyGo 청크: ${chunks.length}개 (${chunks.map((c) => c.name).join(", ")})`);
      } catch {
        setChunkInfo("청크 분할 실패 — 12MB 이하 단일 OCR 시도");
      } finally {
        setChunkLoading(false);
      }
    }
  }, []);

  const runChunkOcr = async () => {
    if (!ocrFile || !ocrFile.name.toLowerCase().endsWith(".pdf")) return;
    setChunkLoading(true);
    try {
      const chunks = await splitPdfIntoUploadChunks(ocrFile.buffer, ocrFile.name);
      const parts: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        toast.info(`청크 OCR ${i + 1}/${chunks.length}: ${chunk.name}`);
        const res = await extractDocumentTextClient(
          chunk.data.buffer as ArrayBuffer,
          chunk.name,
          "application/pdf",
        );
        parts.push(`--- ${chunk.name} (p${chunk.pageFrom}-${chunk.pageTo}) ---\n${res.text}`);
      }
      const merged = parts.join("\n\n");
      onApplyOcrText?.(merged);
      toast.success(`청크 OCR 완료 — ${merged.length.toLocaleString()}자`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "청크 OCR 실패");
    } finally {
      setChunkLoading(false);
    }
  };

  return (
    <div className="looffice-hub h-full min-h-0">
      <header className="looffice-header">
        <div className="flex items-center gap-3">
          <LoBookLogo size={40} />
          <div>
            <h2 className="text-lg font-bold">LoOffice — {bookTitle}</h2>
            <p className="text-xs text-emerald-100">
              lofice 통합 엔진 · lawygo OCR · {APP_NAME} 편집기
            </p>
          </div>
        </div>
      </header>

      <nav className="looffice-tabs">
        {(
          [
            ["overview", "개요", Layers],
            ["engines", "엔진", FileText],
            ["ocr", "OCR", ScanLine],
            ["lawygo", "LawyGo", Sparkles],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={`looffice-tab ${tab === id ? "looffice-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="flex items-center gap-1">
              <Icon className="size-3" />
              {label}
            </span>
          </button>
        ))}
      </nav>

      <div className="looffice-body">
        {tab === "overview" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="looffice-card">
              <h3 className="mb-2 text-sm font-bold text-slate-800">lofice × LoBooK</h3>
              <p className="text-[11px] leading-relaxed text-slate-600">
                shinkang888-code/lofice는 Word·HTML·PDF·HWP·Excel·PPT 등 60+ 형식을 통합한 핵심 오피스 허브입니다.
                LoBooK는 lofice에서 검증된 OCR·뷰어·편집 엔진을 전자책 워크플로에 연동합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LOFICE_FORMAT_GROUPS.map((g) => (
                <div key={g.app} className="looffice-card py-2">
                  <p className="text-xs font-semibold text-[#1a5f4a]">{g.label}</p>
                  <p className="text-[9px] text-slate-500">{g.exts.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "engines" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOFICE_ENGINES.map((e) => (
              <div key={e.id} className={`looffice-card looffice-engine--${e.status}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800">{e.label}</p>
                  <span className="text-[9px] uppercase text-slate-400">{e.status}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600">{e.description}</p>
                <p className="mt-2 text-[9px] text-slate-400">{e.formats.join(" · ")}</p>
                {e.lobookMode && (
                  <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-800">
                    LoBooK: {e.lobookMode} 탭
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "ocr" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="looffice-card">
              <input
                ref={fileRef}
                type="file"
                accept={DOCUMENT_OCR_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                PDF·이미지 선택
              </Button>
              {chunkLoading && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="size-3 animate-spin" /> 처리 중…
                </p>
              )}
              {chunkInfo && <p className="mt-2 text-[10px] text-amber-700">{chunkInfo}</p>}
              {ocrFile && ocrFile.buffer.byteLength > 3.5 * 1024 * 1024 && (
                <Button
                  type="button"
                  className="mt-2 w-full bg-[#1a5f4a] hover:bg-[#134a3a]"
                  disabled={chunkLoading}
                  onClick={() => void runChunkOcr()}
                >
                  <FileScan className="size-4" />
                  대용량 PDF 청크 OCR → 챕터 적용
                </Button>
              )}
            </div>

            {ocrFile && (
              <OcrTextPanel
                buffer={ocrFile.buffer}
                fileName={ocrFile.name}
                mimeType={ocrFile.mime}
                onApplyToChapter={(text) => {
                  onApplyOcrText?.(text);
                  toast.success("OCR 결과를 챕터에 적용했습니다.");
                }}
              />
            )}
          </div>
        )}

        {tab === "lawygo" && (
          <div className="mx-auto max-w-2xl space-y-3">
            <p className="text-[11px] text-slate-600">
              lawygo 법무 플랫폼에서 이식한 문서 처리 패턴 (bookId: {bookId})
            </p>
            {LAWYGO_FEATURES.map((f) => (
              <div key={f.id} className="looffice-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">{f.label}</p>
                  <span className="text-[9px] text-slate-400">{f.lobookStatus}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
