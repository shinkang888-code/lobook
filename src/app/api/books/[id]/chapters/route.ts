import { NextResponse } from "next/server";
import { addChapter } from "@/lib/chapterService";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { title?: string };
    const chapter = await addChapter(id, body.title?.trim() || "새 챕터");
    if (!chapter) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ chapter });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "챕터 추가 실패" },
      { status: 500 },
    );
  }
}
