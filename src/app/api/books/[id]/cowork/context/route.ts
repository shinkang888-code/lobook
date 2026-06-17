import { NextResponse } from "next/server";
import { buildBookCoworkContext } from "@/lib/aionui/bookContext";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ctx = await buildBookCoworkContext(id);
    return NextResponse.json(ctx);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "컨텍스트 로드 실패" },
      { status: 500 },
    );
  }
}
