import type { PageSlice, TocNode } from "./types";

function slugify(text: string, index: number): string {
  return `h-${index}-${text.slice(0, 20).replace(/\s+/g, "-")}`;
}

export function buildTocFromMarkdown(markdown: string): TocNode[] {
  const lines = markdown.split("\n");
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];
  let headingIndex = 0;

  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length;
    const title = match[2].trim();
    const node: TocNode = {
      id: slugify(title, headingIndex++),
      title,
      level,
      pageIndex: 0,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }

  return roots;
}

export function splitMarkdownToPages(markdown: string): PageSlice[] {
  const parts = markdown.split(/\n---+\n/);
  if (parts.length <= 1) {
    return [
      {
        id: "page-1",
        pageNumber: 1,
        content_md: markdown,
        content_html: "",
      },
    ];
  }

  return parts.map((part, i) => ({
    id: `page-${i + 1}`,
    pageNumber: i + 1,
    title: part.match(/^#\s+(.+)/m)?.[1],
    content_md: part.trim(),
    content_html: "",
  }));
}

export function flattenToc(nodes: TocNode[]): TocNode[] {
  const result: TocNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenToc(node.children));
  }
  return result;
}
