import { getBookStructure } from "@/lib/chapterService";

export type BookCoworkContext = {
  bookId: string;
  title: string;
  author: string;
  chapterCount: number;
  markdown: string;
  summary: string;
};

export async function buildBookCoworkContext(bookId: string): Promise<BookCoworkContext> {
  const structure = await getBookStructure(bookId);
  if (!structure) throw new Error("책을 찾을 수 없습니다.");

  const markdown = structure.chapters
    .map((c, i) => `## ${i + 1}. ${c.title}\n\n${c.content_md}`)
    .join("\n\n");

  const summary = structure.chapters
    .slice(0, 5)
    .map((c) => `- ${c.title}`)
    .join("\n");

  return {
    bookId,
    title: structure.book.title,
    author: structure.book.author,
    chapterCount: structure.chapters.length,
    markdown,
    summary: `《${structure.book.title}》 — ${structure.chapters.length}개 챕터\n${summary}`,
  };
}

export function formatContextForPrompt(ctx: BookCoworkContext, userPrompt: string): string {
  return `【LoBooK 컨텍스트】
제목: ${ctx.title}
저자: ${ctx.author}
챕터: ${ctx.chapterCount}개

【사용자 요청】
${userPrompt}

【원고 (마크다운)】
${ctx.markdown.slice(0, 10000)}`;
}
