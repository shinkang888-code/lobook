import { NextResponse } from "next/server";
import { getLatestPptExport } from "@/lib/ppt/pptMeta";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const meta = await getLatestPptExport(id);
    if (!meta) {
      return NextResponse.json({ error: "생성된 PPT가 없습니다." }, { status: 404 });
    }
    return NextResponse.json(meta);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회 실패" },
      { status: 500 },
    );
  }
}
