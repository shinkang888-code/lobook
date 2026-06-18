"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, ScanLine } from "lucide-react";
import { checkDdddOcrHealth } from "@/lib/documentOcr/ddddocr-api";
import { isDdddOcrServerAvailable } from "@/lib/documentOcr/ddddocr-config";
import { extractDocumentTextClient } from "@/lib/documentOcr/extractDocumentTextClient";
import {
  ENGINE_LABEL,
  isOcrSupported,
  METHOD_LABEL,
  type DocumentOcrResult,
  type OcrEngine,
} from "@/lib/documentOcr/types";

type OcrTextPanelProps = {
  buffer: ArrayBuffer;
  fileName: string;
  mimeType: string;
  onApplyToChapter?: (text: string) => void;
  className?: string;
};

export function OcrTextPanel({
  buffer,
  fileName,
  mimeType,
  onApplyToChapter,
  className = "",
}: OcrTextPanelProps) {
  const [result, setResult] = useState<DocumentOcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<OcrEngine>("auto");
  const [ddddocrOnline, setDdddocrOnline] = useState(false);

  const supported = isOcrSupported(mimeType, fileName);
  const ddddocrConfigured = isDdddOcrServerAvailable();

  useEffect(() => {
    if (!ddddocrConfigured) {
      setDdddocrOnline(false);
      return;
    }
    void checkDdddOcrHealth().then(setDdddocrOnline);
  }, [ddddocrConfigured]);

  const runOcr = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await extractDocumentTextClient(
        buffer,
        fileName,
        mimeType,
        (msg) => setProgress(msg),
        engine,
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR 실패");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [buffer, engine, fileName, mimeType]);

  const copyText = async () => {
    if (!result?.text) return;
    await navigator.clipboard.writeText(result.text);
  };

  return (
    <div className={`flex flex-col rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="border-b border-slate-100 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <ScanLine className="size-4 text-[#1a5f4a]" />
          <span className="text-sm font-semibold text-slate-800">OCR 텍스트 추출</span>
          <span className="text-[10px] text-slate-400 truncate">{fileName}</span>
        </div>

        {!supported ? (
          <p className="text-xs text-amber-700">PDF·이미지 파일만 OCR을 지원합니다.</p>
        ) : (
          <>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as OcrEngine)}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
              disabled={loading}
            >
              {(Object.keys(ENGINE_LABEL) as OcrEngine[]).map((key) => (
                <option key={key} value={key}>
                  {ENGINE_LABEL[key]}
                </option>
              ))}
            </select>

            {ddddocrConfigured && (
              <p className={`text-[10px] ${ddddocrOnline ? "text-green-700" : "text-amber-700"}`}>
                ddddocr: {ddddocrOnline ? "연결됨" : "오프라인 — Tesseract 폴백"}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => void runOcr()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a5f4a] px-3 py-2 text-sm text-white hover:bg-[#134a3a] disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
              {loading ? progress || "추출 중…" : "텍스트 추출 시작"}
            </button>
          </>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        {result && (
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {METHOD_LABEL[result.method]} · {result.charCount.toLocaleString()}자
              {result.pageCount ? ` · ${result.pageCount}p` : ""}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => void copyText()} className="flex items-center gap-1 hover:text-[#1a5f4a]">
                <Copy className="size-3" /> 복사
              </button>
              {onApplyToChapter && (
                <button
                  type="button"
                  onClick={() => onApplyToChapter(result.text)}
                  className="font-medium text-[#1a5f4a] hover:underline"
                >
                  챕터에 적용
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-h-80 overflow-auto p-3">
        {result?.warnings?.map((w) => (
          <p key={w} className="mb-2 text-[10px] text-amber-700">
            {w}
          </p>
        ))}
        {result?.text ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800">{result.text}</pre>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">
            스캔 PDF·이미지에서 텍스트를 추출합니다.
            <br />
            PDF 텍스트 레이어 → ddddocr / Tesseract 순으로 시도합니다.
          </p>
        )}
      </div>
    </div>
  );
}
