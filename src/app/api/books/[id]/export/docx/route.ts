import { NextResponse } from "next/server";
import { getBookStructure } from "@/lib/chapterService";
import { buildDocxBuffer } from "@/lib/export/docxExport";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }

    const buffer = await buildDocxBuffer(structure);
    const filename = `${structure.book.title.replace(/[^\w\s가-힣-]/g, "").trim() || "book"}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DOCX 내보내기 실패" },
      { status: 500 },
    );
  }
}
