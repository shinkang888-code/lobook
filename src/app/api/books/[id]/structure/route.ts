import { NextResponse } from "next/server";
import { getBookStructure, saveBookStructure } from "@/lib/chapterService";
import type { SaveStructureInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ structure });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "구조 조회 실패" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as SaveStructureInput;
    const structure = await saveBookStructure(id, body);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ structure });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장 실패" },
      { status: 500 },
    );
  }
}
