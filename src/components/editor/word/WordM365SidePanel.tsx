"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { M365_WORD_FEATURES } from "@/lib/word/m365WordCatalog";
import {
  countCharacters,
  countWords,
  estimateReadingMinutes,
  extractHeadings,
} from "@/lib/word/wordDocumentUtils";

type WordM365SidePanelProps = {
  bookId: string;
  html: string;
  onInsertToc: () => void;
};

type CatalogResponse = {
  items: { name: string; href: string }[];
  wordDocCount: number;
};

export function WordM365SidePanel({ bookId, html, onInsertToc }: WordM365SidePanelProps) {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState("");

  const words = countWords(html);
  const chars = countCharacters(html);
  const headings = extractHeadings(html);
  const readMin = estimateReadingMinutes(words);

  useEffect(() => {
    void fetch("/api/word/catalog")
      .then((r) => r.json())
      .then((d) => setCatalog(d as CatalogResponse))
      .catch(() => undefined);
  }, []);

  const runCopilot = async (prompt: string) => {
    setCopilotLoading(true);
    setCopilotResult("");
    try {
      const res = await fetch(`/api/books/${bookId}/cowork/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${prompt}\n\n---\n현재 원고:\n${html.slice(0, 8000)}`,
          history: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Copilot 실패");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림 없음");
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setCopilotResult(text);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Copilot 오류");
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <aside className="word-m365-side p-3">
      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--hnc-control-text-color-accent3,#335095)]">
          <FileText className="size-3.5" /> 문서 통계
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
          <div className="rounded border bg-white p-2">
            <span className="text-slate-400">단어</span>
            <p className="text-sm font-semibold text-slate-800">{words.toLocaleString()}</p>
          </div>
          <div className="rounded border bg-white p-2">
            <span className="text-slate-400">글자</span>
            <p className="text-sm font-semibold text-slate-800">{chars.toLocaleString()}</p>
          </div>
          <div className="rounded border bg-white p-2">
            <span className="text-slate-400">제목</span>
            <p className="text-sm font-semibold text-slate-800">{headings.length}</p>
          </div>
          <div className="rounded border bg-white p-2">
            <span className="text-slate-400 flex items-center gap-0.5">
              <Clock className="size-3" /> 읽기
            </span>
            <p className="text-sm font-semibold text-slate-800">{readMin}분</p>
          </div>
        </div>
        {headings.length > 0 && (
          <Button type="button" variant="outline" size="sm" className="mt-2 h-7 w-full text-[10px]" onClick={onInsertToc}>
            목차 블록 삽입
          </Button>
        )}
      </section>

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--hnc-control-text-color-accent3,#335095)]">
          <Sparkles className="size-3.5" /> Copilot
        </h3>
        <div className="flex flex-wrap gap-1">
          {["격식체로 다듬기", "맞춤법 검토", "챕터 소개 작성"].map((label) => (
            <button
              key={label}
              type="button"
              disabled={copilotLoading}
              className="rounded border border-[var(--hnc-control-border-color)] bg-white px-2 py-1 text-[9px] hover:bg-[var(--hnc-control-background-color-hover)]"
              onClick={() => void runCopilot(label)}
            >
              {label}
            </button>
          ))}
        </div>
        {copilotLoading && (
          <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
            <Loader2 className="size-3 animate-spin" /> 생성 중…
          </p>
        )}
        {copilotResult && (
          <div className="mt-2 max-h-40 overflow-auto rounded border bg-white p-2 text-[10px] leading-relaxed text-slate-700">
            {copilotResult}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--hnc-control-text-color-accent3,#335095)]">
          <BookOpen className="size-3.5" /> M365 Word 기능
          {catalog && <span className="font-normal text-slate-400">({catalog.wordDocCount})</span>}
        </h3>
        <ul className="space-y-1.5">
          {M365_WORD_FEATURES.slice(0, 8).map((f) => (
            <li
              key={f.id}
              className="rounded border border-slate-200 bg-white p-2 text-[9px] leading-snug text-slate-600"
            >
              <p className="font-semibold text-slate-800">{f.label}</p>
              <p className="text-slate-500">{f.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
