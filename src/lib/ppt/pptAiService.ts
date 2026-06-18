import type { PptAiRequest, PptGenerationPlan } from "./slideSvgBuilder";
import { planFromMarkdown } from "./slideSvgBuilder";
import { buildPptPlanWithGemini, getPptGeminiStatus, hasGeminiApiKey } from "./pptGeminiService";

export type PptAiProvider = "auto" | "openai" | "gemini" | "local";

type AiSlideJson = {
  deckTitle?: string;
  slides?: Array<{
    title: string;
    subtitle?: string;
    bullets?: string[];
    layout?: "cover" | "content" | "closing";
  }>;
};

function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.PPT_AI_API_KEY);
}

function aiBaseUrl(): string {
  return (
    process.env.PPT_AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
}

function aiModel(): string {
  return process.env.PPT_AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function aiApiKey(): string {
  return process.env.PPT_AI_API_KEY || process.env.OPENAI_API_KEY || "";
}

async function buildPptPlanWithOpenAi(request: PptAiRequest): Promise<PptGenerationPlan> {
  const maxSlides = request.maxSlides ?? 12;
  const fallback = planFromMarkdown(
    request.bookTitle,
    request.author,
    request.sourceMarkdown,
    request.prompt,
    maxSlides,
  );

  if (!hasOpenAiKey()) return fallback;

  const system = `You are a presentation strategist for LoBooK. Return ONLY valid JSON:
{"deckTitle":"string","slides":[{"title":"string","subtitle":"string","bullets":["string"],"layout":"cover|content|closing"}]}
Rules: Korean preferred, ${maxSlides} slides max, first slide cover, last closing, middle content slides with 3-5 bullets each.`;

  const user = `Book: ${request.bookTitle}
Author: ${request.author ?? "unknown"}
User command: ${request.prompt}

Source markdown (truncate ok):
${request.sourceMarkdown.slice(0, 12000)}`;

  try {
    const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey()}`,
      },
      body: JSON.stringify({
        model: aiModel(),
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as AiSlideJson;
    if (!parsed.slides?.length) return fallback;

    const slides = parsed.slides.slice(0, maxSlides).map((s, i) => ({
      id: `${String(i + 1).padStart(2, "0")}_slide`,
      title: s.title || `슬라이드 ${i + 1}`,
      subtitle: s.subtitle,
      bullets: s.bullets ?? [],
      layout: (s.layout ?? (i === 0 ? "cover" : i === parsed.slides!.length - 1 ? "closing" : "content")) as
        | "cover"
        | "content"
        | "closing",
    }));

    return {
      deckTitle: parsed.deckTitle || request.bookTitle,
      theme: "openai",
      slides,
    };
  } catch {
    return fallback;
  }
}

export type BuildPptPlanOptions = PptAiRequest & {
  provider?: PptAiProvider;
};

export async function buildPptPlan(options: BuildPptPlanOptions): Promise<PptGenerationPlan> {
  const provider = options.provider ?? "auto";
  const maxSlides = options.maxSlides ?? 12;
  const localFallback = planFromMarkdown(
    options.bookTitle,
    options.author,
    options.sourceMarkdown,
    options.prompt,
    maxSlides,
  );

  if (provider === "local") return localFallback;
  if (provider === "gemini") return buildPptPlanWithGemini(options);
  if (provider === "openai") return buildPptPlanWithOpenAi(options);

  if (hasGeminiApiKey()) {
    const geminiPlan = await buildPptPlanWithGemini(options);
    if (geminiPlan.theme === "gemini") return geminiPlan;
  }
  if (hasOpenAiKey()) {
    const openAiPlan = await buildPptPlanWithOpenAi(options);
    if (openAiPlan.theme === "openai") return openAiPlan;
  }

  return localFallback;
}

export async function getPptAiStatus() {
  const gemini = await getPptGeminiStatus();
  const openaiEnabled = hasOpenAiKey();
  const activeProvider: PptAiProvider = gemini.apiEnabled
    ? "gemini"
    : openaiEnabled
      ? "openai"
      : gemini.cliAvailable
        ? "gemini"
        : "local";

  return {
    enabled: gemini.apiEnabled || openaiEnabled || gemini.cliAvailable,
    model: gemini.apiEnabled || gemini.cliAvailable ? gemini.model : aiModel(),
    provider: activeProvider,
    openai: { enabled: openaiEnabled, model: aiModel() },
    gemini,
  };
}
