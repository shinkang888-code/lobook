import { NextResponse } from "next/server";
import { readPptxBuffer } from "@/lib/ppt/pptExportService";
import { getLatestPptExport } from "@/lib/ppt/pptMeta";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const meta = await getLatestPptExport(id);
    if (!meta) {
      return NextResponse.json({ error: "생성된 PPT가 없습니다." }, { status: 404 });
    }

    const buffer = await readPptxBuffer(meta.storagePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(meta.fileName)}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "파일 로드 실패" },
      { status: 500 },
    );
  }
}
