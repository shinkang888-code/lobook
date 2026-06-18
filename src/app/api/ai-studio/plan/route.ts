import { NextResponse } from "next/server";
import { buildPptPlan, getPptAiStatus, type PptAiProvider } from "@/lib/ppt/pptAiService";
import { listPptThemes } from "@/lib/ppt/pptFigmaTheme";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      maxSlides?: number;
      provider?: PptAiProvider;
      theme?: string;
      deckTitle?: string;
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt가 필요합니다." }, { status: 400 });
    }

    const plan = await buildPptPlan({
      prompt,
      bookTitle: body.deckTitle?.trim() || "Loffice AI Studio",
      author: "LoBooK",
      sourceMarkdown: prompt,
      maxSlides: body.maxSlides ?? 10,
      provider: body.provider ?? "auto",
    });

    if (body.theme) plan.theme = body.theme;

    const [ai, themes] = await Promise.all([getPptAiStatus(), listPptThemes()]);

    return NextResponse.json({ plan, ai, themes: themes.map((t) => ({ id: t.id, label: t.label, source: t.source })) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "플랜 생성 실패" },
      { status: 500 },
    );
  }
}
