import type { PageSpec } from "@/lib/editor/types";

export type BookStatus = "draft" | "published";

export type PrimarySource = "markdown" | "html" | "word" | "hwp";

export interface Book {
  id: string;
  title: string;
  author: string;
  content_md: string;
  content_html: string;
  status: BookStatus;
  page_spec?: PageSpec;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  sort_order: number;
  content_md: string;
  content_html: string;
  primary_source: PrimarySource;
  page_spec_override?: PageSpec | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  chapter_id: string;
  page_number: number;
  title?: string | null;
  content_html: string;
  thumbnail_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookStructure {
  book: Book;
  chapters: Chapter[];
  pages: Record<string, Page[]>;
}

export interface CreateBookInput {
  title: string;
  author?: string;
  content_md?: string;
  content_html?: string;
  status?: BookStatus;
  page_spec?: PageSpec;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  content_md?: string;
  content_html?: string;
  status?: BookStatus;
  page_spec?: PageSpec;
}

export interface UpdateChapterInput {
  title?: string;
  content_md?: string;
  content_html?: string;
  primary_source?: PrimarySource;
  sort_order?: number;
  page_spec_override?: PageSpec | null;
}

export interface SaveStructureInput {
  title?: string;
  author?: string;
  status?: BookStatus;
  page_spec?: PageSpec;
  chapters: Array<{
    id?: string;
    title: string;
    sort_order: number;
    content_md: string;
    content_html: string;
    primary_source?: PrimarySource;
    pages?: Array<{ page_number: number; title?: string; content_html: string }>;
  }>;
}
