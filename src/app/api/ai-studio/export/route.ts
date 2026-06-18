import { NextResponse } from "next/server";
import { AI_STUDIO_SESSION_ID } from "@/lib/ai-studio/config";
import { generatePptxFromPlan } from "@/lib/ppt/pptExportService";
import { getPptEngineStatus } from "@/lib/ppt/pptExportService";
import type { PptGenerationPlan } from "@/lib/ppt/slideSvgBuilder";
import type { PptCanvasFormat } from "@/lib/ppt/pptMasterPaths";

export async function POST(request: Request) {
  try {
    const engine = await getPptEngineStatus();
    if (!engine.available) {
      return NextResponse.json({ error: engine.error ?? "PPT 엔진을 사용할 수 없습니다." }, { status: 503 });
    }

    const body = (await request.json()) as {
      plan?: PptGenerationPlan;
      format?: PptCanvasFormat;
      theme?: string;
    };

    if (!body.plan?.slides?.length) {
      return NextResponse.json({ error: "슬라이드 플랜이 필요합니다." }, { status: 400 });
    }

    const result = await generatePptxFromPlan(
      AI_STUDIO_SESSION_ID,
      body.plan,
      body.format ?? "ppt169",
      body.theme ?? body.plan.theme,
    );

    return NextResponse.json({
      fileName: result.fileName,
      slideCount: result.slideCount,
      downloadUrl: `/api/ai-studio/export/file?path=${encodeURIComponent(result.storagePath)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PPT보내기 실패" },
      { status: 500 },
    );
  }
}
