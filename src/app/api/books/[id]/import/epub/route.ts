import { NextResponse } from "next/server";
import { importEpubToBook } from "@/lib/import/importService";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    const mode = (form.get("mode") as string) === "append" ? "append" : "replace";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드가 필요합니다." }, { status: 400 });
    }
    if (!file.name.match(/\.epub$/i)) {
      return NextResponse.json({ error: "EPUB 파일만 지원합니다." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const structure = await importEpubToBook(id, buffer, file.name, mode);
    return NextResponse.json({
      structure,
      imported: structure?.chapters.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EPUB 가져오기 실패" },
      { status: 500 },
    );
  }
}
