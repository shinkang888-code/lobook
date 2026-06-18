"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Presentation,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Palette,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LofficeHomeLink } from "@/components/brand/LofficeLogo";
import type { PptCanvasFormat } from "@/lib/ppt/pptMasterPaths";
import type { PptAiProvider } from "@/lib/ppt/pptAiService";

type PptStatus = {
  engine: { available: boolean; error?: string };
  ai: {
    enabled: boolean;
    model: string;
    provider: PptAiProvider;
    openai: { enabled: boolean; model: string };
    gemini: {
      apiEnabled: boolean;
      cliAvailable: boolean;
      cliVersion?: string;
      model: string;
    };
  };
  figma: {
    cliAvailable: boolean;
    cliVersion?: string;
    apiEnabled: boolean;
    themeCount: number;
  };
  themes: Array<{ id: string; label: string; source?: string }>;
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

const PROVIDER_LABELS: Record<PptAiProvider, string> = {
  auto: "자동",
  gemini: "Gemini",
  openai: "OpenAI",
  local: "로컬",
};

function providerHint(status: PptStatus | null, provider: PptAiProvider): string {
  if (!status) return "";
  if (provider === "gemini") {
    if (status.ai.gemini.apiEnabled) return status.ai.gemini.model;
    if (status.ai.gemini.cliAvailable) return `CLI ${status.ai.gemini.cliVersion ?? ""}`.trim();
    return "API 키 또는 CLI 필요";
  }
  if (provider === "openai") {
    return status.ai.openai.enabled ? status.ai.openai.model : "API 키 필요";
  }
  if (provider === "local") return "마크다운 플래너";
  if (status.ai.gemini.apiEnabled || status.ai.gemini.cliAvailable) return "Gemini 우선";
  if (status.ai.openai.enabled) return status.ai.openai.model;
  return "로컬 플래너";
}

export function AiCommandBar({ bookId, bookTitle, onGenerated, onOpenCowork }: AiCommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<PptCanvasFormat>("ppt169");
  const [maxSlides, setMaxSlides] = useState(10);
  const [provider, setProvider] = useState<PptAiProvider>("auto");
  const [themeId, setThemeId] = useState("lobook");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PptStatus | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ppt/status");
      const data = (await res.json()) as PptStatus;
      setStatus(data);
      setThemeId((prev) => {
        if (data.themes?.length && !data.themes.some((t) => t.id === prev)) {
          return data.themes[0].id;
        }
        return prev;
      });
      const latest = await fetch(`/api/books/${bookId}/ppt/latest`);
      if (latest.ok) {
        const latestData = await latest.json();
        setLastFile(latestData.fileName);
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
        body: JSON.stringify({ prompt, format, maxSlides, provider, theme: themeId }),
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
  const geminiReady = status?.ai.gemini.apiEnabled || status?.ai.gemini.cliAvailable;
  const figmaReady = status?.figma.cliAvailable || status?.figma.apiEnabled;

  return (
    <div className="hancom-ai-bar shrink-0 px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <LofficeHomeLink variant="logo" className="shrink-0" />

            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-sm font-semibold tracking-tight text-[var(--hnc-control-text-color-accent3)]">
                AI 프레젠테이션 스튜디오
              </p>
              <p className="truncate text-[11px] text-slate-500">
                PPT Master · {bookTitle || "제목 없음"} · {providerHint(status, provider)}
              </p>
            </div>

            <LofficeHomeLink variant="button" className="shrink-0" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:justify-end">
            {engineOk ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                <CheckCircle2 className="size-3" /> PPT 엔진 준비
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                <AlertCircle className="size-3" /> setup:ppt-master 필요
              </span>
            )}
            {geminiReady ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">
                <Cpu className="size-3" /> Gemini
                {status?.ai.gemini.cliVersion ? ` ${status.ai.gemini.cliVersion}` : ""}
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                <Cpu className="size-3" /> Gemini 미연결
              </span>
            )}
            {figmaReady ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-pink-800">
                <Palette className="size-3" /> Figma
                {status?.figma.cliVersion ? ` ${status?.figma.cliVersion}` : ""}
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                <Palette className="size-3" /> Figma 기본 테마
              </span>
            )}
            {lastFile && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 max-w-[200px] shrink-0 gap-1"
                onClick={handleDownload}
              >
                <Download className="size-3.5 shrink-0" />
                <span className="truncate">{lastFile}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Wand2 className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 이 책 내용으로 투자자 발표용 8장 슬라이드를 만들어줘. 핵심 메시지와 bullet 위주로."
              rows={2}
              className="w-full resize-none rounded-xl border border-[var(--hnc-control-border-color)] bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--hnc-control-border-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--hnc-control-border-color-hover)]/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as PptAiProvider)}
              title="AI 엔진"
              className="h-9 rounded-lg border border-[var(--hnc-control-border-color)] bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--hnc-control-border-color-hover)]/30"
            >
              {(Object.keys(PROVIDER_LABELS) as PptAiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>

            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              title="Figma 테마"
              className="h-9 max-w-[140px] rounded-lg border border-[var(--hnc-control-border-color)] bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--hnc-control-border-color-hover)]/30"
            >
              {(status?.themes ?? [{ id: "lobook", label: "LoBooK Classic" }]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="flex overflow-hidden rounded-lg border border-[var(--hnc-control-border-color)] bg-white">
              {(["ppt169", "ppt43"] as PptCanvasFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 text-xs font-medium transition ${
                    format === f
                      ? "bg-[var(--hnc-control-text-color-accent3)] text-white"
                      : "text-slate-600 hover:bg-[var(--hnc-control-background-color-hover)]"
                  }`}
                >
                  {f === "ppt169" ? "16:9" : "4:3"}
                </button>
              ))}
            </div>

            <select
              value={maxSlides}
              onChange={(e) => setMaxSlides(Number(e.target.value))}
              className="h-9 rounded-lg border border-[var(--hnc-control-border-color)] bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--hnc-control-border-color-hover)]/30"
            >
              {[6, 8, 10, 12, 16].map((n) => (
                <option key={n} value={n} className="text-slate-900">
                  {n}장
                </option>
              ))}
            </select>

            {onOpenCowork && (
              <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={onOpenCowork}>
                <Bot className="size-4" />
                Cowork
              </Button>
            )}

            <Button
              type="button"
              disabled={loading || !engineOk}
              className="h-9 gap-2 bg-[var(--hnc-control-text-color-accent3)] text-white hover:opacity-90"
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
              className="rounded-full border border-[var(--hnc-control-border-color)] bg-white px-3 py-1 text-[11px] text-slate-600 transition hover:bg-[var(--hnc-control-background-color-hover)]"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
