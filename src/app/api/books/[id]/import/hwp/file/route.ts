import { NextResponse } from "next/server";
import { extractHwpBufferFromPath } from "@/lib/import/hwpImporter";
import { getLatestHwpImport } from "@/lib/import/importMeta";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const meta = await getLatestHwpImport(id);
    if (!meta) {
      return NextResponse.json({ error: "저장된 HWP가 없습니다." }, { status: 404 });
    }

    const buffer = await extractHwpBufferFromPath(meta.storagePath);
    const ext = meta.fileName.split(".").pop()?.toLowerCase() ?? "hwp";
    const mime =
      ext === "hwpx"
        ? "application/vnd.hancom.hwpx"
        : "application/x-hwp";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
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
