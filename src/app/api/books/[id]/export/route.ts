import { NextResponse } from "next/server";
import { getBook } from "@/lib/bookService";
import { buildEpubBuffer } from "@/lib/epubExport";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const book = await getBook(id);
    if (!book) return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });

    const html = book.content_html || `<p>${book.content_md.replace(/\n/g, "<br/>")}</p>`;
    const buffer = await buildEpubBuffer({
      title: book.title,
      author: book.author,
      html,
    });

    const filename = `${book.title.replace(/[^\w\s가-힣-]/g, "").trim() || "book"}.epub`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EPUB 내보내기 실패" },
      { status: 500 },
    );
  }
}
