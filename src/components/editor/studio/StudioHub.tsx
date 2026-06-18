"use client";

import { useState } from "react";
import { Bot, Layers, Sparkles } from "lucide-react";
import { AionCoworkHub } from "@/components/editor/cowork/AionCoworkHub";
import { ArchitectureHub } from "@/components/editor/architecture/ArchitectureHub";
import "../libreoffice/libreoffice-shell.css";

type StudioTab = "cowork" | "architecture";

type StudioHubProps = {
  bookId: string;
  bookTitle: string;
  initialTab?: StudioTab;
};

export function StudioHub({ bookId, bookTitle, initialTab = "cowork" }: StudioHubProps) {
  const [tab, setTab] = useState<StudioTab>(initialTab);

  return (
    <div className="lo-hub h-full">
      <div className="lo-hub-toolbar">
        <button
          type="button"
          className={`lo-hub-tab ${tab === "cowork" ? "lo-hub-tab--active" : ""}`}
          onClick={() => setTab("cowork")}
        >
          <Bot className="mr-1 inline size-3.5" />
          AI Cowork
        </button>
        <button
          type="button"
          className={`lo-hub-tab ${tab === "architecture" ? "lo-hub-tab--active" : ""}`}
          onClick={() => setTab("architecture")}
        >
          <Layers className="mr-1 inline size-3.5" />
          아키텍처
        </button>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-violet-700">
          <Sparkles className="size-3" />
          LoBooK 확장 (Loffice 비중복)
        </span>
      </div>
      <div className="lo-hub-body">
        {tab === "cowork" ? (
          <AionCoworkHub bookId={bookId} bookTitle={bookTitle} />
        ) : (
          <ArchitectureHub bookId={bookId} bookTitle={bookTitle} />
        )}
      </div>
    </div>
  );
}
