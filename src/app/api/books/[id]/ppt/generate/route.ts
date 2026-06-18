import { NextResponse } from "next/server";
import { getBookStructure } from "@/lib/chapterService";
import { buildPptPlan, type PptAiProvider } from "@/lib/ppt/pptAiService";
import { generatePptxFromPlan, getPptEngineStatus } from "@/lib/ppt/pptExportService";
import type { PptCanvasFormat } from "@/lib/ppt/pptMasterPaths";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const engine = await getPptEngineStatus();
    if (!engine.available) {
      return NextResponse.json(
        { error: engine.error ?? "PPT Master 엔진을 사용할 수 없습니다." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      prompt?: string;
      format?: PptCanvasFormat;
      maxSlides?: number;
      provider?: PptAiProvider;
      theme?: string;
    };

    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }

    const sourceMarkdown = structure.chapters
      .map((c) => `# ${c.title}\n\n${c.content_md}`)
      .join("\n\n");

    const plan = await buildPptPlan({
      prompt: body.prompt?.trim() || "현재 책 내용을 바탕으로 발표용 슬라이드를 만들어 주세요.",
      bookTitle: structure.book.title,
      author: structure.book.author,
      sourceMarkdown,
      maxSlides: body.maxSlides ?? 12,
      provider: body.provider ?? "auto",
    });

    const result = await generatePptxFromPlan(id, plan, body.format ?? "ppt169", body.theme);

    return NextResponse.json({
      fileName: result.fileName,
      slideCount: result.slideCount,
      storagePath: result.storagePath,
      deckTitle: plan.deckTitle,
      provider: body.provider ?? "auto",
      theme: body.theme ?? plan.theme,
      downloadUrl: `/api/books/${id}/ppt/file`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PPT 생성 실패" },
      { status: 500 },
    );
  }
}
