"use client";

import { BookEditorShell } from "@/components/editor/shell/BookEditorShell";
import { EditorScrollMode } from "@/components/editor/shell/EditorScrollMode";
import type { Book } from "@/lib/types";

type BookEditorProps = {
  book: Book;
};

export function BookEditor({ book }: BookEditorProps) {
  return (
    <>
      <EditorScrollMode />
      <BookEditorShell book={book} />
    </>
  );
}
