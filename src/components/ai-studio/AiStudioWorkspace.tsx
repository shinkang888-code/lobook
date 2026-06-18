"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AI_STUDIO_NAME } from "@/lib/ai-studio/config";
import {
  buildSlideSvg,
  type PptGenerationPlan,
  type PptSlidePlan,
} from "@/lib/ppt/slideSvgBuilder";
import type { PptThemeTokens } from "@/lib/ppt/pptFigmaTheme";
import type { PptAiProvider } from "@/lib/ppt/pptAiService";
import type { PptCanvasFormat } from "@/lib/ppt/pptMasterPaths";
import "./ai-studio.css";

const BUILTIN_THEMES: PptThemeTokens[] = [
  {
    id: "lobook",
    label: "LoBooK Classic",
    accent: "#335095",
    bg: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    gradientStart: "#1e3f6f",
    gradientEnd: "#335095",
    coverSubtitle: "#dbeafe",
    coverFooter: "#bfdbfe",
    fontFamily: "Malgun Gothic, Apple SD Gothic Neo, sans-serif",
    source: "builtin",
  },
  {
    id: "figma-light",
    label: "Figma Design System",
    accent: "#6182d6",
    bg: "#ffffff",
    text: "#1a1a1a",
    muted: "#6b7280",
    gradientStart: "#335095",
    gradientEnd: "#6182d6",
    coverSubtitle: "#e8eef8",
    coverFooter: "#c5d4f0",
    fontFamily: "Inter, Malgun Gothic, sans-serif",
    source: "figma",
  },
  {
    id: "corporate",
    label: "Corporate Blue",
    accent: "#2b579a",
    bg: "#f4f6f8",
    text: "#1e293b",
    muted: "#64748b",
    gradientStart: "#1e3a5f",
    gradientEnd: "#2b579a",
    coverSubtitle: "#dbeafe",
    coverFooter: "#93c5fd",
    fontFamily: "Segoe UI, Malgun Gothic, sans-serif",
    source: "builtin",
  },
];

function resolveTheme(id: string): PptThemeTokens {
  return BUILTIN_THEMES.find((t) => t.id === id) ?? BUILTIN_THEMES[0];
}

function emptySlide(index: number): PptSlidePlan {
  return {
    id: `${String(index).padStart(2, "0")}_slide`,
    title: `슬라이드 ${index}`,
    subtitle: "",
    bullets: ["내용을 입력하세요"],
    layout: "content",
  };
}

function SlideSvgPreview({
  slide,
  index,
  total,
  theme,
}: {
  slide: PptSlidePlan;
  index: number;
  total: number;
  theme: PptThemeTokens;
}) {
  const svg = useMemo(
    () => buildSlideSvg(slide, index, total, "0 0 1280 720", theme),
    [slide, index, total, theme],
  );
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function AiStudioWorkspace() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";

  const [prompt, setPrompt] = useState(initialPrompt);
  const [plan, setPlan] = useState<PptGenerationPlan | null>(null);
  const [selected, setSelected] = useState(0);
  const [themeId, setThemeId] = useState("figma-light");
  const [format, setFormat] = useState<PptCanvasFormat>("ppt169");
  const [provider, setProvider] = useState<PptAiProvider>("auto");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);

  const theme = resolveTheme(themeId);
  const slides = plan?.slides ?? [];
  const activeSlide = slides[selected];

  useEffect(() => {
    void fetch("/api/ai-studio/status")
      .then((r) => r.json())
      .then((d) => setGeminiEnabled(Boolean(d.geminiEnabled)))
      .catch(() => setGeminiEnabled(false));
  }, []);

  const generatePlan = useCallback(async (text?: string) => {
    const p = (text ?? prompt).trim();
    if (!p) {
      toast.error("AI 명령을 입력하세요.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai-studio/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, maxSlides: 10, provider, theme: themeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setPlan(data.plan as PptGenerationPlan);
      setSelected(0);
      toast.success(`${(data.plan as PptGenerationPlan).slides.length}개 프레임이 생성되었습니다.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI 생성 실패");
    } finally {
      setGenerating(false);
    }
  }, [prompt, provider, themeId]);

  useEffect(() => {
    if (initialPrompt.trim()) void generatePlan(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSlide = (patch: Partial<PptSlidePlan>) => {
    if (!plan || !activeSlide) return;
    const next = [...plan.slides];
    next[selected] = { ...activeSlide, ...patch };
    setPlan({ ...plan, slides: next });
  };

  const addFrame = () => {
    const base = plan ?? { deckTitle: "새 프레젠테이션", theme: themeId, slides: [] };
    const next = [...base.slides, emptySlide(base.slides.length + 1)];
    setPlan({ ...base, slides: next });
    setSelected(next.length - 1);
  };

  const removeFrame = () => {
    if (!plan || plan.slides.length <= 1) return;
    const next = plan.slides.filter((_, i) => i !== selected);
    setPlan({ ...plan, slides: next });
    setSelected(Math.max(0, selected - 1));
  };

  const exportPptx = async () => {
    if (!plan?.slides.length) {
      toast.error("보낼 슬라이드가 없습니다.");
      return;
    }
    setExporting(true);
    try {
      const res = await fetch("/api/ai-studio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: { ...plan, theme: themeId }, format, theme: themeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "보내기 실패");
      window.open(data.downloadUrl, "_blank");
      toast.success("PPTX 파일이 준비되었습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "보내기 실패");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ai-studio-root">
      <header className="ai-studio-toolbar">
        <div className="ai-studio-brand">
          <Sparkles className="size-4 text-[#1a73e8]" />
          {AI_STUDIO_NAME}
        </div>
        <span className="text-[11px] text-gray-500">
          {geminiEnabled ? "Gemini 연동" : "Gemini 키 미설정 — 로컬 폴백"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            className="h-8 rounded-md border border-gray-200 px-2 text-xs"
          >
            {BUILTIN_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as PptCanvasFormat)}
            className="h-8 rounded-md border border-gray-200 px-2 text-xs"
          >
            <option value="ppt169">16:9</option>
            <option value="ppt43">4:3</option>
          </select>
          <Button size="sm" variant="outline" disabled={exporting || !plan} onClick={() => void exportPptx()}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PPTX
          </Button>
        </div>
      </header>

      <div className="ai-studio-body">
        <aside className="ai-studio-frames">
          <div className="ai-studio-frames-header flex items-center justify-between">
            <span>프레임</span>
            <button type="button" className="text-[#1a73e8]" onClick={addFrame} title="프레임 추가">
              <Plus className="size-4" />
            </button>
          </div>
          <div className="ai-studio-frame-list">
            {slides.length === 0 && (
              <p className="p-3 text-center text-xs text-gray-400">AI로 프레임을 생성하세요</p>
            )}
            {slides.map((slide, i) => (
              <button
                key={slide.id + i}
                type="button"
                className={`ai-studio-frame-item ${selected === i ? "ai-studio-frame-item--active" : ""}`}
                onClick={() => setSelected(i)}
              >
                <div className="ai-studio-frame-thumb">
                  <SlideSvgPreview slide={slide} index={i} total={slides.length} theme={theme} />
                </div>
                <span className="ai-studio-frame-label">
                  {i + 1}. {slide.title}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="ai-studio-canvas-zone">
          <div className="ai-studio-canvas-bar">
            {activeSlide ? (
              <>
                <span className="font-medium text-gray-700">{activeSlide.layout}</span>
                <span>·</span>
                <span>
                  프레임 {selected + 1} / {slides.length || 1}
                </span>
              </>
            ) : (
              <span>캔버스</span>
            )}
          </div>
          <div className="ai-studio-canvas-viewport">
            {activeSlide ? (
              <div className="ai-studio-canvas-frame">
                <SlideSvgPreview
                  slide={activeSlide}
                  index={selected}
                  total={slides.length}
                  theme={theme}
                />
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                <Wand2 className="mx-auto mb-3 size-10 text-gray-300" />
                하단에 작업을 입력하고 AI 생성을 눌러 주세요
              </div>
            )}
          </div>
        </section>

        <aside className="ai-studio-inspector">
          <div className="ai-studio-inspector-header flex items-center justify-between">
            <span>디자인</span>
            {plan && (
              <button type="button" className="text-red-500" onClick={removeFrame} title="프레임 삭제">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <div className="ai-studio-inspector-body">
            {activeSlide ? (
              <>
                <div className="ai-studio-field">
                  <label>레이아웃</label>
                  <select
                    value={activeSlide.layout}
                    onChange={(e) =>
                      updateSlide({ layout: e.target.value as PptSlidePlan["layout"] })
                    }
                  >
                    <option value="cover">표지</option>
                    <option value="content">본문</option>
                    <option value="closing">마무리</option>
                  </select>
                </div>
                <div className="ai-studio-field">
                  <label>제목</label>
                  <input
                    value={activeSlide.title}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div className="ai-studio-field">
                  <label>부제</label>
                  <input
                    value={activeSlide.subtitle ?? ""}
                    onChange={(e) => updateSlide({ subtitle: e.target.value })}
                  />
                </div>
                <div className="ai-studio-field">
                  <label>불릿 (줄바꿈 구분)</label>
                  <textarea
                    rows={6}
                    value={activeSlide.bullets.join("\n")}
                    onChange={(e) =>
                      updateSlide({
                        bullets: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400">프레임을 선택하면 속성을 편집할 수 있습니다.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="ai-studio-prompt-bar">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void generatePlan();
            }
          }}
          placeholder="예: 퀀텀 투자 주제로 8장 발표 PPT 구조를 만들어줘"
          className="ai-studio-prompt-input"
          disabled={generating}
        />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as PptAiProvider)}
          className="h-9 rounded-md border border-gray-200 px-2 text-xs"
        >
          <option value="auto">자동</option>
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
        <Button disabled={generating} onClick={() => void generatePlan()}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI 생성
        </Button>
      </div>
    </div>
  );
}
