"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AION_ASSISTANT_PRESETS } from "@/lib/aionui/aionuiConstants";

type Message = { role: "user" | "assistant"; content: string };

type CoworkChatPanelProps = {
  bookId: string;
  enabled: boolean;
};

export function CoworkChatPanel({ bookId, enabled }: CoworkChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      if (!enabled) {
        toast.error("AI API 키를 설정하세요. (GEMINI_API_KEY)");
        return;
      }

      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch(`/api/books/${bookId}/cowork/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history: messages }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "응답 실패");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림 없음");

        let assistant = "";
        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistant += decoder.decode(value, { stream: true });
          const snapshot = assistant;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: snapshot };
            return copy;
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "채팅 실패");
        setMessages((m) => m.filter((_, i) => i !== m.length - 1 || m[m.length - 1].role !== "assistant"));
      } finally {
        setLoading(false);
      }
    },
    [bookId, enabled, loading, messages],
  );

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Studio Cowork Chat</p>
        <p className="text-xs text-slate-500">책 원고 컨텍스트가 자동 포함됩니다 (AionUi 스타일)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AION_ASSISTANT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void send(p.prompt)}
              className="rounded-full border border-[#2b579a]/20 bg-[#2b579a]/5 px-2.5 py-0.5 text-[11px] text-[#2b579a] hover:bg-[#2b579a]/10"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            편집, PPT, Word, Excel 작업을 자연어로 요청하세요. AionUi가 실행 중이면 오른쪽 패널에서
            전체 Cowork 기능을 사용할 수 있습니다.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2b579a]/10 text-[#2b579a]">
                <Bot className="size-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[#2b579a] text-white"
                  : "border border-slate-100 bg-slate-50 text-slate-800"
              }`}
            >
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
            {m.role === "user" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Cowork에게 지시…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2b579a] focus:ring-2 focus:ring-[#2b579a]/20"
            disabled={loading}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0 rounded-xl bg-[#2b579a] hover:bg-[#1e3f6f]"
            disabled={loading || !input.trim()}
            onClick={() => void send(input)}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
