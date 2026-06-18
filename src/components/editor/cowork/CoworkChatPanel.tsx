"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Square, Send, User } from "lucide-react";
import { toast } from "sonner";
import { AION_ASSISTANT_PRESETS } from "@/lib/aionui/aionuiConstants";
import { GeminiStreamBubble } from "./GeminiStreamBubble";
import "./gemini-chat.css";

type Message = { role: "user" | "assistant"; content: string };

type StreamPhase = "idle" | "thinking" | "streaming";

type CoworkChatPanelProps = {
  bookId: string;
  enabled: boolean;
  provider?: string;
};

export function CoworkChatPanel({ bookId, enabled, provider = "gemini" }: CoworkChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<StreamPhase>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loading = phase !== "idle";

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, phase, scrollToBottom]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      if (!enabled) {
        toast.error("AI API 키를 설정하세요. (GEMINI_API_KEY)");
        return;
      }

      const userMsg: Message = { role: "user", content: text.trim() };
      const history = messages;
      setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
      setInput("");
      setPhase("thinking");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/books/${bookId}/cowork/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
          signal: controller.signal,
        });

        const contentType = res.headers.get("content-type") ?? "";

        if (!res.ok) {
          let errMsg = "응답 실패";
          if (contentType.includes("application/json")) {
            const err = await res.json().catch(() => ({}));
            errMsg = (err as { error?: string }).error ?? errMsg;
          } else {
            errMsg = (await res.text()).slice(0, 300) || errMsg;
          }
          throw new Error(errMsg);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림을 받을 수 없습니다.");

        setPhase("streaming");
        let assistant = "";
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

        if (!assistant.trim()) {
          throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도하세요.");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              if (!last.content) copy.pop();
              else last.content += "\n\n[생성 중단됨]";
            }
            return copy;
          });
          return;
        }

        const msg = error instanceof Error ? error.message : "채팅 실패";
        toast.error(msg);
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" && !last.content) copy.pop();
          return copy;
        });
      } finally {
        abortRef.current = null;
        setPhase("idle");
        textareaRef.current?.focus();
      }
    },
    [bookId, enabled, loading, messages],
  );

  return (
    <div className="gemini-chat">
      <div className="gemini-chat-header">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Gemini Studio Chat</p>
            <p className="text-xs text-slate-500">책 원고 컨텍스트 포함 · 실시간 스트리밍 응답</p>
          </div>
          <span className="gemini-chat-badge">
            <Sparkles className="size-3" />
            {provider === "gemini" ? "Gemini" : provider}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="gemini-chat-messages">
        {messages.length === 0 && (
          <div className="gemini-chat-empty">
            <p className="mb-2 font-medium text-slate-700">무엇을 도와드릴까요?</p>
            <p>편집, PPT, Word, Excel 작업을 자연어로 요청하세요. 답변이 화면에 실시간으로 생성됩니다.</p>
            <div className="gemini-chat-presets">
              {AION_ASSISTANT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={loading || !enabled}
                  onClick={() => void send(p.prompt)}
                  className="gemini-chat-preset"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
          const isStreaming = isLastAssistant && phase === "streaming";
          const isThinking = isLastAssistant && phase === "thinking";

          if (m.role === "user") {
            return (
              <div key={i} className="gemini-chat-row gemini-chat-row--user">
                <div className="gemini-chat-avatar gemini-chat-avatar--user">
                  <User className="size-4" />
                </div>
                <div className="gemini-chat-bubble gemini-chat-bubble--user">{m.content}</div>
              </div>
            );
          }

          return (
            <div key={i} className="gemini-chat-row">
              <div className="gemini-chat-avatar gemini-chat-avatar--gemini">
                <Sparkles className="size-4" />
              </div>
              <GeminiStreamBubble
                content={m.content}
                streaming={isStreaming}
                thinking={isThinking}
              />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="gemini-chat-composer">
        <div className="gemini-chat-input-wrap">
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Gemini에게 메시지 보내기…"
            className="gemini-chat-textarea"
            disabled={loading}
          />
          {loading ? (
            <button
              type="button"
              className="gemini-chat-send gemini-chat-stop"
              title="생성 중단"
              onClick={stop}
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              className="gemini-chat-send"
              disabled={!input.trim() || !enabled}
              title="전송"
              onClick={() => void send(input)}
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
