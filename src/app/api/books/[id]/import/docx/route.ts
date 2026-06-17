import { NextResponse } from "next/server";
import { importDocxToBook } from "@/lib/import/importService";

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
    if (!file.name.match(/\.docx$/i)) {
      return NextResponse.json({ error: "DOCX 파일만 지원합니다." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const structure = await importDocxToBook(id, buffer, file.name, mode);
    return NextResponse.json({ structure, imported: 1 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DOCX 가져오기 실패" },
      { status: 500 },
    );
  }
}
