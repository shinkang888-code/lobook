import { NextResponse } from "next/server";
import { adviseBookArchitecture } from "@/lib/architecture/bookArchitectureAdvisor";
import { getBookStructure } from "@/lib/chapterService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }
    const report = adviseBookArchitecture(structure);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "아키텍처 진단 실패" },
      { status: 500 },
    );
  }
}
