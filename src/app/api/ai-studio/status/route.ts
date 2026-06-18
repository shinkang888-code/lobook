import { NextResponse } from "next/server";
import { getPptAiStatus } from "@/lib/ppt/pptAiService";
import { getPptEngineStatus } from "@/lib/ppt/pptExportService";
import { getPptFigmaStatus, listPptThemes } from "@/lib/ppt/pptFigmaTheme";
import { hasGeminiApiKey } from "@/lib/ppt/pptGeminiService";

export async function GET() {
  const [engine, ai, figma, themes] = await Promise.all([
    getPptEngineStatus(),
    getPptAiStatus(),
    getPptFigmaStatus(),
    listPptThemes(),
  ]);

  return NextResponse.json({
    engine,
    ai,
    figma,
    geminiEnabled: hasGeminiApiKey(),
    themes: themes.map((t) => ({ id: t.id, label: t.label, source: t.source })),
  });
}
