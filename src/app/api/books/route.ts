import { NextResponse } from "next/server";
import { createBook, listBooks } from "@/lib/bookService";
import { getStorageLabel } from "@/lib/dbMode";

export async function GET() {
  try {
    const books = await listBooks();
    return NextResponse.json({ books, storage: getStorageLabel() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "목록 조회 실패" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const book = await createBook({
      title: body.title,
      author: body.author,
      content_md: body.content_md,
      content_html: body.content_html,
      status: body.status,
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "생성 실패" },
      { status: 500 },
    );
  }
}
