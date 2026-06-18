import type { PptAiRequest, PptGenerationPlan } from "./slideSvgBuilder";
import { planFromMarkdown } from "./slideSvgBuilder";
import { probeNpxCli } from "./pptCliProbe";

type AiSlideJson = {
  deckTitle?: string;
  slides?: Array<{
    title: string;
    subtitle?: string;
    bullets?: string[];
    layout?: "cover" | "content" | "closing";
  }>;
};

export type PptGeminiStatus = {
  apiEnabled: boolean;
  cliAvailable: boolean;
  cliVersion?: string;
  model: string;
  error?: string;
};

export function geminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

export function geminiModel(): string {
  return (
    process.env.PPT_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-2.0-flash-lite"
  );
}

export function hasGeminiApiKey(): boolean {
  return Boolean(geminiApiKey());
}

function buildFallback(request: PptAiRequest): PptGenerationPlan {
  return planFromMarkdown(
    request.bookTitle,
    request.author,
    request.sourceMarkdown,
    request.prompt,
    request.maxSlides ?? 12,
  );
}

function buildSystemPrompt(maxSlides: number): string {
  return `You are a presentation strategist for LoBooK. Return ONLY valid JSON:
{"deckTitle":"string","slides":[{"title":"string","subtitle":"string","bullets":["string"],"layout":"cover|content|closing"}]}
Rules: Korean preferred, ${maxSlides} slides max, first slide cover, last closing, middle content slides with 3-5 bullets each.`;
}

function buildUserPrompt(request: PptAiRequest): string {
  return `Book: ${request.bookTitle}
Author: ${request.author ?? "unknown"}
User command: ${request.prompt}

Source markdown (truncate ok):
${request.sourceMarkdown.slice(0, 12000)}`;
}

function parseGeminiJson(raw: string): PptGenerationPlan | null {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as AiSlideJson;
  if (!parsed.slides?.length) return null;

  const slides = parsed.slides.map((s, i) => ({
    id: `${String(i + 1).padStart(2, "0")}_slide`,
    title: s.title || `슬라이드 ${i + 1}`,
    subtitle: s.subtitle,
    bullets: s.bullets ?? [],
    layout: (s.layout ??
      (i === 0 ? "cover" : i === parsed.slides!.length - 1 ? "closing" : "content")) as
      | "cover"
      | "content"
      | "closing",
  }));

  return {
    deckTitle: parsed.deckTitle || "발표 자료",
    theme: "gemini",
    slides,
  };
}

export async function buildPptPlanWithGeminiApi(
  request: PptAiRequest,
): Promise<PptGenerationPlan> {
  const fallback = buildFallback(request);
  const key = geminiApiKey();
  if (!key) return fallback;

  const maxSlides = request.maxSlides ?? 12;
  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${buildSystemPrompt(maxSlides)}\n\n${buildUserPrompt(request)}`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return fallback;

    const plan = parseGeminiJson(raw);
    if (!plan) return fallback;
    plan.deckTitle = plan.deckTitle || request.bookTitle;
    plan.slides = plan.slides.slice(0, maxSlides);
    return plan;
  } catch {
    return fallback;
  }
}

export async function buildPptPlanWithGeminiCli(
  request: PptAiRequest,
): Promise<PptGenerationPlan | null> {
  const cli = await probeNpxCli("@google/gemini-cli");
  if (!cli.available) return null;

  const maxSlides = request.maxSlides ?? 12;
  const prompt = [
    buildSystemPrompt(maxSlides),
    buildUserPrompt(request),
    "Respond with JSON only, no markdown fences.",
  ].join("\n\n");

  const { spawn } = await import("child_process");
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";

  return new Promise((resolve) => {
    const proc = spawn(
      npx,
      ["@google/gemini-cli", "--prompt", prompt, "--output-format", "json"],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
        env: {
          ...process.env,
          GEMINI_API_KEY: geminiApiKey() || process.env.GEMINI_API_KEY,
        },
      },
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    proc.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      proc.kill();
      resolve(null);
    }, 90000);

    proc.on("close", () => {
      clearTimeout(timer);
      try {
        const text = stdout.trim() || stderr.trim();
        if (!text) {
          resolve(null);
          return;
        }
        const plan = parseGeminiJson(text);
        resolve(plan);
      } catch {
        resolve(null);
      }
    });

    proc.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

export async function buildPptPlanWithGemini(
  request: PptAiRequest,
): Promise<PptGenerationPlan> {
  if (hasGeminiApiKey()) {
    return buildPptPlanWithGeminiApi(request);
  }

  const cliPlan = await buildPptPlanWithGeminiCli(request);
  if (cliPlan) return cliPlan;

  return buildFallback(request);
}

let geminiCliCache: PptGeminiStatus | null = null;
let geminiCliCacheAt = 0;

export async function getPptGeminiStatus(): Promise<PptGeminiStatus> {
  const now = Date.now();
  if (geminiCliCache && now - geminiCliCacheAt < 60000) {
    return geminiCliCache;
  }

  const apiEnabled = hasGeminiApiKey();
  const cli = await probeNpxCli("@google/gemini-cli");

  geminiCliCache = {
    apiEnabled,
    cliAvailable: cli.available,
    cliVersion: cli.version,
    model: geminiModel(),
    error: apiEnabled || cli.available ? undefined : "GEMINI_API_KEY 또는 Gemini CLI 필요",
  };
  geminiCliCacheAt = now;
  return geminiCliCache;
}
