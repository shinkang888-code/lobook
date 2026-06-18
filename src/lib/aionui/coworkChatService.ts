import { buildBookCoworkContext, formatContextForPrompt } from "./bookContext";
import { geminiApiKey, geminiModel, hasGeminiApiKey } from "@/lib/ppt/pptGeminiService";
import { geminiModelCandidates, parseGeminiApiError } from "@/lib/ai/geminiErrors";

type CoworkProvider = "openai" | "gemini";

function openaiApiKey(): string | undefined {
  return process.env.COWORK_AI_API_KEY || process.env.PPT_AI_API_KEY || process.env.OPENAI_API_KEY;
}

function coworkProvider(): CoworkProvider {
  const explicit = process.env.COWORK_AI_PROVIDER?.toLowerCase();
  if (explicit === "gemini") return "gemini";
  if (explicit === "openai") return "openai";
  if (hasGeminiApiKey()) return "gemini";
  return "openai";
}

function openaiBaseUrl(): string {
  return (
    process.env.COWORK_AI_BASE_URL ||
    process.env.PPT_AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
}

function openaiModel(): string {
  return process.env.COWORK_AI_MODEL || process.env.PPT_AI_MODEL || "gpt-4o-mini";
}

function coworkGeminiModel(): string {
  return process.env.COWORK_AI_MODEL || process.env.GEMINI_MODEL || geminiModel();
}

const COWORK_SYSTEM = `당신은 LoBooK의 AI Cowork 어시스턴트입니다. AionUi Cowork 워크플로와 유사하게, 사용자의 전자책 원고를 바탕으로 실용적이고 구체적인 작업 결과를 한국어로 제공합니다. PPT, Word, Excel, 편집 제안에 능숙합니다.`;

export function isCoworkAiEnabled(): boolean {
  if (coworkProvider() === "gemini") return hasGeminiApiKey();
  return Boolean(openaiApiKey()) || hasGeminiApiKey();
}

export function getCoworkAiProvider(): CoworkProvider {
  if (coworkProvider() === "gemini" && hasGeminiApiKey()) return "gemini";
  if (openaiApiKey()) return "openai";
  if (hasGeminiApiKey()) return "gemini";
  return coworkProvider();
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return obj.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

function buildGeminiStream(reader: ReadableStreamDefaultReader<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
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
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as unknown;
              const chunk = extractGeminiText(json);
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

async function requestGeminiStream(
  key: string,
  model: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: COWORK_SYSTEM }] },
      contents,
      generationConfig: { temperature: 0.5 },
    }),
  });
}

async function streamCoworkReplyGemini(
  bookId: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  const key = geminiApiKey();
  if (!key) {
    throw new Error("AI API 키가 없습니다. GEMINI_API_KEY를 설정하세요.");
  }

  const ctx = await buildBookCoworkContext(bookId);
  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 4000) }],
    })),
    {
      role: "user",
      parts: [{ text: formatContextForPrompt(ctx, userMessage) }],
    },
  ];

  const models = geminiModelCandidates(coworkGeminiModel());
  let lastError = "";
  let lastStatus = 429;

  for (const model of models) {
    const res = await requestGeminiStream(key, model, contents);

    if (res.status === 429) {
      lastError = await res.text();
      lastStatus = 429;
      continue;
    }

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(parseGeminiApiError(errText, res.status));
    }

    return buildGeminiStream(res.body.getReader());
  }

  throw new Error(parseGeminiApiError(lastError, lastStatus));
}

async function streamCoworkReplyOpenAi(
  bookId: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  const key = openaiApiKey();
  if (!key) {
    throw new Error("AI API 키가 없습니다. COWORK_AI_API_KEY 또는 OPENAI_API_KEY를 설정하세요.");
  }

  const ctx = await buildBookCoworkContext(bookId);
  const messages = [
    { role: "system" as const, content: COWORK_SYSTEM },
    ...history.slice(-6),
    {
      role: "user" as const,
      content: formatContextForPrompt(ctx, userMessage),
    },
  ];

  const res = await fetch(`${openaiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: openaiModel(),
      temperature: 0.5,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(err.length > 200 ? `AI API 오류 (${res.status})` : err || `AI API 오류 (${res.status})`);
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

export async function streamCoworkReply(
  bookId: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
  if (getCoworkAiProvider() === "gemini") {
    return streamCoworkReplyGemini(bookId, userMessage, history);
  }
  return streamCoworkReplyOpenAi(bookId, userMessage, history);
}
