import { NextResponse } from "next/server";
import { deleteBook, getBook, updateBook } from "@/lib/bookService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const book = await getBook(id);
    if (!book) return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ book });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회 실패" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const book = await updateBook(id, body);
    if (!book) return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ book });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "수정 실패" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteBook(id);
    if (!ok) return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
