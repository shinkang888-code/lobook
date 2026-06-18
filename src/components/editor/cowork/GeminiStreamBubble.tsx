"use client";

type GeminiStreamBubbleProps = {
  content: string;
  streaming?: boolean;
  thinking?: boolean;
};

export function GeminiStreamBubble({ content, streaming, thinking }: GeminiStreamBubbleProps) {
  if (thinking && !content) {
    return (
      <div className="gemini-chat-bubble gemini-chat-bubble--assistant gemini-chat-bubble--thinking">
        Gemini가 답변을 생성하는 중
        <span className="gemini-thinking-dots ml-1">
          <span />
          <span />
          <span />
        </span>
      </div>
    );
  }

  return (
    <div className="gemini-chat-bubble gemini-chat-bubble--assistant">
      {content}
      {streaming && <span className="gemini-stream-cursor" aria-hidden />}
    </div>
  );
}
