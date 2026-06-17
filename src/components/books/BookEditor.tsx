"use client";

import { BookEditorShell } from "@/components/editor/shell/BookEditorShell";
import type { Book } from "@/lib/types";

type BookEditorProps = {
  book: Book;
};

export function BookEditor({ book }: BookEditorProps) {
  return <BookEditorShell book={book} />;
}
