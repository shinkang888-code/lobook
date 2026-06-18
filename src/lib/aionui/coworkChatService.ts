import { buildBookCoworkContext, formatContextForPrompt } from "./bookContext";

function apiKey(): string | undefined {
  return process.env.COWORK_AI_API_KEY || process.env.PPT_AI_API_KEY || process.env.OPENAI_API_KEY;
}

function baseUrl(): string {
  return (
    process.env.COWORK_AI_BASE_URL ||
    process.env.PPT_AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
}

function model(): string {
  return process.env.COWORK_AI_MODEL || process.env.PPT_AI_MODEL || "gpt-4o-mini";
}

export function isCoworkAiEnabled(): boolean {
  return Boolean(apiKey());
}

export async function streamCoworkReply(
  bookId: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  const key = apiKey();
  if (!key) {
    throw new Error("AI API 키가 없습니다. COWORK_AI_API_KEY 또는 OPENAI_API_KEY를 설정하세요.");
  }

  const ctx = await buildBookCoworkContext(bookId);
  const system = `당신은 LoBooK의 AI Cowork 어시스턴트입니다. AionUi Cowork 워크플로와 유사하게, 사용자의 전자책 원고를 바탕으로 실용적이고 구체적인 작업 결과를 한국어로 제공합니다. PPT, Word, Excel, 편집 제안에 능숙합니다.`;

  const messages = [
    { role: "system" as const, content: system },
    ...history.slice(-8),
    {
      role: "user" as const,
      content: formatContextForPrompt(ctx, userMessage),
    },
  ];

  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model(),
      temperature: 0.5,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(err || `AI API 오류 (${res.status})`);
  }

  const encoder = new TextEncoder();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const chunk = json.choices?.[0]?.delta?.content;
              if (chunk) controller.enqueue(encoder.encode(chunk));
            } catch {
              /* skip malformed SSE */
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
