"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Layers,
  Loader2,
  Network,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_CATEGORIES,
  ARCHITECTURE_PATTERNS,
  BOOK_STUDIO_STACK,
  MODULE_LABELS,
  patternsByCategory,
  type ArchitectureCategory,
} from "@/lib/architecture/architectureCatalog";
import { BOOK_STUDIO_ARCHITECTURE_MERMAID } from "@/lib/architecture/bookArchitectureAdvisor";
import "./architecture-hub.css";

type ArchitectureHubProps = {
  bookId: string;
  bookTitle: string;
};

type HubTab = "overview" | "patterns" | "advise" | "diagram";

type CatalogResponse = {
  archDocCount: number;
  items: { name: string; href: string }[];
};

type AdviseResponse = {
  bookTitle: string;
  chapterCount: number;
  activeModules: string[];
  healthScore: number;
  summary: string;
  recommendations: {
    pattern: { id: string; label: string; description: string; learnUrl?: string; category: string };
    reason: string;
    score: number;
  }[];
};

const CATEGORY_COLORS: Record<ArchitectureCategory, string> = {
  "ai-rag": "bg-violet-100 text-violet-800",
  document: "bg-emerald-100 text-emerald-800",
  "web-app": "bg-blue-100 text-blue-800",
  "design-principles": "bg-amber-100 text-amber-800",
  patterns: "bg-slate-100 text-slate-800",
  deployment: "bg-cyan-100 text-cyan-800",
};

export function ArchitectureHub({ bookId, bookTitle }: ArchitectureHubProps) {
  const [tab, setTab] = useState<HubTab>("overview");
  const [category, setCategory] = useState<ArchitectureCategory | "all">("all");
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [advise, setAdvise] = useState<AdviseResponse | null>(null);
  const [loadingAdvise, setLoadingAdvise] = useState(false);

  useEffect(() => {
    void fetch("/api/architecture/catalog")
      .then((r) => r.json())
      .then((d) => setCatalog(d as CatalogResponse))
      .catch(() => undefined);
  }, []);

  const loadAdvise = useCallback(async () => {
    setLoadingAdvise(true);
    try {
      const res = await fetch(`/api/books/${bookId}/architecture/advise`);
      if (!res.ok) throw new Error("진단 실패");
      setAdvise((await res.json()) as AdviseResponse);
    } catch {
      setAdvise(null);
    } finally {
      setLoadingAdvise(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (tab === "advise") void loadAdvise();
  }, [tab, loadAdvise]);

  const filteredPatterns =
    category === "all" ? ARCHITECTURE_PATTERNS : patternsByCategory(category);

  return (
    <div className="arch-hub h-full min-h-0">
      <header className="arch-hub-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Layers className="size-5" />
              Architecture Hub — {bookTitle}
            </h2>
            <p className="mt-1 text-xs text-blue-100">
              Azure Architecture Center 패턴을 Book Studio에 매핑 ·{" "}
              <a
                href="https://learn.microsoft.com/azure/architecture"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                learn.microsoft.com/azure/architecture
              </a>
            </p>
          </div>
          {catalog && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px]">
              {catalog.archDocCount}개 문서 연동
            </span>
          )}
        </div>
      </header>

      <nav className="arch-hub-tabs">
        {(
          [
            ["overview", "개요", BookOpen],
            ["patterns", "패턴 카탈로그", Sparkles],
            ["advise", "책 진단", Target],
            ["diagram", "아키텍처", Network],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={`arch-hub-tab ${tab === id ? "arch-hub-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="flex items-center gap-1">
              <Icon className="size-3" />
              {label}
            </span>
          </button>
        ))}
      </nav>

      <div className="arch-hub-body">
        {tab === "overview" && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="arch-card">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Book Studio 스택</h3>
              <dl className="grid gap-2 text-[11px]">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">Frontend</dt>
                  <dd className="text-slate-700">{BOOK_STUDIO_STACK.frontend}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">배포</dt>
                  <dd className="text-slate-700">{BOOK_STUDIO_STACK.deployment}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">저장소</dt>
                  <dd className="text-slate-700">{BOOK_STUDIO_STACK.storage}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">AI</dt>
                  <dd className="text-slate-700">{BOOK_STUDIO_STACK.ai}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">문서 엔진</dt>
                  <dd className="text-slate-700">{BOOK_STUDIO_STACK.documentEngines.join(" · ")}</dd>
                </div>
              </dl>
            </div>

            <div className="arch-card">
              <h3 className="mb-2 text-sm font-bold text-slate-800">업그레이드 방향</h3>
              <ul className="space-y-2 text-[11px] leading-relaxed text-slate-600">
                <li>
                  <strong className="text-slate-800">RAG 패턴</strong> — 챕터 단위 청킹으로 Cowork·Word Copilot 컨텍스트 품질 향상
                </li>
                <li>
                  <strong className="text-slate-800">문서 처리</strong> — HWP/DOCX/PDF 멀티모달 import → export 파이프라인 표준화
                </li>
                <li>
                  <strong className="text-slate-800">Modern Web App</strong> — Next.js API Routes + Vercel 서버리스 운영 모범 사례
                </li>
                <li>
                  <strong className="text-slate-800">설계 원칙</strong> — 자가 치유·관리형 서비스로 import/AI 실패 시 폴백
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <span key={key} className="arch-module-chip">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === "patterns" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={`arch-hub-tab text-[10px] ${category === "all" ? "arch-hub-tab--active" : ""}`}
                onClick={() => setCategory("all")}
              >
                전체 ({ARCHITECTURE_PATTERNS.length})
              </button>
              {ARCHITECTURE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`arch-hub-tab text-[10px] ${category === c.id ? "arch-hub-tab--active" : ""}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPatterns.map((p) => (
                <div key={p.id} className="arch-card flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{p.label}</h4>
                    <span className={`arch-badge ${p.priority === "high" ? "arch-badge--high" : ""}`}>
                      {p.priority}
                    </span>
                  </div>
                  <span className={`inline-block w-fit rounded px-2 py-0.5 text-[9px] ${CATEGORY_COLORS[p.category]}`}>
                    {ARCHITECTURE_CATEGORIES.find((c) => c.id === p.category)?.label}
                  </span>
                  <p className="flex-1 text-[10px] leading-snug text-slate-600">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.bookStudioModules.map((m) => (
                      <span key={m} className="arch-module-chip">
                        {MODULE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                  {p.learnUrl && (
                    <a
                      href={p.learnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-[#0078d4] hover:underline"
                    >
                      Microsoft Learn <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "advise" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">책별 아키텍처 진단</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                disabled={loadingAdvise}
                onClick={() => void loadAdvise()}
              >
                {loadingAdvise ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                다시 진단
              </Button>
            </div>

            {loadingAdvise && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin" /> 분석 중…
              </p>
            )}

            {advise && !loadingAdvise && (
              <>
                <div className="arch-card flex items-center gap-6">
                  <div className="arch-score-ring">{advise.healthScore}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{advise.bookTitle}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{advise.summary}</p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {advise.chapterCount}개 챕터 · {advise.activeModules.length}개 활성 모듈
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {advise.activeModules.map((m) => (
                    <span key={m} className="arch-module-chip">
                      {MODULE_LABELS[m as keyof typeof MODULE_LABELS] ?? m}
                    </span>
                  ))}
                </div>

                <ul className="space-y-2">
                  {advise.recommendations.map((r, i) => (
                    <li key={r.pattern.id} className="arch-card">
                      <div className="flex items-start gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0078d4] text-[9px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">{r.pattern.label}</p>
                          <p className="mt-1 text-[10px] text-slate-600">{r.reason}</p>
                          {r.pattern.learnUrl && (
                            <a
                              href={r.pattern.learnUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[9px] text-[#0078d4]"
                            >
                              Learn 문서 <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{r.score}pt</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === "diagram" && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="arch-card">
              <h3 className="mb-2 text-sm font-bold text-slate-800">Book Studio 시스템 다이어그램</h3>
              <p className="mb-3 text-[10px] text-slate-500">
                Azure Architecture Center 스타일 — 클라이언트·API·엔진·AI·저장소 계층
              </p>
              <pre className="arch-mermaid">{BOOK_STUDIO_ARCHITECTURE_MERMAID}</pre>
            </div>
            <p className="text-center text-[10px] text-slate-400">
              Mermaid 호환 · Architecture Center{" "}
              <a
                href="https://github.com/shinkang888-code/architecture-center"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0078d4] hover:underline"
              >
                shinkang888-code/architecture-center
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
