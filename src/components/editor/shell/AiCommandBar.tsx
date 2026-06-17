"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Presentation,
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PptCanvasFormat } from "@/lib/ppt/pptMasterPaths";

type PptStatus = {
  engine: { available: boolean; error?: string };
  ai: { enabled: boolean; model: string };
};

type AiCommandBarProps = {
  bookId: string;
  bookTitle: string;
  onGenerated?: (fileName: string) => void;
  onOpenCowork?: () => void;
};

const PRESETS = [
  "책 전체 내용으로 10장 발표 자료 만들기",
  "핵심 요약 6장 슬라이드",
  "표지·목차·본문·마무리 구조로 정리",
  "독자 대상 소개용 프레젠테이션",
];

export function AiCommandBar({ bookId, bookTitle, onGenerated, onOpenCowork }: AiCommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<PptCanvasFormat>("ppt169");
  const [maxSlides, setMaxSlides] = useState(10);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PptStatus | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ppt/status");
      setStatus((await res.json()) as PptStatus);
      const latest = await fetch(`/api/books/${bookId}/ppt/latest`);
      if (latest.ok) {
        const data = await latest.json();
        setLastFile(data.fileName);
      }
    } catch {
      setStatus(null);
    }
  }, [bookId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("AI 명령을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/ppt/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, format, maxSlides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "PPT 생성 실패");

      setLastFile(data.fileName);
      toast.success(`${data.slideCount}장 PPT가 생성되었습니다.`);
      onGenerated?.(data.fileName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PPT 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/books/${bookId}/ppt/file`, "_blank");
  };

  const engineOk = status?.engine.available;
  const aiOn = status?.ai.enabled;

  return (
    <div className="shrink-0 border-b border-[#1e3f6f]/20 bg-gradient-to-r from-[#1a3560] via-[#2b579a] to-[#3d6db5] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <Sparkles className="size-4 text-amber-200" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">AI 프레젠테이션 스튜디오</p>
              <p className="text-[11px] text-white/70">
                PPT Master · {bookTitle || "제목 없음"}
                {aiOn ? ` · ${status?.ai.model}` : " · 로컬 플래너"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {engineOk ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100">
                <CheckCircle2 className="size-3" /> PPT 엔진 준비
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-100">
                <AlertCircle className="size-3" /> setup:ppt-master 필요
              </span>
            )}
            {lastFile && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 gap-1 bg-white/15 text-white hover:bg-white/25"
                onClick={handleDownload}
              >
                <Download className="size-3.5" />
                {lastFile}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Wand2 className="pointer-events-none absolute left-3 top-3 size-4 text-white/40" />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 이 책 내용으로 투자자 발표용 8장 슬라이드를 만들어줘. 핵심 메시지와 bullet 위주로."
              rows={2}
              className="w-full resize-none rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/45 backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/10">
              {(["ppt169", "ppt43"] as PptCanvasFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 text-xs font-medium transition ${
                    format === f ? "bg-white text-[#2b579a]" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {f === "ppt169" ? "16:9" : "4:3"}
                </button>
              ))}
            </div>

            <select
              value={maxSlides}
              onChange={(e) => setMaxSlides(Number(e.target.value))}
              className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {[6, 8, 10, 12, 16].map((n) => (
                <option key={n} value={n} className="text-slate-900">
                  {n}장
                </option>
              ))}
            </select>

            {onOpenCowork && (
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5 bg-white/10 text-white hover:bg-white/20"
                onClick={onOpenCowork}
              >
                <Bot className="size-4" />
                Cowork
              </Button>
            )}

            <Button
              type="button"
              disabled={loading || !engineOk}
              className="h-9 gap-2 bg-white text-[#2b579a] hover:bg-white/90"
              onClick={() => void handleGenerate()}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Presentation className="size-4" />
              )}
              PPT 생성
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPrompt(preset)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/85 transition hover:bg-white/15"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
