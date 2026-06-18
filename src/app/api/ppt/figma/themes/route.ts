import { NextResponse } from "next/server";
import { listPptThemes } from "@/lib/ppt/pptFigmaTheme";

export async function GET() {
  const themes = await listPptThemes();
  return NextResponse.json({
    themes: themes.map((t) => ({
      id: t.id,
      label: t.label,
      source: t.source,
      accent: t.accent,
    })),
  });
}
