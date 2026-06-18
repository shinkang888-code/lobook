"use client";

import { useState } from "react";
import { FolderOpen, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { AI_STUDIO_NAME } from "@/lib/ai-studio/config";
import { LOOFFICE_HOME_URL } from "@/lib/branding";
import "./ai-studio-landing.css";

export function AiStudioLanding() {
  const [prompt, setPrompt] = useState("");

  const openWorkspace = () => {
    const q = prompt.trim();
    const url = q
      ? `/ai-studio/workspace?prompt=${encodeURIComponent(q)}`
      : "/ai-studio/workspace";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="ai-landing">
      <header className="ai-landing-header">
        <a href={LOOFFICE_HOME_URL} target="_blank" rel="noopener noreferrer" className="ai-landing-logo">
          <Image src="/looffice-logo.png" alt="LOFFICE" width={140} height={40} className="h-9 w-auto" priority />
        </a>
        <span className="ai-landing-badge">
          <Sparkles className="size-3" />
          {AI_STUDIO_NAME}
        </span>
      </header>

      <main className="ai-landing-main">
        <div className="ai-landing-badges">
          {["HWP", "PDF", "AI", "DOC", "PPT"].map((b) => (
            <span key={b} className="ai-landing-pill">
              {b}
            </span>
          ))}
        </div>
        <p className="ai-landing-eyebrow">LOFFICE AI</p>
        <h1 className="ai-landing-title">브라우저 하나로 모든 문서 업무를</h1>
        <p className="ai-landing-sub">
          HWP · Office · PDF · AI — Gemini로 PPT·문서를 설계하는 {AI_STUDIO_NAME}
        </p>

        <div className="ai-landing-chat">
          <div className="ai-landing-chat-input-wrap">
            <Sparkles className="size-4 shrink-0 text-[#1a73e8]" />
            <textarea
              value={prompt}
              rows={2}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  openWorkspace();
                }
              }}
              placeholder="AI에게 지시하세요 — 예: 퀀텀 투자 발표 PPT 10장 만들어줘"
              className="ai-landing-chat-input"
            />
            <button type="button" className="ai-landing-chat-send" onClick={openWorkspace}>
              <Send className="size-4" />
              <span>Studio 열기</span>
            </button>
          </div>
        </div>

        <div className="ai-landing-doc-row">
          <a
            href={LOOFFICE_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ai-landing-doc-btn"
          >
            <FolderOpen className="size-4" />
            문서 열기
          </a>
          <p className="ai-landing-doc-hint">Loffice 포털에서 HWP · DOCX · PDF를 바로 엽니다</p>
        </div>
      </main>
    </div>
  );
}
