export type BookStatus = "draft" | "published";

export interface Book {
  id: string;
  title: string;
  author: string;
  content_md: string;
  content_html: string;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateBookInput {
  title: string;
  author?: string;
  content_md?: string;
  content_html?: string;
  status?: BookStatus;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  content_md?: string;
  content_html?: string;
  status?: BookStatus;
}
