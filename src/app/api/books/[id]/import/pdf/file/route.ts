import { NextResponse } from "next/server";
import { readImportBufferAsArrayBuffer } from "@/lib/import/importBuffer";
import { getLatestPdfImport } from "@/lib/import/importMeta";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const meta = await getLatestPdfImport(id);
    if (!meta) {
      return NextResponse.json({ error: "저장된 PDF가 없습니다." }, { status: 404 });
    }

    const buffer = await readImportBufferAsArrayBuffer(meta.storagePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(meta.fileName)}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "파일 로드 실패" },
      { status: 500 },
    );
  }
}
