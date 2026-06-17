import { NextResponse } from "next/server";
import { getBookStructure } from "@/lib/chapterService";
import { buildEpubBufferV2, chaptersToEpubInput } from "@/lib/export/epub/buildEpub";
import { DEFAULT_PAGE_SPEC } from "@/lib/editor/pageSpec";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }

    const { book, chapters } = structure;
    const pageSpec = book.page_spec ?? DEFAULT_PAGE_SPEC;
    const epubChapters = chaptersToEpubInput(chapters);

    if (epubChapters.length === 0) {
      epubChapters.push({
        id: "chapter1",
        title: book.title,
        html: book.content_html || `<p>${book.content_md.replace(/\n/g, "<br/>")}</p>`,
      });
    }

    const buffer = await buildEpubBufferV2({
      title: book.title,
      author: book.author,
      chapters: epubChapters,
      pageSpec,
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
