import { NextResponse } from "next/server";
import { analyzeHancomDocument } from "@/lib/hancom/hancomToolkitService";
import { readImportBufferAsArrayBuffer } from "@/lib/import/importBuffer";
import { getLatestHwpImport } from "@/lib/import/importMeta";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: bookId } = await params;
    const contentType = request.headers.get("content-type") ?? "";

    let buffer: ArrayBuffer;
    let fileName: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "file 필드가 필요합니다." }, { status: 400 });
      }
      buffer = await file.arrayBuffer();
      fileName = file.name;
    } else {
      const meta = await getLatestHwpImport(bookId);
      if (!meta?.storagePath) {
        return NextResponse.json({ error: "저장된 HWP/HWPX 파일이 없습니다." }, { status: 404 });
      }
      buffer = await readImportBufferAsArrayBuffer(meta.storagePath);
      fileName = meta.fileName ?? "document.hwp";
    }

    const analysis = await analyzeHancomDocument(buffer, fileName);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문서 분석 실패" },
      { status: 500 },
    );
  }
}
