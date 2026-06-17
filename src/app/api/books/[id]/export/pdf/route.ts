import { NextResponse } from "next/server";
import { getBookStructure } from "@/lib/chapterService";
import { buildPrintableHtml } from "@/lib/export/docxExport";

type Params = { params: Promise<{ id: string }> };

/** PDF 인쇄용 HTML (브라우저 → PDF 저장) */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }

    const html = buildPrintableHtml(structure);
    const filename = `${structure.book.title.replace(/[^\w\s가-힣-]/g, "").trim() || "book"}-print.html`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF(인쇄) 내보내기 실패" },
      { status: 500 },
    );
  }
}
