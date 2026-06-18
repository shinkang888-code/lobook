"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Monitor } from "lucide-react";
import { CoworkChatPanel } from "./CoworkChatPanel";
import { AionUiEmbed } from "./AionUiEmbed";

type AionCoworkHubProps = {
  bookId: string;
  bookTitle: string;
};

type HubTab = "aion" | "studio";

export function AionCoworkHub({ bookId, bookTitle }: AionCoworkHubProps) {
  const [tab, setTab] = useState<HubTab>("studio");
  const [studioEnabled, setStudioEnabled] = useState(false);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/aionui/status");
    const data = (await res.json()) as { studioChat: { enabled: boolean }; aion: { running: boolean } };
    setStudioEnabled(data.studioChat.enabled);
    if (data.aion.running) setTab("aion");
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Cowork — {bookTitle}</h2>
          <p className="text-xs text-slate-500">
            AionUi 멀티에이전트 + LoBooK 전용 채팅 (확장형 통합)
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("studio")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "studio" ? "bg-[#2b579a] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Bot className="size-3.5" /> Studio Chat
          </button>
          <button
            type="button"
            onClick={() => setTab("aion")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "aion" ? "bg-[#2b579a] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Monitor className="size-3.5" /> AionUi
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "studio" ? (
          <CoworkChatPanel bookId={bookId} enabled={studioEnabled} />
        ) : (
          <AionUiEmbed bookId={bookId} />
        )}
      </div>
    </div>
  );
}
