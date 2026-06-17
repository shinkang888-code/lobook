import {
  ARCHITECTURE_PATTERNS,
  MODULE_LABELS,
  type ArchitecturePattern,
  type BookStudioModule,
} from "./architectureCatalog";
import type { BookStructure } from "@/lib/types";

export type ArchitectureRecommendation = {
  pattern: ArchitecturePattern;
  reason: string;
  score: number;
};

export type BookArchitectureReport = {
  bookTitle: string;
  chapterCount: number;
  activeModules: BookStudioModule[];
  recommendations: ArchitectureRecommendation[];
  healthScore: number;
  summary: string;
};

function detectModules(structure: BookStructure): BookStudioModule[] {
  const modules = new Set<BookStudioModule>(["vercel-hosting"]);

  if (structure.chapters.length > 0) {
    modules.add("export-pipeline");
  }

  const sources = structure.chapters.map((c) => c.primary_source).filter(Boolean);
  if (sources.some((s) => s === "hwp")) modules.add("hwp-editor");
  if (sources.some((s) => s === "word")) modules.add("word-editor");
  if (sources.some((s) => s === "markdown")) modules.add("markitdown");

  const book = structure.book;
  if (book.hwp_import_path || book.hwp_import_name) {
    modules.add("import-pipeline");
    modules.add("hwp-editor");
  }

  const totalChars = structure.chapters.reduce(
    (sum, c) => sum + (c.content_md?.length ?? 0) + (c.content_html?.length ?? 0),
    0,
  );
  if (totalChars > 5000) modules.add("cowork-chat");
  if (structure.chapters.length >= 3) modules.add("ppt-generation");

  modules.add("import-pipeline");
  modules.add("export-pipeline");

  return [...modules];
}

function scorePattern(pattern: ArchitecturePattern, modules: BookStudioModule[], structure: BookStructure): number {
  const overlap = pattern.bookStudioModules.filter((m) => modules.includes(m)).length;
  if (overlap === 0) return 0;

  let score = overlap * 10;
  if (pattern.priority === "high") score += 15;
  if (pattern.priority === "medium") score += 8;

  if (pattern.id === "rag-solution" && structure.chapters.length >= 2) score += 20;
  if (pattern.id === "rag-chunking" && structure.chapters.length >= 5) score += 15;
  if (pattern.id === "doc-multi-modal" && modules.includes("hwp-editor")) score += 20;
  if (pattern.id === "doc-generate" && structure.chapters.length >= 1) score += 12;
  if (pattern.id === "modern-web-app") score += 5;

  return score;
}

function buildReason(pattern: ArchitecturePattern, modules: BookStudioModule[], structure: BookStructure): string {
  const active = pattern.bookStudioModules.filter((m) => modules.includes(m));
  const labels = active.map((m) => MODULE_LABELS[m]).join(", ");

  if (pattern.id === "rag-solution") {
    return `《${structure.book.title}》 ${structure.chapters.length}개 챕터 원고를 AI Cowork에 전달 — ${labels} 모듈에 RAG 적용 권장`;
  }
  if (pattern.id === "doc-multi-modal" && modules.includes("hwp-editor")) {
    return "HWP/HWPX 가져오기 사용 중 — 다형식 문서 처리 패턴으로 파이프라인 안정화";
  }
  if (pattern.id === "doc-generate") {
    return `${structure.chapters.length}개 챕터 → EPUB/DOCX/PPT보내기 파이프라인에 적용`;
  }
  if (pattern.id === "modern-web-app") {
    return "Book Studio Next.js + Vercel 스택에 Modern Web App 패턴 정합";
  }
  return `${labels} 모듈과 연관된 ${pattern.label} 패턴`;
}

export function adviseBookArchitecture(structure: BookStructure): BookArchitectureReport {
  const activeModules = detectModules(structure);

  const scored = ARCHITECTURE_PATTERNS.map((pattern) => ({
    pattern,
    score: scorePattern(pattern, activeModules, structure),
    reason: buildReason(pattern, activeModules, structure),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const recommendations: ArchitectureRecommendation[] = scored.slice(0, 8).map((s) => ({
    pattern: s.pattern,
    reason: s.reason,
    score: s.score,
  }));

  const maxPossible = 80;
  const healthScore = Math.min(
    100,
    Math.round((recommendations.reduce((sum, r) => sum + r.score, 0) / maxPossible) * 100),
  );

  const summary =
    structure.chapters.length === 0
      ? "챕터가 없습니다. 가져오기 또는 새 챕터 추가 후 아키텍처 진단을 다시 실행하세요."
      : `${structure.chapters.length}개 챕터, ${activeModules.length}개 활성 모듈 — Azure Architecture Center 기준 ${recommendations.length}개 패턴 권장`;

  return {
    bookTitle: structure.book.title,
    chapterCount: structure.chapters.length,
    activeModules,
    recommendations,
    healthScore,
    summary,
  };
}

export const BOOK_STUDIO_ARCHITECTURE_MERMAID = `flowchart TB
  subgraph Client["클라이언트"]
    UI[Book Studio UI]
    Tabs[편집기 탭 MD/HTML/Word/HWP/PDF]
    ArchHub[Architecture Hub]
  end

  subgraph API["Next.js API Routes"]
    Import[Import API]
    Export[Export API]
    Cowork[Cowork Chat API]
    Arch[Architecture API]
  end

  subgraph Engines["문서 엔진"]
    TipTap[TipTap HTML]
    Eigenpal[eigenpal DOCX]
    RHWP[RHWP HWP]
    MarkItDown[MarkItDown]
  end

  subgraph AI["AI 레이어"]
    OpenAI[OpenAI API]
    AionUi[AionUi Agents]
    RAG[RAG 컨텍스트]
  end

  subgraph Storage["저장소"]
    Supabase[(Supabase)]
    Local[(.data 로컬)]
  end

  UI --> Tabs
  UI --> ArchHub
  Tabs --> Import
  Tabs --> Export
  ArchHub --> Arch
  Import --> Engines
  Export --> Engines
  Cowork --> RAG
  RAG --> OpenAI
  Cowork --> AionUi
  Import --> Storage
  Export --> Storage
  API --> Storage`;
