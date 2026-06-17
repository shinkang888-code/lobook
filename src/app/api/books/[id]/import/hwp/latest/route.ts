import { NextResponse } from "next/server";
import { getLatestHwpImport } from "@/lib/import/importMeta";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const meta = await getLatestHwpImport(id);
    if (!meta) {
      return NextResponse.json({ error: "저장된 HWP가 없습니다." }, { status: 404 });
    }
    return NextResponse.json(meta);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회 실패" },
      { status: 500 },
    );
  }
}
